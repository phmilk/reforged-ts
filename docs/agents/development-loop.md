# The development loop

The development loop takes a piece of work from an on-ramp to a merged pull request, one Agent skill per step. Every one of them comes with the clone, in `.claude/skills/`.

## Where the Agent skills come from

- **The Upstream skills.** Every skill of the loop but the repository's own is an Upstream skill: a skill of [`mattpocock/skills`](https://github.com/mattpocock/skills), committed unmodified in `.claude/skills/` at the version [`skills-lock.json`](../../skills-lock.json) names ([Installing and updating the Upstream skills](#installing-and-updating-the-upstream-skills)). A local session and a cloud session load the same files from the checkout; nothing is installed per machine, and upstream's plugin is not used (ADR 0022). A global copy left from before shadows them: [Removing the global copies](#removing-the-global-copies).
- **The repository's.** The project skills `add-wrapper`, `add-lint-rule` and `new-patch`, and the Skill variant `write-spec` ([Skill variants](#skill-variants)), live in `.claude/skills/` too, listed with their triggers under "Skills" in `AGENTS.md`.
- **One source for both repositories.** What both repositories run, the Upstream skills with their lock, the Skill variants that work issues on the Claim board (`write-spec`) and the session-start hook, is written here, in the library, and the Template carries a copy of it (ADR 0024). [`.claude/shared.json`](../../.claude/shared.json) names what is shared. A change to a shared skill or file is made here, never in the Template's copy.
- **Set up for this repository.** The three agents docs, [`issue-tracker.md`](issue-tracker.md), [`triage-labels.md`](triage-labels.md) and [`domain.md`](domain.md), are the output of `/setup-matt-pocock-skills`, with the "Agent skills" block of [`AGENTS.md`](../../AGENTS.md#agent-skills) that points at them. The Upstream skills read them for this repository's tracker, labels and domain docs; the repository has since edited them (the Claim, the kind labels), so they are its own: change a convention there, never in a skill.
- **Named in a diagram.** A diagram cites a folder of `.claude/skills/` by its slash command, an Upstream skill as well as one of the repository's own. A skill from anywhere else is declared, with its source, in the `external` list of `test/conventions/diagrams.test.ts`: add it there first.

## Installing and updating the Upstream skills

The Upstream skills are the skills of the `engineering` and `productivity` folders of [`mattpocock/skills`](https://github.com/mattpocock/skills), the set its plugin ships, copied into `.claude/skills/` for Claude Code at project scope (ADR 0022). [`skills-lock.json`](../../skills-lock.json) names each one with its source path and the hash of its folder. One command installs them and, run again, updates them to upstream's current files and rewrites the lock; run it from the repository root and commit the folders with the lock:

```sh
npx skills@1.7.4 add mattpocock/skills -a claude-code --copy -y -s ask-matt code-review codebase-design diagnosing-bugs domain-modeling grill-with-docs implement implement-spec improve-codebase-architecture pr prototype research retro setup-matt-pocock-skills tdd to-spec to-tickets triage wayfinder wizard grill-me grilling handoff teach to-questionnaire wait-what writing-for-agents
```

- **The skill names** are the `skills` of upstream's plugin manifest, [`.claude-plugin/plugin.json`](https://github.com/mattpocock/skills/blob/main/.claude-plugin/plugin.json): the folders of its `engineering` and `productivity` folders. A skill upstream adds there joins the list; one it moves to `in-progress`, `misc` or `deprecated` leaves it, and its folder and lock entry are removed with `npx skills@1.7.4 remove -y <name>`. The CLI skips a name that matches nothing without a word and still finds a name moved to `deprecated`, so the list is never trusted from memory: `pnpm skills:update` reads the manifest, removes what it no longer ships, installs the rest and rewrites the command above when the set changes. `release/test/skills-update.test.ts` holds the command above to the lock's names.
- **The line ends.** The CLI clones upstream with the machine's git configuration and hashes the files it copies. Git for Windows sets `core.autocrlf=true`, which turns upstream's LF into CRLF in the files and in the lock's hashes. On Windows, run the command in Git Bash with `GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.autocrlf GIT_CONFIG_VALUE_0=false` before it, so the files keep upstream's LF, as an install on Linux does.
- **Unmodified.** An Upstream skill is never edited by hand: git stores its files byte for byte, Prettier and ESLint skip them, and the skills conventions test (`test/conventions/skills.test.ts`) fails when a folder's files no longer give the hash the lock records. What the repository adds lives in its own Agent skills.
- **The variants.** An update that changes the Upstream skill a Skill variant was built from fails the same test until the variant is reviewed: [Skill variants](#skill-variants).
- **From the root scripts.** `pnpm skills:update` runs the same command for the manifest's names, with the line ends kept, then prints what moved in the lock (a folder's hash or its path in upstream) and the Skill variants left to review.

### The weekly update

Nobody needs to remember the update: [`skills-update.yml`](../../.github/workflows/skills-update.yml) runs it every Monday, in two steps, each a pull request under the repositories' GitHub App, so its CI runs. It never merges.

1. **The library.** It runs `pnpm skills:update` (on Linux, so the files keep upstream's LF), with no token: the skills CLI is code from npm, so the update leaves that job as a patch, and the job that holds the App's token commits it only once it has checked that the patch touches the lock, the Upstream skills' folders, this doc and its changeset, nothing else. Upstream moved when the update changes the lock; when it did not, nothing is opened. When it did, it opens a pull request from the branch `skills-update` with the update and an empty changeset: its diff is upstream's change, line by line, and its body lists the skills that moved and the Skill variants to review, which the skills conventions test turns red until each is reviewed. Push the review to that branch. A run while that pull request is open updates it instead of opening a second: when the branch already holds the same lock nothing is pushed, so the review stays; when upstream moved again, the branch is replaced from `master` and the body rewritten.
2. **The Template's copy.** It compares the Template's copy with what [`.claude/shared.json`](../../.claude/shared.json) names on `master` (`pnpm skills:copy`, which reads the Template's record of the copy, `.claude/shared.lock.json`). When the bytes differ, it replaces the copied files, deletes those no longer shared, rewrites the record's commit and hashes, and opens a pull request in the Template from its branch `sync/shared-skills`, replaced on every run that finds a difference. When they are the same, whatever commit the record names, nothing is opened. A library pull request from step 1 reaches the Template on the run after its merge.

Run it by hand, from `master` (its jobs that hold the App run in the environment `app`, which admits `master` alone), after merging a change to a shared skill or file:

```sh
gh workflow run skills-update.yml
```

`skills check` is not run: in `skills@1.7.4` it is another name of `skills update`, which reinstalls each skill as a symlink, without `--copy`, and for every agent it detects. The install above is the check.

### Skill variants

A Skill variant is an Agent skill of the repository built from an Upstream skill's steps, under its own name: `write-spec` is `to-spec`'s steps, which an Agent may invoke. An Agent skill that only invokes Upstream skills by name, without copying their steps, is not a variant and records nothing.

- **Its own name.** A variant never takes an Upstream skill's name, so a slash command always means one skill.
- **Its source, in its frontmatter.** Under `metadata`, `upstream` names the Upstream skill and `upstream-hash` records the lock's version of it when the variant was built or last reviewed. The lock holds no commit or version number per skill: a skill's version there is the `computedHash` of its folder, which changes exactly when one of the folder's files does. `upstream-hash` is that hash, copied from `skills-lock.json`:

  ```yaml
  metadata:
    upstream: to-spec
    upstream-hash: <the computedHash of to-spec in skills-lock.json>
  ```

- **Reviewed on every update.** The skills conventions test fails when a variant records an Upstream skill the lock does not name, or a hash that is not the lock's current one. After an update moves that hash, read the diff of the Upstream skill's folder, carry the changed steps into the variant where they apply, then copy the new hash into `upstream-hash`.
- **The human-only flag.** A variant may drop upstream's `disable-model-invocation: true`, so that an Agent or another skill can invoke it; its description then narrows the trigger to an explicit request or another skill's call, as `write-spec`'s does.

## Removing the global copies

In Claude Code a personal skill (`~/.claude/skills/<name>/`) wins over a project skill of the same name. A global copy of an Upstream skill, installed with the `skills` CLI before the skills came into the repository, therefore replaces the repository's without a word, and upstream's plugin `mattpocock-skills` loads every Upstream skill a second time under its own namespace (`mattpocock-skills:tdd`). Remove both once, naming the skills the warning below names:

```sh
npx skills remove -g <name>...
claude plugin uninstall mattpocock-skills@claude-plugins-official
```

A personal skill of your own that shares a repository skill's name is renamed or deleted by hand.

- **The warning.** The session-start hook [`.claude/hooks/shadowed-skills.mjs`](../../.claude/hooks/shadowed-skills.mjs), registered in the shared project settings [`.claude/settings.json`](../../.claude/settings.json), runs when a session starts or resumes. It names each personal skill that has the name of a folder of `.claude/skills/`, and the upstream plugin when `~/.claude/settings.json` enables it, with the command that removes them. Claude Code shows the warning in the session and gives it to the Agent too.
- **It never blocks.** The hook prints nothing when nothing shadows the repository's skills, always exits 0, and needs no `pnpm install`: it is dependency-free Node. Its test, `test/conventions/shadowed-skills.test.ts`, runs it against a fake home folder.

## The loop

An on-ramp shapes the work, the spec and its tickets fix it, the Claim takes it, and an implementation skill carries it to the pull request:

```mermaid
flowchart TD
  %% diagram: development-loop
  %% covers: skills
  subgraph on_ramps["the on-ramps"]
    triage["/triage"]
    wayfinder["/wayfinder"]
    research["/research"]
    prototype["/prototype"]
    diagnosing_bugs["/diagnosing-bugs"]
  end
  grill_with_docs["/grill-with-docs"]
  to_spec["/to-spec: a spec"]
  write_spec["/write-spec: a spec an Agent writes when asked"]
  to_tickets["/to-tickets: its tickets"]
  claim["the Claim, the first write: gh issue edit --add-assignee @me"]
  implement["/implement, which does not claim"]
  implement_spec["/implement-spec, which does not claim"]
  tdd["/tdd"]
  code_review["/code-review"]
  add_wrapper["/add-wrapper"]
  add_lint_rule["/add-lint-rule"]
  new_patch["/new-patch"]
  pull_request["a pull request with its changeset, pnpm check green"]
  merge["the merge into master"]

  wayfinder --> grill_with_docs
  research --> grill_with_docs
  prototype --> grill_with_docs
  diagnosing_bugs --> grill_with_docs
  triage -->|"a ready-for-agent issue"| claim
  diagnosing_bugs -->|"a bug fixed at once"| claim
  grill_with_docs --> to_spec
  grill_with_docs --> write_spec
  to_spec --> to_tickets
  write_spec --> to_tickets
  to_tickets --> claim
  claim -->|"a ticket or an issue"| implement
  claim -->|"a spec with its tickets"| implement_spec
  claim -->|"a Native to cover"| add_wrapper
  claim -->|"a pitfall to guard at lint level"| add_lint_rule
  claim -->|"a new Patch"| new_patch
  implement --> tdd
  implement_spec -->|"one implementer per ticket"| tdd
  tdd --> code_review
  code_review --> pull_request
  add_wrapper --> pull_request
  add_lint_rule --> pull_request
  new_patch --> pull_request
  pull_request -->|"the required checks green, a review"| merge
```

| Node               | Details in                                                                                                                                                            |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/triage`          | [its `SKILL.md`](../../.claude/skills/triage/SKILL.md); the labels it applies: [`triage-labels.md`](triage-labels.md)                                                 |
| `/wayfinder`       | [its `SKILL.md`](../../.claude/skills/wayfinder/SKILL.md); its map and tickets: [Wayfinding operations](issue-tracker.md#wayfinding-operations)                       |
| `/research`        | [its `SKILL.md`](../../.claude/skills/research/SKILL.md)                                                                                                              |
| `/prototype`       | [its `SKILL.md`](../../.claude/skills/prototype/SKILL.md)                                                                                                             |
| `/diagnosing-bugs` | [its `SKILL.md`](../../.claude/skills/diagnosing-bugs/SKILL.md)                                                                                                       |
| `/grill-with-docs` | [its `SKILL.md`](../../.claude/skills/grill-with-docs/SKILL.md); the docs it reads and writes: [`domain.md`](domain.md)                                               |
| `/to-spec`         | [its `SKILL.md`](../../.claude/skills/to-spec/SKILL.md); its label: [Kind labels](triage-labels.md#kind-labels)                                                       |
| `/write-spec`      | [its `SKILL.md`](../../.claude/skills/write-spec/SKILL.md); [Skill variants](#skill-variants); its labels: [Kind labels](triage-labels.md#kind-labels)                |
| `/to-tickets`      | [its `SKILL.md`](../../.claude/skills/to-tickets/SKILL.md); its label: [Kind labels](triage-labels.md#kind-labels)                                                    |
| the Claim          | [Claim](issue-tracker.md#claim) in the issue tracker doc                                                                                                              |
| `/implement`       | [its `SKILL.md`](../../.claude/skills/implement/SKILL.md)                                                                                                             |
| `/implement-spec`  | [its `SKILL.md`](../../.claude/skills/implement-spec/SKILL.md)                                                                                                        |
| `/tdd`             | [its `SKILL.md`](../../.claude/skills/tdd/SKILL.md)                                                                                                                   |
| `/code-review`     | [its `SKILL.md`](../../.claude/skills/code-review/SKILL.md)                                                                                                           |
| `/add-wrapper`     | [its `SKILL.md`](../../.claude/skills/add-wrapper/SKILL.md)                                                                                                           |
| `/add-lint-rule`   | [its `SKILL.md`](../../.claude/skills/add-lint-rule/SKILL.md); [Adding or changing a rule](../../packages/eslint-plugin-reforged/AGENTS.md#adding-or-changing-a-rule) |
| `/new-patch`       | [its `SKILL.md`](../../.claude/skills/new-patch/SKILL.md); [New Patch loop](../../packages/reforged-types/AGENTS.md#new-patch-loop)                                   |
| a pull request     | [Pull requests](../../CONTRIBUTING.md#pull-requests) and [Changesets](../../CONTRIBUTING.md#changesets) in the contributing guide                                     |
| the merge          | [Pull requests](../../CONTRIBUTING.md#pull-requests): the required checks                                                                                             |

- **The Claim is the first write**: `gh issue edit <n> --add-assignee @me` before the branch, the first commit, any comment and the pull request. `/implement` and `/implement-spec` do not claim by themselves: claim the ticket, the issue, or the spec with its tickets, then invoke one. A spec you will split and implement yourself is claimed before `/to-tickets`, then the tickets the split creates; the on-ramps, triage and the split write without a Claim.
- **A project skill replaces `/implement`** for its task: `/add-wrapper` covers a Native, `/add-lint-rule` guards a pitfall at lint level, `/new-patch` adopts a Patch. Each carries its own steps to the pull request and its changeset.
- **`/implement` works one ticket or issue** on the current branch: `/tdd` at agreed seams, then `/code-review`. **`/implement-spec` works a whole spec** on one branch and one draft pull request closing the spec and its tickets: an implementer per ticket on the frontier of the task graph, each in its own worktree driving `/tdd`, a merger after each, then `/code-review` on the whole.
