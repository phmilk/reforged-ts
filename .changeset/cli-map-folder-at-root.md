---
"create-reforged-map": minor
---

A new Map project's map folder is at its root and named after its package (ADR 0020): `create-reforged-map my-map` moves the Template's map folder, from its root or from under `maps/`, to `my-map.w3m` at the project root, removes `maps/` when that leaves it empty, and sets `mapFolder` in `reforged.config.ts` to it before the install. A scoped package names it after the part past its scope. The next steps name that folder to open in the World Editor. A Template with no map folder, several, or a `reforged.config.ts` without `mapFolder` stops the creation at the new stage "placing the map folder", with nothing left in the target (#695).
