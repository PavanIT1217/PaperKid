# PaperKid ✏️

Printable practice worksheets for kids in **Pre-K, Kindergarten, Grade 1, 2 and 3** — as a website and as an iOS / Android app from the same code.

Pick a worksheet, choose what to practice, and download a print-ready **A4** (or US Letter) PDF.

| Worksheet | What's on the page |
|---|---|
| 📚 **Workbook Packs** | One PDF with a cover + contents: Alphabet A–Z, Numbers 0–20, Pre-K Starter, Kindergarten Week, Grade 1, Grade 2–3, Summer Fun – each ends with a certificate |
| 📅 **Daily Practice** | Letter of the day (A→Z from any letter, remembering where you stopped, or by calendar), quick math, word of the day or pencil path, picture to color; 1–7 days with a week cover/star chart and answer page |
| 🏆 **Certificates & Charts** | Award certificates (Alphabet Star, Math Champion… or your own), weekly star charts, sticker charts |
| ✏️ **ABC Tracing** | Model letter with numbered stroke-order arrows, arrows on traced letters, optional fading practice (dark → light → start dots), picture words that follow the country setting |
| 📝 **Words & Names** | Names, custom words/sentences, Dolch sight words Pre-K → Grade 3 |
| 🖋️ **Cursive Writing** | Joined-up letters and words (Playwrite US Trad school font) |
| 🌏 **More Alphabets** | Other writing systems (currently Hindi/Devanagari and Telugu): 6 letters per page or one big letter per page |
| 〰️ **Pre-writing Lines** | Waves, zigzags, loops… from a picture to a picture |
| 📖 **I Can Read!** | Sight-word sentence + line-art picture to color + trace + write |
| 🔤 **ABC Games** | Beginning sounds, missing letters, match upper/lower case |
| 🔢 **Number Tracing** | 0–20 with ten frames and number words |
| ➕ **Math Practice** | Picture math → 3-digit, times tables, division, answer keys |
| 💯 **Number Sense** | Number bonds, 100 chart, odd/even, skip counting, before/after/between, greater/less |
| 🕒 **Telling Time** | Read or draw clock hands: hours → any minute |
| 🪙 **Counting Money** | Uses your country's money by default; US, Canadian and Australian dollars, pounds, euros, rupees |
| 🌀 **Mazes** | Easy → expert, fresh every time, answer pages |
| ✨ **Dot-to-Dot** | Numbers, letters or skip counting (2s, 5s, 10s) |
| 🧩 **What Comes Next?** | AB, AAB, ABC… picture patterns |
| 🔷 **Shapes** / 🖍️ **Coloring Pages** | Trace shapes; 13 bold line-art pictures |

Also: **share links** (settings travel in the URL – great for teachers), **♡ Save** worksheets to "My saved worksheets" on this device, installable web app (manifest + icons).

**Country setting** (top bar): International, United States, United Kingdom, India, Canada, Australia or Europe. It sets the "A is for…" picture words, the default currency, how dates are written and the default paper size (Letter for US/Canada, A4 elsewhere). It's guessed from the browser language the first time.

Page options: child's name printed on the page, name/date line, ink-saver mode, A4 or US Letter.

## How it works

- **React + Vite + TypeScript** single-page app (no backend, no login yet).
- Every page is drawn in millimetres on an HTML canvas (`src/lib/draw.ts`), so preview and PDF are identical.
- Letters and numbers use a hand-built **single-stroke "ball and stick" font** (`src/lib/glyphs.ts`) — real dotted center lines to trace, plus stroke-order numbers and arrows.
- PDFs are made in the browser with **jsPDF** at 200 dpi.
- The native apps wrap the same web build with **Capacitor**; on a phone, "Download" opens the share sheet (Save to Files, Print, Drive, WhatsApp…).

```
src/
  lib/glyphs.ts        single-stroke tracing font
  lib/draw.ts          page drawing helpers (guide lines, headers, tracing rows)
  lib/render.ts        canvas rendering, PDF export, save / print / share
  worksheets/*.ts      one file per worksheet type (options + page layout)
  components/          Home, Builder, options form, page preview
android/  ios/         Capacitor native projects
```

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

## Website (GitHub Pages)

`.github/workflows/deploy.yml` builds and publishes the site on every push to `main`.
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
Live at **https://paperkid.webappslab.com** (custom domain set in Settings → Pages).

## Mobile apps (App Store / Play Store)

```bash
npm run cap:android   # builds, syncs, opens Android Studio
npm run cap:ios       # builds, syncs, opens Xcode (macOS only)
```

From Android Studio: *Build → Generate Signed App Bundle* → upload the `.aab` to Google Play Console.
From Xcode: set your Team & bundle id (`com.webappslab.paperkid` in `capacitor.config.ts`), *Product → Archive* → upload to App Store Connect.
Before publishing you'll want app icons and splash screens (e.g. `npx @capacitor/assets generate`).

## Sign-in & saved worksheets (Firebase)

- **Sign in with Google** (top bar, website) uses Firebase Authentication, project `paperkid`.
- **♡ Save** stores worksheet settings in Cloud Firestore at `users/{uid}/saved/{id}` when signed in, and in the browser otherwise. Things saved before signing in are moved into the account on first sign-in.
- **My workbooks**: downloading a pack adds it to `users/{uid}/workbooks/{pack}` with a tick per part; when all parts are ticked a certificate button appears.
- **Daily Practice** "remember where we stopped" keeps the next letter in `users/{uid}/progress/daily`.
- Signed out, all of these are kept in the browser and moved into the account on sign-in.
- Security rules live in `firestore.rules`: each user can only read/write their own `users/{uid}/saved` documents. Publish them in the Firebase console (**Firestore Database → Rules**) or with `npx firebase-tools deploy --only firestore:rules`.
- The Firebase web config in `src/lib/firebase.ts` is public by design; the rules are what protect the data.
- In the iOS/Android apps the sign-in button is hidden for now (Google's pop-up sign-in needs a native plugin there); saving works on the device.

## Analytics (optional)

The site can send anonymous Google Analytics 4 events (page views, PDF downloads/prints, share links, saves).
Create a GA4 property, then in GitHub: **Settings → Secrets and variables → Actions → Variables → New variable** `GA_ID` = `G-XXXXXXX`, and re-run the deploy. Without it nothing is loaded.

## App icon, splash & store screenshots

- Source art: `assets/icon-only.png`, `icon-foreground.png`, `icon-background.png`, `splash.png`, `splash-dark.png`.
- Regenerate native icons/splash: `npx capacitor-assets generate --iconBackgroundColor '#ff8a3d' --splashBackgroundColor '#fff8f0' --splashBackgroundColorDark '#1f2133'` (then move the generated `icons/` folder into `public/`).
- Store screenshots: `store/screenshots/ios-*.png` (1290 × 2796, iPhone 6.7") and `android-*.png` (1080 × 2400).

## Ideas for next steps

- Google sign-in inside the native apps, child profiles and progress tracking
- More scripts (Tamil, Kannada…), cut-and-paste activities, word searches
