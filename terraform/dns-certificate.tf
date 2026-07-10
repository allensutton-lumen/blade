resource "aws_acm_certificate" "app" {
  domain_name       = var.custom_domain_name
  validation_method = "DNS"
  lifecycle { create_before_destroy = true }
}
resource "aws_route53_record" "cert_validation" {
  for_each = { for dvo in aws_acm_certificate.app.domain_validation_options : dvo.domain_name => { name = dvo.resource_record_name type = dvo.resource_record_type record = dvo.resource_record_value } }
  zone_id = var.route53_zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 300
  records = [each.value.record]
}
resource "aws_acm_certificate_validation" "app" { certificate_arn = aws_acm_certificate.app.arn validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn] }
resource "aws_route53_record" "app" {
  zone_id = var.route53_zone_id
  name    = var.custom_domain_name
  type    = "A"
  alias { name = data.aws_lb.shared.dns_name zone_id = data.aws_lb.shared.zone_id evaluate_target_health = false }
}
