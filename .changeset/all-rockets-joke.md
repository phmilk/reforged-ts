---
"reforged-map": minor
---

`readSupportedModes(mapFolder)` reads the Supported Modes a map folder's `war3map.w3i` declares (1 SD, 2 HD, 3 All Modes, 4 DE), undefined when the file is missing, unreadable or of a format before 31, for a tool that limits what it shows to the art the map allows, such as the Studio's art layer.
