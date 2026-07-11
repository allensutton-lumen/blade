# BLADE

**Blueprint for Lumen AI-Driven Engineering** — an AI development assistant standard for Lumen internal applications.

## What is BLADE?

AI agents are good at writing code quickly. What they're less reliable at — without explicit instruction — is everything that surrounds the code: keeping documentation current, flagging security vulnerabilities, running quality checks, cleaning up dead code, decomposing oversized files, and maintaining a consistent bar as the codebase grows. Developers working with AI often end up doing all of that manually, or not at all.

BLADE solves this by giving the agent a standing set of responsibilities it carries out throughout every development session — not just when asked:

- **Security:** checks GitHub for open Dependabot, secret scanning, and code scanning alerts at session start; runs a 25-item security checklist before any PR reaches `prod` or `main`; flags hardcoded secrets, missing input validation, open CORS, and weak IAM posture as it works
- **Code quality:** breaks up monolithic files and oversized functions proactively; removes dead code, unused imports, and unexplained `any` types; extracts repeated logic into shared utilities and hooks
- **Documentation:** updates `README`, `ONBOARDING`, `DEPLOYMENT`, `SECURITY`, `TECHNICAL_DECISIONS`, and `RELEASE` in the same commit as the code change — not as an afterthought
- **QA:** scores the app against an 8-category quality rubric (architecture, testing, security, performance, dependencies, documentation, error handling, code quality) on demand or before major releases
- **Dependency hygiene:** keeps `npm audit` and `pip-audit` clean in CI; Dependabot configured out of the box for weekly updates
- **Honesty:** raises concerns before acting on a bad idea, names technical debt when creating it, and does not simply agree with the developer to avoid friction

The agent pulls the latest version of these standards from the central BLADE repo at the start of every session, so improvements to the standard propagate to all apps automatically.

BLADE also includes a full-stack scaffold (React + Node/Express + Terraform + GitHub Actions) so new apps have a working, deployable baseline from day one. The scaffold reflects the stack used across Lumen AI apps — keeping things consistent makes onboarding and cross-team maintenance easier. But the scaffold is a starting point, not a constraint; every decision is documented and negotiable.

BLADE currently targets **AWS**. Azure and GCP Terraform support can be added as contributions.

---

## Quick Start

```powershell
git clone https://github.com/LumenTech-Prod/blade.git my-app
cd my-app
```

Open a new agent session (GitHub Copilot CLI, Cursor, etc.) from the `my-app` directory. The agent will:

1. Pull the latest BLADE standards from the central repo
2. Check the current git branch and create a feature branch if needed
3. Check GitHub for open security alerts
4. Read `TECHNICAL_DECISIONS.md` and conduct a tech stack discussion before writing any code

> Do not start writing app code before the tech stack discussion is complete. The agent instructions enforce this.

---

## The `.blade/` directory

| File | Purpose |
|------|---------|
| `AGENT_INSTRUCTIONS.md` | The core of BLADE. Governs agent behavior, branching strategy, session-start ritual, security evaluation, and QA standards. Refreshed automatically at each session start. |
| `UPGRADE_GUIDE.md` | Checklist for bringing an existing non-BLADE app up to the standard, plus an agent prompt template for starting an upgrade session. |

---

## Branching strategy

```
feat/* / fix/* / chore/*
        ↓  PR + CI
       dev          ← all feature work lands here first
        ↓  PR + CI
      test          ← optional; for formal QA / UAT (skip if not needed)
        ↓  PR + CI
      prod          ← pre-production; staged for release
        ↓  PR + CI
      main          ← canonical codebase; always matches production
```

Never commit directly to `dev`, `test`, `prod`, or `main`. The agent enforces this at session start. Whether to use a `test` branch is documented in `TECHNICAL_DECISIONS.md`.

---

## Architecture

```
Browser (React + MSAL)
  -> /api/* with Azure AD token
Express API (Lambda / local Node)
  -> Helmet, CORS, correlation IDs, request logging, auth, validation, rate limiting
AWS
  -> Secrets Manager, Lambda, shared ALB, optional WAF, Route53, ACM, DynamoDB (optional)
```

---

## Customization guide

For each new app:

1. Start an agent session — it will conduct the tech stack discussion and fill in `TECHNICAL_DECISIONS.md`
2. Update `APP_NAME` and `project_name` in `terraform/terraform.tfvars.*`
3. Add app-specific routes in `backend/src/app.ts`
4. Add app-specific content in `frontend/src/App.tsx`
5. Update Azure AD group IDs and secret paths in `.env.example`
6. Bootstrap Terraform — see `DEPLOYMENT.md`

