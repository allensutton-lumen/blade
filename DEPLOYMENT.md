# Deployment Guide

## Environments

- Dev default account: `396304931560`
- Prod default account: `111491017663`
- GitHub environments: `blade-dev-01`, `blade-prod-01`

## First-time bootstrap

1. Fill in real values in `terraform/terraform.tfvars.dev` and `terraform/terraform.tfvars.prod`.
2. Confirm the GitHub OIDC provider exists in each AWS account.
3. Apply the GitHub Actions role first.

```powershell
cd terraform
terraform init -reconfigure -backend-config=backend-dev.tfbackend
terraform apply -var-file=terraform.tfvars.dev -target=aws_iam_role.github_actions_dev -target=aws_iam_role_policy.github_actions_dev
```

## Local deploy

```powershell
./deploy.ps1 -Environment dev
./deploy.ps1 -Environment prod
```

## CI deploy flow

- Push to `dev` -> `blade-dev-01`
- Push to `prod` -> `blade-prod-01`
- GitHub Actions authenticates with AWS using OIDC
