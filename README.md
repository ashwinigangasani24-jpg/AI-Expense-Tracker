# AI Expense Tracker

Production-oriented full-stack expense tracker with **JWT authentication**, **MongoDB**, **receipt image upload**, and **OpenAI vision** for OCR-style extraction, explanations, insights, and duplicate detection (by image hash).

## Architecture

| Layer | Stack |
|--------|--------|
| Frontend | React 18, Vite, React Router 7, Axios, Tailwind CSS, Recharts, react-hot-toast, jsPDF, SheetJS |
| Backend | Node 18+, Express, Mongoose, Multer, bcrypt, JWT, OpenAI SDK |
| Database | MongoDB |

## Folder structure

```
AI-Expense-Tracker/
├── backend/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js
│       ├── app.js
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── services/
│       └── utils/
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── hooks/
│       ├── context/
│       └── utils/
├── docs/
│   ├── API.md
│   └── sample-data.json
└── README.md
```

## Prerequisites

- **Node.js** 18 or newer  
- **MongoDB** running locally or a connection string (Atlas)  
- **OpenAI API key** with access to `gpt-4o-mini` (vision + JSON mode)

## Environment setup

### Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

- `MONGODB_URI` — e.g. `mongodb://127.0.0.1:27017/ai-expense-tracker`  
- `JWT_SECRET` — long random string  
- `OPENAI_API_KEY` — your key  
- `CLIENT_URL` — frontend origin (default `http://localhost:5173`)

### Frontend

Development uses the Vite proxy (`/api` → `http://localhost:5000`). No `.env` is required for local dev.

For production, either:

- Serve the SPA behind the same host as the API and reverse-proxy `/api`, or  
- Set `VITE_API_URL` to your API base and change `frontend/src/services/api.js` `baseURL` to use `import.meta.env.VITE_API_URL`.

## Run locally

**Terminal 1 — MongoDB**  
Ensure `mongod` is running (or use Atlas URI in `.env`).

**Terminal 2 — API**

```bash
cd backend
npm install
npm run dev
```

API: `http://localhost:5000` — health: `GET /api/health`

**Terminal 3 — Web**

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

## Sample data (optional)

Seed a demo user and random expenses (destructive: clears expenses globally and removes `demo@example.com`):

```bash
cd backend
npm run seed
```

Credentials: **demo@example.com** / **demo12345**

Structured JSON examples for API bodies live in `docs/sample-data.json`.

## Features checklist

- Register / login with bcrypt + JWT  
- Expense CRUD, categories, date filters  
- Monthly / yearly report endpoints  
- Dashboard + analytics with Recharts (pie + bar)  
- Receipt upload → Multer → OpenAI vision → structured JSON + narrative + tips + duplicate flag  
- Receipt images stored in MongoDB (`Buffer` on `Receipt`); served at `GET /api/receipts/:id/image`  
- Dark mode, responsive layout, toasts, loading states  
- Export PDF / Excel from expense list  
- Voice-assisted form fill (Web Speech API, best-effort parsing)  
- AI narrative on dashboard/analytics when `?ai=1`

## Production notes

- Use strong `JWT_SECRET`, HTTPS, and rate limits (already applied lightly).  
- **Large receipts**: BSON document limit is ~16MB; keep `MAX_FILE_MB` reasonable or move to S3/GridFS.  
- Run `npm run build` in `frontend` and serve `dist/` via CDN or static hosting; configure CORS `CLIENT_URL`.  
- Set `NODE_ENV=production` on the server for generic 500 messages.

## API documentation

See [docs/API.md](docs/API.md).

## License

MIT (adjust as needed for your project).
