# What a chat message matches

What the game matches a chat message against for a Trigger registered with `TriggerRegisterPlayerChatEvent`, and what the handler reads, measured for [#952](https://github.com/phmilk/reforged-ts/issues/952), a ticket of the wayfinder map [#931](https://github.com/phmilk/reforged-ts/issues/931). It decides what the chat stub of `reforged-test` and `game.chat(player, text)` ([#939](https://github.com/phmilk/reforged-ts/issues/939)) copy. The ticket expected a hand-off to a human, since no Native sends a chat message: the messages were typed by a script instead, as window messages posted to the game, so the whole check ran without one. The Ticket [#984](https://github.com/phmilk/reforged-ts/issues/984) of the Spec [#970](https://github.com/phmilk/reforged-ts/issues/970) brought this file and its Probe to the default branch, with the chat stub that copies them (`__stub_dispatch_chat`) and its fixture cases (`packages/reforged-test/test/fixtures/actions/chat_test.lua`).

## TL;DR

Everything below is Observed, in two runs that agree on every fire they share (109 of them).

- **The comparison ignores case, with `exactMatchOnly` true and false.** The message `-hello` fires a Trigger registered with `-HELLO`, and `-HELLO` or `-HeLLo` one registered with `-hello`.
- **`exactMatchOnly` true matches the whole message and nothing else**, spaces included: `-hello` matches the messages `-hello`, `-HELLO` and `-HeLLo`, and not `-hello world`, `say -hello now` or `-hello` between two spaces. Nothing is trimmed. A filter of two words, `-hello world`, matches `-Hello World`.
- **`exactMatchOnly` false matches the filter anywhere in the message**: at its start, in its middle (`ell` in `-hello`, `-hello` in `say -hello now`) and at its end (`world`).
- **An empty filter matches every message, with `exactMatchOnly` true and false alike.** The true case is the exception to the rule above: it fired on every message, none of them empty.
- **`GetEventPlayerChatString` answers the message as typed**: its case and its leading and trailing spaces kept.
- **`GetEventPlayerChatStringMatched` answers the registration's filter in lower case**, for an exact and for a substring match: `-hello` for a registration of `-HELLO` whatever the message's case, `ell` for the message `ELL`, `-hello world` for the message `-Hello World`, and the empty string for an empty filter. It is never the message's own slice with its case.
- **One message fires a Trigger once per matching registration**, not once: two identical registrations fire it twice, and each fire reads the filter of its own registration (`-hello`, then `ell`).
- **The fires of one message come in the order of the registrations**, over every Trigger: not the order the Triggers were created in, and not Trigger by Trigger. With `a`, `b`, `a` registered in that order, the fires are `a`, `b`, `a`.
- **Only the registration's player counts**: a Trigger registered for Player 1 with an empty filter never fired on Player 0's messages. `GetTriggerPlayer` is the player who typed.
- **`GetTriggerEventId` answers the event of id 96 in the handler, not `EVENT_PLAYER_CHAT`**, whose id is 16: `GetTriggerEventId() == EVENT_PLAYER_CHAT` is false in a chat handler.
- **`BlzDisplayChatMessage` fires no chat event**: it only displays.

## The runs

- Probe: `probe/probes/chat-event-matching.ts`. It is the Probe of the two runs but for its non-null assertions, which lint refuses on the default branch: a helper reads the players and the ids in their place, and the Probe was not run again.
- Run `6f4cb4ad-a1a5-4afd-8747-ce8b117cc96e`, 2026-11-26, `finished`, 147 records: 14 Triggers, 10 messages.
- Run `2e62f895-c8d7-409b-aa97-fbdb815c3867`, 2026-11-26, `finished`, 144 records: the same Triggers and messages, every fire identical in Trigger, message, matched string and order, then four more Triggers and two more messages for the order of the fires, and the event's id in place of a comparison with `EVENT_PLAYER_CHAT` that the first run read as false.
- Typings of Patch 3.0.1.24370; client on Build 3.0.1.24371, accepted with `--client-build 3.0.1.24371` (a hotfix of the same Game version, `probe/README.md`, "Running a Probe run").
- Command: `pnpm probe:run chat-event-matching --client-build 3.0.1.24371`, then the typing script below once the run's `ready` checkpoint is printed.

The Probe registers everything, checkpoints, and holds the run until the message `-done`, with a checkpoint every 10 seconds. Every `FIRE` record carries `order`, a counter over the whole run. The run is single-player, the messages are Player 0's, sent to all.

### How the messages were typed

No Native sends a chat message, and `BlzDisplayChatMessage` fires nothing (measured here). The game does read window messages posted to its main window, without the focus, as `probe:run` already relies on for its space key: a `WM_KEYDOWN` and `WM_KEYUP` of Enter open the chat box, one `WM_CHAR` per character types the message, and a second Enter sends it. The script, run with the PID `probe:run` prints on its `started` line:

```powershell
param([int]$GamePid, [string[]]$Messages)
Add-Type -TypeDefinition @"
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading;
public static class ChatTypist {
  [DllImport("user32.dll")] static extern bool PostMessage(IntPtr w, uint m, IntPtr wp, IntPtr lp);
  static void Enter(IntPtr w) {
    // VK_RETURN, scan code 0x1C: the lParam of a key down, then of a key up.
    PostMessage(w, 0x0100, new IntPtr(0x0D), new IntPtr(0x001C0001));
    PostMessage(w, 0x0101, new IntPtr(0x0D), new IntPtr(unchecked((int)0xC01C0001)));
  }
  public static string Post(int pid, string text) {
    IntPtr w = Process.GetProcessById(pid).MainWindowHandle;
    if (w == IntPtr.Zero) return "no window";
    Enter(w); Thread.Sleep(500);
    // WM_CHAR, one per character.
    foreach (char c in text) { PostMessage(w, 0x0102, new IntPtr(c), new IntPtr(1)); Thread.Sleep(30); }
    Thread.Sleep(300); Enter(w);
    return "posted";
  }
}
"@
foreach ($m in $Messages) {
  Write-Output "$([ChatTypist]::Post($GamePid, $m)) [$m]"
  Start-Sleep -Milliseconds 2500
}
```

A list of messages reaches it as an array only through `powershell -Command "& '<script>' -GamePid <pid> -Messages 'a','b'"`: with `-File`, the first run received the whole list as one message, which the game sent as typed, commas included. Its 13 fires agree with every rule above and are left out of the 109 compared.

## The registrations

Each line is one Trigger; all are Player 0's except `other-player`. The last four are the second run's.

| Trigger                           | Registrations, in order                        |
| --------------------------------- | ---------------------------------------------- |
| `exact-lower`                     | `-hello` exact                                 |
| `exact-upper`                     | `-HELLO` exact                                 |
| `sub-lower`                       | `-hello` substring                             |
| `sub-upper`                       | `-HELLO` substring                             |
| `sub-middle`                      | `ell` substring                                |
| `sub-tail`                        | `world` substring                              |
| `exact-two-words`                 | `-hello world` exact                           |
| `empty-exact`                     | empty, exact                                   |
| `empty-sub`                       | empty, substring                               |
| `other-player`                    | empty, substring, for Player 1                 |
| `double-same`                     | `-hello` substring, twice                      |
| `double-different`                | `-hello` substring, then `ell` substring       |
| `double-exact-and-sub`            | `-hello` exact, then `-hello` substring        |
| `double-empty-and-sub`            | empty substring, then `ell` substring          |
| `created-second-registered-first` | `zz` substring                                 |
| `created-first-registered-second` | `zz` substring, registered after the one above |
| `alternate-a`                     | `qq` substring, then `q` substring             |
| `alternate-b`                     | `qq` substring, registered between those two   |

## What each message fired

The Triggers each message fired, in the order of the fires, with what `GetEventPlayerChatStringMatched` answered in parentheses where the line needs it. `GetEventPlayerChatString` answered the message exactly as typed every time. "The three empty" stands for `empty-exact`, `empty-sub` and the first registration of `double-empty-and-sub`, each with the empty string matched.

| Message                     | Fires, in order                                                                                                                                                                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `-hello`                    | `exact-lower`, `exact-upper` (`-hello`), `sub-lower`, `sub-upper` (`-hello`), `sub-middle`, `empty-exact`, `empty-sub`, `double-same` twice, `double-different` (`-hello`, then `ell`), `double-exact-and-sub` twice, `double-empty-and-sub` (empty, then `ell`): 15 fires |
| `-HELLO`                    | the same 15 fires, the same matched strings, all in lower case                                                                                                                                                                                                             |
| `-HeLLo`                    | the same 15 fires                                                                                                                                                                                                                                                          |
| `-Hello World`              | `sub-lower`, `sub-upper`, `sub-middle`, `sub-tail`, `exact-two-words` (`-hello world`), `empty-exact`, `empty-sub`, `double-same` twice, `double-different` twice, `double-exact-and-sub` once (its substring registration), `double-empty-and-sub` twice: 14 fires        |
| `-hello world`              | the same 14 fires                                                                                                                                                                                                                                                          |
| `x`                         | the three empty                                                                                                                                                                                                                                                            |
| `say -hello now`            | `sub-lower`, `sub-upper`, `sub-middle`, `empty-exact`, `empty-sub`, `double-same` twice, `double-different` twice, `double-exact-and-sub` once, `double-empty-and-sub` twice: 12 fires                                                                                     |
| `-hello` between two spaces | the same 12 fires: no exact registration fired, and the message read back with both spaces                                                                                                                                                                                 |
| `ELL`                       | `sub-middle` (`ell`), `empty-exact`, `empty-sub`, `double-different` once (`ell`), `double-empty-and-sub` twice                                                                                                                                                            |
| `zz`                        | the three empty, `created-second-registered-first`, `created-first-registered-second`                                                                                                                                                                                      |
| `qq`                        | the three empty, `alternate-a` (`qq`), `alternate-b`, `alternate-a` (`q`)                                                                                                                                                                                                  |
| `-done`                     | the three empty, then the Probe's own ending Trigger                                                                                                                                                                                                                       |

`other-player` never fired. In every fire, `GetTriggerPlayer` was Player 0 and `GetHandleId(GetTriggerEventId())` was 96, while `GetHandleId(EVENT_PLAYER_CHAT)` was 16.

## What the order shows

Within every message the fires follow the order the registrations were made in, whatever Trigger they belong to:

- `created-second-registered-first` fires before `created-first-registered-second`: the order is not the Triggers' creation order.
- `alternate-a`, `alternate-b`, `alternate-a`: a Trigger's two fires are not grouped; another Trigger's fire comes between them, where its registration was made.
- The four Triggers of the second run, registered last, fire after the three empty ones on `zz` and `qq`, and the Probe's ending Trigger, registered after them, fires last on `-done`.

`GetTriggerExecCount` counts each fire: `double-same` read 1, then 2, on the first message.

## What the chat stub copies

- A registration matches a message when its filter is empty, or, compared in lower case, when it equals the message (`exactMatchOnly` true) or is found in it (false). The message is never trimmed.
- One dispatch walks the chat registrations of the typing player in registration order and runs the Trigger of each one that matches, once per registration.
- In each of those runs, `GetEventPlayerChatString` is the message as given, `GetEventPlayerChatStringMatched` is that registration's filter in lower case, and `GetTriggerPlayer` is the typing player.
- `GetTriggerEventId` is not `EVENT_PLAYER_CHAT` in the game. The Spec [#970](https://github.com/phmilk/reforged-ts/issues/970) chose to copy the id 96: code that compares the two does not work in the game, and does not work in a test either.

## What was not measured

- Case outside ASCII (`É` against `é`): every message and filter here is ASCII.
- A message sent to allies or to observers, and another player's message in multiplayer, which stays with a human (`probe/README.md`, "What stays for a human").
- The longest message the chat box sends, and a filter longer than a message.
- A Trigger's condition: the unit events ran a condition before its action ([#938](https://github.com/phmilk/reforged-ts/issues/938)); chat was not checked.
