#!/bin/bash

# Prepare Azure App Service Deployment Script
# This script sets up the file structure for Azure App Service deployment

echo "Preparing files for Azure App Service deployment..."

# Create public directory for static files
mkdir -p public/data
mkdir -p public/js
mkdir -p public/css

# Copy static files to public directory
cp index.html public/
cp index.js public/
cp utils.js public/
cp apiClient.js public/
cp sampleData.js public/
cp data/projectData.js public/data/

# Create directory for chart.js source maps
mkdir -p public/node_modules/chart.js/dist/

# Download Chart.js source map files for production
curl -s https://cdn.jsdelivr.net/npm/chart.js@latest/dist/chart.umd.js -o public/node_modules/chart.js/dist/chart.umd.js
curl -s https://cdn.jsdelivr.net/npm/chart.js@latest/dist/chart.umd.js.map -o public/node_modules/chart.js/dist/chart.umd.js.map

# Update the index.html to use local Chart.js instead of CDN
sed -i.bak 's|https://cdn.jsdelivr.net/npm/chart.js|node_modules/chart.js/dist/chart.umd.js|g' public/index.html
rm public/index.html.bak

# Copy Storybook assets if needed
if [ -d "stories" ]; then
  mkdir -p public/stories
  cp -r stories/* public/stories/
fi

# Make sure server dependencies are installed
npm install express mssql dotenv

# Log completion
echo "Files prepared for Azure App Service deployment."
echo "Directory structure:"
find public -type f | sort

echo ""
echo "To deploy to Azure:"
echo "1. Set up an Azure App Service with managed identity"
echo "2. Set up the Azure SQL Database with proper permissions"
echo "3. Deploy the code using Azure CLI or GitHub Actions"
echo ""
echo "Important: Make sure to set the AZURE_SQL_CONNECTIONSTRING in App Service Configuration"