const pool = require('./config/database');
console.log('Testing database connection...');

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Connection error:', err);
  } else {
    console.log('Database connection successful:', res.rows[0]);
  }
  pool.end();
});
