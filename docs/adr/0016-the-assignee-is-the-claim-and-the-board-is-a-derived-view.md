---
status: accepted
date: 2026-10-07
---

# The assignee is the Claim; the board is a derived view

Two repositories (`phmilk/reforged-ts` and `phmilk/reforged-ts-template`), a few Collaborators and the Agents they run as their own logins work the same issues, and nothing said who was on what. On 2026-10-03 three issues (#372, #377, #381) each had a pull request opened by one login on an unassigned issue and, hours later, a self-assignment by another: near misses, not yet a collision. The skills the Collaborators run (`triage`, `to-spec`, `to-tickets`, `implement`, `implement-spec`) claim nothing; only the wayfinder's sessions did, by assigning themselves (#522).

We adopt one Claim protocol for both repositories, GitHub-only: the assignee is the Claim. Before working on an issue, a Collaborator or an Agent assigns itself, as its first write; an issue assigned to another login is theirs. One login per issue, a second assignee only by the first, for pairing. One Claim at a time, an issue or a spec with its tickets, written on every issue and never inferred from a parent (#528). Only a ready issue is claimable: `ready-for-agent`, `ready-for-human`, a frontier ticket of a map, a `ready-for-agent` spec. A Claim is stale after 3 days without a commit on its pull request and without a comment, and any Collaborator may take it over after a comment. The protocol is enforced at pull-request time by the `claim` workflow of both repositories, which assigns the author of a pull request to the unclaimed issues it closes and fails it on an issue claimed by another login, advisory first, required after a trial (#525). A Projects board on the owner's account, over both repositories, shows the work by Status (Backlog, Ready, Blocked, In progress, In review, Done), every value derived from GitHub state (the assignee, the open pull requests, the blockers, the labels, the sub-issues) and written by one reconcile workflow in `phmilk/reforged-ts` with a classic personal access token of the maintainer, because neither `GITHUB_TOKEN` nor the repositories' GitHub App reaches a user-owned project (measured 2026-10-07, #524). Nobody moves a card by hand, and nothing in the protocol requires reading the board, which an Agent cannot read without a scope and, for a private project, an invitation (#523).

## Considered options

- A comment ("taking this") as the Claim. Free text is not queryable: the loop, the check and the board need one field with one meaning, and the assignee already is one.
- A chat channel between Collaborators. Outside GitHub, invisible to an Agent, and nothing `gh` can read.
- The board as the source of truth, with cards moved by hand. A card is unreadable to an Agent without the `project` scope, and a hand-moved board drifts from the issues within a day; the board stays a view.
- A machine user or the GitHub App as the board's writer. The App's installation token sees no user-owned project, and a machine user would be a second account to keep; the maintainer's classic token, rotated yearly, was accepted as the cost of a board that stays true.
- No board. An issue search by assignee shows who holds what, but not what is blocked, in review or ready across two repositories.
- Claiming several tickets ahead, to reserve them. A Claim means working now; intent is a comment, and the blocked-by edges order the tickets.

## Consequences

- Every Collaborator and every Agent assigns itself before working, and the skills that claim nothing are bound by one Rules line in `AGENTS.md` and the Claim section of `docs/agents/issue-tracker.md`, in both repositories.
- A contributor without push access cannot assign themselves: they comment on the issue, which makes them assignable, and the check assigns them when their pull request opens.
- `implement-spec` stays inside the protocol: a spec with an assignee is being worked whole, and its pull request names the spec only when it delivers the spec's last open ticket.
- The board costs one secret, a classic personal access token of the maintainer with the `project` scope, stored in `phmilk/reforged-ts` and rotated through the repository-setup wizard; a dead token shows as a red scheduled run. The board's definition is code in the release package (`board:setup`, `board:reconcile`).
- The `claim` check is one more workflow on `pull_request_target`, without a checkout of the pull request's code; it becomes a required check (`claim / check`) only after two weeks without a false failure, by a ruleset change.
- The Template carries only the thin caller workflow and the tracker doc's Claim section, both Template maintenance, deleted in a generated Map project.

Decision record: https://github.com/phmilk/reforged-ts/issues/518
