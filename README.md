# BLADE

**Blueprint for Lumen AI-Driven Engineering** — a production-ready GitHub template for Lumen AI-developed applications.

## What is BLADE?

BLADE is the standard starting point for Lumen internal apps that need React + Vite + TypeScript, an Express + TypeScript backend on AWS Lambda, Azure AD auth, structured logging, validation, Terraform, and GitHub Actions OIDC deployment.

## Quick Start

```powershell
git clone https://github.com/CenturyLink/blade.git
cd blade
Copy-Item .env.example .env
cd frontend; npm install; cd ..
cd backend; npm install; cd ..
./start-dev.ps1
```

## Architecture diagram

```text
Browser (React + MSAL)
  -> /api/* with Azure AD token
Express API (Lambda / local Node)
  -> helmet, CORS, correlation, request logging, auth, validation, rate limiting
AWS services
  -> Secrets Manager, Lambda, shared ALB, optional WAF, Route53, ACM, DynamoDB
```

## Customization guide

Change these first for a new app:
1. `APP_NAME` and Terraform `project_name`
2. `terraform/terraform.tfvars.*`
3. `TECHNICAL_DECISIONS.md`
4. placeholder routes in `backend/src/app.ts`
5. placeholder frontend content in `frontend/src/App.tsx`
6. Azure AD group IDs and secret paths

## Local dev

- Backend: `http://localhost:3001`
- Frontend: `http://localhost:5173`
- Copy `.env.example` to `.env`
- Set `SKIP_AUTH=true` for local-only bypass

## Deploy

- Windows: `./deploy.ps1 -Environment dev`
- macOS/Linux: `./deploy.sh --environment dev`
- GitHub environments: `blade-dev-01`, `blade-prod-01`

## Environment variables reference

| Variable | Purpose |
|---|---|
| `APP_NAME` | Human-friendly application name |
| `PORT` | Local backend port |
| `FRONTEND_URL` | CORS allowlist origin |
| `SKIP_AUTH` | Local-only auth bypass |
| `SECRET_PATH_AZURE` | Secrets Manager path for Azure AD settings |
| `LUMEN_AZURE_TENANT_ID` | Local tenant override |
| `BLADE_AZURE_CLIENT_ID` | Local client ID override |
| `AUTHORIZED_USERS_GROUP_ID` | Standard-user group |
| `AUTHORIZED_ADMINS_GROUP_ID` | Admin group |
| `DEV_AWS_PROFILE` | AWS SSO profile for local development |
