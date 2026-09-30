---
status: accepted
date: 2026-09-29
---

# The Probe runner copies the Template's minimal pipeline instead of depending on the Template

A Probe run measures the game against this workspace's sources: a Probe may import the library as it stands on the branch, before any release. The Probe runner therefore lives here, as the private package `probe/`, and holds a copy of the few parts of the Template's pipeline a `-loadfile` run needs: the typescript-to-lua compile into one bundle, the byte-exact compose of the editor script and the bundle, and the stage of the map folder, with a copy of the Template's map folder. It has no MPQ writer and no generate step, because the game loads the staged folder as it is. The copies come from one Template commit, which `probe/PROVENANCE.md` records with every file copied, so a drift from the Template can be traced and repaired.

This reads against the spirit of ADR 0006, where the Template owns the pipeline and this repository only proves, before each release, that the Template builds. Here a second copy of that pipeline lives in this repository. The tension is accepted because the copy serves a different purpose: it never builds a Map project, only a Probe of this workspace, and the Template stays the one pipeline a Map project uses.

## Considered options

- A command of the Template that builds a Probe: the pipeline stays in one place, but every Probe run first packs this workspace's packages and installs them into a Template checkout, and the runner then depends at run time on the other repository and its state.
- Driving a clone of the Template, as the release's Template gate does: no copy either, but the same pack and install before each run, a clone to keep current, and a failure in the Template that blocks a Probe run of this workspace.
- Depending on the Template as a package: the Template is a repository to generate from, not a package, and publishing its pipeline would make it a second library to version.

## Consequences

- Two copies of the compile, compose and stage exist. A fix to the Template's copy is not carried over by itself: whoever changes one reads the provenance note and decides whether the other needs it.
- The runner adapts its copies where a Probe differs from a Map project (the bundle's entry is the runner's in-game module, the Probe is mapped in per build); each adaptation is listed in the provenance note.
- A Probe run needs no pack, no install and no Template checkout, and CI builds every Probe on each pull request without the other repository.

Decision record: https://github.com/phmilk/reforged-ts/issues/299
