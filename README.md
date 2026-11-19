# Leonida Legend — GTA VI Trophy Guide & Tracker

A fan-made, fully offline web app: a guide and checklist tracker for all 55
PlayStation 5 trophies of Grand Theft Auto VI.

## What it does

- **Every trophy, exactly as published** — official name, description and grade
  for all 55 trophies (1 platinum, 2 gold, 6 silver, 46 bronze), with hidden
  trophies marked.
- **A guide for each trophy, in our own words** — what to do, where, and the
  steps, with the sources for its facts cited beside it (PowerPyx, Output Lag,
  CryptoGames, EGamers). Five hidden trophies have no confirmed method yet;
  their cards say so honestly instead of inventing one.
- **Roadmap to the platinum** — five stages in the order to earn the trophies,
  from Chapter 1 to the 100% checklist and cleanup (~200 hours, one
  playthrough, no online trophies).
- **Missable flags** — exactly one trophy is potentially missable
  (Positive Mental Attitude, Chapter 1); it is flagged on its card, in the
  roadmap, and in the alert banner at the top.
- **Tracker** — tick trophies off and record your own progress counts
  (stunts, scans, dollars…); progress saves in the browser's localStorage
  and can be exported to a file and imported back.
- **Filters and spoiler shield** — filter by kind (story, missable,
  collectibles, activities, online), by grade, or by search; the spoiler
  shield hides story trophy names and descriptions until you earn them.

## Run it

Static files only, no build step, no network requests at run time:

```
node serve.ts          # serves app/ at http://localhost:8080
```

or serve the `app/` folder with any static file server and open `index.html`.

## Handing it in (make.fun entry program)

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` with the vendored library in `vendor/` (left unchanged).
`main.ts` first runs a pre-flight check that `app/data/trophies.json` holds
all 55 trophies, each with a guide and at least one cited source.

## Layout

- `app/index.html` — page structure: header and progress, missable alert,
  filter toolbar, checklist, roadmap, footer.
- `app/app.js` — entry point: data load, filters, toolbar wiring.
- `app/render.js` — trophy cards, guide boxes with cited sources, roadmap
  stages, the spoiler shield.
- `app/state.js` — localStorage progress, export/import as a JSON file.
- `app/style.css` — the app's own dark neon look; no images or webfonts.
- `app/data/trophies.json` — the trophy data: official fields plus guide,
  steps, kind, missable flag, roadmap stage, count and sources per trophy.
- `screenshots/` + `shots.json` — the four screenshots and what each shows.

Fan-made. Not affiliated with Rockstar Games or Take-Two Interactive.
Trophy names, descriptions and grades are as PlayStation publishes them;
no Rockstar logo, official artwork or game screenshots are used.
