---
"eslint-plugin-reforged": minor
---

`no-unknown-rawcodes`, a new rule at `warn` in `configs.recommended` ([#582](https://github.com/phmilk/reforged-ts/issues/582)): it reports a Rawcode literal, `FourCC("h00A")` or a number cast to a Rawcode type, that names neither a Built-in object of the Patch nor an object of the map, with up to three suggestions one edit away ("Replace with `h000` (Captain, unit)"); a Built-in object outside the map's Game data set; and a literal that is not four ASCII characters (`FourCC("hfo")`). It reads the Rawcode lookup of the Map project's `reforged-map`, now an optional peer, over `reforged-builtins` and the map folder, follows a World Editor save without a build, and finds the map folder under `maps/` or from the ESLint setting `settings.reforged.mapFolder`. Without `reforged-map`, `reforged-builtins` or a map folder, it says why once and keeps only the four-character check.
