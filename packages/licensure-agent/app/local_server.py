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
import os
import re

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from google.adk.runners import InMemoryRunner
from google.genai import types
from pydantic import BaseModel, Field

from app.agent import root_agent

load_dotenv()
logger = logging.getLogger(__name__)

app = FastAPI(title="licensure-agent (local)")

# The public demo page is static — GitHub Pages serves HTML and nothing else —
# so a tester's key travels from their browser straight to this service and
# touches no host in between. That only works if this service says the page's
# origin may call it.
#
# An explicit allowlist rather than "*": the caller pays for their own model
# usage, but the compute for every request is ours, so an open endpoint is a
# standing invitation to spend someone else's money. Set DEMO_ALLOWED_ORIGINS
# to a comma-separated list to widen it.
_DEFAULT_ORIGINS = "http://localhost:8899,http://127.0.0.1:8899,http://localhost:3000"
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get("DEMO_ALLOWED_ORIGINS", _DEFAULT_ORIGINS).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    # No cookies or auth headers are involved — the key rides in the request
    # body — so credentials stay off and the browser never attaches ambient
    # identity to a cross-origin call.
    allow_credentials=False,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["content-type"],
    max_age=3600,
)


class AnalyzeRequest(BaseModel):
    contract_id: str = Field(description="Synthetic contract identifier.")
    states: list[str] = Field(description="Required states, as written in the contract.")
    planned_care_date: str = Field(description="ISO date of planned first patient care.")
    api_key: str | None = Field(
        default=None,
        repr=False,
        description=(
            "Optional caller-supplied Gemini key, so a prototype tester can run the "
            "agent on their own credential. Held for the duration of the request and "
            "never logged, persisted, or echoed back. Omit to use the server's key."
        ),
    )

    def __str__(self) -> str:  # pragma: no cover - defensive
        """Never render the key, whatever logs this."""
        return (
            f"AnalyzeRequest(contract_id={self.contract_id!r}, states={self.states!r}, "
            f"planned_care_date={self.planned_care_date!r}, "
            f"api_key={'<supplied>' if self.api_key else None})"
        )

    __repr__ = __str__


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
    from app.agent import build_agent, normalize_contract_states

    normalized = normalize_contract_states(request.states)

    # With no key this is the shared root_agent on the server credential. With
    # one it is a fresh agent holding that key on its model instance and
    # nowhere else, so the gather below cannot cross one caller's key with
    # another's. Same instruction, same tools, same output boundary either way.
    runner = InMemoryRunner(agent=build_agent(request.api_key), app_name="app")

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
