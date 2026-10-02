// Every member of `OrderId` against the game's table of order ids (#322): a
// member whose doc comment names an order string holds the id the table
// gives that string, and a member without one holds an id the table gives
// some order, or is listed below with the reason it is kept. The table is
// UjAPI's, vendored under data/orders/ (PROVENANCE.md there). Lint's
// no-duplicate-enum-values catches a wrong value only when it repeats
// another member's; this catches any.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as ts from "typescript";
import { describe, expect, it } from "vitest";
import { packageRoot } from "./support/package-root";

/** One member of `OrderId`: its name, its id and the order string its doc comment names, if any. */
interface OrderMember {
  name: string;
  id: number;
  orderString?: string;
}

/** The game's table: each order string's id, and each id's order strings. */
interface OrderTable {
  idOf: ReadonlyMap<string, number>;
  stringsOf: ReadonlyMap<number, readonly string[]>;
}

/**
 * The members `OrderId` keeps although the table gives their id to no
 * order, by name, each with the reason. Their doc comments say so too.
 */
const UNCONFIRMED: Readonly<Record<string, string>> = {
  Instant1: "copied from w3ts; no order table names its id",
  Instant2: "copied from w3ts; no order table names its id",
  Instant4: "copied from w3ts; no order table names its id",
};

/** The doc comment's sentence that names a member's order string. */
const ORDER_STRING = /The id of the `([^`]+)` order/;

/** The members of the `OrderId` enum in `source`, in order. */
function orderMembers(source: string): OrderMember[] {
  const file = ts.createSourceFile(
    "order.ts",
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  const enumDeclaration = file.statements.find(
    (statement): statement is ts.EnumDeclaration =>
      ts.isEnumDeclaration(statement) && statement.name.text === "OrderId",
  );
  if (enumDeclaration === undefined) throw new Error("OrderId not found");
  return enumDeclaration.members.map((member) => {
    const name = member.name.getText(file);
    const { initializer } = member;
    if (initializer === undefined || !ts.isNumericLiteral(initializer)) {
      throw new Error(`OrderId.${name} has no numeric literal value`);
    }
    const docs = ts
      .getJSDocCommentsAndTags(member)
      .map((doc) => doc.getText(file))
      .join("\n");
    const orderString = ORDER_STRING.exec(docs)?.[1];
    return {
      name,
      id: Number(initializer.text),
      ...(orderString !== undefined && { orderString }),
    };
  });
}

/** The table in the text of UjAPI's `WC3OrdersList.txt`: its `<string> = <id>,` lines. */
function orderTable(text: string): OrderTable {
  const idOf = new Map<string, number>();
  const stringsOf = new Map<number, string[]>();
  for (const [, orderString = "", id = ""] of text.matchAll(
    /^\s*(\w+)\s*=\s*(\d+),?\s*$/gm,
  )) {
    idOf.set(orderString, Number(id));
    stringsOf.set(Number(id), [
      ...(stringsOf.get(Number(id)) ?? []),
      orderString,
    ]);
  }
  return { idOf, stringsOf };
}

/** What is wrong with each member against `table`, one line each; empty when nothing is. */
function mismatches(
  members: readonly OrderMember[],
  table: OrderTable,
  unconfirmed: Readonly<Record<string, string>>,
): string[] {
  const found: string[] = [];
  for (const { name, id, orderString } of members) {
    if (orderString !== undefined) {
      const tableId = table.idOf.get(orderString);
      if (tableId === undefined) {
        found.push(
          `OrderId.${name} is ${String(id)}, but the table has no order "${orderString}".`,
        );
      } else if (tableId !== id) {
        found.push(
          `OrderId.${name} is ${String(id)}, but the table gives "${orderString}" the id ${String(tableId)}.`,
        );
      }
    } else if (!table.stringsOf.has(id) && !(name in unconfirmed)) {
      found.push(
        `OrderId.${name} names no order string, and the table gives its id ${String(id)} to no order: list it as unconfirmed, with a reason, or fix it.`,
      );
    }
  }
  return found;
}

const members = orderMembers(
  readFileSync(join(packageRoot, "src", "globals", "order.ts"), "utf8"),
);
const table = orderTable(
  readFileSync(
    join(packageRoot, "test", "node", "data", "orders", "WC3OrdersList.txt"),
    "utf8",
  ),
);

describe("OrderId against the game's table of order ids", () => {
  it("reads every member, and the order string of each that names one", () => {
    expect(members.length).toBe(368);
    expect(members.filter((member) => member.orderString).length).toBe(348);
    expect(members.find((member) => member.name === "Aimove")).toEqual({
      name: "Aimove",
      id: 851988,
      orderString: "AImove",
    });
  });

  it("holds the table's id for every member, or lists it as unconfirmed", () => {
    expect(mismatches(members, table, UNCONFIRMED)).toEqual([]);
  });

  it("lists as unconfirmed only members the table does not confirm", () => {
    for (const name of Object.keys(UNCONFIRMED)) {
      const member = members.find((candidate) => candidate.name === name);
      expect(member?.orderString).toBeUndefined();
      expect(table.stringsOf.has(member?.id ?? 0)).toBe(false);
    }
  });

  it("names the member, its id and the table's id when a value is off by one", () => {
    const attack = { name: "Attack", id: 851984, orderString: "attack" };
    expect(mismatches([attack], table, {})).toEqual([
      `OrderId.Attack is 851984, but the table gives "attack" the id 851983.`,
    ]);
  });

  it("names a member without an order string whose id the table gives to no order", () => {
    expect(mismatches([{ name: "Moveslot1", id: 1 }], table, {})).toEqual([
      "OrderId.Moveslot1 names no order string, and the table gives its id 1 to no order: list it as unconfirmed, with a reason, or fix it.",
    ]);
    expect(
      mismatches([{ name: "Instant1", id: 851991 }], table, {}),
    ).toHaveLength(1);
  });
});
