/**
 * Database service for the Weekly Percentage Tracker
 * Provides functions to interact with the database
 */

const { getPool, sql } = require('./dbConfig');

/**
 * Initializes the database by creating the timesheets table if it doesn't exist
 * @returns {Promise<boolean>} True if successful
 */
async function initializeDatabase() {
  try {
    const pool = await getPool();
    
    // Check if table exists
    const tableCheck = await pool.request()
      .query(`
        SELECT OBJECT_ID('dbo.timesheets') as TableID
      `);
    
    // If table doesn't exist, create it
    if (!tableCheck.recordset[0].TableID) {
      console.log('Creating timesheets table...');
      await pool.request()
        .query(`
          CREATE TABLE timesheets (
            id INT IDENTITY(1,1) PRIMARY KEY,
            userId VARCHAR(100) NOT NULL,
            weekKey VARCHAR(50) NOT NULL,
            entries NVARCHAR(MAX) NOT NULL,
            submitDate DATETIME NOT NULL DEFAULT GETDATE(),
            CONSTRAINT UQ_user_week UNIQUE (userId, weekKey)
          )
        `);
      console.log('Timesheets table created successfully');
    } else {
      console.log('Timesheets table already exists');
    }
    
    return true;
  } catch (err) {
    console.error('Error initializing database:', err);
    return false;
  }
}

/**
 * Gets all timesheet entries for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} Array of timesheet entries
 */
async function getTimeEntriesForUser(userId) {
  try {
    const pool = await getPool();
    
    const result = await pool.request()
      .input('userId', sql.VarChar, userId)
      .query(`
        SELECT weekKey, entries, submitDate
        FROM timesheets
        WHERE userId = @userId
        ORDER BY submitDate DESC
      `);
    
    // Convert the entries from JSON string to object
    return result.recordset.map(record => ({
      weekKey: record.weekKey,
      entries: JSON.parse(record.entries),
      submitDate: record.submitDate
    }));
  } catch (err) {
    console.error('Error getting timesheet entries:', err);
    throw err;
  }
}

/**
 * Gets a specific timesheet entry for a user and week
 * @param {string} userId - The user ID
 * @param {string} weekKey - The week key (formatted date range)
 * @returns {Promise<Object|null>} Timesheet entry or null if not found
 */
async function getTimeEntryForWeek(userId, weekKey) {
  try {
    const pool = await getPool();
    
    const result = await pool.request()
      .input('userId', sql.VarChar, userId)
      .input('weekKey', sql.VarChar, weekKey)
      .query(`
        SELECT entries, submitDate
        FROM timesheets
        WHERE userId = @userId AND weekKey = @weekKey
      `);
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    // Convert the entries from JSON string to object
    return {
      weekKey,
      entries: JSON.parse(result.recordset[0].entries),
      submitDate: result.recordset[0].submitDate
    };
  } catch (err) {
    console.error('Error getting timesheet entry for week:', err);
    throw err;
  }
}

/**
 * Saves or updates a timesheet entry
 * @param {string} userId - The user ID
 * @param {string} weekKey - The week key (formatted date range)
 * @param {Array} entries - The timesheet entries
 * @returns {Promise<boolean>} True if successful
 */
async function saveTimeEntry(userId, weekKey, entries) {
  try {
    const pool = await getPool();
    
    // Convert entries to JSON string
    const entriesJson = JSON.stringify(entries);
    
    // Check if entry already exists
    const existingEntry = await getTimeEntryForWeek(userId, weekKey);
    
    if (existingEntry) {
      // Update existing entry
      await pool.request()
        .input('userId', sql.VarChar, userId)
        .input('weekKey', sql.VarChar, weekKey)
        .input('entries', sql.NVarChar(sql.MAX), entriesJson)
        .query(`
          UPDATE timesheets
          SET entries = @entries, submitDate = GETDATE()
          WHERE userId = @userId AND weekKey = @weekKey
        `);
    } else {
      // Insert new entry
      await pool.request()
        .input('userId', sql.VarChar, userId)
        .input('weekKey', sql.VarChar, weekKey)
        .input('entries', sql.NVarChar(sql.MAX), entriesJson)
        .query(`
          INSERT INTO timesheets (userId, weekKey, entries)
          VALUES (@userId, @weekKey, @entries)
        `);
    }
    
    return true;
  } catch (err) {
    console.error('Error saving timesheet entry:', err);
    throw err;
  }
}

/**
 * Deletes a timesheet entry
 * @param {string} userId - The user ID
 * @param {string} weekKey - The week key (formatted date range)
 * @returns {Promise<boolean>} True if successful
 */
async function deleteTimeEntry(userId, weekKey) {
  try {
    const pool = await getPool();
    
    const result = await pool.request()
      .input('userId', sql.VarChar, userId)
      .input('weekKey', sql.VarChar, weekKey)
      .query(`
        DELETE FROM timesheets
        WHERE userId = @userId AND weekKey = @weekKey
      `);
    
    return result.rowsAffected[0] > 0;
  } catch (err) {
    console.error('Error deleting timesheet entry:', err);
    throw err;
  }
}

module.exports = {
  initializeDatabase,
  getTimeEntriesForUser,
  getTimeEntryForWeek,
  saveTimeEntry,
  deleteTimeEntry
};