# Deploying the public bring-your-own-key demo

Two pieces, deployed separately:

| Piece | Host | Why there |
|---|---|---|
| The page | GitHub Pages | It is static. A static host has no server, so a tester's key goes from their browser to the agent and touches nothing in between. |
| The agent | Cloud Run | It is Python and it calls a model. Pages cannot run it. |

The commands below are yours to run — they need `gcloud` signed in as you.

---

## 1 · The agent on Cloud Run

Already true on this machine, checked rather than assumed: `gcloud` is signed in
as jalanbyers@gmail.com, the project is `project-37c23864-5e32-45e3-a2b`, billing
is enabled, and `run`, `cloudbuild` and `artifactregistry` are all enabled. Skip
to the repository step.

**Create somewhere to keep the image** (once):

```bash
gcloud artifacts repositories create telecred --repository-format=docker --location=us-east1
```

**Let Cloud Build push to it.** Cloud Build now runs as the *Compute Engine
default* service account, not the legacy `@cloudbuild` one, and that account has
no Artifact Registry access by default — the image builds and then fails at the
push with `Permission 'artifactregistry.repositories.uploadArtifacts' denied`.
Granted on the repository rather than the project, so it is write access to this
one repo and nothing else:

```bash
gcloud artifacts repositories add-iam-policy-binding telecred --location=us-east1 --project=project-37c23864-5e32-45e3-a2b --member=serviceAccount:86074928442-compute@developer.gserviceaccount.com --role=roles/artifactregistry.writer
```

**Build.** From `packages/licensure-agent`:

```bash
gcloud builds submit --config cloudbuild.demo.yaml --substitutions _IMAGE=us-east1-docker.pkg.dev/project-37c23864-5e32-45e3-a2b/telecred/demo:v1
```

The explicit config exists because `gcloud run deploy --source` and `builds submit --tag`
both look for a file named exactly `Dockerfile`, and this service needs
`Dockerfile.demo`. The scaffolded `Dockerfile` runs `fast_api_app:app` — the ADK
production entrypoint, which has no `/analyze` and imports `google.auth` at module
load, so it will not serve the demo page.

**Deploy:**

```bash
gcloud run deploy telecred-demo --image us-east1-docker.pkg.dev/project-37c23864-5e32-45e3-a2b/telecred/demo:v1 --region us-east1 --allow-unauthenticated --min-instances 0 --max-instances 3 --concurrency 4 --timeout 120 --memory 1Gi --set-env-vars DEMO_ALLOWED_ORIGINS=https://jalanbyers.github.io
```

What each flag is doing, since several are load-bearing:

- **`--allow-unauthenticated`** — cohort members have no Google identity in your project.
- **No `GEMINI_API_KEY`, deliberately.** The service has no model credential of its
  own, so a public endpoint cannot be turned into a way of spending your quota. A
  request without a caller key gets a clear 400 saying so. This is verified: with no
  key in the environment and none in the request, `/analyze` returns
  *"This deployment has no model key of its own."*
- **`--min-instances 0`** — it scales to nothing when idle, so it costs nothing when
  nobody is testing. First request after idle pays a cold start.
- **`--max-instances 3`, `--concurrency 4`** — a ceiling on what anyone can make you
  spend on compute. They pay for their own model calls; the container is yours.
- **`--timeout 120`** — three states take ~17s; 120s leaves room for a cold start
  plus a slow model.
- **`DEMO_ALLOWED_ORIGINS`** — the CORS allowlist. Without your Pages origin here,
  the browser blocks the call before it leaves.

**Get the URL:**

```bash
gcloud run services describe telecred-demo --region us-east1 --format 'value(status.url)'
```

**Check it refuses to work without a caller key** — this should return 400, not 200:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$(gcloud run services describe telecred-demo --region us-east1 --format 'value(status.url)')/analyze" -H 'content-type: application/json' -d '{"contract_id":"probe","states":["CA"],"planned_care_date":"2026-10-01"}'
```

---

## 2 · The page on GitHub Pages

In the repository: **Settings → Pages → Source: GitHub Actions**. The workflow at
`.github/workflows/pages.yml` publishes `demo/` on any push to `main` that touches
it, and fails the build rather than shipping a development fixture.

Once it has run, the page is at:

```text
https://jalanbyers.github.io/schissel-practice-ops/
```

---

## 3 · Point the page at the agent

The page defaults to `http://localhost:8080` so it works for anyone who clones the
repo. To make the hosted page use the hosted agent, put the Cloud Run URL in
`demo/index.html`:

```js
var AGENT = new URLSearchParams(location.search).get('agent')
         || 'https://telecred-demo-XXXX.us-east1.run.app';
```

Keeping the query-string override means you can point a tester at a different
build without redeploying the page.

**The link you share:**

```text
https://jalanbyers.github.io/schissel-practice-ops/
```

---

## What this does *not* do

Publishing the demo does not make the practice-ops portal private. That deployment
is open because `DEMO_ALLOW_ANONYMOUS=true` is set in its hosting environment — the
middleware reads it and skips the Auth0 gate. Removing links to a URL is not access
control; unset that variable and redeploy if the portal should require a login.

---

## Cost

Cloud Run bills for container time, and this scales to zero. A tester's model calls
are billed to their key, not yours. The realistic exposure is compute during a burst
of testing, which `--max-instances 3` bounds. There is no database and nothing is
stored.
