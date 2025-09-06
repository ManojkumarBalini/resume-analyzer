const { Client } = require('pg');

console.log("USER:", process.env.PGUSER);
console.log("PASS (raw):", JSON.stringify(process.env.PGPASSWORD));
console.log("HOST:", process.env.PGHOST);

const client = new Client({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
});

client.connect()
  .then(() => {
    console.log("✅ Connected successfully!");
    return client.end();
  })
  .catch(err => {
    console.error("❌ Connection failed:", err.message);
  });
