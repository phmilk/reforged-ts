---
status: accepted
date: 2026-10-28
---

# An implement ends with its pull request, opened by `ship`

ADR 0021 lets an Agent merge its own pull request behind the required checks and a `/code-review`, yet an implement still stopped short of the pull request. `/implement` is an Upstream skill that ends at a commit on the current branch, which may be the default one; `/implement-spec` marks its draft ready but never turns auto-merge on; `next-step` only printed `/pr, then gh pr merge --auto --squash`; and the harness pushes or opens a pull request only when asked. So the self-merge waited on a human for the pull request to exist (phmilk/reforged-ts-template#134 ended reviewed, in three commits, and its pull request opened only because the Collaborator asked), and nobody could tell afterwards whether a pull request was reviewed, since `/code-review` posts nothing to GitHub.

We amend ADR 0021 and ADR 0025. Every implement ends with `/ship`, an Agent skill both Board repositories share, which invokes `/code-review` and `/pr` by name and copies no steps, so it is not a Skill variant. `ship` never pushes the default branch: commits made there move to a new branch `<type>/<n>-<slug>`. It opens no pull request without a `/code-review` of the branch's last commits in the session, a green `pnpm check` and a changeset; when the check stays red after one fix, it opens nothing and leaves the Claim protocol's "Stopping" comment. It pushes and opens the pull request (after `/implement-spec`, it rewrites the draft's body and marks it ready) with a body written with `/pr` and a `## Review` section naming each round, its fixed point and its fix commits, then its Judgement calls and Open decisions. It turns auto-merge on (`gh pr merge --auto --squash`) unless something waits for a human (a screen check, multiplayer, a Probe on a machine without the game), an Open decision is stated, or the Merge Danger is a one-way door; then auto-merge stays off and the body says why. A Judgement call never holds the merge. The repository's rules are the Collaborator's standing request to push and open the pull request, and a Collaborator who says otherwise in a session is obeyed. In Claude Code, a Stop check blocks once an Agent that ends its turn after an implement with commits ahead of the default branch and no pull request, or a draft without auto-merge, and tells it to run `/ship` or say why it stops.

## Considered options

- A Skill variant of `implement` that ends with the pull request. ADR 0025 turned it down: a typed `/implement` would still run upstream's steps, and the variant would copy steps that move with every update.
- Editing `/implement`'s last step. ADR 0022 keeps the Upstream skills unmodified.
- Leaving the pull request to `next-step`'s printed steps. It is what failed: the steps were printed and the Agent stopped.
- Every pull request with auto-merge on. A choice that is not the Agent's, or a change that cannot be walked back, would merge unread.
- Merging outside auto-merge, `--admin` or the API's merge endpoint. ADR 0021's limits stand.

## Consequences

- `next-step` prints `/ship` where it printed `/pr, then gh pr merge --auto --squash`, and `ship-spec` (#727) opens each Ticket's pull request with `ship`.
- The skill-target check names the branch to create when an implement starts on the default branch, then `/ship`.
- A reader of a pull request can tell from its body whether it was reviewed, though no CI check reads the `## Review` section yet.
- `ship` and its Stop check join what both repositories share (ADR 0024), and `AGENTS.md`'s Rules and the Template's "Template maintenance" state the standing request.
- An Agent outside Claude Code meets the rule in `AGENTS.md` alone.

Decision record: https://github.com/phmilk/reforged-ts/issues/802
