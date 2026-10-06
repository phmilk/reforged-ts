---
"reforged-ts": major
---

Every API that takes a Rawcode takes it by Object kind: `Unit.create` takes a `Rawcode<"unit">`, `unit.addAbility` a `Rawcode<"ability">`, `Item.create` a `Rawcode<"item">`, `Destructable.create` a `Rawcode<"destructable">`, `MapPlayer`'s tech members a `Rawcode<"unit" | "upgrade">`, and each `skin` the kind of its Wrapper. `Effect`'s spell effects take `string | Rawcode<"ability">`. A `FourCC` literal compiles unchanged wherever a Rawcode is expected. A plain `number`, or a Rawcode of another kind, is now a compile error: give a computed `number` its kind with a cast, such as `id as Rawcode<"unit">`. Order ids, such as those `Group`'s `order*` take, stay `number`.
