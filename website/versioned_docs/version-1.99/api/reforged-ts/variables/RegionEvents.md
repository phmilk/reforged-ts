# Variable: RegionEvents

> `const` **RegionEvents**: [`EventDescriptors`](../type-aliases/EventDescriptors.md)\<\{ `enter`: \{ `read`: (`event`) => [`RegionCrossing`](../interfaces/RegionCrossing.md); `register`: (`trigger`, `region`, `filter?`) => `void`; \}; `leave`: \{ `read`: (`event`) => [`RegionCrossing`](../interfaces/RegionCrossing.md); `register`: (`trigger`, `region`, `filter?`) => `void`; \}; \}\>

Defined in: [events/region.ts:26](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/region.ts#L26)

The region Event descriptors: `RegionEvents.enter(region, filter?)` and
`RegionEvents.leave(region, filter?)` for one Region. The filter, a
`boolexpr` or a plain function, is handed to the registration. The
payload, a [RegionCrossing](../interfaces/RegionCrossing.md), always holds the unit and the region.
