/** @noSelfInFile */

// The Init stages as a Map project uses them: `Init.onGlobals`,
// `Init.onTriggers`, `Init.onInitTriggers` and `Init.onGameStart` register a
// callback for the stage after the Blizzard function of that name
// (`InitGlobals`, `InitCustomTriggers`, `RunInitializationTriggers`,
// `MarkGameStarted`); `Init.hasRun` and `Init.current` read where the map's
// initialization stands. Every callback runs under pcall, after the
// library's own callbacks for the stage, in registration order; a failure
// prints one line naming the stage and the callback, and the next callback
// still runs. A callback registered after its stage ran runs at once.

import { currentStage, hasRun, onStage } from "./stages";
import type { InitStage } from "./state";

export type { InitStage } from "./state";

/** The type of `Init`: the four registrars and the two reads. */
export interface InitStages {
  /** Registers `callback` for the `globals` stage, after `InitGlobals`. */
  onGlobals(callback: () => void, label?: string): void;
  /** Registers `callback` for the `triggers` stage, after `InitCustomTriggers`. */
  onTriggers(callback: () => void, label?: string): void;
  /**
   * Registers `callback` for the `initTriggers` stage, after
   * `RunInitializationTriggers`.
   */
  onInitTriggers(callback: () => void, label?: string): void;
  /** Registers `callback` for the `gameStart` stage, after `MarkGameStarted`. */
  onGameStart(callback: () => void, label?: string): void;
  /** Whether `stage` ran: its Blizzard function returned and its callbacks run. */
  hasRun(stage: InitStage): boolean;
  /** The stage running now, or undefined. */
  readonly current: InitStage | undefined;
}

class InitObject implements InitStages {
  public onGlobals(callback: () => void, label?: string): void {
    onStage("globals", "project", callback, label);
  }

  public onTriggers(callback: () => void, label?: string): void {
    onStage("triggers", "project", callback, label);
  }

  public onInitTriggers(callback: () => void, label?: string): void {
    onStage("initTriggers", "project", callback, label);
  }

  public onGameStart(callback: () => void, label?: string): void {
    onStage("gameStart", "project", callback, label);
  }

  public hasRun(stage: InitStage): boolean {
    return hasRun(stage);
  }

  public get current(): InitStage | undefined {
    return currentStage();
  }
}

/** The Init stages: where a Map project registers its initialization. */
export const Init: InitStages = new InitObject();
