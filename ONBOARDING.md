# Onboarding

## Prerequisites

- Node.js 22+
- npm 10+
- AWS CLI v2
- Terraform 1.6+
- GitHub CLI (`gh`)

## AWS SSO setup

```powershell
aws configure sso --profile AWSAdmin-396304931560
aws configure sso --profile AWSAdmin-111491017663
aws sso login --profile AWSAdmin-396304931560
```

## Clone and bootstrap

```powershell
git clone https://github.com/CenturyLink/blade.git
cd blade
Copy-Item .env.example .env
cd frontend; npm install; cd ..
cd backend; npm install; cd ..
```

## Run locally

```powershell
./start-dev.ps1
```

## Validate

```powershell
cd frontend
npm run lint
npm test
npx tsc --noEmit
cd ..ackend
npm run lint
npm test
npx tsc --noEmit
```