---

## Local dev

| | |
|---|---|
| Backend | `http://localhost:3001` |
| Frontend | `http://localhost:5173` |
| Windows | `./start-dev.ps1` — handles AWS SSO, port cleanup, spawns both servers |
| Mac/Linux | `./start-dev.sh` |
| Auth bypass | Set `SKIP_AUTH=true` in `.env` for local-only use |

---

## Deploy

```powershell
# Windows
./deploy.ps1 -Environment dev

# Mac/Linux
./deploy.sh --environment dev
```

GitHub environments: `blade-dev-01`, `blade-prod-01`

See `DEPLOYMENT.md` for first-time Terraform bootstrap steps.

---

## Environment variables

| Variable | Purpose |
|---|---|
| `APP_NAME` | Human-friendly application name |
| `PORT` | Local backend port (default: 3001) |
| `FRONTEND_URL` | CORS allowlist origin |
| `SKIP_AUTH` | Local-only auth bypass (`true` only; blocked in Lambda) |
| `SECRET_PATH_AZURE` | Secrets Manager path for Azure AD settings |
| `LUMEN_AZURE_TENANT_ID` | Local tenant override (skips Secrets Manager) |
| `BLADE_AZURE_CLIENT_ID` | Local client ID override |
| `AUTHORIZED_USERS_GROUP_ID` | Standard-user Azure AD group |
| `AUTHORIZED_ADMINS_GROUP_ID` | Admin Azure AD group |
| `DEV_AWS_PROFILE` | AWS SSO profile for local development |

---

## Documentation

| File | When to update |
|------|---------------|
| `README.md` | Any time setup, run steps, architecture, or env vars change |
| `ONBOARDING.md` | Any time a new engineer would get stuck following the current version |
| `DEPLOYMENT.md` | Any time Terraform or deploy steps change |
| `SECURITY.md` | Any time the auth model, secrets approach, or security posture changes |
| `TECHNICAL_DECISIONS.md` | Every architectural decision — before implementation, not after |
| `RELEASE.md` | Every PR — add a changelog entry |

Docs that are out of date are treated as bugs, not nice-to-haves.

---

## Compliance enforcement model

BLADE uses two complementary layers:

| Layer | What it enforces | When it runs |
|-------|-----------------|--------------|
| **Agent instructions** (`.blade/AGENT_INSTRUCTIONS.md`) | Architecture decisions, tech stack choices, code quality, security posture, QA standards, agent behavior | Every agent session |
| **CI/CD gates** (GitHub Actions) | Lint, tests, `npm audit`, TypeScript, no hardcoded secrets | Every PR — automated, cannot be bypassed without bypassing branch protection |

A future direction is a **reusable BLADE compliance workflow** — a GitHub Actions workflow hosted in this repo that any app can reference:

```yaml
jobs:
  blade-check:
    uses: LumenTech-Prod/blade/.github/workflows/blade-check.yml@main
```

This would enforce structural compliance (required files, Dependabot config, audit thresholds) across all apps automatically, picking up improvements without re-cloning. Contributions welcome.

---

## Design decisions and rationale

BLADE's choices were derived from analysis of the Lumen SRE app portfolio — surveying what was working well and selecting the best-proven patterns for each concern. Everything here is defensible, not arbitrary.

### The two-layer standard

BLADE separates requirements into two layers:

- **Universal requirements** — mechanisms that apply to every app regardless of language or framework: structured logging, rate limiting, input validation, auth on all routes, OIDC deploy, SHA-pinned CI, circuit breakers, CRLF stripping, DOMPurify, threat model. The *what* is required; the *how* is stack-dependent.
- **Per-stack implementation guides** — prescriptive tool choices for each approved stack. This prevents agents from making inconsistent interpretations ("I added logging" could mean `print()` or structured JSON with correlation IDs — these are not equivalent).

This two-layer model means BLADE stays relevant as the tech landscape evolves: new stacks can be added to the per-stack guides without changing the universal requirements.

---

### Stack tier philosophy

Stacks are tiered rather than given a single blessed choice, because the right tool genuinely depends on the problem:

| Tier | Meaning |
|------|---------|
| **Primary** | Fully tested in production Lumen apps. All BLADE patterns documented. Prefer for all new work unless there is a specific reason to deviate. |
| **Approved** | Modern, well-supported, meets all BLADE universal requirements. Good fit for specific use cases. Use when Primary stacks don't fit. |
| **Avoid** | Not approved for new apps. Legacy, insecure, or a poor match for the Lambda/serverless deployment model. Existing apps using these should have a migration plan. |

