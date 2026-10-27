// The band's tests, run by hand with `claude plugin test .claude/mods/background-band`
// (README.md): CI has no Claude CLI. Each hook a test registers on `on` stands
// for the engine beneath the mod.
import { expect, mock, test } from "claude-code/testing";
import type { AgentInfo, AgentStatus, On } from "claude-code";

const VIEW = {
  hasSurvey: false,
  isWorking: false,
  maxRows: 20,
  bodyColumns: 80,
  scroll: { offset: 0, bodyRows: 20 },
  view: {},
} as const;

// The band above the prompt, which the terminal and the desktop draw.
const BAND = {
  plugin: "background-band",
  component: "AbovePrompt",
  props: VIEW,
} as const;

// The pane VS Code and the mobile app draw the band in.
const PANE = {
  plugin: "background-band",
  component: "Pane",
  requestId: "background",
  props: {
    title: "Background",
    isFocused: false,
    bodyColumns: 40,
    placement: "inline",
    scroll: { offset: 0, bodyRows: 20 },
    view: {},
  },
} as const;

const STOP = {
  stop_hook_active: false,
  last_assistant_message: "Done.",
  background_tasks: [],
  session_crons: [],
};

// The engine beneath the mod: a session drawn on the terminal with a phone
// attached, its agents `agents`, a background Bash call answered with task
// `b1`, and what draws when the mod passes.
function engine(on: On, agents: () => AgentInfo[] = () => []) {
  const toasts: string[] = [];
  const panes: string[] = [];
  on("session.start", (_, e) => ({ cwd: e.cwd }));
  on("session.surfaces", () => ({ value: ["terminal", "mobile"] }));
  on("agent.list", () => ({ value: agents() }));
  on("ui.open", (_, e) => {
    panes.push(e.id);
    return { value: { isPlaced: true } };
  });
  on("ui.close", (_, e) => {
    panes.splice(panes.indexOf(e.id), 1);
    return { value: undefined };
  });
  on("ui.panes", () => ({
    value: panes.map((id) => ({
      id,
      title: id,
      isShown: true,
      isFocused: false,
      isPlaced: true,
    })),
  }));
  on("ui.toast", (_, e) => {
    toasts.push(e.text);
    return { value: undefined };
  });
  on("tool.call", () => ({
    result: {
      stdout: "",
      stderr: "",
      interrupted: false,
      backgroundTaskId: "b1",
    },
  }));
  on("classic.Stop", () => ({}));
  on("ui.render", ($, e) => {
    const { Text } = $.ui.resolve(e);
    return <Text>engine</Text>;
  });
  return { toasts, panes };
}

test("the band lists a background command on every surface until a turn's end drops it", async ($, on) => {
  mock.clock(on, { now: 1_000_000 });
  const { panes } = engine(on);

  await $.session.start({ cwd: "/", surface: "terminal", isInteractive: true });
  expect(panes).toEqual([]);
  await $.tool.call({
    tool: "Bash",
    command: "pnpm check",
    run_in_background: true,
  });
  // The phone draws no band above the prompt: the band opens a pane there.
  expect(panes).toEqual(["background"]);

  for (const surface of ["terminal", "desktop"] as const) {
    const ui = await $.ui.mount({ ...BAND, surface });
    expect((await ui.find({ type: "Text", text: /pnpm check/ }))?.text).toBe(
      "  command 0m: pnpm check",
    );
    await ui.unmount();
  }
  for (const surface of ["vscode", "mobile"] as const) {
    const ui = await $.ui.mount({ ...PANE, surface });
    expect((await ui.find({ type: "Text", text: /pnpm check/ }))?.text).toBe(
      "  command 0m: pnpm check",
    );
    await ui.unmount();
  }

  await $.classic.Stop(STOP);
  expect(panes).toEqual([]);

  for (const surface of ["terminal", "desktop"] as const) {
    const ui = await $.ui.mount({ ...BAND, surface });
    expect((await ui.find({ type: "Text" }))?.text).toBe("engine");
    await ui.unmount();
  }
});

test("the band lists a Subagent with its status and how long it has held it", async ($, on) => {
  const clock = mock.clock(on, { now: 1_000_000 });
  let status: AgentStatus = "running";
  engine(on, () => [
    {
      id: "a1",
      description: "implement #769",
      type: "general-purpose",
      status,
    },
  ]);

  await $.session.start({ cwd: "/", surface: "terminal", isInteractive: true });
  await clock.advance(3 * 60 * 1000);

  for (const surface of ["terminal", "desktop"] as const) {
    const ui = await $.ui.mount({ ...BAND, surface });
    expect((await ui.find({ type: "Text", text: /implement/ }))?.text).toBe(
      "  agent implement #769: running for 3m",
    );
    await ui.unmount();
  }

  // The next poll sees it idle; two minutes later it has held that for 2m.
  status = "idle";
  await clock.advance(5000);
  await clock.advance(2 * 60 * 1000);

  const ui = await $.ui.mount({ ...PANE, surface: "mobile" });
  expect((await ui.find({ type: "Text", text: /implement/ }))?.text).toBe(
    "  agent implement #769: idle for 2m",
  );
  expect((await ui.find({ type: "Text", text: /background/ }))?.text).toBe(
    "Nothing runs in the background",
  );
  await ui.unmount();
});

test("an item past 15 minutes is drawn in the warning color and raises one toast", async ($, on) => {
  const clock = mock.clock(on, { now: 1_000_000 });
  const { toasts } = engine(on);

  await $.session.start({ cwd: "/", surface: "terminal", isInteractive: true });
  await $.tool.call({
    tool: "Bash",
    command: "pnpm check",
    run_in_background: true,
  });
  await clock.advance(10 * 60 * 1000);

  let ui = await $.ui.mount({ ...BAND, surface: "terminal" });
  expect(
    (await ui.find({ type: "Text", text: /pnpm check/ }))?.props.color,
  ).toBeUndefined();
  await ui.unmount();
  expect(toasts).toEqual([]);

  await clock.advance(10 * 60 * 1000);

  ui = await $.ui.mount({ ...BAND, surface: "terminal" });
  const row = await ui.find({ type: "Text", text: /pnpm check/ });
  expect(row?.text).toBe("  command 20m: pnpm check");
  expect(row?.props.color).toBe("warning");
  await ui.unmount();
  expect(toasts).toEqual(["In the background for over 15m: pnpm check"]);
});

test("the band blocks nothing: a Subagent's background call runs and a waiting stop goes through", async ($, on) => {
  mock.clock(on, { now: 1_000_000 });
  engine(on);

  const ran = await $.tool.call({
    tool: "Bash",
    command: "pnpm check",
    run_in_background: true,
    agentId: "a1",
  });
  expect(ran.isError).toBeFalsy();

  const stopped = await $.classic.Stop({
    ...STOP,
    last_assistant_message:
      "Vou esperar o implementador; ele me avisa quando terminar.",
  });
  expect(stopped.block).toBeUndefined();
  expect(stopped.preventContinuation).toBeUndefined();
});
