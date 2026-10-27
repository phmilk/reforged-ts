// A background command the session started: its task id, its command line,
// when the band learnt of it and the Subagent that started it, if one did.
export type Shell = {
  id: string;
  command: string;
  startedAt: number;
  agentId?: string;
};

// A Subagent as the last poll saw it: its status and since when it holds it.
export type Seen = { id: string; label: string; status: string; since: number };

declare module "claude-code" {
  interface PluginState {
    "background-band": {
      shells: Shell[];
      agents: Seen[];
      warned: string[];
      now: number;
    };
  }
}
