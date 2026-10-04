---
"eslint-plugin-reforged": minor
---

Add `no-event-response-outside-event`, a warning in the recommended config: it reports an event response (`GetTriggerUnit`, `GetEnumUnit`, `GetEventDamage`, `Unit.fromEvent()`, ...) called where its context certainly does not hold, at module top level, in the callback of an Init stage registered at module top level or in a timer's callback, where it returns nothing. The event responses of `common.j` and their contexts are listed in the new `data/event-responses.json`; a library member is classified by its `@native` tags.
