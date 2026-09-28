// A group made by a Native call outside the library, wrapped afterwards: the
// same Handle always gives the same Wrapper, so either path reaches it.
import { Group, Init } from "reforged-ts";

Init.onTriggers(() => {
  const raw = CreateGroup();
  const group = Group.fromHandle(raw);
  if (group !== undefined && Group.fromHandle(raw) === group) {
    print(`Group ${String(group.id)} wraps the Handle once`);
  }
});
