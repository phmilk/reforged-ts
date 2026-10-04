# Nullability sweep

The [Nullability sweep](../../CONTEXT.md)'s report: one section per Slice, written by `pnpm probe:nullability-report <probe>` from the Result file of the Slice's last Probe run, and replaced, alone, each time the command runs again. Each Native gets a verdict from its cases and its Nullability family, compared with the Overlay's `returns.nullable`, and a proposed `notes` text; a Native is a `mismatch` when the Overlay types it non-null and its verdict is neither `non-null (evidence)` nor `non-null (evidence, handle id 0)`, `unsafe` and `review` included. An `unsafe` Native, one with a case that crashed the game, is proposed nullable. Each parameter measured by call cases gets a verdict from them, compared with the Overlay's `params[].nullable`, and a proposed sentence of its Native's `notes`, since the Overlay has no `params[].notes`. The command never writes the Overlay: every change to it goes through review.

## `nullability-slice-1`

- Probe: `nullability-slice-1`
- Patch: 3.0.0.24268
- Date: 2026-10-02
- Run: `ebe42ed0-dc97-4341-999b-5719a0928132`

### `CreateTimer`

| Case     | Group | Outcome | Id      | Type                      | Message |
| -------- | ----- | ------- | ------- | ------------------------- | ------- |
| one call | (a)   | handle  | 1048796 | `timer: 0000014F3D6FD3B0` |         |

- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `CreateTrigger`

| Case     | Group | Outcome | Id      | Type                        | Message |
| -------- | ----- | ------- | ------- | --------------------------- | ------- |
| one call | (a)   | handle  | 1048797 | `trigger: 0000014F3D6FD040` |         |

- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `CreateRegion`

| Case     | Group | Outcome | Id      | Type                       | Message |
| -------- | ----- | ------- | ------- | -------------------------- | ------- |
| one call | (a)   | handle  | 1048798 | `region: 0000014F3D706610` |         |

- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `CreateCameraSetup`

| Case     | Group | Outcome | Id      | Type                            | Message |
| -------- | ----- | ------- | ------- | ------------------------------- | ------- |
| one call | (a)   | handle  | 1048799 | `camerasetup: 0000014F3D70AE00` |         |

- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `GetLocalPlayer`

| Case     | Group | Outcome | Id      | Type                       | Message |
| -------- | ----- | ------- | ------- | -------------------------- | ------- |
| one call | (a)   | handle  | 1048584 | `player: 0000014F30184290` |         |

- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `Location`

| Case              | Group | Outcome | Id      | Type                         | Message |
| ----------------- | ----- | ------- | ------- | ---------------------------- | ------- |
| origin            | (a)   | handle  | 1048800 | `location: 0000014F3D713FA0` |         |
| outside the world | (a)   | handle  | 1048801 | `location: 0000014F3D718D10` |         |

- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (origin, outside the world) on 3.0.0.24268; evidence, not proof.

### `Rect`

| Case                   | Group | Outcome | Id      | Type                     | Message |
| ---------------------- | ----- | ------- | ------- | ------------------------ | ------- |
| normal rect            | (a)   | handle  | 1048802 | `rect: 0000014F3D71D550` |         |
| inverted rect          | (a)   | handle  | 1048803 | `rect: 0000014F3D722170` |         |
| zero area rect         | (a)   | handle  | 1048804 | `rect: 0000014F3D726820` |         |
| rect outside the world | (a)   | handle  | 1048805 | `rect: 0000014F3D72B760` |         |

- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (normal rect, inverted rect, zero area rect, rect outside the world) on 3.0.0.24268; evidence, not proof.

### `Condition`

| Case                | Group | Outcome | Id      | Type                              | Message |
| ------------------- | ----- | ------- | ------- | --------------------------------- | ------- |
| TypeScript function | (a)   | handle  | 1048806 | `conditionfunc: 0000014F3D72F850` |         |

- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (TypeScript function) on 3.0.0.24268; evidence, not proof.

### `Filter`

| Case                | Group | Outcome | Id      | Type                           | Message |
| ------------------- | ----- | ------- | ------- | ------------------------------ | ------- |
| TypeScript function | (a)   | handle  | 1048807 | `filterfunc: 0000014F3D734C90` |         |

- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (TypeScript function) on 3.0.0.24268; evidence, not proof.

### `And`

| Case                        | Group | Outcome | Id      | Type                         | Message |
| --------------------------- | ----- | ------- | ------- | ---------------------------- | ------- |
| two live operands           | (a)   | handle  | 1048808 | `boolexpr: 0000014F3D739F30` |         |
| condition and filter        | (a)   | handle  | 1048809 | `boolexpr: 0000014F3D73EEB0` |         |
| destroyed condition operand | (b)   | handle  | 1048820 | `boolexpr: 0000014F3D7AFFF0` |         |

- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (two live operands, condition and filter, destroyed condition operand) on 3.0.0.24268; evidence, not proof.

### `Or`

| Case                       | Group | Outcome | Id      | Type                         | Message |
| -------------------------- | ----- | ------- | ------- | ---------------------------- | ------- |
| two live operands          | (a)   | handle  | 1048810 | `boolexpr: 0000014F3D743830` |         |
| condition and filter       | (a)   | handle  | 1048811 | `boolexpr: 0000014F3D7488C0` |         |
| destroyed boolexpr operand | (b)   | handle  | 1048821 | `boolexpr: 0000014F3D7B4840` |         |

- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (two live operands, condition and filter, destroyed boolexpr operand) on 3.0.0.24268; evidence, not proof.

### `Not`

| Case              | Group | Outcome | Id      | Type                         | Message |
| ----------------- | ----- | ------- | ------- | ---------------------------- | ------- |
| live operand      | (a)   | handle  | 1048812 | `boolexpr: 0000014F3D74CAD0` |         |
| destroyed operand | (b)   | handle  | 1048822 | `boolexpr: 0000014F3D7B9080` |         |

- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (live operand, destroyed operand) on 3.0.0.24268; evidence, not proof.

### `GetOwningPlayer`

| Case                 | Group | Outcome | Id      | Type                       | Message |
| -------------------- | ----- | ------- | ------- | -------------------------- | ------- |
| unit of player 0     | (a)   | handle  | 1048584 | `player: 0000014F30184290` |         |
| Neutral Passive unit | (a)   | handle  | 1048648 | `player: 0000014F395779D0` |         |
| dead unit            | (b)   | handle  | 1048584 | `player: 0000014F30184290` |         |
| removed unit         | (b)   | handle  | 1048584 | `player: 0000014F30184290` |         |

- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (unit of player 0, Neutral Passive unit, dead unit, removed unit) on 3.0.0.24268; evidence, not proof.

### `GetUnitLoc`

| Case         | Group | Outcome | Id      | Type                         | Message |
| ------------ | ----- | ------- | ------- | ---------------------------- | ------- |
| live unit    | (a)   | handle  | 1048813 | `location: 0000014F3D75C590` |         |
| dead unit    | (b)   | handle  | 1048818 | `location: 0000014F3D77E020` |         |
| removed unit | (b)   | handle  | 1048819 | `location: 0000014F3D786B80` |         |

- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (live unit, dead unit, removed unit) on 3.0.0.24268; evidence, not proof.

### `BlzFrameGetParent`

| Case                | Group | Outcome | Id      | Type                            | Message |
| ------------------- | ----- | ------- | ------- | ------------------------------- | ------- |
| created child frame | (a)   | handle  | 1048780 | `framehandle: 0000014F3D6D4130` |         |
| game UI frame       | (a)   | handle  | 1048814 | `framehandle: 0000014F3D7647E0` |         |
| world frame         | (a)   | handle  | 1048780 | `framehandle: 0000014F3D6D4130` |         |
| destroyed frame     | (b)   | nil     |         |                                 |         |

- Verdict: nullable (proved)
- Overlay `returns.nullable`: `false`
- Comparison: mismatch
- Proposed `notes`: Returns nothing for destroyed frame (nullability sweep, 3.0.0.24268).

### `CameraSetupGetDestPositionLoc`

| Case             | Group | Outcome | Id      | Type                         | Message |
| ---------------- | ----- | ------- | ------- | ---------------------------- | ------- |
| fresh setup      | (a)   | handle  | 1048815 | `location: 0000014F3D76C9D0` |         |
| positioned setup | (a)   | handle  | 1048816 | `location: 0000014F3D7710A0` |         |

- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (fresh setup, positioned setup) on 3.0.0.24268; evidence, not proof.

### `TriggerAddAction`

| Case              | Group | Outcome | Id      | Type                              | Message |
| ----------------- | ----- | ------- | ------- | --------------------------------- | ------- |
| live trigger      | (a)   | handle  | 1048817 | `triggeraction: 0000014F3D775200` |         |
| destroyed trigger | (b)   | odd     |         | `triggeraction: 0000014F3D78B6C0` |         |

- Verdict: review
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: review

## `nullability-converters-1`

- Probe: `nullability-converters-1`
- Patch: 3.0.0.24268
- Date: 2026-10-04
- Run: `2c4f582a-e7e7-4cbc-8fc9-35494734dab9`

### `ConvertRace`

