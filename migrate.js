const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function migrate() {
  await client.connect();

  // 🔒 Prevent multiple instances running migrations
  await client.query("SELECT pg_advisory_lock(12345)");

  // Ensure migrations table exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      name TEXT PRIMARY KEY,
      run_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Get already applied migrations
  const res = await client.query("SELECT name FROM migrations");
  const applied = new Set(res.rows.map(r => r.name));

  // Read migration files
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith(".sql"))
    .sort(); // ensures 001 → 002 → 003

  for (const file of files) {
    if (applied.has(file)) continue;

    console.log("Running migration:", file);

    const sql = fs.readFileSync(
      path.join(MIGRATIONS_DIR, file),
      "utf-8"
    );

    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        "INSERT INTO migrations(name) VALUES($1)",
        [file]
      );
      await client.query("COMMIT");

      console.log("Applied:", file);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Migration failed:", file, err);
      process.exit(1);
    }
  }

  console.log("✅ All migrations up to date");

  await client.end();
}

migrate();