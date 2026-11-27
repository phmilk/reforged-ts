---
"create-reforged-map": patch
---

`create-reforged-map` downloads the Template's `main`, the branch every release is gated against, instead of the tag `v1`, which was moved by hand and fell behind: a new Map project gets every change merged into the Template, `pnpm studio` among them. A beta of the Creation CLI, released from the Next branch, downloads the Template's `next`.