---

### Why each stack was chosen (or not)

#### Node.js + Express + TypeScript — *Primary backend*

- Full-stack TypeScript reduces context switching for engineers and AI agents — same type system, same idioms, same toolchain on both sides.
- Express is minimal and battle-tested. Its middleware model maps directly to BLADE's security middleware chain (Helmet → CORS → auth → validation → routes).
- TypeScript strict mode catches an entire class of runtime errors at compile time. This is especially valuable for AI-generated code, which tends to have subtle type errors.
- Node's async, event-driven execution fits Lambda's model well — no JVM overhead, fast cold starts.
- Rich ecosystem of security-focused packages: Helmet (headers), express-rate-limit, express-validator, opossum (circuit breakers).

#### Python + FastAPI — *Primary backend*

- Python is the dominant language for ML, data science, and AWS Bedrock. When the backend needs to call a model, do data transformation, or integrate with analytics tooling, Python has no real competitor.
- FastAPI is async-native, has automatic OpenAPI/Swagger docs, and Pydantic v2 provides the best request validation model in any web framework — schema errors surface at the boundary, not deep in business logic.
- Better choice than Django or Flask: Django is opinionated and adds significant overhead for simple APIs; Flask has no built-in async support or type validation; FastAPI surpasses both on all three dimensions.

#### Go + Gin — *Approved*

