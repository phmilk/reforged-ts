# Changesets

Every pull request adds one changeset here: a Markdown file naming the packages it releases and their bumps, whose text becomes the changelog entry. `pnpm changeset` adds one; so does writing the file by hand.

```md
---
"reforged-types": patch
---

Mark `BlzGetLocalClientWidth` and `BlzGetLocalClientHeight` `@async`.
```

An empty frontmatter (`---` twice, then the summary) is the changeset of a change that publishes nothing. `pre.json` holds the pre mode state and `pre/` the changesets already versioned in it; neither is edited by hand.

The release guide, [`docs/release.md`](../docs/release.md), has the rest: the non-interactive commands, pre mode and the release steps.
