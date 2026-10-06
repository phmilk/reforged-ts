// The model of a map folder's Editor globals: what the readers fill and the
// renderers write from. The war3map.lua reader declares every global (the
// list of globals is what exists at run time); a later reader, such as the
// war3map.wtg one, refines the type of what the first one declared, and adds
// its warnings. Not exported from the package.

/** Where an Editor global comes from: `gg_` (placed or created in the editor) or `udg_` (the Variable Editor). */
export type EditorGlobalOrigin = "gg" | "udg";

/** One Editor global of the map folder. */
export interface EditorGlobal {
  /** Its Lua name, prefix included (`udg_SpawnType`). */
  readonly name: string;
  readonly origin: EditorGlobalOrigin;
  /** The TypeScript type of its declaration, which a later reader may refine. */
  type: string;
  /** The Lua expression the stub assigns: `nil`, or the header's literal. */
  readonly stubValue: string;
  /** Whether war3map.lua declares it as an array (`__jarray(...)` or `{}`). */
  readonly array: boolean;
}

/** A map folder's Editor globals and the author-facing warnings of reading them. */
export interface EditorGlobalsModel {
  /** In the order of war3map.lua's header, one per name. */
  readonly globals: EditorGlobal[];
  /** Author-facing, never errors: the build goes on. */
  readonly warnings: string[];
}

export function createModel(): EditorGlobalsModel {
  return { globals: [], warnings: [] };
}
