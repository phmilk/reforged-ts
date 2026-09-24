/** @noSelfInFile */

// The bundle load position: the Template bundle is appended after the
// editor's script, so every entry point exists when the library loads. A
// test imports this file ahead of the library.

import { defineEditorScript } from "./editor-script";

export { editorLog } from "./editor-script";

defineEditorScript([
  "config",
  "main",
  "InitGlobals",
  "InitCustomTriggers",
  "RunInitializationTriggers",
  "MarkGameStarted",
]);
