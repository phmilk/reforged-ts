# Variable: Host

> `const` **Host**: [`HostDetection`](../interfaces/HostDetection.md)

Defined in: [system/host.ts:254](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/host.ts#L254)

Elects one player as the host, the same on every client, so a Map project
can give one player a role without desyncing.

The heuristic: the host created the lobby, so the host's client has sat in
the lobby the longest. Each client measures its own lobby time with
`os.clock`, from `config` to the `gameStart` stage, and the election makes
every measurement known to every client through `SyncRequest`, a local,
asynchronous value made shared through sync (#15, D6 and D9). The longest
time wins and a tie goes to the lowest player index. A player who leaves
before answering is dropped at the leave event; the timeout settles the
election with the times received so far.

It assumes that `config` runs once per client when the map loads in the
lobby and `main` at the game start, and that `os.clock` grows with wall
time while the client sits in the lobby. Neither assumption was measured by
the probe map (#9), so the heuristic is unverified: its verification in the
game is a human step, tracked in its own ticket.

## Example

```ts
// The host gets a dialog the other players do not. Every client runs the
// same code and awaits the same election, so every client agrees on who the
// host is.
import { Host, Init, MapPlayer } from "reforged-ts";

async function greetHost(): Promise<void> {
  try {
    const host = await Host.detectHost({ timeout: 15 });
    if (host === MapPlayer.fromLocal()) {
      print("You are the host.");
    }
  } catch (reason) {
    // No lobby time arrived before the timeout.
    print(String(reason));
  }
}

Init.onGameStart(() => {
  void greetHost();
});
```
