/**
 * Database configuration for the Weekly Percentage Tracker
 * Configured for Azure App Service with managed identity
 */

// Load environment variables
require('dotenv').config();

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