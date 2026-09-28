/** @noSelfInFile */

// Package-internal: the handles index does not re-export this module.

/**
 * Reads the concrete handle type of a Handle: `unitbooleanfield` for
 * `UNIT_BF_HERO_HIDE_HERO_INTERFACE_ICON`, `triggercondition` for what
 * `TriggerAddCondition` returned. It is the text before the first colon of
 * Lua's `tostring` of the handle, which the game writes as the type name, a
 * colon and the address (`timer: 000001B786261800`, measured by the probe
 * map).
 * @param value - The Handle, such as `ITEM_IF_LEVEL`.
 * @returns The type name, or `undefined` when the text has no colon.
 */
export function handleTypeOf(value: handle): string | undefined {
  const [handleType] = string.match(tostring(value), "^([^:]*):");
  return handleType;
}
