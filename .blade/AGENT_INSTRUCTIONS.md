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
      test          ← optional; use when formal QA / UAT sign-off is required
        ↓  PR + CI  (skip if no test branch)
      prod          ← pre-production; mirrors what is staged for release
        ↓  PR + CI
      main          ← canonical copy of the codebase; production-stable
```

**Rules:**
- Never commit directly to `dev`, `test`, `prod`, or `main`.
- Feature, fix, and chore branches always base off `dev` and target `dev` as their merge destination.
- `dev → test → prod → main` promotions happen via PR after CI passes at each stage.
- The `test` branch is optional per app. If the app has no formal QA/UAT process, promote directly `dev → prod → main`. Document the decision in `TECHNICAL_DECISIONS.md`.
- Hotfixes that must skip `dev` (rare) go through a `fix/` branch → `prod` → backmerge to `dev` (and `test` if it exists).
- `main` is the canonical copy — it always reflects exactly what is running in production.

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

- If the branch is **`main`, `prod`, `test`, `dev`** (or `master`/`develop`) → ask the user what branch they want to work on. Suggest a name based on the task description following the conventions above (e.g., `feat/add-export-button`). Create and switch to it before writing any code.
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

See the **Stack-specific implementation guides** section for exact tool choices per stack. Stacks not listed there (PHP, Angular, Django, Spring Boot, etc.) are not approved.

| Area | BLADE default | Tier | When to deviate |
|------|--------------|------|-----------------|
| **Backend** | Node/Express + TypeScript | Primary | Python/FastAPI *(Primary)* for ML/data science; Go *(Approved)* for high-throughput or CLI; no backend if static + direct AWS calls |
| **Frontend** | React 19 + Vite + TypeScript | Primary | Next.js *(Approved)* if SSR/SSG needed; no frontend if pure API/CLI |
| **Auth** | Azure AD MSAL + JWKS | Primary | API key for machine-to-machine; no auth for fully internal tools with network-level protection |
| **Data storage** | No DB by default — add what fits | — | DynamoDB for serverless key-value; SQLite on EFS for read-heavy dashboards with periodic ETL; PostgreSQL/RDS for complex relational queries |
| **Infrastructure** | Lambda + ALB + Terraform | Primary | ECS/Fargate for long-running processes; App Runner for simpler container deploys |
| **WAF** | Optional (disabled by default) | — | Enable for public-facing apps or apps handling sensitive data |
| **Cloud provider** | AWS | Primary | All BLADE Terraform targets AWS. Azure/GCP requires Terraform adaptation — document in TECHNICAL_DECISIONS.md. |
| **CI/CD** | GitHub Actions + OIDC | Primary | Jenkins if org policy requires it |

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

## Stack-specific implementation guides

BLADE requirements have two layers:

- **Layer 1 — Universal** (every app, every stack): structured logging, rate limiting, input validation, auth on all routes, circuit breakers, CRLF stripping, DOMPurify, SHA-pinned CI, OIDC deploy, threat model, secrets manager, etc. The *mechanism* is required; the *tool* is stack-dependent.
- **Layer 2 — Per-stack** (prescriptive defaults for approved stacks): listed below. If your stack is here, follow these patterns exactly unless you document a deviation in `TECHNICAL_DECISIONS.md`.

---

### Backend: Node.js + Express + TypeScript *(Primary)*

The primary BLADE backend. All existing Lumen SRE Node apps use this pattern.

| Concern | Tool / pattern |
|---------|---------------|
| Runtime | Node 22 LTS |
| Framework | Express 4 + TypeScript strict mode |
| Logging | `winston` — structured JSON with correlation ID middleware |
| Input validation | `express-validator` — validate on route, call `handleValidationErrors` |
| Rate limiting | `express-rate-limit` — `standardLimiter` (reads), `strictLimiter` (writes) |
| Auth | `middleware/auth.ts` (JWKS) + `middleware/authorize.ts` (claims) |
| Circuit breakers | `opossum` — wrap ServiceNow, LD, and all third-party HTTP calls |
| Testing | `vitest` + `supertest`; mock all external calls |
| Linting | `ESLint` + `@typescript-eslint` ruleset |
| CRLF strip | `.replace(/[\r\n]/g, ' ')` on user input before logging |
| Secrets | `utils/secrets.ts` — Secrets Manager SDK with in-process 5-min cache |
| Security headers | `helmet()` middleware — do not remove; provides CSP, HSTS, Permissions-Policy |

Middleware order (must follow):
```
helmet → fail-closed CORS → body parser → correlation ID → structured logger → auth (JWKS) → routes → global error handler
```

---

### Backend: Python + FastAPI *(Primary)*

Used when the backend involves ML/data science, heavy data transformation, or AWS Bedrock.

| Concern | Tool / pattern |
|---------|---------------|
| Runtime | Python 3.12+ |
| Framework | FastAPI (latest stable) |
| Logging | `structlog` or `logging` with JSON formatter + correlation ID middleware |
| Input validation | Pydantic v2 models on all request bodies (not Pydantic v1) |
| Rate limiting | `slowapi` — apply `@limiter.limit()` decorator per route |
| Auth | PyJWT + JWKS endpoint — validate on every `/api/*` route |
| Circuit breakers | Custom `AsyncCircuitBreaker` for AWS SDK calls (see wave_path_comp pattern); `pybreaker` for sync HTTP third-party calls |
| Testing | `pytest` + `httpx.AsyncClient`; mock externals with `unittest.mock` |
| Linting | `ruff check` + `ruff format` (replaces flake8/pylint/isort entirely) |
| CRLF strip | `.replace('\r', '').replace('\n', ' ')` on user input before logging |
| Secrets | `boto3` Secrets Manager client with in-process caching (TTL ≤5 min) |
| Security headers | Custom `SecurityHeadersMiddleware(BaseHTTPMiddleware)` — set CSP, HSTS, X-Frame-Options, Permissions-Policy |

---

### Backend: Go + net/http or Gin *(Approved)*

Preferred for high-throughput services, CLI tools, or sidecars where low memory footprint and fast startup matter. Also a strong choice when the team is comfortable with Go.

| Concern | Tool / pattern |
|---------|---------------|
| Runtime | Go 1.22+ |
| Framework | `net/http` stdlib for simple APIs; `gin-gonic/gin` for larger REST APIs |
| Logging | `log/slog` (stdlib, Go 1.21+) — JSON handler; attach correlation ID via context |
| Input validation | `go-playground/validator` |
| Rate limiting | `golang.org/x/time/rate` (token bucket) |
| Auth | `golang-jwt/jwt` + JWKS caching |
| Circuit breakers | `sony/gobreaker` |
| Testing | stdlib `testing` + `testify/assert`; `net/http/httptest` for handler tests |
| Linting | `golangci-lint` — include `staticcheck`, `errcheck`, `govet`; run in CI |
| CRLF strip | `strings.NewReplacer("\r", "", "\n", " ")` on user input before logging |
| Secrets | AWS SDK v2 `secretsmanager` client with in-process cache |
| Security headers | Custom middleware matching Helmet output (CSP, HSTS, X-Frame-Options, Permissions-Policy) |
| HTML sanitization | `microcosm-cc/bluemonday` for any server-side HTML sanitization |

---

### Backend: Rust + Axum *(Approved — advanced)*

Maximum performance or memory-constrained environments. Only use if the team has Rust experience — capability is high but the learning curve is steep.

| Concern | Tool / pattern |
|---------|---------------|
| Runtime | Rust stable (latest) |
| Framework | `axum` (tokio async runtime) |
| Logging | `tracing` + `tracing-subscriber` JSON format |
| Input validation | `validator` crate + `serde` |
| Rate limiting | `tower-governor` (Tower middleware) |
| Auth | `jsonwebtoken` crate + JWKS caching |
| Circuit breakers | `failsafe-rs` or implement with tokio channels |
| Testing | `#[tokio::test]` + `tower::ServiceExt` for handler tests |
| Linting | `clippy` — treat warnings as errors in CI (`RUSTFLAGS="-D warnings"`) |
| Secrets | AWS SDK for Rust `secretsmanager` client |

---

### Frontend: React 19 + TypeScript + Vite *(Primary)*

| Concern | Tool / pattern |
|---------|---------------|
| Runtime | Node 22 LTS (build only) |
| Framework | React 19 + Vite + TypeScript strict mode |
| Design system | Chi 7.13.0 — `https://lib.lumen.com/chi/7.13.0/chi.css`; add `class="chi"` to `<html>`; use Web Components (`<chi-button>`, `<chi-modal>`, etc.) — not legacy CSS classes |
| Auth | `@azure/msal-browser` — redirect flow; all routes except MSAL callback require valid session |
| XSS sanitization | `DOMPurify` — sanitize any HTML from external sources before rendering; do not rely on React's default escaping alone for third-party content |
| Testing | `vitest` + `@testing-library/react` for unit/component; `playwright` for E2E |
| Linting | `ESLint` + `@typescript-eslint` + `eslint-plugin-react-hooks` |
| State management | React context + hooks for simple state; `zustand` for complex cross-component state |
| HTTP client | `axios` or native `fetch` — centralize in a typed API client module |
| Bundle size | Audit with `vite-bundle-visualizer`; bundles >500 KB use `React.lazy` + `Suspense` |

---

### Frontend: Next.js 14+ *(Approved — SSR/SSG only)*

Use when server-side rendering is needed for SEO, first-paint performance, or edge rendering. For pure SPAs with an API backend, prefer React + Vite.

| Concern | Tool / pattern |
|---------|---------------|
| Framework | Next.js 14+ App Router |
| Auth | `next-auth` with Azure AD provider; or `@azure/msal-browser` client-side only |
| Testing | Same as React above |
| Linting | Same as React above |
| Deployment | Lambda@Edge or Vercel — document in TECHNICAL_DECISIONS.md |

---

### Stacks to avoid

The following are actively discouraged for new Lumen SRE apps. If a legacy app uses them, document a migration plan in `TECHNICAL_DECISIONS.md`.

| Stack | Why to avoid | Preferred alternative |
|-------|-------------|----------------------|
| PHP | Inconsistent security model, no type safety, fragmented ecosystem | Python/FastAPI or Node/Express |
| Apache httpd (as app server) | Superseded by ALB + Lambda/ECS; unnecessary config complexity | AWS ALB + Lambda |
| AngularJS (1.x) | End of life 2021; known XSS vulnerabilities | React 19 |
| Angular 2–21 | Heavy CLI; diverges from Lumen standard; not Chi-native | React 19 (migration plan acceptable for existing apps) |
| Django / Flask | More boilerplate than FastAPI; not async-native | FastAPI |
| jQuery | Superseded by React; no type safety; DOM manipulation XSS risk | React 19 |
| Express + JavaScript (no TS) | No compile-time safety; harder to maintain at scale | Express + TypeScript |
| Spring Boot / Java | Heavy JVM startup on Lambda; verbose; not idiomatic for serverless | Go or Node/Express |
| Ruby on Rails | No BLADE patterns; not used in Lumen SRE | Node/Express or Python/FastAPI |
| .NET / C# | Not targeted by BLADE Terraform; limited Lambda ergonomics | Go or Node/Express |

---

## During development

These rules apply regardless of stack. For exact tool names and commands, see the **Stack-specific implementation guides** section above.

- **Never use ad-hoc logging** (`console.log`, `print()`, `fmt.Println`) in backend production code — use the structured logger for your stack.
- **Reuse middleware patterns** — do not reinvent auth, logging, rate limiting, or correlation ID injection.
- **Every new service/handler must have unit tests** with all external calls mocked.
- **Every POST/PUT endpoint must validate the request body** using the stack's schema validation tool. Invalid payloads return HTTP 422 with a structured error — never raw stack traces.
- **Run lint and tests before every commit** — command varies by stack (see per-stack guide).
- **Run the type checker before merging**: TypeScript → `npx tsc --noEmit`; Python → `mypy` or Pyright; Go → `go build ./...`.
- **Clean up dead code** in every PR: no commented-out blocks, no unused imports, no unexplained untyped values (`any`, `interface{}`, untyped `dict`).

### Post-deploy verification

After every deployment (dev, prod, or otherwise), verify the deployment is healthy before closing the session:

1. Hit the `/health` endpoint and confirm `status: "ok"` (not `"degraded"`)
2. Check CloudWatch Logs for the Lambda function — look for error-level entries or cold-start failures in the first 2–3 invocations
3. Confirm the frontend loads and clears the login page (MSAL redirect working)
4. If Terraform outputs changed (new domain, new ALB rule ARN), update `DEPLOYMENT.md` and `.env.example` accordingly

If `/health` returns `degraded`, do not consider the deployment complete — investigate the failing dependency check before wrapping up.

### Code decomposition

Proactively decompose large code as you work — do not wait for a dedicated refactor sprint:

- **Files over ~300 lines** are a signal to split. Look for logical seams: separate concerns into their own modules, services, hooks, or utilities.
- **Functions over ~50 lines** should be examined. If a function does more than one thing, extract the sub-tasks into named helpers. The function name should describe what it does, not how.
- **Duplicated logic** (copy-pasted blocks, repeated patterns across files) should be extracted into a shared utility or hook on first or second recurrence — not left to accumulate.
- **React components** should not manage both data-fetching/state logic and rendering in the same component. Extract custom hooks (`use*.ts`) for stateful logic; keep components focused on rendering.
- **When adding a feature to a file that is already too large**, refactor the file as part of the same PR — do not make it worse and leave it. Flag the decomposition in the PR description.

If decomposing a file would make the current PR scope too large, create a `chore/decompose-<filename>` branch and note it as immediate follow-up work.

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

These are Lumen/org-specific requirements that apply on top of BLADE universal requirements and the per-stack guides. They do not change with the stack.

- **Auth:** Azure AD with MSAL — do not roll your own JWKS validation. See per-stack guide for the specific library and middleware pattern.
- **Secrets path convention:** `ld-sre-<app-name>/<env>/<secret-name>` in AWS Secrets Manager.
- **Domain naming:** `<app-name>.<env>.ld.lumen.com`
- **AWS accounts:** dev=`396304931560`, prod=`111491017663` (document in `.env.example` — confirm with team as accounts may vary by project).
- **Branding:** Chi design system v7.13.0 from `https://lib.lumen.com/chi/7.13.0/chi.css`. Add `class="chi"` to the `<html>` element. Use Chi **Web Components** (`<chi-button>`, `<chi-alert>`, `<chi-modal>`, etc.) — not legacy CSS classes. Chi Web Components handle accessibility automatically.
- **Production deploys:** Lumen requires a **GCR (Global Change Request)** for all production deployments. Before deploying to prod, ensure a GCR is opened, approved, and in an active change window. This is a compliance requirement, not a suggestion.

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
- [ ] Frontend enforces auth at the router level — all routes except the MSAL callback redirect require a valid session; no client-side route is accessible without authentication.

**Secrets and configuration**
- [ ] No secrets, tenant IDs, account IDs, or API keys are hardcoded in source code or committed to the repo.
- [ ] `.env.example` contains only placeholder strings — no real values.
- [ ] Runtime secrets come from AWS Secrets Manager, not environment variables baked into the Lambda package.
- [ ] `VITE_*` env vars are build-time and client-visible — confirm none contain sensitive values.
- [ ] Secrets Manager IAM grants are scoped to a specific ARN prefix (e.g., `arn:aws:secretsmanager:*:*:secret:my-app/*`) — not wildcard `*` on all secrets.
- [ ] Secrets Manager responses are cached in-process with a short TTL (≤5 min) — reduces API calls while still picking up rotated credentials promptly.
- [ ] **All files** are checked for committed secrets — including docs, markdown, and config files, not just source code. Secret scanning in GitHub should be enabled.

**Input validation**
- [ ] Every POST/PUT endpoint validates the request body with a schema (express-validator for Node; Pydantic for Python).
- [ ] Invalid payloads return HTTP 422 with a structured, client-safe error — never raw stack traces.
- [ ] Frontend sanitizes any user-provided content before rendering HTML-like output — use **DOMPurify** (or equivalent) for any content that could contain HTML. Do not rely on React's default escaping alone for content from external sources.
- [ ] External API responses (Bedrock, third-party APIs) are validated before being used — do not trust upstream output blindly.

**Transport and headers**
- [ ] All traffic is HTTPS; HTTP → HTTPS redirect is enforced at the ALB.
- [ ] `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` are present on every response.
- [ ] `Strict-Transport-Security` (HSTS) is set either in middleware or at the ALB.
- [ ] `Content-Security-Policy` is configured — Helmet provides defaults; review and tighten for the app's actual sources.
- [ ] `Permissions-Policy` header is set (Helmet provides this automatically — confirm it is not being removed).
- [ ] CORS is fail-closed: only explicitly allowlisted origins are accepted. No wildcard `*` in production.

**Logging and observability**
- [ ] Structured JSON logs on every request — no `console.log` in production backend code.
- [ ] A correlation/request ID is generated per request and included in all log lines and downstream calls.
- [ ] Credentials, tokens, authorization headers, and raw PII are never logged.
- [ ] User-provided free text is sanitized before logging — **explicitly strip CR (`\r`) and LF (`\n`) characters** to prevent log injection attacks.
- [ ] Unhandled exceptions return a generic `500` to the client; the full stack trace is logged server-side only.
- [ ] CloudWatch log group has a retention policy set (recommended: 90 days) — do not leave retention as "Never expire".

**Infrastructure and CI/CD**
- [ ] GitHub Actions uses OIDC role assumption — no long-lived static AWS credentials stored as secrets.
- [ ] All GitHub Actions workflows declare a `permissions` block — use `permissions: contents: read` as the default and grant only what each job actually needs. Workflows without a `permissions` block inherit overly broad defaults.
- [ ] All `uses:` actions in GitHub Actions workflows are pinned to a **commit SHA**, not a floating version tag (e.g., `uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683` not `@v4`). Tags can be moved; SHAs cannot.
- [ ] IAM roles follow least-privilege: only the specific actions and resource ARNs needed are granted.
- [ ] Lambda function is deployed into a private VPC subnet and is not directly internet-accessible — all inbound traffic must flow through the ALB.
- [ ] Dependabot is configured (`.github/dependabot.yml`) with weekly updates for all package ecosystems used.
- [ ] `npm audit --audit-level=high --omit=dev` (or `pip-audit`) runs in CI and blocks on high/critical findings.
- [ ] WAF is enabled in Terraform for any public-facing app or app handling sensitive data. Enable at minimum: `AWSManagedRulesCommonRuleSet`, `AWSManagedRulesSQLiRuleSet`, `AWSManagedRulesKnownBadInputsRuleSet`, and a rate-based rule.

**External dependency resilience**
- [ ] All external calls (AWS services, third-party APIs) have explicit timeouts.
- [ ] Retry/backoff logic distinguishes retryable (502/503/429) from non-retryable (400/401/403) failures.
- [ ] **Circuit breakers** are in place for high-volume or critical external dependencies — a slow or failing upstream should not cascade into full app failure. Implement with a library (`opossum` for Node, `circuitbreaker` pattern for Python) or at the infrastructure level.
- [ ] The `/health` endpoint checks dependencies and returns `degraded` status without exposing internal error details.
- [ ] Graceful degradation is implemented where possible — a failing non-critical dependency should degrade, not crash the app.

**AI / Bedrock (if applicable)**
- [ ] All Bedrock invocations include a mandatory guardrail ARN — enforced at the IAM level via a `Condition` block on `bedrock:InvokeModel`, not just in application code.
- [ ] LLM input and output is written to an audit table (DynamoDB or equivalent) for compliance and auditability.
- [ ] LLM output is validated before use — do not pass raw model output into business logic without format/content checks.

**Data lifecycle and retention**
- [ ] Retention behavior is defined for all stored data (user records, logs, AI audit entries) — "keep forever" is not an acceptable default.
- [ ] Delete and archive operations are auditable — log who deleted what and when.
- [ ] Legal hold / retention constraints are respected if the app handles data subject to compliance requirements.

### Done criteria for security-relevant changes

Before marking any PR complete that touches authentication, authorization, secrets, logging, or data storage, confirm:

- [ ] AuthN/AuthZ behavior validated for every changed endpoint or page
- [ ] Secrets handling and config exposure reviewed — nothing new hardcoded or client-exposed
- [ ] Logging is structured, correlated, and redacted — no new credentials or PII in logs
- [ ] Input validation and sanitization verified for all new inputs
- [ ] Resilience behavior validated for any new external calls
- [ ] Tests added or updated for both happy path and failure/error cases

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
| **Testing** | 20% | Unit tests for all service/util modules with mocked externals; frontend component and hook tests (Vitest); E2E tests for critical user flows (Playwright); contract tests for external API integrations; ≥80% coverage on business logic. All four test types should be present in a mature app. |
| **Security** | 15% | All items in the security checklist above pass |
| **Performance** | 10% | No synchronous calls in async contexts, module-level singletons for expensive clients (HTTP, DB, LLM), no per-request client construction; JS bundle size checked — bundles over ~500KB minified should use code splitting (`React.lazy` + `Suspense`) |
| **Dependencies** | 5% | Dependabot enabled, no known high/critical CVEs in production deps, type-only packages in devDependencies, no deprecated framework APIs in use (Pydantic v1 patterns, React legacy lifecycle methods, etc.) |
| **Documentation** | 10% | README accurate, ONBOARDING enables 30-min setup, SECURITY.md current, RELEASE.md has changelog |
| **Error handling** | 10% | All exceptions logged with context, no silent swallowing, structured client-safe error responses |

Score each category 0–100 and compute a weighted total. Report the weighted score and grade (A+ ≥ 95, A ≥ 90, B+ ≥ 77, B ≥ 70, below 70 = needs work). For any category below 80, list the top 2–3 specific gaps with suggested fixes.
