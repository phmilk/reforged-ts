---
"eslint-plugin-reforged": minor
---

Three pattern rules.

**`no-dotted-asset-paths`** (error). Reports a string literal, or a template literal without substitutions, whose file name ends in `.mdx`, `.mdl`, `.blp`, `.dds` or `.tga` (case-insensitive) and holds another dot before the extension, which the game does not read since 3.0.0. A suggestion replaces the inner dots with underscores. Option `extensions` replaces the list.

**`no-unordered-iteration`** (warning). Reports what typescript-to-lua compiles to Lua's `pairs`, whose order differs between clients: `for...in`, `Object.keys`, `Object.values`, `Object.entries`, direct calls to `pairs` and `next`, and `for...of` over a `LuaTable`, `LuaMap` or `LuaSet`. `Map` and `Set` keep insertion order in the runtime library and are not reported. The message names `SyncedMap`/`SyncedSet` and `for...of` over an array.

**`no-self-recursion`** (warning). Reports a function declaration, function expression, `const` arrow or method that calls itself by name in its own body, outside nested functions. The message says the stock Lua 5.3 stack limits are unverified for the game's build.
