---
status: accepted
date: 2026-10-23
---

# The Upstream skills live in the repository unmodified; what it adds lives in Skill variants

The development loop runs on Agent skills from `mattpocock/skills` that each Collaborator installed on their own machine, never committed here. What an Agent did depended on that install: wyller's could differ from the maintainer's, a cloud session had none, and versions drifted unseen (upstream renamed the glossary from `CONTEXT.md` to `GLOSSARY.md` while the maintainer's copies still predated it). What is specific to this repository had nowhere to live, since a local edit is lost on the next update and four skills (`to-spec`, `to-tickets`, `implement`, `implement-spec`) are human-only, so no other skill can call them.

We install the skills of upstream's `engineering` and `productivity` folders into each repository, the way upstream documents for editable files in a project: the `skills` CLI at project scope, for Claude Code, with `--copy`, and the lock committed. An Upstream skill is never edited; a conventions test proves each one's folder is the version its lock names, and a weekly workflow opens a pull request when upstream moves. The repository follows upstream's conventions rather than patching the skills, so its glossary becomes `GLOSSARY.md`. What the repository adds lives in its own Agent skills: a Skill variant, built from an Upstream skill's steps, never takes an upstream name and records the upstream version it was built from, and the conventions test fails when that version is no longer the lock's, so every update reviews the variants it touches. A variant may lift upstream's human-only flag, with a description that narrows its trigger to an explicit request or another skill: `write-spec` (from `to-spec`) and `split-spec` (from `to-tickets`) do. In Claude Code a personal skill wins over a project skill of the same name, so a session-start hook warns a Collaborator whose personal skills, or the upstream plugin, shadow the repository's. The Template carries the same skills as Template maintenance, removed from a generated Map project by `template:detach`.

## Considered options

- The plugin `mattpocock-skills` declared in the repository's settings, which upstream recommends for Claude Code. A plugin declared there does not load in cloud sessions, updates itself unpinned, and namespaces every skill (`mattpocock-skills:tdd`).
- Symlinks, the CLI's default. Windows clones have `core.symlinks=false`, and a symlink committed from one becomes a text file.
- Editing the Upstream skills in place. Every update would overwrite the edits or conflict with them, and a reader could not tell upstream's text from the repository's.
- Pinning upstream before the glossary rename. It freezes every skill at that commit and makes updating pointless.
- Leaving the install to each Collaborator, as before. It is the problem.

## Consequences

- A clone, local or in the cloud, runs the same skill text; every Collaborator removes the global copies once.
- Formatters and linters skip the Upstream skills, and line endings keep upstream's bytes.
- The "Skills" list of `AGENTS.md` names the repository's own skills and points at the lock for the rest.
- `CONTEXT.md` becomes `GLOSSARY.md` in both repositories and in generated Map projects, with every reference.
- The development loop doc stops recommending the plugin.
- Whether a Map project should keep the Upstream skills as Seeds is left open.

Decision record: https://github.com/phmilk/reforged-ts/issues/725
