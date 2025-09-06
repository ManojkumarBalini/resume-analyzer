console.log("PGUSER:", process.env.PGUSER);
console.log("PGPASSWORD:", process.env.PGPASSWORD ? "[present]" : "[missing]");
console.log("PGHOST:", process.env.PGHOST);
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "[present]" : "[missing]");
