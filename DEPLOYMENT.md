# 🚀 Vercel Deployment Guide

## ✅ Code Pushed to GitHub

Your code is now on GitHub: **https://github.com/Sammy24389/Venue-WiFi**

---

## ⚠️ Important: Vercel Limitations

Vercel is designed for **serverless functions and static sites**. The current system uses:
- ✅ SQLite database (file-based) - **Won't persist on Vercel**
- ✅ Scheduled cron jobs - **Limited support on Vercel**
- ✅ SSH connections to router - **Won't work on Vercel** (serverless environment)

### Recommended Deployment Options

**Option 1: Vercel (Frontend Only) + Separate Backend**
- Deploy React frontend to Vercel
- Host backend on a VPS/Railway/Render
- Best for production use

**Option 2: Full Stack on VPS**
- Deploy entire system to a VPS (DigitalOcean, Linode, etc.)
- Full control over router integration
- Recommended for your Huawei router setup

**Option 3: Railway/Render (Recommended for Vercel Alternative)**
- One-click deploy
- Persistent storage support
- Better for backend APIs

---

## 📦 Deploy to Vercel (Frontend + Serverless API)

### Step 1: Connect to Vercel

1. Go to **https://vercel.com**
2. Sign in with GitHub
3. Click **"Add New Project"**
4. Import your repository: `Sammy24389/Venue-WiFi`

### Step 2: Configure Build Settings

```
Framework Preset: Vite
Root Directory: ./
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Step 3: Add Environment Variables

In Vercel dashboard → Settings → Environment Variables:

```
# Router Configuration
HUAWEI_HOST=192.168.100.1
HUAWEI_USERNAME=admin
HUAWEI_PASSWORD=your-password

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password

# Session Secret
SESSION_SECRET=your-random-secret-key
```

### Step 4: Deploy

Click **"Deploy"** and Vercel will build and deploy your app.

---

## ⚡ Deploy to Railway (Recommended - Full Stack)

Railway supports full Node.js apps with persistent storage.

### Step 1: Create Railway Account

1. Go to **https://railway.app**
2. Sign in with GitHub

### Step 2: Deploy from GitHub

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose `Sammy24389/Venue-WiFi`

### Step 3: Add Persistent Volume

1. In your Railway project, click **"New"** → **"Volume"**
2. Mount path: `/app/server`
3. This ensures database persists

### Step 4: Add Environment Variables

In Railway dashboard → Variables:

```env
PORT=3000
HUAWEI_HOST=192.168.100.1
HUAWEI_USERNAME=admin
HUAWEI_PASSWORD=your-password
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
SESSION_SECRET=random-secret-key
```

### Step 5: Deploy

Railway will automatically deploy. Your app will be live at:
`https://your-project.railway.app`

---

## 🖥️ Deploy to VPS (Best for Router Integration)

For full Huawei router integration, deploy to a VPS on your local network or with SSH access.

### DigitalOcean Droplet Setup

```bash
# Connect to your droplet
ssh root@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone your repo
git clone https://github.com/Sammy24389/Venue-WiFi.git
cd Venue-WiFi

# Install dependencies
npm install

# Build frontend
npm run build

# Create .env file
nano .env
# Add your environment variables

# Install PM2 for process management
npm install -g pm2

# Start with PM2
pm2 start server/index.js --name wifi-access
pm2 save
pm2 startup

# Setup nginx reverse proxy (optional)
sudo apt install nginx
sudo nano /etc/nginx/sites-available/wifi-access
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔧 Alternative: Deploy Locally with Tunnel

For testing or temporary deployment:

### Using ngrok

```bash
# Install ngrok
npm install -g ngrok

# Start your server
npm start

# Expose to internet
ngrok http 3000
```

You'll get a public URL like: `https://abc123.ngrok.io`

### Using Cloudflare Tunnel

```bash
# Install cloudflared
# Follow: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

# Create tunnel
cloudflared tunnel --url http://localhost:3000
```

---

## 📊 Comparison Table

| Platform | Pros | Cons | Best For |
|----------|------|------|----------|
| **Vercel** | Free tier, easy deploy | Serverless only, no persistent DB | Frontend only |
| **Railway** | Full stack, easy setup | $5/month credit | Small production |
| **Render** | Free tier, persistent storage | Limited hours on free tier | Testing/Small venues |
| **VPS** | Full control, router access | Requires setup | Production with router |
| **Local + Tunnel** | Free, easy testing | Temporary, not production | Development |

---

## 🎯 Recommended Setup for Your Use Case

Since you're using a **Huawei OptiXstar HG8145X7-10** router at a physical venue:

### Best Architecture:

```
┌─────────────────┐
│  Local Server   │  ← Runs on venue computer/Raspberry Pi
│  (Node.js App)  │
└────────┬────────┘
         │
    ┌────▼────┐
    │ Huawei  │  ← Local network access
    │ Router  │
    └─────────┘
         │
    ┌────▼────┐
    │   WiFi  │  ← Customers connect
    └─────────┘
```

### Deployment Steps:

1. **Run locally** at the venue on a computer/Raspberry Pi
2. **Connect to same network** as Huawei router
3. **Set router IP** in `.env` to `192.168.100.1`
4. **Use ngrok/Cloudflare Tunnel** for remote admin access
5. **Display QR code** linking to local server IP

---

## 📱 QR Code for Venue

Once deployed, generate QR code:

```bash
# If running locally at 192.168.1.100:3000
curl "http://localhost:3000/api/qr/portal?url=http://192.168.1.100:3000/portal"
```

Print and display at venue!

---

## 🔐 Security Checklist

- [ ] Change default admin password
- [ ] Use HTTPS in production
- [ ] Set strong SESSION_SECRET
- [ ] Enable firewall on server
- [ ] Regular database backups
- [ ] Rate limiting on API endpoints

---

## 📞 Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Railway Docs:** https://docs.railway.app
- **DigitalOcean:** https://www.digitalocean.com/community/tutorials

---

**Ready to deploy! Choose the platform that fits your needs.** 🚀
