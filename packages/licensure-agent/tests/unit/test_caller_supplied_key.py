"""A prototype tester can run the agent on their own key, safely.

The risk this guards is not "does the key work" — it is that a credential
supplied by one caller could be used for another caller's request. That is a
live concern because `local_server.analyze` fans a contract's states out with
`asyncio.gather`, so anything stored process-globally (`os.environ`, a module
singleton, a shared client) is shared across concurrent callers.

These tests are all offline. Nothing here calls the model.
"""

import asyncio
import os

from app.agent import MODEL_NAME, KeyedGemini, build_agent, root_agent
from app.local_server import AnalyzeRequest


def test_no_key_returns_the_shared_agent():
    """The default path is untouched — same object the eval suite runs."""
    assert build_agent() is root_agent
    assert build_agent(None) is root_agent
    assert build_agent("") is root_agent


def test_a_key_produces_a_distinct_agent_carrying_it():
    agent = build_agent("AIza-caller-one")
    assert agent is not root_agent
    assert isinstance(agent.model, KeyedGemini)
    assert agent.model.api_key == "AIza-caller-one"


def test_the_keyed_agent_is_not_a_relaxed_copy():
    """Same instruction, tools, and output boundary as the shared agent.

    A tester on their own key must be exercising the real agent. If this ever
    drifts, the public prototype stops being evidence for anything.
    """
    keyed = build_agent("AIza-caller-one")
    assert keyed.instruction == root_agent.instruction
    assert [t.__name__ for t in keyed.tools] == [t.__name__ for t in root_agent.tools]
    assert keyed.after_model_callback is root_agent.after_model_callback
    assert keyed.model.model == MODEL_NAME == root_agent.model.model


def test_two_callers_get_isolated_clients():
    """The property that makes concurrent BYO-key safe.

    Each model instance builds its own client, so there is no shared cache for
    a second caller's key to overwrite.
    """
    one = build_agent("AIza-caller-one")
    two = build_agent("AIza-caller-two")
    assert one.model.api_key != two.model.api_key
    assert one.model.api_client is not two.model.api_client
    assert one.model.api_client._api_client.api_key == "AIza-caller-one"
    assert two.model.api_client._api_client.api_key == "AIza-caller-two"


def test_a_supplied_key_never_reaches_the_environment():
    """The regression that would silently reintroduce cross-caller leakage."""
    before = dict(os.environ)
    build_agent("AIza-should-not-be-exported").model.api_client
    assert os.environ == before
    assert "AIza-should-not-be-exported" not in os.environ.values()


def test_isolation_holds_under_gather():
    """Concurrency is the actual failure mode, so assert it directly."""

    async def scenario():
        agents = await asyncio.gather(
            *(asyncio.to_thread(build_agent, f"AIza-caller-{i}") for i in range(8))
        )
        return [a.model.api_client._api_client.api_key for a in agents]

    assert asyncio.run(scenario()) == [f"AIza-caller-{i}" for i in range(8)]


def test_request_repr_does_not_leak_the_key():
    """Anything that logs the request must not print the credential."""
    req = AnalyzeRequest(
        contract_id="c1",
        states=["OH"],
        planned_care_date="2026-10-01",
        api_key="AIza-secret-value",
    )
    for rendered in (repr(req), str(req), f"{req}"):
        assert "AIza-secret-value" not in rendered
        assert "<supplied>" in rendered

    absent = AnalyzeRequest(contract_id="c1", states=["OH"], planned_care_date="2026-10-01")
    assert "api_key=None" in repr(absent)


def test_api_key_is_optional_and_defaults_off():
    req = AnalyzeRequest(contract_id="c1", states=["OH"], planned_care_date="2026-10-01")
    assert req.api_key is None
    assert build_agent(req.api_key) is root_agent
