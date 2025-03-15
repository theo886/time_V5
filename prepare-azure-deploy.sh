#!/bin/bash

# Prepare Azure App Service Deployment Script
# This script sets up the file structure for Azure App Service deployment

echo "Preparing files for Azure App Service deployment..."

# Create public directory for static files
mkdir -p public/data

# Copy static files to public directory
cp index.html public/
cp index.js public/
cp utils.js public/
cp apiClient.js public/
cp sampleData.js public/
cp data/projectData.js public/data/

# Copy Storybook assets if needed
if [ -d "stories" ]; then
  mkdir -p public/stories
  cp -r stories/* public/stories/
fi

# Make sure server dependencies are installed
npm install express mssql dotenv

echo "Files prepared for Azure App Service deployment."
echo "To deploy to Azure:"
echo "1. Set up an Azure App Service with managed identity"
echo "2. Set up the Azure SQL Database with proper permissions"
echo "3. Deploy the code using Azure CLI or GitHub Actions"
echo ""
echo "Important: Make sure to set the AZURE_SQL_CONNECTIONSTRING in App Service Configuration"