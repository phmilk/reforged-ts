---
"reforged-types": patch
---

Mark the 3.0.0 Natives that return a per-client value `@async` and list them in `async-natives.json`: the keyboard and mouse polls `BlzIsKeyPressed`, `BlzIsMetaKeyPressed`, `BlzIsMouseButtonPressed`, `BlzGetMouseScreenPosX` and `BlzGetMouseScreenPosY`; the local camera's `GetCameraFieldControlledByInput` and `BlzCameraGetCameraType`; and the resolution-dependent conversions `BlzPixelToFrameX`, `BlzPixelToFrameY`, `BlzFrameToPixelX` and `BlzFrameToPixelY`.
