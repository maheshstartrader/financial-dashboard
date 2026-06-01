
# 📊 Financial Dashboard

A modern financial dashboard built with **React + Vite + TanStack Start**, deployed on **Cloudflare Workers**, using **Google Sheets as a backend data source**.

---

## 🚀 Live Demo

```
https://financial-dashboard.mahesh-startrader.workers.dev
```

---

## 🧰 Tech Stack

* ⚛️ React 19
* ⚡ Vite
* 🧭 TanStack Router + Start
* 🎨 Tailwind CSS
* 📊 Recharts
* ☁️ Cloudflare Workers (Deployment)
* 📄 Google Sheets API (Data Source)
* 📦 Bun / npm (Package manager)

---

## 📁 Project Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd financial-dashboard
```

---

### 2. Install dependencies

Using **Bun (recommended)**:

```bash
bun install
```

Or using npm:

```bash
npm install
```

---

### 3. Environment Variables

Create a `.env` file in the root:

```env
VITE_SHEET_ID=your_google_sheet_id
VITE_SHEET_TAB=Form Responses 1
```

### ⚠️ Important:

* `VITE_SHEET_ID` → Your Google Sheet ID
* `VITE_SHEET_TAB` → Sheet tab name (exact match)

Example:

```env
VITE_SHEET_ID=1VNKC4jCH8G2vFycnNIopY3-XGKtCgH2TBa24CzYizKo
VITE_SHEET_TAB=Form Responses 1
```

---

## 🧪 Run Locally (Development)

```bash
bun run dev
```

or

```bash
npm run dev
```

Then open:

```
http://localhost:5173
```

---

## 🏗️ Build for Production

```bash
bun run build
```

or

```bash
npm run build
```

This generates:

* `dist/client` → frontend build
* `dist/server` → server/worker build

---

## ☁️ Deploy to Cloudflare Workers

### First time setup:

```bash
npx wrangler deploy
```

### Or using script:

```bash
bun run deploy
```

---

## ⚙️ Cloudflare Configuration

Your `wrangler.jsonc` will be auto-generated like:

```json
{
  "name": "financial-dashboard",
  "compatibility_date": "2026-06-01",
  "main": "@tanstack/react-start/server-entry",
  "compatibility_flags": ["nodejs_compat"]
}
```

---

## 🔐 Environment Variables (Cloudflare)

Set variables in Cloudflare dashboard:

* `VITE_SHEET_ID`
* `VITE_SHEET_TAB`

OR using Wrangler:

```bash
wrangler secret put VITE_SHEET_ID
wrangler secret put VITE_SHEET_TAB
```

---

## 📊 Features

* Real-time financial dashboard
* Income / expenses tracking
* Crypto + trading views
* Interactive charts (Recharts)
* Google Sheets integration
* Responsive UI
* Server-side rendering via TanStack Start

---

## 🧠 Project Structure

```
src/
 ├── components/
 ├── routes/
 ├── pages/
 ├── lib/
 ├── hooks/
 └── styles/
```

---

## 🛠️ Common Issues

### ❌ Blank page after deploy

* Check `dist/client` is generated
* Ensure build ran successfully

---

### ❌ Google Sheets not loading

* Check Sheet ID
* Ensure sheet is public or API accessible
* Verify tab name matches exactly

---

### ❌ Environment variables not working

* Restart dev server after `.env` changes
* Ensure variables start with `VITE_`

---

## 📦 Scripts

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "deploy": "bun run build && wrangler deploy"
}
```



