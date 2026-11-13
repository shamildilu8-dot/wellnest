# Wellnest

Wellnest is an educational health insights web application where users can upload lab reports and professionally interpreted clinical genetic reports, review and confirm extracted values (test name, result, unit, date, and each lab's own reference range), log optional self-reported wellbeing check-ins, and ask cautious educational questions through a consent-gated server-side AI Guide.

> **Important Medical Notice:** Wellnest is strictly an educational information tool—not a diagnostic, treatment, or clinical decision-making tool. It never analyzes raw consumer DNA files (23andMe, AncestryDNA, VCF) and never infers stress, health, or biological age from facial photos.

---

## 1. Local Setup

### Prerequisites
- Node.js 20+ (tested with Node 22)
- npm 10+

### Install & Run
```bash
npm install
cp .env.example .env
npm run dev
```

The Express + Vite dev server runs at `http://localhost:3000`.

### Run Checks
```bash
# TypeScript check
npm run lint

# Unit tests (medical safety rules, raw-DNA guard, range evaluation, AI minimization, rate limiting)
npx --yes tsx --test src/utils/wellnestLogic.test.ts

# Production build
npm run build
```

---

## 2. Environment Variables (`.env`)

Never commit `.env` to version control (`.gitignore` already ignores `.env*` while keeping `.env.example`).

| Variable | Scope | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | Server-only | Google Gemini API key. Leave blank to keep AI disabled with a clear setup message. |
| `AI_DATA_CONTROLS_VERIFIED` | Server-only | Must be `"true"` before outgoing health context is sent to Gemini. Confirms you reviewed provider data-use controls. |
| `APP_URL` | Server-only | Public URL of your deployment (e.g. `https://wellnest.yourdomain.com`). |
| `VITE_SUPABASE_URL` | Client + Server | Your Supabase project URL (`https://YOUR_PROJECT_REF.supabase.co`). |
| `VITE_SUPABASE_ANON_KEY` | Client + Server | Your Supabase project anonymous public key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Optional server-side key for issuing 60-second signed URLs from `/api/storage/signed-url`. Never prefix with `VITE_`. |

---

## 3. Supabase Configuration (Auth, RLS & Private Storage)

1. Create a new project in [Supabase](https://supabase.com/).
2. Open **SQL Editor** in the Supabase dashboard and run the complete contents of `supabase/schema.sql`. This creates:
   - `public.reports`, `public.findings`, `public.wellbeing_checkins`, and `public.user_consents` tables with Row Level Security (`auth.uid() = user_id`).
   - A **private** Storage bucket named `wellnest-reports` (10 MB max, restricted MIME types) with per-user folder policies (`(storage.foldername(name))[1] = auth.uid()::text`).
3. In **Authentication -> Providers**, confirm **Email** sign-in is enabled.
4. In **Authentication -> URL Configuration**, add your local (`http://localhost:3000`) and production (`https://your-domain.com`) URLs to **Site URL** and **Redirect URLs**.
5. Copy your Project URL and Anon Key into `.env` (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`).

---

## 4. Step-by-Step Vercel Deployment & Custom Domain

### A. Prepare for Vercel
Because Wellnest includes both a Vite React frontend (`dist/`) and Express server endpoints (`/api/health`, `/api/reports/parse`, `/api/ai/guide`, `/api/storage/signed-url`):

1. Push your repository to GitHub/GitLab/Bitbucket (verify `.env` is **not** committed).
2. Sign in to [Vercel](https://vercel.com/) and click **Add New -> Project**, then import your repository.
3. Configure **Build & Output Settings** (or deploy `server.ts` / serverless functions):
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - Note: If deploying the full-stack Express `server.ts` directly on a Node runtime host (Cloud Run / Render / Railway / Fly.io), set start command to `NODE_ENV=production npm start` (or `npx tsx server.ts`). On Vercel, wrap `/api/*` handlers in `api/` Serverless Functions or deploy the Node Express entrypoint via Vercel's Express support (`vercel.json` routing `/api/(.*)` to `server.ts`).
4. Add Environment Variables in **Vercel -> Project Settings -> Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Server-side only)
   - `GEMINI_API_KEY` (Server-side only; omit if keeping AI disabled)
   - `AI_DATA_CONTROLS_VERIFIED` (`"true"` only after verifying your Gemini API tier/data-use controls)
   - `APP_URL` (`https://your-vercel-or-custom-domain`)
5. Click **Deploy**.

### B. Connect a Custom Domain on Vercel
1. Open **Vercel -> Project -> Settings -> Domains**.
2. Enter your custom domain (e.g. `wellnest.example.com` or apex `example.com`) and click **Add**.
3. Update DNS records at your domain registrar as instructed by Vercel:
   - For a subdomain (`app.yourdomain.com`): add a **CNAME** record pointing to `cname.vercel-dns.com`.
   - For an apex domain (`yourdomain.com`): add an **A** record pointing to `76.76.21.21` (or the exact IP shown in your Vercel Domains panel).
4. Wait for DNS propagation and automatic HTTPS/TLS certificate provisioning in Vercel.
5. Update **Supabase -> Authentication -> URL Configuration** and `APP_URL` to match your custom HTTPS domain.

---

## Owner Contact

- **DR. MUHAMMAD SHAMIL**
- **CONTACT NO.** `8075235897`
- **EMAIL:** `Shamildilu8@gmail.com`
