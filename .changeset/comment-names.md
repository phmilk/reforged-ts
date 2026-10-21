---
"reforged-builtins": minor
"reforged-map": minor
---

The index of `reforged-builtins` gives a buff and an upgrade a `commentName` where the World Editor's comments in `war3map.wts` name them otherwise than `name`: a buff's editor name, empty when it has none, and an upgrade's names of every level. The Object data editor of `reforged-map` names an object in those comments as the 3.0 World Editor does: a buff by its editor name (`fnam`), an upgrade by its name at level 0 only, else by its base's `commentName`, so that the World Editor no longer rewrites the comment on its next save.
