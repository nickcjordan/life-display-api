# Life Display API

AWS serverless backend for ESP32 e-ink display. Provides weather and time data formatted for display.

## Architecture

- **API Gateway**: REST API with `/weather` and `/time` endpoints
- **Lambda**: TypeScript/Node.js 18.x function with OpenWeatherMap integration
- **Terraform**: Infrastructure as Code
- **No Database**: Configuration via environment variables

## Quick Start

See [QUICK_START.md](QUICK_START.md) for a 5-step deployment guide.

## Prerequisites

### 1. Node.js (v18 or later)

```bash
node --version  # Should be >= 18.0.0
```

**Installation**:
- **Windows**: Download from [nodejs.org](https://nodejs.org/)
- **Mac**: `brew install node@18` or download from nodejs.org
- **Linux**: `apt install nodejs npm` or `yum install nodejs`

### 2. Terraform (v1.6 or later)

```bash
terraform --version
```

**Installation**:
- **Windows**: `choco install terraform` or download from [terraform.io](https://www.terraform.io/downloads)
- **Mac**: `brew install terraform`
- **Linux**: Download binary from terraform.io

### 3. AWS CLI (v2)

```bash
aws --version
```

**Installation**:
- **Windows**: Download MSI installer from [aws.amazon.com/cli](https://aws.amazon.com/cli/)
- **Mac**: `brew install awscli`
- **Linux**: Follow instructions at aws.amazon.com/cli

### 4. AWS Account and Credentials

Configure AWS credentials:

```bash
aws configure
```

Enter:
- AWS Access Key ID: [Your access key]
- AWS Secret Access Key: [Your secret key]
- Default region name: `us-east-1`
- Default output format: `json`

Verify configuration:

```bash
aws sts get-caller-identity
```

### 5. OpenWeatherMap API Key

Sign up for a free account at [openweathermap.org/api](https://openweathermap.org/api) and get your API key.

## Deployment

### 1. Install Dependencies

```bash
# Install Lambda dependencies
cd lambda
npm install
cd ..
```

### 2. Configure

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and add your OpenWeatherMap API key:

```hcl
openweather_api_key = "your-api-key-here"
```

### 3. Deploy

```bash
bash scripts/deploy.sh
```

### 4. Test

```bash
# Get endpoint URLs
cd terraform
terraform output weather_endpoint
terraform output time_endpoint

# Test
curl $(terraform output -raw weather_endpoint)
```

## API Endpoints

### GET /weather

Returns complete weather display data including current conditions, hourly forecast (next 12 hours), and daily forecast (next 7 days).

**Example Request**:
```bash
curl https://YOUR_API_URL/prod/weather
```

**Response**:
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
  ],
  "timestamp": "2026-01-08T14:30:00Z"
}
```

**Weather Icons**:
- `clear-day` / `clear-night`
- `partly-cloudy-day` / `partly-cloudy-night`
- `cloudy`
- `rain`
- `thunderstorm`
- `snow`
- `fog`

### GET /time

Returns current time and date formatted for display.

**Example Request**:
```bash
curl https://YOUR_API_URL/prod/time
```

**Response**:
```json
{
  "viewType": "time",
  "greeting": "Good afternoon",
  "date": "Wednesday, January 8, 2026",
  "dayOfWeek": "Wednesday",
  "time": "2:30:45 PM",
  "time24h": "14:30:45",
  "timezone": "America/Chicago",
  "timestamp": "2026-01-08T14:30:45Z"
}
```

See [REFACTOR_SUMMARY.md](REFACTOR_SUMMARY.md) for more architectural details.

---

## ESP32 Integration Guide

### Overview

This API is designed to be consumed by ESP32 devices with e-ink displays. The device should:
1. Connect to WiFi
2. Make a single HTTPS GET request to either `/weather` or `/time`
3. Parse the JSON response
4. Render the data to the e-ink display
5. Disconnect WiFi and sleep until next update

### Getting Your API URL

After deploying with Terraform, get your API endpoints:

```bash
cd terraform
terraform output weather_endpoint
terraform output time_endpoint
```

Example URLs:
- Weather: `https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod/weather`
- Time: `https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod/time`

### ESP32 Configuration

In your ESP32 `secrets.h` or configuration file:

```cpp
// WiFi credentials
#define WIFI_SSID "your-wifi-ssid"
#define WIFI_PASSWORD "your-wifi-password"

// API endpoints (replace with your actual URLs from Terraform output)
#define WEATHER_API_URL "https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/weather"
#define TIME_API_URL "https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/time"

// API Key for authentication (get this from terraform output)
#define API_KEY "your-api-key-here"

// Update intervals (in seconds)
#define WEATHER_UPDATE_INTERVAL 3600  // 1 hour
#define TIME_UPDATE_INTERVAL 60       // 1 minute
```

**Getting your API Key:**
After deploying with Terraform, retrieve your API key:
```bash
cd terraform
terraform output -raw api_key_value
```

Store this key securely in your ESP32 `secrets.h` file.

### Making API Requests

#### Example: Fetching Weather Data

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

void fetchWeatherData() {
  HTTPClient http;

  // Configure request
  http.begin(WEATHER_API_URL);
  http.setTimeout(10000);  // 10 second timeout

  // Make GET request
  int httpCode = http.GET();

  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();

    // Parse JSON response
    DynamicJsonDocument doc(16384);  // Adjust size based on response
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
      // Extract weather data
      const char* viewType = doc["viewType"];  // "weather"
      const char* location = doc["location"];  // "Plano, TX"

      // Current weather
      int temperature = doc["current"]["temperature"];
      int feelsLike = doc["current"]["feelsLike"];
      const char* condition = doc["current"]["condition"];
      const char* icon = doc["current"]["icon"];
      int humidity = doc["current"]["humidity"];
      int windSpeed = doc["current"]["windSpeed"];
      const char* currentTime = doc["current"]["time"];

      // Hourly forecast (array of 12 hours)
      JsonArray hourly = doc["hourly"];
      for (JsonObject hour : hourly) {
        const char* time = hour["time"];      // "3:00 PM"
        int temp = hour["temperature"];        // 73
        int precip = hour["precipitation"];    // 10 (percentage)
        const char* hourIcon = hour["icon"];   // "partly-cloudy-day"
      }

      // Daily forecast (array of 7 days)
      JsonArray daily = doc["daily"];
      for (JsonObject day : daily) {
        const char* date = day["date"];           // "Mon, Jan 8"
        const char* dayOfWeek = day["dayOfWeek"]; // "Monday"
        int high = day["high"];                   // 78
        int low = day["low"];                     // 65
        const char* dayCondition = day["condition"];
        const char* dayIcon = day["icon"];
        int dayPrecip = day["precipitation"];
      }

      // Now render to display...
      renderWeatherDisplay(temperature, condition, icon, hourly, daily);
    }
  } else {
    Serial.printf("HTTP error: %d\n", httpCode);
  }

  http.end();
}
```

#### Example: Fetching Time Data

```cpp
void fetchTimeData() {
  HTTPClient http;

  http.begin(TIME_API_URL);
  http.setTimeout(10000);

  int httpCode = http.GET();

  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();

    DynamicJsonDocument doc(1024);  // Smaller doc for time data
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
      const char* viewType = doc["viewType"];      // "time"
      const char* greeting = doc["greeting"];      // "Good afternoon"
      const char* date = doc["date"];              // "Wednesday, January 8, 2026"
      const char* dayOfWeek = doc["dayOfWeek"];    // "Wednesday"
      const char* time = doc["time"];              // "2:30:45 PM"
      const char* time24h = doc["time24h"];        // "14:30:45"
      const char* timezone = doc["timezone"];      // "America/Chicago"

      // Render to display...
      renderTimeDisplay(greeting, date, time);
    }
  }

  http.end();
}
```

### JSON Response Structures

#### Weather Response Fields

```cpp
// Root level
doc["viewType"]     // String: "weather"
doc["location"]     // String: "Plano, TX"
doc["timezone"]     // String: "America/Chicago"
doc["timestamp"]    // String: ISO 8601 timestamp

// Current weather
doc["current"]["temperature"]  // Int: 72 (Fahrenheit)
doc["current"]["feelsLike"]    // Int: 70
doc["current"]["condition"]    // String: "partly cloudy"
doc["current"]["icon"]         // String: "partly-cloudy-day"
doc["current"]["humidity"]     // Int: 65 (percentage)
doc["current"]["windSpeed"]    // Int: 8 (mph)
doc["current"]["time"]         // String: "2:30 PM"

// Hourly forecast (array, 12 items)
doc["hourly"][i]["time"]          // String: "3:00 PM"
doc["hourly"][i]["hour"]          // Int: 15 (24-hour format)
doc["hourly"][i]["temperature"]   // Int: 73
doc["hourly"][i]["precipitation"] // Int: 10 (percentage)
doc["hourly"][i]["icon"]          // String: "partly-cloudy-day"

// Daily forecast (array, 7 items)
doc["daily"][i]["date"]          // String: "Mon, Jan 8"
doc["daily"][i]["dayOfWeek"]     // String: "Monday"
doc["daily"][i]["high"]          // Int: 78
doc["daily"][i]["low"]           // Int: 65
doc["daily"][i]["condition"]     // String: "partly cloudy"
doc["daily"][i]["icon"]          // String: "partly-cloudy-day"
doc["daily"][i]["precipitation"] // Int: 20 (percentage)
```

#### Time Response Fields

```cpp
doc["viewType"]     // String: "time"
doc["greeting"]     // String: "Good morning/afternoon/evening"
doc["date"]         // String: "Wednesday, January 8, 2026"
doc["dayOfWeek"]    // String: "Wednesday"
doc["time"]         // String: "2:30:45 PM" (12-hour format)
doc["time24h"]      // String: "14:30:45" (24-hour format)
doc["timezone"]     // String: "America/Chicago"
doc["timestamp"]    // String: ISO 8601 timestamp
```

### Weather Icon Mapping

The API returns simplified icon names. Map these to your e-ink display icons:

| Icon String | Description | Suggested Display |
|------------|-------------|-------------------|
| `clear-day` | Clear sky (day) | Sun icon |
| `clear-night` | Clear sky (night) | Moon icon |
| `partly-cloudy-day` | Partly cloudy (day) | Sun with cloud |
| `partly-cloudy-night` | Partly cloudy (night) | Moon with cloud |
| `cloudy` | Overcast | Cloud icon |
| `rain` | Rain | Rain drops |
| `thunderstorm` | Thunderstorm | Lightning bolt |
| `snow` | Snow | Snowflake |
| `fog` | Fog/mist | Fog icon |

### Recommended Update Strategy

```cpp
void loop() {
  // Connect WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }

  // Fetch data based on current view
  if (currentView == VIEW_WEATHER) {
    fetchWeatherData();
  } else if (currentView == VIEW_TIME) {
    fetchTimeData();
  }

  // Disconnect WiFi to save power
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);

  // Deep sleep until next update
  esp_sleep_enable_timer_wakeup(WEATHER_UPDATE_INTERVAL * 1000000);
  esp_deep_sleep_start();
}
```

### Error Handling

```cpp
if (httpCode == HTTP_CODE_OK) {
  // Success - parse and render
} else if (httpCode == 500) {
  // API error - show cached data or error message
  Serial.println("API server error");
} else if (httpCode == -1) {
  // Connection timeout - check WiFi
  Serial.println("Connection timeout");
} else {
  // Other error
  Serial.printf("HTTP error: %d\n", httpCode);
}
```

### Memory Considerations

**JSON Document Sizes**:
- Weather response: ~16KB (use `DynamicJsonDocument doc(16384)`)
- Time response: ~1KB (use `DynamicJsonDocument doc(1024)`)

If memory is tight, use `StaticJsonDocument` with appropriate size.

### Testing Your Integration

1. **Test with curl first**:
   ```bash
   curl https://YOUR_API_URL/prod/weather
   curl https://YOUR_API_URL/prod/time
   ```

2. **Verify JSON structure** matches the examples above

3. **Test ESP32 connection**:
   - Enable serial debugging
   - Check WiFi connection succeeds
   - Verify HTTP response code is 200
   - Print parsed values to serial monitor
   - Confirm display renders correctly

### Troubleshooting

**"Connection failed"**:
- Check WiFi credentials
- Verify ESP32 has internet access
- Confirm API URL is correct (no typos)

**"HTTP 500 error"**:
- Check API CloudWatch logs: `aws logs tail /aws/lambda/life-display-api-handler --follow`
- Verify OpenWeatherMap API key is valid
- Check Lambda hasn't timed out (increase timeout if needed)

**"JSON parse error"**:
- Increase `DynamicJsonDocument` size
- Verify response is valid JSON (test with curl)
- Check for network corruption (retry request)

**Display shows old data**:
- Verify update interval isn't too long
- Check deep sleep timer is configured correctly
- Ensure WiFi connects before fetching data

### Example Project Structure

```
esp32-display/
├── src/
│   ├── main.cpp
│   ├── api_client.cpp       # HTTP request handling
│   ├── weather_renderer.cpp # Render weather data
│   ├── time_renderer.cpp    # Render time data
│   └── display.cpp          # E-ink display driver
├── include/
│   ├── secrets.h            # WiFi & API URLs
│   └── config.h             # Update intervals, pins
└── platformio.ini
```

### Dependencies

Required libraries for ESP32:
- `WiFi.h` - Built-in WiFi
- `HTTPClient.h` - HTTP requests
- `ArduinoJson` v6+ - JSON parsing (install via PlatformIO/Arduino IDE)
- Your e-ink display library (e.g., GxEPD2, Adafruit GFX)

### Battery Life Optimization

- **Make one API call per wake cycle** (don't poll)
- **Disconnect WiFi immediately** after data fetch
- **Use deep sleep** between updates
- **Weather view**: Update every 30-60 minutes (API data refreshes hourly)
- **Time view**: Update every 1 minute (or use RTC for more frequent updates)

## Monitoring

```bash
aws logs tail /aws/lambda/life-display-api-handler --follow
```

## Cost

**Monthly**: ~$0.03 (essentially free within AWS free tier)

## Cleanup

```bash
cd terraform
terraform destroy
```

## Documentation

- [QUICK_START.md](QUICK_START.md) - 5-step deployment
- [REFACTOR_SUMMARY.md](REFACTOR_SUMMARY.md) - Architecture details
- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment guide

## License

MIT
