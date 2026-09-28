/**
 * A unit of the game.
 * @native unit
 */
export class Unit {
  constructor(private readonly unitName: string) {}

  /**
   * The unit's name.
   * @native GetUnitName
   */
  get name(): string {
    return this.unitName;
  }

  /**
   * Kills the unit, then waits.
   * @native KillUnit
   * @native PolledWait
   */
  kill(): void {
    // Nothing to kill in a fixture.
  }
}

/**
 * The number of player slots.
 * @native bj_MAX_PLAYERS
 */
export const maxPlayers = 28;
