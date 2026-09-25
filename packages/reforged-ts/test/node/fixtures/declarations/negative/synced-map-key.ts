// A SyncedMap is keyed by a value Lua can index a table with: nil is not one.
import { SyncedMap } from "reforged-ts";

const map = new SyncedMap<undefined, number>(); // error TS2344

export { map };
