# BLADE

**Blueprint for Lumen AI-Driven Engineering** — a production-ready GitHub template for Lumen AI-developed applications.

## What is BLADE?

BLADE is the standard starting point for Lumen internal apps built with AI agents (GitHub Copilot, etc.). It encodes the best practices observed across several production Lumen AI apps, provides a working skeleton you can deploy on day one, and includes agent instructions that guide the AI through a tech stack discussion before writing a single line of app-specific code.

BLADE currently targets **AWS**. Azure and GCP Terraform support can be added as contributions.

---

## Quick Start

```powershell
git clone https://github.com/LumenTech-Prod/blade.git my-app
cd my-app
# Read .blade/AGENT_INSTRUCTIONS.md before doing anything else
# Then start a tech stack discussion with your AI agent
```

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

1. Read `.blade/AGENT_INSTRUCTIONS.md` and run the tech stack discussion
2. Fill in `TECHNICAL_DECISIONS.md` with decisions made
3. Update `APP_NAME` and `project_name` in `terraform/terraform.tfvars.*`
4. Add app-specific routes in `backend/src/app.ts`
5. Add app-specific content in `frontend/src/App.tsx`
6. Update Azure AD group IDs and secret paths in `.env.example`
7. Bootstrap Terraform — see `DEPLOYMENT.md`

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

## BLADE's own decisions — and why

These choices were derived from an analysis of existing Lumen AI-developed applications — surveying what was working well across the portfolio and selecting the best-proven patterns for each area.

| Area | Decision | Rationale |
|------|----------|-----------|
| **Frontend** | React 19 + Vite + TypeScript | The standard frontend stack for Lumen AI apps. Vite build speed is significantly faster than webpack-based alternatives, TypeScript catches errors at compile time, and the ecosystem has strong AI tooling support. |
| **Backend** | Node/Express + TypeScript | Keeps the full stack in one language, reducing context switching for both engineers and AI agents. Express is minimal and well-understood. Python/FastAPI is the better choice for ML-heavy workloads. |
| **Auth** | Azure AD MSAL + JWKS | Lumen SSO standard. MSAL handles the browser-side OAuth2 flow; JWKS validation keeps the backend stateless and avoids session management. |
| **Runtime config** | `/api/config` endpoint | Serves Azure tenant/client IDs to the frontend at runtime from Secrets Manager. Avoids hardcoding IDs in frontend bundles or build-time env vars. |
| **Data storage** | No DB by default; DynamoDB or SQLite when needed | Many Lumen tools query external systems and need no persistence of their own. DynamoDB fits serverless Lambda naturally. SQLite on EFS is a strong alternative for read-heavy dashboards backed by a periodic ETL job. |
| **Cloud provider** | AWS | All Lumen AI apps in the surveyed portfolio run on AWS. Lambda, ALB, Secrets Manager, DynamoDB, Route53, ACM, and WAF are provisioned by the included Terraform. Azure and GCP are not currently supported — contributions welcome. |
| **Secrets** | AWS Secrets Manager | Avoids plaintext secrets in environment variables, integrates cleanly with Lambda via IAM, and allows secret rotation without redeployment. |
| **CSS/Branding** | Chi design system | Lumen official design system. Provides on-brand typography, colors, and components without custom CSS overhead. |
| **CI/CD** | GitHub Actions + OIDC | OIDC eliminates long-lived AWS access keys stored as GitHub secrets. Branch-to-environment mapping makes promotion explicit. PR gates on typecheck, lint, tests, and audit run before any merge. |
| **Security middleware** | Helmet + fail-closed CORS + rate limiting | Helmet sets secure HTTP headers with one line. Fail-closed CORS denies by default. Token-bucket rate limiting protects write endpoints from abuse. |
| **Logging** | Structured JSON + correlation IDs | CloudWatch is far more useful when logs are structured. Every request gets a UUID that flows through all log lines for that request. |
| **Input validation** | express-validator | Declarative field-level validation with a consistent 422 error shape on every POST/PUT endpoint. |
| **Dev tooling** | Cross-platform scripts (PS1 + SH) | Engineers use both Windows and Mac. Both scripts handle AWS SSO credential extraction for Terraform, port cleanup, and parallel server startup. |
| **Terraform** | Modular .tf files + OIDC IAM roles + optional WAF | Modular structure keeps each concern in its own file. GitHub Actions OIDC roles are provisioned by Terraform. WAF is included but disabled by default. |
| **Testing** | Jest unit + Playwright E2E scaffold | Unit tests mock all external calls and run in CI on every PR. Playwright E2E scaffold with MSAL mock helper is included so end-to-end tests can be added incrementally. Coverage thresholds are enforced. |
| **Documentation** | 6 MD files + `.blade/AGENT_INSTRUCTIONS.md` | README, ONBOARDING, DEPLOYMENT, SECURITY, TECHNICAL_DECISIONS, and RELEASE cover the full app lifecycle. The agent instructions file is what distinguishes BLADE from a plain template. |
