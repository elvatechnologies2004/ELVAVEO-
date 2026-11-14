# ELVAVEO Website

The marketing site for **ELVAVEO** — a software studio that builds digital products, SaaS platforms, and web experiences.

- **Live site:** [elvaveo.com](https://elvaveo.com)
- **Products:**
  - **Finlo** — personal finance app · [finlo.elvaveo.com](https://finlo.elvaveo.com)
  - **FinloCRM** — CRM for leads, deals and sales · [crm.elvaveo.com](https://crm.elvaveo.com)
- **Contact:** hello@elvaveo.com

---

## Tech Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (CSS-first `@theme` tokens) |
| Icons | `lucide-react` |
| Animation | `framer-motion` + an IntersectionObserver `Reveal` wrapper |
| Brand glyphs | `simple-icons`, `@fortawesome/free-brands-svg-icons` |
| Email delivery | Resend HTTP API (no SDK) |
| Hosting | Vercel |

Secrets remain server-side. API routes handle contact submissions and
cookie-authenticated administrator operations; public privacy-policy reads are
limited to the current published version by database RLS.

---

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run build      # production build
npm start          # serve the production build
npm run typecheck  # tsc --noEmit
```

> `next lint` was removed in Next.js 16, so there is no `lint` script. Type
> safety is enforced by `npm run typecheck`, which runs as part of `npm run build`.

---

## Environment Variables

Copy the example file and fill it in:

```bash
cp .env.example .env.local        # macOS / Linux
copy .env.example .env.local      # Windows PowerShell
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | **Yes** | Resend API key. Server-only — never expose it as `NEXT_PUBLIC_`. |
| `CONTACT_EMAIL` | No | Inbox for form submissions. Defaults to `hello@elvaveo.com`. |
| `RESEND_FROM_EMAIL` | No | Sender address. See the note below. |
| `ADMIN_SESSION_SECRET` | **Yes** | Server-only HMAC signing secret with at least 32 characters. Keep its value stable to preserve active sessions. |
| `ADMIN_EMAIL` | **Yes** | Existing administrator email used for Supabase Auth authorization. |
| `ADMIN_ALLOWED_EMAILS` | No | Comma-separated additional administrator emails. |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Public Supabase key; database RLS limits policy reads to the current published version. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Server-only key for admin verification and database mutations. Never expose it to browser code. |

`.env.local` is gitignored. Only `.env.example` is committed.

### Resend Sending Domain

The verified sending domain in Resend is `notify.elvaveo.com`.
The incoming business email is hosted separately on OmuCloud (`hello@elvaveo.com`).
The contact form sends from: `ELVAVEO Website <notifications@notify.elvaveo.com>`
with Reply-To set to the customer's validated email address.

Set on Vercel:
- `RESEND_API_KEY`: Production Resend API Key (`re_...`)
- `RESEND_FROM_EMAIL`: `"ELVAVEO Website <notifications@notify.elvaveo.com>"`
- `CONTACT_EMAIL`: `hello@elvaveo.com`

---

## Routes

| Route | Page |
| --- | --- |
| `/` | Home |
| `/about` | About |
| `/services` | Services |
| `/products` | Products (Finlo, FinloCRM) |
| `/projects` | Projects |
| `/contact` | Contact |
| `/privacy-policy` | Currently published privacy policy |
| `/admin` | Administrator panel |
| `/admin/login` | Administrator login |
| `/api/contact` | `POST` only — sends email via Resend |
| `/api/admin/auth` | Administrator login and session status |
| `/api/admin/privacy-policy` | Admin-only policy draft and version operations |
| `/sitemap.xml` | Generated from `lib/constants.ts` |
| `/robots.txt` | Generated |
| `*` | Branded 404 (`app/not-found.tsx`) |

---

## Project Structure

```
app/
  layout.tsx          # fonts + site-wide metadata
  page.tsx            # home
  globals.css         # ELVAVEO design tokens (navy, blue, cyan, violet, ice)
  about/ services/ products/ projects/ contact/ privacy-policy/ admin/
  api/contact/route.ts
  api/admin/auth/route.ts
  api/admin/privacy-policy/route.ts
  error.tsx  not-found.tsx  loading.tsx  robots.ts  sitemap.ts

components/
  layout/             # Navbar, Footer
  forms/              # ContactForm
  icons/              # Social brand glyphs
  about/ products/ projects/   # page-specific pieces
  *.tsx               # home sections + shared UI

components/admin/     # administrator panel
data/                 # static content arrays (products, services, projects…)
lib/                  # dataStore.ts, security.ts, supabase.ts, site constants
supabase/migrations/  # versioned database migrations
types/                # shared types
public/               # brand, images, icons, og-image.png
scripts/              # optional Windows-only brand asset generator
```

Brand identity lives in `lib/constants.ts` — site URL, description, contact
address, the route table, and product links. The navbar, footer, sitemap, and
metadata all read from it, so they cannot drift apart.

---

## Contact Form

`components/forms/ContactForm.tsx` → `POST /api/contact` → Resend → `hello@elvaveo.com`.

Request:

```json
{ "name": "...", "email": "...", "subject": "New Project", "message": "...", "company": "" }
```

Response:

```json
{ "success": true, "message": "Message sent successfully." }
```

Spam and abuse handling:

- Server-side validation of name, email, topic, and message.
- The topic must be one of the listed options (allow-list, not free text).
- Per-field length caps.
- A hidden honeypot field (`company`); bots that fill it get a fake success.
- HTML-escaped email body.
- Replying to the notification goes to the visitor's own address.
- Provider errors are logged server-side and never returned to the browser.

Client states: `idle` → `sending` → `success` / `error`. The submit button is
disabled while a request is in flight, so a message cannot be sent twice.

---

## Deployment to Vercel

1. Push the repository to GitHub.
2. Vercel → **Add New** → **Project** → import the repo. The framework preset
   is detected automatically.
3. Add the environment variables under **Settings → Environment Variables**
   (at minimum `RESEND_API_KEY`).
4. Deploy.
5. **Settings → Domains** → add `elvaveo.com`, then add the `www` redirect and
   the DNS records Vercel displays. Do not hardcode DNS values — use exactly
   what Vercel shows for your project.

Production runs on `https://elvaveo.com`.

### Admin authentication and privacy-policy data

Admin login is verified through the existing Supabase Auth account or an
existing active `admin_credentials` record. The application no longer accepts
a shared environment master password or demo verification codes. Existing
Supabase Auth users and database credential rows are not deleted. Legacy
unsalted database passcodes verified by the service-only RPC are rehashed to
bcrypt after successful login; salted PBKDF2 records remain supported and are
not rewritten. Keep the current `ADMIN_SESSION_SECRET` stable when deploying
so existing signed sessions remain valid.

Before promoting this auth change, set the administrator email allowlist and
the Supabase URL, anon key, and server-only service-role key in the staging
environment. Sign in with the existing administrator account, then verify
`GET /api/admin/auth` reports an authenticated session and that the protected
privacy-policy API is accessible. If the administrator currently relies only
on the old environment master-password path, first provision that identity in
Supabase Auth or the existing `admin_credentials` table. Do not remove the
obsolete `ADMIN_PASSWORD` deployment variable until this replacement login is
verified; the new application code does not read it.

Apply `supabase/migrations/20261114_privacy_policy_versions.sql` to Supabase
before deploying the updated application. It adds the verifier's `passcode_salt`
column and the database-backed policy schema. The migration creates an empty
document and does not add or publish legal text. The legacy import tool
backs up a stored JSON document before importing it:

```powershell
node scripts\migrate-privacy-policy.mjs
node scripts\migrate-privacy-policy.mjs --apply --backup="C:\secure-backups\privacy-policy.json" --actor="admin@example.com"
```

The first command validates a legacy source without changing data. The second
requires the migration to be applied and the operator to provide a new,
non-overwriting backup path. If no legacy JSON is present, the script exits
without importing; the current code-defined public fallback remains unchanged.
Never commit a backup or a service-role key.

### Optional: regenerate brand icons

`scripts/generate-brand-assets.ps1` rebuilds `icon-32.png`, `icon.png`,
`apple-icon.png`, and `og-image.png`.

Favicons come from the **master brand mark** (a 1254×1254 rounded square with a
transparent margin) — not from the wide wordmark, which is the wrong shape for a
favicon. The 1.1 MB master is intentionally not committed; pass its path in:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\generate-brand-assets.ps1 `
  -Favicon "C:\path\to\favicon elvaveo.png"
```

Browser favicons keep their alpha so the rounded tile floats on any tab
background, and the 32 px entry is listed first so tabs fetch 2 KB instead of
the 256 px file. The Apple touch icon is cropped and flattened onto white,
because iOS composites transparent PNGs onto **black**.

Windows PowerShell only.

---

© ELVAVEO. All rights reserved.
