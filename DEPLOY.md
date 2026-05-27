# Deployment Guide — weaidinitiative.org

This guide walks you through replacing the current website at **weaidinitiative.org** with the new one in this folder. No coding required.

---

## What's in this folder

```
weaid-site/
├─ index.html            ← Homepage
├─ about.html            ← About
├─ contact.html          ← Contact
├─ impact/               ← Impact Areas (6 thematic pages)
├─ initiatives/          ← Featured initiatives (4)
├─ citizen/              ← The Citizen platform (6 pages + working report form)
├─ policy/               ← Policy & Insights hub
├─ media/                ← Newsroom
├─ get-involved/         ← Donate, Volunteer, Partner
├─ legal/                ← Legal Notice & Privacy
└─ assets/               ← CSS, JS, future images
```

29 HTML pages in total, all sharing one stylesheet and one JavaScript file.

---

## Before you deploy — quick checklist

Every page that needs real data is marked with a yellow **[PLACEHOLDER]** badge so it is impossible to miss. Fill these in **before** going live, in this order of priority:

### CRITICAL (do these first)

1. **`legal/legal-notice.html`**
   - Replace `[VERIFY FULL LEGAL NAME]` with the registered legal name
   - Replace `[PROVIDE CAC NUMBER]` with the Corporate Affairs Commission registration number
   - Replace `[FULL STREET ADDRESS]` with the street address in Bauchi
2. **`get-involved/donate.html`**
   - Replace `[PROVIDE ACCOUNT NAME / BANK / ACCOUNT NUMBER / SWIFT]` with real bank details
   - Replace the two `#` placeholders with your live Paystack and Flutterwave payment links
3. **`about.html`**
   - Verify the founding year shown next to `[VERIFY]`
   - Replace `[PROVIDE CAC NUMBER]`

### HIGH (do these next)

4. **`index.html`** impact stats — replace the four `data-count="..."` numbers (12000, 350, 18, 6) with real figures, and remove the `[PLACEHOLDER]` badges underneath.
5. **`index.html` and `media/index.html`** — replace the placeholder `.feature-media .placeholder-img` blocks with real photos:
   - Save a 1200×900 photo into `assets/img/`
   - Replace `<div class="placeholder-img">...</div>` with `<img src="../assets/img/your-photo.jpg" alt="…">`
6. **`about.html`** team section — replace `[Programmes Lead]`, `[Policy & Research]`, `[Civic-Tech Lead]` placeholders with real names, photos and bios.
7. **`contact.html`** — replace `[FULL STREET ADDRESS]`.

### LATER (when content is ready)

8. **`policy/index.html`** — replace placeholder card descriptions with real brief summaries and link real PDFs.
9. **`citizen/learn.html`** — write the actual civic education explainers in English and add Hausa translations.
10. **`assets/js/site.js`** — the Hausa dictionary covers the navigation, hero CTAs and key Citizen-platform labels. Expand the `i18n.ha` object as you translate more content.

---

## Deploying to your existing host (LiteSpeed at weaidinitiative.org)

Your current site is served by LiteSpeed. You almost certainly have one of these admin tools:

- **cPanel** (most common)
- **Plesk**
- **DirectAdmin**
- **A custom panel from your host**

The process is identical in all of them: you upload the contents of the `weaid-site` folder so that they replace the current site files.

### Step 1 — Back up the current site (5 minutes)

You always do this first. **Never deploy without a backup.**

1. Log in to your hosting control panel (your existing weaidinitiative.org admin)
2. Open **File Manager**
3. Navigate to the folder that holds your current site files — usually `public_html/` or `www/`
4. Select everything in that folder, click **Compress**, choose **ZIP**
5. Download the resulting `.zip` to your Mac. Keep it somewhere safe. This is your safety net.

### Step 2 — Upload the new site (10 minutes)

1. On your Mac, **right-click the `weaid-site` folder** and choose **Compress** — you'll get `weaid-site.zip`
2. In the hosting File Manager, open `public_html/` (or wherever the current site lives)
3. **Delete the old site files** (you have a backup — this is safe)
4. Click **Upload** and upload `weaid-site.zip`
5. Once uploaded, right-click the zip in File Manager and choose **Extract**
6. **Move** the extracted contents up one level so that `index.html` sits directly in `public_html/` — NOT inside `public_html/weaid-site/`
7. Delete the now-empty `weaid-site` folder and the zip

