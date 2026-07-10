# BLADE Agent Instructions

BLADE (Blueprint for Lumen AI-Driven Engineering) is the standard template for Lumen AI-built apps. Treat this repo as a production-ready framework, not a toy starter.

---

## Before writing any code

### 1. Read `TECHNICAL_DECISIONS.md`
If it already has content, understand every decision made so far. If it is empty, the tech stack discussion has not happened yet — do not skip it.

### 2. Conduct the tech stack discussion with the developer
This is a **real conversation**, not a formality. The following are BLADE recommended defaults with rationale, but every one of them is negotiable. Present the options, understand the app needs, then decide together.

| Area | BLADE default | When to deviate |
|------|--------------|-----------------|
| **Frontend** | React 19 + Vite + TypeScript | Angular if team has deep Angular expertise; no frontend if pure API/CLI tool; plain HTML/JS for ultra-simple dashboards |
| **Backend** | Node/Express + TypeScript | Python/FastAPI if heavy ML/data science; no backend if static + direct AWS calls |
| **Auth** | Azure AD MSAL + JWKS | API key only for machine-to-machine; no auth for fully internal tools with network-level protection |
| **Data storage** | No DB by default — add what fits | DynamoDB for serverless/scalable key-value; SQLite for simple low-volume persistence; PostgreSQL/RDS for complex relational queries; no DB if data lives entirely in external systems |
| **Infrastructure** | Lambda + ALB + Terraform | ECS/Fargate for long-running processes; App Runner for simpler container deploys |
| **WAF** | Optional (disabled by default) | Enable for public-facing apps or apps handling sensitive data |
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
- Update `TECHNICAL_DECISIONS.md` when new architectural decisions are made — not just the initial ones.
- Update `README.md` whenever setup or run steps change.
- Update `RELEASE.md` with a changelog entry for every PR.
- Keep `ONBOARDING.md` current — a new engineer should be able to set up the app in under 30 minutes using it alone.
- Clean up dead code: no commented-out blocks, no unused imports, no unexplained `any`.

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
