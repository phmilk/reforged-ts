# create-reforged-map

Creates a [reforged-ts](https://github.com/phmilk/reforged-ts) Map project from the [Template](https://github.com/phmilk/reforged-ts-template) in one command: the Template's files in a new folder, a git repository, the dependencies installed, the Template maintenance files removed by the Template's own `pnpm template:detach`, and a first commit ([ADR 0018](https://github.com/phmilk/reforged-ts/blob/master/docs/adr/0018-a-creation-cli-makes-a-map-project-from-the-gated-template.md)).

**Work in progress, not published yet** ([#657](https://github.com/phmilk/reforged-ts/issues/657)). It creates a project from the Template downloaded from GitHub, or given as a local archive or folder; the prompts come next.

## Usage

```sh
create-reforged-map <folder> [--template <archive or folder>] [--name <name>] [--description <text>] [--skip-install] [--skip-git]
```

- `<folder>` is the new project's folder. It must not exist, or be empty; its missing parents are created.
- Without `--template`, it downloads the Template from GitHub: the tarball of `phmilk/reforged-ts-template` at `v1`, the line the library's release gate checks out for its major (`templateRef` in the release scripts; a test holds the two equal). It embeds no Template file. A failed download says whether this machine looks offline, GitHub cannot be reached or answers an error, or the ref does not exist, and leaves nothing in the folder.
- `--template` is a local Template instead: a tar archive, gzipped or not, whose one top-level folder is left out (GitHub's tarball of a ref, or `git archive --prefix=<name>/`), or a folder, copied but for its `.git` and `node_modules`. Its `package.json` must have the `template:detach` script.
- `--name` is the project name, the folder's base name when not given.
- `--description` is a one-line description of the map.
- `--skip-install` leaves `pnpm install` out; `--skip-git` leaves git out (no repository, no commit). `pnpm template:detach` runs either way.

Before it writes anything, it checks that the folder can hold the project and that `pnpm` runs, and `git` unless skipped, and says how to install what is missing. It writes the Template into a temporary folder next to the target, prepares its Seeds there and moves it into place, so a failure before the move leaves nothing in the target. Once the Template is written, it warns when the running Node does not satisfy the Template's own `engines.node` (`>=24` today), and goes on. Then it runs, in the new folder, `git init`, `pnpm install`, `pnpm template:detach`, `git add --all` and `git commit`, printing each stage as it runs and the next steps at the end. A failure after the move names the stage and prints the commands to finish by hand. When git has no identity, the files stay staged, it prints how to set one and commit, and the creation still succeeds. Preparing the Seeds writes the project name as the `name` of `package.json` and the first-level title of the README, and the description, when given, as the `description` of `package.json`, in a paragraph of its own under the README's title, and as the body of the "Your project" section of `AGENTS.md`; nothing else in them changes, and nothing between the Template's sync markers. Each finds its place by an anchor the Template keeps (the `name` field, the README's first `# ` title, the `## Your project` heading): when one is missing, the creation stops naming it, with nothing written in the target. pnpm's commands run on the pnpm version the Template's `packageManager` pins.

It has no runtime dependency: Node alone runs it.

## Exit codes

- 0: the project is created (committed, or staged when git has no identity).
- 1: the creation stopped; the message on standard error names the stage.
- 2: an argument it does not take; the usage goes to standard error.

## Tests

`pnpm --filter create-reforged-map test` calls `create` with a Template archive the tests build from a minimal Template-shaped fixture and a recording `Runner`, with no network and no process but the fixture's detach script; the download runs on a `fetch` the tests answer, with the archive, error statuses or network errors; one test runs the command end to end with git and pnpm, the install skipped.
