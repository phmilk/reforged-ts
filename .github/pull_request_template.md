## What and why

<!-- What this pull request changes and why. Link its issue: "Closes #123". One topic per pull request. -->

## Checklist

<!-- Tick what applies; for an item that does not apply, strike it through and say why. CONTRIBUTING.md explains each one. -->

- [ ] A changeset in `.changeset/` (`pnpm changeset`; an empty one, `pnpm changeset add --empty`, when nothing publishable changes), or the reason this pull request needs none.
- [ ] A library change is tested on the harness (`packages/reforged-ts/test/`).
- [ ] Every new public member has TSDoc with the tags its kind requires.
- [ ] The docs page or guide the change affects is updated.
- [ ] A renamed or removed public symbol has its `renames.json` entry and its migration page.
- [ ] The coverage report is clean: every owned Native has a method or an exclusion with a reason.
- [ ] `pnpm check` is green on my machine.
