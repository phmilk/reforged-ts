/** @noSelfInFile */

// A class whose public member has no doc comment, and whose private and
// protected ones have none either: only the public one is reported.

/** A counter. */
export class Counter {
  private count = 0;

  /** Adds one to the count. */
  public increment(): void {
    this.add(1);
  }

  public get value(): number {
    return this.count;
  }

  protected reset(): void {
    this.count = 0;
  }

  private add(amount: number): void {
    this.count += amount;
  }
}
