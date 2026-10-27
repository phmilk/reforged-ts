// The band of background work (#769): what runs in the background of the
// session, above the prompt. It only shows: no hook here denies a call or
// blocks a stop, and no drawing hook writes state. The shared settings' command
// hooks are what stop an empty wait (#768).
import { atom, read, update } from "claude-code";
import type {
  AgentInfo,
  EngineInterface,
  RenderInput,
  Register,
} from "claude-code";

import type { PolledAgent, Shell } from "../types";

// The mod's state, one value per key of its contract (types/index.d.ts). The
// plugin's name is written out in each: the engine reads every state reference
// off the source before the module runs, and takes only string literals there
// (`claude plugin validate` refuses a constant or a helper).
const shells = atom({ plugin: "background-band", key: "shells" } as const, []);
const agents = atom({ plugin: "background-band", key: "agents" } as const, []);
const warned = atom({ plugin: "background-band", key: "warned" } as const, []);
const now = atom({ plugin: "background-band", key: "now" } as const, 0);

// Past this, a background command or a working Subagent is flagged once.
const LONG_MS = 15 * 60 * 1000;
const POLL_MS = 5000;
// The statuses of a Subagent that still works, and those the band lists: an
// idle Subagent stays listed, dimmed, so that it stands out.
const WORKING = ["pending", "running", "waiting"];
const LISTED = [...WORKING, "idle"];
// The pane that carries the band where no band is drawn above the prompt:
// this build raises `AbovePrompt` on the terminal and the desktop alone.
const PANE = "background";
const PANE_SURFACES = ["vscode", "mobile"];
// The most of a command line or a Subagent's label a toast or a row names.
const LABEL_CHARS = 40;

const minutes = (ms: number) =>
  `${String(Math.max(0, Math.floor(ms / 60000)))}m`;

const short = (text: string) => text.slice(0, LABEL_CHARS);

const isWorking = (agent: { status: string }) => WORKING.includes(agent.status);

const labelOf = (agent: AgentInfo) =>
  agent.name ?? (agent.description || agent.type);

// What the band lists: the background commands, and the Subagents the last
// poll saw. The band is empty when both are.
async function listed($: EngineInterface) {
  return { commands: await read($, shells), polled: await read($, agents) };
}

// Opens the pane where a surface that draws no band is attached and the band
// lists something, and closes it when it lists nothing.
async function syncPane($: EngineInterface) {
  const { commands, polled } = await listed($);
  const isOpen = (await $.ui.panes()).some((pane) => pane.id === PANE);
  const wanted =
    commands.length + polled.length > 0 &&
    (await $.session.surfaces()).some((surface) =>
      PANE_SURFACES.includes(surface),
    );
  if (wanted && !isOpen) {
    await $.ui.open({ id: PANE, title: "Background" });
  } else if (!wanted && isOpen) {
    await $.ui.close({ id: PANE });
  }
}

// Changes the background commands, then the pane to match.
async function updateShells(
  $: EngineInterface,
  change: (list: readonly Shell[]) => Shell[],
) {
  await update($, shells, change);
  await syncPane($);
}

// At a turn's end the engine lists what is really in flight: keep only those
// shells, adding any the band had not seen start.
async function settle(
  $: EngineInterface,
  inFlight: readonly { id: string; type: string; command?: string }[],
) {
  const at = await $.clock.now();
  const live = inFlight.filter((task) => task.type === "shell");
  await updateShells($, (list) => [
    ...list.filter((one) => live.some((task) => task.id === one.id)),
    ...live
      .filter((task) => !list.some((one) => one.id === task.id))
      .map((task): Shell => ({
        id: task.id,
        command: task.command ?? task.id,
        startedAt: at,
      })),
  ]);
}

// Polls the session's Subagents, moves the band's clock, and raises one toast
// for each item that has just passed 15 minutes.
async function poll($: EngineInterface) {
  const at = await $.clock.now();
  const list = await $.agent.list();
  await update($, agents, (old) =>
    list
      .filter((agent) => LISTED.includes(agent.status))
      .map((agent): PolledAgent => {
        const was = old.find((one) => one.id === agent.id);
        const since = was && was.status === agent.status ? was.since : at;
        return {
          id: agent.id,
          label: labelOf(agent),
          status: agent.status,
          since,
        };
      }),
  );
  await update($, now, () => at);

  const { commands, polled } = await listed($);
  const long = [
    ...commands.map((one) => ({
      id: one.id,
      what: one.command,
      since: one.startedAt,
    })),
    ...polled
      .filter(isWorking)
      .map((one) => ({ id: one.id, what: one.label, since: one.since })),
  ].filter((one) => at - one.since > LONG_MS);
  const told = await read($, warned);
  const fresh = long.filter((one) => !told.includes(one.id));
  if (fresh.length > 0) {
    $.ui.toast(
      `In the background for over ${minutes(LONG_MS)}: ${fresh.map((one) => short(one.what)).join(", ")}`,
    );
    await update($, warned, (ids) =>
      [...ids, ...fresh.map((one) => one.id)].slice(-100),
    );
  }
  await syncPane($);
}

