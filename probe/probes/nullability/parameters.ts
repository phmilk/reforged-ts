// The parameter declarations of the Nullability sweep's case generators:
// what a Slice says of each parameter of a constructor, a registration, an
// enum-getter or an intrinsic-property Native, its typical value and its
// kind, from which the family's generator derives the odd values and the
// stale states it varies, one at a time (./constructor.ts, ./getter.ts).
// A declaration holds values only, Fixtures built before the cases run,
// never a call.

import { userSlotPlayer } from "./fixtures";

/**
 * A value a case gives a parameter in place of its typical value, and the
 * phrase that names it in the case's label: `removed unit`.
 */
export type Variant<T> = readonly [label: string, value: T];

/**
 * What a parameter is to the generators, which decides the values they
 * vary it through:
 * - `numeric`: an integer or a real, varied through `0`, a negative, a
 *   coordinate outside the world and `2147483647` by the constructor's and
 *   the getters' rules;
 * - `rawcode`: an integer naming an object type, varied through an unknown
 *   rawcode by the constructor's rule;
 * - `string`: varied through `""` and an unknown name by the constructor's
 *   rule;
 * - `handle`: varied through each of its stale states;
 * - `trigger`: a registration's trigger, a handle varied through the
 *   trigger destroyed;
 * - `filter`: a boolexpr the Typings take as nullable, varied through its
 *   stale states and, in a registration, `nil`;
 * - `player`: varied through an empty slot and a neutral player by the
 *   getters' rule;
 * - `fixed`: never varied (a boolean, a callback, any other value).
 */
export type ParamKind =
  | "numeric"
  | "rawcode"
  | "string"
  | "handle"
  | "trigger"
  | "filter"
  | "player"
  | "fixed";

/**
 * One parameter of a Native, as a Slice declares it.
 * @noSelf
 */
export interface Param<T> {
  /** The parameter's name, as the Typings name it: `whichUnit`. */
  readonly name: string;
  readonly kind: ParamKind;
  /** The value of the typical call, live. */
  readonly typical: T;
  /** The (b) values: each stale state the parameter's type has. */
  readonly stale: readonly Variant<T>[];
}

/** The values a Native's parameters take, in order, as a tuple. */
export type ParamValues<P extends readonly Param<unknown>[]> = {
  readonly [K in keyof P]: P[K] extends Param<infer T> ? T : never;
};

/** An integer or a real: `x`, `face`, `duration`. */
export function numeric(name: string, typical: number): Param<number> {
  return { name, kind: "numeric", typical, stale: [] };
}

/** An integer naming an object type: `unitid`, typically `FourCC("hfoo")`. */
export function rawcode(name: string, typical: number): Param<number> {
  return { name, kind: "rawcode", typical, stale: [] };
}

/** A string: a name, a label, a file. */
export function text(name: string, typical: string): Param<string> {
  return { name, kind: "string", typical, stale: [] };
}

/**
 * A handle, `typical` live, with each stale state its type has, always
 * named so a Slice cannot leave them out by mistake: `[]` for a type no
 * Native destroys, such as a camera setup.
 */
export function handle<T>(
  name: string,
  typical: T,
  stale: readonly Variant<T>[],
): Param<T> {
  return { name, kind: "handle", typical, stale };
}

/** A registration's trigger: `typical` live, and `destroyed` after `DestroyTrigger`. */
export function trigger(
  name: string,
  typical: trigger,
  destroyed: trigger,
): Param<trigger> {
  return {
    name,
    kind: "trigger",
    typical,
    stale: [["destroyed trigger", destroyed]],
  };
}

/**
 * A boolexpr the Typings take as nullable, `typical` live, with each of its
 * stale states; a registration also passes `nil` for it.
 */
export function filter(
  name: string,
  typical: boolexpr,
  stale: readonly Variant<boolexpr>[],
): Param<boolexpr | undefined> {
  return { name, kind: "filter", typical, stale };
}

/**
 * A player, typically a user slot, `Player(0)`, from the Fixtures. The
 * getters' rule also runs it as an empty slot and Neutral Passive
 * (./getter.ts), which only the getters build.
 */
export function player(name: string): Param<player> {
  return { name, kind: "player", typical: userSlotPlayer(), stale: [] };
}

/** A value never varied: a boolean, a callback, an enum constant. */
export function fixed<T>(name: string, typical: T): Param<T> {
  return { name, kind: "fixed", typical, stale: [] };
}
