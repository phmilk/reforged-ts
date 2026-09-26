# <rule-name>

<!--
The docs page of one rule, shipped in docs/<rule-name>.md and included by
the docs site under the Lint rules guide, at
https://phmilk.github.io/reforged-ts/docs/<docs version>/guides/lint-rules/<rule-name>.
Copy this file, keep the title and the six `##` headings exactly (the plugin
test checks them, in this order), and delete this comment.
-->

<Summary: one or two sentences. What the rule reports, its severity in the recommended config (error or warning), and the replacement.>

## Why

<The pitfall and its consequence in the game. Name the catalogue's pitfall ids (#15: D1, C2, ...) and cite its sources, one link per claim.>

## Incorrect

```ts
<code the rule reports, with a comment on the reported line>
```

## Correct

```ts
<the same intent written the safe way>
```

## Options

<The options object with each field, its default and an example; or "None.">

## Suggestions and fixes

<What the editor offers: a suggestion (applied on click) and its output, a fix (applied on save; only no-legacy-w3ts-names has one), or "None: <why a fix would change behaviour>.">

## When not to use it

<When the pattern is deliberate, and the escape: `// eslint-disable-next-line reforged/<rule-name> -- <reason>`.>
