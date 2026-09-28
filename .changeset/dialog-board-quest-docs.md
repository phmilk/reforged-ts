---
"reforged-ts": patch
---

Document `Dialog`, `DialogButton`, `Leaderboard`, `Multiboard`, `MultiboardItem`, `Quest`, `QuestItem`, `TextTag` and `TimerDialog`: every public member now has a summary, its parameters with their units and ranges, what it returns, the error a creation raises and the Natives behind it, and each class has a compiled example. `MultiboardItem.create` takes the row, then the column, both counted from 1; `Leaderboard.hasPlayerItem` returns nothing, and its comment says how to read the answer.
