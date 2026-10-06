---
"reforged-ts": patch
---

Name the example object of every rawcode in the doc comments, by its enUS name before its `FourCC` literal: "The unit type's rawcode, such as the Footman's, `FourCC("hfoo")`." The hover now says which object an example rawcode is; the literals stay `FourCC` calls, so what a hover shows compiles with nothing generated installed.
