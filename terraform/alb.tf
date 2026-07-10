data "aws_lb" "shared" { name = "sre-outage-tool-alb" }
data "aws_lb_listener" "https" { load_balancer_arn = data.aws_lb.shared.arn port = 443 }

resource "aws_lb_target_group" "backend" {
  name        = "${var.project_name}-${var.environment}-tg"
  target_type = "lambda"
  health_check { enabled = true path = "/api/health" healthy_threshold = 2 unhealthy_threshold = 2 timeout = 5 interval = 30 matcher = "200" }
}
resource "aws_lambda_permission" "alb" { statement_id = "AllowExecutionFromALB" action = "lambda:InvokeFunction" function_name = aws_lambda_function.backend.function_name principal = "elasticloadbalancing.amazonaws.com" source_arn = aws_lb_target_group.backend.arn }
resource "aws_lb_target_group_attachment" "backend" { target_group_arn = aws_lb_target_group.backend.arn target_id = aws_lambda_function.backend.arn depends_on = [aws_lambda_permission.alb] }
resource "aws_lb_listener_certificate" "app" { listener_arn = data.aws_lb_listener.https.arn certificate_arn = aws_acm_certificate_validation.app.certificate_arn }
resource "aws_lb_listener_rule" "app" {
  listener_arn = data.aws_lb_listener.https.arn
  priority     = var.alb_listener_rule_priority
  action { type = "forward" target_group_arn = aws_lb_target_group.backend.arn }
  condition { host_header { values = [var.custom_domain_name] } }
}
