import express from 'express';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import {
  createDevice,
  getDevice,
  isDeviceActive,
  getAllDevices,
  getActiveDevices,
  expireDevice,
  cleanupExpiredDevices,
  getAccessLogs,
  getStats,
  initDatabase
} from './database.js';
import HuaweiRouter from './huawei-router.js';
import QRCode from 'qrcode';
import { initScheduler } from './scheduler.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Huawei Router
const router = new HuaweiRouter({
  host: process.env.HUAWEI_HOST || '192.168.100.1',
  username: process.env.HUAWEI_USERNAME || 'admin',
  password: process.env.HUAWEI_PASSWORD || '',
  useSSH: process.env.HUAWEI_USE_SSH === 'true'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'wifi-access-secret-key-change-in-production',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Generate WiFi QR Code
const generateWiFiQR = async (ssid, password, hidden = false) => {
  const wifiString = `WIFI:T:WPA;S:${ssid};P:${password};H:${hidden};;`;
  return await QRCode.toDataURL(wifiString);
};

// Generate Portal QR Code (for venue display)
const generatePortalQR = async (portalUrl) => {
  return await QRCode.toDataURL(portalUrl);
};

// ============ API Routes ============

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get WiFi QR Code
app.get('/api/qr/wifi', async (req, res) => {
  const { ssid, password, hidden } = req.query;

  if (!ssid || !password) {
    return res.status(400).json({ error: 'SSID and password required' });
  }

  try {
    const qrData = await generateWiFiQR(ssid, password, hidden === 'true');
    res.json({ qrCode: qrData, ssid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Portal QR Code (for venue display)
app.get('/api/qr/portal', async (req, res) => {
  const portalUrl = req.query.url || `http://${req.get('host')}/portal`;

  try {
    const qrData = await generatePortalQR(portalUrl);
    res.json({ qrCode: qrData, url: portalUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Request WiFi Access (customer)
app.post('/api/access/request', async (req, res) => {
  const { macAddress, deviceName } = req.body;

  if (!macAddress) {
    return res.status(400).json({ error: 'MAC address required' });
  }

  try {
    if (isDeviceActive(macAddress)) {
      const device = getDevice(macAddress);
      return res.json({
        granted: true,
        message: 'Access already active',
        expiresAt: device.expires_at,
        existing: true
      });
    }

    const device = createDevice(macAddress, deviceName || 'Unknown Device');
    const routerResult = await router.addMAC(macAddress);

    res.json({
      granted: true,
      message: 'WiFi access granted for 24 hours',
      expiresAt: device.expires_at,
      routerStatus: routerResult
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check access status
app.get('/api/access/status/:macAddress', (req, res) => {
  const { macAddress } = req.params;

  try {
    const device = getDevice(macAddress);

    if (!device) {
      return res.json({ active: false, message: 'No access record found' });
    }

    const active = isDeviceActive(macAddress);

    res.json({
      active,
      grantedAt: device.granted_at,
      expiresAt: device.expires_at,
      totalSessions: device.total_sessions,
      message: active ? 'Access active' : 'Access expired'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ Admin Routes ============

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

  if (username === adminUser && password === adminPass) {
    req.session.admin = true;
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Get all devices
app.get('/api/admin/devices', (req, res) => {
  try {
    const devices = getAllDevices();
    res.json({ devices });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active devices
app.get('/api/admin/devices/active', (req, res) => {
  try {
    const devices = getActiveDevices();
    res.json({ devices });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Expire a device
app.post('/api/admin/devices/:macAddress/expire', async (req, res) => {
  const { macAddress } = req.params;

  try {
    expireDevice(macAddress);
    await router.removeMACViaSSH?.(macAddress);
    res.json({ success: true, message: `Device ${macAddress} access revoked` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get access logs
app.get('/api/admin/logs', (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const logs = getAccessLogs(parseInt(limit));
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard stats
app.get('/api/admin/stats', (req, res) => {
  try {
    const stats = getStats();
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cleanup expired devices
app.post('/api/admin/cleanup', (req, res) => {
  try {
    const cleaned = cleanupExpiredDevices();
    res.json({ success: true, cleaned });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Customer Portal Page
app.get('/portal', (req, res) => {
  res.sendFile('portal.html', { root: './public' });
});

// Start server and initialize database
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`📶 WiFi Access Control Server running on port ${PORT}`);
    console.log(`🔗 Portal: http://localhost:${PORT}/portal`);
    console.log(`📊 Admin: http://localhost:${PORT}/admin`);

    initScheduler();
    cleanupExpiredDevices();
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

export default app;
