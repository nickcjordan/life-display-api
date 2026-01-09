# API Refactor Summary

## What Changed

The API has been completely refactored to be simpler and more aligned with the ESP32 display use case.

### Before (Device Config Pattern)
- Complex DynamoDB schema for device configurations
- API returned configuration that told device what to do
- Device had to make additional API calls for weather, calendar, etc.

### After (View-Based Pattern) ✅
- **Simple endpoints**: `/weather` and `/time`
- **Smart API**: Fetches all external data (OpenWeatherMap) and returns ready-to-display payloads
- **Dumb Device**: ESP32 just renders what it receives
- **No Database**: Configuration via environment variables

## New Architecture

```
ESP32 → GET /weather → Lambda → OpenWeatherMap API → Returns formatted display data
ESP32 → GET /time    → Lambda → Returns current time/date
```

## API Endpoints

### GET /weather
Returns complete weather display data including:
- Current temperature, feels like, condition, icon
- Hourly forecast (next 12 hours)
- Daily forecast (next 7 days)
- Current time (for small clock on weather view)

**Example Response**:
```json
{
  "viewType": "weather",
  "location": "Plano, TX",
  "timezone": "America/Chicago",
  "current": {
    "temperature": 72,
    "feelsLike": 70,
    "condition": "partly cloudy",
    "icon": "partly-cloudy-day",
    "humidity": 65,
    "windSpeed": 8,
    "time": "2:30 PM"
  },
  "hourly": [
    {
      "time": "3:00 PM",
      "hour": 15,
      "temperature": 73,
      "precipitation": 10,
      "icon": "partly-cloudy-day"
    }
    // ... 11 more hours
  ],
  "daily": [
    {
      "date": "Mon, Jan 8",
      "dayOfWeek": "Monday",
      "high": 78,
      "low": 65,
      "condition": "partly cloudy",
      "icon": "partly-cloudy-day",
      "precipitation": 20
    }
    // ... 6 more days
  ]
}
```

### GET /time
Returns current time and date formatted for display.

**Example Response**:
```json
{
  "viewType": "time",
  "greeting": "Good afternoon",
  "date": "Wednesday, January 8, 2026",
  "dayOfWeek": "Wednesday",
  "time": "2:30:45 PM",
  "time24h": "14:30:45",
  "timezone": "America/Chicago"
}
```

## Files Changed

### Lambda Code (TypeScript)
**New Files:**
- `lambda/src/models/weather.ts` - Weather data types
- `lambda/src/models/time.ts` - Time data types
- `lambda/src/services/weather.service.ts` - OpenWeatherMap integration
- `lambda/src/services/time.service.ts` - Time/date formatting
- `lambda/src/handlers/weather.ts` - Weather endpoint handler
- `lambda/src/handlers/time.ts` - Time endpoint handler

**Updated:**
- `lambda/src/index.ts` - New routing for /weather and /time

**Removed:**
- All DynamoDB-related code
- Device config models and handlers
- Validation utilities (no longer needed)

### Terraform
**Updated:**
- `terraform/variables.tf` - New variables for OpenWeather API key, location, timezone
- `terraform/lambda.tf` - Removed DynamoDB IAM policy, updated environment variables
- `terraform/api-gateway.tf` - New /weather and /time endpoints (removed /config and /devices)
- `terraform/outputs.tf` - New outputs for weather and time endpoints
- `terraform/terraform.tfvars.example` - New configuration format

**Removed:**
- `terraform/dynamodb.tf` - No longer using DynamoDB

## Setup Instructions

### 1. Get OpenWeatherMap API Key

Sign up at https://openweathermap.org/api (free tier is fine)

### 2. Configure Terraform Variables

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and add your API key:
```hcl
openweather_api_key = "your-api-key-here"
```

The location is already set to Plano, TX. Update if needed.

### 3. Build and Deploy

```bash
cd lambda
npm install
npm run build
cd ..

# Deploy
bash scripts/deploy.sh
```

### 4. Test the Endpoints

```bash
# Get your API URL
cd terraform
terraform output weather_endpoint
terraform output time_endpoint

# Test weather
curl https://YOUR_API_URL/prod/weather

# Test time
curl https://YOUR_API_URL/prod/time
```

## Environment Variables

The Lambda function now uses these environment variables (set by Terraform):

- `OPENWEATHER_API_KEY` - Your OpenWeatherMap API key
- `LATITUDE` - 33.0198 (Plano, TX)
- `LONGITUDE` - -96.6989 (Plano, TX)
- `LOCATION_NAME` - "Plano, TX"
- `TIMEZONE` - "America/Chicago"
- `LOG_LEVEL` - "info" (prod) or "debug" (dev)

## Weather Icon Mapping

OpenWeatherMap icons are mapped to simplified names for ESP32:

- `clear-day`, `clear-night`
- `partly-cloudy-day`, `partly-cloudy-night`
- `cloudy`
- `rain`
- `thunderstorm`
- `snow`
- `fog`

## Next Steps

1. ✅ Deploy the refactored API
2. Update ESP32 firmware to call `/weather` or `/time` endpoints
3. Implement rendering logic for weather and time views on ESP32
4. Test end-to-end with actual device

## Notes

- **No authentication**: Still using no auth for personal/family use
- **Caching**: Consider adding Redis/ElastiCache if you want to cache weather data and reduce API calls
- **Rate limits**: OpenWeatherMap free tier allows 1,000 calls/day (plenty for hourly updates)
- **Cost**: Still essentially free (~$0.03/month for API Gateway)

## Troubleshooting

**Build fails**: Make sure you ran `npm install` in the `lambda/` directory

**API returns 500**: Check CloudWatch logs for Lambda errors. Most likely cause is missing or invalid OpenWeatherMap API key

**Weather data looks wrong**: Verify latitude/longitude in terraform.tfvars match your location

**Timezone issues**: Ensure timezone variable matches IANA format (e.g., "America/Chicago", not "CST")
