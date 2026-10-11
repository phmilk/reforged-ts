# Variable: Host

> `const` **Host**: [`HostDetection`](../interfaces/HostDetection.md)

Defined in: [system/host.ts:258](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/system/host.ts#L258)

Elects one player as the host, the same on every client, so a Map project
can give one player a role without desyncing.

## Remarks

The heuristic: the host created the lobby, so the host's client has sat in
the lobby the longest. Each client measures its own lobby time with
`os.clock`, from `config` to the `gameStart` stage, and the election makes
every measurement known to every client through `SyncRequest`, a local,
asynchronous value made shared through sync (#15, D6 and D9). The longest
time wins and a tie goes to the lowest player index. A player who leaves
before answering is dropped at the leave event; the timeout settles the
election with the times received so far.

Verified in game on 3.0.0.24268 (#131):
- `config` runs when the map loads in the lobby, and `os.clock` tracks
  wall time while the client sits there.
- The lobby time runs to the `gameStart` stage, so it also counts the
  countdown and the loading screen. That part is common to every client
  and cancels out in the comparison.
- With two clients, the lobby creator was elected and both clients agreed,
  also when the creator sat in slot 1 and the other player in slot 0.

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
