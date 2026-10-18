# Sanjivani College of Engineering — Result Management System (RMS)
# Production Deployment & System Operations Guide

---

## 🏛️ Executive Summary

The Result Management System (RMS) is an enterprise full-stack academic web platform purpose-built for **Sanjivani College of Engineering, Kopargaon** (Autonomous Institute Affiliated to Savitribai Phule Pune University, Pune).

This guide provides definitive, security-hardened operational instructions for deploying, monitoring, scaling, and backing up the RMS platform across local staging and production environments.

---

## 🏗️ Architecture & Component Topology

```
                  +----------------------------------------------+
                  |               Cloudflare / WAF               |
                  |     (DDoS Protection, SSL Termination)       |
                  +----------------------+-----------------------+
                                         |
                                         v
                  +----------------------------------------------+
                  |               Nginx Reverse Proxy            |
                  |            (Port 80/443, Rate Limiting)      |
                  +-----------+----------------------+-----------+
                              |                      |
             /api/* requests  |                      |  Static assets (HTML, JS, CSS)
                              v                      v
         +-----------------------------+    +-----------------------------+
         |      Node.js / Express      |    |      Frontend Client        |
         |         (Port 5000)         |    |    (Vite / React / Nginx)   |
         |  - JWT Cookie Auth (HttpOnly)|    |  - Student Portal           |
         |  - Automatic Result Engine  |    |  - Faculty Marks Entry      |
         |  - Review & Publication     |    |  - COE Admin Console        |
         |  - Vector PDF Generator     |    |  - Responsive Marksheet UI  |
         +--------------+--------------+    +-----------------------------+
                        |
                        | Mongoose ODM (TLS / SCRAM-SHA-256)
                        v
         +-------------------------------------------------+
         |             MongoDB Replica Set                 |
         |        (Local / MongoDB Atlas M10+)             |
         |   - Student & Faculty Profiles                  |
         |   - Academic Catalogs & Grading Schemes         |
         |   - Course Marks & Published Statements         |
         |   - Immutable Security Audit Logs               |
         +-------------------------------------------------+
```

---

## ⚙️ Environment Variables Reference

### 1. Backend (`backend/.env`)

| Variable | Type | Required | Default | Description | Production Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PORT` | Number | Optional | `5000` | Port on which Express server listens. | Set by container or process manager (e.g. `5000`). |
| `NODE_ENV` | String | **Required** | `development` | Runtime environment mode (`development` or `production`). | Must be set to `production` to suppress stack traces. |
| `MONGODB_URI` | URI | **Required** | `mongodb://127.0.0.1:27017/sanjivani_rms` | Authoritative MongoDB connection string. | Use Atlas replica set connection string with TLS and credentials. |
| `CLIENT_URL` | String | **Required** | `http://localhost:5173` | Allowed frontend origin(s) for CORS. Supports comma-separated list. | `https://rms.sanjivani.edu.in` |
| `JWT_SECRET` | String | **Required** | — | Secret key used to sign and verify HMAC-SHA256 JWT tokens. | 256-bit random hex string. |
| `JWT_EXPIRES_IN` | String | Optional | `7d` | Token session validity duration. | `7d` (or `24h` for stricter compliance). |
| `COOKIE_NAME` | String | Optional | `rms_token` | HTTP-only cookie name storing authentication token. | `rms_token` |
| `COOKIE_SAMESITE` | String | Optional | `lax` (`none` in prod) | SameSite attribute for the session cookie. | `lax` for same-domain/reverse-proxy; `none` for decoupled domains. |

#### Generating a Strong Production JWT Secret
Execute the following in your deployment shell:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 2. Frontend (`frontend/.env`)

| Variable | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `VITE_API_URL` | URL | **Required** | `http://localhost:5000/api` | Base HTTP endpoint for the Express backend API. In unified reverse-proxy setups, set to `/api`. |
| `VITE_COLLEGE_NAME` | String | Optional | `Sanjivani College of Engineering` | Institution name displayed in branding headers. |

---

## 🔒 Security Hardening & Best Practices

### 1. Production Authentication Cookies
- **`httpOnly: true`**: Eliminates client-side JavaScript access to tokens, mitigating Cross-Site Scripting (XSS) token theft.
- **`secure: true`**: Automatically activated when `NODE_ENV=production`. Cookies are strictly transmitted over HTTPS TLS connections.
- **`sameSite`**:
  - Use `lax` when frontend and backend are hosted under the same domain or behind an Nginx reverse proxy.
  - Use `none` with `secure: true` if frontend is on a third-party host (e.g. `https://rms.vercel.app`) and backend is on another (e.g. `https://api.sanjivani.edu.in`).

### 2. Cross-Origin Resource Sharing (CORS)
- In production, specify explicit domain origins in `CLIENT_URL`. Never use wildcard `*` with `credentials: true`.
- The Express CORS middleware dynamically validates the `Origin` header against the whitelist.

