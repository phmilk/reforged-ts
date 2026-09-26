---
"eslint-plugin-reforged": patch
---

Every rule's `meta.docs.url` points at the rule's page under the Lint rules guide of the docs site, `https://phmilk.github.io/reforged-ts/docs/<docs version>/guides/lint-rules/<rule>`, which the site serves from the page the plugin ships in `docs/`. The previous `https://phmilk.github.io/reforged-ts/<docs version>/lint/<rule>` URLs led to no page.
