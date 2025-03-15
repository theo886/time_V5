# Azure Secure Deployment Checklist

This checklist provides a detailed guide for restructuring the Weekly Percentage Tracker application to use Azure App Service with secure database connectivity following Azure best practices.

## 1. Application Preparation

### Code Modifications
- [x] Add a `web.config` file to the project root with appropriate Node.js configuration:
  ```xml
  <?xml version="1.0" encoding="utf-8"?>
  <configuration>
    <system.webServer>
      <handlers>
        <add name="iisnode" path="server.js" verb="*" modules="iisnode" />
      </handlers>
      <rewrite>
        <rules>
          <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
            <match url="^server.js\/debug[\/]?" />
          </rule>
          <rule name="StaticContent">
            <action type="Rewrite" url="public{REQUEST_URI}" />
          </rule>
          <rule name="DynamicContent">
            <conditions>
              <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True" />
            </conditions>
            <action type="Rewrite" url="server.js" />
          </rule>
        </rules>
      </rewrite>
      <security>
        <requestFiltering>
          <hiddenSegments>
            <remove segment="bin" />
          </hiddenSegments>
        </requestFiltering>
      </security>
    </system.webServer>
  </configuration>
  ```

- [x] Create a `.deployment` file:
  ```
  [config]
  SCM_DO_BUILD_DURING_DEPLOYMENT=true
  ```

- [x] Update `package.json` to include the proper scripts:
  ```json
  "scripts": {
    "start": "node server.js",
    "build": "mkdir -p public && cp -r *.html *.js *.json data public/",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "engines": {
    "node": ">=14.0.0"
  }
  ```

### Database Configuration
- [x] Modify `dbConfig.js` to use managed identity authentication:
  ```javascript
  /**
   * Database configuration for the Weekly Percentage Tracker
   * Configured for Azure App Service with managed identity
   */
  
  const sql = require('mssql');
  
  // Check for environment to determine which authentication to use
  const isProduction = process.env.NODE_ENV === 'production';

  // SQL Server configuration
  const config = isProduction 
    ? {
        // Azure App Service configuration with managed identity
        connectionString: process.env.AZURE_SQL_CONNECTIONSTRING,
        authentication: {
          type: 'azure-active-directory-msi-app-service'
        },
        options: {
          encrypt: true,
          trustServerCertificate: false,
          enableArithAbort: true
        },
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000
        }
      }
    : {
        // Local development configuration with SQL authentication
        server: process.env.DB_SERVER,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT || '1433'),
        options: {
          encrypt: true,
          trustServerCertificate: false,
          enableArithAbort: true
        },
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000
        }
      };
  ```

- [x] Remove sensitive information from `.env` file and update it to only include non-sensitive local development settings:
  ```
  # Local development settings only
  NODE_ENV=development
  PORT=8080
  
  # Local development database settings (for production environments, use managed identity)
  DB_SERVER=eng-timesheets-server.database.windows.net
  DB_NAME=eng-timesheets-db
  DB_USER=eng-timesheets-admin
  DB_PASSWORD=YOUR_PASSWORD_HERE
  DB_PORT=1433
  
  # For production with managed identity
  # AZURE_SQL_CONNECTIONSTRING=Server=eng-timesheets-server.database.windows.net;Database=eng-timesheets-db;
  ```

### File Organization
- [x] Organize files for Azure App Service:
  - [x] Create a `public` folder for static files
  - [x] Create a deployment script to move HTML, CSS, and client-side JavaScript to the `public` folder
  - [x] Update paths in server.js to serve static files from the public folder

- [x] Update `server.js` to use Express and handle static file serving:
  ```javascript
  const express = require('express');
  const path = require('path');
  
  // Create Express app
  const app = express();
  
  // Serve static files from the public directory
  app.use(express.static(path.join(__dirname, 'public')));
  ```

## 2. Azure Resources Setup

### Azure App Service Setup
- [ ] Log in to Azure Portal
- [ ] Create a new App Service Plan:
  - [ ] Name: `eng-timesheets-plan`
  - [ ] Operating System: Linux
  - [ ] Region: (Same region as your database)
  - [ ] Pricing tier: At least B1 (Basic)

- [ ] Create a new Web App:
  - [ ] Name: `eng-timesheets-app`
  - [ ] Runtime stack: Node.js 14 LTS
  - [ ] App Service Plan: Use the plan created above
  - [ ] Enable Application Insights
  
### Database Configuration
- [ ] Ensure Azure SQL Database exists:
  - [ ] Server: `eng-timesheets-server.database.windows.net`
  - [ ] Database: `eng-timesheets-db`

- [ ] Configure Managed Identity for App Service:
  - [ ] Go to the App Service → Identity
  - [ ] Set System assigned identity to On
  - [ ] Save and note the generated Object ID
  
- [ ] Grant Database Access to Managed Identity:
  - [ ] Connect to the database using Azure Data Studio or SQL Server Management Studio
  - [ ] Run the following SQL commands (replace with the actual Object ID):
  
  ```sql
  -- Create a user in the database for the App Service's managed identity
  CREATE USER [eng-timesheets-app] FROM EXTERNAL PROVIDER;
  
  -- Grant necessary permissions
  ALTER ROLE db_datareader ADD MEMBER [eng-timesheets-app];
  ALTER ROLE db_datawriter ADD MEMBER [eng-timesheets-app];
  
  -- If your app needs to create/alter tables (for first run)
  GRANT CREATE TABLE TO [eng-timesheets-app];
  GRANT ALTER TO [eng-timesheets-app];
  ```

