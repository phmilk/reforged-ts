---
"reforged-studio": patch
"reforged-map": patch
---

A map's Supported Modes are read as the bit mask the World Editor writes, 1 SD, 2 HD and 4 DE. `allowedArtLayers` offers the layers whose bit is set, so a new map's default, 3, offers SD and HD without DE, and 5, 6 and 7 now limit the switch. `SUPPORTED_MODES` becomes `SUPPORTED_MODE_BITS`, the bit of each art layer. `readSupportedModes`'s docs say the bit mask.
