# Live link + finish setup

## Your live app (frontend)

**https://ai-expense-tracker-ten.vercel.app**

GitHub: https://github.com/ashwinigangasani24-jpg/AI-Expense-Tracker

The UI is deployed. **Login and receipts will not work** until the API and cloud database are connected (see below).

---

## Current status

| Piece | Status |
|--------|--------|
| Frontend (Vercel) | Live at link above |
| `VITE_API_URL` on Vercel | **Not set** — browser cannot reach the API |
| Backend (Render) | Service name `ai-expense-tracker-api` exists but is **suspended** — reactivate or redeploy |
| Database | Your `.env` still uses **local** MongoDB — production needs **MongoDB Atlas** |

---

## Finish setup (3 steps, ~15 min)

### Step 1 — MongoDB Atlas

1. https://www.mongodb.com/cloud/atlas → free cluster  
2. **Database Access** → user + password  
3. **Network Access** → `0.0.0.0/0` (allow from anywhere)  
4. **Connect** → copy string, database name: `ai-expense-tracker`  
   Example: `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/ai-expense-tracker`

### Step 2 — Backend on Render

**One-click (uses `render.yaml` in repo):**

https://render.com/deploy?repo=https://github.com/ashwinigangasani24-jpg/AI-Expense-Tracker

Or: Render Dashboard → **New** → **Blueprint** → connect the GitHub repo.

Set these env vars in Render (required):

| Variable | Value |
|----------|--------|
| `MONGODB_URI` | Atlas connection string from step 1 |
| `GEMINI_API_KEY` | From https://aistudio.google.com/apikey |
| `AI_PROVIDER` | `gemini` |
| `CLIENT_URL` | `https://ai-expense-tracker-ten.vercel.app` |
| `ENABLE_AI_DEMO_FALLBACK` | `false` |
| `JWT_SECRET` | Long random string (Render can auto-generate) |

After deploy, test in browser:

`https://YOUR-SERVICE.onrender.com/api/health`

You should see JSON like `{"ok":true,...}` — not “Service Suspended”.

### Step 3 — Connect Vercel to the API

In project **ai-expense-tracker** on Vercel → **Settings** → **Environment Variables**:

| Name | Value |
|------|--------|
| `VITE_API_URL` | `https://YOUR-SERVICE.onrender.com/api` |

Must end with `/api`. Then **Redeploy** production.

**Or run from repo (PowerShell):**

```powershell
cd frontend
.\scripts\set-vercel-api.ps1 -ApiUrl "https://YOUR-SERVICE.onrender.com"
```

---

## Quick test after setup

1. Open https://ai-expense-tracker-ten.vercel.app  
2. Register a new account (production DB is separate from localhost)  
3. Upload a receipt image  

First request on Render free tier may take ~1 minute (cold start).

---

## If Render shows “Service Suspended”

Log in at https://dashboard.render.com → open the web service → **Resume** or create a **new** web service from the same repo (`backend` folder) and use the new URL in `VITE_API_URL`.
