const fs = require('fs');
const path = require('path');
const express = require('express');
const dbService = require('./dbService');

// Load environment variables
require('dotenv').config();

const PORT = process.env.PORT || 8080;

// Mock user ID (in a real app, this would come from authentication)
const DEFAULT_USER_ID = 'alex.theodossiou@example.com';

// Create Express app
const app = express();

// Initialize the database when the server starts
(async function() {
  try {
    await dbService.initializeDatabase();
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }
})();

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON request body
app.use(express.json());

// API endpoints
app.get('/api/timeentries', async (req, res) => {
  try {
    // Get user ID (in a real app, this would come from authentication)
    const userId = DEFAULT_USER_ID;
    
    const entries = await dbService.getTimeEntriesForUser(userId);
    
    // Transform entries for client-side consumption
    const previousSubmissions = {};
    entries.forEach(entry => {
      previousSubmissions[entry.weekKey] = entry.entries;
    });
    
    res.json(previousSubmissions);
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/timeentries/:weekKey', async (req, res) => {
  try {
    // Get user ID (in a real app, this would come from authentication)
    const userId = DEFAULT_USER_ID;
    
    const weekKey = req.params.weekKey;
    const entry = await dbService.getTimeEntryForWeek(userId, weekKey);
    
    if (entry) {
      res.json(entry);
    } else {
      res.status(404).json({ error: 'Entry not found' });
    }
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/timeentries', async (req, res) => {
  try {
    // Get user ID (in a real app, this would come from authentication)
    const userId = DEFAULT_USER_ID;
    
    const { weekKey, entries } = req.body;
    
    if (!weekKey || !entries) {
      res.status(400).json({ error: 'Missing required fields: weekKey and entries' });
      return;
    }
    
    const success = await dbService.saveTimeEntry(userId, weekKey, entries);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to save entry' });
    }
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/timeentries/:weekKey', async (req, res) => {
  try {
    // Get user ID (in a real app, this would come from authentication)
    const userId = DEFAULT_USER_ID;
    
    const weekKey = req.params.weekKey;
    const success = await dbService.deleteTimeEntry(userId, weekKey);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Entry not found' });
    }
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Create server
const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Press Ctrl+C to stop the server`);
});

// Handle server shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down server...');
  
  try {
    // Close database connection pool
    const dbConfig = require('./dbConfig');
    await dbConfig.closePool();
  } catch (err) {
    console.error('Error during shutdown:', err);
  }
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

// Listen for termination signals
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown); 