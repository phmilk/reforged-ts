---
---

`probe:launch` and `probe:read` work from WSL. They find the Windows game, start it on a copy of the staged map folder under the Windows `%TEMP%`, find `CustomMapData` through the Windows Documents folder, and tell `running` from `crashed` with `tasklist.exe`.
