---
"reforged-map": minor
---

The TypeScript plugin follows Object definitions: the hover of a Rawcode a definition defines names its file ("Defined in code, by the Object definition in `src/objects/units.ts`."), and go to definition offers that definition after the constant, at its Rawcode literal, or at the file's start when the Rawcode is computed. A definition that throws or is invalid makes the hover "Rawcode details are unavailable: The Object definitions could not be loaded: …", naming its file, never "unknown", and the hover resumes once it is fixed.
