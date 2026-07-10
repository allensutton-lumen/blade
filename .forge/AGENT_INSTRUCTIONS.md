# BLADE Agent Instructions

BLADE (Blueprint for Lumen AI-Driven Engineering) is the standard template for Lumen AI-built apps. Treat this repo as a production-ready framework, not a toy starter.

## Before writing any code

1. **Read `TECHNICAL_DECISIONS.md` first.**
2. **Initiate a tech-stack discussion** covering data sources, auth, user volume, Lumen systems, environments, and Bedrock/AI needs.
3. **Document all decisions in `TECHNICAL_DECISIONS.md` before implementation begins.**
4. **Confirm the app name** before coding; it drives Terraform names, domains, and secret paths.

## During development

- Always use `backend/src/utils/logger.ts`; never `console.log` in backend production code.
- Reuse the middleware patterns in `backend/src/middleware/`.
- Every new service must have unit tests with all external calls mocked.
- Every POST/PUT endpoint must use `express-validator` plus `handleValidationErrors`.
- Run `npm run lint && npm test` in both `frontend/` and `backend/` before every commit.
- Run `npx tsc --noEmit` in both `frontend/` and `backend/` before merging.
- Update `TECHNICAL_DECISIONS.md` for architecture changes.
- Update `README.md` when setup changes.
- Update `RELEASE.md` for every PR.
- Keep `ONBOARDING.md` current.
- Remove dead code, unused imports, and unexplained `any`.

## Never

- Hardcode secrets, URLs, tenant IDs, or account IDs.
- Skip validation on POST/PUT endpoints.
- Commit with failing lint or tests.
- Touch real external systems in automated tests.

## Lumen-specific patterns

- Azure AD auth: use `middleware/auth.ts` and `middleware/authorize.ts`
- Secrets: use AWS Secrets Manager via `utils/secrets.ts`
- Domain naming: `<app-name>.<env>.ld.lumen.com`
- Default AWS accounts: dev=`396304931560`, prod=`111491017663` (document, but team mappings can vary)
- Branding: use Chi CSS from `https://assets.ctl.io/chi/6.1.0/chi.css`
