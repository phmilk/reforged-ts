# background-band

A Claude Code mod (a plugin with a hooks module) that shows what runs in the background of a session: each background command with its age, and each Subagent with its status and how long it has held it. An item past 15 minutes is drawn in the warning color and raises one toast. Nothing is drawn when nothing runs.

It only shows. No hook of the mod denies a call or blocks a stop, and no drawing hook writes state: stopping an Agent that waits on nothing is the work of the command hooks in the shared settings (#768), which keep working where the mod does not load.

## Where it draws

- The terminal and the desktop: a band above the prompt (`AbovePrompt`).
- VS Code and the mobile app, which Claude Code 2.1.311 does not draw that band on: a pane titled "Background", opened while one of them is attached and something runs, and closed when nothing does.

## What it reads

- A background command from the `Bash` or `PowerShell` call that started it; its end from its task notification, from `TaskStop`, or from the in-flight list a turn's end reports.
- The Subagents from the session's list of agents, polled every 5 seconds.

## How a Collaborator gets it

The shared project settings (`.claude/settings.json`, ADR 0024) declare this repository's marketplace (`.claude-plugin/marketplace.json`) by its GitHub source, `phmilk/reforged-ts` at its default branch, and enable the mod. Claude Code offers it when a Collaborator opens either Board repository, and runs the copy on the default branch: a change reaches Collaborators once merged. The Template carries a copy of the settings and no file of the mod.

By hand, at the prompt of a terminal session:

```text
/plugin install background-band --marketplace phmilk/reforged-ts
```

## Testing it

CI has no Claude CLI, so these run by hand, from the repository root, whenever the mod changes:

```sh
claude plugin validate .claude/mods/background-band
claude plugin test .claude/mods/background-band
```

`claude plugin validate .` checks the marketplace. To try a change in a real session before it is merged, start one with the mod loaded from the working tree:

```sh
claude --plugin-dir .claude/mods/background-band
```

An interactive session loaded that way reloads the mod on each save and lays the API's declarations, which the mod is typed against, in `.claude-plugin/types/`, ignored by git. The workspace's ESLint does not lint the mod, since CI does not have those declarations; Prettier formats its files.
