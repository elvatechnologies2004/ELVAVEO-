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

No secrets ship to the browser. The only server-side endpoint is `POST /api/contact`.

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

`.env.local` is gitignored. Only `.env.example` is committed.

### Important: verify your Resend domain

Until `elvaveo.com` is verified in Resend, the route falls back to
`onboarding@resend.dev`, which **only delivers to your own Resend account**.
The form will report success while the mail goes nowhere.

To go live:

1. Resend → **Domains** → add `elvaveo.com`.
2. Add the DNS records Resend shows you (SPF, DKIM, MX) at your DNS provider.
3. Once verified, set `RESEND_FROM_EMAIL="ELVAVEO <hello@elvaveo.com>"`.

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
| `/api/contact` | `POST` only — sends email via Resend |
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
  about/ services/ products/ projects/ contact/
  api/contact/route.ts
  error.tsx  not-found.tsx  loading.tsx  robots.ts  sitemap.ts

components/
  layout/             # Navbar, Footer
  forms/              # ContactForm
  icons/              # Social brand glyphs
  about/ products/ projects/   # page-specific pieces
  *.tsx               # home sections + shared UI

data/                 # static content arrays (products, services, projects…)
lib/                  # cn.ts, constants.ts (brand, routes, product links)
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
