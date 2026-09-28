# Class: File

Defined in: [system/file.ts:50](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/file.ts#L50)

Reads and writes text files in the player's `CustomMapData` folder.

## Remarks

The game has no file Natives, so `File` relies on the Preload generator,
an exploit Blizzard ended up sanctioning, with its caveats:

- All files are confined to the `Documents\Warcraft III\CustomMapData` folder.
- The only allowed file extensions are `.txt` and `.pld`.
- Generated files contain boilerplate JASS code.
- You cannot delete files but you can empty their contents.

How a file is written and read back: `File.write` passes the contents to
`Preload` in chunks of at most 259 bytes, between an opening and a closing
piece of Lua, each between the `//! beginusercode` and `//!endusercode`
markers of the generated file, which `Preloader` runs as Lua. The opening
piece makes the `Preload` calls collect the chunks, and the closing piece
sets the icon of one ability (`Amls`) to them. `File.read` sets that icon
to a sentinel holding a raw double quote, runs the file with `Preloader`,
reads the icon and puts the original back. The icon still equal to the
sentinel means nothing was read: the file is missing or was written by
`File.writeRaw` without reading.

The escape contract: each chunk sits inside a double-quoted string literal
of the generated file, so a double quote in the contents is written as the
escape character (byte 27) followed by `q`, and the escape character itself
as two escape characters. `File.read` undoes both in one pass, so any
contents made of these characters, backslashes included (`Preload` escapes
those itself), read back unchanged. `File.writeRaw` without reading escapes
nothing.

Two edge cases:
- Contents holding a newline: the line break survives. It is written as a
  raw line feed inside the generated `Preload` string and read back byte
  for byte (verified in game on 3.0.0.24268, #129).
- Contents equal to the ability's icon path: read back as those contents.
  The escape contract never leaves a raw double quote in the contents, so
  no written file can produce the sentinel, and a read tells any contents
  from a missing file (#146).

`File` stays a class of static members: it drives one facility of the
whole game, the Preload generator and one ability's icon, so it has no
state per object, and `File.read` and `File.write` keep their w3ts names.

## Example

```ts
// A file written to the CustomMapData folder of this client's disk, then read
// back. Every client writes and reads its own copy.
import { File, Init } from "reforged-ts";

Init.onGameStart(() => {
  File.write("data.txt", "Hello world!");
  const contents = File.read("data.txt");
  if (contents !== undefined) {
    print(contents);
  }
});
```

## Methods

### read()

> `static` **read**(`filename`): `string` \| `undefined`

Defined in: [system/file.ts:120](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/file.ts#L120)

Reads the text of a file `File.write` wrote in the `CustomMapData`
folder.

#### Parameters

##### filename

`string`

The file's path inside `CustomMapData`, such as
`"MyMap\\save.txt"`.

#### Returns

`string` \| `undefined`

The contents, or `undefined` when the file is missing or was
written by `writeRaw` without reading.

#### Remarks

The contents come from this client's disk, so they can differ between
clients: make them known to every client with [SyncRequest](SyncRequest.md)
before they reach game state.

#### Native

[BlzGetAbilityIcon](/typings/3.0.0/functions/BlzGetAbilityIcon) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetAbilityIcon))

#### Native

[BlzSetAbilityIcon](/typings/3.0.0/functions/BlzSetAbilityIcon) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetAbilityIcon))

#### Native

[Preloader](/typings/3.0.0/functions/Preloader) ([jassbot](https://lep.duckdns.org/jassbot/doc/Preloader))

***

### write()

> `static` **write**(`filename`, `contents`): `void`

Defined in: [system/file.ts:198](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/file.ts#L198)

Writes text to a file in the `CustomMapData` folder, for `File.read` to
read back: `writeRaw` with reading allowed.

#### Parameters

##### filename

`string`

The file's path inside `CustomMapData`; its extension
`.txt` or `.pld`.

##### contents

`string`

The text to write: any characters, double quotes and
backslashes included.

#### Returns

`void`

#### Remarks

Returns nothing, where w3ts returned the `File` class. Contents holding
the escape character followed by `q` now read back as written, where
w3ts read a `"` in their place.

#### Native

[PreloadGenClear](/typings/3.0.0/functions/PreloadGenClear) ([jassbot](https://lep.duckdns.org/jassbot/doc/PreloadGenClear))

#### Native

[PreloadGenStart](/typings/3.0.0/functions/PreloadGenStart) ([jassbot](https://lep.duckdns.org/jassbot/doc/PreloadGenStart))

#### Native

[Preload](/typings/3.0.0/functions/Preload) ([jassbot](https://lep.duckdns.org/jassbot/doc/Preload))

#### Native

[PreloadGenEnd](/typings/3.0.0/functions/PreloadGenEnd) ([jassbot](https://lep.duckdns.org/jassbot/doc/PreloadGenEnd))

***

### writeRaw()

> `static` **writeRaw**(`filename`, `contents`, `allowReading?`): `void`

Defined in: [system/file.ts:152](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/file.ts#L152)

Writes text to a file in the `CustomMapData` folder, with or without
the code `File.read` needs to read it back.

#### Parameters

##### filename

`string`

The file's path inside `CustomMapData`; its extension
`.txt` or `.pld`.

##### contents

`string`

The text to write, in chunks of at most 259 bytes, one
`Preload` call each.

##### allowReading?

`boolean` = `false`

True to include the code `File.read` runs to read
the file back, and escape the contents for it; false, the default, to
write the contents raw, unreadable by `File.read`.

#### Returns

`void`

#### Remarks

Returns nothing, where w3ts returned the `File` class.

#### Native

[PreloadGenClear](/typings/3.0.0/functions/PreloadGenClear) ([jassbot](https://lep.duckdns.org/jassbot/doc/PreloadGenClear))

#### Native

[PreloadGenStart](/typings/3.0.0/functions/PreloadGenStart) ([jassbot](https://lep.duckdns.org/jassbot/doc/PreloadGenStart))

#### Native

[Preload](/typings/3.0.0/functions/Preload) ([jassbot](https://lep.duckdns.org/jassbot/doc/Preload))

#### Native

[PreloadGenEnd](/typings/3.0.0/functions/PreloadGenEnd) ([jassbot](https://lep.duckdns.org/jassbot/doc/PreloadGenEnd))
