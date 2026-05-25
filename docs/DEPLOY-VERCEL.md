# Deploy to Vercel (frontend) + Render (backend)

This app has two parts:

| Part | Host | Why |
|------|------|-----|
| **React frontend** | **Vercel** | Static Vite build |
| **Express API + OCR** | **Render** (or Railway) | Long requests, MongoDB, file uploads |

Vercel alone cannot run the full Node backend as-is.

---

## Step 1 — MongoDB Atlas (cloud database)

1. Create a free cluster at https://www.mongodb.com/cloud/atlas  
2. **Database Access** → create user + password  
3. **Network Access** → allow `0.0.0.0/0` (or Render IPs)  
4. **Connect** → copy connection string, e.g.  
   `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/ai-expense-tracker`

---

## Step 2 — Deploy backend on Render

1. Go to https://render.com → **New** → **Blueprint** (or Web Service)  
2. Connect GitHub repo: `ashwinigangasani24-jpg/AI-Expense-Tracker`  
3. Use `render.yaml` in the repo (root) or manual settings:
   - **Root directory:** `backend`
   - **Build:** `npm install`
   - **Start:** `npm start`
4. Environment variables:

   | Key | Value |
   |-----|--------|
   | `MONGODB_URI` | Your Atlas connection string |
   | `JWT_SECRET` | Long random string |
   | `GEMINI_API_KEY` | From Google AI Studio |
   | `AI_PROVIDER` | `gemini` |
   | `CLIENT_URL` | Your Vercel URL (after step 3), e.g. `https://your-app.vercel.app` |

5. Deploy and copy the API URL, e.g. `https://ai-expense-tracker-api.onrender.com`

Test: `https://YOUR-API.onrender.com/api/health`

---

## Step 3 — Deploy frontend on Vercel

### Option A — Vercel website (recommended)

1. https://vercel.com → **Add New** → **Project**  
2. Import GitHub repo `AI-Expense-Tracker`  
3. Settings:
   - **Framework Preset:** Vite  
   - **Root Directory:** `frontend` (or use root `vercel.json`)  
   - **Build Command:** `npm run build`  
   - **Output Directory:** `dist`  
4. **Environment variables:**

   | Name | Value |
   |------|--------|
   | `VITE_API_URL` | `https://YOUR-API.onrender.com/api` |

5. **Deploy**

### Option B — Vercel CLI

```bash
cd frontend
npx vercel login
npx vercel link
npx vercel env add VITE_API_URL
# paste: https://YOUR-API.onrender.com/api
npx vercel --prod
```

---

## Step 4 — CORS

After Vercel gives you a URL, update Render env:

`CLIENT_URL=https://your-project.vercel.app`

Redeploy the Render service.

---

## Troubleshooting

- **Login fails on Vercel:** `VITE_API_URL` must end with `/api` and point to live Render API.  
- **CORS error:** `CLIENT_URL` on backend must match exact Vercel URL (no trailing slash).  
- **Receipt upload slow:** Render free tier cold-starts; first OCR may take 1–2 minutes.
