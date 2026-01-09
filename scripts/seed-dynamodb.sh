#!/bin/bash
set -e

TABLE_NAME="${1:-esp32-device-configs}"
REGION="${2:-us-east-1}"

echo "Seeding DynamoDB table: $TABLE_NAME in region: $REGION"
echo ""

# Seed device: esp32-001
echo "Creating device: esp32-001..."
aws dynamodb put-item \
  --table-name "$TABLE_NAME" \
  --region "$REGION" \
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
    "createdAt": {"S": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'"},
    "updatedAt": {"S": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'"}
  }'

echo "✓ Seeded esp32-001"

# Seed device: esp32-002
echo "Creating device: esp32-002..."
aws dynamodb put-item \
  --table-name "$TABLE_NAME" \
  --region "$REGION" \
  --item '{
    "deviceId": {"S": "esp32-002"},
    "currentView": {"S": "hello"},
    "updateInterval": {"N": "7200"},
    "location": {
      "M": {
        "latitude": {"N": "34.0522"},
        "longitude": {"N": "-118.2437"},
        "city": {"S": "Los Angeles"},
        "timezone": {"S": "America/Los_Angeles"}
      }
    },
    "preferences": {
      "M": {
        "temperatureUnit": {"S": "C"},
        "displayIcons": {"BOOL": true},
        "use24HourTime": {"BOOL": true}
      }
    },
    "createdAt": {"S": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'"},
    "updatedAt": {"S": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'"}
  }'

echo "✓ Seeded esp32-002"
echo ""
echo "Seeding complete! 2 devices added to table: $TABLE_NAME"
