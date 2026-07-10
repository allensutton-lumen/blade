# BLADE Agent Instructions

BLADE (Blueprint for Lumen AI-Driven Engineering) is the standard template for Lumen AI-built apps. Treat this repo as a production-ready framework, not a toy starter.

---

## Agent behavior standards

These rules govern how you interact with the developer throughout the session. They are not optional.

### Be honest, not agreeable

Your job is to give the developer the best outcome — not to make them feel good about every decision. Specifically:

- **If the developer proposes something that introduces risk, technical debt, or violates a BLADE standard, say so clearly before doing it.** Explain the tradeoff in one or two sentences. Then ask if they want to proceed anyway. Do not silently comply.
- **If you disagree with a direction, say so once and clearly.** After that, respect the developer's decision — they own the codebase. But do not pretend you agreed; a brief note like "proceeding as requested, though I'd recommend X later" is appropriate.
- **Do not add features or complexity simply because a user asked.** Evaluate whether the request is actually needed, and raise concerns if it adds unnecessary surface area, cost, or maintenance burden.
- **Do not validate bad ideas with faint praise.** If something is a poor approach, say it's a poor approach and explain why. Suggesting "we could do it that way, or..." without stating your actual recommendation is not helpful.
- **Flag technical debt when you're asked to create it.** If asked to hardcode a value, skip validation, bypass a test, or take a shortcut, name the debt explicitly: "This works for now but creates X risk. I'd recommend opening a `chore/` ticket for it."
- **Correct misunderstandings about the stack or BLADE standards.** If the developer states something incorrect about how the system works, gently correct it rather than building on a false premise.

### What "yes" should mean

"Yes" means: I've evaluated this, it's the right approach, let's do it. Not: I'll do whatever you say to avoid friction. If you find yourself agreeing with everything in a session, that's a signal to recalibrate.

---

## Branching strategy

BLADE apps follow a promotion-based branching model:

```
feat/* or fix/* or chore/*
        ↓  PR + CI
       dev          ← active integration branch; all feature work lands here first
        ↓  PR + CI
      prod          ← pre-production; mirrors what is staged for release
        ↓  PR + CI
      main          ← production-stable; only receives merges from prod
```

**Rules:**
- Never commit directly to `dev`, `prod`, or `main`.
- Feature, fix, and chore branches always target `dev` as their base and merge destination.
- `dev → prod` and `prod → main` promotions happen via PR after CI passes.
- Hotfixes that must skip `dev` (rare) should still go through a `fix/` branch → `prod` → backmerge to `dev`.

**Branch naming conventions:**
| Prefix | When to use | Example |
|--------|-------------|---------|
| `feat/` | New functionality | `feat/add-export-button` |
| `fix/` | Bug fixes | `fix/auth-token-refresh` |
| `chore/` | Non-functional changes (deps, docs, CI) | `chore/upgrade-node-22` |

---

## At the start of every development session

### BLADE standards refresh

Before anything else, pull the latest BLADE agent instructions from the canonical repo and update the local copy if it has changed:

```bash
gh api repos/LumenTech-Prod/blade/contents/.blade/AGENT_INSTRUCTIONS.md \
  --jq '.content' | base64 --decode > /tmp/blade_instructions_latest.md 2>/dev/null \
  || gh api repos/allensutton-lumen/blade/contents/.blade/AGENT_INSTRUCTIONS.md \
       --jq '.content' | base64 --decode > /tmp/blade_instructions_latest.md 2>/dev/null
```

- If the fetch succeeds and `/tmp/blade_instructions_latest.md` differs from `.blade/AGENT_INSTRUCTIONS.md` in the current repo:
  - Overwrite the local copy: `cp /tmp/blade_instructions_latest.md .blade/AGENT_INSTRUCTIONS.md`
  - **Tell the user:** "📋 BLADE standards updated — I pulled the latest `.blade/AGENT_INSTRUCTIONS.md` from the central repo. Continuing with the updated instructions."
  - Re-read the updated file before proceeding — the rest of this session uses the new version.
  - Do **not** commit this update automatically; the user can decide whether to commit it as a `chore/sync-blade-instructions` commit.
- If the local copy is already current, say nothing — no noise.
- If the fetch fails (no network, no permissions), proceed with the local copy and note: "⚠️ Could not reach LumenTech-Prod/blade to check for BLADE updates — using local copy."

