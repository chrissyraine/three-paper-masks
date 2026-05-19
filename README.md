# Three Paper Masks

A serialized mood-mystery video series. Static site — no build step, no framework.

---

## Local preview

**Option A — Python (built-in, no install):**
```bash
python -m http.server 8080
```
Open `http://localhost:8080`

**Option B — Node `serve`:**
```bash
npm install -g serve
serve .
```

**Option C — VS Code Live Server extension:**
Right-click `index.html` → Open with Live Server.

> The WebGL tune-in intro fires once per browser (tracked via `localStorage` key `tpm-tuned-in`).  
> Clear localStorage or open an incognito window to replay it during development.

---

## File structure

```
threepapermasks/
├── index.html                     — Main site
├── broadcast-notes.html           — Press / EPK page
├── chapters/
│   ├── 01.html – 05.html          — Chapter detail pages
├── styles/main.css                — All styles
├── scripts/
│   ├── main.js                    — Audio, cursor, drift, lazy-load, form
│   └── tune-in.js                 — WebGL scroll intro (Three.js)
├── assets/
│   ├── images/
│   │   ├── rabbit-mask.png        — Easter egg icon
│   │   ├── hero-poster.jpg        — Hero section bg
│   │   ├── tune-target.jpg        — WebGL intro end-frame (16:9) ← YOU SUPPLY
│   │   ├── og-image.jpg           — Social share image (1200×630) ← YOU SUPPLY
│   │   └── grain.png              — Film grain texture ← YOU SUPPLY
│   ├── audio/
│   │   └── transmission.mp3       — Ambient audio loop (compress to <300KB)
│   └── videos/
│       ├── hero.mp4               — Hero background video ← YOU SUPPLY
│       ├── chapter-01.mp4         — ← YOU SUPPLY
│       ├── chapter-02.mp4
│       ├── chapter-03.mp4
│       ├── chapter-04.mp4
│       └── chapter-05.mp4
├── robots.txt
├── sitemap.xml
└── README.md
```

---

## Assets you still need to supply

| File | Spec |
|------|------|
| `assets/images/tune-target.jpg` | 16:9, high-contrast still of trio in masks, under 250KB |
| `assets/images/og-image.jpg` | 1200×630px, dark bg, series title, rabbit motif |
| `assets/images/grain.png` | Seamless noise PNG, 200×200px+, tileable |
| `assets/videos/hero.mp4` | 540p H.264, loopable, no audio, under 500KB |
| `assets/videos/chapter-01.mp4` through `chapter-05.mp4` | Your chapter recordings |
| `assets/audio/transmission.mp3` | Compress current 8.8MB file to under 300KB |

---

## GitHub setup (first time)

Run these commands from the `threepapermasks/` folder:

```bash
git init
git add .
git commit -m "Initial commit — Three Paper Masks"
```

Then create a new repo on GitHub (go to github.com → New repository → name it `threepapermasks` → **do not** initialize with README). Copy the remote URL it gives you, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/threepapermasks.git
git branch -M main
git push -u origin main
```

After that, every future update is just:
```bash
git add .
git commit -m "your message"
git push
```

---

## Vercel deployment

1. Go to [vercel.com](https://vercel.com) → **Add New → Project**
2. Import your `threepapermasks` GitHub repository
3. Build settings:
   - **Framework Preset:** Other
   - **Build Command:** *(leave blank)*
   - **Output Directory:** `./`
4. Click **Deploy**

Vercel deploys automatically on every push to `main`.

**Analytics:** Go to your Vercel project → **Analytics tab** → Enable. No code changes needed — the comment in every HTML file is already there as a reminder.

**Custom domain:** Project → **Settings → Domains** → add `threepapermasks.com` → follow the DNS instructions (usually a CNAME or A record at your registrar).

---

## Third-party services

### MailerLite newsletter
Already wired up. Account `2173538`, form `woyX7H`. The universal script and embedded form are in `index.html`. Log in to MailerLite to manage subscribers and customize the form.

### Transmissions form (`/api/transmit`)
The contact form POSTs JSON to `/api/transmit` — this route returns 404 until you add a backend. Options:
- **Vercel Serverless Function:** add `api/transmit.js` (Node.js) to forward submissions to email
- **Third-party:** swap the fetch URL in `main.js` for a Formspree or Basin endpoint

---

## Design notes

- **WebGL tune-in:** scroll-driven Three.js intro — static resolves to a masked trio image as user scrolls. Fires once per browser. Mobile/no-WebGL gets plain fade-in.
- **Ambient audio:** muted by default, session-persisted. Waveform toggle button bottom-right. Audio CTA appears in hero on first visit.
- **Drifting rabbit:** CSS/JS drift animation. One drift every 45–90 seconds, random target position, fades in and out.
- **Custom cursor:** dot with `mix-blend-mode: difference`, RAF lerp at factor 0.12. Desktop only (`hover: hover`).
- **CRT transitions:** View Transitions API, cross-document. Chapter nav triggers the effect.
- **Chapter captions on 02 and 03:** still placeholder — replace before those chapters go live.
- **`sitemap.xml` and `canonical` URLs:** hardcoded to `https://threepapermasks.com` — update if the domain differs.
