---
"reforged-map": minor
---

The Object data editor's save runs the World Editor check before its first write: it refuses to write a folder the World Editor shows unsaved edits for, and its result's `worldEditor` says whether the World Editor has the folder open, so a tool can reload it there with `-launch -loadfile`. `checkWorldEditor` runs the check on its own. `save(folder, { worldEditorCheck: false })` turns it off for a folder no World Editor opens, such as the build's staged copy in `dist/`. `ObjectDataWriterError` gains the reasons `"modified-in-world-editor"` and `"world-editor-check-failed"`.
