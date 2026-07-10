resource "aws_wafv2_web_acl" "shared_alb" {
  count       = var.enable_waf ? 1 : 0
  name        = "${var.project_name}-${var.environment}-waf"
  description = "Optional WAF for the shared BLADE ALB entrypoint"
  scope       = "REGIONAL"
  default_action { allow {} }
  rule {
    name     = "rate-limit-per-ip"
    priority = 1
    action { block {} }
    statement { rate_based_statement { limit = 300 aggregate_key_type = "IP" } }
    visibility_config { cloudwatch_metrics_enabled = true metric_name = "${var.project_name}-${var.environment}-rate-limit" sampled_requests_enabled = true }
  }
  rule {
    name     = "aws-managed-core"
    priority = 2
    override_action { none {} }
    statement { managed_rule_group_statement { name = "AWSManagedRulesCommonRuleSet" vendor_name = "AWS" } }
    visibility_config { cloudwatch_metrics_enabled = true metric_name = "${var.project_name}-${var.environment}-core-rules" sampled_requests_enabled = true }
  }
  visibility_config { cloudwatch_metrics_enabled = true metric_name = "${var.project_name}-${var.environment}-waf" sampled_requests_enabled = true }
}
resource "aws_cloudwatch_log_group" "waf" { count = var.enable_waf ? 1 : 0 name = "aws-waf-logs-${var.project_name}-${var.environment}" retention_in_days = 90 }
resource "aws_wafv2_web_acl_association" "shared_alb" { count = var.enable_waf ? 1 : 0 resource_arn = data.aws_lb.shared.arn web_acl_arn = aws_wafv2_web_acl.shared_alb[0].arn }
resource "aws_wafv2_web_acl_logging_configuration" "shared_alb" { count = var.enable_waf ? 1 : 0 log_destination_configs = [aws_cloudwatch_log_group.waf[0].arn] resource_arn = aws_wafv2_web_acl.shared_alb[0].arn }
