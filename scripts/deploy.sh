#!/bin/bash
set -e

echo "========================================"
echo "Deploying Life Display API"
echo "========================================"

# Step 1: Build Lambda function
echo ""
echo "Step 1: Building Lambda function..."
bash "$(dirname "$0")/build-lambda.sh"

# Step 2: Initialize Terraform (if needed)
echo ""
echo "Step 2: Initializing Terraform..."
cd "$(dirname "$0")/../terraform"
if [ ! -d ".terraform" ]; then
  terraform init
fi

# Step 3: Plan Terraform changes
echo ""
echo "Step 3: Planning Terraform changes..."
terraform plan -out=tfplan

# Step 4: Confirm deployment
echo ""
echo "Review the plan above. Do you want to apply these changes? (yes/no)"
read -r response
if [ "$response" != "yes" ]; then
  echo "Deployment cancelled."
  exit 0
fi

# Step 5: Apply Terraform
echo ""
echo "Step 4: Applying Terraform configuration..."
terraform apply tfplan

# Step 6: Get API URL
echo ""
echo "========================================"
echo "Deployment Complete!"
echo "========================================"
echo ""
echo "API Endpoint:"
terraform output -raw api_endpoint
echo ""
echo ""
echo "Example GET URL:"
terraform output -raw example_get_config_url
echo ""
echo ""
echo "Lambda Function:"
terraform output -raw lambda_function_name
echo ""
echo ""
echo "DynamoDB Table:"
terraform output -raw dynamodb_table_name
echo ""

# Clean up plan file
rm -f tfplan

cd ..
