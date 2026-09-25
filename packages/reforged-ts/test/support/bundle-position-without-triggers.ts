/** @noSelfInFile */

// The bundle load position with `InitCustomTriggers` never defined: the
// catch-up case, where a stage's Blizzard function never exists and its
// callbacks run at `MarkGameStarted`. A test imports this file ahead of the
// library.

import { defineEditorScript } from "./editor-script";

export { editorLog } from "./editor-script";

defineEditorScript([
  "config",
  "main",
  "InitGlobals",
  "RunInitializationTriggers",
  "MarkGameStarted",
]);
