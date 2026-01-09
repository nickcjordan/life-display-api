variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "life-display-api"
}

variable "lambda_memory_size" {
  description = "Lambda function memory in MB"
  type        = number
  default     = 256
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "enable_cors" {
  description = "Enable CORS on API Gateway"
  type        = bool
  default     = true
}

variable "cors_allow_origins" {
  description = "CORS allowed origins"
  type        = string
  default     = "*"
}

# Weather and Location Configuration
variable "openweather_api_key" {
  description = "OpenWeatherMap API key"
  type        = string
  sensitive   = true
}

variable "latitude" {
  description = "Latitude for weather location (Plano, TX)"
  type        = string
  default     = "33.0198"
}

variable "longitude" {
  description = "Longitude for weather location (Plano, TX)"
  type        = string
  default     = "-96.6989"
}

variable "location_name" {
  description = "Display name for location"
  type        = string
  default     = "Plano, TX"
}

variable "timezone" {
  description = "IANA timezone identifier"
  type        = string
  default     = "America/Chicago"
}