**Why this matters:** BLADE is a living standard. New security requirements, branching rules, and QA criteria are added over time. Refreshing at session start ensures every session runs against the current baseline without the developer having to manually pull framework updates into each app.

### Branch check

After the BLADE refresh, check the current git branch:

```bash
git branch --show-current
```

- If the branch is **`main`, `prod`, `dev`** (or `master`/`develop`) → ask the user what branch they want to work on. Suggest a name based on the task description following the conventions above (e.g., `feat/add-export-button`). Create and switch to it before writing any code.
- If the branch is already a **`feat/`/`fix/`/`chore/` branch** → confirm the name with the user ("I see we're on `fix/some-thing` — continuing work here. Is that right?") and proceed once confirmed.
- When creating a new branch, always base it off `dev` (not `main`): `git checkout dev && git pull && git checkout -b feat/your-feature`.

**Why this matters:** Commits made directly to `dev`, `prod`, or `main` bypass CI gates, skip code review, and can break deployments. A wrong branch is much harder to fix after the fact.

### Security alert check

After confirming the branch, check for open GitHub security alerts and report any findings to the user **before** starting work:

```bash
# Dependabot vulnerability alerts
gh api repos/{owner}/{repo}/vulnerability-alerts 2>/dev/null \
  && gh dependabot alerts list --state open --json number,severity,summary,packageName 2>/dev/null \
  || echo "Dependabot alerts not available (may need GitHub Advanced Security)"

# Secret scanning alerts
gh secret-scanning list --state open 2>/dev/null || true

# Code scanning alerts
gh code-scanning list --state open 2>/dev/null || true
```

If **any** alerts are open:
- List them to the user grouped by severity (critical → high → medium → low).
- For **critical or high** severity: ask the user whether to address them before starting the planned work. Do not silently skip them.
- For **medium or low**: mention them but do not block — continue with the planned work and note that a `fix/security-deps` branch should be opened soon.
- If the `gh` CLI returns permission errors, note that GitHub Advanced Security may not be enabled and remind the user to check the **Security** tab in the repo settings.

---

## Before writing any code

### 1. Read `TECHNICAL_DECISIONS.md`
If it already has content, understand every decision made so far. If it is empty, the tech stack discussion has not happened yet — do not skip it.

### 2. Conduct the tech stack discussion with the developer
This is a **real conversation**, not a formality. The following are BLADE recommended defaults with rationale, but every one of them is negotiable. Present the options, understand the app needs, then decide together.

| Area | BLADE default | When to deviate |
|------|--------------|-----------------|
| **Frontend** | React 19 + Vite + TypeScript | No frontend if pure API/CLI tool; plain HTML/JS for ultra-simple single-page dashboards with no auth requirement |
| **Backend** | Node/Express + TypeScript | Python/FastAPI if heavy ML/data science; no backend if static + direct AWS calls |
| **Auth** | Azure AD MSAL + JWKS | API key only for machine-to-machine; no auth for fully internal tools with network-level protection |
| **Data storage** | No DB by default — add what fits | DynamoDB for serverless/scalable key-value; SQLite for read-heavy dashboards with periodic ETL (mount on EFS for Lambda persistence); PostgreSQL/RDS for complex relational queries; no DB if data lives entirely in external systems |
| **Infrastructure** | Lambda + ALB + Terraform | ECS/Fargate for long-running processes; App Runner for simpler container deploys |
| **WAF** | Optional (disabled by default) | Enable for public-facing apps or apps handling sensitive data |
| **Cloud provider** | AWS | All BLADE Terraform targets AWS. If Azure or GCP is required, the Terraform modules will need to be adapted — note this as a deviation in TECHNICAL_DECISIONS.md. |
| **CI/CD** | GitHub Actions + OIDC | Jenkins if org policy requires it |

Questions to ask during the discussion:
- What does this app actually do? (understand the domain first)
- Who uses it? (internal SRE team, all of NaaS, external?)
- What data does it read/write? Does it need persistence at all?
- Which Lumen systems does it integrate with? (ServiceNow, AppDynamics, SASI, Splunk, Bedrock, SharePoint, etc.)
- What AWS account(s) does it deploy to?
- Does it need AI/Bedrock capabilities?
- Is there existing infrastructure it must share (ALB, VPC, etc.)?
- What is the expected traffic volume?

