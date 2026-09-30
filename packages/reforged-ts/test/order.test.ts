/** @noSelfInFile */

// The OrderId members that held the id of another order (#255): each now
// holds the game's id, and the orders they were confused with keep theirs.

import { describe, expect, it } from "reforged-test/lua";
import { OrderId } from "../src/globals/order";

describe("OrderId", () => {
  it("gives battleroar and battlestations their own ids", () => {
    expect<number>(OrderId.Battleroar).toEqual(852599);
    expect<number>(OrderId.Battlestations).toEqual(852099);
  });

  it("gives forkedlightning and elementalfury their own ids", () => {
    expect<number>(OrderId.Forkedlightning).toEqual(852587);
    expect<number>(OrderId.Elementalfury).toEqual(852586);
  });
});
