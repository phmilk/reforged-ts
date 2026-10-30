---
"reforged-map": minor
---

The TypeScript plugin's hover links a Rawcode literal and a Rawcode constant to its object in the Studio while one runs on the map folder, read from the Studio's runtime file `.reforged-studio.json` at the Map project's root; with none running, it says that `pnpm studio` opens the object. `readLiveStudio`, `STUDIO_RUNTIME_FILE`, `STUDIO_RUNTIME_FORMAT` and `StudioRuntimeFile` read that file for any other tool.
