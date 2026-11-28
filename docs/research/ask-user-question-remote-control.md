# AskUserQuestion under Remote Control

How a question put with the `AskUserQuestion` tool reaches a Collaborator who follows the session from the Claude app on a phone, researched for #1093 (map #1092). Sources are primary only: Claude Code's documentation at code.claude.com (read as Markdown on 2026-11-28) and its changelog in `anthropics/claude-code` (head at 2.1.332, the version installed on the machine that wrote this note). Each claim is marked **Docs** (stated by the documentation, quoted), **Changelog** (stated by a changelog entry, with its version), **Observed** (seen in this session or in this repository's files) or **Inferred** (follows from the above, stated nowhere). A fact no source settles is listed under [Open facts](#open-facts), for a Collaborator with the phone to check.

## TL;DR

- **Reaches the phone:** yes, as a question the Collaborator answers there. The docs say Remote Control forwards `AskUserQuestion` questions and keeps them open until answered, and that a cloud session's questions are answered from the app. They do not say how the phone draws one: tappable options, the "Other" row, `multiSelect` and `preview` on the phone are open facts.
- **Limits:** 1 to 4 questions per call, 2 to 4 options per question, a `header` of at most 12 characters, an optional `multiSelect`. `preview` exists only when an Agent SDK host turns it on. No documented length limit for a label or a description.
- **Waiting:** without limit. The idle timeout is off by default, and while Remote Control is connected its timer never starts even when set. `dialogExpiry` does not apply to questions. A cloud session waits until its environment expires.
- **Stop hooks meanwhile:** they do not run. A pending question is a tool call inside the turn, and `Stop` runs only when the turn ends (Inferred). `background-wait.mjs` and `ship-stop.mjs` see the turn only after the answer, when it ends.
- **Subagents:** cannot ask. `AskUserQuestion` is removed from every Subagent, foreground or background. Only the main conversation asks. A fork keeps its parent's tool list; what its call does is open.
- **Alerting:** a waiting question pushes to the phone by itself when **Push when actions required** is on and Remote Control is connected. `PushNotification` is a separate tool for pushes Claude decides to send, under **Push when Claude decides**. Both are skipped while the Collaborator is at the terminal.
- **Headless:** `claude -p` offers `AskUserQuestion` only when the run has a permission host (an SDK `canUseTool` callback or `--permission-prompt-tool`). It is removed under `--permission-prompts none` and `denyInsteadOfPrompting`, and denied under `dontAsk`. A `PreToolUse` hook can answer it, or defer it and end the run.

## 1. Rendering on the phone

### Remote Control

