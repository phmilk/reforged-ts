# no-self-recursion

Reports a function that calls itself by name in its own body: a function declaration, a function expression, an arrow bound by `const`, or a method through `this` (or its class, for a static method). A warning in the recommended config; the replacement is a loop, or a depth bound the author has checked.

## Why

Pitfall C6 of the catalogue (#15). Lua has no operation limit, but "having too many function calls waiting on the stack can lead to a stack overflow" ([A comprehensive guide to mapping in Lua](https://www.hiveworkshop.com/threads/a-comprehensive-guide-to-mapping-in-lua.341880/), "Recursion"). Stock Lua 5.3 stops at 200 nested C calls ("C stack overflow", `LUAI_MAXCCALLS` in `llimits.h`) and at 1,000,000 stack slots ("stack overflow", `LUAI_MAXSTACK` in `luaconf.h`) ([Lua 5.3 source](https://github.com/lua/lua/tree/v5.3)). Whether the game's build of Lua changes these limits is not verified, so the depth at which a recursive function kills its thread in the game is unknown. The error ends the thread, which in a callback means the rest of the callback never runs.

The rule reports direct self-recursion only. A call from a nested function (a callback, a timer) belongs to that function and is not reported, nor is mutual recursion between two functions. The callee must resolve to the function's own binding: a parameter or a local of the same name is not the function.

## Incorrect

```ts
function countDescendants(node: TreeNode): number {
  let total = 0;
  for (const child of node.children) {
    total += 1 + countDescendants(child); // depth unbounded
  }
  return total;
}
```

## Correct

```ts
function countDescendants(root: TreeNode): number {
  let total = 0;
  const pending = [...root.children];
  while (pending.length > 0) {
    const node = pending.pop()!;
    total += 1;
    pending.push(...node.children);
  }
  return total;
}
```

## Options

None.

## Suggestions and fixes

None: turning recursion into a loop restructures the function.

## When not to use it

When the depth is small and bounded by the data, such as a menu of at most three levels. Silence that one line and say why:

```ts
// eslint-disable-next-line reforged/no-self-recursion -- the frame tree is at most four levels deep
hideAll(child);
```
