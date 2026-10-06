// The Editor globals of ../editor-variables.w3m, as the editor and the lint see
// them: the test replaces this file with the declarations generateEditorGlobals
// writes from that map folder, and asserts they declare the same.

declare let udg_UnitType: Rawcode<"unit">;
declare let udg_UnitTypeInit: Rawcode<"unit">;
declare let udg_UnitTypeArray: Record<number, Rawcode<"unit">>;
declare let udg_UnitTypeArrayInit: Record<number, Rawcode<"unit">>;
declare let udg_ItemType: Rawcode<"item">;
declare let udg_ItemTypeInit: Rawcode<"item">;
declare let udg_ItemTypeArray: Record<number, Rawcode<"item">>;
declare let udg_ItemTypeArrayInit: Record<number, Rawcode<"item">>;
declare let udg_AbilityCode: Rawcode<"ability">;
declare let udg_AbilityCodeInit: Rawcode<"ability">;
declare let udg_AbilityCodeArray: Record<number, Rawcode<"ability">>;
declare let udg_AbilityCodeArrayInit: Record<number, Rawcode<"ability">>;
declare let udg_Buff: Rawcode<"buff">;
declare let udg_BuffInit: Rawcode<"buff">;
declare let udg_BuffArray: Record<number, Rawcode<"buff">>;
declare let udg_BuffArrayInit: Record<number, Rawcode<"buff">>;
declare let udg_DestructibleType: Rawcode<"destructable">;
declare let udg_DestructibleTypeInit: Rawcode<"destructable">;
declare let udg_DestructibleTypeArray: Record<number, Rawcode<"destructable">>;
declare let udg_DestructibleTypeArrayInit: Record<
  number,
  Rawcode<"destructable">
>;
declare let udg_TechType: Rawcode<"unit" | "upgrade">;
declare let udg_TechTypeInit: Rawcode<"unit" | "upgrade">;
declare let udg_TechTypeArray: Record<number, Rawcode<"unit" | "upgrade">>;
declare let udg_TechTypeArrayInit: Record<number, Rawcode<"unit" | "upgrade">>;
declare let udg_Order: number;
declare let udg_OrderArray: Record<number, number>;
declare let udg_Integer: number;
declare let udg_IntegerInit: number;
declare let udg_IntegerArray: Record<number, number>;
declare let udg_IntegerArrayInit: Record<number, number>;
declare let gg_trg_Melee_Initialization: trigger;
