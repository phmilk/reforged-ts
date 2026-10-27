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

import type { Seen, Shell } from "../types";

const shells = atom({ plugin: "background-band", key: "shells" } as const, []);
const agents = atom({ plugin: "background-band", key: "agents" } as const, []);
const warned = atom({ plugin: "background-band", key: "warned" } as const, []);
const now = atom({ plugin: "background-band", key: "now" } as const, 0);

// Past this, a background command or a running Subagent is flagged once.
const LONG_MS = 15 * 60 * 1000;
const POLL_MS = 5000;
// The statuses of a Subagent that still works, and those the band lists.
const ACTIVE = ["pending", "running", "waiting"];
const SHOWN = [...ACTIVE, "idle"];
// The pane that carries the band where no band is drawn above the prompt:
// this build raises `AbovePrompt` on the terminal and the desktop alone.
const PANE = "background";
const PANE_SURFACES = ["vscode", "mobile"];

const minutes = (ms: number) =>
  `${String(Math.max(0, Math.floor(ms / 60000)))}m`;

const labelOf = (agent: AgentInfo) =>
  agent.name ?? (agent.description || agent.type);

// What the band lists: the background commands, and the Subagents the last
// poll saw.
async function items($: EngineInterface) {
  return { list: await read($, shells), seen: await read($, agents) };
}

// Opens the pane where a surface that draws no band is attached and something
// runs, and closes it when nothing does.
async function syncPane($: EngineInterface) {
  const { list, seen } = await items($);
  const isOpen = (await $.ui.panes()).some((pane) => pane.id === PANE);
  const wanted =
    list.length + seen.length > 0 &&
    (await $.session.surfaces()).some((surface) =>
      PANE_SURFACES.includes(surface),
    );
  if (wanted && !isOpen) {
    await $.ui.open({ id: PANE, title: "Background" });
  } else if (!wanted && isOpen) {
    await $.ui.close({ id: PANE });
  }
}

// At a turn's end the engine lists what is really in flight: keep only those
// shells, adding any the band had not seen start.
async function settle(
  $: EngineInterface,
  inFlight: readonly { id: string; type: string; command?: string }[],
) {
  const at = await $.clock.now();
  const live = inFlight.filter((task) => task.type === "shell");
  await update($, shells, (list) => [
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
      .filter((agent) => SHOWN.includes(agent.status))
      .map((agent): Seen => {
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

  const { list: running, seen } = await items($);
  const long = [
    ...running.map((one) => ({
      id: one.id,
      what: one.command,
      since: one.startedAt,
    })),
    ...seen
      .filter((one) => ACTIVE.includes(one.status))
      .map((one) => ({ id: one.id, what: one.label, since: one.since })),
  ].filter((one) => at - one.since > LONG_MS);
  const told = await read($, warned);
  const fresh = long.filter((one) => !told.includes(one.id));
  if (fresh.length > 0) {
    $.ui.toast(
      `In the background for over ${minutes(LONG_MS)}: ${fresh.map((one) => one.what.slice(0, 40)).join(", ")}`,
    );
    await update($, warned, (ids) =>
      [...ids, ...fresh.map((one) => one.id)].slice(-100),
    );
  }
  await syncPane($);
}

// The band's tree, or undefined when nothing is listed. Reads state only.
async function band($: EngineInterface, e: RenderInput, columns: number) {
  const { list, seen } = await items($);
  if (list.length === 0 && seen.length === 0) {
    return undefined;
  }

  const at = Math.max(await read($, now), ...list.map((one) => one.startedAt));
  const { Box, Text } = $.ui.resolve(e);
  const running =
    list.length + seen.filter((one) => ACTIVE.includes(one.status)).length;
  const width = Math.max(20, columns - 20);

  return (
    <Box flexDirection="column">
      <Text bold dimColor={running === 0}>
        {running > 0
          ? `${String(running)} in the background`
          : "Nothing runs in the background"}
      </Text>
      {list.map((one) => {
        const age = at - one.startedAt;
        return (
          <Text color={age > LONG_MS ? "warning" : undefined}>
            {`  command ${minutes(age)}: ${one.command.replace(/\s+/g, " ").slice(0, width)}`}
          </Text>
        );
      })}
      {seen.map((one) => {
        const age = at - one.since;
        const isActive = ACTIVE.includes(one.status);
        return (
          <Text
            dimColor={!isActive}
            color={isActive && age > LONG_MS ? "warning" : undefined}
          >
            {`  agent ${one.label.slice(0, 40)}: ${one.status} for ${minutes(age)}`}
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
      await update($, shells, (list) => [
        ...list.filter((one) => one.id !== id),
        shell,
      ]);
      await syncPane($);
    }
    return ran;
  }).catch(($, e, next) => next(e));

  on("tool.call", { tool: "TaskStop" }, async ($, e, next) => {
    const ran = await next(e);
    const id = (ran.result as { task_id?: string } | undefined)?.task_id;
    if (id !== undefined) {
      await update($, shells, (list) => list.filter((one) => one.id !== id));
      await syncPane($);
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
        await update($, shells, (list) =>
          list.filter((one) => !ended.includes(one.id)),
        );
        await syncPane($);
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
      await syncPane($);
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
