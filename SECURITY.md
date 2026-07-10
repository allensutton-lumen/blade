# Security

This document describes the security model for `<app-name>`. Update this file whenever the auth model, secrets approach, CORS config, security headers, or IAM posture changes.

---

## Authentication and authorization

- **Frontend:** Azure AD MSAL (`@azure/msal-browser`) — redirect flow. All routes except the MSAL callback require a valid session.
- **Backend:** JWKS JWT validation on every `/api/*` endpoint except `/api/health` and `/api/config`.
  - Token signature, expiry, audience, and issuer are all validated.
  - `SKIP_AUTH=true` is available for local development only — blocked when `AWS_LAMBDA_FUNCTION_NAME` is set.
- **Authorization:** Group-based. Users must belong to `AUTHORIZED_USERS_GROUP_ID`; admin operations require `AUTHORIZED_ADMINS_GROUP_ID`. Both IDs sourced from Secrets Manager at runtime.

---

## Secrets management

All credentials are stored in AWS Secrets Manager. No secrets are hardcoded or committed to the repo.

| Secret path | Contents |
|-------------|----------|
| `<app-name>/azure-config` | Azure AD `clientId`, `tenantId`, authorized group IDs |
| *(add rows as secrets are added)* | |

- Secrets are cached in-process with a ≤5-minute TTL to reduce API calls while picking up rotations promptly.
- `.env` is local-only and in `.gitignore`. `.env.example` contains placeholder strings only.

---

## Transport security

- All traffic is HTTPS. The ALB terminates TLS via ACM certificate (provisioned by Terraform).
- Lambda is in a private VPC subnet — not directly internet-accessible. All inbound traffic flows through the ALB.
- HTTP → HTTPS redirect is enforced at the ALB listener level.

---

## Security headers

Provided by [Helmet](https://helmetjs.github.io/) on every response:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer leakage |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Enforces HTTPS |
| `Content-Security-Policy` | Helmet defaults (tighten per app) | Prevents XSS / injection |
| `Permissions-Policy` | Helmet defaults | Restricts browser feature access |

---

## CORS

Fail-closed: `FRONTEND_URL` env var must be explicitly set to the deployed frontend origin. If unset, no cross-origin requests are accepted. `localhost` is allowed only when `NODE_ENV=development`.

---

## Input validation

All POST/PUT request bodies validated via `express-validator` before reaching handlers. Invalid payloads return HTTP 422 with a structured error — never a raw stack trace. User-provided content rendered in the frontend is sanitized with DOMPurify.

---

## Rate limiting

- `standardLimiter`: applied to all routes
- `strictLimiter`: applied to all write endpoints (POST/PUT/DELETE)
- WAF rate-based rule at ALB level (configured in `terraform/waf.tf`)

---

## WAF

AWS WAF deployed via `terraform/waf.tf` and associated with the ALB. Active rule sets:

- `AWSManagedRulesCommonRuleSet`
- `AWSManagedRulesSQLiRuleSet`
- `AWSManagedRulesKnownBadInputsRuleSet`
- Rate-based rule: *(set limit here)* requests per 5 minutes per IP

---

## Dependency security

`npm audit --audit-level=high --omit=dev` runs in CI on every PR. Dependabot is configured for weekly updates (`.github/dependabot.yml`).

---

## Observability and audit

- All requests include a correlation ID (`X-Correlation-ID`, UUID per request) logged on every line.
- Structured JSON logs shipped to CloudWatch Logs — retention: 90 days.
- Credentials, tokens, and PII are never logged. User input is CR/LF-stripped before logging.
- Unhandled exceptions return generic `500` to clients; full stack trace logged server-side.

---

## Threat model

| Threat | Mitigation |
|--------|-----------|
| Unauthenticated API access | JWKS JWT validation on all `/api/*` except `/health` and `/config` |
| Unauthorized resource access | Group membership check; ownership check before read/update/delete |
| Cross-origin requests | Fail-closed CORS — explicit allowlist only |
| Brute force / scraping | `standardLimiter` + `strictLimiter` + WAF rate-based rule |
| XSS / clickjacking | Helmet headers (CSP, X-Frame-Options); DOMPurify on user content |
| OWASP Top 10 / SQL injection | AWS WAF managed rule sets |
| Hardcoded secrets | Secrets Manager only; CI audit + GitHub secret scanning |
| Credential compromise | Short-lived SSO tokens; ≤5-min secret cache ensures rotation propagates |
| Log injection | CR/LF stripped from all user-provided input before logging |
| Supply chain (CI actions) | All GitHub Actions pinned to commit SHA |
| *(add app-specific threats)* | |
