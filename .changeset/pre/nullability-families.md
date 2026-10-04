---
"reforged-types": patch
---

Every handle-returning Native of `common.j` names its Nullability family in the Overlay, and the generator enforces the curation rule: a Native of a nullable family (an event response, a callback getter, a lookup, an optional property) is never typed non-null. The README says when a handle return is typed non-null. No type changes.
