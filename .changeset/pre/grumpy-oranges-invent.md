---
"reforged-test": minor
---

Ship the declarations of every `__stub_*` helper of the Shipped stubs, the stub authoring ones included, as `reforged-test/stubs`: add `"reforged-test/stubs"` to the `types` of a test's tsconfig, next to the Typings, and delete any declarations of the helpers you copied by hand. The firing context keeps its type name, `StubContext`.
