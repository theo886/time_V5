# API Directory

This directory is reserved for future API functionality in the Weekly Percentage Tracker application.

## Planned Features

- Data persistence
- User authentication
- Project management endpoints
- Reporting and analytics APIs

# API Configuration

This directory contains the Azure Functions API for the Weekly Time Allocation app.

## Local Development Setup

To run this project locally, you need to create a `local.settings.json` file with the following structure:

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "COSMOSDB_ENDPOINT": "YOUR_COSMOS_DB_ENDPOINT",
    "COSMOSDB_KEY": "YOUR_COSMOS_DB_KEY",
    "COSMOSDB_DATABASE": "Timesheets",
    "COSMOSDB_CONTAINER": "TimeAllocation"
  },
  "Host": {
    "CORS": "*",
    "LocalHttpPort": 707  
  }
}
```

Replace `YOUR_COSMOS_DB_ENDPOINT` and `YOUR_COSMOS_DB_KEY` with your actual Cosmos DB values.

## Important Notes

- The `local.settings.json` file is intentionally excluded from version control to prevent exposing sensitive information.
- When deploying to Azure, make sure to configure these settings in your Function App's application settings. 