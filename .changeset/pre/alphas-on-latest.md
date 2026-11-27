---
"reforged-ts": patch
"reforged-types": patch
"reforged-test": patch
"eslint-plugin-reforged": patch
"reforged-map": patch
"reforged-builtins": patch
"create-reforged-map": patch
"reforged-studio": patch
---

The alphas are published under npm's `latest` dist-tag, so `pnpm add reforged-ts` and `npx create-reforged-map my-map` install the current alpha without `@next`, and `pnpm update` moves a Map project to it. Each README's install commands drop `@next`. The `next` dist-tag now carries only the betas of a major in preparation; until one exists, it stays on the last alpha it got.
