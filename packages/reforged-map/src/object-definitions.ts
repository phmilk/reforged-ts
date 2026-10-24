/// <reference types="reforged-types/rawcode.d.ts" preserve="true" />
// reforged-map/objects: the authoring entry of Object definitions (ADR
// 0015, #700). A Map project's files under src/objects/ import it, and only
// they do: the loader (definitions-loader.ts) runs them in Node at build
// time, never in the map's Lua. Each `define<Kind>` call returns an opaque
// value and checks nothing: the loader and the build check what it holds.
// The field types come from reforged-builtins' field declarations, an
// optional peer the Map project installs; `Rawcode` is the Typings'.

import type { Fields } from "reforged-builtins/fields";
import { recordDefinition, recordLocalized } from "./definition-registry.js";
import type { Locale } from "./model.js";

export type { Locale };

/** The Object kinds an Object definition can be of: `"unit"`, `"item"`, `"ability"`, `"buff"`, `"destructable"`, `"doodad"` and `"upgrade"`. */
export type ObjectDefinitionKind = keyof Fields & ObjectKind;

/** The key of the brand of an Object definition, for the type checker only: it does not exist at run time. */
declare const definitionKind: unique symbol;

/** The key of the brand of a localized value, for the type checker only: it does not exist at run time. */
declare const localizedBrand: unique symbol;

/**
 * An Object definition of the Object kind `K`, as a `define<Kind>` call
 * returns it: an opaque value, which counts once a file under the
 * definitions folder exports it.
 */
export interface ObjectDefinition<
  K extends ObjectDefinitionKind = ObjectDefinitionKind,
> {
  /** The brand of its Object kind: for the type checker only. */
  readonly [definitionKind]: K;
}

/**
 * A localizable text with its translations: a default text and one text
 * per locale, as {@link localized} makes it.
 */
export interface LocalizedValue {
  /** The brand of a localized value: for the type checker only. */
  readonly [localizedBrand]: true;
  /** The default text, the one a locale without a translation shows. */
  readonly text: string;
  /** One text per locale, by the game's locale code (`deDE`, `frFR`). */
  readonly translations: Readonly<Partial<Record<Locale, string>>>;
}

/** What the field declarations of `reforged-builtins` give of one field. */
interface FieldSpec {
  readonly category: string;
  readonly value: unknown;
  readonly levels: boolean;
  readonly localizable: boolean;
}

/**
 * One value of a field, by its category: the declarations' type, plus
 * `""` for a Rawcode and an enumeration of strings (the empty value the
 * game's data holds where an object has none, such as the second weapon
 * sound of a unit with one attack), and a {@link LocalizedValue} for a
 * localizable text.
 */
type OneValue<F extends FieldSpec> = F["category"] extends "enumeration"
  ? F["value"] | (F["value"] extends string ? "" : never)
  : F["category"] extends "rawcode"
    ? F["value"] | ""
    : F["category"] extends "text"
      ? F["localizable"] extends true
        ? F["value"] | LocalizedValue
        : F["value"]
      : F["value"];

/** The values of a levelled field, keyed by level (a doodad's variation): set level 3 without restating levels 1 and 2. */
export type LevelValues<V> = Readonly<Record<number, V>>;

/**
 * What an Object definition sets a field to: one value, or for a field
 * that holds a value per level, a record from level to value.
 */
export type FieldValue<F extends FieldSpec> = F["levels"] extends true
  ? LevelValues<OneValue<F>>
  : OneValue<F>;

/**
 * The fields of an Object kind an Object definition sets, by field id
 * (`umvs`), typed from the field declarations of `reforged-builtins`: the
 * hover of a field id gives its enUS label, its value type and whether it
 * has levels.
 */
export type ObjectDefinitionFields<K extends ObjectDefinitionKind> = {
  readonly [Id in keyof Fields[K]]?: Fields[K][Id] extends FieldSpec
    ? FieldValue<Fields[K][Id]>
    : never;
};