### 3. Error Masking & Information Leakage Prevention
- In `production` mode, the global Express error handler suppresses internal file paths, module stacks, and MongoDB engine exceptions, returning standard `{ "success": false, "message": "Internal server error" }`.
- Password hashes and document version tags (`__v`) are permanently stripped during Mongoose document serialization via `toJSON` and `toObject` transform hooks.

### 4. Database Security & MongoDB Atlas Hardening
- **Network Access Whitelisting**: Restrict MongoDB Atlas network access strictly to the static IP addresses of backend API servers. Avoid `0.0.0.0/0`.
- **Database User Roles**: Create a dedicated database user with least-privilege `readWrite` access scoped exclusively to the `sanjivani_rms` database.
- **TLS/SSL Encryption**: All MongoDB connections enforce TLS v1.2+ encryption in transit.
- **Encryption at Rest**: Ensure MongoDB Atlas storage encryption (AES-256) is active for candidate records and marks.

---

## 🗄️ Database Backup & Disaster Recovery

Academic examination data must be safeguarded with scheduled, versioned, and immutable backup routines.

### 1. Manual Backup (`mongodump`)
```bash
# Backup sanjivani_rms database to an encrypted local archive
mongodump --uri="mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/sanjivani_rms" \
  --gzip --archive="/backups/rms_backup_$(date +%Y%m%d_%H%M%S).gz"
```

### 2. Manual Restoration (`mongorestore`)
```bash
# Restore sanjivani_rms database from archive
mongorestore --uri="mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/sanjivani_rms" \
  --gzip --archive="/backups/rms_backup_YYYYMMDD_HHMMSS.gz" --drop
```

### 3. Automated Cron Backup Schedule (Linux Server)
Create a daily backup cron job in `/etc/cron.daily/rms-db-backup`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/sanjivani_rms"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

mongodump --uri="$MONGODB_URI" --gzip --archive="$BACKUP_DIR/rms_$DATE.gz"

# Retain backups for 90 days, delete older archives
find "$BACKUP_DIR" -type f -name "*.gz" -mtime +90 -exec rm {} \;
```

---

## 🚀 Independent Deployment Instructions

### Option A: Unified Deployment Behind Nginx (Recommended)

In a traditional Linux VPS (Ubuntu 22.04 LTS / AWS EC2 / DigitalOcean), Nginx serves the Vite production build and reverse-proxies API calls to the PM2-managed Node.js process.

#### 1. Build the Frontend
```bash
cd frontend
npm install
npm run build
# Production assets created in frontend/dist
```

#### 2. Start Backend with PM2 Process Manager
```bash
cd backend
npm install --production
npm install -g pm2
pm2 start server.js --name "sanjivani-rms-api" --env NODE_ENV=production
pm2 save
pm2 startup
```

#### 3. Nginx Configuration (`/etc/nginx/sites-available/rms.conf`)
```nginx
server {
    listen 80;
    server_name rms.sanjivani.edu.in;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name rms.sanjivani.edu.in;

    ssl_certificate /etc/letsencrypt/live/rms.sanjivani.edu.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rms.sanjivani.edu.in/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Frontend Single Page App (SPA)
    location / {
        root /var/www/rms/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Reverse Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts for batch operations and PDF generation
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }
}
```

---

### Option B: Decoupled Cloud Deployment (Vercel + Render / Railway)

#### Frontend on Vercel
1. Link repository to Vercel.
2. Root directory: `frontend`.
3. Framework preset: `Vite`.
4. Environment variable:
   - `VITE_API_URL`: `https://rms-api.sanjivani.edu.in/api`
5. Configure `vercel.json` for SPA rewrites:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

#### Backend on Render / Railway
1. Root directory: `backend`.
2. Build command: `npm install`.
3. Start command: `node server.js`.
4. Set environment variables:
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: `https://rms-client.vercel.app`
   - `COOKIE_SAMESITE`: `none`
   - `MONGODB_URI`: Atlas connection string
   - `JWT_SECRET`: Random 256-bit key

---

## 🩺 System Health Monitoring

The RMS API exposes a production-ready health check endpoint:

### `GET /api/health`
- **Authentication**: None (Public)
- **Status Code**: `200 OK` (Healthy) or `503 Service Unavailable` (Degraded)

#### Sample Response
```json
{
  "status": "ok",
  "system": "Sanjivani College of Engineering - Result Management System (RMS)",
  "stage": "Stage 8: Final Audit and Deployment",
  "version": "1.0.0",
  "environment": "production",
  "uptimeSeconds": 86420,
  "database": {
    "status": "connected",
    "readyState": 1
  },
  "timestamp": "2026-10-18T10:00:00.000Z"
}
```

