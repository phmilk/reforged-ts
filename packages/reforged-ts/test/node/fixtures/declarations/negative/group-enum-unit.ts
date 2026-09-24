// Group's enumeration accessors are gone: Unit.fromEnum and Unit.fromFilter
// are the one name for each Native.
import { Group } from "reforged-ts";

export function enumerate(): void {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- Negative: the member does not exist, so its type does not resolve
  Group.getEnumUnit(); // error TS2339
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- Negative: the member does not exist, so its type does not resolve
  Group.getFilterUnit(); // error TS2339
}
