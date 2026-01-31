# IAM Role for Lambda execution
resource "aws_iam_role" "lambda_execution" {
  name = "${var.project_name}-lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# CloudWatch Logs policy
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Archive Lambda deployment package
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/dist"
  output_path = "${path.module}/.terraform/lambda-deployment.zip"
}

resource "aws_lambda_function" "config_handler" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.project_name}-handler"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "nodejs18.x"
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout

  environment {
    variables = {
      OPENWEATHER_API_KEY                 = var.openweather_api_key
      LATITUDE                            = var.latitude
      LONGITUDE                           = var.longitude
      LOCATION_NAME                       = var.location_name
      TIMEZONE                            = var.timezone
      GNEWS_API_KEY                       = var.gnews_api_key
      NEWS_COUNTRY                        = var.news_country
      NEWS_LANG                           = var.news_lang
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1" # Performance optimization
      LOG_LEVEL                           = var.environment == "prod" ? "info" : "debug"
    }
  }

  # Enable X-Ray tracing for debugging (optional)
  tracing_config {
    mode = var.environment == "prod" ? "Active" : "PassThrough"
  }
}

# CloudWatch Log Group with retention
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.config_handler.function_name}"
  retention_in_days = var.environment == "prod" ? 30 : 7
}
