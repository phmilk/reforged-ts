/** @noSelfInFile */

// The map header load position: the compiled library is pasted into the map
// header, so only Blizzard.j's functions exist when it loads (`InitBlizzard`,
// `InitGlobals`, `MarkGameStarted`); the editor's script defines
// `InitCustomTriggers`, `RunInitializationTriggers`, `config` and `main`
// after the header. A test imports this file ahead of the library and
// defines those four itself afterwards, with `defineEditorScript`.

import { defineEditorScript } from "./editor-script";

export { editorLog } from "./editor-script";

defineEditorScript(["InitBlizzard", "InitGlobals", "MarkGameStarted"]);