/**
 * A field the field table of `reforged-builtins` does not know, set through
 * the raw escape with all a modification stores.
 */
export interface RawObjectField {
  /** The field id, four characters (`Xfoo`). */
  readonly field: string;
  /** The value type the modification stores. */
  readonly type: "int" | "real" | "unreal" | "string";
  /** The level, or a doodad's variation: abilities, doodads and upgrades only, 0 when left out. */
  readonly level?: number;
  /** The data pointer: abilities, doodads and upgrades only, 0 when left out. */
  readonly dataPointer?: number;
  /** The value: an integer, a real, or a string, as `type` says. */
  readonly value: number | string;
}

/**
 * What a `define<Kind>` call takes: the object's Rawcode, its base when it
 * is a Custom object, the fields it sets, and the raw escape.
 */
export interface ObjectDefinitionInput<K extends ObjectDefinitionKind> {
  /**
   * The object's Rawcode, four characters: a Custom object's (`h000`), or
   * the Built-in object's the definition changes (`hfoo`).
   */
  readonly rawcode: string;
  /**
   * The base of a Custom object, the Built-in object of the kind it derives
   * from, such as the Footman's, `FourCC("hfoo")`. Left out, the definition
   * changes the Built-in object of its Rawcode.
   */
  readonly base?: Rawcode<K>;
  /** The fields it sets, by field id; a value equal to the base's is kept as a modification. */
  readonly fields?: ObjectDefinitionFields<K>;
  /** The fields the field table of `reforged-builtins` does not know, each with its value type. */
  readonly raw?: readonly RawObjectField[];
}

/** The `define<Kind>` call of an Object kind. */
function define<K extends ObjectDefinitionKind>(
  kind: K,
  // A caller without the types may pass anything: nothing is checked here.
  input: ObjectDefinitionInput<K> | undefined,
): ObjectDefinition<K> {
  const definition = Object.freeze({}) as ObjectDefinition<K>;
  const given = (input ?? {}) as Partial<
    Record<keyof ObjectDefinitionInput<K>, unknown>
  >;
  recordDefinition(definition, {
    kind,
    rawcode: given.rawcode,
    base: given.base,
    custom: given.base !== undefined,
    fields: (given.fields ?? {}) as Record<string, unknown>,
    raw: (Array.isArray(given.raw) ? given.raw : []) as never,
  });
  return definition;
}

/**
 * Defines a unit: a Custom unit, from its Rawcode and its base, or a change
 * to a Built-in unit, from its Rawcode alone.
 *
 * @remarks
 * It checks nothing when it runs: the build and the tools check the
 * definition once a file under the definitions folder exports it.
 *
 * @param definition - Its Rawcode, its base (a Custom unit only), its
 *   fields by field id, and the raw escape.
 * @returns The definition, which counts once its file exports it.
 */
export function defineUnit(
  definition: ObjectDefinitionInput<"unit">,
): ObjectDefinition<"unit"> {
  return define("unit", definition);
}

/**
 * Defines an item: a Custom item, from its Rawcode and its base, or a
 * change to a Built-in item, from its Rawcode alone.
 *
 * @remarks
 * It checks nothing when it runs: the build and the tools check the
 * definition once a file under the definitions folder exports it.
 *
 * @param definition - Its Rawcode, its base (a Custom item only), its
 *   fields by field id, and the raw escape.
 * @returns The definition, which counts once its file exports it.
 */
export function defineItem(
  definition: ObjectDefinitionInput<"item">,
): ObjectDefinition<"item"> {
  return define("item", definition);
}

/**
 * Defines an ability: a Custom ability, from its Rawcode and its base, or a
 * change to a Built-in ability, from its Rawcode alone.
 *
 * @remarks
 * A field that holds a value per level takes a record from level to value.
 * It checks nothing when it runs: the build and the tools check the
 * definition once a file under the definitions folder exports it.
 *
 * @param definition - Its Rawcode, its base (a Custom ability only), its
 *   fields by field id, and the raw escape.
 * @returns The definition, which counts once its file exports it.
 */
