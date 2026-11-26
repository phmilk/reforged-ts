---
"reforged-test": minor
---

A Native without a Stub says what to write. Calling a Native of `common.j` that no Shipped stub covers now throws `GetUnitName is a Native reforged-test does not stub: give it an answer with stubNative("GetUnitName", …)`, at the line that called it or, through a Wrapper, the Wrapper, where Lua said `attempt to call a nil value`. Such a Native is now a function and no longer `nil`: a stub file of the `stubs` option still defines over it, and `__stub_unstubbed(name)` tells whether a Native is still without a Stub. The functions of `blizzard.j` and `common.ai` stay undefined.
