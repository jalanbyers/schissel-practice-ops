"""Minimal local HTTP surface for portal integration.

Separate from `fast_api_app.py` on purpose. That module is the production
entrypoint and imports `google.auth` and Cloud Logging at module load, so it
needs GCP credentials just to start. This one needs nothing but the API key
already in `.env`, which keeps local development on the same footing as the
eval suite.

Exposes one endpoint. Fastify posts a contract's required states and gets back
one result per distinct state, each a *draft* — `approval_status` is
`pending_physician_review` because that is what the agent stamps and nothing
here can change it.

Run it with:

    uv run uvicorn app.local_server:app --port 8080

Production would replace this with the Cloud Run deployment of
`fast_api_app.py`; the Fastify side only knows a base URL.
"""

import asyncio
import json
import logging
import re

from dotenv import load_dotenv
from fastapi import FastAPI
from google.adk.runners import InMemoryRunner
from google.genai import types
from pydantic import BaseModel, Field

from app.agent import root_agent

load_dotenv()
logger = logging.getLogger(__name__)

app = FastAPI(title="licensure-agent (local)")


class AnalyzeRequest(BaseModel):
    contract_id: str = Field(description="Synthetic contract identifier.")
    states: list[str] = Field(description="Required states, as written in the contract.")
    planned_care_date: str = Field(description="ISO date of planned first patient care.")


class StateResult(BaseModel):
    state: str
    result: dict | None = None
    raw: str | None = None
    error: str | None = None


class AnalyzeResponse(BaseModel):
    contract_id: str
    planned_care_date: str
    results: list[StateResult]


def _extract_json(text: str) -> dict | None:
    """First balanced JSON object in the response.

    The agent returns its result as JSON, but a refusal comes as prose with the
    analysis after it, so the object is not always at position zero.
    """
    depth, start = 0, None
    for i, ch in enumerate(text or ""):
        if ch == "{":
            if depth == 0:
                start = i
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0 and start is not None:
                try:
                    return json.loads(text[start : i + 1])
                except json.JSONDecodeError:
                    start = None
    return None


_PROMPT = (
    "Contract {contract_id}. Planned first patient-care date: {care_date}.\n\n"
    "Analyze the licensure status for {state}.\n\n"
    "Return the result object from assign_status as a single JSON object."
)


async def _analyze_one(runner: InMemoryRunner, state: str, contract_id: str, care_date: str) -> StateResult:
    user_id = "portal"
    session = await runner.session_service.create_session(
        app_name=runner.app_name, user_id=user_id
    )
    message = types.Content(
        role="user",
        parts=[types.Part(text=_PROMPT.format(contract_id=contract_id, care_date=care_date, state=state))],
    )

    chunks: list[str] = []
    try:
        async for event in runner.run_async(
            user_id=user_id, session_id=session.id, new_message=message
        ):
            content = getattr(event, "content", None)
            for part in getattr(content, "parts", None) or []:
                text = getattr(part, "text", None)
                if text:
                    chunks.append(text)
    except Exception as exc:  # noqa: BLE001 — surfaced to the caller, not swallowed
        logger.exception("analysis failed for %s", state)
        return StateResult(state=state, error=f"{type(exc).__name__}: {exc}")

    raw = "\n".join(chunks).strip()
    return StateResult(state=state, result=_extract_json(raw), raw=raw)


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    """Analyze a contract's required states.

    Duplicates are collapsed before analysis — the contract may name a state
    twice, once by full name and once by code, and it should be reviewed once.
    """
    from app.agent import normalize_contract_states

    normalized = normalize_contract_states(request.states)
    runner = InMemoryRunner(agent=root_agent, app_name="app")

    # Analyze states concurrently rather than one after another. Each state is
    # an independent agent run with its own session, so there is nothing to
    # serialize — and sequentially, a five-state contract meant five model
    # round-trips back to back (~15s each). gather cuts a multi-state contract
    # to roughly the cost of its slowest single state.
    results = list(
        await asyncio.gather(
            *(
                _analyze_one(runner, state, request.contract_id, request.planned_care_date)
                for state in normalized["states"]
            )
        )
    )

    for unknown in normalized["unrecognized"]:
        results.append(
            StateResult(state=unknown, error="not a recognized state in the frozen dataset")
        )

    return AnalyzeResponse(
        contract_id=request.contract_id,
        planned_care_date=request.planned_care_date,
        results=results,
    )


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}
