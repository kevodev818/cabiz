# ⚡ CA Lead Engine

**Automated California new-business lead generation & outreach system.**

Monitors the California Secretary of State database for newly filed LLCs and corporations, extracts contact info and mailing addresses, and automatically reaches out via email and handwritten-style physical mailers — all within 48 hours of filing.

---

## What It Does

1. **Scans** the CA Secretary of State (BizFile Online) for new LLC/Corp filings on a configurable schedule
2. **Extracts** agent name, email, phone, and physical mailing address for each filing
3. **Sends** personalized outreach emails via your Outlook/SMTP account
4. **Queues** handwritten-style physical mailers via Lob, Handwrytten, or CSV export
5. **Tracks** outreach status through a pipeline (New → Email Sent → Mailer Queued → Contacted)
6. **Exports** lead data and mailing addresses as CSV for external tools

---

## Quick Start (5 minutes)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd ca-lead-engine
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your details:
- **Required**: `SENDER_NAME`, `SENDER_COMPANY`
- **For emails**: SMTP or Azure credentials (see below)
- **For mailers**: Lob API key (see below)

### 3. Run Locally

```bash
npm run dev
```

This starts both the backend (port 3001) and frontend (port 5173).
Open **http://localhost:5173** in your browser.

### 4. First Scan

Click **"Scan Now"** in the header to populate your lead database with California filings. The system auto-seeds demo data on first run, and will use real SOS data once the scraper is configured for production.

---

## Email Setup

### Option A: Microsoft Outlook (Recommended)

Sends emails from your actual Outlook mailbox. Emails appear in your Sent folder.

1. Go to [portal.azure.com](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations** → **New registration**
3. Name: `CA Lead Engine`
4. Redirect URI: `http://localhost:3001/auth/callback` (or your production URL)
5. Under **API Permissions**, add:
   - `Mail.Send` (Application)
   - `User.Read` (Application)
   - Grant admin consent
6. Under **Certificates & secrets**, create a new client secret
7. Add to `.env`:

```env
AZURE_CLIENT_ID=your-client-id-here
AZURE_CLIENT_SECRET=your-secret-here
AZURE_TENANT_ID=your-tenant-id-here
OUTLOOK_EMAIL=your-email@outlook.com
```

### Option B: SMTP (Any Provider)

Works with Outlook, Gmail, SendGrid, Mailgun, Amazon SES, etc.

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=Your Name
```

**For Outlook SMTP**: Generate an app password at [account.microsoft.com/security](https://account.microsoft.com/security)

**For Gmail SMTP**: Use `smtp.gmail.com` port 587 with an [App Password](https://myaccount.google.com/apppasswords)

---

## Physical Mailer Setup

### Option A: Lob (Automated)

[Lob](https://lob.com) sends real printed letters via USPS.

1. Sign up at [lob.com](https://lob.com) (free test mode available)
2. Get your API key from the dashboard
3. Add to `.env`:

```env
LOB_API_KEY=test_xxxxxxxxxxxx
LOB_FROM_NAME=Your Name
LOB_FROM_ADDRESS=123 Main St
LOB_FROM_CITY=Los Angeles
LOB_FROM_STATE=CA
LOB_FROM_ZIP=90001
```

### Option B: Handwrytten

[Handwrytten](https://handwrytten.com) sends robot-handwritten cards that look genuinely personal.

### Option C: Manual Export

Click **"Export Addresses"** to download a CSV with all lead mailing addresses, then upload to any print-and-mail service or use with mail merge.

---

## Deploying to Production

### Vercel + Railway (Recommended)

**Frontend (Vercel):**
```bash
npm run build
# Deploy the `dist` folder to Vercel
```

**Backend (Railway):**
1. Push to GitHub
2. Connect repo to [Railway](https://railway.app)
3. Set environment variables in Railway dashboard
4. Railway auto-detects Node.js and runs `npm start`

### Single-Server Deploy (VPS)

```bash
# On your server (Ubuntu, etc.)
git clone <repo> && cd ca-lead-engine
npm install
cp .env.example .env  # Edit with production values
npm run build
NODE_ENV=production npm start
```

The server serves both the API and the built frontend on a single port.

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "server/index.js"]
```

```bash
docker build -t ca-lead-engine .
docker run -p 3001:3001 --env-file .env ca-lead-engine
```

---

## Customization

### Templates
Go to **Templates** tab to edit email and mailer copy. Use variables like `{{businessName}}`, `{{agentFirstName}}`, `{{city}}`, etc.

### Targeting
Go to **Settings** → **Targeting** to filter by entity type, city, or industry.

### Automation
Go to **Settings** → **Automation** to enable auto-send emails and auto-queue mailers when new filings are detected.

### Scan Frequency
Adjust in **Settings** → **Automation** → **Scan Interval** (1h to 24h).

---

## Project Structure

```
ca-lead-engine/
├── server/
│   ├── index.js          # Express API + cron scheduler
│   ├── database.js       # NeDB embedded database
│   ├── scraper.js        # CA SOS BizFile scraper
│   ├── emailer.js        # Email service (Graph + SMTP)
│   └── mailer.js         # Physical mailer service (Lob)
├── src/
│   ├── App.jsx           # Main app with global state
│   ├── main.jsx          # Entry point
│   ├── utils/api.js      # Frontend API client
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── LeadsTable.jsx
│   │   ├── OutreachQueue.jsx
│   │   ├── Templates.jsx
│   │   └── Settings.jsx
│   ├── components/
│   │   ├── LeadDetail.jsx
│   │   ├── StatusBadge.jsx
│   │   └── Toast.jsx
│   └── styles/globals.css
├── data/                  # Auto-created NeDB databases
├── .env.example
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

## Connecting Real CA SOS Data

The scraper module (`server/scraper.js`) includes the structure for scraping bizfileonline.sos.ca.gov. To activate real data:

1. Open `server/scraper.js`
2. In the `scrapeRealFilings()` function, uncomment and configure the axios request
3. The CA SOS site uses a search API at `https://bizfileonline.sos.ca.gov/api/Records/search`
4. You may also use their bulk data exports from [sos.ca.gov/business-programs](https://www.sos.ca.gov/business-programs/business-entities/statements-of-information)

**Tip**: Start with demo data to test your full pipeline (templates, email, mailers), then switch to real data once everything is working.

---

## License

MIT — use however you like for your business.
