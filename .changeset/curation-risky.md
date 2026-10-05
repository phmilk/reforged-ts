---
"reforged-types": patch
---

`GetExpiredTimer`, `BlzCreateFrameByType` and `BlzFrameGetChild` carry a `@remarks` with what the Nullability sweep measured on 3.0.0.24268: `GetExpiredTimer` crashed the game when called outside a timer's callback and returned nothing in a destroyed timer's, `BlzCreateFrameByType` crashed the game for `SIMPLEMESSAGEFRAME` and `CONTROL` without their FDF fields and returned nothing for an empty or unknown type name, and `BlzFrameGetChild` returned nothing one past the last child. All three still return `undefined` in their types.
