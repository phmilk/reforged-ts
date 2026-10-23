---
status: accepted
date: 2026-10-23
---

# The Agent skills both repositories share are written in the library and copied into the Template

ADR 0022 installs the Upstream skills in each repository, the Template included, each with its own lock. But the two repositories are one project: the Claim board spans both (ADR 0016), a Spec of the library can have Tickets in the Template, and `ship-spec` works them from the library's session. Two installs drift apart as soon as one is updated and the other is not, and a Skill variant such as `write-spec` would be written twice, with nothing to say which copy is right.

We amend ADR 0022: what both repositories run is written once, in the library, and the Template carries a copy. The shared part is the Upstream skills with their lock, the Skill variants that work issues on the board (`write-spec`, and later `split-spec` and `ship-spec`) and the session-start hook; a list in the library names it. What serves one repository stays there: `add-wrapper`, `add-lint-rule` and `new-patch` in the library, the Seeds `map-feature` and `run-in-game` in the Template. The copy is committed, so a checkout of the Template, local or in the cloud, loads it from files as the library does. The library's weekly skills workflow, after it updates the library, compares the Template's copy with the library's default branch and opens a pull request in the Template when they differ, under the repositories' GitHub App. The copy records the library commit it came from and its content hashes, and a test in the Template fails when a shared file was edited there. The protocol docs are not copied: the Template's issue tracker doc already points at the library's Claim section.

## Considered options

- A third repository holding the shared skills, consumed as a plugin. A plugin declared in a repository's settings does not load in cloud sessions, and it namespaces every skill, the reasons ADR 0022 turned down upstream's plugin.
- A third repository consumed as a git submodule. Every clone needs the submodule initialised, which a cloud session is not known to do, and a third repository needs its own CI, lock and updates.
- Each repository installs its own copy, as ADR 0022 had it. It is the drift this record fixes.
- The release sync carrying the copy to the Template with the library's terms. A change to a skill would wait for the library's next release.

## Consequences

- A shared skill is edited in the library only; the Template receives the change within a week, or sooner when the workflow is run by hand.
- The Template lists its copy and the record of its origin as Template maintenance, so `template:detach` removes them from a generated Map project, as ADR 0022 had it.
- The weekly workflow writes to both repositories, so it needs the App's token for the Template as the release's dispatch does.

Decision record: https://github.com/phmilk/reforged-ts/issues/725
