// Compiled with typescript-to-lua for Lua 5.3: the Rawcode types emit
// nothing, neither the brand nor the cast.
const footman: Rawcode<"unit"> = FourCC("hfoo");
const knight = (footman + 1) as Rawcode<"unit">;
const spawns: Rawcode<"unit">[] = [footman, knight];
print(string.format("%d", spawns[1]));

export {};
