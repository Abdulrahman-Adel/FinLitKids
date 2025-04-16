require('dotenv').config(); // Load environment variables from .env file
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3001; // Use environment variable or default

// Middleware
app.use(express.json()); // Parse JSON request bodies

// Routes
const authRoutes = require('./routes/authRoutes');
const parentRoutes = require('./routes/parentRoutes');
const childRoutes = require('./routes/childRoutes'); // Import child routes
const { protect, requireChild } = require('./middleware/authMiddleware'); // Import protect and requireChild middleware

app.use('/auth', authRoutes); // Public auth routes

// Apply protect middleware generally, then specific role middleware within routers or here
app.use('/api/parent', protect, parentRoutes); // Parent routes already use requireParent internally
app.use('/api/child', protect, requireChild, childRoutes); // Protect and require child role for all child routes

// Basic route (can be kept for health check or removed)
app.get('/', (req, res) => {
  res.send('FinLitKids Backend is running!');
});

// Error Handling Middleware (Example - can be expanded later)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
