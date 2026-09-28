---
"reforged-ts": patch
---

Every public member of `Unit` carries a doc comment: what it does, its parameters with their units, what it returns (when a lookup returns `undefined`), what a creation throws, the Natives behind it and whether its value is async. The class includes a compiled example, `examples/harness/unit-create.ts`. Nothing else changes.
