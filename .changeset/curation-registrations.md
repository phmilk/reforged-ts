---
"reforged-types": patch
---

The 26 trigger registrations (`TriggerRegisterTimerEvent`, `TriggerRegisterPlayerUnitEvent`, `BlzTriggerRegisterFrameEvent`, ...) measured by the Nullability sweep carry a `@remarks` with what was measured on 3.0.0.24268: each returned nothing for a destroyed trigger, and some also for a stale or unknown argument (a destroyed timer, dialog or frame, a removed region, destructable or item, a button whose dialog was destroyed or cleared, an empty or unknown order, `EVENT_UNIT_DEATH` passed to `TriggerRegisterFilterUnitEvent`). Their types stay `| undefined`.
