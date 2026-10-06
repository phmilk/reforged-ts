---
"reforged-ts": patch
---

The migration note from w3ts 3.x, `migration/behaviour-changes.md`, gains the entry "Rawcodes are typed by Object kind": `FourCC` literals compile unchanged, a computed `number` needs a cast naming its kind (`id as Rawcode<"unit">`), and what returns a Rawcode (`unit.typeId`) carries its kind and widens to `number`. The docs site has a new Rawcodes guide that explains the types.
