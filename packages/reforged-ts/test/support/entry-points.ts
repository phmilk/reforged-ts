/** @noSelfInFile */

// The map script's `main` and `config` alone, stubbed, for the test of the
// deprecated alias in the bundle position: the library wraps both in place
// when it loads, so the test imports this file ahead of the library. The
// init functions `main` would call stay nil here, so `main` only logs
// itself.

import { defineEditorScript } from "./editor-script";

export { editorLog } from "./editor-script";

defineEditorScript(["config", "main"]);
