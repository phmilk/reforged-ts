---
"reforged-map": minor
"eslint-plugin-reforged": minor
---

The map folder is found at the Map project's root (ADR 0020). Without an option, the TypeScript plugin's hover and go to definition and the lint rule `no-unknown-rawcodes` read the one folder directly at the project root whose name ends in `.w3m` or `.w3x`; with none there, they fall back to the one under `maps/`, as before, until 1.0.0. One at the root wins over any under `maps/`, and the message when none is found names both places. To move a Map project's map folder: move it from `maps/` to the project root, then set `mapFolder` in `reforged.config.ts` to its new path (#694).
