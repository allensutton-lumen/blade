resource "aws_security_group" "lambda" {
  name        = "${var.project_name}-${var.environment}-lambda-sg"
  description = "BLADE Lambda security group"
  vpc_id      = var.vpc_id
  egress { from_port = 443 to_port = 443 protocol = "tcp" cidr_blocks = ["0.0.0.0/0"] description = "HTTPS outbound" }
}

resource "aws_lambda_function" "backend" {
  filename         = var.backend_zip_path
  function_name    = "${var.project_name}-${var.environment}"
  role             = aws_iam_role.lambda.arn
  handler          = "dist/lambda.handler"
  runtime          = var.lambda_runtime
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout
  source_code_hash = filebase64sha256(var.backend_zip_path)

  vpc_config { subnet_ids = var.private_subnet_ids security_group_ids = [aws_security_group.lambda.id] }

  environment {
    variables = {
      NODE_ENV                   = "production"
      IS_LAMBDA                  = "true"
      APP_NAME                   = var.app_name
      SERVICE_NAME               = "blade-backend"
      FRONTEND_URL               = var.frontend_url
      SECRET_PATH_AZURE          = var.secret_path_azure
      AUTHORIZED_USERS_GROUP_ID  = var.authorized_users_group_id
      AUTHORIZED_ADMINS_GROUP_ID = var.authorized_admins_group_id
    }
  }

  logging_config { log_format = "JSON" application_log_level = "INFO" system_log_level = "INFO" }
}

resource "aws_cloudwatch_log_group" "backend" { name = "/aws/lambda/${aws_lambda_function.backend.function_name}" retention_in_days = 30 }
