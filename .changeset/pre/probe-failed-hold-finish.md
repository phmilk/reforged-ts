---
---

The Probe runner records a throwing Probe as `ERROR` and `END status=failed`, which `probe:read` reads as `failed` with exit code 1, and `p.hold()` / `p.finish()` let a Probe end on a timer or an event.
