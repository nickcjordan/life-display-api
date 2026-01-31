# Life Display API

AWS serverless backend for ESP32 e-ink display.

## Deploying

### Prerequisites

- Node.js 18+, Terraform, AWS CLI configured
- OpenWeatherMap API key (free at [openweathermap.org/api](https://openweathermap.org/api))
- GNews API key (free at [gnews.io](https://gnews.io))

### Deploy Infrastructure + Lambda

Run from project root:

```powershell
.\scripts\deploy.ps1
```

This builds the Lambda, creates the deployment package, and applies Terraform.

### Deploy Lambda Code Only

If you only changed Lambda code (no infra changes):

```powershell
cd lambda
npm install && npm run build
cd ..
Compress-Archive -Path "lambda\dist\*" -DestinationPath "terraform\lambda.zip" -Force
cd terraform
terraform apply -target=aws_lambda_function.life_display_handler
```

### Get API Endpoints

```powershell
cd terraform
terraform output
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /weather` | Current conditions, 12-hour hourly forecast, 8-day daily forecast |
| `GET /time` | Current time, date, greeting (e.g., "Good afternoon") |
| `GET /news` | Top 10 news headlines |

All endpoints require the `x-api-key` header.

## Third-Party Services

| Service | Used For |
|---------|----------|
| [OpenWeatherMap One Call API 3.0](https://openweathermap.org/api/one-call-3) | Weather data |
| [GNews API](https://gnews.io) | News headlines |
