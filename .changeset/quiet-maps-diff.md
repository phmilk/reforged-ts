---
"reforged-map": minor
---

`reforged-map textconv <file>`, a git `textconv` driver of Object data: it prints an Object data file as text, one line per object and per modification, so that `git diff` of the map folder shows which object and which field a commit changed, with the old and the new value. A file it cannot read prints the reason and a hex dump, and exits 0. `objectDataText(bytes, fileName)` gives the same text. The README's "Object data in `git diff`" gives the attributes and the git configuration for a repository the Template does not set up.
