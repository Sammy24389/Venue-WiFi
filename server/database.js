import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, 'wifi_access.db');

let db = null;

export async function initDatabase() {
  const SQL = await initSqlJs();
  
  // Load existing database or create new one
  try {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } catch (err) {
    // File doesn't exist, create new database
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mac_address TEXT UNIQUE NOT NULL,
      device_name TEXT,
      granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      is_active INTEGER DEFAULT 1,
      total_sessions INTEGER DEFAULT 1
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS access_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mac_address TEXT NOT NULL,
      action TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      details TEXT
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_mac ON devices(mac_address)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_expires ON devices(expires_at)`);

  saveDatabase();
  console.log('✅ Database initialized');
  return db;
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

export function createDevice(macAddress, deviceName = 'Unknown') {
  if (!db) throw new Error('Database not initialized');

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const mac = macAddress.toLowerCase();

  // Check if exists
  const existing = db.exec(`SELECT total_sessions FROM devices WHERE mac_address = '${mac}'`);
  const totalSessions = existing.length > 0 && existing[0].values.length > 0 
    ? existing[0].values[0][0] + 1 
    : 1;

  // Upsert
  db.run(`
    INSERT OR REPLACE INTO devices (mac_address, device_name, granted_at, expires_at, is_active, total_sessions)
    VALUES ('${mac}', '${deviceName.replace(/'/g, "''")}', datetime('now'), '${expiresAt}', 1, ${totalSessions})
  `);

  logAccess(mac, 'GRANTED', `Session expires at ${expiresAt}`);
  saveDatabase();

  return { mac_address: mac, expires_at: expiresAt };
}

export function getDevice(macAddress) {
  if (!db) throw new Error('Database not initialized');

  const result = db.exec(`SELECT * FROM devices WHERE mac_address = '${macAddress.toLowerCase()}' AND is_active = 1`);
  
  if (result.length === 0 || result[0].values.length === 0) return null;

  const row = result[0].values[0];
  const columns = result[0].columns;
  
  const device = {};
  columns.forEach((col, i) => {
    device[col] = row[i];
  });

  return device;
}

export function isDeviceActive(macAddress) {
  const device = getDevice(macAddress);
  if (!device) return false;

  const now = new Date();
  const expires = new Date(device.expires_at);

  return now < expires;
}

export function getAllDevices() {
  if (!db) throw new Error('Database not initialized');

  const result = db.exec(`SELECT * FROM devices ORDER BY granted_at DESC`);
  
  if (result.length === 0) return [];

  return result[0].values.map(row => {
    const device = {};
    result[0].columns.forEach((col, i) => {
      device[col] = row[i];
    });
    return device;
  });
}

export function getActiveDevices() {
  if (!db) throw new Error('Database not initialized');

  const result = db.exec(`
    SELECT * FROM devices 
    WHERE is_active = 1 AND datetime(expires_at) > datetime('now')
    ORDER BY granted_at DESC
  `);

  if (result.length === 0) return [];

  return result[0].values.map(row => {
    const device = {};
    result[0].columns.forEach((col, i) => {
      device[col] = row[i];
    });
    return device;
  });
}

export function expireDevice(macAddress) {
  if (!db) throw new Error('Database not initialized');

  db.run(`UPDATE devices SET is_active = 0 WHERE mac_address = '${macAddress.toLowerCase()}'`);
  logAccess(macAddress, 'EXPIRED', 'Manual expiry');
  saveDatabase();
}

export function cleanupExpiredDevices() {
  if (!db) throw new Error('Database not initialized');

  const result = db.run(`
    UPDATE devices SET is_active = 0 
    WHERE datetime(expires_at) < datetime('now') AND is_active = 1
  `);

  if (result.changes > 0) {
    console.log(`Cleaned up ${result.changes} expired devices`);
    saveDatabase();
  }

  return result.changes;
}

export function logAccess(macAddress, action, details = '') {
  if (!db) throw new Error('Database not initialized');

  db.run(`
    INSERT INTO access_log (mac_address, action, details) 
    VALUES ('${macAddress.toLowerCase()}', '${action}', '${details.replace(/'/g, "''")}')
  `);
  saveDatabase();
}

export function getAccessLogs(limit = 100) {
  if (!db) throw new Error('Database not initialized');

  const result = db.exec(`SELECT * FROM access_log ORDER BY timestamp DESC LIMIT ${limit}`);
  
  if (result.length === 0) return [];

  return result[0].values.map(row => {
    const log = {};
    result[0].columns.forEach((col, i) => {
      log[col] = row[i];
    });
    return log;
  });
}

export function getStats() {
  if (!db) throw new Error('Database not initialized');

  const totalResult = db.exec('SELECT COUNT(*) as count FROM devices');
  const activeResult = db.exec('SELECT COUNT(*) as count FROM devices WHERE is_active = 1');
  const todayResult = db.exec(`
    SELECT COUNT(*) as count FROM access_log 
    WHERE date(timestamp) = date('now') AND action = 'GRANTED'
  `);

  return {
    totalDevices: totalResult.length > 0 && totalResult[0].values.length > 0 ? totalResult[0].values[0][0] : 0,
    activeDevices: activeResult.length > 0 && activeResult[0].values.length > 0 ? activeResult[0].values[0][0] : 0,
    todaySessions: todayResult.length > 0 && todayResult[0].values.length > 0 ? todayResult[0].values[0][0] : 0
  };
}

export { db };
