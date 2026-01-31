# Life Display API Deployment Script (PowerShell)
# Run this from the project root: .\scripts\deploy.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploying Life Display API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Build Lambda function
Write-Host ""
Write-Host "Step 1: Building Lambda function..." -ForegroundColor Yellow
Set-Location lambda

Write-Host "Installing dependencies..."
npm install

Write-Host "Compiling TypeScript..."
npm run build

# Step 2: Create Lambda deployment package
Write-Host ""
Write-Host "Step 2: Creating deployment package..." -ForegroundColor Yellow

# Remove old zip if exists
$zipPath = "..\terraform\lambda.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

# Create zip with all files from dist folder
Compress-Archive -Path "dist\*" -DestinationPath $zipPath -Force
Write-Host "Lambda package created: terraform\lambda.zip" -ForegroundColor Green

# Step 3: Initialize Terraform
Write-Host ""
Write-Host "Step 3: Initializing Terraform..." -ForegroundColor Yellow
Set-Location ..\terraform

if (!(Test-Path ".terraform")) {
    terraform init
} else {
    Write-Host "Terraform already initialized (skipping)" -ForegroundColor Gray
}

# Step 4: Plan Terraform changes
Write-Host ""
Write-Host "Step 4: Planning Terraform changes..." -ForegroundColor Yellow
terraform plan -out=tfplan

# Step 5: Confirm deployment
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
$response = Read-Host "Review the plan above. Apply these changes? (yes/no)"
if ($response -ne "yes") {
    Write-Host "Deployment cancelled." -ForegroundColor Red
    if (Test-Path "tfplan") {
        Remove-Item "tfplan" -Force
    }
    Set-Location ..
    exit 0
}

# Step 6: Apply Terraform
Write-Host ""
Write-Host "Step 5: Applying Terraform configuration..." -ForegroundColor Yellow
terraform apply tfplan

# Step 7: Show outputs
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Weather Endpoint:" -ForegroundColor Yellow
terraform output -raw weather_endpoint
Write-Host ""
Write-Host ""

Write-Host "Time Endpoint:" -ForegroundColor Yellow
terraform output -raw time_endpoint
Write-Host ""
Write-Host ""

Write-Host "API Key (SAVE THIS SECURELY):" -ForegroundColor Yellow
terraform output -raw api_key_value
Write-Host ""
Write-Host ""

Write-Host "Lambda Function Name:" -ForegroundColor Yellow
terraform output -raw lambda_function_name
Write-Host ""
Write-Host ""

Write-Host "Test your API with:" -ForegroundColor Cyan
$apiKey = terraform output -raw api_key_value
$weatherEndpoint = terraform output -raw weather_endpoint
Write-Host "curl -H `"x-api-key: $apiKey`" $weatherEndpoint" -ForegroundColor Gray
Write-Host ""

# Clean up plan file
if (Test-Path "tfplan") {
    Remove-Item "tfplan" -Force
}

# Return to root
Set-Location ..

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Done! Your API is deployed and ready." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
