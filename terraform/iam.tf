resource "aws_iam_role" "lambda" {
  name = "${var.project_name}-${var.environment}-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Effect = "Allow", Principal = { Service = "lambda.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" { role = aws_iam_role.lambda.name policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" }
resource "aws_iam_role_policy_attachment" "lambda_vpc" { role = aws_iam_role.lambda.name policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole" }
resource "aws_iam_role_policy" "lambda_app" {
  name = "${var.project_name}-${var.environment}-lambda-inline"
  role = aws_iam_role.lambda.id
  policy = jsonencode({ Version = "2012-10-17", Statement = [{ Sid = "SecretsManagerRead", Effect = "Allow", Action = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"], Resource = "*" }] })
}

data "aws_iam_openid_connect_provider" "github" { url = "https://token.actions.githubusercontent.com" }

locals {
  github_actions_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      { Sid = "TerraformState", Effect = "Allow", Action = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket", "s3:GetBucketVersioning"], Resource = ["arn:aws:s3:::${var.terraform_state_bucket}", "arn:aws:s3:::${var.terraform_state_bucket}/*"] },
      { Sid = "Lambda", Effect = "Allow", Action = ["lambda:*"], Resource = "*" },
      { Sid = "IAMAndOIDC", Effect = "Allow", Action = ["iam:PassRole", "iam:GetRole", "iam:CreateRole", "iam:DeleteRole", "iam:AttachRolePolicy", "iam:DetachRolePolicy", "iam:PutRolePolicy", "iam:DeleteRolePolicy", "iam:GetRolePolicy", "iam:ListRolePolicies", "iam:ListAttachedRolePolicies", "iam:GetPolicy", "iam:GetPolicyVersion", "iam:ListPolicyVersions", "iam:CreatePolicy", "iam:DeletePolicy", "iam:ListOpenIDConnectProviders", "iam:GetOpenIDConnectProvider", "iam:CreateOpenIDConnectProvider", "iam:DeleteOpenIDConnectProvider", "iam:TagRole", "iam:UntagRole", "iam:TagPolicy", "iam:TagOpenIDConnectProvider"], Resource = "*" },
      { Sid = "DescribeEC2AndELB", Effect = "Allow", Action = ["ec2:Describe*", "elasticloadbalancing:*"], Resource = "*" },
      { Sid = "SecretsManager", Effect = "Allow", Action = ["secretsmanager:*"], Resource = "*" },
      { Sid = "CloudWatch", Effect = "Allow", Action = ["logs:*", "cloudwatch:*"], Resource = "*" },
      { Sid = "DynamoDB", Effect = "Allow", Action = ["dynamodb:*"], Resource = "*" },
      { Sid = "CertificatesAndDNS", Effect = "Allow", Action = ["acm:*", "route53:*"], Resource = "*" },
      { Sid = "WAF", Effect = "Allow", Action = ["wafv2:*"], Resource = "*" },
      { Sid = "ReadS3", Effect = "Allow", Action = ["s3:Get*", "s3:List*"], Resource = "*" }
    ]
  })
}

resource "aws_iam_role" "github_actions_dev" {
  name        = "GitHubActions-blade-dev"
  description = "Assumed by GitHub Actions for CenturyLink/blade dev deployments"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Effect = "Allow", Principal = { Federated = data.aws_iam_openid_connect_provider.github.arn }, Action = "sts:AssumeRoleWithWebIdentity", Condition = { StringEquals = { "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com" }, StringLike = { "token.actions.githubusercontent.com:sub" = "repo:CenturyLink/blade:*" } } }]
  })
}
resource "aws_iam_role_policy" "github_actions_dev" { name = "blade-deploy-policy-dev" role = aws_iam_role.github_actions_dev.id policy = local.github_actions_policy }

resource "aws_iam_role" "github_actions_prod" {
  count       = var.environment == "prod" ? 1 : 0
  name        = "GitHubActions-blade-prod"
  description = "Assumed by GitHub Actions for CenturyLink/blade prod deployments"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Effect = "Allow", Principal = { Federated = data.aws_iam_openid_connect_provider.github.arn }, Action = "sts:AssumeRoleWithWebIdentity", Condition = { StringEquals = { "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com" }, StringLike = { "token.actions.githubusercontent.com:sub" = "repo:CenturyLink/blade:ref:refs/heads/prod" } } }]
  })
}
resource "aws_iam_role_policy" "github_actions_prod" { count = var.environment == "prod" ? 1 : 0 name = "blade-deploy-policy-prod" role = aws_iam_role.github_actions_prod[0].id policy = local.github_actions_policy }
