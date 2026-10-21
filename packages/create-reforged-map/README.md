# create-reforged-map

Creates a [reforged-ts](https://github.com/phmilk/reforged-ts) Map project from the [Template](https://github.com/phmilk/reforged-ts-template) in one command: the Template's files in a new folder, a git repository, the dependencies installed, the Template maintenance files removed by the Template's own `pnpm template:detach`, and a first commit ([ADR 0018](https://github.com/phmilk/reforged-ts/blob/master/docs/adr/0018-a-creation-cli-makes-a-map-project-from-the-gated-template.md)).

**Work in progress, not published yet** ([#657](https://github.com/phmilk/reforged-ts/issues/657)). It creates a project from a Template given as a local archive or folder; the download of the Template, the project's name and description, and the prompts come next.

## Usage

```sh
create-reforged-map <folder> --template <archive or folder> [--skip-install] [--skip-git]
```

- `<folder>` is the new project's folder. It must not exist, or be empty; its missing parents are created.
- `--template` is the Template: a tar archive, gzipped or not, whose one top-level folder is left out (GitHub's tarball of a ref, or `git archive --prefix=<name>/`), or a folder, copied but for its `.git` and `node_modules`. Its `package.json` must have the `template:detach` script.
- `--skip-install` leaves `pnpm install` out; `--skip-git` leaves git out (no repository, no commit). `pnpm template:detach` runs either way.

Before it writes anything, it checks that the folder can hold the project and that `pnpm` runs, and `git` unless skipped, and says how to install what is missing. It writes the Template into a temporary folder next to the target and moves it into place, so a failure before the move leaves nothing in the target. Then it runs, in the new folder, `git init`, `pnpm install`, `pnpm template:detach`, `git add --all` and `git commit`, printing each stage as it runs and the next steps at the end. A failure after the move names the stage and prints the commands to finish by hand. When git has no identity, the files stay staged, it prints how to set one and commit, and the creation still succeeds. pnpm's commands run on the pnpm version the Template's `packageManager` pins.

It has no runtime dependency: Node alone runs it.

## Exit codes

- 0: the project is created (committed, or staged when git has no identity).
- 1: the creation stopped; the message on standard error names the stage.
- 2: an argument it does not take; the usage goes to standard error.

## Tests

`pnpm --filter create-reforged-map test` calls `create` with a Template archive the tests build from a minimal Template-shaped fixture and a recording `Runner`, with no network and no process but the fixture's detach script; one test runs the command end to end with git and pnpm, the install skipped.