- Go compiles to a small static binary with no runtime overhead — Lambda cold starts are measured in milliseconds, not seconds.
- `net/http` in the stdlib is production-quality (unlike Node's built-in http module). `log/slog` (stdlib since Go 1.21) provides structured logging with no third-party dependency.
- Go's concurrency model (goroutines, channels) handles high fan-out patterns (many parallel upstream API calls) more efficiently than async/await.
- Strong static typing with simple syntax — AI agents tend to write correct, idiomatic Go more reliably than, say, Java.
- Not Primary because: fewer established Lumen-specific patterns; smaller team familiarity today; less AI tooling maturity than TypeScript/Python.

#### Rust + Axum — *Approved (advanced)*

- Maximum performance and memory safety guarantees. Zero-cost abstractions mean no runtime overhead. Axum is the tokio-ecosystem standard with strong type-safe routing.
- The borrow checker eliminates entire classes of memory safety bugs that exist in C/C++ and can appear subtly in other languages.
- Not Primary because: steep learning curve; slower development velocity than Go or Node; smaller talent pool; AI agents are less reliable writing idiomatic Rust (ownership semantics are non-trivial to generate correctly).
- Use when the team has Rust experience and the use case genuinely demands it.

#### React 19 + Vite — *Primary frontend*

- React is the dominant SPA framework with the largest ecosystem, the best AI tooling support, and the most documentation per component pattern.
- Vite's development build is dramatically faster than webpack-based alternatives (sub-second HMR vs. 20–30+ second rebuilds on large projects). This matters for developer experience and CI speed.
- TypeScript strict mode catches type errors at compile time — especially important for the component prop interfaces that AI agents generate.
- React's component model maps naturally to how AI agents decompose UI: each component is a self-contained unit with clear inputs (props) and outputs (rendered HTML).

#### Next.js — *Approved (SSR/SSG only)*

- Valid when SEO, first-paint performance, or edge rendering are requirements that a pure SPA cannot meet.
- For Lumen internal tools (authenticated, not indexed by search engines), these requirements rarely apply — React + Vite is almost always the right choice.

---

### Why specific universal requirements exist

#### OIDC over static AWS keys
Static IAM access keys are long-lived credentials stored as GitHub secrets. If a secret is leaked (repository compromise, log exposure, third-party service breach), the key remains valid until manually rotated. OIDC tokens are ephemeral (15-minute TTL), scoped to specific GitHub repositories and workflows, and require no credentials to store or rotate. The attack surface is fundamentally smaller.

#### SHA-pinned GitHub Actions
Version tags (e.g., `actions/checkout@v4`) are mutable — a compromised package maintainer can move the tag to point to malicious code. Pinning to a full commit SHA (`@11bd71901bbe5b1630ceea73d27597364c9af683`) makes the referenced code immutable. Supply chain attacks on CI/CD pipelines are a real and growing threat (SolarWinds, XZ Utils, etc.).

#### Structured logging + correlation IDs
CloudWatch Logs Insights can filter and aggregate structured JSON by field value — `filter correlationId = "abc-123"` returns every log line for a single request across all Lambda invocations. Unstructured `console.log` strings require regex matching against free text. The difference in debuggability in production incidents is significant. Correlation IDs additionally enable distributed tracing across Lambda → external API → DynamoDB without a dedicated tracing service.

#### CRLF stripping
Log injection: if an attacker controls content that reaches a log line (e.g., a user-supplied search term or name field), they can embed `\r\n` characters to inject fake log entries that appear legitimate. Stripping CR/LF characters from user input before logging closes this attack vector.

#### DOMPurify
React's JSX escapes `{}` expressions, preventing direct XSS in most cases. But `dangerouslySetInnerHTML`, URL injection via `href`/`src`, and content rendered from external API responses (Bedrock, ServiceNow, etc.) bypass React's escaping. DOMPurify sanitizes HTML strings before they reach the DOM, removing scripts, event handlers, and dangerous attributes. One of the most exploited vulnerability classes in web apps.

#### Circuit breakers
Without circuit breakers, a slow external API (ServiceNow, LaunchDarkly, Bedrock) causes request pileup: each inbound request holds an open connection waiting for the upstream timeout. Lambda concurrency limits are quickly exhausted, and the app stops responding to all requests — not just those that depend on the slow upstream. Circuit breakers fail fast when a dependency is unhealthy, return a degraded response immediately, and self-heal once the upstream recovers (half-open probe). Circuit breakers do not replace retry logic — they complement it.

#### WAF
AWS WAF managed rule sets (`AWSManagedRulesCommonRuleSet`, `AWSManagedRulesSQLiRuleSet`, etc.) block known-bad request patterns — SQL injection, XSS, scanner signatures, bad bots — before they reach the application. Disabled by default because not all apps need the added cost; enabled for any public-facing app or app handling sensitive data.

#### Threat model in SECURITY.md
A threat model is not security theater. Writing down what an attacker would want (steal tokens, exfiltrate data, inject into ServiceNow), what they can reach (ALB, public endpoint, MSAL callback), and how each threat is mitigated forces explicit reasoning about the attack surface. It also creates a baseline that a new engineer (or AI agent) can read to understand *why* specific security controls exist, rather than just knowing that they do.

---

### Why stacks are discouraged

| Stack | Specific reason |
|-------|----------------|
| **PHP** | Inconsistent security model (decades of `register_globals`, `magic_quotes`, and other foot-guns); type system is bolted on (PHP 8 improved this but legacy patterns persist across codebases and tutorials); not idiomatic for Lambda/serverless. |
| **Apache httpd (as app server)** | Replaced by ALB + Lambda for our deployment model. Running Apache as an app server on EC2 adds operational overhead (patching, scaling, SSH access) with no benefit over a managed Lambda + ALB setup. |
| **AngularJS (1.x)** | End-of-life December 2021. Known XSS vulnerabilities. No migration path within the framework — any effort is better spent on React. |
| **Angular 2–21** | Heavy CLI with complex build tooling; not Chi-native; diverges from Lumen standard. Angular's change detection model and RxJS dependency chain are harder for AI agents to navigate correctly than React's component model. Acceptable in legacy apps with a migration plan. |
| **Django / Flask** | Django: opinionated configuration that adds overhead for simple Lambda APIs. Flask: no async support, no type validation, requires significant boilerplate to reach FastAPI's baseline. FastAPI is strictly superior for the use cases where Python is chosen. |
| **jQuery** | Superseded by React. DOM manipulation patterns common in jQuery code are a major source of XSS vulnerabilities. No type safety. No component model — AI agents generate hard-to-maintain spaghetti with jQuery. |
| **Express + JavaScript (no TypeScript)** | Without TypeScript, there is no compile-time type checking. Runtime type errors that TypeScript would catch at build time appear in production. The maintenance cost grows as the codebase scales. The migration to TypeScript is small; the benefit is large. |
| **Spring Boot / Java** | JVM cold starts on Lambda are 3–10+ seconds without SnapStart. Spring Boot's annotation-heavy configuration is verbose and opinionated in ways that create friction for AI agents. Java achieves nothing that Go or Node/Express cannot do better in a serverless context. |
| **Ruby on Rails** | No established Lumen SRE patterns. No BLADE scaffold. Small talent pool in the SRE org. Rails' "convention over configuration" model conflicts with BLADE's explicit documentation requirement. |
| **.NET / C#** | Not targeted by BLADE Terraform (which targets Linux Lambda runtimes). Limited Lambda ergonomics compared to Node or Go. Not used in the Lumen SRE portfolio. |
