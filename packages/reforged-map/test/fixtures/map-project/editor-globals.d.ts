// The Editor globals of the test's map folder, as the editor and the lint see
// them: the test replaces this file with the declarations generateEditorGlobals
// writes, and asserts they declare the same.

declare let udg_SpawnType: Rawcode<"unit">;
declare let udg_Tech: Rawcode<"unit" | "upgrade">;
declare let udg_Loot: Record<number, Rawcode<"item">>;
declare let udg_Order: number;
