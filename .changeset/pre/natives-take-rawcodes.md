---
"reforged-types": major
"reforged-ts": major
---

Every Native, `blizzard.j` function and `common.ai` function that takes a Rawcode takes it by Object kind: `CreateUnit` takes a `Rawcode<"unit">`, `UnitAddAbility` a `Rawcode<"ability">`, `SetPlayerTechResearched` a `Rawcode<"unit" | "upgrade">` and `GetObjectName` a `Rawcode` of any kind. A `FourCC` literal compiles unchanged wherever a Rawcode is expected. A plain `number`, or a Rawcode of another kind, is now a compile error: give a computed `number` its kind with a cast, such as `id as Rawcode<"unit">`. `GetUnitTypeId` returns a `Rawcode<"unit">`. Weather effect codes, terrain type codes and order ids stay `number`, the order ids of `IssueNeutralPointOrderById` and `IssueNeutralTargetOrderById` among them; `IssueNeutralImmediateOrderById` takes a Rawcode of any kind, since a neutral structure sells units and items. In the library, `Trigger`'s `registerCommandEvent` takes a `Rawcode<"ability">` and `registerUpgradeCommandEvent` a `Rawcode<"upgrade">`, and `Unit`'s `issueNeutralImmediateOrder` and `queueNeutralImmediateOrder` take a Rawcode of any kind.