- **Docs:** Remote Control "connects claude.ai/code or the Claude app for iOS and Android to a Claude Code session running on your machine", and "A connected device shows the conversation in your terminal as it happens." ([Remote Control](https://code.claude.com/docs/en/remote-control), [What connected devices see](https://code.claude.com/docs/en/remote-control#what-connected-devices-see))
- **Docs:** "Claude Code keeps permission prompts and `AskUserQuestion` questions open until you answer them. When Claude Code forwards another kind of dialog to the remote session, such as the model-choice prompt shown after a safety refusal, it waits five minutes by default, then closes the dialog." ([Remote Control, Limitations](https://code.claude.com/docs/en/remote-control#limitations)) The words "another kind of dialog" place `AskUserQuestion` among the dialogs forwarded to the remote session.
- **Docs:** the push toggle **Push when actions required** is "for permission prompts and questions" ([Mobile push notifications](https://code.claude.com/docs/en/remote-control#mobile-push-notifications)): a question is something the phone is alerted to and answers.
- **Changelog 2.1.301:** "in VS Code and the desktop and mobile apps, a tree drawn above the question dialog can now hold Markdown and up to 48 rows; the terminal keeps 12 plain rows". The mobile app has a question dialog of its own.
- **Changelog 2.1.217:** "Fixed Remote Control sessions not showing a pending permission prompt or dialog to viewers that connected after it appeared". A phone that connects after the question was asked still sees it.
- **Changelog 2.1.332:** "Fixed Remote Control showing a session in the desktop app, VS Code or the Agent SDK as running while it waited there on a dialog or an MCP server's question".
- **Not in any source:** how the phone draws the question. Whether the options are buttons answered with one tap, whether it shows the "Other" free-text row and the notes field, how it handles `multiSelect`, several questions in one call, and `preview`. See [Open facts](#open-facts).

### Cloud sessions

- **Docs:** "Open a session in the app to check progress, answer Claude's questions, or steer it in a new direction." ([Mobile, Start and monitor cloud sessions](https://code.claude.com/docs/en/mobile#start-and-monitor-cloud-sessions))
- **Docs:** "From there you can steer Claude, provide feedback, or answer questions as in any other conversation. If Claude asks a question and the session sits idle, you can still answer when you come back, up to environment expiry, and the session continues from your answer." ([Claude Code on the web](https://code.claude.com/docs/en/claude-code-on-the-web))
- **Changelog 2.1.216:** "Fixed Claude Code on the web re-asking the same question and dropping your answer after the session sat idle for a few minutes".
- The same open facts apply: the docs do not describe the controls the app draws for a cloud session's question.

### In the terminal, for comparison

- **Docs:** "Answer by picking an option, or type your own text through the `Other` row or the notes field." ([AskUserQuestion tool behavior](https://code.claude.com/docs/en/tools-reference#askuserquestion-tool-behavior))
- **Docs:** in agent view, "A question with predefined choices: the panel lists the choices by number." ([Agent view](https://code.claude.com/docs/en/agent-view))

## 2. Limits of AskUserQuestion

- **Docs:** "each `AskUserQuestion` call supports 1-4 questions with 2-4 options each" ([Agent SDK, Handle approvals and user input, Limitations](https://code.claude.com/docs/en/agent-sdk/user-input#limitations)). The hooks reference agrees: "Asks the user one to four multiple-choice questions." ([Hooks, AskUserQuestion](https://code.claude.com/docs/en/hooks#askuserquestion))
- **Docs:** each question has `question` ("The full question text to display"), `header` ("Short label for the question (max 12 characters)"), `options` ("Array of 2-4 choices, each with `label` and `description`. TypeScript: optionally `preview`") and `multiSelect` ("If `true`, users can select multiple options"). ([Question format](https://code.claude.com/docs/en/agent-sdk/user-input#question-format))
- **Docs, answers:** the answer maps each question's text to the chosen label. "Multi-select answers join labels with commas." ([Hooks, AskUserQuestion](https://code.claude.com/docs/en/hooks#askuserquestion)) Free text from an "Other" choice goes in as the answer value, "not the word 'Other'" ([Support free-text input](https://code.claude.com/docs/en/agent-sdk/user-input#support-free-text-input)).
- **Docs, `preview`:** "`toolConfig.askUserQuestion.previewFormat` adds a `preview` field to each option ... Without this setting, Claude does not generate previews and the field is absent." The format is `"markdown"` or `"html"`, TypeScript SDK only. ([Option previews](https://code.claude.com/docs/en/agent-sdk/user-input#option-previews-typescript)) The terminal has a preview mode (**Changelog 2.1.181, 2.1.274** fix "AskUserQuestion preview" display bugs). The docs do not say when an interactive session turns previews on.
- **Not in any source:** a length limit for `question`, `label` or `description`.
- **Docs, permission:** the tools table says `AskUserQuestion` needs no permission ([Tools reference](https://code.claude.com/docs/en/tools-reference)). It is among the "Actions no mode auto-approves", even `bypassPermissions` ([Permission modes](https://code.claude.com/docs/en/permission-modes#actions-no-mode-auto-approves)): a question always waits for a person or a hook.
- **Changelog 2.1.147:** "Fixed auto mode suppressing `AskUserQuestion` when the user or a skill explicitly relies on it". **Changelog 2.1.69:** "Fixed interactive tools (e.g., `AskUserQuestion`) being silently auto-allowed when listed in a skill's allowed-tools, bypassing the permission prompt and running with empty answers". A skill may list it in `allowed-tools`.
- **Changelog 2.1.83 and Docs:** `AskUserQuestion` is disabled when `--channels` is active ([Channels](https://code.claude.com/docs/en/channels) says so for `-p` runs).

## 3. Waiting

### What the session does

- **Docs:** "Questions stay open until you answer them." An idle timeout exists only if `askUserQuestionTimeout` is set to `60s`, `5m` or `10m`. Its default is `"never"`. ([Question auto-continue timeout](https://code.claude.com/docs/en/tools-reference#question-auto-continue-timeout), [`askUserQuestionTimeout`](https://code.claude.com/docs/en/settings-reference#askuserquestiontimeout))
- **Docs:** "The timer never starts for a question Claude asks in a background session, in screen reader mode, or while the session is connected to Remote Control. Those questions wait until you answer them." (same section)
- **Docs:** `dialogExpiry` (default `5m`) bounds other forwarded dialogs, but "Permission prompts and `AskUserQuestion` questions use their own flows and aren't governed by this deadline." ([`dialogExpiry`](https://code.claude.com/docs/en/settings-reference#dialogexpiry))
- **Changelog 2.1.200:** "Changed `AskUserQuestion` dialogs to no longer auto-continue by default".
- **Docs, what ends the wait under Remote Control:** the local process. "If you close the terminal ... or otherwise stop the `claude` process, the session goes offline". In server mode, a network outage makes Claude Code give up "after roughly 10 minutes". An interactive session keeps retrying. ([Remote Control, Limitations](https://code.claude.com/docs/en/remote-control#limitations)) If the machine sleeps, "Claude Code reconnects when the machine comes back online" ([Mobile](https://code.claude.com/docs/en/mobile)).
- **Docs, cloud:** the question can be answered "up to environment expiry". "Cloud sessions stop after a period of inactivity and the session's VM is reclaimed." On reopening, the conversation history is restored. ([Environment expired](https://code.claude.com/docs/en/claude-code-on-the-web#environment-expired)) The page gives no length for the inactivity period. **Changelog 2.1.261** names "a question that was cut off when the cloud session shut down".

### What this repository's Stop hooks see meanwhile

- **Observed:** `.claude/settings.json` runs `background-wait.mjs`, `replaced-skill-stop.mjs` and `ship-stop.mjs` on `Stop`. On `PreToolUse` it runs `background-wait.mjs` with matcher `Bash|PowerShell` and `skill-target.mjs` with matcher `Skill`. No hook matches `AskUserQuestion`, and no `Notification`, `PermissionRequest` or `SubagentStop` hook is registered.
- **Docs:** `Stop` "Runs when the main Claude Code agent has finished responding. Does not run if the stoppage occurred due to a user interrupt." ([Hooks, Stop](https://code.claude.com/docs/en/hooks#stop))
- **Docs:** a pending question sits inside a tool call. Agent view, backgrounding a session: "while a permission prompt or a question Claude asked waits, Claude Code keeps waiting and shows `Still backgrounding after the current tool — a question is waiting for your answer.`" ([Agent view](https://code.claude.com/docs/en/agent-view))
- **Inferred:** while the question waits, the turn has not finished, so no `Stop` runs and neither script runs at all. After the answer, Claude reads the tool's result and goes on. When that turn ends, `Stop` runs as usual and both scripts judge it as they judge any turn.
- **Inferred, `background-wait.mjs`:** at that later `Stop`, it blocks only a last reply that says it waits on background work while `background_tasks` and `session_crons` are empty. A question answered inside the turn changes nothing there. Its `PreToolUse` half only looks at `Bash` and `PowerShell`.
- **Inferred, `ship-stop.mjs`:** at that later `Stop`, it blocks once when an implement ran after the last `/ship-branch`, the branch has commits ahead of the remote default, and there is no pull request or only a draft. A question asked with `AskUserQuestion` mid-implement never meets this check. A question typed as plain text at the end of a turn does: the turn ends, `Stop` runs, and the check can block once (the next stop passes, since `stop_hook_active` is then `true`).
- **Docs, a hook that could see the wait:** a `PreToolUse` or `PermissionRequest` hook with matcher `AskUserQuestion` runs when the question is asked ([Hooks, PreToolUse](https://code.claude.com/docs/en/hooks#pretooluse), [PermissionRequest](https://code.claude.com/docs/en/hooks#permissionrequest)). The `idle_prompt` notification fires "about 60 seconds after Claude finishes responding", so it does not fire for a question inside a turn ([Hooks, Notification](https://code.claude.com/docs/en/hooks#notification)). Whether any `Notification` type fires for a waiting question is open.

## 4. Subagents

- **Docs:** "Subagents inherit the built-in tools and MCP tools available in the main conversation, narrowed by two filters. The first removes a short list of tools from every subagent", "even when listed in the `tools` field". The list includes `AskUserQuestion`. ([Subagents, Available tools](https://code.claude.com/docs/en/sub-agents#available-tools))
- **Docs:** "`AskUserQuestion` is not currently available in subagents spawned via the Agent tool" ([Agent SDK, Limitations](https://code.claude.com/docs/en/agent-sdk/user-input#limitations)).
- **Docs, forks:** "Forks skip both filters and receive their parent conversation's exact tool pool." ([Subagents, Available tools](https://code.claude.com/docs/en/sub-agents#available-tools)) The docs do not say what a fork's `AskUserQuestion` call does, nor where its question would show. Open.
- **Docs, permission prompts are different:** "When a background subagent reaches a tool call that needs permission, Claude Code surfaces the prompt in your main session and names the subagent that is asking." ([Subagents, Run subagents in foreground or background](https://code.claude.com/docs/en/sub-agents#run-subagents-in-foreground-or-background)) A Subagent can wait on a permission prompt, never on a question of its own.
- **Observed:** the general-purpose background Subagent that wrote this note had no `AskUserQuestion` and no `PushNotification` in its tool list.
- **Inferred:** a skill that needs a decision asks it from the main conversation. A Subagent returns what the decision needs in its report, and the main conversation puts the question.

## 5. Alerting the phone

### A waiting question

- **Docs:** `inputNeededNotifEnabled`, shown in `/config` as **Push when actions required**: "Get a push notification on your phone when a permission prompt or question is waiting for your input. In a local session, Claude Code sends these only while Remote Control is connected." Its default is the value saved to the account. ([`inputNeededNotifEnabled`](https://code.claude.com/docs/en/settings-reference#inputneedednotifenabled))
- **Docs, setup:** install the Claude app, sign in with the same account and organization, allow notifications on the phone, then enable the toggle in `/config`. "Beyond the two on/off toggles below, there is no per-event configuration." If `/config` shows **No mobile registered**, open the app so it refreshes its push token. iOS Focus modes and Android battery optimization can delay or suppress pushes. ([Mobile push notifications](https://code.claude.com/docs/en/remote-control#mobile-push-notifications))
- **Docs, presence:** "Claude Code skips mobile push notifications while you are typing in or focused on the connected terminal." `CLAUDE_CLIENT_PRESENCE_FILE` extends that: pushes are skipped while the marker file exists. (same section; [Environment variables](https://code.claude.com/docs/en/env-vars))
- **Docs, cloud:** the setting's text limits Remote Control to local sessions. The docs do not say whether a cloud session sends this push, nor after what delay a push leaves for a question in either case. Open.

### The PushNotification tool

- **Docs:** "Sends a desktop notification from a local session, and a phone push with Remote Control or in a cloud session. Push delivery runs through Anthropic-hosted infrastructure, which is not accessible from Amazon Bedrock, Claude Platform on AWS, Google Cloud's Agent Platform, or Microsoft Foundry". Permission required: no. ([Tools reference](https://code.claude.com/docs/en/tools-reference))
- **Docs:** `agentPushNotifEnabled`, shown in `/config` as **Push when Claude decides**: "Allow Claude to send a push notification to your phone when it decides one is worth sending, for example when a long task finishes. In a local session, Claude can send one while Remote Control is connected." Default: the account's saved value, or `false`. Sessions under a `claude remote-control` server "follow the value saved to your account rather than this key". ([`agentPushNotifEnabled`](https://code.claude.com/docs/en/settings-reference#agentpushnotifenabled))
- **Docs:** "You can also request a push in your prompt, for example `notify me when the tests finish`." ([Mobile push notifications](https://code.claude.com/docs/en/remote-control#mobile-push-notifications))
- **Docs:** by default the tool "skips both the desktop notification and the mobile push when it detects recent keyboard activity or terminal focus"; `CLAUDE_CODE_DISABLE_NOTIFICATION_PRESENCE_CHECK=1` sends the desktop notification anyway. ([Environment variables](https://code.claude.com/docs/en/env-vars))
- **Changelog 2.1.110:** "Added push notification tool — Claude can send mobile push notifications when Remote Control and 'Push when Claude decides' config are enabled". **2.1.318** names a `status` field of the call. **2.1.331:** the tool now tells a headless run "whether a mobile push was requested". **2.1.293, 2.1.295** fix false "Remote Control inactive" or "not sent" reports in `claude remote-control` sessions.
- **Inferred, Subagents:** `PushNotification` is not in the first filter's list, so a foreground Subagent inherits it. It is not in the list a background Subagent keeps, so a background Subagent loses it.
- **Not in any source:** the tool's full input schema (beyond the `status` field the changelog names) and what the push shows on the phone. Whether the tool is offered at all when **Push when Claude decides** is off. Open.
- **Inferred, for a skill's design:** a question asked with `AskUserQuestion` alerts the phone through **Push when actions required**, with no `PushNotification` call. A skill that ends its turn with a decision in plain text instead relies on **Push when Claude decides** and Claude calling `PushNotification`.

## 6. Headless runs

- **Docs:** "`AskUserQuestion` and `ExitPlanMode` require user interaction. In non-interactive mode with the `-p` flag, Claude Code offers them only when the run has a permission host to receive the prompt, such as an Agent SDK `canUseTool` callback." ([Hooks, Tools that require user interaction](https://code.claude.com/docs/en/hooks#tools-that-require-user-interaction)) A plain `claude -p` run has no such host, so Claude is not offered the tool.
- **Docs:** with `--permission-prompts none`, "Claude Code removes the tools that need an answer from a person, such as `AskUserQuestion`, so Claude can't call them." ([Headless, Turn off permission prompts in unattended runs](https://code.claude.com/docs/en/headless#turn-off-permission-prompts-in-unattended-runs)) `permissions.denyInsteadOfPrompting` does the same in every run where it is set ([Settings reference](https://code.claude.com/docs/en/settings-reference#permissions-denyinsteadofprompting)).
- **Docs:** under `dontAsk`, "`AskUserQuestion` ... [is] denied even when an allow rule matches" ([Headless, Auto-approve tools](https://code.claude.com/docs/en/headless#auto-approve-tools)).
- **Docs:** with a permission host and without that flag, "your run waits for that host to answer each permission request" (same page).
- **Docs, answering from a hook:** a `PreToolUse` hook that "Returns `permissionDecision: \"allow\"` together with `updatedInput` that holds the answer" satisfies the tool; it echoes `questions` and adds `answers`. "Returning `\"allow\"` alone is not sufficient for these tools." ([Hooks](https://code.claude.com/docs/en/hooks#tools-that-require-user-interaction); **Changelog 2.1.85**)
- **Docs, deferring:** in `-p` only, a `PreToolUse` hook can return `"defer"`. "The turn ends with a result carrying `stop_reason: \"tool_deferred\"`"; the caller shows the question, then runs `claude -p --resume <session-id>` with the same permission host, and the hook answers with `"allow"` and `updatedInput`. "There is no timeout or retry limit." The session stays until the retention sweep, 30 days by default. ([Defer a tool call for later](https://code.claude.com/docs/en/hooks#defer-a-tool-call-for-later))
- **Changelog 2.1.321:** "Changed `AskUserQuestion` in `claude -p` and SDK sessions to deny a host's permission answer that sets the undocumented `afkTimeoutMs` input field".
- **Inferred:** a skill that may run headless needs a path without the question: a default it states, or a stop that reports the decision it needs.

## Open facts

For a Collaborator with the phone and a Remote Control session (and, where marked, a cloud session) to check. None is settled by the sources above.

1. **Tappable options:** whether the Claude app draws each option of an `AskUserQuestion` question as a control answered with one tap, under Remote Control and in a cloud session.
2. **"Other" and notes:** whether the phone offers the "Other" free-text answer and the notes field, and whether a typed message sent while the question waits answers it or queues as a new prompt.
3. **Several questions and `multiSelect`:** how the phone shows 2 to 4 questions in one call, and whether it lets several options be picked for a `multiSelect` question.
4. **`preview`:** whether an interactive session ever sends option previews, and how the phone shows one.
5. **Lengths:** what the phone does with a long `question`, `label` or `description` (cut, wrapped), since no limit is documented beyond the 12-character `header`.
6. **Push for a question:** whether **Push when actions required** pushes for an `AskUserQuestion` question as it does for a permission prompt, after what delay, what the push says, and whether a cloud session sends it too.
7. **`PushNotification`:** its full input, what the phone shows for it, and whether Claude is offered the tool when **Push when Claude decides** is off.
8. **Forks:** what an `AskUserQuestion` call from a fork does, and where its question shows.
9. **Notification hooks:** whether a waiting `AskUserQuestion` question fires any `Notification` hook type.
10. **Cloud expiry:** how long a cloud session waits on a question before its environment expires, and whether the question is still answerable after the session is reopened.

## Sources

Claude Code documentation, read 2026-11-28:

- [Remote Control](https://code.claude.com/docs/en/remote-control): What connected devices see, Mobile push notifications, Limitations.
- [Claude Code on mobile](https://code.claude.com/docs/en/mobile)
- [Use Claude Code in the cloud](https://code.claude.com/docs/en/claude-code-on-the-web): answering questions, Environment expired.
- [Tools reference](https://code.claude.com/docs/en/tools-reference): the tools table, AskUserQuestion tool behavior, Question auto-continue timeout.
- [Agent SDK, Handle approvals and user input](https://code.claude.com/docs/en/agent-sdk/user-input): Question format, Option previews, Response format, Limitations.
- [Hooks reference](https://code.claude.com/docs/en/hooks): PreToolUse (AskUserQuestion input), Tools that require user interaction, Defer a tool call for later, PermissionRequest, Notification, Stop.
- [Subagents](https://code.claude.com/docs/en/sub-agents): Available tools, Run subagents in foreground or background, Fork the current conversation.
- [Run Claude Code programmatically](https://code.claude.com/docs/en/headless): Auto-approve tools, Turn off permission prompts in unattended runs.
- [Settings reference](https://code.claude.com/docs/en/settings-reference): `askUserQuestionTimeout`, `dialogExpiry`, `agentPushNotifEnabled`, `inputNeededNotifEnabled`, `permissions.denyInsteadOfPrompting`.
- [Environment variables](https://code.claude.com/docs/en/env-vars): `CLAUDE_CLIENT_PRESENCE_FILE`, `CLAUDE_CODE_DISABLE_NOTIFICATION_PRESENCE_CHECK`.
- [Permission modes](https://code.claude.com/docs/en/permission-modes): Actions no mode auto-approves.
- [Agent view](https://code.claude.com/docs/en/agent-view): the peek panel and backgrounding while a question waits.
- [Channels](https://code.claude.com/docs/en/channels): tools disabled with `-p`.

Changelog: [anthropics/claude-code CHANGELOG.md](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md), entries of 2.1.69, 2.1.83, 2.1.85, 2.1.110, 2.1.147, 2.1.181, 2.1.200, 2.1.216, 2.1.217, 2.1.261, 2.1.274, 2.1.293, 2.1.295, 2.1.301, 2.1.318, 2.1.321, 2.1.331 and 2.1.332.

This repository: `.claude/settings.json`, `.claude/hooks/background-wait.mjs`, `.claude/hooks/ship-stop.mjs`.
