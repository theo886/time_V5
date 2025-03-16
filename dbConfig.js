/**
 * Database configuration for the Weekly Percentage Tracker
 * Configured for Azure App Service with managed identity
 */

// Load environment variables
require('dotenv').config();

const sql = require('mssql');

// Check for environment to determine which authentication to use
const isProduction = process.env.NODE_ENV === 'production';

// Parse connection string to extract server and database
function parseConnectionString(connStr) {
  if (!connStr) return null;
  
  const params = {};
  const parts = connStr.split(';');
  
  parts.forEach(part => {
    const keyValue = part.split('=');
    if (keyValue.length === 2) {
      let key = keyValue[0].trim();
      let value = keyValue[1].trim();
      
      // Handle special keys
      if (key.toLowerCase() === 'server') {
        // Remove 'tcp:' prefix if present
        value = value.replace(/^tcp:/i, '');
      } else if (key.toLowerCase() === 'initial catalog') {
        key = 'database';
      }
      
      params[key.toLowerCase()] = value;
    }
  });
  
  return params;
}

// Get connection details
let connectionParams = {};
if (isProduction && process.env.AZURE_SQL_CONNECTIONSTRING) {
  console.log('Parsing connection string for production environment');
  connectionParams = parseConnectionString(process.env.AZURE_SQL_CONNECTIONSTRING);
  console.log('Extracted server:', connectionParams.server);
  console.log('Extracted database:', connectionParams.database);
}

// SQL Server configuration
const config = isProduction 
  ? {
      // Azure App Service configuration with managed identity
      server: connectionParams.server, // Extract from connection string
      database: connectionParams.database, // Extract from connection string
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

// Create a connection pool once
let pool = null;

/**
 * Gets or creates the SQL connection pool
 * @returns {Promise<sql.ConnectionPool>} The SQL connection pool
 */
async function getPool() {
  try {
    if (!pool) {
      console.log('Creating new connection pool...');
      pool = await new sql.ConnectionPool(config).connect();
      console.log('Connected to the database successfully');
    }
    return pool;
  } catch (err) {
    console.error('Error connecting to the database:', err);
    throw err;
  }
}

/**
 * Closes the SQL connection pool
 * @returns {Promise<void>}
 */
async function closePool() {
  if (pool) {
    try {
      await pool.close();
      pool = null;
      console.log('Connection pool closed');
    } catch (err) {
      console.error('Error closing pool:', err);
      throw err;
    }
  }
}

module.exports = {
  getPool,
  closePool,
  sql
};