const express = require('express');
const apiRouter = require('./api'); // Import the router from api.js

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 3001;

// --- Database Connection Initialization (Crucial for api.js) ---
// Since api.js assumes 'pool' is available, we define it here 
// using environment variables provided by docker-compose.yml.
const { Pool } = require('pg');
const pool = new Pool(); // Uses environment variables for connection

// Middleware to attach the pool to the request/router (optional but clean)
app.use((req, res, next) => {
    req.pool = pool;
    next();
});
// ----------------------------------------------------------------

// Use the API router for all /api endpoints
// The api.js file already handles its own JSON parsing, but this is safe
app.use('/api', apiRouter);

// Simple root route (optional)
app.get('/', (req, res) => {
    res.send('Subscription Tracker API is running!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`API accessible at http://localhost:${PORT}/api/subscriptions`);
});