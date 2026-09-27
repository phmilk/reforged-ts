---
---

The docs site cuts a docs version per library minor with `pnpm docs:version <label>` (the library's `major.minor`), which collects, freezes the guides and both API references, then keeps the last three minors of each major; `pnpm docs:prune` applies that retention alone. Every cut version answers at `/docs/<label>`, and the compatibility page shows a pruned version's label as text. Nothing is published.
