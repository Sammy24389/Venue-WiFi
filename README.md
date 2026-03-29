# 📶 Venue WiFi Access Control System

> WiFi voucher management system for venues with 24-hour temporary access control

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Sammy24389/Venue-WiFi)
[![Deploy to Railway](https://railway.app/button.svg)](https://railway.app/template/wifi-access)

## ✨ Features

- 🎫 **24-Hour Access** - Temporary WiFi access with auto-expiry
- 📱 **Customer Portal** - Simple web interface for access requests
- 🔐 **MAC Address Auth** - Device-based authentication
- 📊 **Admin Dashboard** - Monitor and manage connected devices
- 🔄 **Auto-Cleanup** - Scheduled expiry management
- 📶 **Huawei Router** - Integration with Huawei OptiXstar HG8145X7-10
- 🎨 **Modern UI** - React + Vite frontend
- 💾 **SQLite Database** - Lightweight persistent storage

## 🚀 Quick Start

### Local Development

```bash
# Clone the repository
git clone https://github.com/Sammy24389/Venue-WiFi.git
cd Venue-WiFi

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your settings
# HUAWEI_HOST, ADMIN_PASSWORD, etc.

# Start development server
npm run dev
```

Access:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Customer Portal: http://localhost:3000/portal

### Default Credentials

```
Username: admin
Password: admin123
```

## 📦 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Sammy24389/Venue-WiFi)

1. Click the button above
2. Connect your GitHub account
3. Add environment variables
4. Deploy!

### Deploy to Railway

1. Go to [Railway](https://railway.app)
2. Create new project from GitHub
3. Select `Sammy24389/Venue-WiFi`
4. Add environment variables
5. Deploy

### Deploy to VPS

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed VPS setup instructions.

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root:

```env
# Server
PORT=3000
SESSION_SECRET=your-secret-key

# Huawei Router
HUAWEI_HOST=192.168.100.1
HUAWEI_USERNAME=admin
HUAWEI_PASSWORD=your-router-password
HUAWEI_USE_SSH=false

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

## 📖 Usage

### For Customers

1. Scan QR code at venue
2. Enter device MAC address
3. Get 24-hour WiFi access
4. Auto-renews after expiry

### For Admins

1. Login at `/admin`
2. View active devices
3. Monitor usage statistics
4. Revoke access if needed
5. View access logs

## 🏗️ Architecture

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

## 📂 Project Structure

```
Venue-WiFi/
├── server/
│   ├── index.js          # Express API server
│   ├── database.js       # SQLite database
│   ├── huawei-router.js  # Router integration
│   └── scheduler.js      # Auto-cleanup tasks
├── src/
│   ├── components/       # React components
│   ├── App.jsx
│   └── main.jsx
├── public/
│   └── portal.html       # Standalone portal
├── .env.example
├── package.json
├── vercel.json
└── README.md
```

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, React Router
- **Backend:** Node.js, Express
- **Database:** SQLite (sql.js)
- **Scheduler:** node-cron
- **Router:** SSH2, Axios
- **QR Codes:** qrcode

## 📄 Documentation

- [README.md](./README.md) - Full documentation
- [QUICKSTART.md](./QUICKSTART.md) - Quick start guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment instructions
- [INSTALLATION_COMPLETE.md](./INSTALLATION_COMPLETE.md) - Setup summary

## 🔐 Security

- Change default admin password in production
- Use HTTPS for production deployments
- Set strong SESSION_SECRET
- Enable rate limiting for public APIs
- Regular database backups

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - feel free to use and modify for your venue.

## 👨‍💻 Author

**Sammy24389**

GitHub: [@Sammy24389](https://github.com/Sammy24389)

## 🙏 Acknowledgments

- Huawei OptiXstar HG8145X7-10 router documentation
- Vercel for hosting platform
- React and Express communities

---

**Built with ❤️ for venue WiFi sharing**
