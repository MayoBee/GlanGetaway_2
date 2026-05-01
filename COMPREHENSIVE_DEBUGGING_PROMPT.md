# Comprehensive Website Debugging Prompt

Use this systematic approach to debug website issues across all layers of the application.

---

## 1. API Endpoints Debugging

### Endpoint Verification
- **Check endpoint URLs**: Verify all API endpoints are correctly defined and accessible
- **HTTP Methods**: Confirm correct HTTP methods (GET, POST, PUT, DELETE, PATCH) are used
- **Base URL Configuration**: Verify the base URL (localhost vs production) is correctly set
- **Route Matching**: Ensure frontend routes match backend route definitions exactly

### Request/Response Validation
- **Request Payload**: Verify request body structure matches API expectations
- **Headers**: Check for required headers (Content-Type, Authorization, etc.)
- **Response Format**: Validate response structure matches frontend parsing logic
- **Status Codes**: Verify correct HTTP status codes are returned (200, 201, 400, 401, 404, 500, etc.)

### Common Issues
- CORS errors (check backend CORS configuration)
- Missing or incorrect authentication tokens
- Malformed JSON in request/response
- Timeout issues (check server response times)
- Missing required parameters in requests

### Debug Commands
```bash
# Check if API server is running
netstat -ano | findstr :PORT_NUMBER

# Test endpoints with curl
curl -X GET http://localhost:PORT/api/endpoint
curl -X POST http://localhost:PORT/api/endpoint -H "Content-Type: application/json" -d '{"key":"value"}'

# Check network requests in browser DevTools (Network tab)
```

---

## 2. Website Logic Debugging

### State Management
- **State Flow**: Trace state changes from user action to UI update
- **State Persistence**: Verify state is correctly saved/loaded (localStorage, sessionStorage, cookies)
- **State Synchronization**: Check if state is consistent across components
- **Race Conditions**: Identify and fix timing issues in state updates

### Component Logic
- **Component Lifecycle**: Verify hooks (useEffect, useState, etc.) are used correctly
- **Props Drilling**: Check if props are passed correctly through component hierarchy
- **Event Handlers**: Verify event handlers are attached and firing correctly
- **Conditional Rendering**: Check if conditional logic renders correct components

### Business Logic
- **Validation Rules**: Verify form validation logic matches requirements
- **Data Transformations**: Check data processing and transformation functions
- **Error Handling**: Ensure errors are caught and handled gracefully
- **Edge Cases**: Test boundary conditions and unusual inputs

### Debug Commands
```javascript
// Add console logging for state changes
console.log('State updated:', newState);

// Use React DevTools to inspect component state and props
// Add debugger statements for breakpoints
debugger;
```

---

## 3. Functionality of Features Debugging

### Feature Testing Checklist
- **User Flow**: Walk through the complete user journey for each feature
- **Happy Path**: Test the ideal scenario where everything works correctly
- **Error Paths**: Test what happens when errors occur (network errors, validation errors, etc.)
- **Edge Cases**: Test unusual inputs, boundary values, and unexpected user behavior

### Feature-Specific Debugging

#### Authentication/Authorization
- Login/logout functionality
- Session management
- Permission checks
- Token refresh logic

#### Forms
- Form submission
- Validation feedback
- Error display
- Success messages

#### Data Display
- List rendering
- Pagination
- Filtering/sorting
- Empty states

#### Interactive Features
- Buttons/links
- Modals/dialogs
- Dropdowns/menus
- Drag-and-drop

### Debug Commands
```javascript
// Add feature-specific logging
console.log('Feature X triggered:', data);

// Test with different user roles/permissions
// Test with network throttling in DevTools
```

---

## 4. Data Parsing Process Debugging

### Data Flow Analysis
- **Source Data**: Verify data structure from API/database
- **Parsing Logic**: Check data transformation and parsing functions
- **Type Safety**: Verify data types match expectations (string, number, boolean, array, object)
- **Null/Undefined Handling**: Ensure null/undefined values are handled gracefully

### Common Parsing Issues
- **Type Mismatches**: String received when number expected, etc.
- **Missing Fields**: Expected fields not present in response
- **Extra Fields**: Unexpected fields causing issues
- **Nested Objects**: Incorrect access to nested properties
- **Array Handling**: Incorrect array iteration or access
- **Date Parsing**: Date format inconsistencies
- **Encoding Issues**: Character encoding problems

### Debug Commands
```javascript
// Log raw data before parsing
console.log('Raw data:', rawData);

// Log parsed data after transformation
console.log('Parsed data:', parsedData);

// Validate data structure
console.log('Data keys:', Object.keys(data));

// Check data types
console.log('Field type:', typeof data.field);
```

---

## 5. Port Confusion Debugging

### Port Configuration Check
- **Frontend Port**: Verify frontend dev server port (default: 3000, 5173, etc.)
- **Backend Port**: Verify backend API server port (default: 3001, 5000, 8000, etc.)
- **Database Port**: Verify database port (default: 5432 for PostgreSQL, 3306 for MySQL, 27017 for MongoDB)
- **Environment Variables**: Check .env files for port configurations

### Port Conflict Detection
```bash
# Check which ports are in use
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :5173

# Kill process on specific port (Windows)
taskkill /PID <PID> /F

# List all listening ports
netstat -ano
```

### Configuration Files to Check
- Frontend: `package.json` (scripts), `vite.config.js`, `next.config.js`
- Backend: `package.json`, `server.js`, `app.js`, `.env`
- Environment: `.env`, `.env.local`, `.env.development`, `.env.production`

### Common Port Issues
- Multiple services trying to use the same port
- Frontend pointing to wrong backend port
- Backend not running on expected port
- Firewall blocking specific ports
- Port hardcoded instead of using environment variables

### Debug Steps
1. Identify all services and their expected ports
2. Check which ports are actually in use
3. Verify configuration files match expected ports
4. Restart services with correct port configuration
5. Test connectivity between services

---

## General Debugging Workflow

### Step 1: Reproduce the Issue
- Clear steps to reproduce the bug
- Note browser, OS, and environment
- Check if issue is consistent or intermittent

### Step 2: Isolate the Problem
- Use browser DevTools (Console, Network, Application tabs)
- Add logging statements to trace execution
- Test components in isolation

### Step 3: Identify Root Cause
- Analyze error messages and stack traces
- Check network requests/responses
- Verify data flow and transformations

### Step 4: Implement Fix
- Make minimal, targeted changes
- Test the fix thoroughly
- Add regression tests if applicable

### Step 5: Verify Resolution
- Test the original issue is fixed
- Check for side effects
- Test related functionality

---

## Quick Reference Commands

### Windows
```bash
# Check ports
netstat -ano | findstr :PORT

# Kill process
taskkill /PID <PID> /F

# Find process by name
tasklist | findstr "node"
```

### Browser DevTools
- **F12**: Open DevTools
- **Console Tab**: View errors and logs
- **Network Tab**: Monitor API calls
- **Application Tab**: Check localStorage, cookies, session storage
- **Sources Tab**: Set breakpoints and debug code

### Git
```bash
# Check recent changes
git log --oneline -10

# Compare with working tree
git diff

# Stash changes
git stash
```

---

## Environment-Specific Considerations

### Development
- Hot reload enabled
- Debug mode active
- CORS may be disabled
- Mock data may be used

### Production
- Minified code
- Error reporting enabled
- CORS properly configured
- Real database connections

### Testing
- Test databases
- Mocked API responses
- Automated test runners
- Coverage reporting
