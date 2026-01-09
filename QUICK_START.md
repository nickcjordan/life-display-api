# Quick Start Guide

## Prerequisites

✅ Node.js 18+
✅ Terraform 1.6+
✅ AWS CLI configured
✅ OpenWeatherMap API key ([Get one free here](https://openweathermap.org/api))

## Deployment in 5 Steps

### 1. Get Your OpenWeatherMap API Key

1. Go to https://openweathermap.org/api
2. Sign up for free account
3. Navigate to API keys section
4. Copy your API key

### 2. Configure

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and paste your API key:
```hcl
openweather_api_key = "paste-your-key-here"
```

### 3. Install Dependencies

```bash
cd ../lambda
npm install
cd ..
```

### 4. Deploy

```bash
bash scripts/deploy.sh
```

This will:
- Build TypeScript Lambda code
- Create AWS resources (Lambda, API Gateway, CloudWatch)
- Output your API endpoints

### 5. Test

```bash
# Get the URLs
cd terraform
terraform output weather_endpoint
terraform output time_endpoint

# Test weather endpoint
curl $(terraform output -raw weather_endpoint)

# Test time endpoint
curl $(terraform output -raw time_endpoint)
```

## Your API Endpoints

After deployment, you'll have two endpoints:

**Weather**: `https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/weather`
**Time**: `https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/time`

## Update ESP32 Firmware

In your ESP32 code, set:

```cpp
// In secrets.h or config file
#define API_BASE_URL "https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod"

// To get weather data
String weatherUrl = String(API_BASE_URL) + "/weather";

// To get time data
String timeUrl = String(API_BASE_URL) + "/time";
```

## Updating the API

### Update Lambda Code

```bash
cd lambda
# Make your changes to src/**/*.ts
npm run build
cd ../terraform
terraform apply -target=aws_lambda_function.config_handler
```

### Update Location/Config

Edit `terraform/terraform.tfvars`:
```hcl
latitude      = "YOUR_LAT"
longitude     = "YOUR_LON"
location_name = "Your City"
timezone      = "America/Your_Timezone"
```

Then:
```bash
cd terraform
terraform apply
```

## Monitoring

View logs in real-time:
```bash
aws logs tail /aws/lambda/life-display-api-handler --follow
```

## Cost

**Monthly cost**: ~$0.03 (essentially free)
- API Gateway: $3.50 per million requests
- Lambda: Free tier covers typical usage
- No DynamoDB costs

## Cleanup

To destroy all AWS resources:
```bash
cd terraform
terraform destroy
```

## Troubleshooting

**"npm: command not found"**: Install Node.js from https://nodejs.org

**"terraform: command not found"**: Install Terraform from https://terraform.io/downloads

**"Error: Invalid API key"**: Check that you copied the correct key from OpenWeatherMap

**API returns 500**: Check logs with `aws logs tail /aws/lambda/life-display-api-handler --follow`

## Support

- [Full Documentation](README.md)
- [Refactor Summary](REFACTOR_SUMMARY.md)
- [OpenWeatherMap API Docs](https://openweathermap.org/api/one-call-3)
