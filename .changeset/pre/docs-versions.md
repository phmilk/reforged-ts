---
---

The docs site cuts a docs version per library minor with `pnpm docs:version <label>` (the library's `major.minor`), which collects, freezes the guides and the library's reference, then keeps the last three minors of each major; `pnpm docs:prune` applies that retention alone. Every cut version answers at `/docs/<label>`, and the compatibility page shows a pruned version's label as text. The Typings' reference moves out of the versioned docs to `/typings/<Game version>/`, the same for every docs version. Nothing is published.
