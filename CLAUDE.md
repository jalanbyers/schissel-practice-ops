# Claude Code — Project Context

Read PLAN.md before starting work. Follow the architecture and constraints documented there, especially the PHI boundary: anything touching contract PDFs, license documents, billing records, or the practice RAG store must stay on a local model. Do not route PHI-touching tasks to the cloud agent.

Use `openclaw config set` for all OpenClaw configuration changes. Do not edit `~/.openclaw/openclaw.json` directly.
