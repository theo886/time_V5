const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const dbService = require('./dbService');

// Load environment variables
require('dotenv').config();

const PORT = process.env.PORT || 8080;

// Mock user ID (in a real app, this would come from authentication)
const DEFAULT_USER_ID = 'alex.theodossiou@example.com';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Initialize the database when the server starts
(async function() {
  try {
    await dbService.initializeDatabase();
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }
})();

/**
 * Parse JSON request body
 * @param {http.IncomingMessage} req - HTTP request
 * @returns {Promise<Object>} Parsed JSON body
 */
const parseJsonBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const json = JSON.parse(body);
        resolve(json);
      } catch (err) {
        reject(err);
      }
    });
    
    req.on('error', (err) => {
      reject(err);
    });
  });
};

/**
 * Handle API requests
 * @param {http.IncomingMessage} req - HTTP request
 * @param {http.ServerResponse} res - HTTP response
 * @returns {boolean} True if request was handled as API
 */
const handleApiRequest = async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  
  // API endpoints
  if (pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');
    
    // Get user ID (in a real app, this would come from authentication)
    const userId = DEFAULT_USER_ID;
    
    try {
      // GET /api/timeentries - Get all entries for the user
      if (pathname === '/api/timeentries' && req.method === 'GET') {
        const entries = await dbService.getTimeEntriesForUser(userId);
        
        // Transform entries for client-side consumption
        const previousSubmissions = {};
        entries.forEach(entry => {
          previousSubmissions[entry.weekKey] = entry.entries;
        });
        
        res.writeHead(200);
        res.end(JSON.stringify(previousSubmissions));
        return true;
      }
      
      // GET /api/timeentries/:weekKey - Get entry for specific week
      if (pathname.startsWith('/api/timeentries/') && req.method === 'GET') {
        const weekKey = pathname.split('/').pop();
        const entry = await dbService.getTimeEntryForWeek(userId, weekKey);
        
        if (entry) {
          res.writeHead(200);
          res.end(JSON.stringify(entry));
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Entry not found' }));
        }
        return true;
      }
      
      // POST /api/timeentries - Save or update entry
      if (pathname === '/api/timeentries' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        
        if (!body.weekKey || !body.entries) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Missing required fields: weekKey and entries' }));
          return true;
        }
        
        const success = await dbService.saveTimeEntry(userId, body.weekKey, body.entries);
        
        if (success) {
          res.writeHead(200);
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Failed to save entry' }));
        }
        return true;
      }
      
      // DELETE /api/timeentries/:weekKey - Delete entry
      if (pathname.startsWith('/api/timeentries/') && req.method === 'DELETE') {
        const weekKey = pathname.split('/').pop();
        const success = await dbService.deleteTimeEntry(userId, weekKey);
        
        if (success) {
          res.writeHead(200);
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Entry not found' }));
        }
        return true;
      }
      
      // If we get here, the API endpoint is not recognized
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Endpoint not found' }));
      return true;
    } catch (err) {
      console.error('API Error:', err);
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal server error' }));
      return true;
    }
  }
  
  // Not an API request
  return false;
};

const server = http.createServer(async (req, res) => {
  // Handle API requests first
  const isApiRequest = await handleApiRequest(req, res);
  if (isApiRequest) return;
  
  // Handle static file requests
  let filePath = req.url === '/' ? './index.html' : '.' + req.url;

  // Get the file extension
  const extname = path.extname(filePath);
  let contentType = MIME_TYPES[extname] || 'application/octet-stream';

  // Read the file
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // Page not found
        fs.readFile('./index.html', (err, data) => {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data, 'utf-8');
        });
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
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
  
  process.exit(0);
};

// Listen for termination signals
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Press Ctrl+C to stop the server`);
}); 