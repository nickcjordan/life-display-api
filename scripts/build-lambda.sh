#!/bin/bash
set -e

echo "Building Lambda function..."

# Navigate to lambda directory
cd "$(dirname "$0")/../lambda"

# Install dependencies
echo "Installing dependencies..."
npm install

# Run TypeScript compilation
echo "Compiling TypeScript..."
npm run build

# Create deployment package
echo "Creating deployment package..."
cd dist
zip -r ../function.zip .
cd ..

# Copy node_modules (only production deps)
echo "Copying production dependencies..."
npm install --production --no-save
cp -r node_modules dist/
cd dist
zip -r ../function.zip node_modules
cd ..

echo "Lambda deployment package created: lambda/function.zip"
echo "Package size: $(du -h function.zip | cut -f1)"
