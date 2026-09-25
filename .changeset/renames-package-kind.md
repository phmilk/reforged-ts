---
"reforged-ts": minor
---

The rename map names the package rename. `migration/renames.json` has a `package` entry, `w3ts` to `reforged-ts`, one to one, so the legacy-names lint rule rewrites `import … from "w3ts"`. The schema, `migration/renames.schema.json`, accepts the new kind `package`, whose `old` and `new` are package names.
