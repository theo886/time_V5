# CLAUDE.md - Weekly Percentage Tracker

## Build Commands
- Start the server: `node server.js`
- Build the project: `npm run build`
- Start Storybook: `npm run storybook`
- Build Storybook: `npm run build-storybook`
- Run all tests: `npm test` (note: tests need to be implemented)

## Code Style Guidelines
- **Naming**: camelCase for variables/functions, PascalCase for classes/components
- **Formatting**: 2 spaces for indentation, single quotes for strings
- **Documentation**: JSDoc comments for functions with @param and @returns
- **Error Handling**: Use try/catch blocks with detailed error logging
- **Modules**: CommonJS format (type: "commonjs" in package.json)
- **DOM Manipulation**: Vanilla JS with direct DOM API calls
- **Imports**: Require statements with const (const express = require('express'))
- **Async**: Use async/await pattern with proper error handling
- **SQL**: Parameterized queries with input validation (never raw SQL)

## Database Practices
- Always use connection pooling via dbConfig.getPool()
- Input parameters should use sql.* type definitions
- JSON data should be stringified/parsed when storing/retrieving
- Handle database errors with detailed logging

## Development Notes
- The app uses Express.js for the API backend
- Data is stored in MS SQL Server (configured via environment variables)
- Core utility functions: formatWeekRange, calculateTotal, validateEntries
- Azure deployment is configured for production