# Deployment Guide

This guide walks you through deploying the Life Display API to AWS.

## Prerequisites Checklist

Before deploying, ensure you have:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] Terraform 1.6+ installed (`terraform --version`)
- [ ] AWS CLI v2 installed (`aws --version`)
- [ ] AWS credentials configured (`aws sts get-caller-identity`)

## Quick Deployment (Automated)

### Step 1: Install Lambda Dependencies

```bash
cd lambda
npm install
cd ..
```

### Step 2: Run Deployment Script

**Unix/Mac/Linux:**
```bash
chmod +x scripts/*.sh
./scripts/deploy.sh
```

**Windows (Git Bash or WSL):**
```bash
bash scripts/deploy.sh
```

This script will:
1. Build the TypeScript Lambda code
2. Create the deployment package
3. Initialize Terraform
4. Show you the planned infrastructure changes
5. Prompt for confirmation
6. Deploy all AWS resources
7. Display your API endpoint URL

### Step 3: Seed Test Data

```bash
# Unix/Mac/Linux
./scripts/seed-dynamodb.sh

# Windows
bash scripts/seed-dynamodb.sh
```

### Step 4: Test the API

```bash
# Unix/Mac/Linux
./scripts/test-api.sh

# Windows
bash scripts/test-api.sh
```

## Manual Deployment (Step-by-Step)

If you prefer to run each step manually:

### 1. Build Lambda Function

```bash
cd lambda
npm install
npm run build
cd ..
```

### 2. Deploy Infrastructure with Terraform

```bash
cd terraform

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply the configuration
terraform apply

# Get the API URL
terraform output api_endpoint
```

### 3. Seed Test Data

```bash
aws dynamodb put-item \
  --table-name esp32-device-configs \
  --region us-east-1 \
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

### 4. Test Endpoints

Replace `YOUR_API_URL` with the output from Terraform:

```bash
# Test GET
curl https://YOUR_API_URL/prod/config/esp32-001

# Test PUT
curl -X PUT https://YOUR_API_URL/prod/config/esp32-001 \
  -H "Content-Type: application/json" \
  -d '{"currentView": "calendar", "updateInterval": 1800}'

# Test list devices
curl https://YOUR_API_URL/prod/devices
```

## What Gets Created

The deployment creates these AWS resources:

- **DynamoDB Table**: `esp32-device-configs` (on-demand billing)
- **Lambda Function**: `life-display-api-config-handler` (Node.js 18.x, 256MB, 10s timeout)
- **API Gateway**: REST API with `/config/{deviceId}` and `/devices` endpoints
- **IAM Role**: Lambda execution role with DynamoDB permissions
- **CloudWatch Log Groups**: For Lambda and API Gateway logs

## Updating the Deployment

### Update Lambda Code Only

```bash
cd lambda
npm run build
cd ../terraform
terraform apply -target=aws_lambda_function.config_handler
```

### Update Infrastructure

```bash
cd terraform
terraform plan
terraform apply
```

### Full Redeployment

```bash
./scripts/deploy.sh
```

## Monitoring

### View Lambda Logs

```bash
aws logs tail /aws/lambda/life-display-api-config-handler --follow
```

### View API Gateway Logs

```bash
aws logs tail /aws/apigateway/life-display-api --follow
```

### Check CloudWatch Metrics

Go to AWS Console → CloudWatch → Metrics → Browse metrics:
- API Gateway metrics (4XX, 5XX, latency)
- Lambda metrics (invocations, errors, duration)
- DynamoDB metrics (read/write capacity)

## Cleanup

To destroy all AWS resources:

```bash
cd terraform
terraform destroy
```

**WARNING**: This will permanently delete:
- DynamoDB table and all device configurations
- Lambda function
- API Gateway
- All CloudWatch logs

## Troubleshooting

### Issue: "terraform: command not found"

Install Terraform from https://www.terraform.io/downloads

### Issue: "Error acquiring state lock"

Another Terraform process is running or crashed. Force unlock:

```bash
cd terraform
terraform force-unlock LOCK_ID
```

### Issue: API returns 502 Bad Gateway

Check Lambda logs for errors:

```bash
aws logs tail /aws/lambda/life-display-api-config-handler --follow
```

Common causes:
- Lambda deployment package missing files
- DynamoDB table doesn't exist
- IAM permissions issue

### Issue: API returns 500 Internal Server Error

Check CloudWatch logs for the specific error. Common issues:
- Invalid environment variables
- DynamoDB table name mismatch
- Unhandled exception in Lambda code

### Issue: Build fails on Windows

Use Git Bash or WSL to run the shell scripts:

```bash
bash scripts/deploy.sh
```

## Next Steps

After successful deployment:

1. Note your API endpoint URL from Terraform output
2. Update your ESP32 firmware with the API URL
3. Test ESP32 device connectivity
4. Monitor CloudWatch metrics for usage patterns
5. Consider adding API key authentication (see [README.md](README.md))

## Cost Estimate

With 10 devices checking every hour:
- **API Gateway**: ~$0.03/month
- **Lambda**: Free tier
- **DynamoDB**: Free tier
- **Total**: ~$0.03/month

## Support

- Review [README.md](README.md) for full documentation
- Check [PROJECT_SPECS.md](PROJECT_SPECS.md) for API specification
- AWS Documentation: https://docs.aws.amazon.com/