### 3. Confirm the app name before writing any code
The app name drives Terraform resource names, the domain (`<app-name>.<env>.ld.lumen.com`), and Secrets Manager paths (`ld-sre-<app-name>/*`). Changing it later is painful.

### 4. Document all decisions in `TECHNICAL_DECISIONS.md`
Every decision made in the discussion goes into `TECHNICAL_DECISIONS.md` — including decisions to deviate from BLADE defaults, and why. Write it before implementation begins.

---

## During development

- Always use `backend/src/utils/logger.ts` — never `console.log` in backend production code.
- Reuse middleware patterns in `backend/src/middleware/` — do not reinvent auth, logging, or rate limiting.
- Every new service must have unit tests with all external calls mocked.
- Every POST/PUT endpoint must use `express-validator` + `handleValidationErrors`.
- Run `npm run lint && npm test` in both `frontend/` and `backend/` before every commit.
- Run `npx tsc --noEmit` in both `frontend/` and `backend/` before merging.
- Clean up dead code: no commented-out blocks, no unused imports, no unexplained `any`.

### Keeping documentation current

Documentation that is out of date is treated as a bug, not a nice-to-have. Update the relevant file **in the same commit as the code change** — not as a follow-up.

| File | Update when... |
|------|---------------|
| `README.md` | Setup steps, run commands, architecture, env vars, or the deployment model change |
| `ONBOARDING.md` | A new engineer would get stuck following the current version — add the missing step |
| `DEPLOYMENT.md` | Any Terraform resource, deploy script, or environment configuration changes |
| `SECURITY.md` | The auth model, secrets approach, CORS config, security headers, or IAM posture changes |
| `TECHNICAL_DECISIONS.md` | Any architectural decision is made or revisited — write it **before** implementation begins, not after |
| `RELEASE.md` | Every PR — add a one-line changelog entry under the current version heading |
| `.blade/AGENT_INSTRUCTIONS.md` | Do **not** modify this directly in an app repo. Changes to the standard belong in `LumenTech-Prod/blade` and propagate to apps via the session-start refresh. |

If a change affects multiple docs, update all of them. Partial doc updates are worse than none — they create contradictions.

---

## Never

- Hardcode secrets, URLs, tenant IDs, or AWS account IDs in source code.
- Use `console.log` in backend production code — use the structured logger.
- Skip input validation on any POST/PUT endpoint.
- Commit with failing lint or tests.
- Touch real external systems in automated tests — mock everything external.
- Send real notifications, create real tickets, or trigger real alerts in tests.
- Commit sensitive data (credentials, tokens, PII) — use `.env` files and Secrets Manager.

---

## Lumen-specific patterns

- **Azure AD auth:** use `middleware/auth.ts` + `middleware/authorize.ts` — do not roll your own JWKS validation.
- **Secrets:** use AWS Secrets Manager via `utils/secrets.ts` — no hardcoded credentials.
- **Domain naming:** `<app-name>.<env>.ld.lumen.com`
- **AWS accounts:** dev=`396304931560`, prod=`111491017663` (document in `.env.example` but confirm with team — may vary).
- **Branding:** Chi design system from `https://assets.ctl.io/chi/6.1.0/chi.css` + Lumen CSS vars in `frontend/src/index.css`.
- **Security headers:** Helmet is already configured — do not remove it.
- **Rate limiting:** `standardLimiter` and `strictLimiter` are already wired — apply `strictLimiter` to any write endpoints.

---

## Security evaluation

Run a security evaluation at two trigger points:
1. **Before opening a PR to `prod` or `main`** — run the checklist below and report results.
2. **When asked by the developer** — run on demand at any time.

The standard below is derived from the Lumen SRE app security baseline (established in `ld-wave-path-studio`).

### Checklist

**Authentication and authorization**
- [ ] All `/api/*` endpoints require a valid JWT except documented health/readiness endpoints.
- [ ] Ownership is enforced for every read/update/delete on user-scoped data (explicit 404 before delete/update, not just relying on composite key matching).
- [ ] `SKIP_AUTH=true` is blocked in Lambda (env var `AWS_LAMBDA_FUNCTION_NAME` set → skip auth never takes effect).
- [ ] Role/claims extraction is validated before granting access.

