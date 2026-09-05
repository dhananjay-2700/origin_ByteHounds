# 🚀 Pravaah AI Deployment Guide

Pravaah AI is production-ready. You can deploy it using any of the three options below depending on your preference.

---

## ⚡ Option 1: Vercel (Frontend) + Render / Railway (Backend)
> **Recommended for easiest setup, zero maintenance, and free tier availability.**

### Step 1: Deploy Backend on Render or Railway

#### Via Render (Free Web Service)
1. Go to [render.com](https://render.com) and log in with your GitHub account.
2. Click **New +** → **Web Service**.
3. Select your GitHub repository (`origin_ByteHounds`).
4. Configure the service:
   - **Name**: `pravaahx-backend`
   - **Language**: `Python 3`
   - **Root Directory**: Leave blank (or `.`)
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && python main.py`
5. Click **Create Web Service**.
6. Once deployed, copy your backend URL (e.g., `https://pravaahx-backend.onrender.com`).

#### Via Railway
1. Go to [railway.app](https://railway.app) and connect your GitHub repo.
2. Set the build command: `pip install -r backend/requirements.txt`
3. Set the start command: `cd backend && python main.py`
4. Generate a domain in **Settings** → **Networking** → **Generate Domain**.

---

### Step 2: Deploy Frontend on Vercel or Netlify

#### Option A: Via Vercel
1. Go to [vercel.com](https://vercel.com) and click **Add New...** → **Project**.
2. Select your `origin_ByteHounds` repository.
3. Configure project settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click `Edit` and select `frontend`.
4. Add **Environment Variables**:
   - `BACKEND_URL`: `https://pravaahx-backend.onrender.com` *(Replace with your actual backend URL from Step 1)*
5. Click **Deploy**.

#### Option B: Via Netlify
1. Go to [netlify.com](https://netlify.com) and log in with GitHub.
2. Click **Add new site** → **Import an existing project** → Select GitHub → Select `origin_ByteHounds`.
3. Netlify will automatically detect [`netlify.toml`](file:///Users/dhananjay/Documents/GitHub/origin_ByteHounds/netlify.toml) configured in the repository:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/.next`
4. Click **Add environment variables** (or go to **Site configuration** → **Environment variables**):
   - Key: `BACKEND_URL`
   - Value: `https://pravaahx-backend.onrender.com` *(Your backend URL from Step 1)*
5. Click **Deploy site**. Netlify will build and publish your Next.js frontend with SSL enabled.

---

## 🐳 Option 2: 1-Command Docker Compose (VPS / Self-Hosted)
> **Recommended for deploying to AWS EC2, DigitalOcean Droplet, Hetzner, or any Linux server.**

Both `Dockerfile.backend`, `Dockerfile.frontend`, and `docker-compose.yml` are pre-configured in the repository.

### Commands to Run:
```bash
# 1. Clone the repository on your server
git clone https://github.com/your-username/origin_ByteHounds.git
cd origin_ByteHounds

# 2. Start all services in the background
docker compose up --build -d

# 3. Check container health
docker compose ps
```

- **Frontend**: Available at `http://YOUR_SERVER_IP:3000`
- **Backend API**: Available at `http://YOUR_SERVER_IP:8000`
- **API Documentation**: Available at `http://YOUR_SERVER_IP:8000/docs`

To view live logs:
```bash
docker compose logs -f
```

---

## ⚙️ Option 3: 1-Click Render Blueprint
If you use Render, a `render.yaml` specification is already included in the root directory:
1. In Render, go to **Blueprints**.
2. Connect this repository.
3. Render will automatically read `render.yaml` and provision both the Python backend and Next.js frontend with linked networking.

---

## 🔒 Production Environment Variables Reference

| Variable | Service | Default | Description |
| :--- | :--- | :--- | :--- |
| `BACKEND_URL` | Frontend | `http://127.0.0.1:8000` | URL of the deployed FastAPI backend |
| `PORT` | Backend / Frontend | `8000` / `3000` | Port for the HTTP server to bind to |
| `HOST` | Backend | `0.0.0.0` | Bind address (0.0.0.0 for external access) |

---

## ✅ Post-Deployment Verification Checklist

1. **Backend Health Check**:
   ```bash
   curl https://your-backend-url.com/api/health
   # Expected response: {"status":"ok","timestamp":"..."}
   ```
2. **Model Predictions**:
   ```bash
   curl https://your-backend-url.com/api/forecast
   # Expected response: JSON containing 24-hour demand series
   ```
3. **Frontend Ingestion**:
   - Open your frontend URL in the browser.
   - Confirm KPIs render live load numbers, LightGBM peak forecast, and area chart curves.
