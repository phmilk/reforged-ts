---
"reforged-map": minor
---

Add Object definitions to the generated code and the Rawcode lookup: `generateObjects` and `openRawcodeLookup` see the objects the build ships. An object a definition defines gets its `FourCC` overload and constant (`CustomUnits.Sergeant_h002`), whose TSDoc names the definition's file, and an object the Object manifest owns that no definition defines is gone. Both take the `definitionsFolder`, `generatedFolder` and `manifest` options, defaulting under the Map project's root. Each modified or Custom object of the lookup's results carries `definitionFile`. The lookup watches every definition file and the manifest; a definition that throws, an invalid identity or a missing `typescript` or `reforged-builtins` makes it unavailable with a reason naming the file or the peer, and `generateObjects` throws the `ObjectDefinitionsError`.
