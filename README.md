# bluestar

A mobile-first web app for birthing a modernised 1998 Furby (ESP32-S3 inside)
under the stars: name it, pick where it is, and confirm the moment. The server
stamps that instant once, forever, and the app casts a full natal chart from it.

- `#/birth` — the ritual: name → photograph the real Furby (on-device cutout)
  → sleeping Furby → permanence warning → birth animation → Big Three reveal
  → certificate number
- `#/furby/:id/certificate` — natal wheel, Sun/Moon/Rising medallions,
  Furby-flavoured planet interpretations, and the real numbers underneath
- `#/furby/:id` and `/settings` — Cosmic ID header, editable name and owner,
  locked Birth Record

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

Set `VITE_BIRTH_API_URL=https://your-birth-service` to use a real birth
service instead of the built-in local stand-in.

Portrait processing runs on the phone by default (`@imgly/background-removal`,
AGPL-3.0; the model downloads once). `VITE_PORTRAIT_PROCESSOR=http` with
`VITE_PORTRAIT_API_URL` swaps in a server-side segmenter; `none` keeps photos
uncut.

## Stack

Vite · React 19 · TypeScript · react-router (hash) · zustand (persisted) ·
astronomy-engine · vitest. No UI framework: the late-90s celestial toy look is
hand-written CSS in `src/styles/`.
