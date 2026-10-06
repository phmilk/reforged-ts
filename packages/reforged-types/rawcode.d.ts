// Hand-written: the Rawcode types (ADR 0012), the only place they are
// declared. The entry of each Game version and the common.ai output reference
// this file; the generated files only use the types. They exist at the type
// level only: the emitted Lua is the same as for a plain number.

/**
 * The key of the brand that carries a Rawcode's Object kind. It is declared
 * for the type checker only and does not exist at run time.
 */
declare const __reforgedRawcodeKind: unique symbol;

/**
 * The seven families a type of object belongs to. Heroes are units.
 */
type ObjectKind =
  "unit" | "item" | "ability" | "buff" | "destructable" | "doodad" | "upgrade";

/**
 * The integer id of a type of object of the Object kind `K`, such as the
 * Footman's, `FourCC("hfoo")`, for `Rawcode<"unit">`. `Rawcode` alone is a
 * Rawcode of any kind, and `Rawcode<"unit" | "upgrade">` one of either kind.
 * A Rawcode widens to `number`; a plain `number` becomes one only through a
 * cast, such as `id as Rawcode<"unit">`.
 */
type Rawcode<K extends ObjectKind = ObjectKind> = number & {
  readonly [__reforgedRawcodeKind]: K;
};

/**
 * A Rawcode of unknown Object kind, which every Rawcode parameter accepts:
 * what `FourCC` returns.
 */
type UnknownRawcode = number & {
  readonly [__reforgedRawcodeKind]: never;
};
