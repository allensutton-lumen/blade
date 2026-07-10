variable "aws_region" { description = "AWS region for the stack" type = string default = "us-east-2" }
variable "environment" { description = "Deployment environment" type = string }
variable "project_name" { description = "Short kebab-case name used for resource naming" type = string }
variable "app_name" { description = "Human-readable application name" type = string }
variable "frontend_url" { description = "Allowed frontend origin for API CORS" type = string }
variable "custom_domain_name" { description = "Route53/ALB hostname for the app" type = string }
variable "route53_zone_id" { description = "Hosted zone for ld.lumen.com subdomains" type = string }
variable "vpc_id" { description = "VPC ID for Lambda networking" type = string }
variable "private_subnet_ids" { description = "Private subnet IDs for Lambda" type = list(string) }
variable "routable_subnet_ids" { description = "Routable subnet IDs reserved for future use" type = list(string) default = [] }
variable "alb_listener_rule_priority" { description = "Unique shared ALB rule priority" type = number }
variable "lambda_runtime" { description = "Lambda runtime" type = string default = "nodejs22.x" }
variable "lambda_memory_size" { description = "Lambda memory size in MB" type = number default = 512 }
variable "lambda_timeout" { description = "Lambda timeout in seconds" type = number default = 30 }
variable "backend_zip_path" { description = "Relative path to the packaged backend zip" type = string default = "../backend/blade-backend.zip" }
variable "secret_path_azure" { description = "Secrets Manager path for Azure AD runtime config" type = string }
variable "authorized_users_group_id" { description = "Azure AD group id for standard users" type = string sensitive = true }
variable "authorized_admins_group_id" { description = "Azure AD group id for admins" type = string sensitive = true }
variable "enable_waf" { description = "Whether to create and attach a regional WAF to the shared ALB" type = bool default = true }
variable "terraform_state_bucket" { description = "Terraform state bucket used by GitHub Actions OIDC role" type = string default = "naas-sre-poc-terraform" }
variable "additional_tags" { description = "Extra tags applied to all resources" type = map(string) default = {} }
