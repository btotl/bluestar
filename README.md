# bluestar

A mobile-first web app for birthing a modernised 1998 Furby (ESP32-S3 inside)
under the stars: name it, pick where it is, and confirm the moment. The server
stamps that instant once, forever, and the app casts a full natal chart from it.

- `#/birth` — the ritual: name → photograph the real Furby (on-device cutout)
  → sleeping Furby → permanence warning → birth animation → Big Three reveal
  → certificate number
- `#/furby/:id/reveal` — the emotional reveal: name, sun sign, Sun · Moon · Rising
- `#/furby/:id/certificate` — the permanent record as a collectible
- `#/furby/:id/chart` — the full natal wheel with Placements, Houses, Aspects
- `#/furby/:id` and `/settings` — profile, editable name and owner, locked Birth Record

Everything astrological derives from one immutable `BirthRecord`
(`src/birth/birthRecord.ts`), created once when the server confirms the Birth.

Read [`docs/birth-flow.md`](docs/birth-flow.md) for the refined brief, the
backend contract and the chart maths, and
[`docs/birth-portrait.md`](docs/birth-portrait.md) for the Birth Portrait
pipeline (camera, background removal, storage, privacy).

## Run it

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # chart engine + time zone tests
npm run build      # static output in dist/ (hash routing, host anywhere)
```

## Deploy

`.github/workflows/pages.yml` builds and publishes to GitHub Pages at
`https://btotl.github.io/bluestar/` on every push to `main` or a `claude/*`
branch. The repository is public, so Pages is free; the workflow enables the
Pages site on its first successful run (or set Settings → Pages → Source to
**GitHub Actions** by hand). Because the app uses hash routing, no rewrites
are needed.

`npm run build:single` writes `dist-single/index.html`, one self-contained
file (all scripts and styles inlined; the portrait model still loads from
img.ly's CDN). Drop it on https://app.netlify.com/drop or any static host
for an instant URL.

Set `VITE_BIRTH_API_URL=https://your-birth-service` to use a real birth
service instead of the built-in local stand-in.

Portrait processing runs on the phone by default (`@imgly/background-removal`,
AGPL-3.0; the model downloads once). `VITE_PORTRAIT_PROCESSOR=http` with
`VITE_PORTRAIT_API_URL` swaps in a server-side segmenter; `none` keeps photos
uncut.

## Stack

Vite · React 19 · TypeScript · react-router (hash) · zustand (persisted) ·
astronomy-engine · Motion for React · Three.js (optional, lazy atmosphere) ·
vitest. No UI framework: the late-90s celestial toy look is hand-written CSS
in `src/styles/`. See [`docs/birth-cinematic.md`](docs/birth-cinematic.md)
for the chart and Birth animation architecture.
