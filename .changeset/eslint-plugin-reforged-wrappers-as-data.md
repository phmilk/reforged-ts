---
"eslint-plugin-reforged": minor
---

**`no-handle-id-as-data`** (warning). Reports a call to `GetHandleId`, and a read of a Wrapper's `id` accessor, whose value does not reach a text-display Native: in a Lua map the id of the same object can differ between clients, so a key, a comparison or state built on it desyncs. Key by the object instead. The rule follows the value into a display call through a template, a concatenation, `String()`/`tostring` and one `const`; `MapPlayer#id` (the player slot) is not reported.

**`prefer-handle-map`** (warning). Reports `new Map` and `new Set` whose key type is a Wrapper, written or inferred: the table keeps its entry after the object is destroyed. A suggestion changes the constructor to `HandleMap`/`HandleSet`; the author adds the import. `WeakMap` and `WeakSet` are not reported.
