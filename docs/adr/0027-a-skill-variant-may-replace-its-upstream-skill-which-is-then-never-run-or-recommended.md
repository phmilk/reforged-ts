---
status: accepted
date: 2026-10-28
---

# A Skill variant may replace its Upstream skill, which is then never run or recommended

`write-spec` and `split-spec` exist because `to-spec` and `to-tickets` are wrong here: `to-spec` labels an unsplit Spec `ready-for-agent`, against ADR 0025, and `to-tickets` writes no Coverage table, so `pnpm spec:check` fails at the Spec's close. Nothing said so. The development loop's diagram led from `/grill-with-docs` to `/to-spec`, the Upstream router `ask-matt` names `/to-spec` and `/to-tickets`, `AGENTS.md` listed `write-spec` without saying it replaces anything, and the grilling session that wrote this ADR ended by recommending `/to-spec`, echoing the Collaborator's own word.

We amend ADR 0022 and ADR 0025. A Skill variant may declare, under `metadata` in its frontmatter, the Upstream skill it replaces (`replaces`, next to `upstream`); that skill is then a Replaced skill. `write-spec` replaces `to-spec`, and `split-spec` replaces `to-tickets`. A Replaced skill keeps its folder unmodified and is never run or recommended: an Agent runs and names its variant, and names the Replaced skill only beside it, on the same line. When a Collaborator names one, the Agent recommends its variant with one line saying why. The variants' frontmatter is the one map, read by one dependency-free reader that the hooks and the skills conventions test share. The test fails when a `replaces` names no Upstream skill of the lock, and when `AGENTS.md` or the development loop doc names a Replaced skill without its variant on the same line. In Claude Code, the skill-target check stops a typed Replaced skill and names the variant to run, with no GitHub and no issue reference needed, and a Stop check sends back once a reply that names a Replaced skill without its variant on the same line, inside a code span or not.

## Considered options

- Removing the Replaced skills' folders. ADR 0022 keeps upstream's folders whole, so that the lock check and the weekly update stay simple.
- A Skill variant of `ask-matt` that names the variants. Its on-ramps and phase boundaries would be copied and drift; the Stop check holds its answers to the map instead.
- The map in a hook's own table. A new variant would need a hook edit, and the hooks and the test could disagree.
- The rule in `AGENTS.md` alone. The grilling session read it and still recommended `/to-spec`.

## Consequences

- `next-step` covers the whole main flow, from the end of a grilling session to the next Ticket, so the next steps always name the repository's skills.
- The reader and both checks join what both repositories share (ADR 0024).
- A new variant that replaces an Upstream skill only declares it; no hook is edited.
- An Agent outside Claude Code meets the rule in `AGENTS.md` alone.

Decision record: https://github.com/phmilk/reforged-ts/issues/802
