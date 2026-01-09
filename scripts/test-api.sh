#!/bin/bash
set -e

# Get API URL from Terraform output
cd "$(dirname "$0")/../terraform"
API_URL=$(terraform output -raw api_endpoint)
cd ..

echo "Testing API: $API_URL"
echo ""
echo "========================================"
echo ""

# Test 1: GET config for existing device
echo "Test 1: GET /config/esp32-001"
echo "--------------------------------------"
curl -s "$API_URL/config/esp32-001" | jq .
echo ""
echo ""

# Test 2: GET config for non-existent device (should return defaults)
echo "Test 2: GET /config/esp32-999 (non-existent, should return defaults)"
echo "--------------------------------------"
curl -s "$API_URL/config/esp32-999" | jq .
echo ""
echo ""

# Test 3: PUT config update
echo "Test 3: PUT /config/esp32-001 (update configuration)"
echo "--------------------------------------"
curl -s -X PUT "$API_URL/config/esp32-001" \
  -H "Content-Type: application/json" \
  -d '{
    "currentView": "calendar",
    "updateInterval": 1800
  }' | jq .
echo ""
echo ""

# Test 4: Verify update
echo "Test 4: GET /config/esp32-001 (verify update applied)"
echo "--------------------------------------"
curl -s "$API_URL/config/esp32-001" | jq .
echo ""
echo ""

# Test 5: List all devices
echo "Test 5: GET /devices"
echo "--------------------------------------"
curl -s "$API_URL/devices" | jq .
echo ""
echo ""

echo "========================================"
echo "All tests complete!"
echo "========================================"
