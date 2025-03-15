/**
 * API client for the Weekly Percentage Tracker
 * Handles communication with the server API
 */

// API client for the Weekly Percentage Tracker
const apiClient = {
  /**
   * Fetches all timesheet entries for the current user
   * @returns {Promise<Object>} Object mapping weekKeys to entries
   */
  async getAllTimeEntries() {
    try {
      const response = await fetch('/api/timeentries');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch time entries');
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error fetching time entries:', err);
      throw err;
    }
  },
  
  /**
   * Fetches a specific timesheet entry for a week
   * @param {string} weekKey - The week key (formatted date range)
   * @returns {Promise<Object|null>} Timesheet entry or null if not found
   */
  async getTimeEntryForWeek(weekKey) {
    try {
      const response = await fetch(`/api/timeentries/${encodeURIComponent(weekKey)}`);
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch time entry');
      }
      
      return await response.json();
    } catch (err) {
      console.error(`Error fetching time entry for week ${weekKey}:`, err);
      throw err;
    }
  },
  
  /**
   * Saves or updates a timesheet entry
   * @param {string} weekKey - The week key (formatted date range)
   * @param {Array} entries - The timesheet entries
   * @returns {Promise<boolean>} True if successful
   */
  async saveTimeEntry(weekKey, entries) {
    try {
      const response = await fetch('/api/timeentries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ weekKey, entries })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save time entry');
      }
      
      return true;
    } catch (err) {
      console.error(`Error saving time entry for week ${weekKey}:`, err);
      throw err;
    }
  },
  
  /**
   * Deletes a timesheet entry
   * @param {string} weekKey - The week key (formatted date range)
   * @returns {Promise<boolean>} True if successful
   */
  async deleteTimeEntry(weekKey) {
    try {
      const response = await fetch(`/api/timeentries/${encodeURIComponent(weekKey)}`, {
        method: 'DELETE'
      });
      
      if (response.status === 404) {
        return false;
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete time entry');
      }
      
      return true;
    } catch (err) {
      console.error(`Error deleting time entry for week ${weekKey}:`, err);
      throw err;
    }
  }
};

// Expose to global scope
window.apiClient = apiClient;