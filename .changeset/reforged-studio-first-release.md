---
"reforged-studio": major
---

First release of `reforged-studio`, the Studio: a local app that edits a Map project's Object data through `reforged-map`, taking turns with the World Editor. `startStudio(...)`, or the `reforged-studio` command, serves on the loopback interface a page that finds, edits, creates and deletes objects, saves with undo across the session, keeps unsaved edits on top of a change on disk, shows Object definitions read-only and adopts objects into code, with icons and model previews read from the developer's own install. It writes `.reforged-studio.json` while it runs, which the hover of `reforged-map`'s TypeScript plugin links from. It needs `reforged-map` as a peer and the game installed. Install it with `pnpm add -D reforged-studio@next`.
