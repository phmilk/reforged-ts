/** @noSelfInFile */

// The map script's `main` and `config` alone, stubbed, for the test of the
// deprecated alias in the bundle position: the library wraps both in place
// when it loads, so the test imports this file ahead of the library. The
// init functions `main` would call stay nil here, so `main` only logs
// itself.

import { defineEditorScript, editorLog } from "./editor-script";

/** What ran in `main` and `config`, in order: the stubs log their own names. */
export const entryPointLog = editorLog;

defineEditorScript(["config", "main"]);
