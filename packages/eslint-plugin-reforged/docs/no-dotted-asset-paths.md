# no-dotted-asset-paths

Reports an asset path whose file name holds a dot before its extension (`my_model_1.0.mdx`), which the game does not read since 3.0.0. An error in the recommended config; the replacement is the file renamed with underscores (`my_model_1_0.mdx`).

## Why

Pitfall C7 of the catalogue (#15). The 3.0.0 bug report lists it: "File paths containing a "." (outside of their extension) will NOT be read correctly by the game. For instance my_model_1.0.mdx will not be read correctly while my_model_1_0.mdx for the same model will work" ([Warcraft III 3.0 Bugs & issues](https://www.hiveworkshop.com/threads/warcraft-iii-3-0-bugs-issues.374131/), first post). Nothing reports the failure: an effect or a unit with an unread model simply shows nothing, and a missing texture renders blank.

The rule checks string literals and template literals without substitutions. Only the last path segment counts: a dot in a folder name (`war3.w3mod/`) is not reported. The default extensions are the model and texture ones, `.mdx`, `.mdl`, `.blp`, `.dds` and `.tga`, matched case-insensitively. A path built at run time (a template with a substitution, a concatenation) is not checked.

## Incorrect

```ts
AddSpecialEffect("war3mapImported/Fireball.v2.mdx", 0, 0); // not read since 3.0.0
const icon = "ReplaceableTextures\\CommandButtons\\BTN.Fire.Nova.blp"; // two inner dots
```

## Correct

```ts
AddSpecialEffect("war3mapImported/Fireball_v2.mdx", 0, 0);
const icon = "ReplaceableTextures\\CommandButtons\\BTN_Fire_Nova.blp";
```

Rename the imported file in the map to match.

## Options

`extensions` (array of strings, default `[".mdx", ".mdl", ".blp", ".dds", ".tga"]`): the extensions checked. It replaces the default list; each entry is matched case-insensitively and the leading dot is optional.

```js
{ rules: { "reforged/no-dotted-asset-paths": ["error", { extensions: [".mdx", ".mdl", ".blp", ".dds", ".tga", ".mp3"] }] } }
```

## Suggestions and fixes

A suggestion replaces the inner dots of the file name with underscores: `"units/Footman.v2.mdx"` becomes `"units/Footman_v2.mdx"`. It is not a fix, because the file imported in the map must be renamed too, or the new path points at nothing. No suggestion is offered when the file name is written with an escape sequence.

## When not to use it

When the string is not a path the game reads, such as a URL printed in a message. Silence that one line and say why:

```ts
// eslint-disable-next-line reforged/no-dotted-asset-paths -- a download link shown to players, not a game asset
const link = "https://example.org/models/Footman.v2.mdx";
```
