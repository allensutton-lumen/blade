# BLADE

**Blueprint for Lumen AI-Driven Engineering** — a production-ready GitHub template for Lumen AI-developed applications.

## What is BLADE?

BLADE is the standard starting point for Lumen internal apps built with AI agents (GitHub Copilot, etc.). It encodes the best practices observed across several production Lumen SRE apps, provides a working skeleton you can deploy on day one, and — critically — includes agent instructions that guide the AI through a tech stack discussion before writing a single line of app-specific code.

The defaults below represent the best-of-breed choices across the apps surveyed when BLADE was created. They are **defaults, not mandates** — the agent instructions explain when and how to deviate.

## BLADE's own decisions — and why

These are the choices made for BLADE itself, documented as an example of what a completed `TECHNICAL_DECISIONS.md` looks like.

| Area | Decision | Rationale |
|------|----------|-----------|
| **Frontend** | React 19 + Vite + TypeScript | Used in 3 of 4 surveyed apps. Faster build than Angular (Vite vs webpack), more universal skillset, strong AI tooling support. Angular was the outlier and added framework-specific complexity without benefit for most app types. |
| **Backend** | Node/Express + TypeScript | Keeps the full stack in one language (TypeScript), reducing context switching. Express is familiar, minimal, and well-understood by Copilot. Python/FastAPI is better for ML-heavy workloads — use it then. |
| **Auth** | Azure AD MSAL + JWKS | Lumen SSO standard. MSAL handles the browser-side OAuth2 flow; JWKS validation keeps the backend stateless. All surveyed apps used this pattern. |
| **Runtime config** | `/api/config` endpoint | Serves Azure tenant/client IDs to the frontend at runtime from Secrets Manager. Avoids hardcoding IDs in frontend bundles or Vite env vars. |
| **Data storage** | No DB by default; DynamoDB if needed | Many Lumen tools don't need persistence — they query external systems (ServiceNow, AppDynamics, etc.). DynamoDB is the natural fit for serverless Lambda apps when persistence is needed. SQLite is a valid alternative for low-volume, read-heavy tools running on a persistent host. |
| **Secrets** | AWS Secrets Manager | All surveyed apps use it. Avoids plaintext secrets in env vars, works well with Lambda, easy IAM-scoped access. |
| **CSS/Branding** | Chi design system | Lumen's official design system. One of the surveyed apps (wave_path_comp) used it — it is the correct on-brand choice. Other apps used ad-hoc Lumen color vars which is the next-best option. Angular Material (used in the outage tool) is not Lumen-branded. |
| **CI/CD** | GitHub Actions + OIDC | OIDC eliminates long-lived AWS access keys in GitHub secrets — a significant security improvement over static keys used in older apps. Outage tool pioneered this pattern; BLADE adopts it as the default. |
| **Security middleware** | Helmet + fail-closed CORS + rate limiting | Helmet from the outage tool; fail-closed CORS and token-bucket rate limiting from the GCR dashboard (most hardened of the surveyed apps). WAF optional via Terraform variable. |
| **Logging** | Structured JSON + correlation IDs | Outage tool introduced this. CloudWatch works far better with structured JSON — you can filter/query logs by correlationId, level, or any field. `console.log` is not acceptable in Lambda. |
| **Input validation** | express-validator | Provides declarative field-level validation and a standard 422 error shape. Consistent across all Express endpoints. |
| **Dev tooling** | PS1 + SH cross-platform scripts | Wave path comp had both — engineers use both Windows and Mac. SSO credential extraction from CLI cache (from outage tool) solves the Terraform + SSO incompatibility. |
| **Terraform** | Modular .tf files + OIDC IAM roles + optional WAF | Outage tool has the most complete Terraform (OIDC roles, modular structure). GCR dashboard adds WAF. Combined here. |
| **Testing** | Jest unit + Playwright E2E | Wave path comp had the most complete test setup. Unit tests mock all external calls; E2E tests use Playwright with MSAL mocking. Coverage thresholds enforced. |
| **Docs** | 6 MD files + `.forge/AGENT_INSTRUCTIONS.md` | Outage tool had the most complete documentation (7 MD files). README, ONBOARDING, DEPLOYMENT, SECURITY, TECHNICAL_DECISIONS, RELEASE cover the full lifecycle. |

## Quick Start

```powershell
git clone https://github.com/allensutton-lumen/blade.git my-app
cd my-app
# Read .forge/AGENT_INSTRUCTIONS.md before doing anything else
# Then start a tech stack discussion with your AI agent
```

## Architecture

```text
Browser (React + MSAL)
  -> /api/* with Azure AD token
Express API (Lambda / local Node)
  -> helmet, CORS, correlation, request logging, auth, validation, rate limiting
AWS services
  -> Secrets Manager, Lambda, shared ALB, optional WAF, Route53, ACM, DynamoDB (optional)
```

## Customization guide

For each new app:
1. Run the tech stack discussion (see `.forge/AGENT_INSTRUCTIONS.md`)
2. Fill in `TECHNICAL_DECISIONS.md` with decisions made
3. Update `APP_NAME` and `project_name` in `terraform/terraform.tfvars.*`
4. Add app-specific routes in `backend/src/app.ts`
5. Add app-specific content in `frontend/src/App.tsx`
6. Update Azure AD group IDs and secret paths in `.env.example`
7. Bootstrap Terraform (see `DEPLOYMENT.md`)

## Local dev

- Backend: `http://localhost:3001`
- Frontend: `http://localhost:5173`
- Copy `.env.example` to `.env`
- Windows: `./start-dev.ps1` — handles AWS SSO, port cleanup, spawns both servers
- Mac/Linux: `./start-dev.sh`
- Set `SKIP_AUTH=true` for local-only auth bypass

## Deploy

- Windows: `./deploy.ps1 -Environment dev`
- macOS/Linux: `./deploy.sh --environment dev`
- GitHub environments: `blade-dev-01`, `blade-prod-01`
- See `DEPLOYMENT.md` for first-time Terraform bootstrap steps

## Environment variables reference

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