Integrate this endpoint with uptime monitoring services (e.g. UptimeRobot, BetterUptime, Datadog) to alert the IT department if database connectivity fails or server restarts.

---

## ✅ Deployment Checklist

### Pre-Deployment (Pre-Flight)
- [ ] Confirm all environment variables are populated in production secrets vault.
- [ ] Verify `JWT_SECRET` is at least 32 bytes (64 hex characters) and not the default fallback.
- [ ] Ensure `NODE_ENV` is explicitly set to `production`.
- [ ] Confirm `backend/.env` and `frontend/.env` are listed in `.gitignore` and not tracked.
- [ ] Verify MongoDB Atlas IP whitelist allows the production server IP addresses.
- [ ] Execute the full automated test suite (`npm test` in backend) and verify 100% pass rate.
- [ ] Verify production frontend build compiles without errors (`npm run build` in frontend).

### Launch Day
- [ ] Seed initial administrative user or verify COE admin account credentials.
- [ ] Provision initial Academic Sessions (`2024-2025`, `2025-2026`) and active Grading Schemes.
- [ ] Configure SSL/TLS certificates and enforce HTTP to HTTPS redirection.
- [ ] Confirm CORS headers allow only verified institutional frontend domains.
- [ ] Test student login, faculty mark entry, admin approval, and result publication end-to-end.
- [ ] Download a test Statement of Grades PDF and verify layout, margins, and SPPU autonomous details.

### Post-Deployment
- [ ] Configure uptime monitoring pinging `https://rms.sanjivani.edu.in/api/health`.
- [ ] Set up automated database snapshots in MongoDB Atlas (daily with 30-day retention).
- [ ] Verify log rotation is active for PM2 / Nginx access and error logs.
- [ ] Hand over administrative credentials to the Controller of Examinations (COE).

---

## 📊 Summary of Completed Features & Test Results

### Features Delivered Across Stages 1 – 8
1. **Academic Portal UI (Stage 1):** Responsive, institutional blue-and-white portal conforming to Sanjivani College guidelines.
2. **Authentication & RBAC (Stage 2):** Secure bcrypt password hashing, HTTP-only JWT cookies, Student, Faculty, and Admin roles.
3. **Admin Dashboard & Academic Catalogs (Stage 3):** Student/Faculty management, department/session configurations, course catalog with strict credits/limits validation, and batch CSV imports with row error reports.
4. **Faculty Marks Workflow (Stage 4):** Subject-assigned faculty mark entry, real-time draft saving, row-level error highlighting, and COE review submission.
5. **Result Calculation Engine (Stage 5):** Configurable grading scheme models (UGC 10-point scale), exact credit calculations ($CR$, $EC$, $GP$, $SGPA$), rounding conventions, and missing marks detection.
6. **Moderation & Publication (Stage 6):** Controlled four-tier lifecycle (`Draft` $\rightarrow$ `Submitted` $\rightarrow$ `Approved` $\rightarrow$ `Published`), COE return-for-correction with mandatory reason, batch locking, post-publication audited corrections, and immutable audit logs.
7. **Student Portal & PDF Marksheet (Stage 7):** Multi-term academic progression, publication gates, cross-student privacy enforcement, and A4 vector Statement of Grades PDF generator (`pdfkit`).
8. **Final Audit & Deployment (Stage 8):** Production CORS multi-domain configuration, enhanced health diagnostics, security masking, environment templates, and 292 passing automated assertions.

### Master Automated Test Statistics
```text
==================================================================================
TEST SUITE RUNNER EXECUTION SUMMARY
==================================================================================
Stage 2 (Authentication & Database Security):        21 Passed, 0 Failed
Stage 3 (Admin Management & CSV Validation):         29 Passed, 0 Failed
Stage 4 (Faculty Marks Entry & Lock Enforcement):    43 Passed, 0 Failed
Stage 5 (Automatic Result Engine & SGPA Math):       73 Passed, 0 Failed
Stage 6 (Moderation, Publication & Audit Trail):     48 Passed, 0 Failed
Stage 7 (Student Portal & Statement of Grades PDF):  31 Passed, 0 Failed
Stage 8 (Final Audit, Boundary Testing & Reliability): 47 Passed, 0 Failed
----------------------------------------------------------------------------------
TOTAL ASSERTIONS VALIDATED:                         292 PASSED, 0 FAILED (100%)
==================================================================================
```

---

## ⚠️ Known Limitations & Future Roadmap

1. **Email / SMS Notifications:** Current implementation logs return-for-correction notices and publication events in the database audit log; direct SMTP/SMS notification triggers can be added as an optional plugin.
2. **Multi-Factor Authentication (MFA):** Recommended for Examination Cell administrator accounts in future compliance updates.
3. **Archived Microfiche Scan Uploads:** Legacy pre-autonomous SPPU marksheet scanned images prior to 2020 are stored out-of-band and could be integrated into student historical profile attachments.
