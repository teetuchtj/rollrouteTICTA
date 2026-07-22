# RollRoute

A crowdsourced wheelchair-accessibility map for Thailand, built as a prototype for the **Thailand ICT Awards (TICTA) 2026** competition, *Inclusion and Community Services / Disability Sector* category.

RollRoute lets anyone check — before they travel — whether a place is actually reachable by wheelchair, stroller, or anyone who has trouble with stairs, and lets the community keep that information accurate over time. It is an original, independent implementation inspired by the general concept of community accessibility mapping (as pioneered by projects like Wheelmap in Germany); it does not reuse Wheelmap's code, data, or branding.

**One shared path-quality map, accessibility-first.** Each place record extends its accessibility status with path-quality attributes — surface, shade, night lighting, and width/crowding — because of the curb-cut effect: a step-free, even, shaded, well-lit, wide path built for wheelchair users is also a better path for stroller parents, runners, and everyday walkers. A lightweight view-mode switch (Walk/run, shown first, and Accessibility) lets each audience see the *same single dataset* through their own lens; the walk/run lens only changes section emphasis and never hides accessibility data. Disability access remains the lead use case in framing and data structure — walkers and runners are additional beneficiaries of the same accessible-infrastructure data, not a separate product.

## What it does

- **Map view** — an interactive, nationwide map of Thailand (OpenStreetMap tiles via Leaflet.js), not locked to any one city, with pins color-, shape- **and** icon-coded by accessibility status, so status is never conveyed by color alone:
  - Full circle + check mark — fully accessible
  - Rounded triangle + half-mark — partially accessible
  - Rounded square + cross — not accessible
  - Rotated diamond + question mark — not yet rated
