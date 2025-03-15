# SQL Database Integration Tasks

## Overview
Integrate Azure SQL database with the Weekly Percentage Tracker for persistent storage of timesheet data. The app will pull from the database on startup and send updates when submissions change.

## Database Configuration
- **Server**: eng-timesheets-server.database.windows.net
- **Subscription ID**: 903698d9-fdb2-4101-bf43-4c2b63cddce5
- **Resource Group**: ENG-Timesheets_group

## Implementation Tasks

### 1. Set up Database Access Layer
- [x] Create a `dbConfig.js` file to store database connection information
- [x] Install required packages: `mssql` for SQL Server connectivity
  ```
  npm install mssql dotenv
  ```
- [x] Create a `.env` file for secure storage of connection credentials
- [x] Implement a connection pool for efficient database operations

### 2. Create Database Schema & API Functions
- [x] Design the `timesheets` table structure:
  ```sql
  CREATE TABLE timesheets (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId VARCHAR(100) NOT NULL,
    weekKey VARCHAR(50) NOT NULL,
    entries NVARCHAR(MAX) NOT NULL,
    submitDate DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_user_week UNIQUE (userId, weekKey)
  )
  ```
- [x] Create a `dbService.js` file with the following functions:
  - [x] `getTimeEntriesForUser(userId)` - Fetch all timesheet entries for a user
  - [x] `getTimeEntryForWeek(userId, weekKey)` - Fetch a specific timesheet entry
  - [x] `saveTimeEntry(userId, weekKey, entries)` - Save or update an entry
  - [x] `deleteTimeEntry(userId, weekKey)` - Delete a specific entry

### 3. Create Server API Endpoints
- [x] Enhance `server.js` to handle API requests:
  - [x] GET `/api/timeentries` - Return all entries for current user
  - [x] GET `/api/timeentries/:weekKey` - Return entries for specific week
  - [x] POST `/api/timeentries` - Create/update timesheet entry
  - [x] DELETE `/api/timeentries/:weekKey` - Delete a timesheet entry

### 4. Update Front-end Code
- [x] Create `apiClient.js` to handle API communication
- [x] Modify index.js to:
  - [x] Load all previous submissions from the database on startup
  - [x] Update the database when submissions change
  - [x] Implement proper error handling for API requests
- [x] Implement caching for offline capabilities

### 5. Update UI to Reflect Data Status
- [x] Add loading states during data operations
- [x] Show success/error notifications after DB operations
- [x] Add a sync status indicator to show if data is saved

### 6. Testing & Deployment
- [ ] Test locally with the Azure SQL database
- [ ] Create deployment scripts for the application
- [ ] Document the database setup and API integration

## Technical Approach
1. **Authentication**: Initially use SQL authentication stored in environment variables
2. **Error Handling**: Implement detailed error handling for database operations
3. **Data Format**: Store timesheet entries as JSON strings in the database
4. **Concurrency**: Implement optimistic concurrency control for updates
5. **Caching**: Implement local caching for offline capabilities and performance

## First Steps Implementation
1. Setup the connection config and test connectivity
2. Create the database tables
3. Implement the basic fetch and store operations
4. Integrate with the front-end application