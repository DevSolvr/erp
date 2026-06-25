const { Client } = require("pg");

const client = new Client({
  host: "db.aamgyuevwcbtgfgleiwy.supabase.co",
  port: 5432,
  user: "postgres",
  password: "Amora301345!",
  database: "postgres",
  connectionTimeoutMillis: 8000,
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => { console.log("✅ Direct connection OK!"); return client.end(); })
  .catch(e => console.log("❌ Direct failed:", e.message));