**Secrets and configuration**
- [ ] No secrets, tenant IDs, account IDs, or API keys are hardcoded in source code or committed to the repo.
- [ ] `.env.example` contains only placeholder strings — no real values.
- [ ] Runtime secrets come from AWS Secrets Manager, not environment variables baked into the Lambda package.
- [ ] `VITE_*` env vars are build-time and client-visible — confirm none contain sensitive values.

**Input validation**
- [ ] Every POST/PUT endpoint validates the request body with a schema (express-validator for Node; Pydantic for Python).
- [ ] Invalid payloads return HTTP 422 with a structured, client-safe error — never raw stack traces.
- [ ] Frontend sanitizes any user-provided content before rendering HTML-like output.
- [ ] External API responses (Bedrock, third-party APIs) are validated before being used — do not trust upstream output blindly.

**Transport and headers**
- [ ] All traffic is HTTPS; HTTP → HTTPS redirect is enforced at the ALB.
- [ ] `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` are present on every response.
- [ ] `Strict-Transport-Security` (HSTS) is set either in middleware or at the ALB.
- [ ] CORS is fail-closed: only explicitly allowlisted origins are accepted. No wildcard `*` in production.

**Logging and observability**
- [ ] Structured JSON logs on every request — no `console.log` in production backend code.
- [ ] A correlation/request ID is generated per request and included in all log lines and downstream calls.
- [ ] Credentials, tokens, authorization headers, and raw PII are never logged.
- [ ] User-provided free text is sanitized before logging (prevent log injection).
- [ ] Unhandled exceptions return a generic `500` to the client; the full stack trace is logged server-side only.

**Infrastructure and CI/CD**
- [ ] GitHub Actions uses OIDC role assumption — no long-lived static AWS credentials stored as secrets.
- [ ] IAM roles follow least-privilege: only the specific actions and resource ARNs needed are granted.
- [ ] Dependabot is configured (`.github/dependabot.yml`) with weekly updates for all package ecosystems used.
- [ ] `npm audit --audit-level=high --omit=dev` (or `pip-audit`) runs in CI and blocks on high/critical findings.
- [ ] WAF is enabled in Terraform for any public-facing app or app handling sensitive data.

**External dependency resilience**
- [ ] All external calls (AWS services, third-party APIs) have explicit timeouts.
- [ ] Retry/backoff logic distinguishes retryable (502/503/429) from non-retryable (400/401/403) failures.
- [ ] The `/health` endpoint checks dependencies and returns `degraded` status without exposing internal error details.

### Reporting

After running the checklist, report results as:
- ✅ **Pass** — item confirmed
- ⚠️ **Gap** — item not implemented; include the file and a one-line fix suggestion
- ➖ **N/A** — item does not apply to this app (explain why)

If **3 or more gaps** are found, ask the user whether to address them now (opening a `fix/security-hardening` branch) or defer to a dedicated security sprint.

---

## QA self-assessment

When asked to evaluate code quality, or before any major release, score the app against the following rubric (based on the Lumen SRE app quality standard):

| Category | Weight | What to look for |
|----------|--------|-----------------|
| **Architecture** | 15% | Separation of concerns, hook/service extraction, no monolithic files, correlation middleware |
| **Code quality** | 15% | No dead code, no commented-out blocks, no unexplained `any`, singletons for expensive clients, no cross-module private imports |
| **Testing** | 20% | Unit tests for all service/util modules with mocked externals; frontend component/hook tests; ≥80% coverage on business logic |
| **Security** | 15% | All items in the security checklist above pass |
| **Performance** | 10% | No synchronous calls in async contexts, module-level singletons, no per-request client construction |
| **Dependencies** | 5% | Dependabot enabled, no known high/critical CVEs in production deps, type-only packages in devDependencies |
| **Documentation** | 10% | README accurate, ONBOARDING enables 30-min setup, SECURITY.md current, RELEASE.md has changelog |
| **Error handling** | 10% | All exceptions logged with context, no silent swallowing, structured client-safe error responses |

Score each category 0–100 and compute a weighted total. Report the weighted score and grade (A+ ≥ 95, A ≥ 90, B+ ≥ 77, B ≥ 70, below 70 = needs work). For any category below 80, list the top 2–3 specific gaps with suggested fixes.
