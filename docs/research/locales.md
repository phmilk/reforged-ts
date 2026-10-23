# How `_Locales` holds a translated object string

How a map folder holds a translation of an object's string, in the 3.0.1 World Editor and the game, measured for [#711](https://github.com/phmilk/reforged-ts/issues/711) before `reforged-map` writes one (#700, "Locales"; #712). Each claim is marked **Observed** (seen in the files or recorded by the Probe runs below) or **Inferred** (follows from them, not measured).

## TL;DR

- **A translation is a `war3map.wts` per locale, under the same `STRING n`** (Observed): `_Locales/<locale>.w3mod/war3map.wts`, in the root file's form. The object's field keeps its `TRIGSTR_nnn` in the Object data file; the game resolves it from the table of the game's locale.
- **A locale's table replaces the root table whole, it does not add to it** (Observed): under ptBR, a string the ptBR file does not hold resolves to nothing, `GetLocalizedString("TRIGSTR_003")` giving `TRIGSTR_003` back, where enUS gives the root text. So a locale's file must hold every string of the map, translated or not.
- **A locale with no file reads the root table** (Observed): under frFR, with no `_Locales/frFR.w3mod/war3map.wts`, the unit's name is the root text.
- **The World Editor has no screen for translations** (Observed): neither the Object Editor's text field nor the Scenario or Advanced menus name a locale. It creates the twelve `_Locales/<locale>.w3mod/` folders empty on every save: deDE, enUS, esES, esMX, frFR, itIT, koKR, plPL, ptBR, ruRU, zhCN and zhTW.
- **A no-edit World Editor save keeps a hand-written locale table byte for byte and lists it in `war3map.imp`** (Observed): it added `war3map.imp`, format 1, one entry of flag `0x15` per locale table. So the writer lists each locale table it writes there too, or the editor's next save changes `war3map.imp`.
- **The game takes the first block of a `STRING n` that appears twice** (Observed, by accident: the first runs put the unit's name at a number the Probe map already used).

## The World Editor

Its fixture: `packages/reforged-map/test/fixtures/editor-locales.w3m/`, with its provenance in `editor-locales.md`. A new map with a Custom unit `h000` (`Locale Footman`, tooltip `Tooltip padrão`), saved as a folder by the 3.0.1.24371 editor, then given hand-written ptBR and deDE tables, then saved again with no edit.

## The game

- Probe: the source below, not kept under `probe/probes/` since it needs a Probe map that the other Probes do not have. It ran on `probe/probe.w3m` with the fixture's unit added for the run only: `war3map.w3u` and `war3mapSkin.w3u` from the fixture with the strings renumbered to `TRIGSTR_105` and `TRIGSTR_106`, those two strings appended to the root `war3map.wts`, the ptBR and deDE tables holding only `STRING 105` and `106`, and the fixture's `war3map.imp`.
- Build 3.0.1.24371, with `--client-build 3.0.1.24371` (the Typings are of 3.0.1.24370), on 2026-10-23.
- **The game's locale is set on its command line, `-locale <locale>`** (Observed). `probe:run` starts `Warcraft III.exe` itself, and the game then ignores the text language chosen in the Battle.net app: three runs gave `BlzGetLocale()` `enUS` with Português chosen and its pack installed. With `-locale ptBR` added to `LAUNCH_ARGS` (`probe/src/run.ts`) for the run only, it gave `ptBR`.

| `-locale` | `BlzGetLocale()` | `GetObjectName(h000)` and `GetUnitName` | `TRIGSTR_003` (root only) | Run                                    |
| --------- | ---------------- | --------------------------------------- | ------------------------- | -------------------------------------- |
| (none)    | `enUS`           | Locale Footman                          | reforged-ts-templante     | `d9fd2c6e-ebb3-4d30-811b-dc225899c21d` |
| `ptBR`    | `ptBR`           | Soldado Local                           | `TRIGSTR_003`             | `09b77a42-88f6-4d69-93cf-6916208a2ab0` |
| `deDE`    | `deDE`           | Lokaler Fußsoldat                       | not recorded              | `a44f8d2e-f486-4b25-8608-c019f4865b1f` |
| `frFR`    | `frFR`           | Locale Footman                          | not recorded              | `fbf0ead4-34f0-4b46-8613-84f23024f782` |

Each run `finished`. The tooltip is not recorded: no Native reads a unit type's tooltip, and it lives in the same table under the same rule as the name (Inferred).

```ts
import type { ProbeContext } from "../game/probe";

export function run(p: ProbeContext): void {
  p.pending("locale");
  p.record("locale", { locale: BlzGetLocale() ?? "nil" });

  p.pending("object-name");
  p.record("object-name", { name: GetObjectName(FourCC("h000")) ?? "nil" });

  p.pending("unit-name");
  const owner = Player(0);
  const unit =
    owner === undefined
      ? undefined
      : CreateUnit(owner, FourCC("h000"), 0, 0, 270);
  p.record("unit-name", {
    name: unit === undefined ? "no unit" : (GetUnitName(unit) ?? "nil"),
  });

  // TRIGSTR_003 is only in the root war3map.wts: does a locale's file
  // replace the whole table, or only the strings it holds?
  p.pending("trigstr");
  p.record("trigstr", {
    rootOnly: GetLocalizedString("TRIGSTR_003") ?? "nil",
    translated: GetLocalizedString("TRIGSTR_105") ?? "nil",
  });
  p.checkpoint();
}
```

## What it means for the writer (#712)

- The layout is the one #700 expected, a `war3map.wts` per locale under the same `STRING n`, with one rule more (Inferred): **a locale's table is a whole copy of the root table**, each string in its translation where the code gives one and in its default text otherwise. A table holding only the translated strings would leave the map's other strings, its player and force names and every untranslated object string, unresolved in that locale.
- The writer lists each locale table in `war3map.imp`, as the editor does, and leaves a locale with no translation without a file, as the editor leaves its folder empty.
- `probe:run` cannot choose the game's locale yet: a `--locale` option passing `-locale` would let a Probe run check a translation with no human (follow-up).
