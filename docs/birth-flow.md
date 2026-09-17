# The Birth flow

This document is the refined brief for the Furby Birth experience, the decisions
made while building it, and the contract the backend must honour.

## Refined brief

Birthing a Furby should feel like a slightly mystical late-90s toy ritual, not
account setup. The one rule that matters more than anything else:

> A Furby's birth instant and birth place are immutable identity data. They are
> written exactly once, by the server, at the moment the final **Confirm Birth**
> request arrives. The natal chart is derived from that record and is therefore
> immutable too. Names, owners and personality can change; when the Furby came
> into existence cannot.

The first-time flow is:

```
Unborn Furby → Name → Show us your Furby (birth portrait) → Location → "Use this moment"
  → Permanence warning → Birth animation → Big Three reveal
  → Full Birth Certificate → Furby profile
```

The portrait step is described in [birth-portrait.md](birth-portrait.md).

### Screens

| Route | Screen | Purpose |
| --- | --- | --- |
| `#/birth` | **Birth** | Sleeping Furby, name, location, moment. "✦ Birth my Furby ✦" opens the permanence card. |
| (overlay) | **This moment cannot be changed** | Darkens the screen, lights the Furby, shows the live projected moment, place and coordinates. Cancel / Confirm Birth. |
| (overlay) | **Birth sequence** | ~11 s: frozen timestamp → black → one pixel star → wonky constellation → zodiac wheel spins and settles → Furby opens its eyes → "NAME HAS BEEN BORN" → ☉ sign → ☾ Moon, ↑ Rising → FURBY № 000184. |
| `#/furby/:id/certificate` | **Birth Certificate** | Portrait inside natal wheel, Big Three medallions with Furby taglines, interactive wheel, planet-by-planet Furby behaviour, full technical data. |
| `#/furby/:id` | **Profile** | Cosmic ID header (name · ♍ Virgo · ☾ Sagittarius · ↑ Gemini · Born dd.mm.yyyy), temperament, owner, device link. |
| `#/furby/:id/settings` | **Settings** | Rename and owner are editable. **Birth Record** is displayed with padlocks: "Birth records cannot be altered." |
| `#/` | **Nursery** | Every Furby on this device; redirects to Birth when empty. |

### Visual direction

Late-90s celestial toy packaging, not a modern horoscope app: midnight navy,
faded violet, cream and yellow stars, chrome accents, chunky uppercase display
type (Bungee), pixel labels (Silkscreen), monospace data (IBM Plex Mono), a
faint grain overlay, ordered-dither highlights, embossed plastic buttons, and a
hand-drawn SVG Furby whose eyelids are real shapes so "it opens its eyes" is a
single class change. The natal wheel underneath is a proper chart: sign ring,
Placidus cusps, planet glyphs with collision spreading, aspect lines coloured
by harmony.

### Language

Every interpretation is written about a toy's behaviour, never a person:

- ☉ Sun — *The Furby within*
- ☾ Moon — *The Furby when nobody is watching*
- ↑ Rising — *The Furby the world meets*
- Venus — *How NAME demands affection.* · Mars — *How NAME behaves when displeased.*
- Mercury — *How NAME communicates with humans.* · Jupiter — *Where NAME becomes excessive.*
- Saturn — *The lessons NAME would prefer not to learn.* … and so on for every point.

The copy lives in `src/astro/interpretations.ts`, one line per point per sign.

## The moment is stamped on the server

The UI never invents a birth time in "use this moment" mode:

1. The Birth screen and the confirmation card show a **live** clock, labelled
   "stamped the instant you confirm".
2. Pressing **Confirm Birth** sends a `BirthRequest` with no timestamp.
3. The server reads its own clock when the request arrives and writes the
   `BirthRecord`. That timestamp is canonical and is the only one ever used.
4. The client computes the natal chart from the returned record and stores
   the record deep-frozen. The store exposes no mutation for it.

"Choose another birth time" exists for Furbys that already exist. The request
then carries `requestedMomentUtc` and the record is marked `mode: "chosen"`,
which the certificate and settings display honestly.

Until the backend exists, `LocalBirthServer` in `src/api/birthApi.ts` plays the
server: it reads `Date.now()` *inside* `confirmBirth()` and issues sequential
certificate numbers. Set `VITE_BIRTH_API_URL` to switch to `HttpBirthServer`.

## Backend contract

`POST {VITE_BIRTH_API_URL}/api/furbys/birth`

Request body (`BirthRequest`):

```json
{
  "name": "Mimi",
  "location": {
    "name": "Bellingen",
    "region": "New South Wales",
    "country": "Australia",
    "latitude": -30.4519,
    "longitude": 152.8986,
    "timeZone": "Australia/Sydney"
  },
  "requestedMomentUtc": "2026-09-17T13:43:27Z"
}
```

`requestedMomentUtc` is omitted for a new Furby. The server MUST:

- stamp `timestampUtc = now()` when `requestedMomentUtc` is absent,
- reject a `requestedMomentUtc` in the future,
- allocate a monotonically increasing `certificateNumber`,
- treat the record as write-once (no update endpoint exists by design).

Response body (`BirthRecord`):

```json
{
  "furbyId": "6f9d…",
  "certificateNumber": 184,
  "name": "Mimi",
  "timestampUtc": "2026-09-17T13:43:27.412Z",
  "mode": "moment",
  "location": { "…": "as sent" },
  "recordedAtUtc": "2026-09-17T13:43:27.412Z"
}
```

Types are in `src/api/types.ts`.

## Chart calculations

`src/astro/` is a self-contained natal chart engine:

- **Ephemeris**: [`astronomy-engine`](https://github.com/cosinekitty/astronomy)
  gives apparent geocentric positions; they are expressed on the true ecliptic
  of date, i.e. the tropical zodiac. Sun, Moon, Mercury … Pluto, plus the mean
  lunar North Node (Meeus).
- **Angles**: RAMC from Greenwich apparent sidereal time and the birth
  longitude; Ascendant and Midheaven from RAMC, true obliquity and latitude.
- **Houses**: Placidus by the semi-arc iteration; falls back to Whole Sign
  inside the polar circles where Placidus is undefined.
- **Motion**: signed daily speed from ±12 h positions; retrograde when negative.
- **Aspects**: conjunction, opposition, trine, square, sextile with 8/8/7/7/5°
  orbs (+2° when a luminary is involved), sorted by tightness, applying /
  separating flagged.

`npm test` checks the engine against the brief's example (11:43:27 PM,
17 Sep 2026, Bellingen → Virgo Sun, Sagittarius Moon, Gemini Rising) and
against J2000 reference values.

## ESP32 link (next)

The profile shows a "Link to Furby" button that is disabled until the
firmware exists. The intended shape:

- Wi-Fi: the app is built with hash routing and no server rewrites, so the
  `dist/` folder can be served straight from the ESP32-S3's flash, and the
  Furby can be addressed over a local WebSocket for eye/ear/voice cues.
- Bluetooth: Web Bluetooth (Chrome on Android/desktop) to a GATT service that
  receives the Cosmic ID (`certificateNumber`, Big Three, `timestampUtc`) so
  the physical Furby carries its birth record too.

The birth record must still come from the birth service, not the device, so
every Furby has one unambiguous canonical moment of birth.
