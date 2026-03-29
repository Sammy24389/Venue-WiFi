# WiFi Access Control System

A WiFi voucher management system for venues (lounges, cafes, bars) using Huawei OptiXstar HG8145X7-10 router. Customers get 24-hour temporary internet access via MAC address authentication.

## Features

- ✅ **QR Code Access** - Customers scan QR to request access
- ✅ **MAC Address Logging** - Each device tracked by MAC address
- ✅ **24-Hour Auto-Expiry** - Access automatically expires after 24 hours
- ✅ **Admin Dashboard** - Monitor active devices, revoke access, view logs
- ✅ **Customer Portal** - Simple web interface for access requests
- ✅ **Automatic Cleanup** - Scheduled tasks remove expired entries
- ✅ **Huawei Router Integration** - Works with HG8145X7-10 (SSH/Web/Standalone)

## System Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Customer   │────▶│   Web Platform   │────▶│ Huawei Router│
│  (QR Scan)  │     │  (React + Node)  │     │   (MAC Filter)│
└─────────────┘     └──────────────────┘     └──────────────┘
                           │
                    ┌──────▼──────┐
                    │  Database   │
                    │ (MAC + Time)│
                    └─────────────┘
```

## Prerequisites

- Node.js v18+ 
- Huawei OptiXstar HG8145X7-10 router
- Router admin credentials

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
# Server
PORT=3000
SESSION_SECRET=your-secret-key-change-in-production

# Huawei Router Configuration
HUAWEI_HOST=192.168.100.1
HUAWEI_USERNAME=admin
HUAWEI_PASSWORD=your-router-password
HUAWEI_USE_SSH=false

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### 3. Router Setup

#### Option A: Standalone Mode (Recommended for initial setup)

1. Configure router to allow all devices initially
2. System will track MAC addresses and enforce 24-hour limits
3. No router integration required

#### Option B: SSH Mode (Advanced)

1. Enable SSH on your Huawei router (may require custom firmware)
2. Set `HUAWEI_USE_SSH=true` in `.env`
3. System will add/remove MAC filters automatically

#### Option C: Web Interface Mode

1. System will attempt to login to router web interface
2. MAC filtering done via web API calls
3. Less reliable, depends on firmware version

### 4. Start the Application

#### Development Mode

```bash
npm run dev
```

This starts both the backend (port 3000) and frontend (port 5173).

#### Production Mode

```bash
npm run build
npm start
```

## Usage

### For Customers

1. **Scan QR Code** displayed at the venue
2. **Enter MAC Address** (or it may auto-detect)
3. **Get Access** - Valid for 24 hours
4. **Auto-Renew** - Can request again after expiry

### Finding MAC Address

**iOS:**
- Settings → Privacy & Security → WiFi Address
- Or: Settings → General → About → WiFi Address

**Android:**
- Settings → About Phone → Status → WiFi MAC Address
- Or: Settings → Network & Internet → WiFi → Advanced

**Windows:**
- `ipconfig /all` in Command Prompt
- Look for "Physical Address" under WiFi adapter

**macOS:**
- System Preferences → Network → WiFi → Advanced → Hardware
- Or: Hold Option key and click WiFi icon in menu bar

### For Admins

1. **Login** at `/admin` (default: admin / admin123)
2. **View Dashboard** - See active devices, sessions today
3. **Manage Devices** - Revoke access manually if needed
4. **View Logs** - Track all access requests and actions
5. **Cleanup** - Remove expired entries

## API Endpoints

### Customer APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/access/request` | Request WiFi access |
| GET | `/api/access/status/:mac` | Check access status |
| GET | `/api/qr/wifi` | Generate WiFi QR code |

### Admin APIs

| Method | Endpoint | Description |
| Method | Endpoint | Description |
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/devices` | All devices |
| GET | `/api/admin/devices/active` | Active devices only |
| POST | `/api/admin/devices/:mac/expire` | Revoke device access |
| GET | `/api/admin/logs` | Access logs |
| POST | `/api/admin/cleanup` | Cleanup expired devices |

## QR Code Setup

### Generate Portal QR Code

The portal QR code directs customers to the access page:

```
http://your-server-ip:3000/portal
```

Generate a QR code using any online generator or the built-in API:

```bash
curl "http://localhost:3000/api/qr/portal?url=http://your-ip:3000/portal"
```

### Generate WiFi QR Code

For direct WiFi connection (after access granted):

```bash
curl "http://localhost:3000/api/qr/wifi?ssid=YourWiFiName&password=YourPassword"
```

## Database Schema

### devices table
- `id` - Primary key
- `mac_address` - Device MAC (unique)
- `device_name` - Optional device name
- `granted_at` - Access grant timestamp
- `expires_at` - Access expiry (24hrs from grant)
- `is_active` - Active status (1/0)
- `total_sessions` - Number of times access granted

### access_log table
- `id` - Primary key
- `mac_address` - Device MAC
- `action` - GRANTED, EXPIRED, ROUTER_ADD, etc.
- `timestamp` - Action timestamp
- `details` - Additional info

## Scheduled Tasks

| Task | Frequency | Description |
|------|-----------|-------------|
| Cleanup Expired | Every hour | Deactivate expired devices |
| Daily Summary | Midnight | Generate daily report (future) |

## Security Considerations

1. **Change default credentials** in `.env` before production
2. **Use HTTPS** in production (reverse proxy with nginx/Cloudflare)
3. **Session secret** should be a strong random string
4. **Router credentials** - Use a dedicated admin account
5. **Rate limiting** - Consider adding rate limiting for public APIs
6. **MAC randomization** - Modern devices may use random MACs; inform users to disable this feature

## Troubleshooting

### Router Connection Fails
- Verify router IP (default: 192.168.100.1)
- Check credentials in `.env`
- Try standalone mode if SSH/Web API unavailable

### MAC Address Not Detected
- Browser privacy features may block MAC detection
- Users must manually enter MAC address
- Provide clear instructions on finding MAC

### Access Not Working After Grant
- Check router MAC filter settings
- Ensure device is connected to correct WiFi network
- Verify device MAC matches entered MAC

### Database Errors
- Ensure write permissions in project directory
- Delete `wifi_access.db` to reset (will lose all data)

## Tech Stack

- **Frontend:** React 18 + Vite
- **Backend:** Node.js + Express
- **Database:** SQLite (better-sqlite3)
- **Scheduler:** node-cron
- **Router Integration:** ssh2, axios
- **QR Codes:** qrcode

## Project Structure

```
WIFI ACCESS CONTROL SYSTEM/
├── server/
│   ├── index.js          # Express server & routes
│   ├── database.js       # SQLite database functions
│   ├── huawei-router.js  # Router integration
│   └── scheduler.js      # Cron jobs
├── src/
│   ├── components/
│   │   ├── CustomerPortal.jsx
│   │   ├── AdminDashboard.jsx
│   │   └── AdminLogin.jsx
│   ├── App.jsx
│   └── main.jsx
├── public/
│   └── portal.html       # Standalone portal page
├── package.json
└── README.md
```

## License

MIT License - Feel free to use and modify for your venue!

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review logs in the admin dashboard
3. Verify router configuration

---

**Built for venue WiFi sharing with 24-hour temporary access control**
