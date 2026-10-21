---
"create-reforged-map": major
---

First release of `create-reforged-map`, the creation CLI: `npx create-reforged-map@next my-map` (or `pnpm create reforged-map@next my-map`) creates a Map project from the Template in one command. It downloads the Template at the line the release gate builds (`v1`), writes the project name and a description of the map into `package.json`, the README and `AGENTS.md`, initialises git, installs the dependencies, runs the Template's own `pnpm template:detach` to leave its maintenance files out, and makes a first commit. Every prompt has an option (`--name`, `--description`, `--yes`), so an Agent can run it without a terminal; `--skip-install` and `--skip-git` leave those stages out. It needs pnpm, and git unless skipped. Write `@next` until 1.0.0: npm keeps `latest` on the first alpha.
