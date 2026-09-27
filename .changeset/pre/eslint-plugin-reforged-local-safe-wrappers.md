---
"eslint-plugin-reforged": patch
---

`no-game-state-in-local-branch` lets the new visual and text Wrapper members of reforged-ts through inside a local branch, as it does their Natives: `Camera.setFieldControlledByInput` and the `Camera.type` setter, `CameraSetup#type`, `Sound.playThematicMusic`, `endThematicMusic` and `setThematicMusicVolume`, `Frame#setTextAreaAutoScroll`, `Destructable#setVertexColor`, and the text members `MapPlayer#displayText`, `displayTimedText` and `displayTimedTextFrom`, which `no-percent-in-display-strings` now checks too.
