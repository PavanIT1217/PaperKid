# PaperKid ✏️

Printable practice worksheets for kids in **Pre-K, Kindergarten, Grade 1, 2 and 3** — as a website and as an iOS / Android app from the same code.

Pick a worksheet, choose what to practice, and download a print-ready **A4** (or US Letter) PDF.

| Worksheet | What's on the page |
|---|---|
| ✏️ **ABC Tracing** | One page per letter: big model letter with numbered stroke-order arrows, dotted letters on handwriting lines, "A is for Apple" picture word, free-writing row |
| 🔢 **Number Tracing** | Numbers 0–20 with ten frames (count pictures or color boxes) and the number word to trace |
| 📝 **Words & Names** | Your child's name, any custom words/sentences, or Dolch sight-word lists (Pre-K → Grade 3) |
| ➕ **Math Practice** | Picture math, addition, subtraction, multiplication, division; within 5/10/20, 2- and 3-digit; column or in-line; answer keys; "New problems" button |
| 🔷 **Shapes** | 12 shapes to trace in rows, or big trace-and-color pages |
| 〰️ **Pre-writing Lines** | Help the bee reach the flower: straight, zigzag, waves, rainbows, castles, loops… |
| 🖍️ **Coloring Pages** | 13 bold line-art pictures with the word to trace underneath |

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
The site will be at `https://<your-user>.github.io/PaperKid/`.

## Mobile apps (App Store / Play Store)

```bash
npm run cap:android   # builds, syncs, opens Android Studio
npm run cap:ios       # builds, syncs, opens Xcode (macOS only)
```

From Android Studio: *Build → Generate Signed App Bundle* → upload the `.aab` to Google Play Console.
From Xcode: set your Team & bundle id (`com.paperkid.app` in `capacitor.config.ts`), *Product → Archive* → upload to App Store Connect.
Before publishing you'll want app icons and splash screens (e.g. `npx @capacitor/assets generate`).

## Ideas for next steps

- Google sign-in to save favourite worksheets and children's profiles
- Cursive handwriting, mazes, dot-to-dot, cut-and-paste, telling time, money
- More languages / alphabets
