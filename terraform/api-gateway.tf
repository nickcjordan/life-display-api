# REST API
resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.project_name}-api"
  description = "API for ESP32 e-ink display"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# /weather resource
resource "aws_api_gateway_resource" "weather" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "weather"
}

# GET /weather
resource "aws_api_gateway_method" "get_weather" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.weather.id
  http_method   = "GET"
  authorization = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "get_weather" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.weather.id
  http_method             = aws_api_gateway_method.get_weather.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.config_handler.invoke_arn
}

# /time resource
resource "aws_api_gateway_resource" "time" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "time"
}

# GET /time
resource "aws_api_gateway_method" "get_time" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.time.id
  http_method   = "GET"
  authorization = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "get_time" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.time.id
  http_method             = aws_api_gateway_method.get_time.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.config_handler.invoke_arn
}

# OPTIONS for CORS on /weather (if enabled)
resource "aws_api_gateway_method" "options_weather" {
  count         = var.enable_cors ? 1 : 0
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.weather.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_weather" {
  count       = var.enable_cors ? 1 : 0
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.weather.id
  http_method = aws_api_gateway_method.options_weather[0].http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "options_weather" {
  count       = var.enable_cors ? 1 : 0
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.weather.id
  http_method = aws_api_gateway_method.options_weather[0].http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "options_weather" {
  count       = var.enable_cors ? 1 : 0
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.weather.id
  http_method = aws_api_gateway_method.options_weather[0].http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Api-Key'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${var.cors_allow_origins}'"
  }
}

# OPTIONS for CORS on /time (if enabled)
resource "aws_api_gateway_method" "options_time" {
  count         = var.enable_cors ? 1 : 0
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.time.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_time" {
  count       = var.enable_cors ? 1 : 0
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.time.id
  http_method = aws_api_gateway_method.options_time[0].http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "options_time" {
  count       = var.enable_cors ? 1 : 0
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.time.id
  http_method = aws_api_gateway_method.options_time[0].http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "options_time" {
  count       = var.enable_cors ? 1 : 0
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.time.id
  http_method = aws_api_gateway_method.options_time[0].http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Api-Key'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${var.cors_allow_origins}'"
  }
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.config_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# Deployment
resource "aws_api_gateway_deployment" "prod" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  depends_on = [
    aws_api_gateway_integration.get_weather,
    aws_api_gateway_integration.get_time,
  ]

  lifecycle {
    create_before_destroy = true
  }

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.weather.id,
      aws_api_gateway_method.get_weather.id,
      aws_api_gateway_integration.get_weather.id,
      aws_api_gateway_resource.time.id,
      aws_api_gateway_method.get_time.id,
      aws_api_gateway_integration.get_time.id,
    ]))
  }
}

# Stage
resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.prod.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = "prod"

  # Enable CloudWatch logging
  # NOTE: Commented out because it requires CloudWatch Logs role ARN to be set in account settings
  # You can still monitor via Lambda CloudWatch logs
  # access_log_settings {
  #   destination_arn = aws_cloudwatch_log_group.api_gateway_logs.arn
  #   format = jsonencode({
  #     requestId      = "$context.requestId"
  #     ip             = "$context.identity.sourceIp"
  #     caller         = "$context.identity.caller"
  #     user           = "$context.identity.user"
  #     requestTime    = "$context.requestTime"
  #     httpMethod     = "$context.httpMethod"
  #     resourcePath   = "$context.resourcePath"
  #     status         = "$context.status"
  #     protocol       = "$context.protocol"
  #     responseLength = "$context.responseLength"
  #   })
  # }
}

resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/${var.project_name}"
  retention_in_days = var.environment == "prod" ? 30 : 7
}

# Enable X-Ray tracing and metrics
resource "aws_api_gateway_method_settings" "all" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.prod.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled    = true
    # logging_level disabled because it requires CloudWatch Logs role ARN in account settings
    # logging_level      = var.environment == "prod" ? "INFO" : "ERROR"
    data_trace_enabled = var.environment != "prod"
  }
}

# API Key for authentication
resource "aws_api_gateway_api_key" "esp32_key" {
  name        = "${var.project_name}-esp32-key"
  description = "API key for ESP32 device authentication"
  enabled     = true
}

# Usage Plan with rate limiting
resource "aws_api_gateway_usage_plan" "esp32_usage_plan" {
  name        = "${var.project_name}-usage-plan"
  description = "Usage plan with rate limiting for ESP32 devices"

  api_stages {
    api_id = aws_api_gateway_rest_api.main.id
    stage  = aws_api_gateway_stage.prod.stage_name
  }

  # Rate limiting: 10 requests per second
  throttle_settings {
    burst_limit = 20   # Allow short bursts
    rate_limit  = 10   # 10 requests per second sustained
  }

  # Quota: 10,000 requests per day
  quota_settings {
    limit  = 10000
    period = "DAY"
  }
}

# Associate API key with usage plan
resource "aws_api_gateway_usage_plan_key" "esp32_key_association" {
  key_id        = aws_api_gateway_api_key.esp32_key.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.esp32_usage_plan.id
}
