# Birth Portrait

The Birth Portrait is a transparent cutout of the owner's real, physical Furby,
taken during the Birth ritual. Once the Furby is born, that portrait is part of
its permanent record and the character the owner sees everywhere in the app.

## Flow

```
Name → SHOW US YOUR FURBY → camera / choose photo
  → FINDING YOUR FURBY… → SEPARATING FURBY FROM THE MORTAL REALM… → PREPARING BIRTH PORTRAIT…
  → IS THIS YOUR FURBY?  (Use this portrait / Retake)
  → back to the Birth record (retake any time)
  → BIRTH MY FURBY → THIS MOMENT CANNOT BE CHANGED → Confirm Birth
  → portrait sealed as the Birth Portrait
```

Taking a photo never changes a Furby. Until Confirm Birth the portrait is a
draft that can be retaken or removed; only the confirm step writes
`birthPortraitId` into the Furby record and locks the portrait. A failed or
skipped portrait never blocks the Birth: the drawn Furby stands in.

## Architecture

```
src/portrait/
  types.ts          PortraitProcessor interface, PortraitAsset, PortraitRef, errors
  raster.ts         pure RGBA helpers: cleanAlpha, coverage, alphaBounds, padBox, defringe (unit-tested)
  imageUtils.ts     decode with EXIF orientation, downscale, encode WebP/PNG, camera frame grab
  pipeline.ts       processCapture(): source → segmentation → refine → crop → master/ui/thumb
  processors/
    imgly.ts        on-device IS-Net via @imgly/background-removal (default)
    http.ts         POST to a segmentation service (e.g. rembg)
    passthrough.ts  keeps the photo uncut (fallback the owner can choose)
    index.ts        createPortraitProcessor() from VITE_PORTRAIT_* env
  portraitDb.ts     IndexedDB store for blobs + object-URL cache + orphan pruning
  usePortraitUrl.ts React hook: id + size → object URL

src/components/
  FurbyPortrait.tsx          the one way to render a Furby (photo or sprite fallback)
  portrait/PortraitCapture.tsx  intro → camera → processing → review → error
```

### `PortraitProcessor`

```ts
interface PortraitProcessor {
  id: string; label: string; runsOnDevice: boolean; producesAlpha: boolean
  warmUp?(onProgress?): Promise<void>
  removeBackground(input: Blob, options?): Promise<Blob>   // in: oriented JPEG, out: PNG with alpha
}
```

Selection is one env var:

| `VITE_PORTRAIT_PROCESSOR` | Provider | Notes |
| --- | --- | --- |
| `imgly` (default) | On-device, ONNX Runtime Web | Photo never leaves the phone. First use downloads the ~80 MB `isnet_fp16` model (or ~40 MB `isnet_quint8` via `VITE_PORTRAIT_MODEL`); the browser caches it. Self-host the model files with `VITE_PORTRAIT_ASSETS` (absolute URL or a path such as `/portrait-assets/`). |
| `http` | `POST {VITE_PORTRAIT_API_URL}/api/portraits/segment` | Body is the image; response is a PNG with alpha. The service must not keep uploads. |
| `none` | Passthrough | No cutout at all; only for environments without a model. |

Two more switches for the on-device provider: `VITE_PORTRAIT_WORKER=true`
runs inference in a Web Worker (off by default; the worker bundle is fragile
under some bundlers and the main-thread path was the one verified here) and
`VITE_PORTRAIT_DEBUG=true` logs the library's progress. Inference is
single-threaded unless the page is cross-origin isolated
(`Cross-Origin-Opener-Policy: same-origin` and
`Cross-Origin-Embedder-Policy: require-corp`); with those headers ONNX Runtime
uses several threads and the cutout takes a few seconds instead of ten to
twenty.

**Self-hosting the model.** Mirror `resources.json` and the chunk files it
lists for your model and the two wasm builds from
`https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/` into a
folder served next to the app, then build with
`VITE_PORTRAIT_ASSETS=/portrait-assets/`. About 76 MB for `isnet_quint8`.