export function defineAbility(
  definition: ObjectDefinitionInput<"ability">,
): ObjectDefinition<"ability"> {
  return define("ability", definition);
}

/**
 * Defines a buff: a Custom buff, from its Rawcode and its base, or a change
 * to a Built-in buff, from its Rawcode alone.
 *
 * @remarks
 * A Custom buff and a Custom destructable may share a Rawcode, as the World
 * Editor makes them both `B000`. It checks nothing when it runs: the build
 * and the tools check the definition once a file under the definitions
 * folder exports it.
 *
 * @param definition - Its Rawcode, its base (a Custom buff only), its
 *   fields by field id, and the raw escape.
 * @returns The definition, which counts once its file exports it.
 */
export function defineBuff(
  definition: ObjectDefinitionInput<"buff">,
): ObjectDefinition<"buff"> {
  return define("buff", definition);
}

/**
 * Defines a destructable: a Custom destructable, from its Rawcode and its
 * base, or a change to a Built-in destructable, from its Rawcode alone.
 *
 * @remarks
 * It checks nothing when it runs: the build and the tools check the
 * definition once a file under the definitions folder exports it.
 *
 * @param definition - Its Rawcode, its base (a Custom destructable only),
 *   its fields by field id, and the raw escape.
 * @returns The definition, which counts once its file exports it.
 */
export function defineDestructable(
  definition: ObjectDefinitionInput<"destructable">,
): ObjectDefinition<"destructable"> {
  return define("destructable", definition);
}

/**
 * Defines a doodad: a Custom doodad, from its Rawcode and its base, or a
 * change to a Built-in doodad, from its Rawcode alone.
 *
 * @remarks
 * A field that holds a value per variation takes a record from variation to
 * value. It checks nothing when it runs: the build and the tools check the
 * definition once a file under the definitions folder exports it.
 *
 * @param definition - Its Rawcode, its base (a Custom doodad only), its
 *   fields by field id, and the raw escape.
 * @returns The definition, which counts once its file exports it.
 */
export function defineDoodad(
  definition: ObjectDefinitionInput<"doodad">,
): ObjectDefinition<"doodad"> {
  return define("doodad", definition);
}

/**
 * Defines an upgrade: a Custom upgrade, from its Rawcode and its base, or a
 * change to a Built-in upgrade, from its Rawcode alone.
 *
 * @remarks
 * A field that holds a value per level takes a record from level to value.
 * It checks nothing when it runs: the build and the tools check the
 * definition once a file under the definitions folder exports it.
 *
 * @param definition - Its Rawcode, its base (a Custom upgrade only), its
 *   fields by field id, and the raw escape.
 * @returns The definition, which counts once its file exports it.
 */
export function defineUpgrade(
  definition: ObjectDefinitionInput<"upgrade">,
): ObjectDefinition<"upgrade"> {
  return define("upgrade", definition);
}

/**
 * Makes a localized value: a default text and one text per locale, for a
 * localizable text field such as a name or a tooltip.
 *
 * @remarks
 * The build and Object sync write the default text into the map folder's
 * `war3map.wts`, as a field without translations, and each translation
 * under the same `STRING n` into its locale's table,
 * `_Locales/<locale>.w3mod/war3map.wts`, which the game reads instead of
 * `war3map.wts` in that locale. A locale left out shows the default text,
 * and so does a translation equal to it. It checks nothing when it runs:
 * the build checks each locale is one of the game's.
 *
 * @param text - The default text.
 * @param translations - One text per locale, by the game's locale code
 *   (`deDE`, `ptBR`).
 * @returns The localized value.
 */
export function localized(
  text: string,
  translations: Readonly<Partial<Record<Locale, string>>> = {},
): LocalizedValue {
  const value = Object.freeze({
    text,
    translations: Object.freeze({ ...translations }),
  }) as LocalizedValue;
  recordLocalized(value, { text, translations });
  return value;
}
