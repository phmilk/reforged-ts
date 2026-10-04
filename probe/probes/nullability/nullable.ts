// The case generators of the four nullable families of the Nullability
// sweep, event-response, callback-getter, lookup and optional-property:
// the one cheap case a Slice declares per Native, one that should return
// nothing, as `probe/README.md` ("The cases per family") requires, and the
// catalogue cases a Slice adds beyond it. Such a Native stays nullable
// whatever its cases return.

import type { ReturnCase } from "./case-runner";

/**
 * One cheap case: `call` calls the Native once, with no event Fixture
 * unless the case needs one to leave the Native's context
 * (`GetExpiredTimer` outside its timer, in `nullability-risky`).
 */
function cheapCase(
  native: string,
  label: string,
  call: () => unknown,
): ReturnCase[] {
  return [{ native, label, group: "a", call }];
}

/** The cheap case of an event-response `native`: called outside its event. */
export function eventResponseCase(
  native: string,
  call: () => unknown,
): ReturnCase[] {
  return cheapCase(native, "outside its event", call);
}

/** The cheap case of a callback-getter `native`: called outside its enum or filter callback. */
export function callbackGetterCase(
  native: string,
  call: () => unknown,
): ReturnCase[] {
  return cheapCase(native, "outside its callback", call);
}

/**
 * The cheap case of a lookup `native`, which the Slice names by what it
 * looks up: `unsaved key`, `index out of range`.
 */
export function lookupCase(
  native: string,
  label: string,
  call: () => unknown,
): ReturnCase[] {
  return cheapCase(native, label, call);
}

/**
 * The cheap case of an optional-property `native`, which the Slice names by
 * the object that has none: `unit with no rally point`.
 */
export function optionalPropertyCase(
  native: string,
  label: string,
  call: () => unknown,
): ReturnCase[] {
  return cheapCase(native, label, call);
}

/**
 * A catalogue case of a Native of the four nullable families, beyond its
 * one cheap case: a call the handle-type catalogue (#362) or jassdoc gives
 * as returning nothing, which the Slice names: `callback of a destroyed
 * timer`. One case of group a.
 */
export function nullableCatalogueCase(
  native: string,
  label: string,
  call: () => unknown,
): ReturnCase[] {
  return cheapCase(native, label, call);
}