- **Locate me** — a persistent, keyboard-accessible map control that requests your location only when you tap it (never automatically on load), pans/zooms the map there, and marks it with a pulsing dot deliberately unlike any place pin. If permission is denied, the app shows a short non-blocking message and falls back to manual search — nothing else is blocked. Your position is used only in your browser (to center the map and calculate distances, e.g. for "nearest accessible point") and is never stored or sent anywhere; if it was already granted in an earlier visit, the map centers there on load too, without ever triggering a new permission prompt.
- **Place detail view** — name, category, accessibility status, specific facilities present (step-free entrance, ramp, accessible restroom, elevator, wide doorway, accessible parking), contributor notes, and a contributor count + last-updated timestamp so people can judge freshness.
- **Add / rate a place** — a single-screen flow (no multi-page wizard) to add a new place or update an existing one: pick a location by dragging a pin, tapping the mini-map, or using your current GPS location; choose a category; choose accessibility status with three large tap targets; tick which facilities are present; optionally attach a photo (camera capture on mobile, file picker on desktop); add an optional short note. No account, real name, phone number, or address is ever required — contributions are pseudonymous by default (an optional nickname is remembered locally).
- **Search and filter** — free-text search by name, plus category and accessibility-status filters.
- **Route planning** — pick a start and end point (current GPS location or any mapped place) and get a walking route drawn on the map with turn-by-turn steps in a side panel, via [Leaflet Routing Machine](https://www.liedman.net/leaflet-routing-machine/) and the free public [OSRM](https://project-osrm.org/) demo server (no API key). If the route passes close to a place marked "not accessible," it's flagged with a clear warning, and any alternative routes OSRM returns are listed with their own flag counts so you can pick one that avoids the problem point. Labeled throughout as best-effort, prototype routing — see the caveat notice in the panel.
- **"Is this still accurate?"** — on any place detail view, one tap confirms the existing data is still correct (no form) and bumps a visible confirmation count + last-verified date. Tapping "no longer accurate" instead drops you straight into the add/rate flow, pre-filled with the current status and facilities, so you only correct what's wrong.
- **Nearest accessible point (emergency)** — a one-tap floating button finds the nearest fully-accessible restroom, hospital, transit station, or government office to your current GPS location, sorted by distance, with matching pins highlighted on the map. If location access is denied, it fails gracefully with a message and a shortcut into manual search instead.
- **Claim & verify a listing** — venue owners can claim their own listing with a short, non-sensitive self-confirmation step, after which it carries a distinct "Verified by owner" badge (visually different from ordinary community data). A successful claim generates a QR code (via the client-side [qrcodejs](https://github.com/davidshimjs/qrcodejs) library, no external API) linking back to that place's page, plus a printable sticker view for posting at the entrance.
- **Persistent accessibility toolbar** — available on every screen:
  - Text size, 4 steps (100% / 112.5% / 125% / 137.5%), with a smooth (not instant) transition
  - High-contrast mode toggle (meets WCAG 2.1 AA in both modes), also transitions smoothly
  - "Read this page aloud" via the Web Speech API, Thai locale (`lang="th-TH"`), reading whichever panel is currently active
  - A TH/EN language toggle
  - Every control has a visible focus ring and a proper `aria-label`; new dynamic content (route results, confirmation messages, nearest-point results) is announced via `aria-live`

## Design

- **Palette** — "Klong Teal" (`#0b5566`) as the primary trust color, paired with a warm marigold accent (`#c97a1a`) evoking Thai saffron/marigold garlands, on a warm off-white background rather than clinical white.
- **Type** — Kanit (display headings) paired with Noto Sans Thai (body), chosen for high legibility of Thai script at small sizes on a phone screen.
- **Signature interaction** — the add/rate flow is a single scrollable sheet (bottom sheet on mobile, side drawer on desktop) built around large, thumb-reachable tap targets, designed to be completed in under a minute by someone standing at the location on their phone.
- **Icons** — every icon in the product, including the logo mark, is a hand-authored SVG (see `js/icons.js`). No emoji, no third-party icon library, no third-party logos or trademarks anywhere in the UI or code.
- Respects `prefers-reduced-motion` and meets WCAG 2.1 AA contrast, including in high-contrast mode.

## Tech stack

Deliberately dependency-free so it is trivial to run and deploy:

- **Frontend**: plain HTML/CSS/JavaScript, no build step, no framework.
- **Map**: [Leaflet.js](https://leafletjs.com/) with [OpenStreetMap](https://www.openstreetmap.org/copyright) tiles — free, open, no API key.
- **Routing**: [Leaflet Routing Machine](https://www.liedman.net/leaflet-routing-machine/) against the public [OSRM](https://project-osrm.org/) demo server — free, no API key. Note: the public demo's `foot` profile accepts walking requests but in practice returns driving-network *timing*, so RollRoute ignores its duration field and estimates walking time itself from the route distance at a mobility-aid pace (~1.1 m/s) — see the comment in `js/main.js` next to `selectRouteForDisplay`.
- **QR codes**: [qrcodejs](https://github.com/davidshimjs/qrcodejs), 100% client-side, no network call per code generated.
- **Fonts**: Kanit + Noto Sans Thai from Google Fonts.
- **Data / persistence**: a bundled seed dataset (`js/data.js`) merged at runtime with community contributions stored in the browser's `localStorage` (`js/storage.js`), including any photos (resized client-side and stored as data URIs). There is no backend server in this prototype.

## Running it

No install step needed — it's a static site.

**Option 1 — open directly**
Double-click `index.html`, or open it in a browser via `file://`.

**Option 2 — serve locally** (recommended, avoids any browser file-access quirks)
```
# Python
python -m http.server 8080

# Node
npx serve .
```
Then visit `http://localhost:8080`.

**Deploying**
Any static host works: drag the folder into Netlify, run `vercel deploy`, push to GitHub Pages, or copy it to any web server. There is nothing to build or configure — Leaflet and the fonts are loaded from public CDNs, everything else is local static files.

## What's real vs. seed data

Everything you see on first load is **fictional seed/demo data** (`js/data.js`): 30 invented places (restaurants, hospitals, schools, temples, transit stations, etc.) spread nationwide — 18 around Bangkok neighbourhoods (Sathorn, Thonglor, Siam, Chatuchak, Ari, and others), plus points in Chiang Mai, Khon Kaen, Phuket, and Pattaya/Chonburi — so the map convincingly demonstrates nationwide coverage for judges rather than reading as Bangkok-only. Place names, addresses, and contributor notes are all made up for demonstration purposes — no real businesses, brands, or logos are represented. Every place detail view says so explicitly, and the footer repeats the disclaimer.

Anything **you** add or rate through the app is written to your browser's `localStorage` on top of that seed data, so your changes persist across reloads on the same device/browser, but are not shared with anyone else — this prototype has no backend or database.

## AI-assisted development

This project was built with AI assistance (Claude, by Anthropic), with direction, review, and final decisions made by the human development team throughout — consistent with TICTA's Code of Conduct on AI transparency. This is also disclosed in the app's footer.

## Next steps toward a production version

This prototype intentionally keeps scope small enough to demo cleanly. A production version would need:

- **A real backend and database** (e.g. PostgreSQL + PostGIS) instead of `localStorage`, so contributions are shared across all users and devices.
- **Real image storage** — contributed photos currently live as resized base64 data URIs inside `localStorage`, which is fine for a demo but doesn't scale. Production would upload to object storage (S3 / Cloud Storage) behind a CDN and store a URL on the place record instead — see the comment above `resizePhoto` in `js/storage.js`.
- **Real owner verification** — the "claim this place" flow only asks for a short self-reported label today. Production would check a business registration / tax ID, or use a mail/SMS-style confirmation code (as e.g. Google Business Profile does) before granting the "Verified by owner" badge — see the comment in `claimPlace` in `js/storage.js`.
- **A hosted OSRM instance (or a paid routing API) tuned for walking/wheelchair profiles**, since the free public OSRM demo doesn't have real pedestrian speed data (see the routing note above) and the barrier-avoidance warning is a straight-line proximity check, not true routing around obstacles.
- **Lightweight, privacy-respecting accounts** (or a rate-limited anonymous submission model) to support moderation without requiring personal data.
- **Moderation tooling** for false or malicious reports — e.g. flagging, a trust/reputation score for frequent contributors, requiring multiple corroborating reports before a status flips, and photo evidence as optional supporting proof (the photo pipeline now exists; moderation of what's uploaded does not yet).
- **Conflict handling** for disagreeing reports on the same place (currently the newest contribution simply overwrites the status; a production system should show a confidence level or require consensus).
- **Integration with official/open datasets** where available — e.g. Thailand's government open-data portals, OpenStreetMap's own accessibility tags (`wheelchair=yes/limited/no`), and transit operators' published accessibility information — so RollRoute complements rather than duplicates existing sources.
- **Offline support** (a service worker / cached tiles) so the app remains usable with poor connectivity, which matters a lot for the people this app is meant to serve.
- **Native app wrappers or PWA installability** for easier one-tap access while out and about.
- **Deploy to a real HTTPS origin** so the "claim" QR codes/stickers actually resolve from any device — today they encode a working `?place=<id>` deep link (auto-opens that place on load), but on a local `file://` preview that link only works on the same machine.
- **A11y audit with real assistive-technology users** (screen reader users, low-vision users, motor-impairment users) rather than relying solely on automated WCAG checks.

## Project structure

```
index.html         Page shell and markup
css/styles.css      Design system and all styling
js/icons.js         Hand-authored SVG icon library
js/data.js          Category/status/feature config + seed dataset
js/storage.js       localStorage persistence layer
js/map.js           Leaflet map integration, markers, legend
js/a11y.js          Accessibility toolbar (text size, contrast, speech, language)
js/main.js          App wiring: search/filter, place detail, add/rate flow
```
