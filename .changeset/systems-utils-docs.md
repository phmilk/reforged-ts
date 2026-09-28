---
"reforged-ts": patch
---

Document the Systems, `Reforged`, the Init stages, the deprecated `addScriptHook` and the utils: every public symbol of `system/`, `reforged/`, `init/`, `hooks/` and `utils/` carries its summary, `@param`, `@returns` and `@throws` with the message, and the first release's behaviour changes (the `readDouble` alignment, the corrected error messages, `base64Decode` throwing, string sync rejections) are in the `@remarks` of the members they affect. `addScriptHook` and `W3TS_HOOK` link their replacement Init stage and name 2.0.0 as the release that removes them. `Color`, `Init` and `Reforged` gain compiled examples, and `EntryPoint`, the type of `addScriptHook`'s first parameter, is now exported.
