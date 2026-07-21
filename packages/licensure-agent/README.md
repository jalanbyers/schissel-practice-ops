# licensure-agent

> ## ⚠️ Synthetic data only — not cleared for production traffic
>
> The repository root `CLAUDE.md` sets a PHI boundary:
>
> > *"anything touching contract PDFs, license documents, billing records, or the
> > practice RAG store must stay on a local model. Do not route PHI-touching tasks
> > to the cloud agent."*
>
> This agent targets Cloud Run — it **is** the cloud agent that rule names. It is
> therefore restricted to synthetic data for the capstone build:
>
> - Data-access tools validate the `SYN-` record prefix and **raise** on anything
>   else. They do not warn and do not proceed.
> - It never reads contract PDFs, license document scans, billing records, or the
>   practice RAG store — only structured synthetic state/license rows.
>
> **This is an open risk, deliberately deferred, not a solved problem.** Clearing
> this agent for real data requires either running it on a local model or
> narrowing the boundary in `CLAUDE.md`. Neither decision has been made.
>
> See `docs/DESIGN_SPEC.md` §2.

**Purpose:** analyze a telemedicine contract's required states against a
physician's license records and produce source-grounded status classifications
as a *draft pending physician approval*. It does not give legal advice, submit
applications, contact boards, claim practice authorization, or post to the
dashboard.

**Acceptance criterion:** `R-AMBIG-01` (`tests/eval/r_ambig_01.py`) — the agent
must catch the Ohio record's self-contradiction from the language alone, with a
verbatim quoted span. See `docs/DESIGN_SPEC.md` §10.

Agent generated with `agents-cli` version `1.1.0`

## Project Structure

```
licensure-agent/
├── app/         # Core agent code
│   ├── agent.py               # Main agent logic
│   ├── fast_api_app.py        # FastAPI Backend server
│   └── app_utils/             # App utilities and helpers
├── tests/                     # Unit, integration, and load tests
├── GEMINI.md                  # AI-assisted development guide
└── pyproject.toml             # Project dependencies
```

> 💡 **Tip:** Use [Antigravity CLI](https://antigravity.google/) for AI-assisted development - project context is pre-configured in `GEMINI.md`.

## Requirements

Before you begin, ensure you have:
- **uv**: Python package manager (used for all dependency management in this project) - [Install](https://docs.astral.sh/uv/getting-started/installation/) ([add packages](https://docs.astral.sh/uv/concepts/dependencies/) with `uv add <package>`)
- **agents-cli**: Agents CLI - Install with `uv tool install google-agents-cli`
- **Google Cloud SDK**: For GCP services - [Install](https://cloud.google.com/sdk/docs/install)


## Quick Start

Install `agents-cli` and its skills if not already installed:

```bash
uvx google-agents-cli setup
```

Install required packages:

```bash
agents-cli install
```

Test the agent with a local web server:

```bash
agents-cli playground
```

You can also use features from the [ADK](https://adk.dev/) CLI with `uv run adk`.

## Commands

| Command              | Description                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `agents-cli install` | Install dependencies using uv                                                         |
| `agents-cli playground` | Launch local development environment                                                  |
| `agents-cli lint`    | Run code quality checks                                                               |
| `agents-cli eval`    | Evaluate agent behavior (generate, grade, analyze, and more — see `agents-cli eval --help`) |
| `uv run pytest tests/unit tests/integration` | Run unit and integration tests                                                        |
| `agents-cli deploy`  | Deploy agent to Cloud Run                                                                   || [A2A Inspector](https://github.com/a2aproject/a2a-inspector) | Launch A2A Protocol Inspector                                                        |

## 🛠️ Project Management

| Command | What It Does |
|---------|--------------|
| `agents-cli scaffold enhance` | Add CI/CD pipelines and Terraform infrastructure |
| `agents-cli infra cicd` | One-command setup of entire CI/CD pipeline + infrastructure |
| `agents-cli scaffold upgrade` | Auto-upgrade to latest version while preserving customizations |

---

## Development

Edit your agent logic in `app/agent.py` and test with `agents-cli playground` - it auto-reloads on save.

## Deployment

```bash
gcloud config set project <your-project-id>
agents-cli deploy
```

To add CI/CD and Terraform, run `agents-cli scaffold enhance`.
To set up your production infrastructure, run `agents-cli infra cicd`.

## Observability

Built-in telemetry exports to Cloud Trace, BigQuery, and Cloud Logging.

## A2A Inspector

This agent supports the [A2A Protocol](https://a2a-protocol.org/). Use the [A2A Inspector](https://github.com/a2aproject/a2a-inspector) to test interoperability.
See the [A2A Inspector docs](https://github.com/a2aproject/a2a-inspector) for details.
