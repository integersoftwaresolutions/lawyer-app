# Deploy on Render (frontend + backend)

Yes — put **both** on Render. You do not need Vercel.

| Service | Type | Folder | Notes |
|---------|------|--------|--------|
| **lawyer-api** | Web Service (Node **or** Docker) | `backend/` | Prefer Node + `npm install` / `npm start` |
| **lawyer-web** | Static Site | `frontend/` | Vite SPA → `dist` |

Config in this repo: [`render.yaml`](./render.yaml) (Blueprint) + [`backend/Dockerfile`](./backend/Dockerfile).

---

## Prerequisites

- GitHub/GitLab repo with this project
- [Render](https://render.com) account
- MongoDB Atlas (or any hosted Mongo) connection string
- Strong JWT secrets

Optional later: Stripe, OpenAI, Pinecone, SMTP.

---

## Recommended order

1. Deploy **API** first → get `https://lawyer-api-xxxx.onrender.com`  
2. Deploy **Web** with `VITE_API_BASE` / `VITE_SOCKET_URL` = that API URL  
3. Set API `CLIENT_ORIGIN` / `APP_BASE_URL` = the Static Site URL  
4. Redeploy API (and Web if you change `VITE_*`)

Vite bakes `VITE_*` at **build** time — changing them requires a **frontend rebuild**.

---

## Option A — Blueprint (one shot)

1. Push the repo (including `render.yaml`).
2. Render Dashboard → **New** → **Blueprint**.
3. Select the repo → apply Blueprint.
4. Fill `sync: false` env vars when prompted:

**API (`lawyer-api`)**

| Key | Value |
|-----|--------|
| `MONGO_URI` | Atlas URI |
| `CLIENT_ORIGIN` | Leave placeholder until web URL exists, then set to Static Site origin |
| `APP_BASE_URL` | Same as `CLIENT_ORIGIN` |
| `JWT_ACCESS_SECRET` | Long random string |
| `JWT_REFRESH_SECRET` | Different long random string |
| Others | Optional (email, Stripe, AI…) |

Blueprint already sets `COOKIE_SECURE=true` and `COOKIE_SAME_SITE=none` (needed because web + API are different `*.onrender.com` hosts).

**Web (`lawyer-web`)**

| Key | Value |
|-----|--------|
| `VITE_API_BASE` | `https://lawyer-api-xxxx.onrender.com` (no trailing slash) |
| `VITE_SOCKET_URL` | Same as `VITE_API_BASE` |
| `VITE_GOOGLE_CLIENT_ID` | Optional |

5. After both URLs exist, update `CLIENT_ORIGIN` / `APP_BASE_URL` on the API and **Manual Deploy** the API.

---

## Option B — Manual (two services)

### 1) Backend — Web Service

Render often defaults to **Node** (Build / Start commands). That is fine — you do **not** need Docker.

#### Path A — Node (what your screenshot shows)

1. **New** → **Web Service** → connect repo → branch `main`.
2. **Root Directory:** `backend`
3. Leave language as **Node** (no separate “Runtime” field on this screen).
4. Commands (use **npm**, not yarn):

| Field | Value |
|-------|--------|
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

5. **Instance:** Starter+ preferred (Free sleeps and breaks Socket.IO).
6. **Health Check Path:** `/health`
7. Environment (below):

```text
NODE_ENV=production
MONGO_URI=...
CLIENT_ORIGIN=https://YOUR-STATIC-SITE.onrender.com
APP_BASE_URL=https://YOUR-STATIC-SITE.onrender.com
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
```

Copy remaining keys from `backend/.env.example` as needed.  
Render injects `PORT` — the app already reads `process.env.PORT`.

8. Deploy → open `https://…onrender.com/health` → should return OK.

#### Path B — Docker (optional)

Docker is chosen **earlier** in the create flow, not on the Build/Start screen:

1. Go **Back** one step (or create a new Web Service).
2. When Render asks for **Language / Environment**, pick **Docker** (not Node).
3. Then set:
   - **Root Directory:** `backend`
   - **Dockerfile Path:** `./Dockerfile`
   - **Docker Build Context Directory:** `.`
4. Build/Start command fields disappear — Docker uses the Dockerfile `CMD`.
5. Same env vars and health check as Path A.

If you already started as Node, either finish with Path A, or delete the service and recreate with **Docker**.

---

### 2) Frontend — Static Site

1. **New** → **Static Site** → same repo.
2. Settings:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
3. **Redirects/Rewrites** (or Blueprint `routes`):
   - Source: `/*`
   - Destination: `/index.html`
   - Action: **Rewrite**
4. Environment (build-time):

```text
VITE_API_BASE=https://YOUR-API.onrender.com
VITE_SOCKET_URL=https://YOUR-API.onrender.com
```

5. Deploy → open the Static Site URL.

### 3) Wire CORS

On **lawyer-api**, set `CLIENT_ORIGIN` and `APP_BASE_URL` to the exact Static Site origin (https, no trailing slash) → redeploy API.

---

## Stripe (optional)

Webhook URL in Stripe Dashboard (live/test):

`https://YOUR-API.onrender.com/api/billing/webhooks/stripe`

Set `STRIPE_WEBHOOK_SECRET` to the Dashboard signing secret (not the local CLI `whsec`).

---

## Post-deploy checklist

- [ ] `GET /health` on API  
- [ ] Static site loads marketing / login  
- [ ] Login + refresh (cookies cross-subdomain)  
- [ ] Notifications / chat sockets  
- [ ] File uploads: work until instance restart — disk is ephemeral; use S3/R2 later for durable media  

---

## Common failures

| Symptom | Fix |
|---------|-----|
| CORS / blocked login | `CLIENT_ORIGIN` must match Static Site origin exactly |
| Refresh cookie fails | `COOKIE_SAME_SITE=none` + `COOKIE_SECURE=true` |
| API calls to `undefined/api` | Set `VITE_API_BASE`, **rebuild** Static Site |
| SPA 404 on refresh `/lawyer/...` | Add rewrite `/*` → `/index.html` |
| Sockets die / slow after idle | API on Free plan slept — use Starter+ |
| Uploads vanish | Ephemeral disk — expected without object storage |

---

## Local vs Render

| | Local | Render |
|--|--------|--------|
| Frontend | `cd frontend && npm run dev` (:5173) | Static Site |
| Backend | `cd backend && npm run dev` (:5000) | Docker Web Service |
| Stripe webhooks | `stripe listen …` | Dashboard endpoint |

Keep developing locally; push to Git for Render auto-deploys (per service root directory).
