# Azure Deployment Guide

This guide explains how to deploy the Weekly Percentage Tracker application to Azure App Service with secure database connectivity using managed identity.

## Prerequisites

- An Azure subscription
- Azure CLI installed (for command-line deployment)
- Git installed
- Node.js 14.x or higher

## Step 1: Set up Azure Resources

### Create an App Service Plan

```bash
az appservice plan create \
  --name eng-timesheets-plan \
  --resource-group ENG-Timesheets_group \
  --location "West US 2" \
  --sku B1 \
  --is-linux
```

### Create a Web App

```bash
az webapp create \
  --name eng-timesheets-app \
  --resource-group ENG-Timesheets_group \
  --plan eng-timesheets-plan \
  --runtime "NODE|14-lts"
```

### Enable Managed Identity

```bash
az webapp identity assign \
  --name eng-timesheets-app \
  --resource-group ENG-Timesheets_group
```

Save the output from this command, which includes the Object ID of the managed identity.

## Step 2: Configure SQL Database Access

### Connect to your SQL Database

Connect to the SQL database using Azure Data Studio, SQL Server Management Studio, or the Azure Portal Query Editor.

### Grant Necessary Permissions

Execute the following SQL commands, replacing `<object-id>` with the Object ID from the previous step:

```sql
-- Create a user in the database for the App Service's managed identity
CREATE USER [eng-timesheets-app] FROM EXTERNAL PROVIDER;

-- Grant necessary permissions
ALTER ROLE db_datareader ADD MEMBER [eng-timesheets-app];
ALTER ROLE db_datawriter ADD MEMBER [eng-timesheets-app];

-- Grant table creation permissions (for first run)
GRANT CREATE TABLE TO [eng-timesheets-app];
GRANT ALTER TO [eng-timesheets-app];
```

## Step 3: Configure App Service Settings

### Add Connection String

Go to the Azure Portal > App Service > Configuration > Connection strings, and add:

- Name: `AZURE_SQL_CONNECTIONSTRING`
- Value: `Server=eng-timesheets-server.database.windows.net;Database=eng-timesheets-db;`
- Type: SQLAzure

### Add Application Settings

Go to Azure Portal > App Service > Configuration > Application settings, and add:

- `NODE_ENV` = `production`

### Configure Deployment

Choose one of the following deployment methods:

#### Option 1: GitHub Actions

1. Generate a publish profile from Azure App Service
2. Add it as a GitHub Secret named `AZURE_WEBAPP_PUBLISH_PROFILE`
3. Push to the main branch to trigger deployment

#### Option 2: Azure CLI Deployment

```bash
# From the project directory
./prepare-azure-deploy.sh
az webapp up --name eng-timesheets-app --resource-group ENG-Timesheets_group
```

## Step 4: Verify Deployment

1. Access the application at `https://eng-timesheets-app.azurewebsites.net`
2. Monitor application logs in App Service > Logs > Log stream
3. Check for any errors in App Service > Monitoring > Application Insights

## Security Best Practices

- Enable HTTPS Only mode in Azure App Service > TLS/SSL settings
- Set minimum TLS version to 1.2
- Consider adding Azure AD authentication for user login
- Configure the SQL Server firewall to only allow Azure services

## Troubleshooting

If you encounter issues:

1. Check App Service logs for errors
2. Verify that the managed identity has proper permissions
3. Ensure connection string is correctly configured
4. Check that the database is accessible from the App Service

For more details, see the Azure App Service documentation.