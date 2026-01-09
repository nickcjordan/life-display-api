output "api_endpoint" {
  description = "Base URL for API Gateway stage"
  value       = aws_api_gateway_stage.prod.invoke_url
}

output "api_gateway_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.main.id
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.config_handler.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.config_handler.arn
}

output "weather_endpoint" {
  description = "Weather API endpoint"
  value       = "${aws_api_gateway_stage.prod.invoke_url}/weather"
}

output "time_endpoint" {
  description = "Time API endpoint"
  value       = "${aws_api_gateway_stage.prod.invoke_url}/time"
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group for Lambda"
  value       = aws_cloudwatch_log_group.lambda_logs.name
}

output "api_key_id" {
  description = "API Key ID (use this to retrieve the key value)"
  value       = aws_api_gateway_api_key.esp32_key.id
}

output "api_key_value" {
  description = "API Key value for ESP32 device (SENSITIVE - store securely)"
  value       = aws_api_gateway_api_key.esp32_key.value
  sensitive   = true
}
