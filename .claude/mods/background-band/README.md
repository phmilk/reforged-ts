# background-band

A Claude Code mod (a plugin with a hooks module) that shows what runs in the background of a session: each background command with its age, and each Subagent with its status and how long it has held it. An item past 15 minutes is drawn in the warning color and raises one toast. An idle Subagent stays listed, dimmed, under the line "Nothing runs in the background" when nothing else is listed. The band is empty, and draws nothing, when it lists no background command and no Subagent that is pending, running, waiting or idle.

It only shows. No hook of the mod denies a call or blocks a stop, and no drawing hook writes state: stopping an Agent that waits on nothing is the work of the command hooks in the shared settings (#768), which keep working where the mod does not load.

## Where it draws

- The terminal and the desktop: a band above the prompt (`AbovePrompt`).
- VS Code and the mobile app, which Claude Code 2.1.311 does not draw that band on: a pane titled "Background", opened while one of them is attached and the band lists something, and closed when it lists nothing.

## What it reads

- A background command from the `Bash` or `PowerShell` call that started it; its end from its task notification, from `TaskStop`, or from the in-flight list a turn's end reports.
- The Subagents from the session's list of agents, polled every 5 seconds.

## How a Collaborator gets it

The shared project settings (`.claude/settings.json`) declare this repository's marketplace (`.claude-plugin/marketplace.json`) by its GitHub source, `phmilk/reforged-ts` at its default branch, and enable the mod. Claude Code offers it when a Collaborator opens either Board repository, and runs the copy on the default branch: a change reaches Collaborators once merged. The Template carries a copy of those settings, as ADR 0024 has it for every shared file, but no file of the mod: the mod is the one shared item that is not copied, by the decision of #767, so the Template runs the library's copy.

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
