# CLAUDE.md - Weekly Percentage Tracker

## Build Commands
- Start the server: `node server.js`
- Build the project: `npm run build`
- Start Storybook: `npm run storybook`
- Build Storybook: `npm run build-storybook`

## Code Style Guidelines
- **Naming**: camelCase for variables and functions, PascalCase for classes
- **Formatting**: Use 2 spaces for indentation, single quotes for strings
- **Error Handling**: Use try/catch blocks for async operations
- **Modules**: CommonJS module format (type: "commonjs" in package.json)
- **DOM Manipulation**: Vanilla JS with direct DOM API calls
- **State Management**: Use local state variables, no framework
- **Project Structure**: Separate utilities, data, and component code
- **Comments**: Add JSDoc comments for functions and modules

## Development Notes
- The app uses a simple Node.js HTTP server for local development
- Data is stored in memory with mock persistence (previousSubmissions)
- Use formatWeekRange and calculateTotal utility functions for key operations