// The band's tree, or undefined when it lists nothing: no background command
// and no Subagent pending, running, waiting or idle. With idle Subagents alone
// it says that nothing runs, above their dimmed rows. Reads state only.
async function band($: EngineInterface, e: RenderInput, columns: number) {
  const { commands, polled } = await listed($);
  if (commands.length === 0 && polled.length === 0) {
    return undefined;
  }

  const at = Math.max(
    await read($, now),
    ...commands.map((one) => one.startedAt),
  );
  const { Box, Text } = $.ui.resolve(e);
  const runCount = commands.length + polled.filter(isWorking).length;
  const width = Math.max(20, columns - 20);

  return (
    <Box flexDirection="column">
      <Text bold dimColor={runCount === 0}>
        {runCount > 0
          ? `${String(runCount)} in the background`
          : "Nothing runs in the background"}
      </Text>
      {commands.map((one) => {
        const age = at - one.startedAt;
        return (
          <Text color={age > LONG_MS ? "warning" : undefined}>
            {`  command ${minutes(age)}: ${one.command.replace(/\s+/g, " ").slice(0, width)}`}
          </Text>
        );
      })}
      {polled.map((one) => {
        const age = at - one.since;
        const working = isWorking(one);
        return (
          <Text
            dimColor={!working}
            color={working && age > LONG_MS ? "warning" : undefined}
          >
            {`  agent ${short(one.label)}: ${one.status} for ${minutes(age)}`}
          </Text>
        );
      })}
    </Box>
  );
}

// Each hook at a site that could refuse ends in a .catch that passes: one that
// fails passes the event on, and where it had called next, next replays what
// that call settled to. The band refuses nothing.
export const register: Register = (on) => {
  on("session.start", async ($, e, next) => {
    $.clock.every(POLL_MS, () => poll($));
    const started = await next(e);
    await poll($);
    return started;
  });

  on("session.attach", async ($, e, next) => {
    const attached = await next(e);
    await syncPane($);
    return attached;
  });

  on("tool.call", { tool: ["Bash", "PowerShell"] }, async ($, e, next) => {
    const ran = await next(e);
    const id = (ran.result as { backgroundTaskId?: string } | undefined)
      ?.backgroundTaskId;
    if (id !== undefined) {
      const startedAt = await $.clock.now();
      const shell: Shell = {
        id,
        command: e.command,
        startedAt,
        agentId: e.agentId,
      };
      await updateShells($, (list) => [
        ...list.filter((one) => one.id !== id),
        shell,
      ]);
    }
    return ran;
  }).catch(($, e, next) => next(e));

  on("tool.call", { tool: "TaskStop" }, async ($, e, next) => {
    const ran = await next(e);
    const id = (ran.result as { task_id?: string } | undefined)?.task_id;
    if (id !== undefined) {
      await updateShells($, (list) => list.filter((one) => one.id !== id));
    }
    return ran;
  }).catch(($, e, next) => next(e));

  // A background task's notification turn names the task that ended.
  on("prompt.submit", async ($, e, next) => {
    if (e.origin.kind === "task-notification") {
      const ended = [...e.text.matchAll(/<task-id>([^<]+)<\/task-id>/g)].map(
        (match) => match[1],
      );
      if (ended.length > 0) {
        await updateShells($, (list) =>
          list.filter((one) => !ended.includes(one.id)),
        );
      }
    }
    return next(e);
  }).catch(($, e, next) => next(e));

  // A turn's end lists what is in flight. The band only reads it: the stop's
  // result is the one beneath, untouched.
  on("classic.Stop", async ($, e, next) => {
    const stopped = await next(e);
    if (e.background_tasks !== undefined) {
      await settle($, e.background_tasks);
    }
    return stopped;
  }).catch(($, e, next) => next(e));

  on("ui.render", { component: "AbovePrompt" }, async ($, e, next) => {
    if (e.props.hasSurvey) {
      return next(e);
    }
    return (await band($, e, e.props.bodyColumns)) ?? next(e);
  });

  on("ui.render", { component: "Pane", requestId: PANE }, async ($, e) => {
    const tree = await band($, e, e.props.bodyColumns);
    if (tree !== undefined) {
      return tree;
    }
    const { Text } = $.ui.resolve(e);
    return <Text dimColor>Nothing runs in the background</Text>;
  });
};