### Step 3 — Fix the directory-listing issue from the audit (2 minutes)

Your audit found that visiting `/headlines/` exposes a raw directory listing. To stop that:

1. In File Manager, in the root of `public_html/`, look for a file called `.htaccess`
2. If it exists, open it. If not, create a new file and name it exactly `.htaccess`
3. Add this single line at the top:
   ```
   Options -Indexes
   ```
4. Save the file

Directory listings are now disabled site-wide.

### Step 4 — Verify (5 minutes)

Open these URLs in your browser and make sure they all load correctly:

- `https://weaidinitiative.org/` (homepage)
- `https://weaidinitiative.org/about.html`
- `https://weaidinitiative.org/citizen/index.html`
- `https://weaidinitiative.org/citizen/report.html` (try submitting a test report)
- `https://weaidinitiative.org/get-involved/donate.html`
- `https://weaidinitiative.org/legal/legal-notice.html`
- `https://weaidinitiative.org/headlines` → should give a clean 404, not a directory listing

Test on your phone too. The site is mobile-first; if anything looks broken on a phone, screenshot it and send it back to me.

---

## Alternative — deploy to a fresh host

If you'd rather move off LiteSpeed entirely, any of these will host this site for free or very low cost:

| Host          | Cost                | Best for                                  |
|---------------|---------------------|-------------------------------------------|
| **Cloudflare Pages** | Free            | Fast global delivery, free SSL, very easy |
| **Netlify**   | Free               | Drag-and-drop deploy, very easy           |
| **Vercel**    | Free (nonprofit)   | Same drag-and-drop simplicity             |
| **GitHub Pages** | Free            | If you want version control               |

The shortest path is Cloudflare Pages:

1. Go to `dash.cloudflare.com` → Pages → Create application → Upload assets
2. Drag the `weaid-site` folder onto the page
3. Cloudflare gives you a preview URL (something.pages.dev)
4. Connect your `weaidinitiative.org` domain under Custom Domains
5. Update your DNS at your domain registrar to point to Cloudflare (Cloudflare guides you through this)

---

## How The Citizen reporting form works right now

In this version, the reporting form on `citizen/report.html` stores reports **in the visitor's browser** (`localStorage`). This is a **prototype** — useful for demoing the platform to donors and partners, but not a real backend.

To make it production-ready you have two options:

**Option A — Use a form service (fastest, no backend code):**
- Sign up for **Formspree** or **Tally** (both free for small volumes)
- They give you a form endpoint URL
- In `assets/js/site.js`, find the `citizen-report-form` submit handler and replace the `localStorage` block with a `fetch()` call to your endpoint

**Option B — Build a real backend:**
- A small Python/Node API connected to a database (Postgres or SQLite)
- An admin dashboard for the governance team to update report statuses
- This is what the brief calls "Admin Dashboard Requirements" (section 11)

Happy to scope and quote Option B as a follow-up.

---

## What I left out (and why)

The brief mentions a few things that are intentionally **not** in this delivery:

- **Working multi-language content beyond UI labels** — Hausa toggle flips the navigation, hero CTAs, and key Citizen-platform labels. Translating the entire body content needs a Hausa-speaking writer.
- **SMS/WhatsApp integration** — listed as "future expansion" in the brief.
- **Geo-tagged issue mapping & analytics dashboard** — needs the production backend (Option B above).
- **Real reports/white-paper PDFs** — placeholders link to `#` until your content team uploads the documents.

Everything else from the brief is in.

---

## Questions, fixes or follow-up

Send screenshots of anything that looks wrong and I'll patch it. Common follow-up tasks:

- Add a new news story → duplicate one of the cards in `media/index.html` and edit
- Add a new team member → duplicate a card in `about.html`
- Add a new partner logo → drop the logo into `assets/img/` and update the `index.html` partners section
- Change the brand colors → edit the variables at the top of `assets/css/style.css`

— End of deployment guide
