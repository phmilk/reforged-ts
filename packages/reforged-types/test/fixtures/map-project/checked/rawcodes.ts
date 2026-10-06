// Positive: Rawcodes typed by Object kind, through functions declared here
// (rawcode-natives.ts passes them to the Natives).
declare function takeUnit(id: Rawcode<"unit">): void;
declare function takeItem(id: Rawcode<"item">): void;
declare function takeAbility(id: Rawcode<"ability">): void;
declare function takeBuff(id: Rawcode<"buff">): void;
declare function takeDestructable(id: Rawcode<"destructable">): void;
declare function takeDoodad(id: Rawcode<"doodad">): void;
declare function takeUpgrade(id: Rawcode<"upgrade">): void;
declare function takeTech(id: Rawcode<"unit" | "upgrade">): void;
declare function takeAny(id: Rawcode): void;
declare function unitTypeOf(target: unit): Rawcode<"unit">;

// A FourCC literal into a Rawcode of every kind, a union and any kind.
const literal = FourCC("hfoo");
takeUnit(literal);
takeItem(FourCC("ratc"));
takeAbility(FourCC("AHbz"));
takeBuff(FourCC("BHbz"));
takeDestructable(FourCC("LTlt"));
takeDoodad(FourCC("ZPfw"));
takeUpgrade(FourCC("Rhde"));
takeTech(FourCC("hfoo"));
takeAny(FourCC("hfoo"));

// A returned Rawcode keeps its kind, goes where its kind or any kind is
// expected, and compares with a FourCC literal.
declare const footman: unit;
const returned = unitTypeOf(footman);
takeUnit(returned);
takeTech(returned);
takeAny(returned);
const isFootman: boolean = returned === FourCC("hfoo");

// A Rawcode widens to number.
const asNumber: number = returned;
const next: number = returned + 1;
const positive: boolean = returned > 0;
const formatted: string = string.format("%d", returned);

// A computed number becomes a Rawcode through a cast.
takeUnit((asNumber + 1) as Rawcode<"unit">);

// Arrays and Map keys keep the kind.
const spawns: Rawcode<"unit">[] = [FourCC("hfoo"), FourCC("hkni"), returned];
for (const id of spawns) {
  takeUnit(id);
}
const names = new Map<Rawcode<"unit">, string>([[FourCC("hfoo"), "Footman"]]);
const name: string | undefined = names.get(returned);

export { isFootman, next, positive, formatted, name };
