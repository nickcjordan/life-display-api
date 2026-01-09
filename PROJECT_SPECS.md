# AWS API Specification for ESP32 E-Ink Dashboard

This document contains all the information needed to build the AWS API Gateway + Lambda backend that the ESP32 device communicates with.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [API Endpoints](#api-endpoints)
3. [Data Models](#data-models)
4. [Request/Response Examples](#requestresponse-examples)
5. [Infrastructure Setup](#infrastructure-setup)
6. [Security Considerations](#security-considerations)
7. [Testing](#testing)

---

## Architecture Overview

### Components
```
ESP32 Device → API Gateway → Lambda Function → DynamoDB
                                             ↓
                                        (Optional: S3 for logs)
```

### Technology Stack
- **API Gateway**: REST API with CORS enabled
- **Lambda**: Node.js 18.x or Python 3.11
- **DynamoDB**: Single table design for device configurations
- **IAM**: Lambda execution role with DynamoDB access

### Communication Flow
1. ESP32 boots and connects to WiFi
2. Makes HTTPS GET request to `/config/{deviceId}`
3. API Gateway routes to Lambda function
4. Lambda fetches device config from DynamoDB
5. Returns JSON configuration to device
6. Device disconnects WiFi and operates with cached config

---

## API Endpoints

### 1. Get Device Configuration

**Endpoint**: `GET /config/{deviceId}`

**Description**: Fetches the configuration for a specific device.

**Path Parameters**:
- `deviceId` (string, required): Unique identifier for the device (e.g., "esp32-001")

**Headers**:
- `Content-Type: application/json`

**Response**: 200 OK
```json
{
  "deviceId": "esp32-001",
  "currentView": "weather",
  "updateInterval": 3600,
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "city": "New York",
    "timezone": "America/New_York"
  },
  "preferences": {
    "temperatureUnit": "F",
    "displayIcons": true,
    "use24HourTime": false
  }
}
```

**Error Responses**:
- `404 Not Found`: Device ID not found in database
- `500 Internal Server Error`: Database or Lambda error

---

### 2. Update Device Configuration (Optional - Future)

**Endpoint**: `PUT /config/{deviceId}`

**Description**: Updates the configuration for a specific device.

**Path Parameters**:
- `deviceId` (string, required): Unique identifier for the device

**Headers**:
- `Content-Type: application/json`

**Request Body**:
```json
{
  "currentView": "weather",
  "updateInterval": 1800,
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "city": "New York",
    "timezone": "America/New_York"
  },
  "preferences": {
    "temperatureUnit": "F",
    "displayIcons": true,
    "use24HourTime": false
  }
}
```

**Response**: 200 OK
```json
{
  "deviceId": "esp32-001",
  "message": "Configuration updated successfully",
  "updatedAt": "2026-01-08T12:34:56Z"
}
```

---

### 3. List All Devices (Optional - Admin)

**Endpoint**: `GET /devices`

**Description**: Returns a list of all registered devices.

**Response**: 200 OK
```json
{
  "devices": [
    {
      "deviceId": "esp32-001",
      "lastSeen": "2026-01-08T12:00:00Z",
      "currentView": "weather"
    },
    {
      "deviceId": "esp32-002",
      "lastSeen": "2026-01-08T11:45:00Z",
      "currentView": "hello"
    }
  ]
}
```

---

## Data Models

### Device Configuration Object

```typescript
interface DeviceConfig {
  deviceId: string;              // Primary key
  currentView: string;            // "hello" | "weather" | "calendar" | etc.
  updateInterval: number;         // Seconds between auto-refresh (default: 3600)
  location: {
    latitude: number;             // Decimal degrees (e.g., 40.7128)
    longitude: number;            // Decimal degrees (e.g., -74.0060)
    city: string;                 // City name for display
    timezone: string;             // IANA timezone (e.g., "America/New_York")
  };
  preferences: {
    temperatureUnit: string;      // "C" | "F"
    displayIcons: boolean;        // Show weather icons (for future)
    use24HourTime: boolean;       // Time format preference
  };
  createdAt?: string;             // ISO 8601 timestamp
  updatedAt?: string;             // ISO 8601 timestamp
  lastSeen?: string;              // Last time device fetched config
}
```

### Default Configuration

If a device is not found in the database, return this default:

```json
{
  "deviceId": "unknown",
  "currentView": "hello",
  "updateInterval": 3600,
  "location": {
    "latitude": 0.0,
    "longitude": 0.0,
    "city": "Unknown",
    "timezone": "UTC"
  },
  "preferences": {
    "temperatureUnit": "F",
    "displayIcons": true,
    "use24HourTime": false
  }
}
```

---

## Request/Response Examples

### Example 1: Successful Config Fetch

**Request**:
```http
GET /prod/config/esp32-001 HTTP/1.1
Host: abc123def.execute-api.us-east-1.amazonaws.com
Content-Type: application/json
```

**Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "deviceId": "esp32-001",
  "currentView": "weather",
  "updateInterval": 3600,
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "city": "New York",
    "timezone": "America/New_York"
  },
  "preferences": {
    "temperatureUnit": "F",
    "displayIcons": true,
    "use24HourTime": false
  }
}
```

### Example 2: Device Not Found

**Request**:
```http
GET /prod/config/esp32-999 HTTP/1.1
Host: abc123def.execute-api.us-east-1.amazonaws.com
Content-Type: application/json
```

**Response**:
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "error": "Device not found",
  "deviceId": "esp32-999"
}
```

### Example 3: ESP32 Client Code (Reference)

This is how the ESP32 makes requests (from `src/network/APIClient.h`):

```cpp
HTTPClient http;
String url = apiBaseURL + "/config/" + deviceId;
// Example: "https://abc123.execute-api.us-east-1.amazonaws.com/prod/config/esp32-001"

http.begin(url);
http.setTimeout(10000);  // 10 second timeout
int httpCode = http.GET();

if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    // Parse JSON using ArduinoJson
    parseConfigResponse(payload, config);
}
```

---

## Infrastructure Setup

### DynamoDB Table

**Table Name**: `esp32-device-configs`

**Primary Key**:
- Partition Key: `deviceId` (String)

**Attributes**:
```
deviceId (S)              - Primary key
currentView (S)           - Current view name
updateInterval (N)        - Update interval in seconds
location (M)              - Map containing:
  ├─ latitude (N)
  ├─ longitude (N)
  ├─ city (S)
  └─ timezone (S)
preferences (M)           - Map containing:
  ├─ temperatureUnit (S)
  ├─ displayIcons (BOOL)
  └─ use24HourTime (BOOL)
createdAt (S)            - ISO 8601 timestamp
updatedAt (S)            - ISO 8601 timestamp
lastSeen (S)             - ISO 8601 timestamp
```

**Capacity**:
- On-Demand mode (recommended for low traffic)
- OR Provisioned: 1 RCU, 1 WCU (for testing)

**Sample DynamoDB Item**:
```json
{
  "deviceId": {"S": "esp32-001"},
  "currentView": {"S": "weather"},
  "updateInterval": {"N": "3600"},
  "location": {
    "M": {
      "latitude": {"N": "40.7128"},
      "longitude": {"N": "-74.0060"},
      "city": {"S": "New York"},
      "timezone": {"S": "America/New_York"}
    }
  },
  "preferences": {
    "M": {
      "temperatureUnit": {"S": "F"},
      "displayIcons": {"BOOL": true},
      "use24HourTime": {"BOOL": false}
    }
  },
  "createdAt": {"S": "2026-01-08T10:00:00Z"},
  "updatedAt": {"S": "2026-01-08T10:00:00Z"},
  "lastSeen": {"S": "2026-01-08T12:30:00Z"}
}
```

### Lambda Function

**Runtime**: Node.js 18.x (or Python 3.11)

**Handler**: `index.handler` (Node.js) or `lambda_function.lambda_handler` (Python)

**Memory**: 256 MB (sufficient for JSON parsing and DynamoDB operations)

**Timeout**: 10 seconds

**Environment Variables**:
- `TABLE_NAME`: `esp32-device-configs`
- `AWS_REGION`: `us-east-1` (or your region)

**IAM Role Permissions**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Scan",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:ACCOUNT_ID:table/esp32-device-configs"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

### Lambda Function Code (Node.js Example)

```javascript
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.TABLE_NAME || 'esp32-device-configs';

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));

    const httpMethod = event.httpMethod;
    const deviceId = event.pathParameters?.deviceId;

    // CORS headers
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Handle OPTIONS for CORS preflight
    if (httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // GET /config/{deviceId}
    if (httpMethod === 'GET' && deviceId) {
        try {
            const params = {
                TableName: TABLE_NAME,
                Key: { deviceId }
            };

            const result = await dynamodb.get(params).promise();

            if (!result.Item) {
                // Return default config if device not found
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        deviceId: deviceId,
                        currentView: 'hello',
                        updateInterval: 3600,
                        location: {
                            latitude: 0.0,
                            longitude: 0.0,
                            city: 'Unknown',
                            timezone: 'UTC'
                        },
                        preferences: {
                            temperatureUnit: 'F',
                            displayIcons: true,
                            use24HourTime: false
                        }
                    })
                };
            }

            // Update lastSeen timestamp
            await dynamodb.update({
                TableName: TABLE_NAME,
                Key: { deviceId },
                UpdateExpression: 'SET lastSeen = :now',
                ExpressionAttributeValues: {
                    ':now': new Date().toISOString()
                }
            }).promise();

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result.Item)
            };

        } catch (error) {
            console.error('Error fetching config:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Failed to fetch configuration',
                    message: error.message
                })
            };
        }
    }

    // PUT /config/{deviceId}
    if (httpMethod === 'PUT' && deviceId) {
        try {
            const body = JSON.parse(event.body || '{}');

            const item = {
                deviceId,
                currentView: body.currentView || 'hello',
                updateInterval: body.updateInterval || 3600,
                location: body.location || {},
                preferences: body.preferences || {},
                updatedAt: new Date().toISOString()
            };

            // Add createdAt if new device
            const existingItem = await dynamodb.get({
                TableName: TABLE_NAME,
                Key: { deviceId }
            }).promise();

            if (!existingItem.Item) {
                item.createdAt = new Date().toISOString();
            }

            await dynamodb.put({
                TableName: TABLE_NAME,
                Item: item
            }).promise();

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    deviceId,
                    message: 'Configuration updated successfully',
                    updatedAt: item.updatedAt
                })
            };

        } catch (error) {
            console.error('Error updating config:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Failed to update configuration',
                    message: error.message
                })
            };
        }
    }

    // Method not supported
    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({
            error: 'Method not allowed'
        })
    };
};
```

### API Gateway Configuration

**API Type**: REST API (not HTTP API)

**Stage**: `prod`

**CORS**: Enabled with:
- Allow Origins: `*`
- Allow Methods: `GET, PUT, OPTIONS`
- Allow Headers: `Content-Type`

**Resources**:
```
/
└── /config
    └── /{deviceId}
        ├── GET  → Lambda integration
        ├── PUT  → Lambda integration
        └── OPTIONS → Mock integration (CORS)
```

**Method Settings**:
- Enable API Key: No (for MVP)
- Authorization: None (for MVP) - Add API key or Cognito later
- Request Validator: Validate body, query string, and headers

**Deployment**:
- Stage Name: `prod`
- Description: "Production API for ESP32 devices"
- Enable CloudWatch Logs (for debugging)

**URL Format**:
```
https://{api-id}.execute-api.{region}.amazonaws.com/prod/config/{deviceId}
```

Example:
```
https://abc123def.execute-api.us-east-1.amazonaws.com/prod/config/esp32-001
```

---

## Security Considerations

### For MVP (Current)
- ✅ HTTPS only (TLS 1.2+)
- ✅ Device ID in URL path
- ❌ No authentication (anyone with URL can access)

### Recommended for Production

1. **API Key Authentication**:
   ```cpp
   // In ESP32 secrets.h
   #define API_KEY "your-api-key-here"

   // In HTTP request
   http.addHeader("x-api-key", API_KEY);
   ```

   Configure in API Gateway → API Keys → Usage Plans

2. **Device-Specific Tokens**:
   - Generate unique token per device
   - Store in DynamoDB
   - Validate in Lambda before returning config

3. **Rate Limiting**:
   - Enable API Gateway throttling
   - Default: 10 requests per second per device
   - Burst: 20 requests

4. **IP Whitelisting** (if devices have static IPs):
   - Resource Policy on API Gateway
   - Only allow known IP ranges

5. **Request Signing**:
   - Use AWS Signature V4
   - Requires more complex ESP32 code

### Minimal Security (Recommended for Start)

Add API Key requirement:
1. Create API Key in API Gateway
2. Create Usage Plan (10 req/sec, 1000 req/day)
3. Associate API Key with Usage Plan
4. Require API Key on GET /config/{deviceId}
5. Add to ESP32 secrets.h:
   ```cpp
   #define API_KEY "your-api-key-here"
   ```
6. Modify APIClient.h:
   ```cpp
   http.begin(url);
   http.addHeader("x-api-key", API_KEY);
   http.GET();
   ```

---

## Testing

### 1. Test Lambda Function Locally

**Using AWS SAM CLI**:
```bash
sam local invoke -e test-event.json
```

**test-event.json**:
```json
{
  "httpMethod": "GET",
  "pathParameters": {
    "deviceId": "esp32-001"
  },
  "headers": {
    "Content-Type": "application/json"
  }
}
```

### 2. Test API Gateway Endpoint

**Using curl**:
```bash
# Get device config
curl -X GET \
  https://abc123def.execute-api.us-east-1.amazonaws.com/prod/config/esp32-001

# Update device config
curl -X PUT \
  https://abc123def.execute-api.us-east-1.amazonaws.com/prod/config/esp32-001 \
  -H "Content-Type: application/json" \
  -d '{
    "currentView": "weather",
    "updateInterval": 1800,
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "city": "New York",
      "timezone": "America/New_York"
    },
    "preferences": {
      "temperatureUnit": "F",
      "displayIcons": true,
      "use24HourTime": false
    }
  }'
```

**Using Python**:
```python
import requests

url = "https://abc123def.execute-api.us-east-1.amazonaws.com/prod/config/esp32-001"
response = requests.get(url)
print(response.json())
```

### 3. Test from ESP32

1. Update `src/config/secrets.h`:
   ```cpp
   #define API_BASE_URL "https://abc123def.execute-api.us-east-1.amazonaws.com/prod"
   #define DEVICE_ID "esp32-001"
   ```

2. Upload firmware to ESP32
3. Monitor serial output:
   ```
   WiFi connected successfully. IP: 192.168.1.100
   Attempting to fetch config from API...
   Config received successfully
   Config loaded from API successfully!
   ```

### 4. Seed DynamoDB with Test Data

**AWS CLI**:
```bash
aws dynamodb put-item \
  --table-name esp32-device-configs \
  --item '{
    "deviceId": {"S": "esp32-001"},
    "currentView": {"S": "weather"},
    "updateInterval": {"N": "3600"},
    "location": {
      "M": {
        "latitude": {"N": "40.7128"},
        "longitude": {"N": "-74.0060"},
        "city": {"S": "New York"},
        "timezone": {"S": "America/New_York"}
      }
    },
    "preferences": {
      "M": {
        "temperatureUnit": {"S": "F"},
        "displayIcons": {"BOOL": true},
        "use24HourTime": {"BOOL": false}
      }
    },
    "createdAt": {"S": "2026-01-08T10:00:00Z"},
    "updatedAt": {"S": "2026-01-08T10:00:00Z"}
  }'
```

---

## Deployment Checklist

- [ ] Create DynamoDB table `esp32-device-configs`
- [ ] Create Lambda function with provided code
- [ ] Configure Lambda IAM role with DynamoDB permissions
- [ ] Set Lambda environment variable `TABLE_NAME`
- [ ] Create API Gateway REST API
- [ ] Configure API Gateway resources and methods
- [ ] Link API Gateway to Lambda function
- [ ] Enable CORS on API Gateway
- [ ] Deploy API to `prod` stage
- [ ] Note the API endpoint URL
- [ ] Seed DynamoDB with test device configuration
- [ ] Test API with curl or Postman
- [ ] Update ESP32 `secrets.h` with API URL
- [ ] Upload firmware to ESP32 and test
- [ ] (Optional) Add API Key authentication
- [ ] (Optional) Enable CloudWatch logging
- [ ] (Optional) Set up CloudWatch alarms for errors

---

## CloudFormation Template (Optional)

For automated deployment, use this CloudFormation template:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: ESP32 Dashboard API

Parameters:
  TableName:
    Type: String
    Default: esp32-device-configs
    Description: DynamoDB table name

Resources:
  DeviceConfigTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Ref TableName
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: deviceId
          AttributeType: S
      KeySchema:
        - AttributeName: deviceId
          KeyType: HASH

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: DynamoDBAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: !GetAtt DeviceConfigTable.Arn

  ConfigFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: esp32-config-handler
      Runtime: nodejs18.x
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 10
      MemorySize: 256
      Environment:
        Variables:
          TABLE_NAME: !Ref TableName
      Code:
        ZipFile: |
          // Paste Lambda function code here

  ApiGateway:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: ESP32-Dashboard-API
      Description: API for ESP32 device configuration

  ConfigResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ApiGateway
      ParentId: !GetAtt ApiGateway.RootResourceId
      PathPart: config

  DeviceIdResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ApiGateway
      ParentId: !Ref ConfigResource
      PathPart: '{deviceId}'

  GetMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ApiGateway
      ResourceId: !Ref DeviceIdResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ConfigFunction.Arn}/invocations

  LambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ConfigFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGateway}/*

  Deployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: GetMethod
    Properties:
      RestApiId: !Ref ApiGateway
      StageName: prod

Outputs:
  ApiUrl:
    Description: API Gateway endpoint URL
    Value: !Sub https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/prod
  TableName:
    Description: DynamoDB table name
    Value: !Ref DeviceConfigTable
```

Deploy with:
```bash
aws cloudformation create-stack \
  --stack-name esp32-dashboard-api \
  --template-body file://cloudformation.yaml \
  --capabilities CAPABILITY_IAM
```

---

## Support & Troubleshooting

### Common Issues

1. **CORS errors in browser testing**:
   - Enable CORS on API Gateway OPTIONS method
   - Add proper headers to Lambda response

2. **404 errors from ESP32**:
   - Check API URL format in secrets.h
   - Verify stage name is `prod`
   - Check CloudWatch logs for Lambda errors

3. **Timeout errors**:
   - Increase Lambda timeout to 10 seconds
   - Check DynamoDB table exists and is accessible
   - Verify IAM permissions

4. **Empty/default config returned**:
   - Device not in DynamoDB table
   - Use PUT endpoint to create device config first

### Monitoring

**CloudWatch Metrics to Watch**:
- API Gateway: 4XXError, 5XXError, Count, Latency
- Lambda: Invocations, Errors, Duration, Throttles
- DynamoDB: ConsumedReadCapacityUnits, ConsumedWriteCapacityUnits

**Set up CloudWatch Alarms**:
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name esp32-api-errors \
  --alarm-description "Alert on API errors" \
  --metric-name 5XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold
```

---

## Costs Estimate

### Free Tier (First 12 months)
- API Gateway: 1M requests/month
- Lambda: 1M requests + 400,000 GB-seconds/month
- DynamoDB: 25 GB storage + 25 WCU + 25 RCU

### Expected Costs (Beyond Free Tier)
Assuming 10 devices checking every hour:
- API Gateway: ~7,200 requests/month = $0.03/month
- Lambda: ~7,200 invocations at 256MB = $0.00/month
- DynamoDB: On-demand < 1M RCU = $0.00/month

**Total**: ~$0.03/month (essentially free)

---

## Next Steps After API is Live

1. ✅ Get API URL from API Gateway console
2. ✅ Update ESP32 `secrets.h` with API URL
3. ✅ Create device config in DynamoDB
4. ✅ Test ESP32 connection
5. ✅ Implement weather view (Phase 3)
6. ⏭️ Add web dashboard for managing device configs
7. ⏭️ Add API key authentication
8. ⏭️ Set up CloudWatch alarms

---

## Contact & Resources

- **AWS Documentation**: https://docs.aws.amazon.com/
- **API Gateway**: https://docs.aws.amazon.com/apigateway/
- **Lambda**: https://docs.aws.amazon.com/lambda/
- **DynamoDB**: https://docs.aws.amazon.com/dynamodb/

---

**Document Version**: 1.0
**Last Updated**: 2026-01-08
**ESP32 Firmware Version**: Phase 2 Complete
