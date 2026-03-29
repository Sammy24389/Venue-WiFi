# Quick Start Guide

## Step 1: Install Dependencies

```bash
npm install
```

Note: This may take a few minutes due to native module (better-sqlite3) compilation.

## Step 2: Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your router credentials:
- `HUAWEI_HOST` - Your router IP (default: 192.168.100.1)
- `HUAWEI_USERNAME` - Router admin username
- `HUAWEI_PASSWORD` - Router admin password
- `ADMIN_PASSWORD` - Dashboard login password

## Step 3: Start Development Server

```bash
npm run dev
```

This starts:
- Backend API: http://localhost:3000
- Frontend (Vite): http://localhost:5173
- Customer Portal: http://localhost:3000/portal

## Step 4: Test the System

### Test Customer Portal
1. Open http://localhost:3000/portal in browser
2. Enter a test MAC address (e.g., `AA:BB:CC:DD:EE:FF`)
3. Click "Get WiFi Access"
4. Should see success message with 24hr expiry

### Test Admin Dashboard
1. Go to http://localhost:5173/admin
2. Login with credentials (default: admin / admin123)
3. View active devices, logs, and stats

### Test API Directly
```bash
# Request access
curl -X POST http://localhost:3000/api/access/request \
  -H "Content-Type: application/json" \
  -d '{"macAddress":"AA:BB:CC:DD:EE:FF","deviceName":"Test Device"}'

# Check status
curl http://localhost:3000/api/access/status/AA:BB:CC:DD:EE:FF

# Get stats
curl http://localhost:3000/api/admin/stats
```

## Step 5: Deploy for Production

### Build Frontend
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Setup QR Code for Venue
1. Deploy server to a machine accessible on your network
2. Get the server IP address (e.g., 192.168.1.100)
3. Generate portal QR code:
   ```
   http://YOUR_SERVER_IP:3000/portal
   ```
4. Print and display QR code at venue

## Troubleshooting

### Port Already in Use
```bash
# Windows - Find and kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Database Errors
Delete the database file to reset:
```bash
del server\wifi_access.db
```

### Module Build Errors
Rebuild native modules:
```bash
npm rebuild better-sqlite3
```

## Network Setup for Venue

### Option 1: Standalone System (Recommended)
1. System runs independently
2. Router configured to allow all devices
3. System only tracks/log MAC addresses
4. No router integration needed

### Option 2: Integrated System
1. Enable SSH on Huawei router (if supported)
2. Set `HUAWEI_USE_SSH=true` in `.env`
3. System will manage MAC filters automatically

### WiFi Network Configuration
- **SSID:** VenueName_Guest
- **Security:** WPA2
- **Password:** Can be public or hidden
- **Isolation:** Enable client isolation for security

## Daily Operations

### For Staff
1. Monitor active devices via admin dashboard
2. Revoke access for problematic users
3. Help customers find their MAC address
4. Generate daily reports from logs

### For Customers
1. Scan QR code at venue
2. Enter MAC address
3. Get 24-hour access
4. Return next day for auto-renewal

---

**System is now ready to use! 🎉**
