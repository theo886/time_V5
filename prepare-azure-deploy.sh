#!/bin/bash

# Prepare Azure App Service Deployment Script
# This script sets up the file structure for Azure App Service deployment

echo "=== Preparing files for Azure App Service deployment ==="

# Create required directories
echo "Creating directory structure..."
mkdir -p public/data
mkdir -p public/js
mkdir -p public/css
mkdir -p public/cdn/chart.js/dist

# Copy core files
echo "Copying core application files..."
cp index.html public/
cp index.js public/
cp utils.js public/
cp apiClient.js public/
cp sampleData.js public/
cp data/projectData.js public/data/

# Handling Chart.js - two approaches for better reliability
echo "Setting up Chart.js files..."

# Method 1: Keep the CDN but also provide a local fallback
echo "Downloading Chart.js from CDN for local backup..."
curl -s -L https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js -o public/cdn/chart.js/dist/chart.umd.js
curl -s -L https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js.map -o public/cdn/chart.js/dist/chart.umd.js.map

# Add a specific Chart.js version reference rather than 'latest'
cat > public/js/chart-loader.js << 'EOL'
// Fallback loader for Chart.js
(function() {
  function loadScript(src, callback) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = src;
    script.onload = callback;
    script.onerror = function() {
      console.warn('Failed to load:', src);
      if (callback) callback(new Error('Failed to load script: ' + src));
    };
    document.head.appendChild(script);
  }

  window.loadChartJs = function(callback) {
    // Try CDN first
    loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js', function(err) {
      if (err) {
        console.log('Falling back to local Chart.js copy');
        // Fall back to local copy
        loadScript('/cdn/chart.js/dist/chart.umd.js', callback);
      } else if (callback) {
        callback();
      }
    });
  };
})();
EOL

# Modify index.html to use our custom loader instead of direct CDN
echo "Updating index.html to use the Chart.js loader..."
sed -i.bak 's|<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>|<script src="js/chart-loader.js"></script>\n  <script>window.loadChartJs(function() { console.log("Chart.js loaded successfully"); });</script>|g' public/index.html
rm -f public/index.html.bak

# Set up environment configuration to explicitly set production mode
echo "Creating production environment settings..."
cat > public/.env << 'EOL'
# Production environment settings
NODE_ENV=production
EOL

# Create a web.config file for proper IIS configuration
echo "Creating web.config for IIS configuration..."
cat > public/web.config << 'EOL'
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode" />
    </handlers>
    <rewrite>
      <rules>
        <!-- Don't interfere with requests for node-inspector debugging -->
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^server.js\/debug[\/]?" />
        </rule>

        <!-- First we consider whether the incoming URL matches a physical file in the /public folder -->
        <rule name="StaticContent" patternSyntax="Wildcard">
          <action type="Rewrite" url="public/{R:0}" logRewrittenUrl="true" />
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
          </conditions>
          <match url="*.*" />
        </rule>

        <!-- All other URLs are mapped to the Node.js application entry point -->
        <rule name="DynamicContent">
          <match url="/*" />
          <action type="Rewrite" url="server.js" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".map" mimeType="application/json" />
    </staticContent>
  </system.webServer>
</configuration>
EOL

# Copy server files
echo "Setting up server files..."
cp server.js public/
cp dbConfig.js public/
cp dbService.js public/
cp package.json public/
cp package-lock.json public/

# Copy Storybook assets if needed
if [ -d "stories" ]; then
  echo "Copying Storybook assets..."
  mkdir -p public/stories
  cp -r stories/* public/stories/
fi

# Install dependencies in the public folder for production
echo "Installing server dependencies..."
cd public
npm install --only=production express mssql dotenv
cd ..

# Log completion
echo "=== Azure App Service deployment preparation complete ==="
echo "Directory structure:"
find public -type d | sort

echo ""
echo "File listing:"
find public -type f -name "*.js" -o -name "*.html" | sort

echo ""
echo "To deploy to Azure:"
echo "1. Make sure NODE_ENV is set to 'production' in App Service Configuration"
echo "2. Make sure AZURE_SQL_CONNECTIONSTRING is set in App Service Configuration"
echo "3. Ensure the managed identity has appropriate SQL permissions"
echo ""
echo "SQL Permissions to set:"
echo "CREATE USER [ENG-Timesheets] FROM EXTERNAL PROVIDER;"
echo "ALTER ROLE db_datareader ADD MEMBER [ENG-Timesheets];"
echo "ALTER ROLE db_datawriter ADD MEMBER [ENG-Timesheets];"