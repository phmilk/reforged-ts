---
"reforged-ts": patch
---

`Region.containsPoint` and `Leaderboard.hasPlayerItem` return the boolean of their Native (`IsLocationInRegion`, `LeaderboardHasPlayerItem`), where they returned nothing.
