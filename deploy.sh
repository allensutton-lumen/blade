#!/usr/bin/env bash
set -euo pipefail
ENVIRONMENT=""; SKIP_BUILD=false; SKIP_PLAN=false
while [[ $# -gt 0 ]]; do case "$1" in --environment) ENVIRONMENT="$2"; shift 2 ;; --skip-build) SKIP_BUILD=true; shift ;; --skip-plan) SKIP_PLAN=true; shift ;; *) echo "Usage: ./deploy.sh --environment <dev|prod> [--skip-build] [--skip-plan]" >&2; exit 1 ;; esac; done
[[ "$ENVIRONMENT" == "dev" || "$ENVIRONMENT" == "prod" ]] || exit 1
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$SKIP_BUILD" != "true" ]]; then
  (cd "$ROOT_DIR/frontend" && npm ci && npm run build)
  (cd "$ROOT_DIR/backend" && npm ci && npm run build)
  rm -rf "$ROOT_DIR/backend/dist/public"
  cp -R "$ROOT_DIR/frontend/dist" "$ROOT_DIR/backend/dist/public"
  (cd "$ROOT_DIR/backend" && zip -rq blade-backend.zip dist node_modules package.json package-lock.json)
fi
cd "$ROOT_DIR/terraform"
terraform init -reconfigure -backend-config="backend-${ENVIRONMENT}.tfbackend"
if [[ "$SKIP_PLAN" == "true" ]]; then terraform apply -var-file="terraform.tfvars.${ENVIRONMENT}" -auto-approve; else terraform plan -var-file="terraform.tfvars.${ENVIRONMENT}" -out=tfplan && terraform apply tfplan; fi
