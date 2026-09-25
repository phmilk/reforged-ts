/** @noSelfInFile */

// Damage re-entrancy: what stops a damage handler that damages back without
// bound (the documented infinite loop: dealing damage inside a damage
// handler fires the damage events again, until the client crashes).
//
// A Trigger that carries a damage event runs its actions and conditions,
// in Dev mode, one level deeper in a nesting depth all such triggers share
// (`damageNested`); `Unit.damageTarget` raises through `assertDamageDepth`
// when the depth exceeds the configured limit. A single bounce, the
// reflect-damage pattern, runs at depth two and passes. With Dev mode off no
// wrapper is installed, so the depth never leaves zero.
//
// Package-internal: nothing here is exported from the library index.

import type { Handle } from "../handles/handle";
import { anchored, LIBRARY } from "../init/state";
import { configuration } from "./configuration";

/** How many damage-trigger actions and conditions are running now, nested. */
const damage = anchored<{ depth: number }>("damage", () => ({ depth: 0 }));

/**
 * `fn` run one level deeper, then back at the depth it started at. `fn`
 * must not throw (a protected callback in Dev mode never does), or the
 * depth is not restored.
 */
export function damageNested<R>(fn: () => R): R {
  damage.depth++;
  const result = fn();
  damage.depth--;
  return result;
}

/**
 * Raises when damage handlers nest deeper than the configured limit: `unit`
 * dealing damage now would dispatch the damage events once more. `level` is
 * the one the caller would give `error` to name the Map project's line.
 */
export function assertDamageDepth(unit: Handle<handle>, level: number): void {
  const limit = configuration.damageDepthLimit;
  if (damage.depth > limit) {
    error(
      `${LIBRARY}: ${unit.constructor.name}#${String(unit.id)} Unit.damageTarget at damage depth ${String(damage.depth)}, past the limit of ${String(limit)}: a damage handler that deals damage fires the damage events again, which loops until the client crashes`,
      level + 1,
    );
  }
}
