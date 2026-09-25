/** @noSelfInFile */

// Package-internal: the handles index does not re-export this module.

/**
 * The handle type of an object-editor field constant, `unitbooleanfield` for
 * `UNIT_BF_HERO_HIDE_HERO_INTERFACE_ICON`: the text before the first colon of
 * Lua's `tostring` of the handle, which the game writes as the type name, a
 * colon and the address. `undefined` when the text has no colon.
 */
export function fieldTypeOf(field: handle): string | undefined {
  const [fieldType] = string.match(tostring(field), "^([^:]*):");
  return fieldType;
}
