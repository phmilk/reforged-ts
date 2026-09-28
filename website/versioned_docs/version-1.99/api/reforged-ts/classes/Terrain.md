# Class: Terrain

Defined in: [handles/terrain.ts:10](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/terrain.ts#L10)

The terrain of the map, over the terrain Natives: a Static namespace,
static members over the terrain of the whole game rather than one Handle.
The terrain namespaces of release 1.1 will sit beside it.

## Example

**Finding a walkable spot**

```ts
// A footman placed on walkable ground. `Terrain.isPathable` passes on the
// game's inverted answer: `true` where the pathing type is NOT set, so a
// point ground units can walk on is one where it returns `false`.
import { Init, MapPlayer, Terrain, Unit } from "reforged-ts";

/** Tells whether ground units can walk at (x, y). */
export function isWalkable(x: number, y: number): boolean {
  return !Terrain.isPathable(x, y, PATHING_TYPE_WALKABILITY);
}

Init.onGameStart(() => {
  const owner = MapPlayer.fromIndex(0);
  let x = 0;
  while (x < 2048 && !isWalkable(x, 0)) {
    x += 64;
  }
  if (owner) {
    Unit.create(owner, FourCC("hfoo"), x, 0);
  }
});
```

## Methods

### isPathable()

> `static` **isPathable**(`x`, `y`, `type`): `boolean`

Defined in: [handles/terrain.ts:28](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/terrain.ts#L28)

Checks one pathing type at a point, with the inverted answer of
`IsTerrainPathable` passed through unchanged.

#### Parameters

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

##### type

`pathingtype`

The pathing type, such as `PATHING_TYPE_WALKABILITY`.

#### Returns

`boolean`

`true` when the pathing type is NOT set at the point, `false`
when it is.

#### Remarks

The answer is the inverse of what the name says (jassdoc,
`IsTerrainPathable`).

#### Native

[IsTerrainPathable](/typings/3.0.0/functions/IsTerrainPathable) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsTerrainPathable))

#### See

https://lep.duckdns.org/jassbot/doc/IsTerrainPathable

***

### isPathableEx()

> `static` **isPathableEx**(`x`, `y`, `type`): `boolean`

Defined in: [handles/terrain.ts:43](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/terrain.ts#L43)

Checks one pathing type at a point through `BlzIsTerrainPathableEx`
(3.0.0).

#### Parameters

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

##### type

`pathingtype`

The pathing type, such as `PATHING_TYPE_WALKABILITY`.

#### Returns

`boolean`

The Native's answer, passed through unchanged.

#### Remarks

jassdoc does not document its answer; whether it keeps the inversion
of `IsTerrainPathable` is not measured.

#### Native

[BlzIsTerrainPathableEx](/typings/3.0.0/functions/BlzIsTerrainPathableEx) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzIsTerrainPathableEx))