### Connection String Configuration
- [ ] Add Connection String to App Service:
  - [ ] Go to App Service → Configuration → Connection strings
  - [ ] Add a new connection string:
    - [ ] Name: `AZURE_SQL_CONNECTIONSTRING`
    - [ ] Value: `Server=eng-timesheets-server.database.windows.net;Database=eng-timesheets-db;`
    - [ ] Type: SQLAzure
  - [ ] Save the configuration

## 3. Network Security Configuration

### Enable Firewall Rules
- [ ] Configure SQL Server Firewall Rules:
  - [ ] Allow Azure services and resources to access the server (Enable option)
  - [ ] Add App Service Outbound IPs:
    - [ ] Go to App Service → Properties
    - [ ] Note down all Outbound IP Addresses
    - [ ] Add each to SQL Server Firewall Rules
  
### Enable Virtual Network Integration (Advanced)
- [ ] Set up Virtual Network Integration:
  - [ ] App Service → Networking → VNet Integration
  - [ ] Configure to use an existing VNet or create a new one
  - [ ] Put the SQL Server on the same VNet
  - [ ] Configure private endpoint for SQL

## 4. Deployment Process

### Setup Deployment Method
- [x] Choose a deployment method:
  - Option 1: GitHub Actions
    - [x] Set up GitHub repository if not already
    - [x] Configure GitHub Actions workflow:
    
    ```yaml
    # .github/workflows/azure-deploy.yml
    name: Deploy to Azure App Service
    
    on:
      push:
        branches: [ main ]
      workflow_dispatch:
    
    jobs:
      build-and-deploy:
        runs-on: ubuntu-latest
        
        steps:
        - uses: actions/checkout@v2
        
        - name: Set up Node.js
          uses: actions/setup-node@v2
          with:
            node-version: '14.x'
            
        - name: npm install and build
          run: |
            npm install
            ./prepare-azure-deploy.sh
            
        - name: Deploy to Azure Web App
          uses: azure/webapps-deploy@v2
          with:
            app-name: 'eng-timesheets-app'
            publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
            package: .
    ```
  
  - Option 2: Azure CLI Deployment
    - [x] Created deployment script: `prepare-azure-deploy.sh`
    ```bash
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
    
    # Make sure server dependencies are installed
    npm install express mssql dotenv
    ```
    - [x] Instructions for Azure CLI deployment:
    ```bash
    az login
    az account set --subscription "903698d9-fdb2-4101-bf43-4c2b63cddce5"
    ./prepare-azure-deploy.sh
    az webapp up --name eng-timesheets-app --resource-group ENG-Timesheets_group --location "West US 2"
    ```

### Initial Deployment Test
- [ ] Deploy the application
- [ ] Monitor deployment logs for errors
- [ ] Verify the application is running correctly by accessing the URL

## 5. Post-Deployment Configuration & Testing

### Application Testing
- [ ] Test the web application functionality:
  - [ ] Access the application URL: `https://eng-timesheets-app.azurewebsites.net`
  - [ ] Verify all features work (including database operations)
  - [ ] Check Application Insights for any errors

### Diagnostic Settings
- [ ] Enable diagnostic settings:
  - [ ] App Service → Diagnostic Settings
  - [ ] Enable Application Logs, Web Server Logs, and Error Logs
  - [ ] Set appropriate retention period

### Performance Monitoring
- [ ] Set up alerts for critical metrics:
  - [ ] Response time
  - [ ] Failed requests
  - [ ] Server errors
  - [ ] CPU/Memory usage

## 6. Additional Security Hardening

### Application Settings
- [ ] Set environment-specific settings:
  - [ ] App Service → Configuration → Application Settings
  - [ ] Add `NODE_ENV=production`

### HTTPS Configuration
- [ ] Enforce HTTPS:
  - [ ] App Service → TLS/SSL settings
  - [ ] Set HTTPS Only to On
  - [ ] Set Minimum TLS Version to 1.2

### Authentication (Optional)
- [ ] Set up authentication:
  - [ ] App Service → Authentication
  - [ ] Configure Microsoft Identity Provider
  - [ ] Set appropriate login parameters
  - [ ] Update server.js to check authentication status

## 7. Documentation Updates

### Update Project Documentation
- [x] Update README.md with deployment information
- [x] Document the Azure App Service architecture
- [x] Create a deployment guide for future reference (AZURE-DEPLOYMENT.md)

### Connection Configuration Updates
- [x] Create a troubleshooting guide for connection issues (in AZURE-DEPLOYMENT.md)
- [x] Document the managed identity approach used (in code comments and documentation)

## 8. Cleanup

### Remove Deprecated Files/Settings
- [ ] Remove any sensitive information from source control
- [ ] Delete unused files and configurations
- [ ] Ensure no credentials remain in the codebase
- [ ] Disable or secure development endpoints

---

This checklist should be followed in sequence to successfully migrate the Weekly Percentage Tracker to Azure App Service with secure database connectivity using managed identity authentication.