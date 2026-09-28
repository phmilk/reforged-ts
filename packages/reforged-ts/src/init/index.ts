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

/**
 * The type of {@link Init}: the four registrars and the two reads.
 * @remarks
 * Every callback runs under pcall, after the library's own callbacks for the
 * stage, in registration order. A failure prints one line naming the stage
 * and the callback, such as
 * `reforged-ts: globals callback "spawn" failed: <message>`, and the next
 * callback still runs. A callback registered after its stage ran runs at
 * once.
 */
export interface InitStages {
  /**
   * Registers `callback` for the `globals` stage, right after `InitGlobals`:
   * the first moment to create Handles, with `Players` filled.
   * @param callback - The function the stage runs once, under pcall.
   * @param label - Its name in a failure line; its ordinal in the stage,
   * `#n`, when left out.
   */
  onGlobals(callback: () => void, label?: string): void;
  /**
   * Registers `callback` for the `triggers` stage, after
   * `InitCustomTriggers` created the editor's triggers.
   * @param callback - The function the stage runs once, under pcall.
   * @param label - Its name in a failure line; its ordinal in the stage,
   * `#n`, when left out.
   */
  onTriggers(callback: () => void, label?: string): void;
  /**
   * Registers `callback` for the `initTriggers` stage, after
   * `RunInitializationTriggers`: the end of `main`.
   * @param callback - The function the stage runs once, under pcall.
   * @param label - Its name in a failure line; its ordinal in the stage,
   * `#n`, when left out.
   */
  onInitTriggers(callback: () => void, label?: string): void;
  /**
   * Registers `callback` for the `gameStart` stage, after `MarkGameStarted`:
   * the game has started, and Timers tick.
   * @param callback - The function the stage runs once, under pcall.
   * @param label - Its name in a failure line; its ordinal in the stage,
   * `#n`, when left out.
   */
  onGameStart(callback: () => void, label?: string): void;
  /**
   * Tells whether `stage` ran.
   * @param stage - The stage to ask about.
   * @returns True once its Blizzard function returned and its callbacks
   * began: already true inside one of the stage's own callbacks, where
   * `current` names the stage.
   */
  hasRun(stage: InitStage): boolean;
  /**
   * The stage whose run is in progress, or undefined between stages and
   * once all ran. A callback registered after its stage ran runs at once,
   * and that immediate run does not change it.
   */
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

/**
 * The Init stages: where a Map project registers its initialization, each
 * stage right after one of the Blizzard functions the editor's `main` calls.
 * @example
 * {@includeCode ../../examples/harness/init-stages.ts}
 */
export const Init: InitStages = new InitObject();
