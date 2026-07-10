# Security

## Auth model

- Frontend uses MSAL with Azure AD / Entra ID
- Backend validates JWTs against Azure AD JWKS
- Authorization is group-based
- `SKIP_AUTH=true` is blocked in Lambda

## Secrets management

- Runtime config comes from AWS Secrets Manager via `backend/src/utils/secrets.ts`
- Never hardcode secrets, tenant IDs, or webhook URLs

## Request protection

- Helmet security headers
- Fail-closed CORS
- Correlation IDs on every request
- Structured logging
- Token bucket + `express-rate-limit`
- Optional WAF in Terraform

## Validation

- Every POST/PUT route must use `express-validator`
- Invalid payloads return HTTP 422 with structured errors
