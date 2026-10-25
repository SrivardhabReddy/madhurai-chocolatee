# 🚀 Making Madhurai Chocolate Public & 24/7 Online

This guide explains **why "This site can't be reached" happens** when your local server stops, and gives you the exact steps to deploy your website online for **free** so it stays live 24/7 even when your laptop is turned off.

---

## 🔍 1. Why Did "This site can't be reached" Happen?

When you run `npm run dev` or `START_PLATFORM.bat` (or a tunnel like `untun` / `ngrok`):
* **Your personal computer is the server.**
* The website only exists while the terminal window is open and your laptop is powered on.
* As soon as you **stop the terminal**, **shut down your laptop**, or the **Wi-Fi disconnects**, the server shuts down.
* Any visitor (or mobile phone scanning the QR code) immediately sees:
  > **"This site can't be reached"** (`ERR_CONNECTION_REFUSED`)

---

## 🌐 2. The Solution: True 24/7 Cloud Hosting

To make your website public and accessible all the time, your website must be hosted on **Cloud Servers** (data centers) that stay awake 24 hours a day, 365 days a year.

Your project is now fully configured with **All-in-One Cloud Production Support**:
* **Customer Storefront**: Live at `https://your-domain.com/`
* **Admin Operations Portal**: Live at `https://your-domain.com/admin`
* **Secure Backend API**: Live at `https://your-domain.com/api`
* **Database**: Runs embedded or connects to managed PostgreSQL with zero configuration!

---

## 🛠️ Step-by-Step: Deploy Free on Render (Recommended)

Render offers **free hosting** with automatic HTTPS (SSL certificate) and 24/7 uptime.

### Step 1: Push Your Code to GitHub
1. Open your browser and go to [GitHub.com](https://github.com) (sign up if you don't have an account).
2. Click **New Repository**, name it `madhurai-chocolate`, and set it to **Private** or **Public**.
3. Upload/push your project files to this GitHub repository.

### Step 2: Connect to Render.com
1. Go to [Render.com](https://render.com) and create a free account.
2. Click **New +** > **Web Service**.
3. Select **Build and deploy from a Git repository** and connect your GitHub account.
4. Select your `madhurai-chocolate` repository.

### Step 3: Configure Settings (Takes 30 seconds)
Render will detect your project settings automatically, or enter:
* **Name:** `madhurai-chocolate`
* **Region:** Singapore / Frankfurt / Oregon (closest to your audience)
* **Branch:** `main` (or `master`)
* **Runtime:** `Node`
* **Build Command:** `npm run build`
* **Start Command:** `npm start`
* **Instance Type:** `Free`

### Step 4: Add Environment Variables
Under the **Environment Variables** section, add:
* `NODE_ENV` = `production`
* `JWT_SECRET` = (Generate any random 32-character string or click generate)
* `PAYMENT_GATEWAY` = `MOCK_SANDBOX`
* `UPI_VPA` = `9676823113-2@ybl`

### Step 5: Click "Deploy Web Service"
* Render will install dependencies, build both Customer and Admin websites, and launch your server.
* In ~2 minutes, Render gives you a **permanent live public URL**:
  `https://madhurai-chocolate.onrender.com`
* You can now share this URL with anyone in the world, scan it from any phone, and turn off your PC!

---

## 🏷️ Connecting Your Custom Domain (e.g., `madhuraichocolate.com`)

When you are ready to use your own domain name:
1. In your Render dashboard, click **Settings** > **Custom Domains**.
2. Click **Add Custom Domain** and enter `madhuraichocolate.com` (and `www.madhuraichocolate.com`).
3. Render will show you two DNS records (CNAME or A record).
4. Add those records to your domain provider (GoDaddy, Namecheap, Cloudflare, Hostinger).
5. Render automatically provisions a free, auto-renewing **SSL Certificate (HTTPS)** within minutes.

---

## ⚡ Alternative Free Platforms

| Platform | Best For | Cost | Setup |
| :--- | :--- | :--- | :--- |
| **Render.com** | Full-Stack (Frontend + Backend + DB all together) | **100% Free** | Easiest (Single Repo) |
| **Railway.app** | High performance & persistent storage | Free $5 credit/mo | 1-Click Template |
| **Vercel + Render** | Superfast global CDN for Storefront | **100% Free** | Split Frontend/Backend |
| **Linux VPS (Docker)** | Complete control & high volume | $4 - $6 / mo | `docker compose up -d` |
