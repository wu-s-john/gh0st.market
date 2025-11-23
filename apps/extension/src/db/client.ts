import initSqlJs, { Database } from "sql.js";
import { drizzle } from "drizzle-orm/sql-js";
import * as schema from "./schema";

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sqliteDb: Database | null = null;

// Current schema version - increment when schema changes
const SCHEMA_VERSION = 1;

/**
 * SQL migrations keyed by version number.
 * Each migration should be idempotent (safe to run multiple times).
 */
const migrations: Record<number, string> = {
  1: `
    -- Metadata table for tracking schema version
    CREATE TABLE IF NOT EXISTS _meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    -- Specs the worker is following
    CREATE TABLE IF NOT EXISTS followed_specs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spec_id INTEGER NOT NULL,
      wallet_address TEXT NOT NULL,
      main_domain TEXT NOT NULL,
      min_bounty REAL DEFAULT 0,
      auto_claim INTEGER DEFAULT 0,
      created_at INTEGER
    );

    -- Index for faster lookups by wallet
    CREATE INDEX IF NOT EXISTS idx_followed_specs_wallet
      ON followed_specs(wallet_address);

    -- Currently active jobs being processed
    CREATE TABLE IF NOT EXISTS active_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id TEXT NOT NULL UNIQUE,
      spec_id INTEGER NOT NULL,
      main_domain TEXT NOT NULL,
      notarize_url TEXT NOT NULL,
      inputs TEXT,
      prompt_instructions TEXT,
      output_schema TEXT,
      bounty TEXT NOT NULL,
      token TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      progress INTEGER DEFAULT 0,
      result_payload TEXT,
      proof_data TEXT,
      error_message TEXT,
      started_at INTEGER,
      completed_at INTEGER
    );

    -- Index for job lookups
    CREATE INDEX IF NOT EXISTS idx_active_jobs_status
      ON active_jobs(status);

    -- Historical completed jobs
    CREATE TABLE IF NOT EXISTS job_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id TEXT NOT NULL,
      spec_id INTEGER NOT NULL,
      main_domain TEXT NOT NULL,
      bounty_earned TEXT,
      token TEXT,
      tx_hash TEXT,
      completed_at INTEGER
    );

    -- Update schema version
    INSERT OR REPLACE INTO _meta (key, value) VALUES ('schema_version', '1');
  `,
};

/**
 * Run pending migrations based on current schema version.
 */
async function runMigrations(database: Database): Promise<void> {
  let currentVersion = 0;

  try {
    const result = database.exec("SELECT value FROM _meta WHERE key = 'schema_version'");
    if (result.length > 0 && result[0].values.length > 0) {
      currentVersion = parseInt(result[0].values[0][0] as string, 10);
    }
  } catch {
    // _meta table doesn't exist yet, version is 0
  }

  // Run each pending migration in order
  for (let version = currentVersion + 1; version <= SCHEMA_VERSION; version++) {
    const migration = migrations[version];
    if (migration) {
      console.log(`[gh0st-db] Running migration v${version}`);
      database.exec(migration);
    }
  }

  if (currentVersion < SCHEMA_VERSION) {
    console.log(`[gh0st-db] Migrations complete. Schema at v${SCHEMA_VERSION}`);
  }
}

/**
 * Save the database to chrome.storage.local.
 */
async function saveDatabase(): Promise<void> {
  if (!sqliteDb) return;

  const data = sqliteDb.export();
  // Convert Uint8Array to regular array for JSON serialization in chrome.storage
  const buffer = Array.from(data);
  await chrome.storage.local.set({ gh0st_db: buffer });
  console.log(`[gh0st-db] Database saved (${Math.round(buffer.length / 1024)}KB)`);
}

/**
 * Load database from chrome.storage.local.
 */
async function loadDatabase(): Promise<Uint8Array | null> {
  const result = await chrome.storage.local.get("gh0st_db");
  if (result.gh0st_db && Array.isArray(result.gh0st_db)) {
    return new Uint8Array(result.gh0st_db);
  }
  return null;
}

/**
 * Initialize and return the Drizzle database instance.
 * This is the main entry point for database access.
 */
export async function getDb(): Promise<ReturnType<typeof drizzle<typeof schema>>> {
  if (db) return db;

  // Initialize sql.js with WASM
  const SQL = await initSqlJs({
    // Load WASM from CDN - in production, bundle this locally
    locateFile: (file) => `https://sql.js.org/dist/${file}`,
  });

  // Try to load existing database from storage
  const savedData = await loadDatabase();

  if (savedData) {
    console.log("[gh0st-db] Loading existing database");
    sqliteDb = new SQL.Database(savedData);
  } else {
    console.log("[gh0st-db] Creating new database");
    sqliteDb = new SQL.Database();
  }

  // Run any pending migrations
  await runMigrations(sqliteDb);

  // Create Drizzle ORM instance with schema
  db = drizzle(sqliteDb, { schema });

  // Save database after migrations
  await saveDatabase();

  return db;
}

/**
 * Persist the current database state to storage.
 * Call this after any write operations.
 */
export async function persistDb(): Promise<void> {
  await saveDatabase();
}

/**
 * Get the raw sql.js Database instance for direct SQL queries if needed.
 */
export function getSqliteDb(): Database | null {
  return sqliteDb;
}

/**
 * Close and clear the database instance.
 * Useful for testing or resetting state.
 */
export async function closeDb(): Promise<void> {
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
  }
  db = null;
}