**Licence note.** `@imgly/background-removal` is AGPL-3.0. That is fine for a
personal project, but publishing the app means offering its source under a
compatible licence, or switching to the `http` provider backed by something
like `rembg` (MIT). The interface exists so that swap is one line.

### Pipeline guarantees

1. **Orientation and privacy.** Every capture is decoded through an `<img>`
   (which applies EXIF orientation) and redrawn on a canvas. Canvases carry no
   metadata, so GPS and the rest of the EXIF never reach the processor or
   storage. Birth location comes only from the explicit location step.
2. **Size.** The source is downscaled to a 1600 px long edge before
   segmentation so a 12 MP camera file does not exhaust a phone's memory.
3. **Alpha clean-up.** Alpha below 10 is zeroed, edge pixels are defringed
   toward neighbouring solid fur to kill background halos, and a coverage
   check (1.2 %–96 % of the frame) turns "found nothing" or "kept everything"
   into `PortraitNotFoundError` and the friendly error screen.
4. **Crop.** The cutout is auto-cropped to its alpha bounds with 6 % padding
   so ears and feet are always inside.
5. **Derivatives.** `master` (≤1600), `ui` (≤800), `thumb` (≤240), WebP with
   alpha where the browser can encode it (Safari falls back to PNG).
6. **Storage.** Blobs live in IndexedDB (`bluestar-portraits`). The Furby
   record only stores a `PortraitRef` (id, dimensions, processor, locked). The
   archival source is kept only for drafts and dropped at Birth (`sealPortrait`).
   Abandoned drafts are pruned the next time the Birth screen opens.

### Original vs. Celestial

There is one stored image. `FurbyPortrait` renders it in different treatments:

| variant | used for | treatment |
| --- | --- | --- |
| `thumbnail`, `profile` | lists, headers, settings, chips | navy badge, soft shadow |
| `birth` | Birth screen and sequence | asleep (dim, breathing, z's) → lit (glow, light sweep, float) |
| `celestial` | wheel centre, review screen | halo, orbiting pixel stars |
| `certificate` | framed certificate portrait | chrome/gold frame with corner stars |

The light sweep uses the portrait's own alpha as a CSS mask, so effects never
touch the pixels. Themes can evolve without re-processing anyone's Furby.

## Data model changes (backwards compatible)

- `Furby.birthPortraitId?: string` and `Furby.portraits?: PortraitRef[]`.
  Existing Furbys have neither and render the sprite.
- `BirthRequest.birthPortraitId?` and `BirthRequest.clientRequestId` (required;
  the server returns the same birth for a repeated id, so a double tap cannot
  create two Furbys). `BirthRecord.birthPortraitId?`.
- `useFurbyStore.addPortrait()` for later photographs; it refuses a second
  `kind: 'birth'` portrait.

Backend: the record carries the portrait id; uploading the master blob to the
birth service is a follow-up (`PUT /api/furbys/:id/portraits/:portraitId`).

## Refresh, retries, duplicates

- The Birth draft (name, place, moment, portrait ref, idempotency key) lives in
  sessionStorage; the portrait blob is already in IndexedDB. A refresh restores
  both.
- The confirm button is guarded in-flight and the request carries a
  `clientRequestId` minted when the card opens.

## Tested

- Unit: raster helpers, local birth server idempotency and future-time refusal.
- Headless Chromium at 390×844 with the model self-hosted (the sandbox's
  proxy could not serve the CDN to the browser): a synthetic Furby photo and
  a real 1998 Furby photo through the on-device IS-Net model, review, refresh
  mid-birth, double-tap confirm, the full sequence, certificate, profile,
  settings, and the failure path with a blank photo followed by "use the
  photo uncut".
- Not yet run on a physical iPhone: Safari camera capture, HEIC files and WebP
  encoding fall back by design (file input with `capture`, `<img>` decode,
  PNG), but need a device check.

## Later (designed for, not built)

Front/left/right views (`PortraitRef.view`), a photo timeline
(`Furby.portraits`), printable certificates from the `certificate` variant,
group portraits by composing several `FurbyPortrait`s, uploading masters to
the birth service.
