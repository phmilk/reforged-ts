# create-reforged-map

Creates a [reforged-ts](https://github.com/phmilk/reforged-ts) Map project from the [Template](https://github.com/phmilk/reforged-ts-template) in one command: the Template's files in a new folder, a git repository, the dependencies installed, the Template maintenance files removed by the Template's own `pnpm template:detach`, and a first commit ([ADR 0018](https://github.com/phmilk/reforged-ts/blob/master/docs/adr/0018-a-creation-cli-makes-a-map-project-from-the-gated-template.md)).

```sh
npx create-reforged-map@next my-map
pnpm create reforged-map@next my-map
```

Either runs the command of the newest alpha without installing it (`pnpm create reforged-map` runs `create-reforged-map`). It needs pnpm on the `PATH`, and git unless `--skip-git`.

**Supported Patch: 3.0.1.24370.** The `reforged.patch` field of `package.json` carries the same Build.

<!-- The release's version step (release:version) stamps the docs version of each release into these links: docs/release.md. -->

**For AI agents:** the documentation of this version as Markdown: [llms.txt](https://phmilk.github.io/reforged-ts/docs/next/llms.txt) links each page, and [llms-full.txt](https://phmilk.github.io/reforged-ts/docs/next/llms-full.txt) holds them all in one file.

**Build phase: write `@next`.** Until 1.0.0, every version is an alpha (`1.0.0-alpha.N`) published under the `next` dist-tag. npm gives `latest` to a package's first version, so `latest` stays on `1.0.0-alpha.0` until 1.0.0 is published: a bare `npx create-reforged-map` would run that first alpha, whatever alphas came after it. Every doc therefore writes `create-reforged-map@next` until 1.0.0, when `latest` moves to it.

## Usage

```sh
create-reforged-map [<folder>] [--template <archive or folder>] [--name <name>] [--description <text>] [--yes] [--skip-install] [--skip-git]
```

- `<folder>` is the new project's folder. It must not exist, or be empty; its missing parents are created.
- Without `--template`, it downloads the Template from GitHub: the tarball of `phmilk/reforged-ts-template` at `v1`, the line the library's release gate checks out for its major (`templateRef` in the release scripts; a test holds the two equal). It embeds no Template file. A failed download says whether this machine looks offline, GitHub cannot be reached or answers an error, or the ref does not exist, and leaves nothing in the folder.
- `--template` is a local Template instead: a tar archive, gzipped or not, whose one top-level folder is left out (GitHub's tarball of a ref, or `git archive --prefix=<name>/`), or a folder, copied but for its `.git` and `node_modules`. Its `package.json` must have the `template:detach` script.
- `--name` is the project name, the folder's base name when not given. It must be a valid npm package name (lowercase, URL-safe, at most 214 characters, an optional `@scope/`), so that `pnpm install` takes it.
- `--description` is a one-line description of the map.
- `--yes` accepts every default without asking: the project name is the folder's base name and the description the Template's.
- `--skip-install` leaves `pnpm install` out; `--skip-git` leaves git out (no repository, no commit). `pnpm template:detach` runs either way.

When standard input is a terminal, it asks for each answer the arguments leave out, and only for those: the folder, until one is typed; the project name, the folder's base name when left blank, asked again with the reason while it is not a valid npm package name, a `--name` that is not one included; and the description, none when left blank. With `--yes` it asks only for a missing folder, and a `--name` that is not a valid npm package name is an error naming it. Ctrl+C or Ctrl+D at a prompt cancels with nothing created. Without a terminal nothing is asked, so an Agent or a CI job never waits: the name and the description take their defaults, and a missing folder, or a project name that is not a valid npm package name (given, or the folder's base name), is an error naming its argument. The prompts use Node's `readline`.

Before it writes anything, it checks that the folder can hold the project and that `pnpm` runs, and `git` unless skipped, and says how to install what is missing. It writes the Template into a temporary folder next to the target, prepares its Seeds there, moves its map folder to its root named after the project, and moves it into place, so a failure before the move or during it leaves nothing in the target. Once the Template is written, it warns when the running Node does not satisfy the Template's own `engines.node` (`>=24` today), and goes on. Then it runs, in the new folder, `git init`, `pnpm install`, `pnpm template:detach`, `git add --all` and `git commit`, printing each stage as it runs and the next steps at the end. A failure after the move names the stage and prints the commands to finish by hand. When git has no identity, the files stay staged, it prints how to set one and commit, and the creation still succeeds. Preparing the Seeds writes the project name as the `name` of `package.json` and the first-level title of the README, and the description, when given, as the `description` of `package.json`, in a paragraph of its own under the README's title, and as the body of the "Your project" section of `AGENTS.md`; nothing else in them changes, and nothing between the Template's sync markers. Each finds its place by an anchor the Template keeps (the `name` field, the README's first `# ` title, the `## Your project` heading): when one is missing, the creation stops naming it, with nothing written in the target. The map folder is the Template's one folder whose name ends in `.w3m` or `.w3x`, directly at its root or else directly under `maps/` (ADR 0020): it becomes `<name>.w3m` at the project root, keeping the suffix the Template ships and naming a scoped package after the part past its scope, `maps/` goes when that empties it, and the `mapFolder` field of `reforged.config.ts`, its anchor, names the new folder; no map folder, several, or no `mapFolder` stops the creation the same way. `pnpm install` runs on the pnpm version the Template's `packageManager` pins; `pnpm template:detach` runs on the pnpm already on the `PATH`, never one it downloads, so that a creation with `--skip-install` and a local `--template` needs no network.

It has no runtime dependency: Node alone runs it.

## Exit codes

- 0: the project is created (committed, or staged when git has no identity).
- 1: the creation stopped, and the message on standard error names the stage; or the author cancelled a prompt.
- 2: an argument it does not take, and the usage goes to standard error; or an answer missing or refused without a terminal, and the message names its argument.

## Tests

`pnpm --filter create-reforged-map test` calls `create` with a Template archive the tests build from a minimal Template-shaped fixture and a recording `Runner`, with no network and no process but the fixture's detach script; the download runs on a `fetch` the tests answer, with the archive, error statuses or network errors; the command's tests give its entry function the arguments and either no terminal or the lines an author types, the prompts themselves untested; one test runs the command end to end with git and pnpm, the install skipped.

Every release runs it on the real Template too: the Template gate of the release workflow has the packed command create a project from an archive of the Template at the ref it gates, with the install skipped, and checks the Seeds prepared and the Template maintenance gone, whether or not the release publishes this package ([The Template gate](https://github.com/phmilk/reforged-ts/blob/master/docs/release.md#the-template-gate)). The workspace's tarball test runs the packed command with Node alone.
