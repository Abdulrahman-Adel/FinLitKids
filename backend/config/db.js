const { Pool } = require('pg');
// Environment variables should be loaded by the main server entry point (server.js)

console.log('process.env.DB_PASSWORD', process.env.DB_PASSWORD);
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Optional: Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
  // It's often better practice not to end the pool here unless it's a specific test script.
  // The pool should stay open for the application's lifetime.
  // pool.end();
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool, // Export the pool itself if needed for transactions etc.
};
