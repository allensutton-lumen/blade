output "application_url" { value = "https://${var.custom_domain_name}" description = "Application URL" }
output "backend_lambda_name" { value = aws_lambda_function.backend.function_name description = "Backend Lambda name" }
output "dynamodb_table_name" { value = aws_dynamodb_table.app_data.name description = "Template DynamoDB table" }
output "github_actions_role_arn_dev" { value = aws_iam_role.github_actions_dev.arn description = "Add this as AWS_ROLE_ARN in GitHub environment blade-dev-01" }
output "github_actions_role_arn_prod" { value = length(aws_iam_role.github_actions_prod) > 0 ? aws_iam_role.github_actions_prod[0].arn : "n/a (only in prod workspace)" description = "Add this as AWS_ROLE_ARN in GitHub environment blade-prod-01" }
output "waf_arn" { value = var.enable_waf ? aws_wafv2_web_acl.shared_alb[0].arn : null description = "Optional WAF ARN" }
