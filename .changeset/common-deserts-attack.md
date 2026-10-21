---
"reforged-map": minor
---

The Object data editor adds and removes objects: `addObject({ kind, rawcode, base })` appends a Custom object to the Custom table of both files of its kind, with no modification in a file that holds none of its fields, as the 3.0 World Editor saves it, and `removeObject({ kind, rawcode })` removes a Custom object, or every modification of a Built-in object, from both files. A string a removed object referenced is removed when nothing else references it. An added Rawcode that an object of its kind or a Built-in object of `reforged-builtins` has is refused with the new reason `"rawcode-taken"` (a Custom buff and a Custom destructable may share `B000`), and a base that is not a Built-in object of the kind with `"unknown-base"`.
