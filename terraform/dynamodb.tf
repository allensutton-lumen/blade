resource "aws_dynamodb_table" "app_data" {
  name         = "${var.project_name}-${var.environment}-app-data"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"
  attribute { name = "pk" type = "S" }
  attribute { name = "sk" type = "S" }
  point_in_time_recovery { enabled = true }
  server_side_encryption { enabled = true }
}
