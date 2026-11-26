---
"reforged-ts": patch
---

`Timer.resume` now continues the countdown `pause` stopped: the handler runs when what was left at the pause runs out, and a periodic Timer keeps its period after that. It used to call the game's `ResumeTimer`, which fires a resumed timer once more a full timeout later and then stops it, one-shot or periodic alike. `resume` now does nothing on a running Timer, a Timer never started or a one-shot Timer that expired, and `elapsed`, `remaining` and `timeout` read a resumed Timer as any other: `timeout` is the one `start` was given and `elapsed + remaining` is `timeout`. A Timer paused or resumed through the Natives directly is outside what the Wrapper knows.