| Case                   | Group | Outcome | Id          | Type                     | Message |
| ---------------------- | ----- | ------- | ----------- | ------------------------ | ------- |
| RACE\_HUMAN            | (a)   | handle  | 1           | `race: 000002B374A27C70` |         |
| RACE\_ORC              | (a)   | handle  | 2           | `race: 000002B374A27CB0` |         |
| RACE\_UNDEAD           | (a)   | handle  | 3           | `race: 000002B374A27D30` |         |
| RACE\_NIGHTELF         | (a)   | handle  | 4           | `race: 000002B374A27CF0` |         |
| RACE\_DEMON            | (a)   | handle  | 5           | `race: 000002B374A27D70` |         |
| RACE\_OTHER            | (a)   | handle  | 7           | `race: 000002B374A27DB0` |         |
| -1                     | (a)   | handle  | -1          | `race: 000002B380E8C190` |         |
| past the last constant | (a)   | handle  | 8           | `race: 000002B390428400` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `race: 000002B380E91800` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `race: 000002B380EA7C60` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (RACE\_HUMAN, RACE\_ORC, RACE\_UNDEAD, RACE\_NIGHTELF, RACE\_DEMON, RACE\_OTHER, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof.

### `ConvertAllianceType`

| Case                                | Group | Outcome | Id          | Type                             | Message |
| ----------------------------------- | ----- | ------- | ----------- | -------------------------------- | ------- |
| ALLIANCE\_PASSIVE                   | (a)   | handle  | 0           | `alliancetype: 000002B374A27EE0` |         |
| ALLIANCE\_HELP\_REQUEST             | (a)   | handle  | 1           | `alliancetype: 000002B374A27F60` |         |
| ALLIANCE\_HELP\_RESPONSE            | (a)   | handle  | 2           | `alliancetype: 000002B374A27FD0` |         |
| ALLIANCE\_SHARED\_XP                | (a)   | handle  | 3           | `alliancetype: 000002B374A28050` |         |
| ALLIANCE\_SHARED\_SPELLS            | (a)   | handle  | 4           | `alliancetype: 000002B374A28010` |         |
| ALLIANCE\_SHARED\_VISION            | (a)   | handle  | 5           | `alliancetype: 000002B374A280F0` |         |
| ALLIANCE\_SHARED\_CONTROL           | (a)   | handle  | 6           | `alliancetype: 000002B374A281D0` |         |
| ALLIANCE\_SHARED\_ADVANCED\_CONTROL | (a)   | handle  | 7           | `alliancetype: 000002B374A28210` |         |
| ALLIANCE\_RESCUABLE                 | (a)   | handle  | 8           | `alliancetype: 000002B374A28250` |         |
| ALLIANCE\_SHARED\_VISION\_FORCED    | (a)   | handle  | 9           | `alliancetype: 000002B374A28290` |         |
| -1                                  | (a)   | handle  | -1          | `alliancetype: 000002B390416090` |         |
| past the last constant              | (a)   | handle  | 10          | `alliancetype: 000002B380800260` |         |
| 2147483647                          | (a)   | handle  | 2147483647  | `alliancetype: 000002B380E89760` |         |
| -2147483648                         | (a)   | handle  | -2147483648 | `alliancetype: 000002B39041CFB0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (ALLIANCE\_PASSIVE, ALLIANCE\_HELP\_REQUEST, ALLIANCE\_HELP\_RESPONSE, ALLIANCE\_SHARED\_XP, ALLIANCE\_SHARED\_SPELLS, ALLIANCE\_SHARED\_VISION, ALLIANCE\_SHARED\_CONTROL, ALLIANCE\_SHARED\_ADVANCED\_CONTROL, ALLIANCE\_RESCUABLE, ALLIANCE\_SHARED\_VISION\_FORCED, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof. For ALLIANCE\_PASSIVE, a handle of id 0.

### `ConvertRacePref`

| Case                         | Group | Outcome | Id          | Type                               | Message |
| ---------------------------- | ----- | ------- | ----------- | ---------------------------------- | ------- |
| RACE\_PREF\_HUMAN            | (a)   | handle  | 1           | `racepreference: 000002B374A2B6D0` |         |
| RACE\_PREF\_ORC              | (a)   | handle  | 2           | `racepreference: 000002B374A2B710` |         |
| RACE\_PREF\_NIGHTELF         | (a)   | handle  | 4           | `racepreference: 000002B374A2B790` |         |
| RACE\_PREF\_UNDEAD           | (a)   | handle  | 8           | `racepreference: 000002B374A2B750` |         |
| RACE\_PREF\_DEMON            | (a)   | handle  | 16          | `racepreference: 000002B374A2B7D0` |         |
| RACE\_PREF\_RANDOM           | (a)   | handle  | 32          | `racepreference: 000002B374A2B810` |         |
| RACE\_PREF\_USER\_SELECTABLE | (a)   | handle  | 64          | `racepreference: 000002B374A2B850` |         |
| RACE\_PREF\_FORSAKEN         | (a)   | handle  | 128         | `racepreference: 000002B374A2B890` |         |
| -1                           | (a)   | handle  | -1          | `racepreference: 000002B380E7F120` |         |
| past the last constant       | (a)   | handle  | 129         | `racepreference: 000002B380E7B200` |         |
| 2147483647                   | (a)   | handle  | 2147483647  | `racepreference: 000002B380ED56C0` |         |
| -2147483648                  | (a)   | handle  | -2147483648 | `racepreference: 000002B380EE1A70` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (RACE\_PREF\_HUMAN, RACE\_PREF\_ORC, RACE\_PREF\_NIGHTELF, RACE\_PREF\_UNDEAD, RACE\_PREF\_DEMON, RACE\_PREF\_RANDOM, RACE\_PREF\_USER\_SELECTABLE, RACE\_PREF\_FORSAKEN, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof.

### `ConvertIGameState`

| Case                              | Group | Outcome | Id          | Type                           | Message |
| --------------------------------- | ----- | ------- | ----------- | ------------------------------ | ------- |
| GAME\_STATE\_DIVINE\_INTERVENTION | (a)   | handle  | 0           | `igamestate: 000002B374A2D220` |         |
| GAME\_STATE\_DISCONNECTED         | (a)   | handle  | 1           | `igamestate: 000002B374A2D260` |         |
| -1                                | (a)   | handle  | -1          | `igamestate: 000002B380ED74C0` |         |
| past the last constant            | (a)   | handle  | 2           | `igamestate: 000002B380E19F50` |         |
| 2147483647                        | (a)   | handle  | 2147483647  | `igamestate: 000002B380EDC2F0` |         |
| -2147483648                       | (a)   | handle  | -2147483648 | `igamestate: 000002B380EE4F10` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (GAME\_STATE\_DIVINE\_INTERVENTION, GAME\_STATE\_DISCONNECTED, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof. For GAME\_STATE\_DIVINE\_INTERVENTION, a handle of id 0.

### `ConvertFGameState`

| Case                       | Group | Outcome | Id          | Type                           | Message |
| -------------------------- | ----- | ------- | ----------- | ------------------------------ | ------- |
| GAME\_STATE\_TIME\_OF\_DAY | (a)   | handle  | 2           | `fgamestate: 000002B374A2D2D0` |         |
| -1                         | (a)   | handle  | -1          | `fgamestate: 000002B380EC1390` |         |
| past the last constant     | (a)   | handle  | 3           | `fgamestate: 000002B380ECD490` |         |
| 2147483647                 | (a)   | handle  | 2147483647  | `fgamestate: 000002B380EDDAD0` |         |
| -2147483648                | (a)   | handle  | -2147483648 | `fgamestate: 000002B380ED1110` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (GAME\_STATE\_TIME\_OF\_DAY, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof.

### `ConvertPlayerState`

| Case                                  | Group | Outcome | Id          | Type                            | Message |
| ------------------------------------- | ----- | ------- | ----------- | ------------------------------- | ------- |
| PLAYER\_STATE\_GAME\_RESULT           | (a)   | handle  | 0           | `playerstate: 000002B374A2D310` |         |
| PLAYER\_STATE\_RESOURCE\_GOLD         | (a)   | handle  | 1           | `playerstate: 000002B374A2D380` |         |
| PLAYER\_STATE\_RESOURCE\_LUMBER       | (a)   | handle  | 2           | `playerstate: 000002B374A2D3F0` |         |
| PLAYER\_STATE\_RESOURCE\_HERO\_TOKENS | (a)   | handle  | 3           | `playerstate: 000002B374A2D470` |         |
| PLAYER\_STATE\_RESOURCE\_FOOD\_CAP    | (a)   | handle  | 4           | `playerstate: 000002B374A2D430` |         |
| PLAYER\_STATE\_RESOURCE\_FOOD\_USED   | (a)   | handle  | 5           | `playerstate: 000002B374A2D4B0` |         |
| PLAYER\_STATE\_FOOD\_CAP\_CEILING     | (a)   | handle  | 6           | `playerstate: 000002B374A2D4F0` |         |
| PLAYER\_STATE\_GIVES\_BOUNTY          | (a)   | handle  | 7           | `playerstate: 000002B374A2D530` |         |
| PLAYER\_STATE\_ALLIED\_VICTORY        | (a)   | handle  | 8           | `playerstate: 000002B374A2D570` |         |
| PLAYER\_STATE\_PLACED                 | (a)   | handle  | 9           | `playerstate: 000002B374A2D5B0` |         |
| PLAYER\_STATE\_OBSERVER\_ON\_DEATH    | (a)   | handle  | 10          | `playerstate: 000002B374A2D710` |         |
| PLAYER\_STATE\_OBSERVER               | (a)   | handle  | 11          | `playerstate: 000002B374A2D750` |         |
| PLAYER\_STATE\_UNFOLLOWABLE           | (a)   | handle  | 12          | `playerstate: 000002B374A2D790` |         |
| PLAYER\_STATE\_GOLD\_UPKEEP\_RATE     | (a)   | handle  | 13          | `playerstate: 000002B374A2D7D0` |         |
| PLAYER\_STATE\_LUMBER\_UPKEEP\_RATE   | (a)   | handle  | 14          | `playerstate: 000002B374A2D810` |         |
| PLAYER\_STATE\_GOLD\_GATHERED         | (a)   | handle  | 15          | `playerstate: 000002B374A2D850` |         |
| PLAYER\_STATE\_LUMBER\_GATHERED       | (a)   | handle  | 16          | `playerstate: 000002B374A2D890` |         |
| PLAYER\_STATE\_NO\_CREEP\_SLEEP       | (a)   | handle  | 25          | `playerstate: 000002B374A2D8D0` |         |
| -1                                    | (a)   | handle  | -1          | `playerstate: 000002B39140B850` |         |
| past the last constant                | (a)   | handle  | 26          | `playerstate: 000002B39140BCE0` |         |
| 2147483647                            | (a)   | handle  | 2147483647  | `playerstate: 000002B39140E030` |         |
| -2147483648                           | (a)   | handle  | -2147483648 | `playerstate: 000002B391410360` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (PLAYER\_STATE\_GAME\_RESULT, PLAYER\_STATE\_RESOURCE\_GOLD, PLAYER\_STATE\_RESOURCE\_LUMBER, PLAYER\_STATE\_RESOURCE\_HERO\_TOKENS, PLAYER\_STATE\_RESOURCE\_FOOD\_CAP, PLAYER\_STATE\_RESOURCE\_FOOD\_USED, PLAYER\_STATE\_FOOD\_CAP\_CEILING, PLAYER\_STATE\_GIVES\_BOUNTY, PLAYER\_STATE\_ALLIED\_VICTORY, PLAYER\_STATE\_PLACED, PLAYER\_STATE\_OBSERVER\_ON\_DEATH, PLAYER\_STATE\_OBSERVER, PLAYER\_STATE\_UNFOLLOWABLE, PLAYER\_STATE\_GOLD\_UPKEEP\_RATE, PLAYER\_STATE\_LUMBER\_UPKEEP\_RATE, PLAYER\_STATE\_GOLD\_GATHERED, PLAYER\_STATE\_LUMBER\_GATHERED, PLAYER\_STATE\_NO\_CREEP\_SLEEP, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof. For PLAYER\_STATE\_GAME\_RESULT, a handle of id 0.

### `ConvertPlayerScore`

| Case                                | Group | Outcome | Id          | Type                            | Message |
| ----------------------------------- | ----- | ------- | ----------- | ------------------------------- | ------- |
| PLAYER\_SCORE\_UNITS\_TRAINED       | (a)   | handle  | 0           | `playerscore: 000002B374A2DD90` |         |
| PLAYER\_SCORE\_UNITS\_KILLED        | (a)   | handle  | 1           | `playerscore: 000002B374A2DDD0` |         |
| PLAYER\_SCORE\_STRUCT\_BUILT        | (a)   | handle  | 2           | `playerscore: 000002B374A2DE40` |         |
| PLAYER\_SCORE\_STRUCT\_RAZED        | (a)   | handle  | 3           | `playerscore: 000002B374A2DEC0` |         |
| PLAYER\_SCORE\_TECH\_PERCENT        | (a)   | handle  | 4           | `playerscore: 000002B374A2DE80` |         |
| PLAYER\_SCORE\_FOOD\_MAXPROD        | (a)   | handle  | 5           | `playerscore: 000002B374A2DF60` |         |
| PLAYER\_SCORE\_FOOD\_MAXUSED        | (a)   | handle  | 6           | `playerscore: 000002B374A2DFA0` |         |
| PLAYER\_SCORE\_HEROES\_KILLED       | (a)   | handle  | 7           | `playerscore: 000002B374A2DFE0` |         |
| PLAYER\_SCORE\_ITEMS\_GAINED        | (a)   | handle  | 8           | `playerscore: 000002B374A2E020` |         |
| PLAYER\_SCORE\_MERCS\_HIRED         | (a)   | handle  | 9           | `playerscore: 000002B374A2E060` |         |
| PLAYER\_SCORE\_GOLD\_MINED\_TOTAL   | (a)   | handle  | 10          | `playerscore: 000002B374A2E0A0` |         |
| PLAYER\_SCORE\_GOLD\_MINED\_UPKEEP  | (a)   | handle  | 11          | `playerscore: 000002B374A2E0E0` |         |
| PLAYER\_SCORE\_GOLD\_LOST\_UPKEEP   | (a)   | handle  | 12          | `playerscore: 000002B374A2E120` |         |
| PLAYER\_SCORE\_GOLD\_LOST\_TAX      | (a)   | handle  | 13          | `playerscore: 000002B374A2E160` |         |
| PLAYER\_SCORE\_GOLD\_GIVEN          | (a)   | handle  | 14          | `playerscore: 000002B374A2E1A0` |         |
| PLAYER\_SCORE\_GOLD\_RECEIVED       | (a)   | handle  | 15          | `playerscore: 000002B374A2E1E0` |         |
| PLAYER\_SCORE\_LUMBER\_TOTAL        | (a)   | handle  | 16          | `playerscore: 000002B374A2E220` |         |
| PLAYER\_SCORE\_LUMBER\_LOST\_UPKEEP | (a)   | handle  | 17          | `playerscore: 000002B374A2E260` |         |
| PLAYER\_SCORE\_LUMBER\_LOST\_TAX    | (a)   | handle  | 18          | `playerscore: 000002B374A2E2A0` |         |
| PLAYER\_SCORE\_LUMBER\_GIVEN        | (a)   | handle  | 19          | `playerscore: 000002B374A2E2E0` |         |
| PLAYER\_SCORE\_LUMBER\_RECEIVED     | (a)   | handle  | 20          | `playerscore: 000002B374A2E320` |         |
| PLAYER\_SCORE\_UNIT\_TOTAL          | (a)   | handle  | 21          | `playerscore: 000002B374A2E360` |         |
| PLAYER\_SCORE\_HERO\_TOTAL          | (a)   | handle  | 22          | `playerscore: 000002B374A2E3A0` |         |
| PLAYER\_SCORE\_RESOURCE\_TOTAL      | (a)   | handle  | 23          | `playerscore: 000002B374A285F0` |         |
| PLAYER\_SCORE\_TOTAL                | (a)   | handle  | 24          | `playerscore: 000002B374A2DF00` |         |
| -1                                  | (a)   | handle  | -1          | `playerscore: 000002B3903DDF40` |         |
| past the last constant              | (a)   | handle  | 25          | `playerscore: 000002B3807FE730` |         |
| 2147483647                          | (a)   | handle  | 2147483647  | `playerscore: 000002B380799670` |         |
| -2147483648                         | (a)   | handle  | -2147483648 | `playerscore: 000002B390403670` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (PLAYER\_SCORE\_UNITS\_TRAINED, PLAYER\_SCORE\_UNITS\_KILLED, PLAYER\_SCORE\_STRUCT\_BUILT, PLAYER\_SCORE\_STRUCT\_RAZED, PLAYER\_SCORE\_TECH\_PERCENT, PLAYER\_SCORE\_FOOD\_MAXPROD, PLAYER\_SCORE\_FOOD\_MAXUSED, PLAYER\_SCORE\_HEROES\_KILLED, PLAYER\_SCORE\_ITEMS\_GAINED, PLAYER\_SCORE\_MERCS\_HIRED, PLAYER\_SCORE\_GOLD\_MINED\_TOTAL, PLAYER\_SCORE\_GOLD\_MINED\_UPKEEP, PLAYER\_SCORE\_GOLD\_LOST\_UPKEEP, PLAYER\_SCORE\_GOLD\_LOST\_TAX, PLAYER\_SCORE\_GOLD\_GIVEN, PLAYER\_SCORE\_GOLD\_RECEIVED, PLAYER\_SCORE\_LUMBER\_TOTAL, PLAYER\_SCORE\_LUMBER\_LOST\_UPKEEP, PLAYER\_SCORE\_LUMBER\_LOST\_TAX, PLAYER\_SCORE\_LUMBER\_GIVEN, PLAYER\_SCORE\_LUMBER\_RECEIVED, PLAYER\_SCORE\_UNIT\_TOTAL, PLAYER\_SCORE\_HERO\_TOTAL, PLAYER\_SCORE\_RESOURCE\_TOTAL, PLAYER\_SCORE\_TOTAL, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof. For PLAYER\_SCORE\_UNITS\_TRAINED, a handle of id 0.

### `ConvertPlayerGameResult`

| Case                          | Group | Outcome | Id          | Type                                 | Message |
| ----------------------------- | ----- | ------- | ----------- | ------------------------------------ | ------- |
| PLAYER\_GAME\_RESULT\_VICTORY | (a)   | handle  | 0           | `playergameresult: 000002B374A27DF0` |         |
| PLAYER\_GAME\_RESULT\_DEFEAT  | (a)   | handle  | 1           | `playergameresult: 000002B374A27E30` |         |
| PLAYER\_GAME\_RESULT\_TIE     | (a)   | handle  | 2           | `playergameresult: 000002B374A27EA0` |         |
| PLAYER\_GAME\_RESULT\_NEUTRAL | (a)   | handle  | 3           | `playergameresult: 000002B374A27F20` |         |
| -1                            | (a)   | handle  | -1          | `playergameresult: 000002B379410460` |         |
| past the last constant        | (a)   | handle  | 4           | `playergameresult: 000002B380A78EF0` |         |
| 2147483647                    | (a)   | handle  | 2147483647  | `playergameresult: 000002B37EFDD450` |         |
| -2147483648                   | (a)   | handle  | -2147483648 | `playergameresult: 000002B380E1E900` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (PLAYER\_GAME\_RESULT\_VICTORY, PLAYER\_GAME\_RESULT\_DEFEAT, PLAYER\_GAME\_RESULT\_TIE, PLAYER\_GAME\_RESULT\_NEUTRAL, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof. For PLAYER\_GAME\_RESULT\_VICTORY, a handle of id 0.

### `ConvertUnitState`

| Case                   | Group | Outcome | Id          | Type                          | Message |
| ---------------------- | ----- | ------- | ----------- | ----------------------------- | ------- |
| UNIT\_STATE\_LIFE      | (a)   | handle  | 0           | `unitstate: 000002B374A2DB30` |         |
| UNIT\_STATE\_MAX\_LIFE | (a)   | handle  | 1           | `unitstate: 000002B374A2DB70` |         |
| UNIT\_STATE\_MANA      | (a)   | handle  | 2           | `unitstate: 000002B374A2DBE0` |         |
| UNIT\_STATE\_MAX\_MANA | (a)   | handle  | 3           | `unitstate: 000002B374A2DC60` |         |
| -1                     | (a)   | handle  | -1          | `unitstate: 000002B380E926E0` |         |
| past the last constant | (a)   | handle  | 4           | `unitstate: 000002B3747B8470` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `unitstate: 000002B3747DF020` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `unitstate: 000002B374996FA0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (UNIT\_STATE\_LIFE, UNIT\_STATE\_MAX\_LIFE, UNIT\_STATE\_MANA, UNIT\_STATE\_MAX\_MANA, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof. For UNIT\_STATE\_LIFE, a handle of id 0.

### `ConvertAIDifficulty`

| Case                   | Group | Outcome | Id          | Type                             | Message |
| ---------------------- | ----- | ------- | ----------- | -------------------------------- | ------- |
| AI\_DIFFICULTY\_NEWBIE | (a)   | handle  | 0           | `aidifficulty: 000002B374A2DC20` |         |
| AI\_DIFFICULTY\_NORMAL | (a)   | handle  | 1           | `aidifficulty: 000002B374A2DCA0` |         |
| AI\_DIFFICULTY\_INSANE | (a)   | handle  | 2           | `aidifficulty: 000002B374A2DD10` |         |
| -1                     | (a)   | handle  | -1          | `aidifficulty: 000002B380EE1800` |         |
| past the last constant | (a)   | handle  | 3           | `aidifficulty: 000002B3747AE7F0` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `aidifficulty: 000002B390428D40` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `aidifficulty: 000002B380E916D0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (AI\_DIFFICULTY\_NEWBIE, AI\_DIFFICULTY\_NORMAL, AI\_DIFFICULTY\_INSANE, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof. For AI\_DIFFICULTY\_NEWBIE, a handle of id 0.

### `ConvertGameEvent`

| Case                                  | Group | Outcome | Id          | Type                          | Message |
| ------------------------------------- | ----- | ------- | ----------- | ----------------------------- | ------- |
| EVENT\_GAME\_VICTORY                  | (a)   | handle  | 0           | `gameevent: 000002B374A263C0` |         |
| EVENT\_GAME\_END\_LEVEL               | (a)   | handle  | 1           | `gameevent: 000002B374A26400` |         |
| EVENT\_GAME\_VARIABLE\_LIMIT          | (a)   | handle  | 2           | `gameevent: 000002B374A0DDE0` |         |
| EVENT\_GAME\_STATE\_LIMIT             | (a)   | handle  | 3           | `gameevent: 000002B374A2CF80` |         |
| EVENT\_GAME\_TIMER\_EXPIRED           | (a)   | handle  | 4           | `gameevent: 000002B374A2CF40` |         |
| EVENT\_GAME\_ENTER\_REGION            | (a)   | handle  | 5           | `gameevent: 000002B374A2A960` |         |
| EVENT\_GAME\_LEAVE\_REGION            | (a)   | handle  | 6           | `gameevent: 000002B374A28AD0` |         |
| EVENT\_GAME\_TRACKABLE\_HIT           | (a)   | handle  | 7           | `gameevent: 000002B374A2A9A0` |         |
| EVENT\_GAME\_TRACKABLE\_TRACK         | (a)   | handle  | 8           | `gameevent: 000002B374A2A900` |         |
| EVENT\_GAME\_SHOW\_SKILL              | (a)   | handle  | 9           | `gameevent: 000002B374A2D5F0` |         |
| EVENT\_GAME\_BUILD\_SUBMENU           | (a)   | handle  | 10          | `gameevent: 000002B374A2D630` |         |
| EVENT\_GAME\_LOADED                   | (a)   | handle  | 256         | `gameevent: 000002B37218F160` |         |
| EVENT\_GAME\_TOURNAMENT\_FINISH\_SOON | (a)   | handle  | 257         | `gameevent: 000002B37218F1F0` |         |
| EVENT\_GAME\_TOURNAMENT\_FINISH\_NOW  | (a)   | handle  | 258         | `gameevent: 000002B37218F230` |         |
| EVENT\_GAME\_SAVE                     | (a)   | handle  | 259         | `gameevent: 000002B37218F270` |         |
| EVENT\_GAME\_CUSTOM\_UI\_FRAME        | (a)   | handle  | 310         | `gameevent: 000002B37218F2B0` |         |
| -1                                    | (a)   | handle  | -1          | `gameevent: 000002B372174D50` |         |
| past the last constant                | (a)   | handle  | 311         | `gameevent: 000002B3903D7BD0` |         |
| 2147483647                            | (a)   | handle  | 2147483647  | `gameevent: 000002B38067DB30` |         |
| -2147483648                           | (a)   | handle  | -2147483648 | `gameevent: 000002B3806674F0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (EVENT\_GAME\_VICTORY, EVENT\_GAME\_END\_LEVEL, EVENT\_GAME\_VARIABLE\_LIMIT, EVENT\_GAME\_STATE\_LIMIT, EVENT\_GAME\_TIMER\_EXPIRED, EVENT\_GAME\_ENTER\_REGION, EVENT\_GAME\_LEAVE\_REGION, EVENT\_GAME\_TRACKABLE\_HIT, EVENT\_GAME\_TRACKABLE\_TRACK, EVENT\_GAME\_SHOW\_SKILL, EVENT\_GAME\_BUILD\_SUBMENU, EVENT\_GAME\_LOADED, EVENT\_GAME\_TOURNAMENT\_FINISH\_SOON, EVENT\_GAME\_TOURNAMENT\_FINISH\_NOW, EVENT\_GAME\_SAVE, EVENT\_GAME\_CUSTOM\_UI\_FRAME, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof. For EVENT\_GAME\_VICTORY, a handle of id 0.

### `ConvertPlayerEvent`

| Case                              | Group | Outcome | Id          | Type                            | Message |
| --------------------------------- | ----- | ------- | ----------- | ------------------------------- | ------- |
| EVENT\_PLAYER\_STATE\_LIMIT       | (a)   | handle  | 11          | `playerevent: 000002B374A2D670` |         |
| EVENT\_PLAYER\_ALLIANCE\_CHANGED  | (a)   | handle  | 12          | `playerevent: 000002B374A2D6B0` |         |
| EVENT\_PLAYER\_DEFEAT             | (a)   | handle  | 13          | `playerevent: 000002B374A28A80` |         |
| EVENT\_PLAYER\_VICTORY            | (a)   | handle  | 14          | `playerevent: 000002B37218C840` |         |
| EVENT\_PLAYER\_LEAVE              | (a)   | handle  | 15          | `playerevent: 000002B37218C880` |         |
| EVENT\_PLAYER\_CHAT               | (a)   | handle  | 16          | `playerevent: 000002B37218C9D0` |         |
| EVENT\_PLAYER\_END\_CINEMATIC     | (a)   | handle  | 17          | `playerevent: 000002B37218CA10` |         |
| EVENT\_PLAYER\_ARROW\_LEFT\_DOWN  | (a)   | handle  | 261         | `playerevent: 000002B37218F2F0` |         |
| EVENT\_PLAYER\_ARROW\_LEFT\_UP    | (a)   | handle  | 262         | `playerevent: 000002B37218F330` |         |
| EVENT\_PLAYER\_ARROW\_RIGHT\_DOWN | (a)   | handle  | 263         | `playerevent: 000002B37218F370` |         |
| EVENT\_PLAYER\_ARROW\_RIGHT\_UP   | (a)   | handle  | 264         | `playerevent: 000002B37218F3B0` |         |
| EVENT\_PLAYER\_ARROW\_DOWN\_DOWN  | (a)   | handle  | 265         | `playerevent: 000002B37218F3F0` |         |
| EVENT\_PLAYER\_ARROW\_DOWN\_UP    | (a)   | handle  | 266         | `playerevent: 000002B37218F430` |         |
| EVENT\_PLAYER\_ARROW\_UP\_DOWN    | (a)   | handle  | 267         | `playerevent: 000002B37218F470` |         |
| EVENT\_PLAYER\_ARROW\_UP\_UP      | (a)   | handle  | 268         | `playerevent: 000002B37218F4B0` |         |
| EVENT\_PLAYER\_MOUSE\_DOWN        | (a)   | handle  | 305         | `playerevent: 000002B37218F4F0` |         |
| EVENT\_PLAYER\_MOUSE\_UP          | (a)   | handle  | 306         | `playerevent: 000002B37218F530` |         |
| EVENT\_PLAYER\_MOUSE\_MOVE        | (a)   | handle  | 307         | `playerevent: 000002B37218F570` |         |
| EVENT\_PLAYER\_SYNC\_DATA         | (a)   | handle  | 309         | `playerevent: 000002B37218F5B0` |         |
| EVENT\_PLAYER\_KEY                | (a)   | handle  | 311         | `playerevent: 000002B37218F5F0` |         |
| EVENT\_PLAYER\_KEY\_DOWN          | (a)   | handle  | 312         | `playerevent: 000002B37218F630` |         |
| EVENT\_PLAYER\_KEY\_UP            | (a)   | handle  | 313         | `playerevent: 000002B37218F670` |         |
| -1                                | (a)   | handle  | -1          | `playerevent: 000002B39141DB80` |         |
| past the last constant            | (a)   | handle  | 314         | `playerevent: 000002B38F9563B0` |         |
| 2147483647                        | (a)   | handle  | 2147483647  | `playerevent: 000002B2C525A720` |         |
| -2147483648                       | (a)   | handle  | -2147483648 | `playerevent: 000002B380EDDEE0` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (EVENT\_PLAYER\_STATE\_LIMIT, EVENT\_PLAYER\_ALLIANCE\_CHANGED, EVENT\_PLAYER\_DEFEAT, EVENT\_PLAYER\_VICTORY, EVENT\_PLAYER\_LEAVE, EVENT\_PLAYER\_CHAT, EVENT\_PLAYER\_END\_CINEMATIC, EVENT\_PLAYER\_ARROW\_LEFT\_DOWN, EVENT\_PLAYER\_ARROW\_LEFT\_UP, EVENT\_PLAYER\_ARROW\_RIGHT\_DOWN, EVENT\_PLAYER\_ARROW\_RIGHT\_UP, EVENT\_PLAYER\_ARROW\_DOWN\_DOWN, EVENT\_PLAYER\_ARROW\_DOWN\_UP, EVENT\_PLAYER\_ARROW\_UP\_DOWN, EVENT\_PLAYER\_ARROW\_UP\_UP, EVENT\_PLAYER\_MOUSE\_DOWN, EVENT\_PLAYER\_MOUSE\_UP, EVENT\_PLAYER\_MOUSE\_MOVE, EVENT\_PLAYER\_SYNC\_DATA, EVENT\_PLAYER\_KEY, EVENT\_PLAYER\_KEY\_DOWN, EVENT\_PLAYER\_KEY\_UP, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof.

### `ConvertPlayerUnitEvent`

| Case                                                                                   | Group | Outcome | Id          | Type                                | Message |
| -------------------------------------------------------------------------------------- | ----- | ------- | ----------- | ----------------------------------- | ------- |
| EVENT\_PLAYER\_UNIT\_ATTACKED                                                          | (a)   | handle  | 18          | `playerunitevent: 000002B37218CA50` |         |
| EVENT\_PLAYER\_UNIT\_RESCUED                                                           | (a)   | handle  | 19          | `playerunitevent: 000002B37218CA90` |         |
| EVENT\_PLAYER\_UNIT\_DEATH                                                             | (a)   | handle  | 20          | `playerunitevent: 000002B37218CAD0` |         |
| EVENT\_PLAYER\_UNIT\_DECAY                                                             | (a)   | handle  | 21          | `playerunitevent: 000002B37218CB10` |         |
| EVENT\_PLAYER\_UNIT\_DETECTED                                                          | (a)   | handle  | 22          | `playerunitevent: 000002B37218CB50` |         |
| EVENT\_PLAYER\_UNIT\_HIDDEN                                                            | (a)   | handle  | 23          | `playerunitevent: 000002B37218CCA0` |         |
| EVENT\_PLAYER\_UNIT\_SELECTED                                                          | (a)   | handle  | 24          | `playerunitevent: 000002B37218CCE0` |         |
| EVENT\_PLAYER\_UNIT\_DESELECTED                                                        | (a)   | handle  | 25          | `playerunitevent: 000002B37218CD20` |         |
| EVENT\_PLAYER\_UNIT\_CONSTRUCT\_START                                                  | (a)   | handle  | 26          | `playerunitevent: 000002B37218CD60` |         |
| EVENT\_PLAYER\_UNIT\_CONSTRUCT\_CANCEL                                                 | (a)   | handle  | 27          | `playerunitevent: 000002B37218CFB0` |         |
| EVENT\_PLAYER\_UNIT\_CONSTRUCT\_FINISH                                                 | (a)   | handle  | 28          | `playerunitevent: 000002B37218CFF0` |         |
| EVENT\_PLAYER\_UNIT\_UPGRADE\_START                                                    | (a)   | handle  | 29          | `playerunitevent: 000002B37218D030` |         |
| EVENT\_PLAYER\_UNIT\_UPGRADE\_CANCEL                                                   | (a)   | handle  | 30          | `playerunitevent: 000002B37218D070` |         |
| EVENT\_PLAYER\_UNIT\_UPGRADE\_FINISH                                                   | (a)   | handle  | 31          | `playerunitevent: 000002B37218D0B0` |         |
| EVENT\_PLAYER\_UNIT\_TRAIN\_START                                                      | (a)   | handle  | 32          | `playerunitevent: 000002B37218D0F0` |         |
| EVENT\_PLAYER\_UNIT\_TRAIN\_CANCEL                                                     | (a)   | handle  | 33          | `playerunitevent: 000002B37218D130` |         |
| EVENT\_PLAYER\_UNIT\_TRAIN\_FINISH                                                     | (a)   | handle  | 34          | `playerunitevent: 000002B37218D170` |         |
| EVENT\_PLAYER\_UNIT\_RESEARCH\_START                                                   | (a)   | handle  | 35          | `playerunitevent: 000002B37218D5C0` |         |
| EVENT\_PLAYER\_UNIT\_RESEARCH\_CANCEL                                                  | (a)   | handle  | 36          | `playerunitevent: 000002B37218D600` |         |
| EVENT\_PLAYER\_UNIT\_RESEARCH\_FINISH                                                  | (a)   | handle  | 37          | `playerunitevent: 000002B37218D640` |         |
| EVENT\_PLAYER\_UNIT\_ISSUED\_ORDER                                                     | (a)   | handle  | 38          | `playerunitevent: 000002B37218D680` |         |
| EVENT\_PLAYER\_UNIT\_ISSUED\_POINT\_ORDER                                              | (a)   | handle  | 39          | `playerunitevent: 000002B37218D6C0` |         |
| EVENT\_PLAYER\_UNIT\_ISSUED\_TARGET\_ORDER or EVENT\_PLAYER\_UNIT\_ISSUED\_UNIT\_ORDER | (a)   | handle  | 40          | `playerunitevent: 000002B37218D700` |         |
| EVENT\_PLAYER\_HERO\_LEVEL                                                             | (a)   | handle  | 41          | `playerunitevent: 000002B37218D740` |         |
| EVENT\_PLAYER\_HERO\_SKILL                                                             | (a)   | handle  | 42          | `playerunitevent: 000002B37218D780` |         |
| EVENT\_PLAYER\_HERO\_REVIVABLE                                                         | (a)   | handle  | 43          | `playerunitevent: 000002B37218D7C0` |         |
| EVENT\_PLAYER\_HERO\_REVIVE\_START                                                     | (a)   | handle  | 44          | `playerunitevent: 000002B37218D800` |         |
| EVENT\_PLAYER\_HERO\_REVIVE\_CANCEL                                                    | (a)   | handle  | 45          | `playerunitevent: 000002B37218D840` |         |
| EVENT\_PLAYER\_HERO\_REVIVE\_FINISH                                                    | (a)   | handle  | 46          | `playerunitevent: 000002B37218D880` |         |
| EVENT\_PLAYER\_UNIT\_SUMMON                                                            | (a)   | handle  | 47          | `playerunitevent: 000002B37218D8C0` |         |
| EVENT\_PLAYER\_UNIT\_DROP\_ITEM                                                        | (a)   | handle  | 48          | `playerunitevent: 000002B37218D900` |         |
| EVENT\_PLAYER\_UNIT\_PICKUP\_ITEM                                                      | (a)   | handle  | 49          | `playerunitevent: 000002B37218D940` |         |
| EVENT\_PLAYER\_UNIT\_USE\_ITEM                                                         | (a)   | handle  | 50          | `playerunitevent: 000002B37218D980` |         |
| EVENT\_PLAYER\_UNIT\_LOADED                                                            | (a)   | handle  | 51          | `playerunitevent: 000002B37218DDD0` |         |
| EVENT\_PLAYER\_UNIT\_DAMAGED                                                           | (a)   | handle  | 308         | `playerunitevent: 000002B37218DE10` |         |
| EVENT\_PLAYER\_UNIT\_DAMAGING                                                          | (a)   | handle  | 315         | `playerunitevent: 000002B37218DE50` |         |
| EVENT\_PLAYER\_UNIT\_SELL                                                              | (a)   | handle  | 269         | `playerunitevent: 000002B37218F6B0` |         |
| EVENT\_PLAYER\_UNIT\_CHANGE\_OWNER                                                     | (a)   | handle  | 270         | `playerunitevent: 000002B37218F6F0` |         |
| EVENT\_PLAYER\_UNIT\_SELL\_ITEM                                                        | (a)   | handle  | 271         | `playerunitevent: 000002B37218F730` |         |
| EVENT\_PLAYER\_UNIT\_SPELL\_CHANNEL                                                    | (a)   | handle  | 272         | `playerunitevent: 000002B37218F770` |         |
| EVENT\_PLAYER\_UNIT\_SPELL\_CAST                                                       | (a)   | handle  | 273         | `playerunitevent: 000002B37218F7B0` |         |
| EVENT\_PLAYER\_UNIT\_SPELL\_EFFECT                                                     | (a)   | handle  | 274         | `playerunitevent: 000002B37218F7F0` |         |
| EVENT\_PLAYER\_UNIT\_SPELL\_FINISH                                                     | (a)   | handle  | 275         | `playerunitevent: 000002B37218F830` |         |
| EVENT\_PLAYER\_UNIT\_SPELL\_ENDCAST                                                    | (a)   | handle  | 276         | `playerunitevent: 000002B37218F870` |         |
| EVENT\_PLAYER\_UNIT\_PAWN\_ITEM                                                        | (a)   | handle  | 277         | `playerunitevent: 000002B37218F8B0` |         |
| EVENT\_PLAYER\_UNIT\_STACK\_ITEM                                                       | (a)   | handle  | 319         | `playerunitevent: 000002B37218F8F0` |         |
| EVENT\_PLAYER\_UNIT\_EQUIP\_ITEM                                                       | (a)   | handle  | 321         | `playerunitevent: 000002B37218F930` |         |
| EVENT\_PLAYER\_UNIT\_UNEQUIP\_ITEM                                                     | (a)   | handle  | 323         | `playerunitevent: 000002B37218F970` |         |
| -1                                                                                     | (a)   | handle  | -1          | `playerunitevent: 000002B380E35400` |         |
| past the last constant                                                                 | (a)   | handle  | 324         | `playerunitevent: 000002B380E306A0` |         |
| 2147483647                                                                             | (a)   | handle  | 2147483647  | `playerunitevent: 000002B380E28440` |         |
| -2147483648                                                                            | (a)   | handle  | -2147483648 | `playerunitevent: 000002B380E22420` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (EVENT\_PLAYER\_UNIT\_ATTACKED, EVENT\_PLAYER\_UNIT\_RESCUED, EVENT\_PLAYER\_UNIT\_DEATH, EVENT\_PLAYER\_UNIT\_DECAY, EVENT\_PLAYER\_UNIT\_DETECTED, EVENT\_PLAYER\_UNIT\_HIDDEN, EVENT\_PLAYER\_UNIT\_SELECTED, EVENT\_PLAYER\_UNIT\_DESELECTED, EVENT\_PLAYER\_UNIT\_CONSTRUCT\_START, EVENT\_PLAYER\_UNIT\_CONSTRUCT\_CANCEL, EVENT\_PLAYER\_UNIT\_CONSTRUCT\_FINISH, EVENT\_PLAYER\_UNIT\_UPGRADE\_START, EVENT\_PLAYER\_UNIT\_UPGRADE\_CANCEL, EVENT\_PLAYER\_UNIT\_UPGRADE\_FINISH, EVENT\_PLAYER\_UNIT\_TRAIN\_START, EVENT\_PLAYER\_UNIT\_TRAIN\_CANCEL, EVENT\_PLAYER\_UNIT\_TRAIN\_FINISH, EVENT\_PLAYER\_UNIT\_RESEARCH\_START, EVENT\_PLAYER\_UNIT\_RESEARCH\_CANCEL, EVENT\_PLAYER\_UNIT\_RESEARCH\_FINISH, EVENT\_PLAYER\_UNIT\_ISSUED\_ORDER, EVENT\_PLAYER\_UNIT\_ISSUED\_POINT\_ORDER, EVENT\_PLAYER\_UNIT\_ISSUED\_TARGET\_ORDER or EVENT\_PLAYER\_UNIT\_ISSUED\_UNIT\_ORDER, EVENT\_PLAYER\_HERO\_LEVEL, EVENT\_PLAYER\_HERO\_SKILL, EVENT\_PLAYER\_HERO\_REVIVABLE, EVENT\_PLAYER\_HERO\_REVIVE\_START, EVENT\_PLAYER\_HERO\_REVIVE\_CANCEL, EVENT\_PLAYER\_HERO\_REVIVE\_FINISH, EVENT\_PLAYER\_UNIT\_SUMMON, EVENT\_PLAYER\_UNIT\_DROP\_ITEM, EVENT\_PLAYER\_UNIT\_PICKUP\_ITEM, EVENT\_PLAYER\_UNIT\_USE\_ITEM, EVENT\_PLAYER\_UNIT\_LOADED, EVENT\_PLAYER\_UNIT\_DAMAGED, EVENT\_PLAYER\_UNIT\_DAMAGING, EVENT\_PLAYER\_UNIT\_SELL, EVENT\_PLAYER\_UNIT\_CHANGE\_OWNER, EVENT\_PLAYER\_UNIT\_SELL\_ITEM, EVENT\_PLAYER\_UNIT\_SPELL\_CHANNEL, EVENT\_PLAYER\_UNIT\_SPELL\_CAST, EVENT\_PLAYER\_UNIT\_SPELL\_EFFECT, EVENT\_PLAYER\_UNIT\_SPELL\_FINISH, EVENT\_PLAYER\_UNIT\_SPELL\_ENDCAST, EVENT\_PLAYER\_UNIT\_PAWN\_ITEM, EVENT\_PLAYER\_UNIT\_STACK\_ITEM, EVENT\_PLAYER\_UNIT\_EQUIP\_ITEM, EVENT\_PLAYER\_UNIT\_UNEQUIP\_ITEM, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof.

### `ConvertWidgetEvent`

| Case                   | Group | Outcome | Id          | Type                            | Message |
| ---------------------- | ----- | ------- | ----------- | ------------------------------- | ------- |
| EVENT\_WIDGET\_DEATH   | (a)   | handle  | 89          | `widgetevent: 000002B37218F070` |         |
| -1                     | (a)   | handle  | -1          | `widgetevent: 000002B380E103B0` |         |
| past the last constant | (a)   | handle  | 90          | `widgetevent: 000002B380E09CF0` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `widgetevent: 000002B38068C360` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `widgetevent: 000002B3806836C0` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (EVENT\_WIDGET\_DEATH, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof.

### `ConvertDialogEvent`

| Case                         | Group | Outcome | Id          | Type                            | Message |
| ---------------------------- | ----- | ------- | ----------- | ------------------------------- | ------- |
| EVENT\_DIALOG\_BUTTON\_CLICK | (a)   | handle  | 90          | `dialogevent: 000002B37218F0B0` |         |
| EVENT\_DIALOG\_CLICK         | (a)   | handle  | 91          | `dialogevent: 000002B37218F120` |         |
| -1                           | (a)   | handle  | -1          | `dialogevent: 000002B380669FA0` |         |
| past the last constant       | (a)   | handle  | 92          | `dialogevent: 000002B38066B3A0` |         |
| 2147483647                   | (a)   | handle  | 2147483647  | `dialogevent: 000002B38065DB80` |         |
| -2147483648                  | (a)   | handle  | -2147483648 | `dialogevent: 000002B380805630` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (EVENT\_DIALOG\_BUTTON\_CLICK, EVENT\_DIALOG\_CLICK, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof.

### `ConvertUnitEvent`

| Case                               | Group | Outcome | Id          | Type                          | Message |
| ---------------------------------- | ----- | ------- | ----------- | ----------------------------- | ------- |
| EVENT\_UNIT\_DAMAGED               | (a)   | handle  | 52          | `unitevent: 000002B37218DE90` |         |
| EVENT\_UNIT\_DAMAGING              | (a)   | handle  | 314         | `unitevent: 000002B37218DED0` |         |
| EVENT\_UNIT\_DEATH                 | (a)   | handle  | 53          | `unitevent: 000002B37218DF60` |         |
| EVENT\_UNIT\_DECAY                 | (a)   | handle  | 54          | `unitevent: 000002B37218DFA0` |         |
| EVENT\_UNIT\_DETECTED              | (a)   | handle  | 55          | `unitevent: 000002B37218DFE0` |         |
| EVENT\_UNIT\_HIDDEN                | (a)   | handle  | 56          | `unitevent: 000002B37218E020` |         |
| EVENT\_UNIT\_SELECTED              | (a)   | handle  | 57          | `unitevent: 000002B37218E060` |         |
| EVENT\_UNIT\_DESELECTED            | (a)   | handle  | 58          | `unitevent: 000002B37218E0A0` |         |
| EVENT\_UNIT\_STATE\_LIMIT          | (a)   | handle  | 59          | `unitevent: 000002B37218E0E0` |         |
| EVENT\_UNIT\_ACQUIRED\_TARGET      | (a)   | handle  | 60          | `unitevent: 000002B37218E120` |         |
| EVENT\_UNIT\_TARGET\_IN\_RANGE     | (a)   | handle  | 61          | `unitevent: 000002B37218E160` |         |
| EVENT\_UNIT\_ATTACKED              | (a)   | handle  | 62          | `unitevent: 000002B37218E1A0` |         |
| EVENT\_UNIT\_RESCUED               | (a)   | handle  | 63          | `unitevent: 000002B37218E1E0` |         |
| EVENT\_UNIT\_CONSTRUCT\_CANCEL     | (a)   | handle  | 64          | `unitevent: 000002B37218E220` |         |
| EVENT\_UNIT\_CONSTRUCT\_FINISH     | (a)   | handle  | 65          | `unitevent: 000002B37218E260` |         |
| EVENT\_UNIT\_UPGRADE\_START        | (a)   | handle  | 66          | `unitevent: 000002B37218E2A0` |         |
| EVENT\_UNIT\_UPGRADE\_CANCEL       | (a)   | handle  | 67          | `unitevent: 000002B37218E2E0` |         |
| EVENT\_UNIT\_UPGRADE\_FINISH       | (a)   | handle  | 68          | `unitevent: 000002B37218E320` |         |
| EVENT\_UNIT\_TRAIN\_START          | (a)   | handle  | 69          | `unitevent: 000002B37218E360` |         |
| EVENT\_UNIT\_TRAIN\_CANCEL         | (a)   | handle  | 70          | `unitevent: 000002B37218E3A0` |         |
| EVENT\_UNIT\_TRAIN\_FINISH         | (a)   | handle  | 71          | `unitevent: 000002B37218E3E0` |         |
| EVENT\_UNIT\_RESEARCH\_START       | (a)   | handle  | 72          | `unitevent: 000002B37218E420` |         |
| EVENT\_UNIT\_RESEARCH\_CANCEL      | (a)   | handle  | 73          | `unitevent: 000002B37218E460` |         |
| EVENT\_UNIT\_RESEARCH\_FINISH      | (a)   | handle  | 74          | `unitevent: 000002B37218E4A0` |         |
| EVENT\_UNIT\_ISSUED\_ORDER         | (a)   | handle  | 75          | `unitevent: 000002B37218E4E0` |         |
| EVENT\_UNIT\_ISSUED\_POINT\_ORDER  | (a)   | handle  | 76          | `unitevent: 000002B37218E520` |         |
| EVENT\_UNIT\_ISSUED\_TARGET\_ORDER | (a)   | handle  | 77          | `unitevent: 000002B37218E560` |         |
| EVENT\_UNIT\_HERO\_LEVEL           | (a)   | handle  | 78          | `unitevent: 000002B37218E5A0` |         |
| EVENT\_UNIT\_HERO\_SKILL           | (a)   | handle  | 79          | `unitevent: 000002B37218E5E0` |         |
| EVENT\_UNIT\_HERO\_REVIVABLE       | (a)   | handle  | 80          | `unitevent: 000002B37218E620` |         |
| EVENT\_UNIT\_HERO\_REVIVE\_START   | (a)   | handle  | 81          | `unitevent: 000002B37218E660` |         |
| EVENT\_UNIT\_HERO\_REVIVE\_CANCEL  | (a)   | handle  | 82          | `unitevent: 000002B37218E6A0` |         |
| EVENT\_UNIT\_HERO\_REVIVE\_FINISH  | (a)   | handle  | 83          | `unitevent: 000002B37218E6E0` |         |
| EVENT\_UNIT\_SUMMON                | (a)   | handle  | 84          | `unitevent: 000002B37218EF30` |         |
| EVENT\_UNIT\_DROP\_ITEM            | (a)   | handle  | 85          | `unitevent: 000002B37218EF70` |         |
| EVENT\_UNIT\_PICKUP\_ITEM          | (a)   | handle  | 86          | `unitevent: 000002B37218EFB0` |         |
| EVENT\_UNIT\_USE\_ITEM             | (a)   | handle  | 87          | `unitevent: 000002B37218EFF0` |         |
| EVENT\_UNIT\_LOADED                | (a)   | handle  | 88          | `unitevent: 000002B37218F030` |         |
| EVENT\_UNIT\_SELL                  | (a)   | handle  | 286         | `unitevent: 000002B37218F9B0` |         |
| EVENT\_UNIT\_CHANGE\_OWNER         | (a)   | handle  | 287         | `unitevent: 000002B37218F9F0` |         |
| EVENT\_UNIT\_SELL\_ITEM            | (a)   | handle  | 288         | `unitevent: 000002B37218FA30` |         |
| EVENT\_UNIT\_SPELL\_CHANNEL        | (a)   | handle  | 289         | `unitevent: 000002B37218FA70` |         |
| EVENT\_UNIT\_SPELL\_CAST           | (a)   | handle  | 290         | `unitevent: 000002B37218FAB0` |         |
| EVENT\_UNIT\_SPELL\_EFFECT         | (a)   | handle  | 291         | `unitevent: 000002B37218FAF0` |         |
| EVENT\_UNIT\_SPELL\_FINISH         | (a)   | handle  | 292         | `unitevent: 000002B37218FB30` |         |
| EVENT\_UNIT\_SPELL\_ENDCAST        | (a)   | handle  | 293         | `unitevent: 000002B37218FB70` |         |
| EVENT\_UNIT\_PAWN\_ITEM            | (a)   | handle  | 294         | `unitevent: 000002B37218FBB0` |         |
| EVENT\_UNIT\_STACK\_ITEM           | (a)   | handle  | 318         | `unitevent: 000002B37218FBF0` |         |
| EVENT\_UNIT\_EQUIP\_ITEM           | (a)   | handle  | 320         | `unitevent: 000002B37218FC30` |         |
| EVENT\_UNIT\_UNEQUIP\_ITEM         | (a)   | handle  | 322         | `unitevent: 000002B37218FC70` |         |
| -1                                 | (a)   | handle  | -1          | `unitevent: 000002B3903D6310` |         |
| past the last constant             | (a)   | handle  | 323         | `unitevent: 000002B3903EEB30` |         |
| 2147483647                         | (a)   | handle  | 2147483647  | `unitevent: 000002B3903D95C0` |         |
| -2147483648                        | (a)   | handle  | -2147483648 | `unitevent: 000002B3903C7780` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (EVENT\_UNIT\_DAMAGED, EVENT\_UNIT\_DAMAGING, EVENT\_UNIT\_DEATH, EVENT\_UNIT\_DECAY, EVENT\_UNIT\_DETECTED, EVENT\_UNIT\_HIDDEN, EVENT\_UNIT\_SELECTED, EVENT\_UNIT\_DESELECTED, EVENT\_UNIT\_STATE\_LIMIT, EVENT\_UNIT\_ACQUIRED\_TARGET, EVENT\_UNIT\_TARGET\_IN\_RANGE, EVENT\_UNIT\_ATTACKED, EVENT\_UNIT\_RESCUED, EVENT\_UNIT\_CONSTRUCT\_CANCEL, EVENT\_UNIT\_CONSTRUCT\_FINISH, EVENT\_UNIT\_UPGRADE\_START, EVENT\_UNIT\_UPGRADE\_CANCEL, EVENT\_UNIT\_UPGRADE\_FINISH, EVENT\_UNIT\_TRAIN\_START, EVENT\_UNIT\_TRAIN\_CANCEL, EVENT\_UNIT\_TRAIN\_FINISH, EVENT\_UNIT\_RESEARCH\_START, EVENT\_UNIT\_RESEARCH\_CANCEL, EVENT\_UNIT\_RESEARCH\_FINISH, EVENT\_UNIT\_ISSUED\_ORDER, EVENT\_UNIT\_ISSUED\_POINT\_ORDER, EVENT\_UNIT\_ISSUED\_TARGET\_ORDER, EVENT\_UNIT\_HERO\_LEVEL, EVENT\_UNIT\_HERO\_SKILL, EVENT\_UNIT\_HERO\_REVIVABLE, EVENT\_UNIT\_HERO\_REVIVE\_START, EVENT\_UNIT\_HERO\_REVIVE\_CANCEL, EVENT\_UNIT\_HERO\_REVIVE\_FINISH, EVENT\_UNIT\_SUMMON, EVENT\_UNIT\_DROP\_ITEM, EVENT\_UNIT\_PICKUP\_ITEM, EVENT\_UNIT\_USE\_ITEM, EVENT\_UNIT\_LOADED, EVENT\_UNIT\_SELL, EVENT\_UNIT\_CHANGE\_OWNER, EVENT\_UNIT\_SELL\_ITEM, EVENT\_UNIT\_SPELL\_CHANNEL, EVENT\_UNIT\_SPELL\_CAST, EVENT\_UNIT\_SPELL\_EFFECT, EVENT\_UNIT\_SPELL\_FINISH, EVENT\_UNIT\_SPELL\_ENDCAST, EVENT\_UNIT\_PAWN\_ITEM, EVENT\_UNIT\_STACK\_ITEM, EVENT\_UNIT\_EQUIP\_ITEM, EVENT\_UNIT\_UNEQUIP\_ITEM, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof.

### `ConvertLimitOp`

| Case                     | Group | Outcome | Id          | Type                        | Message |
| ------------------------ | ----- | ------- | ----------- | --------------------------- | ------- |
| LESS\_THAN               | (a)   | handle  | 0           | `limitop: 000002B37218FCB0` |         |
| LESS\_THAN\_OR\_EQUAL    | (a)   | handle  | 1           | `limitop: 000002B37218FCF0` |         |
| EQUAL                    | (a)   | handle  | 2           | `limitop: 000002B37218FD30` |         |
| GREATER\_THAN\_OR\_EQUAL | (a)   | handle  | 3           | `limitop: 000002B37218FDB0` |         |
| GREATER\_THAN            | (a)   | handle  | 4           | `limitop: 000002B37218FD70` |         |
| NOT\_EQUAL               | (a)   | handle  | 5           | `limitop: 000002B37218FE50` |         |
| -1                       | (a)   | handle  | -1          | `limitop: 000002B38066D3D0` |         |
| past the last constant   | (a)   | handle  | 6           | `limitop: 000002B38066A880` |         |
| 2147483647               | (a)   | handle  | 2147483647  | `limitop: 000002B3806741D0` |         |
| -2147483648              | (a)   | handle  | -2147483648 | `limitop: 000002B380806AC0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (LESS\_THAN, LESS\_THAN\_OR\_EQUAL, EQUAL, GREATER\_THAN\_OR\_EQUAL, GREATER\_THAN, NOT\_EQUAL, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof. For LESS\_THAN, a handle of id 0.

### `ConvertUnitType`

| Case                         | Group | Outcome | Id          | Type                         | Message |
| ---------------------------- | ----- | ------- | ----------- | ---------------------------- | ------- |
| UNIT\_TYPE\_HERO             | (a)   | handle  | 0           | `unittype: 000002B37218FF30` |         |
| UNIT\_TYPE\_DEAD             | (a)   | handle  | 1           | `unittype: 000002B37218FF70` |         |
| UNIT\_TYPE\_STRUCTURE        | (a)   | handle  | 2           | `unittype: 000002B37218FFE0` |         |
| UNIT\_TYPE\_FLYING           | (a)   | handle  | 3           | `unittype: 000002B372190060` |         |
| UNIT\_TYPE\_GROUND           | (a)   | handle  | 4           | `unittype: 000002B372190020` |         |
| UNIT\_TYPE\_ATTACKS\_FLYING  | (a)   | handle  | 5           | `unittype: 000002B3721900A0` |         |
| UNIT\_TYPE\_ATTACKS\_GROUND  | (a)   | handle  | 6           | `unittype: 000002B372190180` |         |
| UNIT\_TYPE\_MELEE\_ATTACKER  | (a)   | handle  | 7           | `unittype: 000002B3721901C0` |         |
| UNIT\_TYPE\_RANGED\_ATTACKER | (a)   | handle  | 8           | `unittype: 000002B372190200` |         |
| UNIT\_TYPE\_GIANT            | (a)   | handle  | 9           | `unittype: 000002B372190240` |         |
| UNIT\_TYPE\_SUMMONED         | (a)   | handle  | 10          | `unittype: 000002B3721903A0` |         |
| UNIT\_TYPE\_STUNNED          | (a)   | handle  | 11          | `unittype: 000002B3721903E0` |         |
| UNIT\_TYPE\_PLAGUED          | (a)   | handle  | 12          | `unittype: 000002B372190420` |         |
| UNIT\_TYPE\_SNARED           | (a)   | handle  | 13          | `unittype: 000002B372190460` |         |
| UNIT\_TYPE\_UNDEAD           | (a)   | handle  | 14          | `unittype: 000002B3721904A0` |         |
| UNIT\_TYPE\_MECHANICAL       | (a)   | handle  | 15          | `unittype: 000002B3721904E0` |         |
| UNIT\_TYPE\_PEON             | (a)   | handle  | 16          | `unittype: 000002B372190520` |         |
| UNIT\_TYPE\_SAPPER           | (a)   | handle  | 17          | `unittype: 000002B372190560` |         |
| UNIT\_TYPE\_TOWNHALL         | (a)   | handle  | 18          | `unittype: 000002B3721907C0` |         |
| UNIT\_TYPE\_ANCIENT          | (a)   | handle  | 19          | `unittype: 000002B372190800` |         |
| UNIT\_TYPE\_TAUREN           | (a)   | handle  | 20          | `unittype: 000002B372190840` |         |
| UNIT\_TYPE\_POISONED         | (a)   | handle  | 21          | `unittype: 000002B372190880` |         |
| UNIT\_TYPE\_POLYMORPHED      | (a)   | handle  | 22          | `unittype: 000002B3721908C0` |         |
| UNIT\_TYPE\_SLEEPING         | (a)   | handle  | 23          | `unittype: 000002B372190900` |         |
| UNIT\_TYPE\_RESISTANT        | (a)   | handle  | 24          | `unittype: 000002B372190940` |         |
| UNIT\_TYPE\_ETHEREAL         | (a)   | handle  | 25          | `unittype: 000002B372190980` |         |
| UNIT\_TYPE\_MAGIC\_IMMUNE    | (a)   | handle  | 26          | `unittype: 000002B3721909C0` |         |
| -1                           | (a)   | handle  | -1          | `unittype: 000002B38F78CB50` |         |
| past the last constant       | (a)   | handle  | 27          | `unittype: 000002B37F9DD160` |         |
| 2147483647                   | (a)   | handle  | 2147483647  | `unittype: 000002B380E10E60` |         |
| -2147483648                  | (a)   | handle  | -2147483648 | `unittype: 000002B37499F530` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (UNIT\_TYPE\_HERO, UNIT\_TYPE\_DEAD, UNIT\_TYPE\_STRUCTURE, UNIT\_TYPE\_FLYING, UNIT\_TYPE\_GROUND, UNIT\_TYPE\_ATTACKS\_FLYING, UNIT\_TYPE\_ATTACKS\_GROUND, UNIT\_TYPE\_MELEE\_ATTACKER, UNIT\_TYPE\_RANGED\_ATTACKER, UNIT\_TYPE\_GIANT, UNIT\_TYPE\_SUMMONED, UNIT\_TYPE\_STUNNED, UNIT\_TYPE\_PLAGUED, UNIT\_TYPE\_SNARED, UNIT\_TYPE\_UNDEAD, UNIT\_TYPE\_MECHANICAL, UNIT\_TYPE\_PEON, UNIT\_TYPE\_SAPPER, UNIT\_TYPE\_TOWNHALL, UNIT\_TYPE\_ANCIENT, UNIT\_TYPE\_TAUREN, UNIT\_TYPE\_POISONED, UNIT\_TYPE\_POLYMORPHED, UNIT\_TYPE\_SLEEPING, UNIT\_TYPE\_RESISTANT, UNIT\_TYPE\_ETHEREAL, UNIT\_TYPE\_MAGIC\_IMMUNE, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof. For UNIT\_TYPE\_HERO, a handle of id 0.

### `ConvertGameSpeed`

| Case                   | Group | Outcome | Id          | Type                          | Message |
| ---------------------- | ----- | ------- | ----------- | ----------------------------- | ------- |
| MAP\_SPEED\_SLOWEST    | (a)   | handle  | 0           | `gamespeed: 000002B374A2C740` |         |
| MAP\_SPEED\_SLOW       | (a)   | handle  | 1           | `gamespeed: 000002B374A2C820` |         |
| MAP\_SPEED\_NORMAL     | (a)   | handle  | 2           | `gamespeed: 000002B374A2C890` |         |
| MAP\_SPEED\_FAST       | (a)   | handle  | 3           | `gamespeed: 000002B374A2C910` |         |
| MAP\_SPEED\_FASTEST    | (a)   | handle  | 4           | `gamespeed: 000002B374A2C8D0` |         |
| -1                     | (a)   | handle  | -1          | `gamespeed: 000002B380EBA7D0` |         |
| past the last constant | (a)   | handle  | 5           | `gamespeed: 000002B2C5257C00` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `gamespeed: 000002B37EFDF010` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `gamespeed: 000002B39140EB30` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (MAP\_SPEED\_SLOWEST, MAP\_SPEED\_SLOW, MAP\_SPEED\_NORMAL, MAP\_SPEED\_FAST, MAP\_SPEED\_FASTEST, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof. For MAP\_SPEED\_SLOWEST, a handle of id 0.

### `ConvertPlacement`

| Case                               | Group | Outcome | Id          | Type                          | Message |
| ---------------------------------- | ----- | ------- | ----------- | ----------------------------- | ------- |
| MAP\_PLACEMENT\_RANDOM             | (a)   | handle  | 0           | `placement: 000002B374A2C200` |         |
| MAP\_PLACEMENT\_FIXED              | (a)   | handle  | 1           | `placement: 000002B374A2C240` |         |
| MAP\_PLACEMENT\_USE\_MAP\_SETTINGS | (a)   | handle  | 2           | `placement: 000002B374A2C2B0` |         |
| MAP\_PLACEMENT\_TEAMS\_TOGETHER    | (a)   | handle  | 3           | `placement: 000002B374A2C330` |         |
| -1                                 | (a)   | handle  | -1          | `placement: 000002B380A6E710` |         |
| past the last constant             | (a)   | handle  | 4           | `placement: 000002B3903AD850` |         |
| 2147483647                         | (a)   | handle  | 2147483647  | `placement: 000002B3903ACF50` |         |
| -2147483648                        | (a)   | handle  | -2147483648 | `placement: 000002B380ED2000` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (MAP\_PLACEMENT\_RANDOM, MAP\_PLACEMENT\_FIXED, MAP\_PLACEMENT\_USE\_MAP\_SETTINGS, MAP\_PLACEMENT\_TEAMS\_TOGETHER, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof. For MAP\_PLACEMENT\_RANDOM, a handle of id 0.

### `ConvertStartLocPrio`

| Case                   | Group | Outcome | Id          | Type                             | Message |
| ---------------------- | ----- | ------- | ----------- | -------------------------------- | ------- |
| MAP\_LOC\_PRIO\_LOW    | (a)   | handle  | 0           | `startlocprio: 000002B374A2C2F0` |         |
| MAP\_LOC\_PRIO\_HIGH   | (a)   | handle  | 1           | `startlocprio: 000002B374A2C3D0` |         |
| MAP\_LOC\_PRIO\_NOT    | (a)   | handle  | 2           | `startlocprio: 000002B374A2C440` |         |
| -1                     | (a)   | handle  | -1          | `startlocprio: 000002B380D71290` |         |
| past the last constant | (a)   | handle  | 3           | `startlocprio: 000002B3747BF4E0` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `startlocprio: 000002B3747A2EF0` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `startlocprio: 000002B2C5253C10` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (MAP\_LOC\_PRIO\_LOW, MAP\_LOC\_PRIO\_HIGH, MAP\_LOC\_PRIO\_NOT, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof. For MAP\_LOC\_PRIO\_LOW, a handle of id 0.

### `ConvertGameDifficulty`

| Case                    | Group | Outcome | Id          | Type                               | Message |
| ----------------------- | ----- | ------- | ----------- | ---------------------------------- | ------- |
| MAP\_DIFFICULTY\_EASY   | (a)   | handle  | 0           | `gamedifficulty: 000002B374A2C5B0` |         |
| MAP\_DIFFICULTY\_NORMAL | (a)   | handle  | 1           | `gamedifficulty: 000002B374A2C690` |         |
| MAP\_DIFFICULTY\_HARD   | (a)   | handle  | 2           | `gamedifficulty: 000002B374A2C700` |         |
| MAP\_DIFFICULTY\_INSANE | (a)   | handle  | 3           | `gamedifficulty: 000002B374A2C780` |         |
| -1                      | (a)   | handle  | -1          | `gamedifficulty: 000002B3747ABDA0` |         |
| past the last constant  | (a)   | handle  | 4           | `gamedifficulty: 000002B3724E3B50` |         |
| 2147483647              | (a)   | handle  | 2147483647  | `gamedifficulty: 000002B3724E70E0` |         |
| -2147483648             | (a)   | handle  | -2147483648 | `gamedifficulty: 000002B3747ABF80` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (MAP\_DIFFICULTY\_EASY, MAP\_DIFFICULTY\_NORMAL, MAP\_DIFFICULTY\_HARD, MAP\_DIFFICULTY\_INSANE, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof. For MAP\_DIFFICULTY\_EASY, a handle of id 0.

### `ConvertGameType`

| Case                           | Group | Outcome | Id          | Type                         | Message |
| ------------------------------ | ----- | ------- | ----------- | ---------------------------- | ------- |
| GAME\_TYPE\_MELEE              | (a)   | handle  | 1           | `gametype: 000002B374A2BAE0` |         |
| GAME\_TYPE\_FFA                | (a)   | handle  | 2           | `gametype: 000002B374A2BB20` |         |
| GAME\_TYPE\_USE\_MAP\_SETTINGS | (a)   | handle  | 4           | `gametype: 000002B374A2BBA0` |         |
| GAME\_TYPE\_BLIZ               | (a)   | handle  | 8           | `gametype: 000002B374A2BB60` |         |
| GAME\_TYPE\_ONE\_ON\_ONE       | (a)   | handle  | 16          | `gametype: 000002B374A2BBE0` |         |
| GAME\_TYPE\_TWO\_TEAM\_PLAY    | (a)   | handle  | 32          | `gametype: 000002B374A2BC20` |         |
| GAME\_TYPE\_THREE\_TEAM\_PLAY  | (a)   | handle  | 64          | `gametype: 000002B374A2BC60` |         |
| GAME\_TYPE\_FOUR\_TEAM\_PLAY   | (a)   | handle  | 128         | `gametype: 000002B374A2BCA0` |         |
| -1                             | (a)   | handle  | -1          | `gametype: 000002B3747A1F80` |         |
| past the last constant         | (a)   | handle  | 129         | `gametype: 000002B380DCEEB0` |         |
| 2147483647                     | (a)   | handle  | 2147483647  | `gametype: 000002B380DD2170` |         |
| -2147483648                    | (a)   | handle  | -2147483648 | `gametype: 000002B380DD10A0` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (GAME\_TYPE\_MELEE, GAME\_TYPE\_FFA, GAME\_TYPE\_USE\_MAP\_SETTINGS, GAME\_TYPE\_BLIZ, GAME\_TYPE\_ONE\_ON\_ONE, GAME\_TYPE\_TWO\_TEAM\_PLAY, GAME\_TYPE\_THREE\_TEAM\_PLAY, GAME\_TYPE\_FOUR\_TEAM\_PLAY, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof.

### `ConvertMapFlag`

| Case                                 | Group | Outcome | Id          | Type                        | Message |
| ------------------------------------ | ----- | ------- | ----------- | --------------------------- | ------- |
| MAP\_FOG\_HIDE\_TERRAIN              | (a)   | handle  | 1           | `mapflag: 000002B374A2BCE0` |         |
| MAP\_FOG\_MAP\_EXPLORED              | (a)   | handle  | 2           | `mapflag: 000002B374A2BD20` |         |
| MAP\_FOG\_ALWAYS\_VISIBLE            | (a)   | handle  | 4           | `mapflag: 000002B374A2BDA0` |         |
| MAP\_USE\_HANDICAPS                  | (a)   | handle  | 8           | `mapflag: 000002B374A2BD60` |         |
| MAP\_OBSERVERS                       | (a)   | handle  | 16          | `mapflag: 000002B374A2BE40` |         |
| MAP\_OBSERVERS\_ON\_DEATH            | (a)   | handle  | 32          | `mapflag: 000002B374A2BE80` |         |
| MAP\_FIXED\_COLORS                   | (a)   | handle  | 128         | `mapflag: 000002B374A2BEC0` |         |
| MAP\_LOCK\_RESOURCE\_TRADING         | (a)   | handle  | 256         | `mapflag: 000002B374A2BF00` |         |
| MAP\_RESOURCE\_TRADING\_ALLIES\_ONLY | (a)   | handle  | 512         | `mapflag: 000002B374A2BF40` |         |
| MAP\_LOCK\_ALLIANCE\_CHANGES         | (a)   | handle  | 1024        | `mapflag: 000002B374A2BF80` |         |
| MAP\_ALLIANCE\_CHANGES\_HIDDEN       | (a)   | handle  | 2048        | `mapflag: 000002B374A2BFC0` |         |
| MAP\_CHEATS                          | (a)   | handle  | 4096        | `mapflag: 000002B374A2C000` |         |
| MAP\_CHEATS\_HIDDEN                  | (a)   | handle  | 8192        | `mapflag: 000002B374A2C040` |         |
| MAP\_LOCK\_SPEED                     | (a)   | handle  | 16384       | `mapflag: 000002B374A2C080` |         |
| MAP\_LOCK\_RANDOM\_SEED              | (a)   | handle  | 32768       | `mapflag: 000002B374A2C0C0` |         |
| MAP\_SHARED\_ADVANCED\_CONTROL       | (a)   | handle  | 65536       | `mapflag: 000002B374A2C100` |         |
| MAP\_RANDOM\_HERO                    | (a)   | handle  | 131072      | `mapflag: 000002B374A2C140` |         |
| MAP\_RANDOM\_RACES                   | (a)   | handle  | 262144      | `mapflag: 000002B374A2C180` |         |
| MAP\_RELOADED                        | (a)   | handle  | 524288      | `mapflag: 000002B374A2C1C0` |         |
| -1                                   | (a)   | handle  | -1          | `mapflag: 000002B39145ECA0` |         |
| past the last constant               | (a)   | handle  | 524289      | `mapflag: 000002B39145B7F0` |         |
| 2147483647                           | (a)   | handle  | 2147483647  | `mapflag: 000002B3914619E0` |         |
| -2147483648                          | (a)   | handle  | -2147483648 | `mapflag: 000002B39146C200` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (MAP\_FOG\_HIDE\_TERRAIN, MAP\_FOG\_MAP\_EXPLORED, MAP\_FOG\_ALWAYS\_VISIBLE, MAP\_USE\_HANDICAPS, MAP\_OBSERVERS, MAP\_OBSERVERS\_ON\_DEATH, MAP\_FIXED\_COLORS, MAP\_LOCK\_RESOURCE\_TRADING, MAP\_RESOURCE\_TRADING\_ALLIES\_ONLY, MAP\_LOCK\_ALLIANCE\_CHANGES, MAP\_ALLIANCE\_CHANGES\_HIDDEN, MAP\_CHEATS, MAP\_CHEATS\_HIDDEN, MAP\_LOCK\_SPEED, MAP\_LOCK\_RANDOM\_SEED, MAP\_SHARED\_ADVANCED\_CONTROL, MAP\_RANDOM\_HERO, MAP\_RANDOM\_RACES, MAP\_RELOADED, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof.

### `ConvertMapVisibility`

| Case       | Group | Outcome | Id         | Type                              | Message |
| ---------- | ----- | ------- | ---------- | --------------------------------- | ------- |
| 0          | (a)   | handle  | 0          | `mapvisibility: 000002B3914674D0` |         |
| 1          | (a)   | handle  | 1          | `mapvisibility: 000002B391466A90` |         |
| -1         | (a)   | handle  | -1         | `mapvisibility: 000002B391469E00` |         |
| 2147483647 | (a)   | handle  | 2147483647 | `mapvisibility: 000002B3914746F0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (0, 1, -1, 2147483647) on 3.0.0.24268; evidence, not proof. For 0, a handle of id 0.

### `ConvertMapSetting`

| Case       | Group | Outcome | Id         | Type                           | Message |
| ---------- | ----- | ------- | ---------- | ------------------------------ | ------- |
| 0          | (a)   | handle  | 0          | `mapsetting: 000002B3914704F0` |         |
| 1          | (a)   | handle  | 1          | `mapsetting: 000002B391465C10` |         |
| -1         | (a)   | handle  | -1         | `mapsetting: 000002B391472000` |         |
| 2147483647 | (a)   | handle  | 2147483647 | `mapsetting: 000002B391474B30` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (0, 1, -1, 2147483647) on 3.0.0.24268; evidence, not proof. For 0, a handle of id 0.

### `ConvertMapDensity`

| Case                   | Group | Outcome | Id          | Type                           | Message |
| ---------------------- | ----- | ------- | ----------- | ------------------------------ | ------- |
| MAP\_DENSITY\_NONE     | (a)   | handle  | 0           | `mapdensity: 000002B374A2C4C0` |         |
| MAP\_DENSITY\_LIGHT    | (a)   | handle  | 1           | `mapdensity: 000002B374A2C500` |         |
| MAP\_DENSITY\_MEDIUM   | (a)   | handle  | 2           | `mapdensity: 000002B374A2C570` |         |
| MAP\_DENSITY\_HEAVY    | (a)   | handle  | 3           | `mapdensity: 000002B374A2C5F0` |         |
| -1                     | (a)   | handle  | -1          | `mapdensity: 000002B391480FD0` |         |
| past the last constant | (a)   | handle  | 4           | `mapdensity: 000002B39147AE00` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `mapdensity: 000002B3914801C0` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `mapdensity: 000002B391485A80` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (MAP\_DENSITY\_NONE, MAP\_DENSITY\_LIGHT, MAP\_DENSITY\_MEDIUM, MAP\_DENSITY\_HEAVY, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof. For MAP\_DENSITY\_NONE, a handle of id 0.

### `ConvertMapControl`

| Case                    | Group | Outcome | Id          | Type                           | Message |
| ----------------------- | ----- | ------- | ----------- | ------------------------------ | ------- |
| MAP\_CONTROL\_USER      | (a)   | handle  | 0           | `mapcontrol: 000002B374A2B8D0` |         |
| MAP\_CONTROL\_COMPUTER  | (a)   | handle  | 1           | `mapcontrol: 000002B374A2B910` |         |
| MAP\_CONTROL\_RESCUABLE | (a)   | handle  | 2           | `mapcontrol: 000002B374A2B980` |         |
| MAP\_CONTROL\_NEUTRAL   | (a)   | handle  | 3           | `mapcontrol: 000002B374A2BA00` |         |
| MAP\_CONTROL\_CREEP     | (a)   | handle  | 4           | `mapcontrol: 000002B374A2B9C0` |         |
| MAP\_CONTROL\_NONE      | (a)   | handle  | 5           | `mapcontrol: 000002B374A2BAA0` |         |
| -1                      | (a)   | handle  | -1          | `mapcontrol: 000002B391494BB0` |         |
| past the last constant  | (a)   | handle  | 6           | `mapcontrol: 000002B391496900` |         |
| 2147483647              | (a)   | handle  | 2147483647  | `mapcontrol: 000002B39149A980` |         |
| -2147483648             | (a)   | handle  | -2147483648 | `mapcontrol: 000002B391490CE0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (MAP\_CONTROL\_USER, MAP\_CONTROL\_COMPUTER, MAP\_CONTROL\_RESCUABLE, MAP\_CONTROL\_NEUTRAL, MAP\_CONTROL\_CREEP, MAP\_CONTROL\_NONE, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof. For MAP\_CONTROL\_USER, a handle of id 0.

### `ConvertPlayerColor`

| Case                       | Group | Outcome | Id          | Type                            | Message |
| -------------------------- | ----- | ------- | ----------- | ------------------------------- | ------- |
| PLAYER\_COLOR\_RED         | (a)   | handle  | 0           | `playercolor: 000002B379403EE0` |         |
| PLAYER\_COLOR\_BLUE        | (a)   | handle  | 1           | `playercolor: 000002B2C40DD270` |         |
| PLAYER\_COLOR\_CYAN        | (a)   | handle  | 2           | `playercolor: 000002B3748E8190` |         |
| PLAYER\_COLOR\_PURPLE      | (a)   | handle  | 3           | `playercolor: 000002B3748EAA10` |         |
| PLAYER\_COLOR\_YELLOW      | (a)   | handle  | 4           | `playercolor: 000002B374A0FBE0` |         |
| PLAYER\_COLOR\_ORANGE      | (a)   | handle  | 5           | `playercolor: 000002B374A27390` |         |
| PLAYER\_COLOR\_GREEN       | (a)   | handle  | 6           | `playercolor: 000002B374A27470` |         |
| PLAYER\_COLOR\_PINK        | (a)   | handle  | 7           | `playercolor: 000002B374A274B0` |         |
| PLAYER\_COLOR\_LIGHT\_GRAY | (a)   | handle  | 8           | `playercolor: 000002B374A274F0` |         |
| PLAYER\_COLOR\_LIGHT\_BLUE | (a)   | handle  | 9           | `playercolor: 000002B374A27530` |         |
| PLAYER\_COLOR\_AQUA        | (a)   | handle  | 10          | `playercolor: 000002B374A27690` |         |
| PLAYER\_COLOR\_BROWN       | (a)   | handle  | 11          | `playercolor: 000002B374A276D0` |         |
| PLAYER\_COLOR\_MAROON      | (a)   | handle  | 12          | `playercolor: 000002B374A27710` |         |
| PLAYER\_COLOR\_NAVY        | (a)   | handle  | 13          | `playercolor: 000002B374A27750` |         |
| PLAYER\_COLOR\_TURQUOISE   | (a)   | handle  | 14          | `playercolor: 000002B374A27790` |         |
| PLAYER\_COLOR\_VIOLET      | (a)   | handle  | 15          | `playercolor: 000002B374A277D0` |         |
| PLAYER\_COLOR\_WHEAT       | (a)   | handle  | 16          | `playercolor: 000002B374A27810` |         |
| PLAYER\_COLOR\_PEACH       | (a)   | handle  | 17          | `playercolor: 000002B374A27850` |         |
| PLAYER\_COLOR\_MINT        | (a)   | handle  | 18          | `playercolor: 000002B374A27AB0` |         |
| PLAYER\_COLOR\_LAVENDER    | (a)   | handle  | 19          | `playercolor: 000002B374A27AF0` |         |
| PLAYER\_COLOR\_COAL        | (a)   | handle  | 20          | `playercolor: 000002B374A27B30` |         |
| PLAYER\_COLOR\_SNOW        | (a)   | handle  | 21          | `playercolor: 000002B374A27B70` |         |
| PLAYER\_COLOR\_EMERALD     | (a)   | handle  | 22          | `playercolor: 000002B374A27BB0` |         |
| PLAYER\_COLOR\_PEANUT      | (a)   | handle  | 23          | `playercolor: 000002B374A27BF0` |         |
| PLAYER\_COLOR\_BLACK       | (a)   | handle  | 24          | `playercolor: 000002B374A27C30` |         |
| -1                         | (a)   | handle  | -1          | `playercolor: 000002B3914E46E0` |         |
| past the last constant     | (a)   | handle  | 25          | `playercolor: 000002B3914E8100` |         |
| 2147483647                 | (a)   | handle  | 2147483647  | `playercolor: 000002B3914E6100` |         |
| -2147483648                | (a)   | handle  | -2147483648 | `playercolor: 000002B3914E8AF0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (PLAYER\_COLOR\_RED, PLAYER\_COLOR\_BLUE, PLAYER\_COLOR\_CYAN, PLAYER\_COLOR\_PURPLE, PLAYER\_COLOR\_YELLOW, PLAYER\_COLOR\_ORANGE, PLAYER\_COLOR\_GREEN, PLAYER\_COLOR\_PINK, PLAYER\_COLOR\_LIGHT\_GRAY, PLAYER\_COLOR\_LIGHT\_BLUE, PLAYER\_COLOR\_AQUA, PLAYER\_COLOR\_BROWN, PLAYER\_COLOR\_MAROON, PLAYER\_COLOR\_NAVY, PLAYER\_COLOR\_TURQUOISE, PLAYER\_COLOR\_VIOLET, PLAYER\_COLOR\_WHEAT, PLAYER\_COLOR\_PEACH, PLAYER\_COLOR\_MINT, PLAYER\_COLOR\_LAVENDER, PLAYER\_COLOR\_COAL, PLAYER\_COLOR\_SNOW, PLAYER\_COLOR\_EMERALD, PLAYER\_COLOR\_PEANUT, PLAYER\_COLOR\_BLACK, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof. For PLAYER\_COLOR\_RED, a handle of id 0.

### `ConvertPlayerSlotState`

| Case                         | Group | Outcome | Id          | Type                                | Message |
| ---------------------------- | ----- | ------- | ----------- | ----------------------------------- | ------- |
| PLAYER\_SLOT\_STATE\_EMPTY   | (a)   | handle  | 0           | `playerslotstate: 000002B374A2C9B0` |         |
| PLAYER\_SLOT\_STATE\_PLAYING | (a)   | handle  | 1           | `playerslotstate: 000002B374A2C9F0` |         |
| PLAYER\_SLOT\_STATE\_LEFT    | (a)   | handle  | 2           | `playerslotstate: 000002B374A2CA60` |         |
| -1                           | (a)   | handle  | -1          | `playerslotstate: 000002B3914F1150` |         |
| past the last constant       | (a)   | handle  | 3           | `playerslotstate: 000002B3914F57B0` |         |
| 2147483647                   | (a)   | handle  | 2147483647  | `playerslotstate: 000002B3914F9640` |         |
| -2147483648                  | (a)   | handle  | -2147483648 | `playerslotstate: 000002B3914F7230` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (PLAYER\_SLOT\_STATE\_EMPTY, PLAYER\_SLOT\_STATE\_PLAYING, PLAYER\_SLOT\_STATE\_LEFT, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof. For PLAYER\_SLOT\_STATE\_EMPTY, a handle of id 0.

### `ConvertVolumeGroup`

| Case                                             | Group | Outcome | Id          | Type                            | Message |
| ------------------------------------------------ | ----- | ------- | ----------- | ------------------------------- | ------- |
| SOUND\_VOLUMEGROUP\_UNITMOVEMENT                 | (a)   | handle  | 0           | `volumegroup: 000002B374A2CD90` |         |
| SOUND\_VOLUMEGROUP\_UNITSOUNDS                   | (a)   | handle  | 1           | `volumegroup: 000002B374A2CDD0` |         |
| SOUND\_VOLUMEGROUP\_COMBAT                       | (a)   | handle  | 2           | `volumegroup: 000002B374A2CE40` |         |
| SOUND\_VOLUMEGROUP\_SPELLS                       | (a)   | handle  | 3           | `volumegroup: 000002B374A2CEC0` |         |
| SOUND\_VOLUMEGROUP\_UI                           | (a)   | handle  | 4           | `volumegroup: 000002B374A2CE80` |         |
| SOUND\_VOLUMEGROUP\_MUSIC                        | (a)   | handle  | 5           | `volumegroup: 000002B374A2CF00` |         |
| SOUND\_VOLUMEGROUP\_AMBIENTSOUNDS                | (a)   | handle  | 6           | `volumegroup: 000002B374A2CFE0` |         |
| SOUND\_VOLUMEGROUP\_FIRE                         | (a)   | handle  | 7           | `volumegroup: 000002B374A2D020` |         |
| SOUND\_VOLUMEGROUP\_CINEMATIC\_GENERAL           | (a)   | handle  | 8           | `volumegroup: 000002B374A2D060` |         |
| SOUND\_VOLUMEGROUP\_CINEMATIC\_AMBIENT           | (a)   | handle  | 9           | `volumegroup: 000002B374A2D0A0` |         |
| SOUND\_VOLUMEGROUP\_CINEMATIC\_MUSIC             | (a)   | handle  | 10          | `volumegroup: 000002B374A2D0E0` |         |
| SOUND\_VOLUMEGROUP\_CINEMATIC\_DIALOGUE          | (a)   | handle  | 11          | `volumegroup: 000002B374A2D120` |         |
| SOUND\_VOLUMEGROUP\_CINEMATIC\_SOUND\_EFFECTS\_1 | (a)   | handle  | 12          | `volumegroup: 000002B374A2D160` |         |
| SOUND\_VOLUMEGROUP\_CINEMATIC\_SOUND\_EFFECTS\_2 | (a)   | handle  | 13          | `volumegroup: 000002B374A2D1A0` |         |
| SOUND\_VOLUMEGROUP\_CINEMATIC\_SOUND\_EFFECTS\_3 | (a)   | handle  | 14          | `volumegroup: 000002B374A2D1E0` |         |
| -1                                               | (a)   | handle  | -1          | `volumegroup: 000002B391516B00` |         |
| past the last constant                           | (a)   | handle  | 15          | `volumegroup: 000002B39151CE30` |         |
| 2147483647                                       | (a)   | handle  | 2147483647  | `volumegroup: 000002B391521750` |         |
| -2147483648                                      | (a)   | handle  | -2147483648 | `volumegroup: 000002B39151B780` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (SOUND\_VOLUMEGROUP\_UNITMOVEMENT, SOUND\_VOLUMEGROUP\_UNITSOUNDS, SOUND\_VOLUMEGROUP\_COMBAT, SOUND\_VOLUMEGROUP\_SPELLS, SOUND\_VOLUMEGROUP\_UI, SOUND\_VOLUMEGROUP\_MUSIC, SOUND\_VOLUMEGROUP\_AMBIENTSOUNDS, SOUND\_VOLUMEGROUP\_FIRE, SOUND\_VOLUMEGROUP\_CINEMATIC\_GENERAL, SOUND\_VOLUMEGROUP\_CINEMATIC\_AMBIENT, SOUND\_VOLUMEGROUP\_CINEMATIC\_MUSIC, SOUND\_VOLUMEGROUP\_CINEMATIC\_DIALOGUE, SOUND\_VOLUMEGROUP\_CINEMATIC\_SOUND\_EFFECTS\_1, SOUND\_VOLUMEGROUP\_CINEMATIC\_SOUND\_EFFECTS\_2, SOUND\_VOLUMEGROUP\_CINEMATIC\_SOUND\_EFFECTS\_3, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof. For SOUND\_VOLUMEGROUP\_UNITMOVEMENT, a handle of id 0.

### `ConvertCameraField`

| Case                                      | Group | Outcome | Id          | Type                            | Message |
| ----------------------------------------- | ----- | ------- | ----------- | ------------------------------- | ------- |
| CAMERA\_FIELD\_TARGET\_DISTANCE           | (a)   | handle  | 0           | `camerafield: 000002B372191600` |         |
| CAMERA\_FIELD\_FARZ                       | (a)   | handle  | 1           | `camerafield: 000002B372191640` |         |
| CAMERA\_FIELD\_ANGLE\_OF\_ATTACK          | (a)   | handle  | 2           | `camerafield: 000002B3721916B0` |         |
| CAMERA\_FIELD\_FIELD\_OF\_VIEW            | (a)   | handle  | 3           | `camerafield: 000002B372191730` |         |
| CAMERA\_FIELD\_ROLL                       | (a)   | handle  | 4           | `camerafield: 000002B3721916F0` |         |
| CAMERA\_FIELD\_ROTATION                   | (a)   | handle  | 5           | `camerafield: 000002B372191770` |         |
| CAMERA\_FIELD\_ZOFFSET                    | (a)   | handle  | 6           | `camerafield: 000002B37218C960` |         |
| CAMERA\_FIELD\_NEARZ                      | (a)   | handle  | 7           | `camerafield: 000002B374A28A30` |         |
| CAMERA\_FIELD\_LOCAL\_PITCH               | (a)   | handle  | 8           | `camerafield: 000002B37218F1A0` |         |
| CAMERA\_FIELD\_LOCAL\_YAW                 | (a)   | handle  | 9           | `camerafield: 000002B37218FDF0` |         |
| CAMERA\_FIELD\_LOCAL\_ROLL                | (a)   | handle  | 10          | `camerafield: 000002B37218C7B0` |         |
| CAMERA\_FIELD\_DEPTH\_OF\_FIELD\_DISTANCE | (a)   | handle  | 11          | `camerafield: 000002B37218C7F0` |         |
| CAMERA\_FIELD\_DEPTH\_OF\_FIELD\_SCALE    | (a)   | handle  | 12          | `camerafield: 000002B37218C8C0` |         |
| CAMERA\_FIELD\_ZABSOLUTE                  | (a)   | handle  | 13          | `camerafield: 000002B37218C900` |         |
| -1                                        | (a)   | handle  | -1          | `camerafield: 000002B391543FB0` |         |
| past the last constant                    | (a)   | handle  | 14          | `camerafield: 000002B39153E080` |         |
| 2147483647                                | (a)   | handle  | 2147483647  | `camerafield: 000002B391542010` |         |
| -2147483648                               | (a)   | handle  | -2147483648 | `camerafield: 000002B391548820` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (CAMERA\_FIELD\_TARGET\_DISTANCE, CAMERA\_FIELD\_FARZ, CAMERA\_FIELD\_ANGLE\_OF\_ATTACK, CAMERA\_FIELD\_FIELD\_OF\_VIEW, CAMERA\_FIELD\_ROLL, CAMERA\_FIELD\_ROTATION, CAMERA\_FIELD\_ZOFFSET, CAMERA\_FIELD\_NEARZ, CAMERA\_FIELD\_LOCAL\_PITCH, CAMERA\_FIELD\_LOCAL\_YAW, CAMERA\_FIELD\_LOCAL\_ROLL, CAMERA\_FIELD\_DEPTH\_OF\_FIELD\_DISTANCE, CAMERA\_FIELD\_DEPTH\_OF\_FIELD\_SCALE, CAMERA\_FIELD\_ZABSOLUTE, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof. For CAMERA\_FIELD\_TARGET\_DISTANCE, a handle of id 0.

### `ConvertBlendMode`

| Case                                         | Group | Outcome | Id          | Type                          | Message |
| -------------------------------------------- | ----- | ------- | ----------- | ----------------------------- | ------- |
| BLEND\_MODE\_NONE or BLEND\_MODE\_DONT\_CARE | (a)   | handle  | 0           | `blendmode: 000002B3746D6150` |         |
| BLEND\_MODE\_KEYALPHA                        | (a)   | handle  | 1           | `blendmode: 000002B3746D6190` |         |
| BLEND\_MODE\_BLEND                           | (a)   | handle  | 2           | `blendmode: 000002B3746D61D0` |         |
| BLEND\_MODE\_ADDITIVE                        | (a)   | handle  | 3           | `blendmode: 000002B3746D6250` |         |
| BLEND\_MODE\_MODULATE                        | (a)   | handle  | 4           | `blendmode: 000002B3746D6210` |         |
| BLEND\_MODE\_MODULATE\_2X                    | (a)   | handle  | 5           | `blendmode: 000002B3746D62F0` |         |
| -1                                           | (a)   | handle  | -1          | `blendmode: 000002B3914B2400` |         |
| past the last constant                       | (a)   | handle  | 6           | `blendmode: 000002B3914B36D0` |         |
| 2147483647                                   | (a)   | handle  | 2147483647  | `blendmode: 000002B3914F87A0` |         |
| -2147483648                                  | (a)   | handle  | -2147483648 | `blendmode: 000002B39148B840` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (BLEND\_MODE\_NONE or BLEND\_MODE\_DONT\_CARE, BLEND\_MODE\_KEYALPHA, BLEND\_MODE\_BLEND, BLEND\_MODE\_ADDITIVE, BLEND\_MODE\_MODULATE, BLEND\_MODE\_MODULATE\_2X, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof. For BLEND\_MODE\_NONE or BLEND\_MODE\_DONT\_CARE, a handle of id 0.

### `ConvertRarityControl`

| Case                   | Group | Outcome | Id          | Type                              | Message |
| ---------------------- | ----- | ------- | ----------- | --------------------------------- | ------- |
| RARITY\_FREQUENT       | (a)   | handle  | 0           | `raritycontrol: 000002B3746D63D0` |         |
| RARITY\_RARE           | (a)   | handle  | 1           | `raritycontrol: 000002B3746D6410` |         |
| -1                     | (a)   | handle  | -1          | `raritycontrol: 000002B391452E50` |         |
| past the last constant | (a)   | handle  | 2           | `raritycontrol: 000002B380DCD6A0` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `raritycontrol: 000002B3914B6590` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `raritycontrol: 000002B3747A2650` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (RARITY\_FREQUENT, RARITY\_RARE, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof. For RARITY\_FREQUENT, a handle of id 0.

### `ConvertTexMapFlags`

| Case                   | Group | Outcome | Id          | Type                            | Message |
| ---------------------- | ----- | ------- | ----------- | ------------------------------- | ------- |
| TEXMAP\_FLAG\_NONE     | (a)   | handle  | 0           | `texmapflags: 000002B3746D6450` |         |
| TEXMAP\_FLAG\_WRAP\_U  | (a)   | handle  | 1           | `texmapflags: 000002B3746D6490` |         |
| TEXMAP\_FLAG\_WRAP\_V  | (a)   | handle  | 2           | `texmapflags: 000002B3746D6500` |         |
| TEXMAP\_FLAG\_WRAP\_UV | (a)   | handle  | 3           | `texmapflags: 000002B3746D6580` |         |
| -1                     | (a)   | handle  | -1          | `texmapflags: 000002B380E9F020` |         |
| past the last constant | (a)   | handle  | 4           | `texmapflags: 000002B380657900` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `texmapflags: 000002B380A6BCE0` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `texmapflags: 000002B3903CAAB0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (TEXMAP\_FLAG\_NONE, TEXMAP\_FLAG\_WRAP\_U, TEXMAP\_FLAG\_WRAP\_V, TEXMAP\_FLAG\_WRAP\_UV, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof. For TEXMAP\_FLAG\_NONE, a handle of id 0.

### `ConvertFogState`

| Case                   | Group | Outcome | Id          | Type                         | Message |
| ---------------------- | ----- | ------- | ----------- | ---------------------------- | ------- |
| FOG\_OF\_WAR\_MASKED   | (a)   | handle  | 1           | `fogstate: 000002B3746D6540` |         |
| FOG\_OF\_WAR\_FOGGED   | (a)   | handle  | 2           | `fogstate: 000002B3746D65C0` |         |
| FOG\_OF\_WAR\_VISIBLE  | (a)   | handle  | 4           | `fogstate: 000002B3746D6640` |         |
| -1                     | (a)   | handle  | -1          | `fogstate: 000002B380E0B380` |         |
| past the last constant | (a)   | handle  | 5           | `fogstate: 000002B3903FC200` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `fogstate: 000002B380ED6F40` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `fogstate: 000002B3903E2C80` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (FOG\_OF\_WAR\_MASKED, FOG\_OF\_WAR\_FOGGED, FOG\_OF\_WAR\_VISIBLE, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof.

### `ConvertEffectType`

| Case                       | Group | Outcome | Id          | Type                           | Message |
| -------------------------- | ----- | ------- | ----------- | ------------------------------ | ------- |
| EFFECT\_TYPE\_EFFECT       | (a)   | handle  | 0           | `effecttype: 000002B3746D6600` |         |
| EFFECT\_TYPE\_TARGET       | (a)   | handle  | 1           | `effecttype: 000002B3746D66E0` |         |
| EFFECT\_TYPE\_CASTER       | (a)   | handle  | 2           | `effecttype: 000002B3746D6750` |         |
| EFFECT\_TYPE\_SPECIAL      | (a)   | handle  | 3           | `effecttype: 000002B3746D67D0` |         |
| EFFECT\_TYPE\_AREA\_EFFECT | (a)   | handle  | 4           | `effecttype: 000002B3746D6790` |         |
| EFFECT\_TYPE\_MISSILE      | (a)   | handle  | 5           | `effecttype: 000002B3746D6870` |         |
| EFFECT\_TYPE\_LIGHTNING    | (a)   | handle  | 6           | `effecttype: 000002B3746D6950` |         |
| -1                         | (a)   | handle  | -1          | `effecttype: 000002B380E939B0` |         |
| past the last constant     | (a)   | handle  | 7           | `effecttype: 000002B380E668F0` |         |
| 2147483647                 | (a)   | handle  | 2147483647  | `effecttype: 000002B2C5257540` |         |
| -2147483648                | (a)   | handle  | -2147483648 | `effecttype: 000002B38F957640` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (EFFECT\_TYPE\_EFFECT, EFFECT\_TYPE\_TARGET, EFFECT\_TYPE\_CASTER, EFFECT\_TYPE\_SPECIAL, EFFECT\_TYPE\_AREA\_EFFECT, EFFECT\_TYPE\_MISSILE, EFFECT\_TYPE\_LIGHTNING, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof. For EFFECT\_TYPE\_EFFECT, a handle of id 0.

### `ConvertVersion`

| Case                      | Group | Outcome | Id          | Type                        | Message |
| ------------------------- | ----- | ------- | ----------- | --------------------------- | ------- |
| VERSION\_REIGN\_OF\_CHAOS | (a)   | handle  | 0           | `version: 000002B374A282D0` |         |
| VERSION\_FROZEN\_THRONE   | (a)   | handle  | 1           | `version: 000002B374A28310` |         |
| -1                        | (a)   | handle  | -1          | `version: 000002B380ECEF70` |         |
| past the last constant    | (a)   | handle  | 2           | `version: 000002B3747BA370` |         |
| 2147483647                | (a)   | handle  | 2147483647  | `version: 000002B380E9C790` |         |
| -2147483648               | (a)   | handle  | -2147483648 | `version: 000002B3806673B0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (VERSION\_REIGN\_OF\_CHAOS, VERSION\_FROZEN\_THRONE, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof. For VERSION\_REIGN\_OF\_CHAOS, a handle of id 0.

### `ConvertItemType`

| Case                                    | Group | Outcome | Id          | Type                         | Message |
| --------------------------------------- | ----- | ------- | ----------- | ---------------------------- | ------- |
| ITEM\_TYPE\_PERMANENT                   | (a)   | handle  | 0           | `itemtype: 000002B372190A00` |         |
| ITEM\_TYPE\_CHARGED                     | (a)   | handle  | 1           | `itemtype: 000002B372190A40` |         |
| ITEM\_TYPE\_POWERUP or ITEM\_TYPE\_TOME | (a)   | handle  | 2           | `itemtype: 000002B372190AB0` |         |
| ITEM\_TYPE\_ARTIFACT                    | (a)   | handle  | 3           | `itemtype: 000002B372190B30` |         |
| ITEM\_TYPE\_PURCHASABLE                 | (a)   | handle  | 4           | `itemtype: 000002B372190AF0` |         |
| ITEM\_TYPE\_CAMPAIGN                    | (a)   | handle  | 5           | `itemtype: 000002B372190B70` |         |
| ITEM\_TYPE\_MISCELLANEOUS               | (a)   | handle  | 6           | `itemtype: 000002B372190BB0` |         |
| ITEM\_TYPE\_EQUIPMENT                   | (a)   | handle  | 7           | `itemtype: 000002B372190BF0` |         |
| ITEM\_TYPE\_UNKNOWN                     | (a)   | handle  | 8           | `itemtype: 000002B372190C30` |         |
| ITEM\_TYPE\_ANY                         | (a)   | handle  | 9           | `itemtype: 000002B372190C70` |         |
| -1                                      | (a)   | handle  | -1          | `itemtype: 000002B390411C60` |         |
| past the last constant                  | (a)   | handle  | 10          | `itemtype: 000002B380E5BFB0` |         |
| 2147483647                              | (a)   | handle  | 2147483647  | `itemtype: 000002B380E82240` |         |
| -2147483648                             | (a)   | handle  | -2147483648 | `itemtype: 000002B380E40720` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (ITEM\_TYPE\_PERMANENT, ITEM\_TYPE\_CHARGED, ITEM\_TYPE\_POWERUP or ITEM\_TYPE\_TOME, ITEM\_TYPE\_ARTIFACT, ITEM\_TYPE\_PURCHASABLE, ITEM\_TYPE\_CAMPAIGN, ITEM\_TYPE\_MISCELLANEOUS, ITEM\_TYPE\_EQUIPMENT, ITEM\_TYPE\_UNKNOWN, ITEM\_TYPE\_ANY, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof. For ITEM\_TYPE\_PERMANENT, a handle of id 0.

### `ConvertAttackType`

| Case                   | Group | Outcome | Id          | Type                           | Message |
| ---------------------- | ----- | ------- | ----------- | ------------------------------ | ------- |
| ATTACK\_TYPE\_NORMAL   | (a)   | handle  | 0           | `attacktype: 000002B374A28380` |         |
| ATTACK\_TYPE\_MELEE    | (a)   | handle  | 1           | `attacktype: 000002B374A283C0` |         |
| ATTACK\_TYPE\_PIERCE   | (a)   | handle  | 2           | `attacktype: 000002B374A28430` |         |
| ATTACK\_TYPE\_SIEGE    | (a)   | handle  | 3           | `attacktype: 000002B374A284B0` |         |
| ATTACK\_TYPE\_MAGIC    | (a)   | handle  | 4           | `attacktype: 000002B374A28470` |         |
| ATTACK\_TYPE\_CHAOS    | (a)   | handle  | 5           | `attacktype: 000002B374A284F0` |         |
| ATTACK\_TYPE\_HERO     | (a)   | handle  | 6           | `attacktype: 000002B374A28530` |         |
| -1                     | (a)   | handle  | -1          | `attacktype: 000002B3807FCC90` |         |
| past the last constant | (a)   | handle  | 7           | `attacktype: 000002B38F892420` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `attacktype: 000002B380E13E70` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `attacktype: 000002B3903DD470` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (ATTACK\_TYPE\_NORMAL, ATTACK\_TYPE\_MELEE, ATTACK\_TYPE\_PIERCE, ATTACK\_TYPE\_SIEGE, ATTACK\_TYPE\_MAGIC, ATTACK\_TYPE\_CHAOS, ATTACK\_TYPE\_HERO, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.24268; evidence, not proof. For ATTACK\_TYPE\_NORMAL, a handle of id 0.
