---
"reforged-map": minor
---

Object sync refuses changes made outside the code: an owned object changed in the map folder since the last sync (a field set or removed in the World Editor, the object deleted there) stops `syncObjectDefinitions` with the new `ObjectDefinitionsError` reason `"changed-outside-code"`, listing each object and field with the Object manifest's value and the map folder's; `force` overwrites them with the code's version. A sync interrupted before its manifest write recovers without a report. The Object manifest gains `removed`, the objects a sync removed with what they last held: a removed object a stale World Editor save brought back unchanged is removed again with a warning (`removedAgain` in the report), and a new object at its Rawcode is left alone (`leftAlone`). `mergeObjectDefinitions` warns per object changed outside the code and ships the code's version.
