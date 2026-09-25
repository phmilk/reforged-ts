# no-percent-in-display-strings

Reports a string literal or template with a lone `%` that reaches a text-display Native (`DisplayTextToPlayer`, `BJDebugMsg`, `print`, the frame text setters and their library members). A warning in the recommended config; the suggestion writes `%%`, which the game displays as `%`.

## Why

Pitfall C3 of the catalogue (#15). Warcraft III formats the strings it displays: "Warcraft escapes two %-characters to one" ([A comprehensive guide to mapping in Lua](https://www.hiveworkshop.com/threads/a-comprehensive-guide-to-mapping-in-lua.341880/), "Strings"), so a lone `%` starts a format sequence. For `DisplayTimedTextFromPlayer`, "following "%s" will be printed as garbage or (v1.32.10, Lua) crash the game" ([jassdoc](https://github.com/lep/jassdoc)). The message comes out garbled, or the game crashes.

A text sink is a call listed with kind `text` in the plugin's allowlist, `data/local-safe.json`: the display Natives (`DisplayTextToPlayer`, `DisplayTimedTextToPlayer`, `DisplayTimedTextFromPlayer`, `DisplayTextToForce`, `DisplayTimedTextToForce`, `BJDebugMsg`), Lua's `print`, `BlzFrameSetText`, `BlzFrameAddText`, and the `Frame` members `setText`, `addText` and the `text` accessor. The rule follows a string into the sink through a template literal, a string concatenation, `String()`, `tostring`, the converters `I2S`, `R2S` and `R2SW` (their first argument), and one `const`. It does not follow calls into project functions.

## Incorrect

```ts
import { Frame } from "reforged-ts";

const hp = 50;
print(`${hp}% life`); // a lone % in a template
BJDebugMsg("Armor +" + 10 + "%"); // a lone % in a concatenation

const label = "100% loaded"; // reaches the setter below through the const
Frame.fromName("LoadingText", 0)!.text = label;
```

## Correct

```ts
import { Frame } from "reforged-ts";

const hp = 50;
print(`${hp}%% life`);
BJDebugMsg("Armor +" + 10 + "%%");

const label = "100%% loaded";
Frame.fromName("LoadingText", 0)!.text = label;
```

## Options

None.

## Suggestions and fixes

A suggestion doubles every lone `%` of the reported string (`"50%"` becomes `"50%%"`) and keeps an existing `%%`. For a `const`, the suggestion edits its initialiser. No fix: a string that is also used elsewhere, for instance as a `string.format` pattern, would change meaning.

## When not to use it

When the string never reaches the game's formatting, for instance a `print` that only runs in an offline test harness. Silence the line and say why:

```ts
// eslint-disable-next-line reforged/no-percent-in-display-strings -- runs only in the offline test harness, where print does not format
print("50%");
```
