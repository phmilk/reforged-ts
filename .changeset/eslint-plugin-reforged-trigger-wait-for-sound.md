---
"eslint-plugin-reforged": patch
---

`no-unsafe-natives` bans `TriggerWaitForSound`, a trigger action wait like `TriggerSleepAction`: it yields the running thread until the sound ends. The rule suggests continuing in a timer callback when the sound ends instead.
