# no-unknown-rawcodes

Reports a Rawcode literal that names no Built-in object of the Patch and no object of the map (`FourCC("h00A")` in a map with no `h00A`), a Built-in object outside the map's Game data set, and a literal that is not four ASCII characters (`FourCC("hfo")`). A warning in the recommended config; the replacement is the object's Rawcode, offered as a suggestion when one is one edit away.

## Why

Pitfall C1 of the catalogue (#15): a Rawcode that names no object. Since [ADR 0012](https://github.com/phmilk/reforged-ts/blob/master/docs/adr/0012-rawcodes-are-typed-by-object-kind.md), the type checker rejects a Rawcode of the wrong Object kind, but `FourCC` with a literal no overload knows returns an `UnknownRawcode`, which every Rawcode parameter accepts. A typo compiles and fails only in game: the creator returns nothing, which reaches the next Native as a nil Handle, and `Unit.create` throws ([ADR 0003](https://github.com/phmilk/reforged-ts/blob/master/docs/adr/0003-creation-throws-lookup-returns-undefined.md)). The decision is [#466](https://github.com/phmilk/reforged-ts/issues/466), and [ADR 0014](https://github.com/phmilk/reforged-ts/blob/master/docs/adr/0014-map-project-generated-code-comes-from-reforged-map.md)'s first amendment says what the rule reads.

The rule checks two forms, the only literal forms that compile under ADR 0012:

- the single string or template literal without substitutions of the global `FourCC` of the Typings, overloads included; a function of the Map project named `FourCC` is not checked;
- a number literal, decimal or hex, cast to a Rawcode type with `as` or an angle-bracket assertion (`1747988545 as Rawcode<"unit">`, `<Rawcode>0x68303041`); the message shows the Rawcode it decodes to. `0` is never reported.

A computed value (`FourCC(name)`, ``FourCC(`h00${i}`)``, `id as Rawcode`) and a string passed where `string | number` is taken (an order name) are never checked. Object kind is the type checker's: a Rawcode a Custom buff and a Custom destructable share (`B000`) passes.

It reports three cases:

- `` `h00A` is neither a Built-in object of Patch 3.0.0 nor an object of this map ``, with up to three suggestions;
- `` `Asa2` (Pillage) is a Built-in ability of Patch 3.0.0 but not of this map's Game data set (Melee (Forsaken Kingdom)) ``: the game finds no such object in this map;
- `` `hfo` is not a Rawcode: a Rawcode is exactly four ASCII characters ``, or a cast number whose four bytes are not (`` `1` (bytes 00 00 00 01) ``).

The lists come from the Rawcode lookup of the Map project's own `reforged-map`, the one the TypeScript plugin and the generated code read: the Built-in objects of `reforged-builtins`' index, and the map's objects: those of its map folder and those its Object definitions (`src/objects/`) define, the objects the build ships. The lookup reads them once, keeps them in memory, and reads them again when one of their files changes, checked at most once a second: an object saved in the World Editor or defined in code is known at the next lint, without `pnpm dev` or a build. The rule writes nothing, and there is nothing to regenerate for it.

The rule sees only what reaches the lint:

- the editor's ESLint server lints a file again only when the file changes or is opened, so a diagnostic can lag a World Editor save until the file is linted again;
- `eslint --cache` reuses a file's result while the file and the config are unchanged, whatever the map folder holds.

**When the lists are not there.** Without `reforged-map` installed, or with one that predates the lookup, the plugin warns once at load. Without `reforged-builtins`, without a map folder it can find, while the map folder cannot be read, while loading the map's objects fails, or while the Object definitions cannot be loaded ("The Object definitions could not be loaded: ", then the file of a definition that throws or is invalid, or the missing peer), the rule warns once per reason. In each case it reports no unknown Rawcode, never reports against a partial list, and keeps the four-character check. It resumes on its own once the lookup loads again, without a restart of the ESLint server. The warnings go to stderr in the CLI and to the ESLint output in the editor, and they never count toward `--max-warnings`.

## Incorrect

```ts
const captain = Unit.create(owner, FourCC("h00A"), 0, 0, 0); // the map's Custom unit is h000
const paladin = FourCC("hpal"); // the Paladin is Hpal
const footman = FourCC("hfo"); // not four characters
const typed = 1747988545 as Rawcode<"unit">; // h00A
```

## Correct

```ts
const captain = Unit.create(owner, FourCC("h000"), 0, 0, 0);
const paladin = FourCC("Hpal");
const footman = FourCC("hfoo");
const typed = 1747988528 as Rawcode<"unit">; // h000
```

## Options

None. The rule reads one ESLint shared setting, `settings.reforged.mapFolder`, the map folder, absolute or relative to the project root (the directory ESLint runs in):

```js
{
  settings: {
    reforged: {
      mapFolder: "data/my-map.w3x";
    }
  }
}
```

Without it, the rule reads the one map folder directly at the project root, a folder whose name ends in `.w3x` or `.w3m`, ignoring case, or with none there the one under the project's `maps/`, where a Map project made before ADR 0020 keeps it, until 1.0.0: either needs no setting. One at the root wins over any under `maps/`. With none at either, or several, the rule warns once, naming what it found and where it looked, and only the four-character check runs until the setting is added.

## Suggestions and fixes

For an unknown Rawcode, up to three suggestions, the ones the hover shows: each a Rawcode one edit away that names a Built-in object or an object of the map, a change of case first, each naming its object and Object kind: "Replace with `Hpal` (Paladin, unit)". A suggestion keeps the literal's form: the quotes of a string, the backticks of a template literal, the cast of a number, which becomes the decimal integer of the suggested Rawcode.

No fix: replacing one object with another on save would change what the map creates.

## When not to use it

When the Rawcode names an object the rule cannot see, such as a unit of the campaign's Object data (`war3campaign.w3u`): that is why the rule is a warning. Silence that one line and say why:

```ts
// eslint-disable-next-line reforged/no-unknown-rawcodes -- a unit of the campaign's war3campaign.w3u
const hero = FourCC("H00C");
```
