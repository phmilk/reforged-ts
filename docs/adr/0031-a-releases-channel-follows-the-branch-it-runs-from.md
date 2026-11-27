---
status: accepted
date: 2026-11-27
---

# A release's channel follows the branch it runs from

Three things a release does were decided apart, and drifted. The Creation CLI downloaded the Template at the tag `v1`, which the release's Template gate cloned too and a human moved: on 2026-11-27 it was 11 commits behind the Template's `main`, so a new Map project came without `pnpm studio` and every release since 2026-11-12 had been gated against that old Template. The alphas went to the `next` dist-tag only, so `latest` stayed on the first alpha of every package, and `npx create-reforged-map` or `pnpm add reforged-ts` without `@next` installed it. And nothing said how a major is prepared once 1.0.0 is out while 1.x keeps shipping, nor where an Agent sends a change that breaks a public API.

We decide that one rule, the Release channel, decides for every package and for the Template what a release publishes and what it is checked against: the branch the release runs from.

- **`master` is the stable channel.** A release from `master` publishes every package on the `latest` dist-tag, and the Template gate and the packed Creation CLI use the Template's `main`. During the build phase this already holds: the alphas go on `latest`.
- **`next` is the channel of a major in preparation.** When a major is prepared, a branch `next` is cut from `master` in Changesets pre mode (`beta`, then `rc`), and the Template gets a branch `next` too. A release from `next` publishes on the `next` dist-tag, and its gate, its packed CLI and its Template dispatch use the Template's `next`. When the major ships, a human merges `next` into `master` and both branches `next` are deleted.
- **Majors go to `next`.** On `master`, a package takes a major changeset only while it is not yet at its first stable version, which every package is during the build phase; after that a major of any package goes to `next`, and the check that reads a pull request's changesets refuses it on `master`.
- **Any other branch has no channel.** A release runs from `master` or `next`, and from no other branch.

One module of the release package, `release/src/release-channel.ts`, is the one place that knows the rule: it takes the branch and the versions of the workspace's packages and answers the dist-tag, the Template ref and whether each package may take a major. The workspace's pre state no longer decides the dist-tag.

The rule follows common practice: dist-tags per channel (`latest` for the stable line, `next` for its prerelease), Changesets' advice to run pre mode on a branch of its own so that it never blocks the stable releases, and a scaffolder whose Template ref follows its own release channel.

It amends two decisions:

- **ADR 0018** turned down "downloading the Template's default branch" because it is ahead of what the last release gated. The Template's `main` takes only pull requests its own CI passed, the sync pull requests among them, and every release gates the Template's `main` with the packed packages; a ref moved by hand and behind `main` was the larger risk, as `v1` showed. The Creation CLI and the Template gate now take the channel's Template ref, `main` from `master`, instead of `v<major>` of the library's version.
- **ADR 0009**'s consequence "during the build phase the `next` dist-tag carries `1.0.0-alpha.N`" no longer holds: the alphas go on `latest`, and `next` stays on the last alpha it got until a release from `next` moves it.

## Considered options

- Canary releases (snapshot versions of `master` on a dist-tag of their own): the Version Packages pull request, merged several times a day, already plays that part. Revisit if the stable cadence drops after 1.0.0.
- `v<major>` lines (a maintenance branch and a Template ref per major): the support window ships fixes only on the latest minor of the latest major and backports nothing, so no ref is kept for an old major.
- Pre mode on `master` for a major: every release of `master` would be a prerelease until the major ships, and no fix could go out stable meanwhile, which Changesets advises against.
- Betas of every minor: a minor breaks nothing, so a beta line for it costs a branch and a Template ref for no author's benefit.
- Majors refused on `master` for `reforged-ts` alone: a major of any package, the Typings, the harness or the lint plugin among them, breaks a Map project on `^1`.
- A docs site for a beta line: the docs keep deploying from `master`, and a beta's changes live in its changelog and its migration page on `next`.

## Consequences

- `release:dist-tag` takes the branch and writes `latest` into the publish plan of a release from `master`, the alphas included, so `npx create-reforged-map` and `pnpm add reforged-ts` install the current alpha, and the READMEs and the docs stop asking for `@next` during the build phase.
- The Template gate, the Template clone, the packed Creation CLI and the Template dispatch take the channel's Template ref, so no ref is moved by hand; the tag `v1` is retired once a Creation CLI that downloads `main` is on `latest`.
- After 1.0.0, a major changeset on `master` fails CI, naming the branch `next`; a Spec or Ticket whose delivery needs a major carries the label `next`, and its work is based on `next`.
- A workflow merges `master` into `next` at every push to `master` while `next` exists, and the merge of `next` into `master` stays a human step with its checklist.
- The release workflow runs from `next` as from `master`, and the environment `app` admits both.

Decision record: https://github.com/phmilk/reforged-ts/issues/1062
