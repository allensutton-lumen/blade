# Upgrading an Existing App to BLADE Standards

Use this guide when bringing an existing Lumen AI app up to BLADE standards. Each section maps to a BLADE capability with a checklist of what "done" looks like.

---

## Agent prompt — paste this to start

Copy the block below into your agent chat, fill in the bracketed values, and the agent will work through the upgrade systematically.

```
I want to upgrade [APP NAME] to match the BLADE framework standards.
The repo is at [LOCAL PATH or GitHub URL].

BLADE is our standard framework for Lumen AI apps. Here is what it specifies:

**Tech stack**
- Frontend: React 19 + Vite + TypeScript
- Backend: Node/Express + TypeScript on AWS Lambda
- Auth: Azure AD MSAL (frontend) + JWKS JWT validation (backend)
- CSS: Chi design system (https://assets.ctl.io/chi/6.1.0/chi.css) + Lumen CSS vars
- Cloud: AWS (Lambda, ALB, Secrets Manager, DynamoDB optional, Route53, ACM, WAF optional)

**Backend middleware stack (in order)**
1. Helmet (security headers)
2. Fail-closed CORS (allowlist from FRONTEND_URL env var)
3. JSON body parser
4. Correlation ID middleware (UUID per request, X-Correlation-ID header)
5. Request logger (structured JSON)
6. Auth middleware (JWKS validation, attaches req.user)
7. App routes
8. Global error handler (last)

**Standards**
- Structured JSON logging with correlation IDs (no console.log in backend)
- express-validator on every POST/PUT, 422 error shape
- Token-bucket rate limiting (standardLimiter / strictLimiter)
- GitHub Actions CI/CD with OIDC (no static AWS keys)
- Jest unit tests with coverage thresholds; all external calls mocked
- Playwright E2E scaffold
- ESLint on both frontend and backend, TypeScript strict mode
- Cross-platform dev scripts (start-dev.ps1 + start-dev.sh)
- Modular Terraform with OIDC IAM roles and optional WAF
- AWS Secrets Manager for all secrets (no hardcoded values)
- 6 documentation files: README, ONBOARDING, DEPLOYMENT, SECURITY, TECHNICAL_DECISIONS, RELEASE

Please:
1. Analyse the existing app against each of these standards
2. Produce a prioritised list of gaps
3. Work through them one at a time, starting with the highest-impact items
4. Run lint and tests after each change
5. Commit each meaningful change separately with a clear message
6. Update the relevant documentation as you go
```

---

## Upgrade checklist

### CI/CD
- [ ] GitHub Actions CI workflow with `frontend-check` and `backend-check` jobs
- [ ] Dependency audit uses `--omit=dev --audit-level=high`
- [ ] Deploy workflow uses OIDC (no `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` secrets)
- [ ] Branch → GitHub Environment mapping (`dev` → `<app>-dev-01`, `prod` → `<app>-prod-01`)
- [ ] Branch protection on `main`, `dev`, `prod` requiring CI to pass

### Backend middleware
- [ ] Helmet installed and configured
- [ ] CORS is fail-closed (deny by default, explicit allowlist)
- [ ] Correlation ID middleware generating UUID per request
- [ ] Structured JSON request logger using correlation ID
- [ ] Rate limiting on all routes; strict limiter on write endpoints
- [ ] express-validator on every POST/PUT; returns 422 with structured errors
- [ ] Global error handler as last middleware
- [ ] No `console.log` — all logging through structured logger utility

### Authentication
- [ ] Frontend uses `@azure/msal-browser` + `@azure/msal-react`
- [ ] Azure config served from `/api/config` (not hardcoded in frontend)
- [ ] Backend validates JWT with `jsonwebtoken` + `jwks-rsa` against Azure JWKS endpoint
- [ ] Group-based authorization middleware (`authorize`, `authorizeAdmin`)
- [ ] `SKIP_AUTH=true` dev bypass is blocked when `IS_LAMBDA=true`

### AWS / Infrastructure
- [ ] All secrets in AWS Secrets Manager (no plaintext in env vars or code)
- [ ] Terraform is modular (separate `.tf` files per concern)
- [ ] GitHub Actions OIDC roles in `terraform/iam.tf`
- [ ] WAF resource present (even if disabled by default)
- [ ] `deploy.ps1` + `deploy.sh` extract SSO credentials from CLI cache for Terraform

### Frontend
- [ ] React 19 + Vite + TypeScript
- [ ] Chi design system loaded via CDN in `index.html`
- [ ] Lumen CSS custom properties defined in `index.css`
- [ ] ESLint configured with TypeScript rules
- [ ] `tsconfig.json` uses strict mode

### Testing
- [ ] Backend: Jest with coverage thresholds (statements/branches/functions/lines)
- [ ] Backend: All external calls mocked (no real AWS, HTTP, or DB calls in tests)
- [ ] Frontend: Vitest or Jest unit tests
- [ ] E2E: Playwright config present with MSAL mock helper
- [ ] CI runs all tests on every PR

### Dev tooling
- [ ] `start-dev.ps1` — Windows one-command startup with SSO check
- [ ] `start-dev.sh` — Mac/Linux equivalent
- [ ] Port management (free ports before starting)
- [ ] `.env.example` documents all required variables

### Documentation
- [ ] `README.md` — overview, quick start, architecture, env vars
- [ ] `ONBOARDING.md` — new engineer setup (under 30 min)
- [ ] `DEPLOYMENT.md` — deploy steps, first-time Terraform bootstrap
- [ ] `SECURITY.md` — auth model, secrets, WAF, rate limiting
- [ ] `TECHNICAL_DECISIONS.md` — decisions made (from tech stack discussion)
- [ ] `RELEASE.md` — changelog
