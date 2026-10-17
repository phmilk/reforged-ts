# Provenance of `editor-objects.w3m`

`editor-objects.w3m/` is the map folder `no-unknown-rawcodes` reads in the fixture project (#582): the one map folder under `maps/`, which the rule finds without a setting. Its files are byte-for-byte copies of the World Editor-saved fixture of `reforged-map`, [`packages/reforged-map/test/fixtures/editor-objects.w3m/`](../../../../reforged-map/test/fixtures/editor-objects.w3m/), whose [provenance](../../../../reforged-map/test/fixtures/editor-objects.md) says how it was made and what it holds. Only the files the Rawcode lookup reads were copied: `war3map.w3i`, `war3map.wts`, and the seven Object data files with their Skin files.

What the rule's tests rely on:

- a Custom unit, `h000` (Captain), and `h001` (Chevalier Élu);
- a renamed Built-in unit, `hfoo` (Militia);
- a Custom buff and a Custom destructable both at `B000`;
- the Game data set Melee (Forsaken Kingdom), which does not hold the Built-in ability `Asa2` (Pillage).
