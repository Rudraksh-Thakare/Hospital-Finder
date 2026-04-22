# VitaLink - Project Setup Guide 🏥
This guide explains how to quickly spin up the VitaLink application on a brand new device for your presentation or collaboration.

Because your database is now securely hosted in the cloud via **Supabase**, setting up on a new device is much easier than before! You no longer need to install local PostgreSQL software.

## Prerequisites
Before you begin, ensure the new device has installed:
- **Node.js** (v18 or higher recommended)
- **Git** (if you are transferring code via GitHub, otherwise just copy the folder via USB/Drive).

---

## 🚀 Setup Instructions

### 1. Transfer the Code
Copy the `hospital finder` folder exactly as it is to the new device. 

### 2. Copy the Environment Variables (CRITICAL)
Your secret database connection string is stored in your environment file. Because `.env` files are typically ignored when transferring projects or pushing to GitHub, you **must** manually create or copy this file manually to the new device.

In the `server/` directory on the new device, create a file named `.env` and paste your secrets in:
```env
DATABASE_URL="postgresql://postgres:Rudraksh%404999@db.czkkurgjsynhualcytcq.supabase.co:5432/postgres"
JWT_SECRET="hospital-finder-super-secret-key-2026"
PORT=5000
```
> **Note:** Do NOT modify the `DATABASE_URL` password formatting, the `%40` handles your `@` symbol securely for the URL.

### 3. Install Dependencies
You need to install the Node packages for both the Client and the Server.

Open a terminal and install the **Backend**:
```bash
cd "hospital finder/server"
npm install
```

Open a second terminal and install the **Frontend**:
```bash
cd "hospital finder/client"
npm install
```

### 4. Start the Application!
Start both servers at the same time to get everything online.

In the **Server terminal**:
```bash
npm run dev
```
*(You should see `Server running on port 5000`)*

In the **Client terminal**:
```bash
npm run dev
```
*(You can now open `http://localhost:5173` in your browser!)*

---

### ⚠️ Warning Regarding Database Setup
**DO NOT run `npm run db:setup` on your new device.**
Because you are using Supabase, your database is securely in the cloud. Running `npm run db:setup` again will drop your existing tables and wipe all live data! You only ever need to run the setup script if you want to completely destroy and format your cloud database back to default settings.
