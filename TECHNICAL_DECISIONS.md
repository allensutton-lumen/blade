# Technical Decisions

## Framework defaults

### Frontend: React 19 + Vite + TypeScript
**Decision:** Use React 19 with Vite and strict TypeScript.

**Rationale:** Fast development, strong typing, and simple AI-assisted iteration.

### Backend: Express + TypeScript on AWS Lambda
**Decision:** Use Express 5 wrapped by `serverless-http`.

**Rationale:** Shared Node/TypeScript stack and easy local/Lambda parity.

### Authentication: Azure AD JWT + JWKS
**Decision:** Frontend uses MSAL; backend validates tokens with Azure AD JWKS.

**Rationale:** Aligns with Lumen SSO and keeps the backend stateless.

### Authorization: Azure AD groups
**Decision:** Standard user/admin authorization is enforced via group membership.

### Runtime config delivery
**Decision:** Frontend auth configuration is served by `GET /api/config`.

### Secrets management
**Decision:** Use AWS Secrets Manager for Azure and integration credentials.

### Design system
**Decision:** Use Chi via CDN (`https://assets.ctl.io/chi/6.1.0/chi.css`).

### Security middleware
**Decision:** Helmet + fail-closed CORS + correlation IDs + structured request logging + rate limiting.

### Validation
**Decision:** Use `express-validator` for all request validation.

### Logging
**Decision:** Use structured JSON logging with correlation IDs.

### CI/CD
**Decision:** Use GitHub Actions with OIDC into AWS.

### Infrastructure
**Decision:** Terraform provisions Lambda, ALB integration, Route53, ACM, DynamoDB, IAM, and optional WAF.

## App-specific decisions

### App name
- Human-readable name:
- Terraform/project slug:
- Domain(s):

### Integrations
- Primary upstream systems:
- Lumen systems involved:
- External dependencies:

### Data storage
- Required persistence:
- Record model:
- Retention/audit needs:

### Deviations from framework defaults
- List any intentional deviations here with rationale.
