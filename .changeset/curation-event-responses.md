---
"reforged-types": patch
---

The 73 event responses measured by the Nullability sweep (`GetTriggerUnit`, `GetSpellTargetUnit`, `GetOrderPointLoc`, ...) carry a `@remarks` with what was measured on 3.0.0.24268: 63 returned nothing when called outside their event; 10 (`GetTriggerEventId`, `GetEventDamageType`, `BlzGetEventAttackType`, ...) returned a handle of id 0, or -1, rather than nothing, so a nil check does not tell that they were called outside their event. Their types stay `| undefined`.
