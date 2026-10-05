---
status: accepted
date: 2026-10-05
---

# A Native that returns a Placeholder handle is typed nullable

On 3.0.0.24268, a few constructors of `extends handle` types fail with a Placeholder handle instead of `nil`: a handle of id 0 or -1, returned where the Native could not do what it was asked. `CreateCommandButtonEffect` does so for an unknown order, `CreateMinimapIconAtLoc` for a removed location, `AddWeatherEffect` for an unknown effect or a removed rect, `AddLightning` and `AddLightningEx` for an unknown code name or unseen points, `CreateUbersplat` for an unknown name and `TriggerAddAction` for a destroyed trigger. A nil check never catches these failures. The rule of the Nullability families said that a handle of id 0 is not nil, so the sweep counted these cases as handles, and the curation of the constructors narrowed six of them to non-null.

These Natives are typed nullable anyway. A Placeholder handle is a case without a handle, whatever the family, as a crashed case already is. A handle of id 0 that a successful call returns is still a handle: a converter's integer 0, an enum-getter's constant of integer 0, or `TerrainDeformCrater`'s first deformation from typical arguments. So a Placeholder is told apart by the case and the id together: a case other than typical arguments returned id 0 or -1, and typical arguments returned another id.

The cost is asymmetric. Narrowing a return after 1.0.0 is a minor and widening one is a major. The Placeholder looks like the binding's stand-in for `null` on the handles that are not agents, which the agents already return as `nil`, so a Patch may well turn it into `nil`. A non-null type would also tell the consumer nothing that the `notes` do not: either way, only the `notes` reveal the Placeholder.

## Considered options

- Keep the rule that a handle of id 0 is not nil: the six narrowings ship, and a Patch that turns a Placeholder into `nil` costs a major.
- Exceptions only where jassdoc says `nil` (the two `AddLightning*`): jassdoc covers two of the seven, and the other five fail the same way.
- Detect a Placeholder by the id alone: it would catch `TerrainDeformCrater`, the id-0 enum-getters and the id-0 converters, which are real handles.
- Detect a Placeholder by the case alone: it would catch `QuestCreateItem` on a destroyed quest and `CreateMinimapIconOnUnit` on a removed unit, which return real, distinct handles.

## Consequences

- Consumers write a nil check that does not fire on 3.0.0.24268, and the `@remarks` of each Native name its Placeholder cases and their ids.
- The sweep's report gives the verdict `nullable (placeholder)` for a constructor or a registration, a `mismatch` against an Overlay non-null, so a new Placeholder blocks the adoption of a Patch; the curation never narrows on it.
- Outside those two families, a handle of id 0 or -1 gives `non-null (evidence, handle id 0 or -1)`, judged by hand in review.
- `Trigger.addAction` keeps nothing when `TriggerAddAction` returns `undefined`, and still returns the Trigger.

Decision record: https://github.com/phmilk/reforged-ts/issues/443
