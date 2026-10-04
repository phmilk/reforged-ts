# Nullability sweep

The [Nullability sweep](../../CONTEXT.md)'s report: one section per Slice, written by `pnpm probe:nullability-report <probe>` from the Result file of the Slice's last Probe run, and replaced, alone, each time the command runs again. Each Native gets a verdict from its cases and its Nullability family, compared with the Overlay's `returns.nullable`, and a proposed `notes` text; a Native is a `mismatch` when the Overlay types it non-null and its verdict is neither `non-null (evidence)` nor `non-null (evidence, handle id 0)`, `unsafe` and `review` included. An `unsafe` Native, one with a case that crashed the game, is proposed nullable. Each parameter measured by call cases gets a verdict from them, compared with the Overlay's `params[].nullable`, and a proposed sentence of its Native's `notes`, since the Overlay has no `params[].notes`. A converter backed non-null gets condensed `notes`, the measured fact instead of its case list. The command never writes the Overlay: `pnpm probe:nullability-curate <probe>` applies a Slice's verdicts to it, and every change goes through review.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertMapVisibility`

| Case       | Group | Outcome | Id         | Type                              | Message |
| ---------- | ----- | ------- | ---------- | --------------------------------- | ------- |
| 0          | (a)   | handle  | 0          | `mapvisibility: 000002B3914674D0` |         |
| 1          | (a)   | handle  | 1          | `mapvisibility: 000002B391466A90` |         |
| -1         | (a)   | handle  | -1         | `mapvisibility: 000002B391469E00` |         |
| 2147483647 | (a)   | handle  | 2147483647 | `mapvisibility: 000002B3914746F0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for 0, 1, -1 and 2147483647, its type having no common.j constant (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertMapSetting`

| Case       | Group | Outcome | Id         | Type                           | Message |
| ---------- | ----- | ------- | ---------- | ------------------------------ | ------- |
| 0          | (a)   | handle  | 0          | `mapsetting: 000002B3914704F0` |         |
| 1          | (a)   | handle  | 1          | `mapsetting: 000002B391465C10` |         |
| -1         | (a)   | handle  | -1         | `mapsetting: 000002B391472000` |         |
| 2147483647 | (a)   | handle  | 2147483647 | `mapsetting: 000002B391474B30` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for 0, 1, -1 and 2147483647, its type having no common.j constant (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

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
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

## `nullability-converters-2`

- Probe: `nullability-converters-2`
- Patch: 3.0.0.24268
- Date: 2026-10-04
- Run: `f324589b-8437-43ea-83e0-ae689edb1c27`

### `ConvertDamageType`

| Case                         | Group | Outcome | Id          | Type                           | Message |
| ---------------------------- | ----- | ------- | ----------- | ------------------------------ | ------- |
| DAMAGE\_TYPE\_UNKNOWN        | (a)   | handle  | 0           | `damagetype: 000001C6C31E45D0` |         |
| DAMAGE\_TYPE\_NORMAL         | (a)   | handle  | 4           | `damagetype: 000001C6C31E4610` |         |
| DAMAGE\_TYPE\_ENHANCED       | (a)   | handle  | 5           | `damagetype: 000001C6C31E46A0` |         |
| DAMAGE\_TYPE\_FIRE           | (a)   | handle  | 8           | `damagetype: 000001C6C31E4770` |         |
| DAMAGE\_TYPE\_COLD           | (a)   | handle  | 9           | `damagetype: 000001C6C31E47B0` |         |
| DAMAGE\_TYPE\_LIGHTNING      | (a)   | handle  | 10          | `damagetype: 000001C6C31E4900` |         |
| DAMAGE\_TYPE\_POISON         | (a)   | handle  | 11          | `damagetype: 000001C6C31E4940` |         |
| DAMAGE\_TYPE\_DISEASE        | (a)   | handle  | 12          | `damagetype: 000001C6C31E4980` |         |
| DAMAGE\_TYPE\_DIVINE         | (a)   | handle  | 13          | `damagetype: 000001C6C31E49C0` |         |
| DAMAGE\_TYPE\_MAGIC          | (a)   | handle  | 14          | `damagetype: 000001C6C31E4C10` |         |
| DAMAGE\_TYPE\_SONIC          | (a)   | handle  | 15          | `damagetype: 000001C6C31E4C50` |         |
| DAMAGE\_TYPE\_ACID           | (a)   | handle  | 16          | `damagetype: 000001C6C31E4C90` |         |
| DAMAGE\_TYPE\_FORCE          | (a)   | handle  | 17          | `damagetype: 000001C6C31E4CD0` |         |
| DAMAGE\_TYPE\_DEATH          | (a)   | handle  | 18          | `damagetype: 000001C6C31E4D10` |         |
| DAMAGE\_TYPE\_MIND           | (a)   | handle  | 19          | `damagetype: 000001C6C31E4D50` |         |
| DAMAGE\_TYPE\_PLANT          | (a)   | handle  | 20          | `damagetype: 000001C6C31E4D90` |         |
| DAMAGE\_TYPE\_DEFENSIVE      | (a)   | handle  | 21          | `damagetype: 000001C6C31E4DD0` |         |
| DAMAGE\_TYPE\_DEMOLITION     | (a)   | handle  | 22          | `damagetype: 000001C6C31E4F20` |         |
| DAMAGE\_TYPE\_SLOW\_POISON   | (a)   | handle  | 23          | `damagetype: 000001C6C31E4F60` |         |
| DAMAGE\_TYPE\_SPIRIT\_LINK   | (a)   | handle  | 24          | `damagetype: 000001C6C31E4FA0` |         |
| DAMAGE\_TYPE\_SHADOW\_STRIKE | (a)   | handle  | 25          | `damagetype: 000001C6C31E5200` |         |
| DAMAGE\_TYPE\_UNIVERSAL      | (a)   | handle  | 26          | `damagetype: 000001C6C31E5240` |         |
| -1                           | (a)   | handle  | -1          | `damagetype: 000001C6E05A6830` |         |
| past the last constant       | (a)   | handle  | 27          | `damagetype: 000001C6E05B10D0` |         |
| 2147483647                   | (a)   | handle  | 2147483647  | `damagetype: 000001C6E05BC2A0` |         |
| -2147483648                  | (a)   | handle  | -2147483648 | `damagetype: 000001C6E05C6B60` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertWeaponType`

| Case                               | Group | Outcome | Id          | Type                           | Message |
| ---------------------------------- | ----- | ------- | ----------- | ------------------------------ | ------- |
| WEAPON\_TYPE\_WHOKNOWS             | (a)   | handle  | 0           | `weapontype: 000001C6C31E5280` |         |
| WEAPON\_TYPE\_METAL\_LIGHT\_CHOP   | (a)   | handle  | 1           | `weapontype: 000001C6C31E52F0` |         |
| WEAPON\_TYPE\_METAL\_MEDIUM\_CHOP  | (a)   | handle  | 2           | `weapontype: 000001C6C31E5360` |         |
| WEAPON\_TYPE\_METAL\_HEAVY\_CHOP   | (a)   | handle  | 3           | `weapontype: 000001C6C31E53E0` |         |
| WEAPON\_TYPE\_METAL\_LIGHT\_SLICE  | (a)   | handle  | 4           | `weapontype: 000001C6C31E53A0` |         |
| WEAPON\_TYPE\_METAL\_MEDIUM\_SLICE | (a)   | handle  | 5           | `weapontype: 000001C6C31E5420` |         |
| WEAPON\_TYPE\_METAL\_HEAVY\_SLICE  | (a)   | handle  | 6           | `weapontype: 000001C6C31E5500` |         |
| WEAPON\_TYPE\_METAL\_MEDIUM\_BASH  | (a)   | handle  | 7           | `weapontype: 000001C6C31E5540` |         |
| WEAPON\_TYPE\_METAL\_HEAVY\_BASH   | (a)   | handle  | 8           | `weapontype: 000001C6C31E5580` |         |
| WEAPON\_TYPE\_METAL\_MEDIUM\_STAB  | (a)   | handle  | 9           | `weapontype: 000001C6C31E55C0` |         |
| WEAPON\_TYPE\_METAL\_HEAVY\_STAB   | (a)   | handle  | 10          | `weapontype: 000001C6C31E5600` |         |
| WEAPON\_TYPE\_WOOD\_LIGHT\_SLICE   | (a)   | handle  | 11          | `weapontype: 000001C6C31E5640` |         |
| WEAPON\_TYPE\_WOOD\_MEDIUM\_SLICE  | (a)   | handle  | 12          | `weapontype: 000001C6C31E5680` |         |
| WEAPON\_TYPE\_WOOD\_HEAVY\_SLICE   | (a)   | handle  | 13          | `weapontype: 000001C6C31E56C0` |         |
| WEAPON\_TYPE\_WOOD\_LIGHT\_BASH    | (a)   | handle  | 14          | `weapontype: 000001C6C31E5700` |         |
| WEAPON\_TYPE\_WOOD\_MEDIUM\_BASH   | (a)   | handle  | 15          | `weapontype: 000001C6C31E5740` |         |
| WEAPON\_TYPE\_WOOD\_HEAVY\_BASH    | (a)   | handle  | 16          | `weapontype: 000001C6C31E5780` |         |
| WEAPON\_TYPE\_WOOD\_LIGHT\_STAB    | (a)   | handle  | 17          | `weapontype: 000001C6C31E57C0` |         |
| WEAPON\_TYPE\_WOOD\_MEDIUM\_STAB   | (a)   | handle  | 18          | `weapontype: 000001C6C31E5A20` |         |
| WEAPON\_TYPE\_CLAW\_LIGHT\_SLICE   | (a)   | handle  | 19          | `weapontype: 000001C6C31E5A60` |         |
| WEAPON\_TYPE\_CLAW\_MEDIUM\_SLICE  | (a)   | handle  | 20          | `weapontype: 000001C6C31E5AA0` |         |
| WEAPON\_TYPE\_CLAW\_HEAVY\_SLICE   | (a)   | handle  | 21          | `weapontype: 000001C6C31E5AE0` |         |
| WEAPON\_TYPE\_AXE\_MEDIUM\_CHOP    | (a)   | handle  | 22          | `weapontype: 000001C6C31E5B20` |         |
| WEAPON\_TYPE\_ROCK\_HEAVY\_BASH    | (a)   | handle  | 23          | `weapontype: 000001C6C31E5B60` |         |
| -1                                 | (a)   | handle  | -1          | `weapontype: 000001C6E05E0B70` |         |
| past the last constant             | (a)   | handle  | 24          | `weapontype: 000001C6E0615EA0` |         |
| 2147483647                         | (a)   | handle  | 2147483647  | `weapontype: 000001C6E0602AC0` |         |
| -2147483648                        | (a)   | handle  | -2147483648 | `weapontype: 000001C6E061A160` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertSoundType`

| Case                        | Group | Outcome | Id          | Type                          | Message |
| --------------------------- | ----- | ------- | ----------- | ----------------------------- | ------- |
| SOUND\_TYPE\_EFFECT         | (a)   | handle  | 0           | `soundtype: 000001C6C31EE5B0` |         |
| SOUND\_TYPE\_EFFECT\_LOOPED | (a)   | handle  | 1           | `soundtype: 000001C6C31EE5F0` |         |
| -1                          | (a)   | handle  | -1          | `soundtype: 000001C6E05C03E0` |         |
| past the last constant      | (a)   | handle  | 2           | `soundtype: 000001C6E05C3650` |         |
| 2147483647                  | (a)   | handle  | 2147483647  | `soundtype: 000001C6E05E3EB0` |         |
| -2147483648                 | (a)   | handle  | -2147483648 | `soundtype: 000001C6E05AC090` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertPathingType`

| Case                              | Group | Outcome | Id          | Type                            | Message |
| --------------------------------- | ----- | ------- | ----------- | ------------------------------- | ------- |
| PATHING\_TYPE\_ANY                | (a)   | handle  | 0           | `pathingtype: 000001C6C31E5BA0` |         |
| PATHING\_TYPE\_WALKABILITY        | (a)   | handle  | 1           | `pathingtype: 000001C6C31E5BE0` |         |
| PATHING\_TYPE\_FLYABILITY         | (a)   | handle  | 2           | `pathingtype: 000001C6C31E5C50` |         |
| PATHING\_TYPE\_BUILDABILITY       | (a)   | handle  | 3           | `pathingtype: 000001C6C31E5CD0` |         |
| PATHING\_TYPE\_PEONHARVESTPATHING | (a)   | handle  | 4           | `pathingtype: 000001C6C31E5C90` |         |
| PATHING\_TYPE\_BLIGHTPATHING      | (a)   | handle  | 5           | `pathingtype: 000001C6C31E5D10` |         |
| PATHING\_TYPE\_FLOATABILITY       | (a)   | handle  | 6           | `pathingtype: 000001C6C31E5D50` |         |
| PATHING\_TYPE\_AMPHIBIOUSPATHING  | (a)   | handle  | 7           | `pathingtype: 000001C6C31E5D90` |         |
| -1                                | (a)   | handle  | -1          | `pathingtype: 000001C6E060B860` |         |
| past the last constant            | (a)   | handle  | 8           | `pathingtype: 000001C6E058C0C0` |         |
| 2147483647                        | (a)   | handle  | 2147483647  | `pathingtype: 000001C6E0611120` |         |
| -2147483648                       | (a)   | handle  | -2147483648 | `pathingtype: 000001C6E05F8680` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertMouseButtonType`

| Case                        | Group | Outcome | Id          | Type                                | Message |
| --------------------------- | ----- | ------- | ----------- | ----------------------------------- | ------- |
| MOUSE\_BUTTON\_TYPE\_LEFT   | (a)   | handle  | 1           | `mousebuttontype: 000001C6C31E5DD0` |         |
| MOUSE\_BUTTON\_TYPE\_MIDDLE | (a)   | handle  | 2           | `mousebuttontype: 000001C6C31E5E10` |         |
| MOUSE\_BUTTON\_TYPE\_RIGHT  | (a)   | handle  | 4           | `mousebuttontype: 000001C6C31E5E90` |         |
| -1                          | (a)   | handle  | 1073741824  | `mousebuttontype: 000001C6E05CC580` |         |
| past the last constant      | (a)   | handle  | 8           | `mousebuttontype: 000001C6E05F6060` |         |
| 2147483647                  | (a)   | handle  | 1073741824  | `mousebuttontype: 000001C6E05CC580` |         |
| -2147483648                 | (a)   | handle  | -2147483648 | `mousebuttontype: 000001C6E05D8EF0` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the bit flag \`1 \<\< ((i - 1) & 31)\` of the integer \`i\` passed in. Evidence, not proof.

### `ConvertAnimType`

| Case                   | Group | Outcome | Id          | Type                         | Message |
| ---------------------- | ----- | ------- | ----------- | ---------------------------- | ------- |
| ANIM\_TYPE\_BIRTH      | (a)   | handle  | 0           | `animtype: 000001C6C31E5E50` |         |
| ANIM\_TYPE\_DEATH      | (a)   | handle  | 1           | `animtype: 000001C6C31E5ED0` |         |
| ANIM\_TYPE\_DECAY      | (a)   | handle  | 2           | `animtype: 000001C6C31E5F40` |         |
| ANIM\_TYPE\_DISSIPATE  | (a)   | handle  | 3           | `animtype: 000001C6C31E5FC0` |         |
| ANIM\_TYPE\_STAND      | (a)   | handle  | 4           | `animtype: 000001C6C31E5F80` |         |
| ANIM\_TYPE\_WALK       | (a)   | handle  | 5           | `animtype: 000001C6C31E6060` |         |
| ANIM\_TYPE\_ATTACK     | (a)   | handle  | 6           | `animtype: 000001C6C31E6140` |         |
| ANIM\_TYPE\_MORPH      | (a)   | handle  | 7           | `animtype: 000001C6C31E6180` |         |
| ANIM\_TYPE\_SLEEP      | (a)   | handle  | 8           | `animtype: 000001C6C31E61C0` |         |
| ANIM\_TYPE\_SPELL      | (a)   | handle  | 9           | `animtype: 000001C6C31E6200` |         |
| ANIM\_TYPE\_PORTRAIT   | (a)   | handle  | 10          | `animtype: 000001C6C31E6240` |         |
| -1                     | (a)   | handle  | -1          | `animtype: 000001C6E05A3D90` |         |
| past the last constant | (a)   | handle  | 11          | `animtype: 000001C6DA2D67C0` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `animtype: 000001C6DA2DEEA0` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `animtype: 000001C6DA2E6040` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertSubAnimType`

| Case                          | Group | Outcome | Id          | Type                            | Message |
| ----------------------------- | ----- | ------- | ----------- | ------------------------------- | ------- |
| SUBANIM\_TYPE\_ROOTED         | (a)   | handle  | 11          | `subanimtype: 000001C6C31E6280` |         |
| SUBANIM\_TYPE\_ALTERNATE\_EX  | (a)   | handle  | 12          | `subanimtype: 000001C6C31E62C0` |         |
| SUBANIM\_TYPE\_LOOPING        | (a)   | handle  | 13          | `subanimtype: 000001C6C31E6300` |         |
| SUBANIM\_TYPE\_SLAM           | (a)   | handle  | 14          | `subanimtype: 000001C6C31E6340` |         |
| SUBANIM\_TYPE\_THROW          | (a)   | handle  | 15          | `subanimtype: 000001C6C31E6380` |         |
| SUBANIM\_TYPE\_SPIKED         | (a)   | handle  | 16          | `subanimtype: 000001C6C31E63C0` |         |
| SUBANIM\_TYPE\_FAST           | (a)   | handle  | 17          | `subanimtype: 000001C6C31E6400` |         |
| SUBANIM\_TYPE\_SPIN           | (a)   | handle  | 18          | `subanimtype: 000001C6C31E6440` |         |
| SUBANIM\_TYPE\_READY          | (a)   | handle  | 19          | `subanimtype: 000001C6C31E6480` |         |
| SUBANIM\_TYPE\_CHANNEL        | (a)   | handle  | 20          | `subanimtype: 000001C6C31E66D0` |         |
| SUBANIM\_TYPE\_DEFEND         | (a)   | handle  | 21          | `subanimtype: 000001C6C31E6710` |         |
| SUBANIM\_TYPE\_VICTORY        | (a)   | handle  | 22          | `subanimtype: 000001C6C31E6750` |         |
| SUBANIM\_TYPE\_TURN           | (a)   | handle  | 23          | `subanimtype: 000001C6C31E6790` |         |
| SUBANIM\_TYPE\_LEFT           | (a)   | handle  | 24          | `subanimtype: 000001C6C31E67D0` |         |
| SUBANIM\_TYPE\_RIGHT          | (a)   | handle  | 25          | `subanimtype: 000001C6C31E6810` |         |
| SUBANIM\_TYPE\_FIRE           | (a)   | handle  | 26          | `subanimtype: 000001C6C31E6850` |         |
| SUBANIM\_TYPE\_FLESH          | (a)   | handle  | 27          | `subanimtype: 000001C6C31E6890` |         |
| SUBANIM\_TYPE\_HIT            | (a)   | handle  | 28          | `subanimtype: 000001C6C31E6AE0` |         |
| SUBANIM\_TYPE\_WOUNDED        | (a)   | handle  | 29          | `subanimtype: 000001C6C31E6B20` |         |
| SUBANIM\_TYPE\_LIGHT          | (a)   | handle  | 30          | `subanimtype: 000001C6C31E6B60` |         |
| SUBANIM\_TYPE\_MODERATE       | (a)   | handle  | 31          | `subanimtype: 000001C6C31E6BA0` |         |
| SUBANIM\_TYPE\_SEVERE         | (a)   | handle  | 32          | `subanimtype: 000001C6C31E6BE0` |         |
| SUBANIM\_TYPE\_CRITICAL       | (a)   | handle  | 33          | `subanimtype: 000001C6C31E6C20` |         |
| SUBANIM\_TYPE\_COMPLETE       | (a)   | handle  | 34          | `subanimtype: 000001C6C31E6C60` |         |
| SUBANIM\_TYPE\_GOLD           | (a)   | handle  | 35          | `subanimtype: 000001C6C31E6CA0` |         |
| SUBANIM\_TYPE\_LUMBER         | (a)   | handle  | 36          | `subanimtype: 000001C6C31E6CE0` |         |
| SUBANIM\_TYPE\_WORK           | (a)   | handle  | 37          | `subanimtype: 000001C6C31E6D20` |         |
| SUBANIM\_TYPE\_TALK           | (a)   | handle  | 38          | `subanimtype: 000001C6C31E6D60` |         |
| SUBANIM\_TYPE\_FIRST          | (a)   | handle  | 39          | `subanimtype: 000001C6C31E6DA0` |         |
| SUBANIM\_TYPE\_SECOND         | (a)   | handle  | 40          | `subanimtype: 000001C6C31E6DE0` |         |
| SUBANIM\_TYPE\_THIRD          | (a)   | handle  | 41          | `subanimtype: 000001C6C31E6E20` |         |
| SUBANIM\_TYPE\_FOURTH         | (a)   | handle  | 42          | `subanimtype: 000001C6C31E6E60` |         |
| SUBANIM\_TYPE\_FIFTH          | (a)   | handle  | 43          | `subanimtype: 000001C6C31E6EA0` |         |
| SUBANIM\_TYPE\_ONE            | (a)   | handle  | 44          | `subanimtype: 000001C6C31E6EE0` |         |
| SUBANIM\_TYPE\_TWO            | (a)   | handle  | 45          | `subanimtype: 000001C6C31E6F20` |         |
| SUBANIM\_TYPE\_THREE          | (a)   | handle  | 46          | `subanimtype: 000001C6C31E6F60` |         |
| SUBANIM\_TYPE\_FOUR           | (a)   | handle  | 47          | `subanimtype: 000001C6C31E6FA0` |         |
| SUBANIM\_TYPE\_FIVE           | (a)   | handle  | 48          | `subanimtype: 000001C6C31E6FE0` |         |
| SUBANIM\_TYPE\_SMALL          | (a)   | handle  | 49          | `subanimtype: 000001C6C31E7020` |         |
| SUBANIM\_TYPE\_MEDIUM         | (a)   | handle  | 50          | `subanimtype: 000001C6C31E7480` |         |
| SUBANIM\_TYPE\_LARGE          | (a)   | handle  | 51          | `subanimtype: 000001C6C31E74C0` |         |
| SUBANIM\_TYPE\_UPGRADE        | (a)   | handle  | 52          | `subanimtype: 000001C6C31E7500` |         |
| SUBANIM\_TYPE\_DRAIN          | (a)   | handle  | 53          | `subanimtype: 000001C6C31E7540` |         |
| SUBANIM\_TYPE\_FILL           | (a)   | handle  | 54          | `subanimtype: 000001C6C31E7580` |         |
| SUBANIM\_TYPE\_CHAINLIGHTNING | (a)   | handle  | 55          | `subanimtype: 000001C6C31E75C0` |         |
| SUBANIM\_TYPE\_EATTREE        | (a)   | handle  | 56          | `subanimtype: 000001C6C31E7600` |         |
| SUBANIM\_TYPE\_PUKE           | (a)   | handle  | 57          | `subanimtype: 000001C6C31E7640` |         |
| SUBANIM\_TYPE\_FLAIL          | (a)   | handle  | 58          | `subanimtype: 000001C6C31E7680` |         |
| SUBANIM\_TYPE\_OFF            | (a)   | handle  | 59          | `subanimtype: 000001C6C31E76C0` |         |
| SUBANIM\_TYPE\_SWIM           | (a)   | handle  | 60          | `subanimtype: 000001C6C31E7700` |         |
| SUBANIM\_TYPE\_ENTANGLE       | (a)   | handle  | 61          | `subanimtype: 000001C6C31E7740` |         |
| SUBANIM\_TYPE\_BERSERK        | (a)   | handle  | 62          | `subanimtype: 000001C6C31E7780` |         |
| -1                            | (a)   | handle  | -1          | `subanimtype: 000001C6E05E2D60` |         |
| past the last constant        | (a)   | handle  | 63          | `subanimtype: 000001C73FAD02D0` |         |
| 2147483647                    | (a)   | handle  | 2147483647  | `subanimtype: 000001C73F9B9DB0` |         |
| -2147483648                   | (a)   | handle  | -2147483648 | `subanimtype: 000001C73FAD95B0` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertOriginFrameType`

| Case                                         | Group | Outcome | Id          | Type                                | Message |
| -------------------------------------------- | ----- | ------- | ----------- | ----------------------------------- | ------- |
| ORIGIN\_FRAME\_GAME\_UI                      | (a)   | handle  | 0           | `originframetype: 000001C6C31EE660` |         |
| ORIGIN\_FRAME\_COMMAND\_BUTTON               | (a)   | handle  | 1           | `originframetype: 000001C6C31EE6A0` |         |
| ORIGIN\_FRAME\_HERO\_BAR                     | (a)   | handle  | 2           | `originframetype: 000001C6C31EE710` |         |
| ORIGIN\_FRAME\_HERO\_BUTTON                  | (a)   | handle  | 3           | `originframetype: 000001C6C31EE790` |         |
| ORIGIN\_FRAME\_HERO\_HP\_BAR                 | (a)   | handle  | 4           | `originframetype: 000001C6C31EE750` |         |
| ORIGIN\_FRAME\_HERO\_MANA\_BAR               | (a)   | handle  | 5           | `originframetype: 000001C6C31EE7D0` |         |
| ORIGIN\_FRAME\_HERO\_BUTTON\_INDICATOR       | (a)   | handle  | 6           | `originframetype: 000001C6C31EE8B0` |         |
| ORIGIN\_FRAME\_ITEM\_BUTTON                  | (a)   | handle  | 7           | `originframetype: 000001C6C31EE8F0` |         |
| ORIGIN\_FRAME\_MINIMAP                       | (a)   | handle  | 8           | `originframetype: 000001C6C31EE930` |         |
| ORIGIN\_FRAME\_MINIMAP\_BUTTON               | (a)   | handle  | 9           | `originframetype: 000001C6C31EE970` |         |
| ORIGIN\_FRAME\_SYSTEM\_BUTTON                | (a)   | handle  | 10          | `originframetype: 000001C6C31EE9B0` |         |
| ORIGIN\_FRAME\_TOOLTIP                       | (a)   | handle  | 11          | `originframetype: 000001C6C31EE9F0` |         |
| ORIGIN\_FRAME\_UBERTOOLTIP                   | (a)   | handle  | 12          | `originframetype: 000001C6C31EEA30` |         |
| ORIGIN\_FRAME\_CHAT\_MSG                     | (a)   | handle  | 13          | `originframetype: 000001C6C31EEA70` |         |
| ORIGIN\_FRAME\_UNIT\_MSG                     | (a)   | handle  | 14          | `originframetype: 000001C6C31EEAB0` |         |
| ORIGIN\_FRAME\_TOP\_MSG                      | (a)   | handle  | 15          | `originframetype: 000001C6C31EEAF0` |         |
| ORIGIN\_FRAME\_PORTRAIT                      | (a)   | handle  | 16          | `originframetype: 000001C6C31EEB30` |         |
| ORIGIN\_FRAME\_WORLD\_FRAME                  | (a)   | handle  | 17          | `originframetype: 000001C6C31EEB70` |         |
| ORIGIN\_FRAME\_SIMPLE\_UI\_PARENT            | (a)   | handle  | 18          | `originframetype: 000001C6C31EEBB0` |         |
| ORIGIN\_FRAME\_PORTRAIT\_HP\_TEXT            | (a)   | handle  | 19          | `originframetype: 000001C6C31EEBF0` |         |
| ORIGIN\_FRAME\_PORTRAIT\_MANA\_TEXT          | (a)   | handle  | 20          | `originframetype: 000001C6C31EEC30` |         |
| ORIGIN\_FRAME\_UNIT\_PANEL\_BUFF\_BAR        | (a)   | handle  | 21          | `originframetype: 000001C6C31EEC70` |         |
| ORIGIN\_FRAME\_UNIT\_PANEL\_BUFF\_BAR\_LABEL | (a)   | handle  | 22          | `originframetype: 000001C6C31EECB0` |         |
| -1                                           | (a)   | handle  | -1          | `originframetype: 000001C6E0A33340` |         |
| past the last constant                       | (a)   | handle  | 23          | `originframetype: 000001C6E05E8A00` |         |
| 2147483647                                   | (a)   | handle  | 2147483647  | `originframetype: 000001C7803A62D0` |         |
| -2147483648                                  | (a)   | handle  | -2147483648 | `originframetype: 000001C6E05F9E70` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertFramePointType`

| Case                    | Group | Outcome | Id          | Type                               | Message |
| ----------------------- | ----- | ------- | ----------- | ---------------------------------- | ------- |
| FRAMEPOINT\_TOPLEFT     | (a)   | handle  | 0           | `framepointtype: 000001C6C31EECF0` |         |
| FRAMEPOINT\_TOP         | (a)   | handle  | 1           | `framepointtype: 000001C6C31EED30` |         |
| FRAMEPOINT\_TOPRIGHT    | (a)   | handle  | 2           | `framepointtype: 000001C6C31EEDA0` |         |
| FRAMEPOINT\_LEFT        | (a)   | handle  | 3           | `framepointtype: 000001C6C31EEE20` |         |
| FRAMEPOINT\_CENTER      | (a)   | handle  | 4           | `framepointtype: 000001C6C31EEDE0` |         |
| FRAMEPOINT\_RIGHT       | (a)   | handle  | 5           | `framepointtype: 000001C6C31EEE60` |         |
| FRAMEPOINT\_BOTTOMLEFT  | (a)   | handle  | 6           | `framepointtype: 000001C6C31EEEA0` |         |
| FRAMEPOINT\_BOTTOM      | (a)   | handle  | 7           | `framepointtype: 000001C6C31EEEE0` |         |
| FRAMEPOINT\_BOTTOMRIGHT | (a)   | handle  | 8           | `framepointtype: 000001C6C31EEF20` |         |
| -1                      | (a)   | handle  | -1          | `framepointtype: 000001C78076B320` |         |
| past the last constant  | (a)   | handle  | 9           | `framepointtype: 000001C6E05D1E80` |         |
| 2147483647              | (a)   | handle  | 2147483647  | `framepointtype: 000001C6C7BF6540` |         |
| -2147483648             | (a)   | handle  | -2147483648 | `framepointtype: 000001C6E05913A0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertTextAlignType`

| Case                   | Group | Outcome | Id          | Type                              | Message |
| ---------------------- | ----- | ------- | ----------- | --------------------------------- | ------- |
| TEXT\_JUSTIFY\_TOP     | (a)   | handle  | 0           | `textaligntype: 000001C6C31EEF60` |         |
| TEXT\_JUSTIFY\_MIDDLE  | (a)   | handle  | 1           | `textaligntype: 000001C6C31EEFA0` |         |
| TEXT\_JUSTIFY\_BOTTOM  | (a)   | handle  | 2           | `textaligntype: 000001C6C31EF010` |         |
| TEXT\_JUSTIFY\_LEFT    | (a)   | handle  | 3           | `textaligntype: 000001C6C31EF090` |         |
| TEXT\_JUSTIFY\_CENTER  | (a)   | handle  | 4           | `textaligntype: 000001C6C31EF050` |         |
| TEXT\_JUSTIFY\_RIGHT   | (a)   | handle  | 5           | `textaligntype: 000001C6C31EF0D0` |         |
| -1                     | (a)   | handle  | -1          | `textaligntype: 000001C780382D60` |         |
| past the last constant | (a)   | handle  | 6           | `textaligntype: 000001C78037A0A0` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `textaligntype: 000001C7803709A0` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `textaligntype: 000001C780363E10` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertFrameEventType`

| Case                                 | Group | Outcome | Id          | Type                               | Message |
| ------------------------------------ | ----- | ------- | ----------- | ---------------------------------- | ------- |
| FRAMEEVENT\_CONTROL\_CLICK           | (a)   | handle  | 1           | `frameeventtype: 000001C6C31EF1B0` |         |
| FRAMEEVENT\_MOUSE\_ENTER             | (a)   | handle  | 2           | `frameeventtype: 000001C6C31EF1F0` |         |
| FRAMEEVENT\_MOUSE\_LEAVE             | (a)   | handle  | 3           | `frameeventtype: 000001C6C31EF270` |         |
| FRAMEEVENT\_MOUSE\_UP                | (a)   | handle  | 4           | `frameeventtype: 000001C6C31EF230` |         |
| FRAMEEVENT\_MOUSE\_DOWN              | (a)   | handle  | 5           | `frameeventtype: 000001C6C31EF2B0` |         |
| FRAMEEVENT\_MOUSE\_WHEEL             | (a)   | handle  | 6           | `frameeventtype: 000001C6C31EF390` |         |
| FRAMEEVENT\_CHECKBOX\_CHECKED        | (a)   | handle  | 7           | `frameeventtype: 000001C6C31EF3D0` |         |
| FRAMEEVENT\_CHECKBOX\_UNCHECKED      | (a)   | handle  | 8           | `frameeventtype: 000001C6C31EF410` |         |
| FRAMEEVENT\_EDITBOX\_TEXT\_CHANGED   | (a)   | handle  | 9           | `frameeventtype: 000001C6C31EF450` |         |
| FRAMEEVENT\_POPUPMENU\_ITEM\_CHANGED | (a)   | handle  | 10          | `frameeventtype: 000001C6C31EF490` |         |
| FRAMEEVENT\_MOUSE\_DOUBLECLICK       | (a)   | handle  | 11          | `frameeventtype: 000001C6C31EF4D0` |         |
| FRAMEEVENT\_SPRITE\_ANIM\_UPDATE     | (a)   | handle  | 12          | `frameeventtype: 000001C6C31EF510` |         |
| FRAMEEVENT\_SLIDER\_VALUE\_CHANGED   | (a)   | handle  | 13          | `frameeventtype: 000001C6C31EF550` |         |
| FRAMEEVENT\_DIALOG\_CANCEL           | (a)   | handle  | 14          | `frameeventtype: 000001C6C31EF590` |         |
| FRAMEEVENT\_DIALOG\_ACCEPT           | (a)   | handle  | 15          | `frameeventtype: 000001C6C31EF5D0` |         |
| FRAMEEVENT\_EDITBOX\_ENTER           | (a)   | handle  | 16          | `frameeventtype: 000001C6C31EF610` |         |
| -1                                   | (a)   | handle  | -1          | `frameeventtype: 000001C6E05980E0` |         |
| past the last constant               | (a)   | handle  | 17          | `frameeventtype: 000001C6DA305270` |         |
| 2147483647                           | (a)   | handle  | 2147483647  | `frameeventtype: 000001C6E05DE930` |         |
| -2147483648                          | (a)   | handle  | -2147483648 | `frameeventtype: 000001C6CD1C8CC0` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertOsKeyType`

| Case                                            | Group | Outcome | Id          | Type                          | Message |
| ----------------------------------------------- | ----- | ------- | ----------- | ----------------------------- | ------- |
| OSKEY\_BACKSPACE                                | (a)   | handle  | 8           | `oskeytype: 000001C6C31EF650` |         |
| OSKEY\_TAB                                      | (a)   | handle  | 9           | `oskeytype: 000001C6C31EF690` |         |
| OSKEY\_CLEAR                                    | (a)   | handle  | 12          | `oskeytype: 000001C6C31EF6D0` |         |
| OSKEY\_RETURN                                   | (a)   | handle  | 13          | `oskeytype: 000001C6C31EF710` |         |
| OSKEY\_SHIFT                                    | (a)   | handle  | 16          | `oskeytype: 000001C6C31EF750` |         |
| OSKEY\_CONTROL                                  | (a)   | handle  | 17          | `oskeytype: 000001C6C31EF790` |         |
| OSKEY\_ALT                                      | (a)   | handle  | 18          | `oskeytype: 000001C6C31EF7D0` |         |
| OSKEY\_PAUSE                                    | (a)   | handle  | 19          | `oskeytype: 000001C6C31EF810` |         |
| OSKEY\_CAPSLOCK                                 | (a)   | handle  | 20          | `oskeytype: 000001C6C31EF850` |         |
| OSKEY\_KANA or OSKEY\_HANGUL                    | (a)   | handle  | 21          | `oskeytype: 000001C6C31EF890` |         |
| OSKEY\_JUNJA                                    | (a)   | handle  | 23          | `oskeytype: 000001C6C31EF8D0` |         |
| OSKEY\_FINAL                                    | (a)   | handle  | 24          | `oskeytype: 000001C6C31EF910` |         |
| OSKEY\_HANJA or OSKEY\_KANJI                    | (a)   | handle  | 25          | `oskeytype: 000001C6C31EF950` |         |
| OSKEY\_ESCAPE                                   | (a)   | handle  | 27          | `oskeytype: 000001C6C31EF990` |         |
| OSKEY\_CONVERT                                  | (a)   | handle  | 28          | `oskeytype: 000001C6C31EF9D0` |         |
| OSKEY\_NONCONVERT                               | (a)   | handle  | 29          | `oskeytype: 000001C6C31EFA10` |         |
| OSKEY\_ACCEPT                                   | (a)   | handle  | 30          | `oskeytype: 000001C6C31EFA50` |         |
| OSKEY\_MODECHANGE                               | (a)   | handle  | 31          | `oskeytype: 000001C6C31EFA90` |         |
| OSKEY\_SPACE                                    | (a)   | handle  | 32          | `oskeytype: 000001C6C31EFAD0` |         |
| OSKEY\_PAGEUP                                   | (a)   | handle  | 33          | `oskeytype: 000001C6C31EFB10` |         |
| OSKEY\_PAGEDOWN                                 | (a)   | handle  | 34          | `oskeytype: 000001C6C31EFB50` |         |
| OSKEY\_END                                      | (a)   | handle  | 35          | `oskeytype: 000001C6C31EFB90` |         |
| OSKEY\_HOME                                     | (a)   | handle  | 36          | `oskeytype: 000001C6C31EFBD0` |         |
| OSKEY\_LEFT                                     | (a)   | handle  | 37          | `oskeytype: 000001C6C31EFC10` |         |
| OSKEY\_UP                                       | (a)   | handle  | 38          | `oskeytype: 000001C6C31EFC50` |         |
| OSKEY\_RIGHT                                    | (a)   | handle  | 39          | `oskeytype: 000001C6C31EFC90` |         |
| OSKEY\_DOWN                                     | (a)   | handle  | 40          | `oskeytype: 000001C6C31EFCD0` |         |
| OSKEY\_SELECT                                   | (a)   | handle  | 41          | `oskeytype: 000001C6C31EFD10` |         |
| OSKEY\_PRINT                                    | (a)   | handle  | 42          | `oskeytype: 000001C6C31EFD50` |         |
| OSKEY\_EXECUTE                                  | (a)   | handle  | 43          | `oskeytype: 000001C6C31EFD90` |         |
| OSKEY\_PRINTSCREEN                              | (a)   | handle  | 44          | `oskeytype: 000001C6C31EFDD0` |         |
| OSKEY\_INSERT                                   | (a)   | handle  | 45          | `oskeytype: 000001C6C31EFE10` |         |
| OSKEY\_DELETE                                   | (a)   | handle  | 46          | `oskeytype: 000001C6C31EFE50` |         |
| OSKEY\_HELP                                     | (a)   | handle  | 47          | `oskeytype: 000001C6C31EFE90` |         |
| OSKEY\_0                                        | (a)   | handle  | 48          | `oskeytype: 000001C6C31EFED0` |         |
| OSKEY\_1                                        | (a)   | handle  | 49          | `oskeytype: 000001C6C31EFF10` |         |
| OSKEY\_2                                        | (a)   | handle  | 50          | `oskeytype: 000001C6C31EFF50` |         |
| OSKEY\_3                                        | (a)   | handle  | 51          | `oskeytype: 000001C6C31EFF90` |         |
| OSKEY\_4                                        | (a)   | handle  | 52          | `oskeytype: 000001C6C31EFFD0` |         |
| OSKEY\_5                                        | (a)   | handle  | 53          | `oskeytype: 000001C6C31F0010` |         |
| OSKEY\_6                                        | (a)   | handle  | 54          | `oskeytype: 000001C6C31F0050` |         |
| OSKEY\_7                                        | (a)   | handle  | 55          | `oskeytype: 000001C6C31F0090` |         |
| OSKEY\_8                                        | (a)   | handle  | 56          | `oskeytype: 000001C6C31F00D0` |         |
| OSKEY\_9                                        | (a)   | handle  | 57          | `oskeytype: 000001C6C31F0110` |         |
| OSKEY\_A                                        | (a)   | handle  | 65          | `oskeytype: 000001C6C31F0150` |         |
| OSKEY\_B                                        | (a)   | handle  | 66          | `oskeytype: 000001C6C31F0190` |         |
| OSKEY\_C                                        | (a)   | handle  | 67          | `oskeytype: 000001C6C31F01D0` |         |
| OSKEY\_D                                        | (a)   | handle  | 68          | `oskeytype: 000001C6C31F0210` |         |
| OSKEY\_E                                        | (a)   | handle  | 69          | `oskeytype: 000001C6C31F0250` |         |
| OSKEY\_F                                        | (a)   | handle  | 70          | `oskeytype: 000001C6C31F0290` |         |
| OSKEY\_G                                        | (a)   | handle  | 71          | `oskeytype: 000001C6C31F02D0` |         |
| OSKEY\_H                                        | (a)   | handle  | 72          | `oskeytype: 000001C6C31F0310` |         |
| OSKEY\_I                                        | (a)   | handle  | 73          | `oskeytype: 000001C6C31F0350` |         |
| OSKEY\_J                                        | (a)   | handle  | 74          | `oskeytype: 000001C6C31F0390` |         |
| OSKEY\_K                                        | (a)   | handle  | 75          | `oskeytype: 000001C6C31F03D0` |         |
| OSKEY\_L                                        | (a)   | handle  | 76          | `oskeytype: 000001C6C31F0410` |         |
| OSKEY\_M                                        | (a)   | handle  | 77          | `oskeytype: 000001C6C31F0450` |         |
| OSKEY\_N                                        | (a)   | handle  | 78          | `oskeytype: 000001C6C31F0490` |         |
| OSKEY\_O                                        | (a)   | handle  | 79          | `oskeytype: 000001C6C31F04D0` |         |
| OSKEY\_P                                        | (a)   | handle  | 80          | `oskeytype: 000001C6C31F0510` |         |
| OSKEY\_Q                                        | (a)   | handle  | 81          | `oskeytype: 000001C6C31F0550` |         |
| OSKEY\_R                                        | (a)   | handle  | 82          | `oskeytype: 000001C6C31F0590` |         |
| OSKEY\_S                                        | (a)   | handle  | 83          | `oskeytype: 000001C6C31F05D0` |         |
| OSKEY\_T                                        | (a)   | handle  | 84          | `oskeytype: 000001C6C31F0610` |         |
| OSKEY\_U                                        | (a)   | handle  | 85          | `oskeytype: 000001C6C31F0650` |         |
| OSKEY\_V                                        | (a)   | handle  | 86          | `oskeytype: 000001C6C31F0690` |         |
| OSKEY\_W                                        | (a)   | handle  | 87          | `oskeytype: 000001C6C31F06D0` |         |
| OSKEY\_X                                        | (a)   | handle  | 88          | `oskeytype: 000001C6C31F0710` |         |
| OSKEY\_Y                                        | (a)   | handle  | 89          | `oskeytype: 000001C6C31F0750` |         |
| OSKEY\_Z                                        | (a)   | handle  | 90          | `oskeytype: 000001C6C31F0790` |         |
| OSKEY\_LMETA                                    | (a)   | handle  | 91          | `oskeytype: 000001C6C31F07D0` |         |
| OSKEY\_RMETA                                    | (a)   | handle  | 92          | `oskeytype: 000001C6C31F0810` |         |
| OSKEY\_APPS                                     | (a)   | handle  | 93          | `oskeytype: 000001C6C31F0850` |         |
| OSKEY\_SLEEP                                    | (a)   | handle  | 95          | `oskeytype: 000001C6C31F0890` |         |
| OSKEY\_NUMPAD0                                  | (a)   | handle  | 96          | `oskeytype: 000001C6C31F08D0` |         |
| OSKEY\_NUMPAD1                                  | (a)   | handle  | 97          | `oskeytype: 000001C6C31F0910` |         |
| OSKEY\_NUMPAD2                                  | (a)   | handle  | 98          | `oskeytype: 000001C6C31F0950` |         |
| OSKEY\_NUMPAD3                                  | (a)   | handle  | 99          | `oskeytype: 000001C6C31F0990` |         |
| OSKEY\_NUMPAD4                                  | (a)   | handle  | 100         | `oskeytype: 000001C6C31F09D0` |         |
| OSKEY\_NUMPAD5                                  | (a)   | handle  | 101         | `oskeytype: 000001C6C31F0A10` |         |
| OSKEY\_NUMPAD6                                  | (a)   | handle  | 102         | `oskeytype: 000001C6C31F0A50` |         |
| OSKEY\_NUMPAD7                                  | (a)   | handle  | 103         | `oskeytype: 000001C6C31F0A90` |         |
| OSKEY\_NUMPAD8                                  | (a)   | handle  | 104         | `oskeytype: 000001C6C31F0AD0` |         |
| OSKEY\_NUMPAD9                                  | (a)   | handle  | 105         | `oskeytype: 000001C6C31F0B10` |         |
| OSKEY\_MULTIPLY                                 | (a)   | handle  | 106         | `oskeytype: 000001C6C31F0B50` |         |
| OSKEY\_ADD                                      | (a)   | handle  | 107         | `oskeytype: 000001C6C31F0B90` |         |
| OSKEY\_SEPARATOR                                | (a)   | handle  | 108         | `oskeytype: 000001C6C31F0BD0` |         |
| OSKEY\_SUBTRACT                                 | (a)   | handle  | 109         | `oskeytype: 000001C6C31F0C10` |         |
| OSKEY\_DECIMAL                                  | (a)   | handle  | 110         | `oskeytype: 000001C6C31F0C50` |         |
| OSKEY\_DIVIDE                                   | (a)   | handle  | 111         | `oskeytype: 000001C6C31F0C90` |         |
| OSKEY\_F1                                       | (a)   | handle  | 112         | `oskeytype: 000001C6C31F0CD0` |         |
| OSKEY\_F2                                       | (a)   | handle  | 113         | `oskeytype: 000001C6C31F0D10` |         |
| OSKEY\_F3                                       | (a)   | handle  | 114         | `oskeytype: 000001C6C31F0D50` |         |
| OSKEY\_F4                                       | (a)   | handle  | 115         | `oskeytype: 000001C6C31F0D90` |         |
| OSKEY\_F5                                       | (a)   | handle  | 116         | `oskeytype: 000001C6C31F0DD0` |         |
| OSKEY\_F6                                       | (a)   | handle  | 117         | `oskeytype: 000001C6C31F0E10` |         |
| OSKEY\_F7                                       | (a)   | handle  | 118         | `oskeytype: 000001C6C31F0E50` |         |
| OSKEY\_F8                                       | (a)   | handle  | 119         | `oskeytype: 000001C6C31F0E90` |         |
| OSKEY\_F9                                       | (a)   | handle  | 120         | `oskeytype: 000001C6C31F0ED0` |         |
| OSKEY\_F10                                      | (a)   | handle  | 121         | `oskeytype: 000001C6C31F0F10` |         |
| OSKEY\_F11                                      | (a)   | handle  | 122         | `oskeytype: 000001C6C31F0F50` |         |
| OSKEY\_F12                                      | (a)   | handle  | 123         | `oskeytype: 000001C6C31F0F90` |         |
| OSKEY\_F13                                      | (a)   | handle  | 124         | `oskeytype: 000001C6C31F0FD0` |         |
| OSKEY\_F14                                      | (a)   | handle  | 125         | `oskeytype: 000001C6C31F1010` |         |
| OSKEY\_F15                                      | (a)   | handle  | 126         | `oskeytype: 000001C6C31F1050` |         |
| OSKEY\_F16                                      | (a)   | handle  | 127         | `oskeytype: 000001C6C31F1090` |         |
| OSKEY\_F17                                      | (a)   | handle  | 128         | `oskeytype: 000001C6C31F10D0` |         |
| OSKEY\_F18                                      | (a)   | handle  | 129         | `oskeytype: 000001C6C31F1110` |         |
| OSKEY\_F19                                      | (a)   | handle  | 130         | `oskeytype: 000001C6C31F1150` |         |
| OSKEY\_F20                                      | (a)   | handle  | 131         | `oskeytype: 000001C6C31F1190` |         |
| OSKEY\_F21                                      | (a)   | handle  | 132         | `oskeytype: 000001C6C31F11D0` |         |
| OSKEY\_F22                                      | (a)   | handle  | 133         | `oskeytype: 000001C6C31F1210` |         |
| OSKEY\_F23                                      | (a)   | handle  | 134         | `oskeytype: 000001C6C31F1250` |         |
| OSKEY\_F24                                      | (a)   | handle  | 135         | `oskeytype: 000001C6C31F1290` |         |
| OSKEY\_NUMLOCK                                  | (a)   | handle  | 144         | `oskeytype: 000001C6C31F12D0` |         |
| OSKEY\_SCROLLLOCK                               | (a)   | handle  | 145         | `oskeytype: 000001C6C31F1310` |         |
| OSKEY\_OEM\_NEC\_EQUAL or OSKEY\_OEM\_FJ\_JISHO | (a)   | handle  | 146         | `oskeytype: 000001C6C31F1350` |         |
| OSKEY\_OEM\_FJ\_MASSHOU                         | (a)   | handle  | 147         | `oskeytype: 000001C6C31F1390` |         |
| OSKEY\_OEM\_FJ\_TOUROKU                         | (a)   | handle  | 148         | `oskeytype: 000001C6C31F13D0` |         |
| OSKEY\_OEM\_FJ\_LOYA                            | (a)   | handle  | 149         | `oskeytype: 000001C6C31F1410` |         |
| OSKEY\_OEM\_FJ\_ROYA                            | (a)   | handle  | 150         | `oskeytype: 000001C6C31F1450` |         |
| OSKEY\_LSHIFT                                   | (a)   | handle  | 160         | `oskeytype: 000001C6C31F1490` |         |
| OSKEY\_RSHIFT                                   | (a)   | handle  | 161         | `oskeytype: 000001C6C31F14D0` |         |
| OSKEY\_LCONTROL                                 | (a)   | handle  | 162         | `oskeytype: 000001C6C31F1510` |         |
| OSKEY\_RCONTROL                                 | (a)   | handle  | 163         | `oskeytype: 000001C6C31F1550` |         |
| OSKEY\_LALT                                     | (a)   | handle  | 164         | `oskeytype: 000001C6C31F1590` |         |
| OSKEY\_RALT                                     | (a)   | handle  | 165         | `oskeytype: 000001C6C31F15D0` |         |
| OSKEY\_BROWSER\_BACK                            | (a)   | handle  | 166         | `oskeytype: 000001C6C31F1610` |         |
| OSKEY\_BROWSER\_FORWARD                         | (a)   | handle  | 167         | `oskeytype: 000001C6C31F1650` |         |
| OSKEY\_BROWSER\_REFRESH                         | (a)   | handle  | 168         | `oskeytype: 000001C6C31F1690` |         |
| OSKEY\_BROWSER\_STOP                            | (a)   | handle  | 169         | `oskeytype: 000001C6C31F16D0` |         |
| OSKEY\_BROWSER\_SEARCH                          | (a)   | handle  | 170         | `oskeytype: 000001C6C31F1710` |         |
| OSKEY\_BROWSER\_FAVORITES                       | (a)   | handle  | 171         | `oskeytype: 000001C6C31F1750` |         |
| OSKEY\_BROWSER\_HOME                            | (a)   | handle  | 172         | `oskeytype: 000001C6C31F1790` |         |
| OSKEY\_VOLUME\_MUTE                             | (a)   | handle  | 173         | `oskeytype: 000001C6C31F17D0` |         |
| OSKEY\_VOLUME\_DOWN                             | (a)   | handle  | 174         | `oskeytype: 000001C6C31F1810` |         |
| OSKEY\_VOLUME\_UP                               | (a)   | handle  | 175         | `oskeytype: 000001C6C31F1850` |         |
| OSKEY\_MEDIA\_NEXT\_TRACK                       | (a)   | handle  | 176         | `oskeytype: 000001C6C31F1890` |         |
| OSKEY\_MEDIA\_PREV\_TRACK                       | (a)   | handle  | 177         | `oskeytype: 000001C6C31F18D0` |         |
| OSKEY\_MEDIA\_STOP                              | (a)   | handle  | 178         | `oskeytype: 000001C6C31F1910` |         |
| OSKEY\_MEDIA\_PLAY\_PAUSE                       | (a)   | handle  | 179         | `oskeytype: 000001C6C31F1950` |         |
| OSKEY\_LAUNCH\_MAIL                             | (a)   | handle  | 180         | `oskeytype: 000001C6C31F1990` |         |
| OSKEY\_LAUNCH\_MEDIA\_SELECT                    | (a)   | handle  | 181         | `oskeytype: 000001C6C31F19D0` |         |
| OSKEY\_LAUNCH\_APP1                             | (a)   | handle  | 182         | `oskeytype: 000001C6C31F1A10` |         |
| OSKEY\_LAUNCH\_APP2                             | (a)   | handle  | 183         | `oskeytype: 000001C6C31F1A50` |         |
| OSKEY\_OEM\_1                                   | (a)   | handle  | 186         | `oskeytype: 000001C6C31F1A90` |         |
| OSKEY\_OEM\_PLUS                                | (a)   | handle  | 187         | `oskeytype: 000001C6C31F1AD0` |         |
| OSKEY\_OEM\_COMMA                               | (a)   | handle  | 188         | `oskeytype: 000001C6C31F1B10` |         |
| OSKEY\_OEM\_MINUS                               | (a)   | handle  | 189         | `oskeytype: 000001C6C31F1B50` |         |
| OSKEY\_OEM\_PERIOD                              | (a)   | handle  | 190         | `oskeytype: 000001C6C31F1B90` |         |
| OSKEY\_OEM\_2                                   | (a)   | handle  | 191         | `oskeytype: 000001C6C31F1BD0` |         |
| OSKEY\_OEM\_3                                   | (a)   | handle  | 192         | `oskeytype: 000001C6C31F1C10` |         |
| OSKEY\_OEM\_4                                   | (a)   | handle  | 219         | `oskeytype: 000001C6C31F1C50` |         |
| OSKEY\_OEM\_5                                   | (a)   | handle  | 220         | `oskeytype: 000001C6C31F1C90` |         |
| OSKEY\_OEM\_6                                   | (a)   | handle  | 221         | `oskeytype: 000001C6C31F1CD0` |         |
| OSKEY\_OEM\_7                                   | (a)   | handle  | 222         | `oskeytype: 000001C6C31F1D10` |         |
| OSKEY\_OEM\_8                                   | (a)   | handle  | 223         | `oskeytype: 000001C6C31F1D50` |         |
| OSKEY\_OEM\_AX                                  | (a)   | handle  | 225         | `oskeytype: 000001C6C31F1D90` |         |
| OSKEY\_OEM\_102                                 | (a)   | handle  | 226         | `oskeytype: 000001C6C31F1DD0` |         |
| OSKEY\_ICO\_HELP                                | (a)   | handle  | 227         | `oskeytype: 000001C6C31F1E10` |         |
| OSKEY\_ICO\_00                                  | (a)   | handle  | 228         | `oskeytype: 000001C6C31F1E50` |         |
| OSKEY\_PROCESSKEY                               | (a)   | handle  | 229         | `oskeytype: 000001C6C31F1E90` |         |
| OSKEY\_ICO\_CLEAR                               | (a)   | handle  | 230         | `oskeytype: 000001C6C31F1ED0` |         |
| OSKEY\_PACKET                                   | (a)   | handle  | 231         | `oskeytype: 000001C6C31F1F10` |         |
| OSKEY\_OEM\_RESET                               | (a)   | handle  | 233         | `oskeytype: 000001C6C31F1F50` |         |
| OSKEY\_OEM\_JUMP                                | (a)   | handle  | 234         | `oskeytype: 000001C6C31F1F90` |         |
| OSKEY\_OEM\_PA1                                 | (a)   | handle  | 235         | `oskeytype: 000001C6C31F1FD0` |         |
| OSKEY\_OEM\_PA2                                 | (a)   | handle  | 236         | `oskeytype: 000001C6C31F2010` |         |
| OSKEY\_OEM\_PA3                                 | (a)   | handle  | 237         | `oskeytype: 000001C6C31F2050` |         |
| OSKEY\_OEM\_WSCTRL                              | (a)   | handle  | 238         | `oskeytype: 000001C6C31F2090` |         |
| OSKEY\_OEM\_CUSEL                               | (a)   | handle  | 239         | `oskeytype: 000001C6C31F20D0` |         |
| OSKEY\_OEM\_ATTN                                | (a)   | handle  | 240         | `oskeytype: 000001C6C31F2110` |         |
| OSKEY\_OEM\_FINISH                              | (a)   | handle  | 241         | `oskeytype: 000001C6C31F2150` |         |
| OSKEY\_OEM\_COPY                                | (a)   | handle  | 242         | `oskeytype: 000001C6C31F2190` |         |
| OSKEY\_OEM\_AUTO                                | (a)   | handle  | 243         | `oskeytype: 000001C6C31F21D0` |         |
| OSKEY\_OEM\_ENLW                                | (a)   | handle  | 244         | `oskeytype: 000001C6C31F2210` |         |
| OSKEY\_OEM\_BACKTAB                             | (a)   | handle  | 245         | `oskeytype: 000001C6C31F2250` |         |
| OSKEY\_ATTN                                     | (a)   | handle  | 246         | `oskeytype: 000001C6C31F2290` |         |
| OSKEY\_CRSEL                                    | (a)   | handle  | 247         | `oskeytype: 000001C6C31F22D0` |         |
| OSKEY\_EXSEL                                    | (a)   | handle  | 248         | `oskeytype: 000001C6C31F2310` |         |
| OSKEY\_EREOF                                    | (a)   | handle  | 249         | `oskeytype: 000001C6C31F2350` |         |
| OSKEY\_PLAY                                     | (a)   | handle  | 250         | `oskeytype: 000001C6C31F2390` |         |
| OSKEY\_ZOOM                                     | (a)   | handle  | 251         | `oskeytype: 000001C6C31F23D0` |         |
| OSKEY\_NONAME                                   | (a)   | handle  | 252         | `oskeytype: 000001C6C31F2410` |         |
| OSKEY\_PA1                                      | (a)   | handle  | 253         | `oskeytype: 000001C6C31F2450` |         |
| OSKEY\_OEM\_CLEAR                               | (a)   | handle  | 254         | `oskeytype: 000001C6C31F2490` |         |
| -1                                              | (a)   | handle  | -1          | `oskeytype: 000001C6DA34AA10` |         |
| past the last constant                          | (a)   | handle  | 255         | `oskeytype: 000001C78090F8D0` |         |
| 2147483647                                      | (a)   | handle  | 2147483647  | `oskeytype: 000001C6DA343520` |         |
| -2147483648                                     | (a)   | handle  | -2147483648 | `oskeytype: 000001C6DA2DE6D0` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertAbilityIntegerField`

| Case                                        | Group | Outcome | Id          | Type                                    | Message |
| ------------------------------------------- | ----- | ------- | ----------- | --------------------------------------- | ------- |
| ABILITY\_IF\_BUTTON\_POSITION\_NORMAL\_X    | (a)   | handle  | 1633841272  | `abilityintegerfield: 000001C6C31F2560` |         |
| ABILITY\_IF\_BUTTON\_POSITION\_NORMAL\_Y    | (a)   | handle  | 1633841273  | `abilityintegerfield: 000001C6C31F2600` |         |
| ABILITY\_IF\_BUTTON\_POSITION\_ACTIVATED\_X | (a)   | handle  | 1635082872  | `abilityintegerfield: 000001C6C31F2640` |         |
| ABILITY\_IF\_BUTTON\_POSITION\_ACTIVATED\_Y | (a)   | handle  | 1635082873  | `abilityintegerfield: 000001C6C31F2680` |         |
| ABILITY\_IF\_BUTTON\_POSITION\_RESEARCH\_X  | (a)   | handle  | 1634889848  | `abilityintegerfield: 000001C6C31F26F0` |         |
| ABILITY\_IF\_BUTTON\_POSITION\_RESEARCH\_Y  | (a)   | handle  | 1634889849  | `abilityintegerfield: 000001C6C31F2730` |         |
| ABILITY\_IF\_MISSILE\_SPEED                 | (a)   | handle  | 1634562928  | `abilityintegerfield: 000001C6C31F27A0` |         |
| ABILITY\_IF\_TARGET\_ATTACHMENTS            | (a)   | handle  | 1635017059  | `abilityintegerfield: 000001C6C31F2840` |         |
| ABILITY\_IF\_CASTER\_ATTACHMENTS            | (a)   | handle  | 1633902947  | `abilityintegerfield: 000001C6C31F2880` |         |
| ABILITY\_IF\_PRIORITY                       | (a)   | handle  | 1634759273  | `abilityintegerfield: 000001C6C31F28C0` |         |
| ABILITY\_IF\_LEVELS                         | (a)   | handle  | 1634493814  | `abilityintegerfield: 000001C6C31F2930` |         |
| ABILITY\_IF\_REQUIRED\_LEVEL                | (a)   | handle  | 1634888822  | `abilityintegerfield: 000001C6C31F2970` |         |
| ABILITY\_IF\_LEVEL\_SKIP\_REQUIREMENT       | (a)   | handle  | 1634497387  | `abilityintegerfield: 000001C6C31F29E0` |         |
| -1                                          | (a)   | handle  | -1          | `abilityintegerfield: 000001C6DA3B7C70` |         |
| past the last constant                      | (a)   | handle  | 1635082874  | `abilityintegerfield: 000001C6DA37BC10` |         |
| 2147483647                                  | (a)   | handle  | 2147483647  | `abilityintegerfield: 000001C7807D7800` |         |
| -2147483648                                 | (a)   | handle  | -2147483648 | `abilityintegerfield: 000001C6DA38B4A0` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertAbilityRealField`

| Case                           | Group | Outcome | Id          | Type                                 | Message |
| ------------------------------ | ----- | ------- | ----------- | ------------------------------------ | ------- |
| ABILITY\_RF\_ARF\_MISSILE\_ARC | (a)   | handle  | 1634558307  | `abilityrealfield: 000001C6C31F2B40` |         |
| -1                             | (a)   | handle  | -1          | `abilityrealfield: 000001C6DA337DA0` |         |
| past the last constant         | (a)   | handle  | 1634558308  | `abilityrealfield: 000001C6DA3B3370` |         |
| 2147483647                     | (a)   | handle  | 2147483647  | `abilityrealfield: 000001C6DA3A28D0` |         |
| -2147483648                    | (a)   | handle  | -2147483648 | `abilityrealfield: 000001C6DA3A3030` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertAbilityBooleanField`

| Case                             | Group | Outcome | Id          | Type                                    | Message |
| -------------------------------- | ----- | ------- | ----------- | --------------------------------------- | ------- |
| ABILITY\_BF\_HERO\_ABILITY       | (a)   | handle  | 1634231666  | `abilitybooleanfield: 000001C6C31F2A50` |         |
| ABILITY\_BF\_ITEM\_ABILITY       | (a)   | handle  | 1634301029  | `abilitybooleanfield: 000001C6C31F2AC0` |         |
| ABILITY\_BF\_CHECK\_DEPENDENCIES | (a)   | handle  | 1633904740  | `abilitybooleanfield: 000001C6C31F2B00` |         |
| -1                               | (a)   | handle  | -1          | `abilitybooleanfield: 000001C6DA3A9CA0` |         |
| past the last constant           | (a)   | handle  | 1634301030  | `abilitybooleanfield: 000001C6DA370C90` |         |
| 2147483647                       | (a)   | handle  | 2147483647  | `abilitybooleanfield: 000001C6DA3697B0` |         |
| -2147483648                      | (a)   | handle  | -2147483648 | `abilitybooleanfield: 000001C6DA39A380` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertAbilityStringField`

| Case                                | Group | Outcome | Id          | Type                                   | Message |
| ----------------------------------- | ----- | ------- | ----------- | -------------------------------------- | ------- |
| ABILITY\_SF\_NAME                   | (a)   | handle  | 1634623853  | `abilitystringfield: 000001C6C31F2BB0` |         |
| ABILITY\_SF\_ICON\_ACTIVATED        | (a)   | handle  | 1635082610  | `abilitystringfield: 000001C6C31F2C20` |         |
| ABILITY\_SF\_ICON\_RESEARCH         | (a)   | handle  | 1634886002  | `abilitystringfield: 000001C6C31F2C60` |         |
| ABILITY\_SF\_EFFECT\_SOUND          | (a)   | handle  | 1634035315  | `abilitystringfield: 000001C6C31F2D30` |         |
| ABILITY\_SF\_EFFECT\_SOUND\_LOOPING | (a)   | handle  | 1634035308  | `abilitystringfield: 000001C6C31F2D70` |         |
| -1                                  | (a)   | handle  | -1          | `abilitystringfield: 000001C6DA33EB30` |         |
| past the last constant              | (a)   | handle  | 1635082611  | `abilitystringfield: 000001C6DA351530` |         |
| 2147483647                          | (a)   | handle  | 2147483647  | `abilitystringfield: 000001C6DA3A6D60` |         |
| -2147483648                         | (a)   | handle  | -2147483648 | `abilitystringfield: 000001C6DA322270` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

## `nullability-converters-3`

- Probe: `nullability-converters-3`
- Patch: 3.0.0.24268
- Date: 2026-10-04
- Run: `90ad2dd1-7a4f-409e-aff7-7dd9f611e004`

### `ConvertAbilityIntegerLevelField`

| Case                                                | Group | Outcome | Id          | Type                                         | Message |
| --------------------------------------------------- | ----- | ------- | ----------- | -------------------------------------------- | ------- |
| ABILITY\_ILF\_MANA\_COST                            | (a)   | handle  | 1634558835  | `abilityintegerlevelfield: 000002BC19898D10` |         |
| ABILITY\_ILF\_NUMBER\_OF\_WAVES                     | (a)   | handle  | 1214413361  | `abilityintegerlevelfield: 000002BC14E76D10` |         |
| ABILITY\_ILF\_NUMBER\_OF\_SHARDS                    | (a)   | handle  | 1214413363  | `abilityintegerlevelfield: 000002BC1989AFB0` |         |
| ABILITY\_ILF\_NUMBER\_OF\_UNITS\_TELEPORTED         | (a)   | handle  | 1215132721  | `abilityintegerlevelfield: 000002BC1989B080` |         |
| ABILITY\_ILF\_SUMMONED\_UNIT\_COUNT\_HWE2           | (a)   | handle  | 1215784242  | `abilityintegerlevelfield: 000002BC1989B0F0` |         |
| ABILITY\_ILF\_NUMBER\_OF\_IMAGES                    | (a)   | handle  | 1332570417  | `abilityintegerlevelfield: 000002BC1989B270` |         |
| ABILITY\_ILF\_NUMBER\_OF\_CORPSES\_RAISED\_UAN1     | (a)   | handle  | 1432448561  | `abilityintegerlevelfield: 000002BC1989B2E0` |         |
| ABILITY\_ILF\_MORPHING\_FLAGS                       | (a)   | handle  | 1164797234  | `abilityintegerlevelfield: 000002BC1989B350` |         |
| ABILITY\_ILF\_STRENGTH\_BONUS\_NRG5                 | (a)   | handle  | 1316120373  | `abilityintegerlevelfield: 000002BC1989AF60` |         |
| ABILITY\_ILF\_DEFENSE\_BONUS\_NRG6                  | (a)   | handle  | 1316120374  | `abilityintegerlevelfield: 000002BC1989B020` |         |
| ABILITY\_ILF\_NUMBER\_OF\_TARGETS\_HIT              | (a)   | handle  | 1331915826  | `abilityintegerlevelfield: 000002BC1989B130` |         |
| ABILITY\_ILF\_DETECTION\_TYPE\_OFS1                 | (a)   | handle  | 1332114225  | `abilityintegerlevelfield: 000002BC1989B170` |         |
| ABILITY\_ILF\_NUMBER\_OF\_SUMMONED\_UNITS\_OSF2     | (a)   | handle  | 1332962866  | `abilityintegerlevelfield: 000002BC1989B1B0` |         |
| ABILITY\_ILF\_NUMBER\_OF\_SUMMONED\_UNITS\_EFN1     | (a)   | handle  | 1164340785  | `abilityintegerlevelfield: 000002BC1989B1F0` |         |
| ABILITY\_ILF\_NUMBER\_OF\_CORPSES\_RAISED\_HRE1     | (a)   | handle  | 1215456561  | `abilityintegerlevelfield: 000002BC1989C660` |         |
| ABILITY\_ILF\_STACK\_FLAGS                          | (a)   | handle  | 1214472500  | `abilityintegerlevelfield: 000002BC1989C6D0` |         |
| ABILITY\_ILF\_MINIMUM\_NUMBER\_OF\_UNITS            | (a)   | handle  | 1315205170  | `abilityintegerlevelfield: 000002BC1989C710` |         |
| ABILITY\_ILF\_MAXIMUM\_NUMBER\_OF\_UNITS\_NDP3      | (a)   | handle  | 1315205171  | `abilityintegerlevelfield: 000002BC1989CB60` |         |
| ABILITY\_ILF\_NUMBER\_OF\_UNITS\_CREATED\_NRC2      | (a)   | handle  | 1316119346  | `abilityintegerlevelfield: 000002BC1989CBA0` |         |
| ABILITY\_ILF\_SHIELD\_LIFE                          | (a)   | handle  | 1097691955  | `abilityintegerlevelfield: 000002BC1989CC10` |         |
| ABILITY\_ILF\_MANA\_LOSS\_AMS4                      | (a)   | handle  | 1097691956  | `abilityintegerlevelfield: 000002BC1989CC50` |         |
| ABILITY\_ILF\_GOLD\_PER\_INTERVAL\_BGM1             | (a)   | handle  | 1114074417  | `abilityintegerlevelfield: 000002BC1989CCC0` |         |
| ABILITY\_ILF\_MAX\_NUMBER\_OF\_MINERS               | (a)   | handle  | 1114074419  | `abilityintegerlevelfield: 000002BC1989CD00` |         |
| ABILITY\_ILF\_CARGO\_CAPACITY                       | (a)   | handle  | 1130459697  | `abilityintegerlevelfield: 000002BC1989CD70` |         |
| ABILITY\_ILF\_MAXIMUM\_CREEP\_LEVEL\_DEV3           | (a)   | handle  | 1147500083  | `abilityintegerlevelfield: 000002BC1989CDE0` |         |
| ABILITY\_ILF\_MAX\_CREEP\_LEVEL\_DEV1               | (a)   | handle  | 1147500081  | `abilityintegerlevelfield: 000002BC1989CE20` |         |
| ABILITY\_ILF\_GOLD\_PER\_INTERVAL\_EGM1             | (a)   | handle  | 1164406065  | `abilityintegerlevelfield: 000002BC1989CE60` |         |
| ABILITY\_ILF\_DEFENSE\_REDUCTION                    | (a)   | handle  | 1180788017  | `abilityintegerlevelfield: 000002BC1989CED0` |         |
| ABILITY\_ILF\_DETECTION\_TYPE\_FLA1                 | (a)   | handle  | 1181507889  | `abilityintegerlevelfield: 000002BC1989CF10` |         |
| ABILITY\_ILF\_FLARE\_COUNT                          | (a)   | handle  | 1181507891  | `abilityintegerlevelfield: 000002BC1989CF50` |         |
| ABILITY\_ILF\_MAX\_GOLD                             | (a)   | handle  | 1198285873  | `abilityintegerlevelfield: 000002BC1989CFC0` |         |
| ABILITY\_ILF\_MINING\_CAPACITY                      | (a)   | handle  | 1198285875  | `abilityintegerlevelfield: 000002BC1989D000` |         |
| ABILITY\_ILF\_MAXIMUM\_NUMBER\_OF\_CORPSES\_GYD1    | (a)   | handle  | 1199137841  | `abilityintegerlevelfield: 000002BC1989D040` |         |
| ABILITY\_ILF\_DAMAGE\_TO\_TREE                      | (a)   | handle  | 1214345777  | `abilityintegerlevelfield: 000002BC1989D080` |         |
| ABILITY\_ILF\_LUMBER\_CAPACITY                      | (a)   | handle  | 1214345778  | `abilityintegerlevelfield: 000002BC1989D0C0` |         |
| ABILITY\_ILF\_GOLD\_CAPACITY                        | (a)   | handle  | 1214345779  | `abilityintegerlevelfield: 000002BC1989D100` |         |
| ABILITY\_ILF\_DEFENSE\_INCREASE\_INF2               | (a)   | handle  | 1231971890  | `abilityintegerlevelfield: 000002BC1989C450` |         |
| ABILITY\_ILF\_INTERACTION\_TYPE                     | (a)   | handle  | 1315271986  | `abilityintegerlevelfield: 000002BC1989C490` |         |
| ABILITY\_ILF\_GOLD\_COST\_NDT1                      | (a)   | handle  | 1315206193  | `abilityintegerlevelfield: 000002BC1989C4D0` |         |
| ABILITY\_ILF\_LUMBER\_COST\_NDT2                    | (a)   | handle  | 1315206194  | `abilityintegerlevelfield: 000002BC1989C510` |         |
| ABILITY\_ILF\_DETECTION\_TYPE\_NDT3                 | (a)   | handle  | 1315206195  | `abilityintegerlevelfield: 000002BC1989C550` |         |
| ABILITY\_ILF\_STACKING\_TYPE\_POI4                  | (a)   | handle  | 1349478708  | `abilityintegerlevelfield: 000002BC1989C5C0` |         |
| ABILITY\_ILF\_STACKING\_TYPE\_POA5                  | (a)   | handle  | 1349476661  | `abilityintegerlevelfield: 000002BC1989C600` |         |
| ABILITY\_ILF\_MAXIMUM\_CREEP\_LEVEL\_PLY1           | (a)   | handle  | 1349286193  | `abilityintegerlevelfield: 000002BC1989C750` |         |
| ABILITY\_ILF\_MAXIMUM\_CREEP\_LEVEL\_POS1           | (a)   | handle  | 1349481265  | `abilityintegerlevelfield: 000002BC1989C790` |         |
| ABILITY\_ILF\_MOVEMENT\_UPDATE\_FREQUENCY\_PRG1     | (a)   | handle  | 1349674801  | `abilityintegerlevelfield: 000002BC1989C7D0` |         |
| ABILITY\_ILF\_ATTACK\_UPDATE\_FREQUENCY\_PRG2       | (a)   | handle  | 1349674802  | `abilityintegerlevelfield: 000002BC1989C810` |         |
| ABILITY\_ILF\_MANA\_LOSS\_PRG6                      | (a)   | handle  | 1349674806  | `abilityintegerlevelfield: 000002BC1989C850` |         |
| ABILITY\_ILF\_UNITS\_SUMMONED\_TYPE\_ONE            | (a)   | handle  | 1382115633  | `abilityintegerlevelfield: 000002BC1989C8C0` |         |
| ABILITY\_ILF\_UNITS\_SUMMONED\_TYPE\_TWO            | (a)   | handle  | 1382115634  | `abilityintegerlevelfield: 000002BC1989C900` |         |
| ABILITY\_ILF\_MAX\_UNITS\_SUMMONED                  | (a)   | handle  | 1432576565  | `abilityintegerlevelfield: 000002BC1989C940` |         |
| ABILITY\_ILF\_ALLOW\_WHEN\_FULL\_REJ3               | (a)   | handle  | 1382378035  | `abilityintegerlevelfield: 000002BC1989C9B0` |         |
| ABILITY\_ILF\_MAXIMUM\_UNITS\_CHARGED\_TO\_CASTER   | (a)   | handle  | 1383096885  | `abilityintegerlevelfield: 000002BC1989C9F0` |         |
| ABILITY\_ILF\_MAXIMUM\_UNITS\_AFFECTED              | (a)   | handle  | 1383096886  | `abilityintegerlevelfield: 000002BC1989CA30` |         |
| ABILITY\_ILF\_DEFENSE\_INCREASE\_ROA2               | (a)   | handle  | 1383031090  | `abilityintegerlevelfield: 000002BC1989CA70` |         |
| ABILITY\_ILF\_MAX\_UNITS\_ROA7                      | (a)   | handle  | 1383031095  | `abilityintegerlevelfield: 000002BC1989CAE0` |         |
| ABILITY\_ILF\_ROOTED\_WEAPONS                       | (a)   | handle  | 1383034673  | `abilityintegerlevelfield: 000002BC1989CB20` |         |
| ABILITY\_ILF\_UPROOTED\_WEAPONS                     | (a)   | handle  | 1383034674  | `abilityintegerlevelfield: 000002BC1E3634D0` |         |
| ABILITY\_ILF\_UPROOTED\_DEFENSE\_TYPE               | (a)   | handle  | 1383034676  | `abilityintegerlevelfield: 000002BC1E363510` |         |
| ABILITY\_ILF\_ACCUMULATION\_STEP                    | (a)   | handle  | 1398893618  | `abilityintegerlevelfield: 000002BC1E363580` |         |
| ABILITY\_ILF\_NUMBER\_OF\_OWLS                      | (a)   | handle  | 1165192756  | `abilityintegerlevelfield: 000002BC1E3635C0` |         |
| ABILITY\_ILF\_STACKING\_TYPE\_SPO4                  | (a)   | handle  | 1399877428  | `abilityintegerlevelfield: 000002BC1E363600` |         |
| ABILITY\_ILF\_NUMBER\_OF\_UNITS                     | (a)   | handle  | 1399809073  | `abilityintegerlevelfield: 000002BC1E363640` |         |
| ABILITY\_ILF\_SPIDER\_CAPACITY                      | (a)   | handle  | 1399873841  | `abilityintegerlevelfield: 000002BC1E363680` |         |
| ABILITY\_ILF\_INTERVALS\_BEFORE\_CHANGING\_TREES    | (a)   | handle  | 1466458418  | `abilityintegerlevelfield: 000002BC1E3636F0` |         |
| ABILITY\_ILF\_AGILITY\_BONUS                        | (a)   | handle  | 1231120233  | `abilityintegerlevelfield: 000002BC1E364740` |         |
| ABILITY\_ILF\_INTELLIGENCE\_BONUS                   | (a)   | handle  | 1231646324  | `abilityintegerlevelfield: 000002BC1E364780` |         |
| ABILITY\_ILF\_STRENGTH\_BONUS\_ISTR                 | (a)   | handle  | 1232303218  | `abilityintegerlevelfield: 000002BC1E3647C0` |         |
| ABILITY\_ILF\_ATTACK\_BONUS                         | (a)   | handle  | 1231123572  | `abilityintegerlevelfield: 000002BC1E364800` |         |
| ABILITY\_ILF\_DEFENSE\_BONUS\_IDEF                  | (a)   | handle  | 1231316326  | `abilityintegerlevelfield: 000002BC1E364840` |         |
| ABILITY\_ILF\_SUMMON\_1\_AMOUNT                     | (a)   | handle  | 1232301617  | `abilityintegerlevelfield: 000002BC1E364880` |         |
| ABILITY\_ILF\_SUMMON\_2\_AMOUNT                     | (a)   | handle  | 1232301618  | `abilityintegerlevelfield: 000002BC1E3648C0` |         |
| ABILITY\_ILF\_EXPERIENCE\_GAINED                    | (a)   | handle  | 1232629863  | `abilityintegerlevelfield: 000002BC1E364900` |         |
| ABILITY\_ILF\_HIT\_POINTS\_GAINED\_IHPG             | (a)   | handle  | 1231581287  | `abilityintegerlevelfield: 000002BC1E364940` |         |
| ABILITY\_ILF\_MANA\_POINTS\_GAINED\_IMPG            | (a)   | handle  | 1231908967  | `abilityintegerlevelfield: 000002BC1E364980` |         |
| ABILITY\_ILF\_HIT\_POINTS\_GAINED\_IHP2             | (a)   | handle  | 1231581234  | `abilityintegerlevelfield: 000002BC1E3649C0` |         |
| ABILITY\_ILF\_MANA\_POINTS\_GAINED\_IMP2            | (a)   | handle  | 1231908914  | `abilityintegerlevelfield: 000002BC1E364A00` |         |
| ABILITY\_ILF\_DAMAGE\_BONUS\_DICE                   | (a)   | handle  | 1231317347  | `abilityintegerlevelfield: 000002BC1E364A40` |         |
| ABILITY\_ILF\_ARMOR\_PENALTY\_IARP                  | (a)   | handle  | 1231123056  | `abilityintegerlevelfield: 000002BC1E364A80` |         |
| ABILITY\_ILF\_ENABLED\_ATTACK\_INDEX\_IOB5          | (a)   | handle  | 1232036405  | `abilityintegerlevelfield: 000002BC1E364AC0` |         |
| ABILITY\_ILF\_LEVELS\_GAINED                        | (a)   | handle  | 1231840630  | `abilityintegerlevelfield: 000002BC1E364B00` |         |
| ABILITY\_ILF\_MAX\_LIFE\_GAINED                     | (a)   | handle  | 1231841638  | `abilityintegerlevelfield: 000002BC1E364B40` |         |
| ABILITY\_ILF\_MAX\_MANA\_GAINED                     | (a)   | handle  | 1231905134  | `abilityintegerlevelfield: 000002BC1E364B80` |         |
| ABILITY\_ILF\_GOLD\_GIVEN                           | (a)   | handle  | 1231515500  | `abilityintegerlevelfield: 000002BC1E364BC0` |         |
| ABILITY\_ILF\_LUMBER\_GIVEN                         | (a)   | handle  | 1231844717  | `abilityintegerlevelfield: 000002BC1E364C00` |         |
| ABILITY\_ILF\_DETECTION\_TYPE\_IFA1                 | (a)   | handle  | 1231446321  | `abilityintegerlevelfield: 000002BC1E364C40` |         |
| ABILITY\_ILF\_MAXIMUM\_CREEP\_LEVEL\_ICRE           | (a)   | handle  | 1231254117  | `abilityintegerlevelfield: 000002BC1E364C80` |         |
| ABILITY\_ILF\_MOVEMENT\_SPEED\_BONUS                | (a)   | handle  | 1231910498  | `abilityintegerlevelfield: 000002BC1E364CC0` |         |
| ABILITY\_ILF\_HIT\_POINTS\_REGENERATED\_PER\_SECOND | (a)   | handle  | 1231581298  | `abilityintegerlevelfield: 000002BC1E364D00` |         |
| ABILITY\_ILF\_SIGHT\_RANGE\_BONUS                   | (a)   | handle  | 1232300386  | `abilityintegerlevelfield: 000002BC1E364D40` |         |
| ABILITY\_ILF\_DAMAGE\_PER\_DURATION                 | (a)   | handle  | 1231251044  | `abilityintegerlevelfield: 000002BC1E364D80` |         |
| ABILITY\_ILF\_MANA\_USED\_PER\_SECOND               | (a)   | handle  | 1231251053  | `abilityintegerlevelfield: 000002BC1E364DC0` |         |
| ABILITY\_ILF\_EXTRA\_MANA\_REQUIRED                 | (a)   | handle  | 1231251064  | `abilityintegerlevelfield: 000002BC1E364E00` |         |
| ABILITY\_ILF\_DETECTION\_RADIUS\_IDET               | (a)   | handle  | 1231316340  | `abilityintegerlevelfield: 000002BC1E364E40` |         |
| ABILITY\_ILF\_MANA\_LOSS\_PER\_UNIT\_IDIM           | (a)   | handle  | 1231317357  | `abilityintegerlevelfield: 000002BC1E364E80` |         |
| ABILITY\_ILF\_DAMAGE\_TO\_SUMMONED\_UNITS\_IDID     | (a)   | handle  | 1231317348  | `abilityintegerlevelfield: 000002BC1E364EC0` |         |
| ABILITY\_ILF\_MAXIMUM\_NUMBER\_OF\_UNITS\_IREC      | (a)   | handle  | 1232233827  | `abilityintegerlevelfield: 000002BC1E364F00` |         |
| ABILITY\_ILF\_DELAY\_AFTER\_DEATH\_SECONDS          | (a)   | handle  | 1232233316  | `abilityintegerlevelfield: 000002BC1E364F40` |         |
| ABILITY\_ILF\_RESTORED\_LIFE                        | (a)   | handle  | 1769104178  | `abilityintegerlevelfield: 000002BC1E364F80` |         |
| ABILITY\_ILF\_RESTORED\_MANA\_\_1\_FOR\_CURRENT     | (a)   | handle  | 1769104179  | `abilityintegerlevelfield: 000002BC1E364FC0` |         |
| ABILITY\_ILF\_HIT\_POINTS\_RESTORED                 | (a)   | handle  | 1231581299  | `abilityintegerlevelfield: 000002BC1E365000` |         |
| ABILITY\_ILF\_MANA\_POINTS\_RESTORED                | (a)   | handle  | 1231908979  | `abilityintegerlevelfield: 000002BC1E365040` |         |
| ABILITY\_ILF\_MAXIMUM\_NUMBER\_OF\_UNITS\_ITPM      | (a)   | handle  | 1232367725  | `abilityintegerlevelfield: 000002BC1E365080` |         |
| ABILITY\_ILF\_NUMBER\_OF\_CORPSES\_RAISED\_CAD1     | (a)   | handle  | 1130456113  | `abilityintegerlevelfield: 000002BC1E3650C0` |         |
| ABILITY\_ILF\_TERRAIN\_DEFORMATION\_DURATION\_MS    | (a)   | handle  | 1467118387  | `abilityintegerlevelfield: 000002BC1E365100` |         |
| ABILITY\_ILF\_MAXIMUM\_UNITS                        | (a)   | handle  | 1432646449  | `abilityintegerlevelfield: 000002BC1E365140` |         |
| ABILITY\_ILF\_DETECTION\_TYPE\_DET1                 | (a)   | handle  | 1147499569  | `abilityintegerlevelfield: 000002BC1E365180` |         |
| ABILITY\_ILF\_GOLD\_COST\_PER\_STRUCTURE            | (a)   | handle  | 1316188209  | `abilityintegerlevelfield: 000002BC1E3651C0` |         |
| ABILITY\_ILF\_LUMBER\_COST\_PER\_USE                | (a)   | handle  | 1316188210  | `abilityintegerlevelfield: 000002BC1E365200` |         |
| ABILITY\_ILF\_DETECTION\_TYPE\_NSP3                 | (a)   | handle  | 1316188211  | `abilityintegerlevelfield: 000002BC1E365240` |         |
| ABILITY\_ILF\_NUMBER\_OF\_SWARM\_UNITS              | (a)   | handle  | 1433170737  | `abilityintegerlevelfield: 000002BC1E365280` |         |
| ABILITY\_ILF\_MAX\_SWARM\_UNITS\_PER\_TARGET        | (a)   | handle  | 1433170739  | `abilityintegerlevelfield: 000002BC1E3652C0` |         |
| ABILITY\_ILF\_NUMBER\_OF\_SUMMONED\_UNITS\_NBA2     | (a)   | handle  | 1315070258  | `abilityintegerlevelfield: 000002BC1E365300` |         |
| ABILITY\_ILF\_MAXIMUM\_CREEP\_LEVEL\_NCH1           | (a)   | handle  | 1315137585  | `abilityintegerlevelfield: 000002BC1E365340` |         |
| ABILITY\_ILF\_ATTACKS\_PREVENTED                    | (a)   | handle  | 1316186417  | `abilityintegerlevelfield: 000002BC1E365380` |         |
| ABILITY\_ILF\_MAXIMUM\_NUMBER\_OF\_TARGETS\_EFK3    | (a)   | handle  | 1164340019  | `abilityintegerlevelfield: 000002BC1E3653C0` |         |
| ABILITY\_ILF\_NUMBER\_OF\_SUMMONED\_UNITS\_ESV1     | (a)   | handle  | 1165194801  | `abilityintegerlevelfield: 000002BC1E365400` |         |
| ABILITY\_ILF\_MAXIMUM\_NUMBER\_OF\_CORPSES\_EXH1    | (a)   | handle  | 1702389809  | `abilityintegerlevelfield: 000002BC1E365440` |         |
| ABILITY\_ILF\_ITEM\_CAPACITY                        | (a)   | handle  | 1768846897  | `abilityintegerlevelfield: 000002BC1E365480` |         |
| ABILITY\_ILF\_MAXIMUM\_NUMBER\_OF\_TARGETS\_SPL2    | (a)   | handle  | 1936747570  | `abilityintegerlevelfield: 000002BC1E3654C0` |         |
| ABILITY\_ILF\_ALLOW\_WHEN\_FULL\_IRL3               | (a)   | handle  | 1769106483  | `abilityintegerlevelfield: 000002BC1E365500` |         |
| ABILITY\_ILF\_MAXIMUM\_DISPELLED\_UNITS             | (a)   | handle  | 1768186675  | `abilityintegerlevelfield: 000002BC1E365540` |         |
| ABILITY\_ILF\_NUMBER\_OF\_LURES                     | (a)   | handle  | 1768779569  | `abilityintegerlevelfield: 000002BC1E365580` |         |
| ABILITY\_ILF\_NEW\_TIME\_OF\_DAY\_HOUR              | (a)   | handle  | 1768125489  | `abilityintegerlevelfield: 000002BC1E3655C0` |         |
| ABILITY\_ILF\_NEW\_TIME\_OF\_DAY\_MINUTE            | (a)   | handle  | 1768125490  | `abilityintegerlevelfield: 000002BC1E365600` |         |
| ABILITY\_ILF\_NUMBER\_OF\_UNITS\_CREATED\_MEC1      | (a)   | handle  | 1835361073  | `abilityintegerlevelfield: 000002BC1E365640` |         |
| ABILITY\_ILF\_MINIMUM\_SPELLS                       | (a)   | handle  | 1936745011  | `abilityintegerlevelfield: 000002BC1E365680` |         |
| ABILITY\_ILF\_MAXIMUM\_SPELLS                       | (a)   | handle  | 1936745012  | `abilityintegerlevelfield: 000002BC1E3656C0` |         |
| ABILITY\_ILF\_DISABLED\_ATTACK\_INDEX               | (a)   | handle  | 1735549235  | `abilityintegerlevelfield: 000002BC1E365700` |         |
| ABILITY\_ILF\_ENABLED\_ATTACK\_INDEX\_GRA4          | (a)   | handle  | 1735549236  | `abilityintegerlevelfield: 000002BC1E367750` |         |
| ABILITY\_ILF\_MAXIMUM\_ATTACKS                      | (a)   | handle  | 1735549237  | `abilityintegerlevelfield: 000002BC1E367790` |         |
| ABILITY\_ILF\_BUILDING\_TYPES\_ALLOWED\_NPR1        | (a)   | handle  | 1315992113  | `abilityintegerlevelfield: 000002BC1E3677D0` |         |
| ABILITY\_ILF\_BUILDING\_TYPES\_ALLOWED\_NSA1        | (a)   | handle  | 1316184369  | `abilityintegerlevelfield: 000002BC1E367810` |         |
| ABILITY\_ILF\_ATTACK\_MODIFICATION                  | (a)   | handle  | 1231118641  | `abilityintegerlevelfield: 000002BC1E367850` |         |
| ABILITY\_ILF\_SUMMONED\_UNIT\_COUNT\_NPA5           | (a)   | handle  | 1315987765  | `abilityintegerlevelfield: 000002BC1E367890` |         |
| ABILITY\_ILF\_UPGRADE\_LEVELS                       | (a)   | handle  | 1231514673  | `abilityintegerlevelfield: 000002BC1E3678D0` |         |
| ABILITY\_ILF\_NUMBER\_OF\_SUMMONED\_UNITS\_NDO2     | (a)   | handle  | 1315204914  | `abilityintegerlevelfield: 000002BC1E367910` |         |
| ABILITY\_ILF\_BEASTS\_PER\_SECOND                   | (a)   | handle  | 1316189233  | `abilityintegerlevelfield: 000002BC1E367950` |         |
| ABILITY\_ILF\_TARGET\_TYPE                          | (a)   | handle  | 1315138610  | `abilityintegerlevelfield: 000002BC1E367990` |         |
| ABILITY\_ILF\_OPTIONS                               | (a)   | handle  | 1315138611  | `abilityintegerlevelfield: 000002BC1E3679D0` |         |
| ABILITY\_ILF\_ARMOR\_PENALTY\_NAB3                  | (a)   | handle  | 1315004979  | `abilityintegerlevelfield: 000002BC1E367A10` |         |
| ABILITY\_ILF\_WAVE\_COUNT\_NHS6                     | (a)   | handle  | 1315468086  | `abilityintegerlevelfield: 000002BC1E367A50` |         |
| ABILITY\_ILF\_MAX\_CREEP\_LEVEL\_NTM3               | (a)   | handle  | 1316252979  | `abilityintegerlevelfield: 000002BC1E367A90` |         |
| ABILITY\_ILF\_MISSILE\_COUNT                        | (a)   | handle  | 1315140403  | `abilityintegerlevelfield: 000002BC1E367AD0` |         |
| ABILITY\_ILF\_SPLIT\_ATTACK\_COUNT                  | (a)   | handle  | 1315728691  | `abilityintegerlevelfield: 000002BC1E367B10` |         |
| ABILITY\_ILF\_GENERATION\_COUNT                     | (a)   | handle  | 1315728694  | `abilityintegerlevelfield: 000002BC1E367B50` |         |
| ABILITY\_ILF\_ROCK\_RING\_COUNT                     | (a)   | handle  | 1316381489  | `abilityintegerlevelfield: 000002BC1E367B90` |         |
| ABILITY\_ILF\_WAVE\_COUNT\_NVC2                     | (a)   | handle  | 1316381490  | `abilityintegerlevelfield: 000002BC1E367BD0` |         |
| ABILITY\_ILF\_PREFER\_HOSTILES\_TAU1                | (a)   | handle  | 1415673137  | `abilityintegerlevelfield: 000002BC1E367C40` |         |
| ABILITY\_ILF\_PREFER\_FRIENDLIES\_TAU2              | (a)   | handle  | 1415673138  | `abilityintegerlevelfield: 000002BC1E367C80` |         |
| ABILITY\_ILF\_MAX\_UNITS\_TAU3                      | (a)   | handle  | 1415673139  | `abilityintegerlevelfield: 000002BC1E367CC0` |         |
| ABILITY\_ILF\_NUMBER\_OF\_PULSES                    | (a)   | handle  | 1415673140  | `abilityintegerlevelfield: 000002BC1E367D00` |         |
| ABILITY\_ILF\_SUMMONED\_UNIT\_TYPE\_HWE1            | (a)   | handle  | 1215784241  | `abilityintegerlevelfield: 000002BC1E367D40` |         |
| ABILITY\_ILF\_SUMMONED\_UNIT\_UIN4                  | (a)   | handle  | 1432972852  | `abilityintegerlevelfield: 000002BC1E367D80` |         |
| ABILITY\_ILF\_SUMMONED\_UNIT\_OSF1                  | (a)   | handle  | 1332962865  | `abilityintegerlevelfield: 000002BC1E367DC0` |         |
| ABILITY\_ILF\_SUMMONED\_UNIT\_TYPE\_EFNU            | (a)   | handle  | 1164340853  | `abilityintegerlevelfield: 000002BC1E367E00` |         |
| ABILITY\_ILF\_SUMMONED\_UNIT\_TYPE\_NBAU            | (a)   | handle  | 1315070325  | `abilityintegerlevelfield: 000002BC1E367E40` |         |
| ABILITY\_ILF\_SUMMONED\_UNIT\_TYPE\_NTOU            | (a)   | handle  | 1316253557  | `abilityintegerlevelfield: 000002BC1E367E80` |         |
| ABILITY\_ILF\_SUMMONED\_UNIT\_TYPE\_ESVU            | (a)   | handle  | 1165194869  | `abilityintegerlevelfield: 000002BC1E367EC0` |         |
| ABILITY\_ILF\_SUMMONED\_UNIT\_TYPES                 | (a)   | handle  | 1315268145  | `abilityintegerlevelfield: 000002BC1E367F00` |         |
| ABILITY\_ILF\_SUMMONED\_UNIT\_TYPE\_NDOU            | (a)   | handle  | 1315204981  | `abilityintegerlevelfield: 000002BC1E367F40` |         |
| ABILITY\_ILF\_ALTERNATE\_FORM\_UNIT\_EMEU           | (a)   | handle  | 1164797301  | `abilityintegerlevelfield: 000002BC1E367F80` |         |
| ABILITY\_ILF\_PLAGUE\_WARD\_UNIT\_TYPE              | (a)   | handle  | 1097886837  | `abilityintegerlevelfield: 000002BC1E367FC0` |         |
| ABILITY\_ILF\_ALLOWED\_UNIT\_TYPE\_BTL1             | (a)   | handle  | 1114926129  | `abilityintegerlevelfield: 000002BC1E368000` |         |
| ABILITY\_ILF\_NEW\_UNIT\_TYPE                       | (a)   | handle  | 1130914097  | `abilityintegerlevelfield: 000002BC1E368040` |         |
| ABILITY\_ILF\_RESULTING\_UNIT\_TYPE\_ENT1           | (a)   | handle  | 1701737521  | `abilityintegerlevelfield: 000002BC1E368080` |         |
| ABILITY\_ILF\_CORPSE\_UNIT\_TYPE                    | (a)   | handle  | 1199137909  | `abilityintegerlevelfield: 000002BC1E3680C0` |         |
| ABILITY\_ILF\_ALLOWED\_UNIT\_TYPE\_LOA1             | (a)   | handle  | 1282367793  | `abilityintegerlevelfield: 000002BC1E368130` |         |
| ABILITY\_ILF\_UNIT\_TYPE\_FOR\_LIMIT\_CHECK         | (a)   | handle  | 1382115701  | `abilityintegerlevelfield: 000002BC1E368170` |         |
| ABILITY\_ILF\_WARD\_UNIT\_TYPE\_STAU                | (a)   | handle  | 1400136053  | `abilityintegerlevelfield: 000002BC1E3681B0` |         |
| ABILITY\_ILF\_EFFECT\_ABILITY                       | (a)   | handle  | 1232036469  | `abilityintegerlevelfield: 000002BC1E3681F0` |         |
| ABILITY\_ILF\_CONVERSION\_UNIT                      | (a)   | handle  | 1315201842  | `abilityintegerlevelfield: 000002BC1E368230` |         |
| ABILITY\_ILF\_UNIT\_TO\_PRESERVE                    | (a)   | handle  | 1316187185  | `abilityintegerlevelfield: 000002BC1E368270` |         |
| ABILITY\_ILF\_UNIT\_TYPE\_ALLOWED                   | (a)   | handle  | 1130916913  | `abilityintegerlevelfield: 000002BC1E3682B0` |         |
| ABILITY\_ILF\_SWARM\_UNIT\_TYPE                     | (a)   | handle  | 1433170805  | `abilityintegerlevelfield: 000002BC1E3682F0` |         |
| ABILITY\_ILF\_RESULTING\_UNIT\_TYPE\_COAU           | (a)   | handle  | 1668243829  | `abilityintegerlevelfield: 000002BC1E368330` |         |
| ABILITY\_ILF\_UNIT\_TYPE\_EXHU                      | (a)   | handle  | 1702389877  | `abilityintegerlevelfield: 000002BC1E368370` |         |
| ABILITY\_ILF\_WARD\_UNIT\_TYPE\_HWDU                | (a)   | handle  | 1752654965  | `abilityintegerlevelfield: 000002BC1E3683B0` |         |
| ABILITY\_ILF\_LURE\_UNIT\_TYPE                      | (a)   | handle  | 1768779637  | `abilityintegerlevelfield: 000002BC1E3683F0` |         |
| ABILITY\_ILF\_UNIT\_TYPE\_IPMU                      | (a)   | handle  | 1768975733  | `abilityintegerlevelfield: 000002BC1E368430` |         |
| ABILITY\_ILF\_FACTORY\_UNIT\_ID                     | (a)   | handle  | 1316190581  | `abilityintegerlevelfield: 000002BC1E368470` |         |
| ABILITY\_ILF\_SPAWN\_UNIT\_ID\_NFYU                 | (a)   | handle  | 1315338613  | `abilityintegerlevelfield: 000002BC1E3684B0` |         |
| ABILITY\_ILF\_DESTRUCTIBLE\_ID                      | (a)   | handle  | 1316381557  | `abilityintegerlevelfield: 000002BC1E3684F0` |         |
| ABILITY\_ILF\_UPGRADE\_TYPE                         | (a)   | handle  | 1231514741  | `abilityintegerlevelfield: 000002BC1E368530` |         |
| -1                                                  | (a)   | handle  | -1          | `abilityintegerlevelfield: 000002BC14D63580` |         |
| past the last constant                              | (a)   | handle  | 1936747571  | `abilityintegerlevelfield: 000002BC14D60A40` |         |
| 2147483647                                          | (a)   | handle  | 2147483647  | `abilityintegerlevelfield: 000002BC14D5D700` |         |
| -2147483648                                         | (a)   | handle  | -2147483648 | `abilityintegerlevelfield: 000002BC2FC4E340` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertAbilityRealLevelField`

| Case                                                              | Group | Outcome | Id          | Type                                      | Message |
| ----------------------------------------------------------------- | ----- | ------- | ----------- | ----------------------------------------- | ------- |
| ABILITY\_RLF\_CASTING\_TIME                                       | (a)   | handle  | 1633902963  | `abilityreallevelfield: 000002BC1E368570` |         |
| ABILITY\_RLF\_DURATION\_NORMAL                                    | (a)   | handle  | 1633973618  | `abilityreallevelfield: 000002BC1E3685E0` |         |
| ABILITY\_RLF\_DURATION\_HERO                                      | (a)   | handle  | 1634231413  | `abilityreallevelfield: 000002BC1E368670` |         |
| ABILITY\_RLF\_COOLDOWN                                            | (a)   | handle  | 1633903726  | `abilityreallevelfield: 000002BC1E368740` |         |
| ABILITY\_RLF\_AREA\_OF\_EFFECT                                    | (a)   | handle  | 1633776229  | `abilityreallevelfield: 000002BC1E368780` |         |
| ABILITY\_RLF\_CAST\_RANGE                                         | (a)   | handle  | 1634885998  | `abilityreallevelfield: 000002BC1E3687C0` |         |
| ABILITY\_RLF\_DAMAGE\_HBZ2                                        | (a)   | handle  | 1214413362  | `abilityreallevelfield: 000002BC1E368800` |         |
| ABILITY\_RLF\_BUILDING\_REDUCTION\_HBZ4                           | (a)   | handle  | 1214413364  | `abilityreallevelfield: 000002BC1E368840` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_HBZ5                           | (a)   | handle  | 1214413365  | `abilityreallevelfield: 000002BC1E368880` |         |
| ABILITY\_RLF\_MAXIMUM\_DAMAGE\_PER\_WAVE                          | (a)   | handle  | 1214413366  | `abilityreallevelfield: 000002BC1E3688C0` |         |
| ABILITY\_RLF\_MANA\_REGENERATION\_INCREASE                        | (a)   | handle  | 1214341681  | `abilityreallevelfield: 000002BC1E368900` |         |
| ABILITY\_RLF\_CASTING\_DELAY                                      | (a)   | handle  | 1215132722  | `abilityreallevelfield: 000002BC1E368940` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_OWW1                           | (a)   | handle  | 1333229361  | `abilityreallevelfield: 000002BC1E368980` |         |
| ABILITY\_RLF\_MAGIC\_DAMAGE\_REDUCTION\_OWW2                      | (a)   | handle  | 1333229362  | `abilityreallevelfield: 000002BC1E3689C0` |         |
| ABILITY\_RLF\_CHANCE\_TO\_CRITICAL\_STRIKE                        | (a)   | handle  | 1331917361  | `abilityreallevelfield: 000002BC1E368A00` |         |
| ABILITY\_RLF\_DAMAGE\_MULTIPLIER\_OCR2                            | (a)   | handle  | 1331917362  | `abilityreallevelfield: 000002BC1E368A40` |         |
| ABILITY\_RLF\_DAMAGE\_BONUS\_OCR3                                 | (a)   | handle  | 1331917363  | `abilityreallevelfield: 000002BC1E368A80` |         |
| ABILITY\_RLF\_CHANCE\_TO\_EVADE\_OCR4                             | (a)   | handle  | 1331917364  | `abilityreallevelfield: 000002BC1E368AC0` |         |
| ABILITY\_RLF\_DAMAGE\_DEALT\_PERCENT\_OMI2                        | (a)   | handle  | 1332570418  | `abilityreallevelfield: 000002BC1E368B00` |         |
| ABILITY\_RLF\_DAMAGE\_TAKEN\_PERCENT\_OMI3                        | (a)   | handle  | 1332570419  | `abilityreallevelfield: 000002BC1E368B40` |         |
| ABILITY\_RLF\_ANIMATION\_DELAY                                    | (a)   | handle  | 1332570420  | `abilityreallevelfield: 000002BC1E368B80` |         |
| ABILITY\_RLF\_TRANSITION\_TIME                                    | (a)   | handle  | 1333226289  | `abilityreallevelfield: 000002BC1E368BC0` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_INCREASE\_PERCENT\_OWK2            | (a)   | handle  | 1333226290  | `abilityreallevelfield: 000002BC1E368C00` |         |
| ABILITY\_RLF\_BACKSTAB\_DAMAGE                                    | (a)   | handle  | 1333226291  | `abilityreallevelfield: 000002BC1E368C40` |         |
| ABILITY\_RLF\_AMOUNT\_HEALED\_DAMAGED\_UDC1                       | (a)   | handle  | 1432642353  | `abilityreallevelfield: 000002BC1E368C80` |         |
| ABILITY\_RLF\_LIFE\_CONVERTED\_TO\_MANA                           | (a)   | handle  | 1432645681  | `abilityreallevelfield: 000002BC1E368CC0` |         |
| ABILITY\_RLF\_LIFE\_CONVERTED\_TO\_LIFE                           | (a)   | handle  | 1432645682  | `abilityreallevelfield: 000002BC1E368D00` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_INCREASE\_PERCENT\_UAU1            | (a)   | handle  | 1432450353  | `abilityreallevelfield: 000002BC1E368D40` |         |
| ABILITY\_RLF\_LIFE\_REGENERATION\_INCREASE\_PERCENT               | (a)   | handle  | 1432450354  | `abilityreallevelfield: 000002BC1E368D80` |         |
| ABILITY\_RLF\_CHANCE\_TO\_EVADE\_EEV1                             | (a)   | handle  | 1164277297  | `abilityreallevelfield: 000002BC1E368DC0` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_INTERVAL                               | (a)   | handle  | 1164537137  | `abilityreallevelfield: 000002BC1E368E00` |         |
| ABILITY\_RLF\_MANA\_DRAINED\_PER\_SECOND\_EIM2                    | (a)   | handle  | 1164537138  | `abilityreallevelfield: 000002BC1E368E40` |         |
| ABILITY\_RLF\_BUFFER\_MANA\_REQUIRED                              | (a)   | handle  | 1164537139  | `abilityreallevelfield: 000002BC1E368E80` |         |
| ABILITY\_RLF\_MAX\_MANA\_DRAINED                                  | (a)   | handle  | 1164796465  | `abilityreallevelfield: 000002BC1E368EC0` |         |
| ABILITY\_RLF\_BOLT\_DELAY                                         | (a)   | handle  | 1164796466  | `abilityreallevelfield: 000002BC1E368F00` |         |
| ABILITY\_RLF\_BOLT\_LIFETIME                                      | (a)   | handle  | 1164796467  | `abilityreallevelfield: 000002BC1E368F40` |         |
| ABILITY\_RLF\_ALTITUDE\_ADJUSTMENT\_DURATION                      | (a)   | handle  | 1164797235  | `abilityreallevelfield: 000002BC1E368F80` |         |
| ABILITY\_RLF\_LANDING\_DELAY\_TIME                                | (a)   | handle  | 1164797236  | `abilityreallevelfield: 000002BC1E368FC0` |         |
| ABILITY\_RLF\_ALTERNATE\_FORM\_HIT\_POINT\_BONUS                  | (a)   | handle  | 1164797237  | `abilityreallevelfield: 000002BC1E369000` |         |
| ABILITY\_RLF\_MOVE\_SPEED\_BONUS\_INFO\_PANEL\_ONLY               | (a)   | handle  | 1315140149  | `abilityreallevelfield: 000002BC1E369040` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_BONUS\_INFO\_PANEL\_ONLY             | (a)   | handle  | 1315140150  | `abilityreallevelfield: 000002BC1E369080` |         |
| ABILITY\_RLF\_LIFE\_REGENERATION\_RATE\_PER\_SECOND               | (a)   | handle  | 1635149109  | `abilityreallevelfield: 000002BC1E3690C0` |         |
| ABILITY\_RLF\_STUN\_DURATION\_USL1                                | (a)   | handle  | 1433627697  | `abilityreallevelfield: 000002BC1E369100` |         |
| ABILITY\_RLF\_ATTACK\_DAMAGE\_STOLEN\_PERCENT                     | (a)   | handle  | 1432450609  | `abilityreallevelfield: 000002BC1E369140` |         |
| ABILITY\_RLF\_DAMAGE\_UCS1                                        | (a)   | handle  | 1432580913  | `abilityreallevelfield: 000002BC1E369180` |         |
| ABILITY\_RLF\_MAX\_DAMAGE\_UCS2                                   | (a)   | handle  | 1432580914  | `abilityreallevelfield: 000002BC1E3691C0` |         |
| ABILITY\_RLF\_DISTANCE\_UCS3                                      | (a)   | handle  | 1432580915  | `abilityreallevelfield: 000002BC1E369200` |         |
| ABILITY\_RLF\_FINAL\_AREA\_UCS4                                   | (a)   | handle  | 1432580916  | `abilityreallevelfield: 000002BC1E369240` |         |
| ABILITY\_RLF\_DAMAGE\_UIN1                                        | (a)   | handle  | 1432972849  | `abilityreallevelfield: 000002BC1E369280` |         |
| ABILITY\_RLF\_DURATION                                            | (a)   | handle  | 1432972850  | `abilityreallevelfield: 000002BC1E3692C0` |         |
| ABILITY\_RLF\_IMPACT\_DELAY                                       | (a)   | handle  | 1432972851  | `abilityreallevelfield: 000002BC1E369300` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_TARGET\_OCL1                           | (a)   | handle  | 1331915825  | `abilityreallevelfield: 000002BC1E369340` |         |
| ABILITY\_RLF\_DAMAGE\_REDUCTION\_PER\_TARGET                      | (a)   | handle  | 1331915827  | `abilityreallevelfield: 000002BC1E369380` |         |
| ABILITY\_RLF\_EFFECT\_DELAY\_OEQ1                                 | (a)   | handle  | 1332048177  | `abilityreallevelfield: 000002BC1E3693C0` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_TO\_BUILDINGS                  | (a)   | handle  | 1332048178  | `abilityreallevelfield: 000002BC1E369400` |         |
| ABILITY\_RLF\_UNITS\_SLOWED\_PERCENT                              | (a)   | handle  | 1332048179  | `abilityreallevelfield: 000002BC1E369440` |         |
| ABILITY\_RLF\_FINAL\_AREA\_OEQ4                                   | (a)   | handle  | 1332048180  | `abilityreallevelfield: 000002BC1E369480` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_EER1                           | (a)   | handle  | 1164276273  | `abilityreallevelfield: 000002BC1E3694C0` |         |
| ABILITY\_RLF\_DAMAGE\_DEALT\_TO\_ATTACKERS                        | (a)   | handle  | 1164011569  | `abilityreallevelfield: 000002BC1E369500` |         |
| ABILITY\_RLF\_LIFE\_HEALED                                        | (a)   | handle  | 1165259057  | `abilityreallevelfield: 000002BC1E369540` |         |
| ABILITY\_RLF\_HEAL\_INTERVAL                                      | (a)   | handle  | 1165259058  | `abilityreallevelfield: 000002BC1E369580` |         |
| ABILITY\_RLF\_BUILDING\_REDUCTION\_ETQ3                           | (a)   | handle  | 1165259059  | `abilityreallevelfield: 000002BC1E3695C0` |         |
| ABILITY\_RLF\_INITIAL\_IMMUNITY\_DURATION                         | (a)   | handle  | 1165259060  | `abilityreallevelfield: 000002BC1E369600` |         |
| ABILITY\_RLF\_MAX\_LIFE\_DRAINED\_PER\_SECOND\_PERCENT            | (a)   | handle  | 1432642609  | `abilityreallevelfield: 000002BC1E369640` |         |
| ABILITY\_RLF\_BUILDING\_REDUCTION\_UDD2                           | (a)   | handle  | 1432642610  | `abilityreallevelfield: 000002BC1E369680` |         |
| ABILITY\_RLF\_ARMOR\_DURATION                                     | (a)   | handle  | 1432772913  | `abilityreallevelfield: 000002BC1E36A6D0` |         |
| ABILITY\_RLF\_ARMOR\_BONUS\_UFA2                                  | (a)   | handle  | 1432772914  | `abilityreallevelfield: 000002BC1E36A710` |         |
| ABILITY\_RLF\_AREA\_OF\_EFFECT\_DAMAGE                            | (a)   | handle  | 1432776241  | `abilityreallevelfield: 000002BC1E36A750` |         |
| ABILITY\_RLF\_SPECIFIC\_TARGET\_DAMAGE\_UFN2                      | (a)   | handle  | 1432776242  | `abilityreallevelfield: 000002BC1E36A790` |         |
| ABILITY\_RLF\_DAMAGE\_BONUS\_HFA1                                 | (a)   | handle  | 1214669105  | `abilityreallevelfield: 000002BC1E36A7D0` |         |
| ABILITY\_RLF\_DAMAGE\_DEALT\_ESF1                                 | (a)   | handle  | 1165190705  | `abilityreallevelfield: 000002BC1E36A810` |         |
| ABILITY\_RLF\_DAMAGE\_INTERVAL\_ESF2                              | (a)   | handle  | 1165190706  | `abilityreallevelfield: 000002BC1E36A850` |         |
| ABILITY\_RLF\_BUILDING\_REDUCTION\_ESF3                           | (a)   | handle  | 1165190707  | `abilityreallevelfield: 000002BC1E36A890` |         |
| ABILITY\_RLF\_DAMAGE\_BONUS\_PERCENT                              | (a)   | handle  | 1164014129  | `abilityreallevelfield: 000002BC1E36A8D0` |         |
| ABILITY\_RLF\_DEFENSE\_BONUS\_HAV1                                | (a)   | handle  | 1214346801  | `abilityreallevelfield: 000002BC1E36A910` |         |
| ABILITY\_RLF\_HIT\_POINT\_BONUS                                   | (a)   | handle  | 1214346802  | `abilityreallevelfield: 000002BC1E36A950` |         |
| ABILITY\_RLF\_DAMAGE\_BONUS\_HAV3                                 | (a)   | handle  | 1214346803  | `abilityreallevelfield: 000002BC1E36A990` |         |
| ABILITY\_RLF\_MAGIC\_DAMAGE\_REDUCTION\_HAV4                      | (a)   | handle  | 1214346804  | `abilityreallevelfield: 000002BC1E36A9D0` |         |
| ABILITY\_RLF\_CHANCE\_TO\_BASH                                    | (a)   | handle  | 1214408753  | `abilityreallevelfield: 000002BC1E36AA10` |         |
| ABILITY\_RLF\_DAMAGE\_MULTIPLIER\_HBH2                            | (a)   | handle  | 1214408754  | `abilityreallevelfield: 000002BC1E36AA50` |         |
| ABILITY\_RLF\_DAMAGE\_BONUS\_HBH3                                 | (a)   | handle  | 1214408755  | `abilityreallevelfield: 000002BC1E36AA90` |         |
| ABILITY\_RLF\_CHANCE\_TO\_MISS\_HBH4                              | (a)   | handle  | 1214408756  | `abilityreallevelfield: 000002BC1E36AAD0` |         |
| ABILITY\_RLF\_DAMAGE\_HTB1                                        | (a)   | handle  | 1215586865  | `abilityreallevelfield: 000002BC1E36AB10` |         |
| ABILITY\_RLF\_AOE\_DAMAGE                                         | (a)   | handle  | 1215587121  | `abilityreallevelfield: 000002BC1E36AB50` |         |
| ABILITY\_RLF\_SPECIFIC\_TARGET\_DAMAGE\_HTC2                      | (a)   | handle  | 1215587122  | `abilityreallevelfield: 000002BC1E36AB90` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_REDUCTION\_PERCENT\_HTC3           | (a)   | handle  | 1215587123  | `abilityreallevelfield: 000002BC1E36ABD0` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_REDUCTION\_PERCENT\_HTC4             | (a)   | handle  | 1215587124  | `abilityreallevelfield: 000002BC1E36AC10` |         |
| ABILITY\_RLF\_ARMOR\_BONUS\_HAD1                                  | (a)   | handle  | 1214342193  | `abilityreallevelfield: 000002BC1E36AC50` |         |
| ABILITY\_RLF\_AMOUNT\_HEALED\_DAMAGED\_HHB1                       | (a)   | handle  | 1214800433  | `abilityreallevelfield: 000002BC1E36AC90` |         |
| ABILITY\_RLF\_EXTRA\_DAMAGE\_HCA1                                 | (a)   | handle  | 1214472497  | `abilityreallevelfield: 000002BC1E36ACD0` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_FACTOR\_HCA2                       | (a)   | handle  | 1214472498  | `abilityreallevelfield: 000002BC1E36AD10` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_FACTOR\_HCA3                         | (a)   | handle  | 1214472499  | `abilityreallevelfield: 000002BC1E36AD50` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_INCREASE\_PERCENT\_OAE1            | (a)   | handle  | 1331782961  | `abilityreallevelfield: 000002BC1E36AD90` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_INCREASE\_PERCENT\_OAE2              | (a)   | handle  | 1331782962  | `abilityreallevelfield: 000002BC1E36ADD0` |         |
| ABILITY\_RLF\_REINCARNATION\_DELAY                                | (a)   | handle  | 1332897073  | `abilityreallevelfield: 000002BC1E36AE10` |         |
| ABILITY\_RLF\_DAMAGE\_OSH1                                        | (a)   | handle  | 1332963377  | `abilityreallevelfield: 000002BC1E36AE50` |         |
| ABILITY\_RLF\_MAXIMUM\_DAMAGE\_OSH2                               | (a)   | handle  | 1332963378  | `abilityreallevelfield: 000002BC1E36AE90` |         |
| ABILITY\_RLF\_DISTANCE\_OSH3                                      | (a)   | handle  | 1332963379  | `abilityreallevelfield: 000002BC1E36AED0` |         |
| ABILITY\_RLF\_FINAL\_AREA\_OSH4                                   | (a)   | handle  | 1332963380  | `abilityreallevelfield: 000002BC1E36AF10` |         |
| ABILITY\_RLF\_GRAPHIC\_DELAY\_NFD1                                | (a)   | handle  | 1315333169  | `abilityreallevelfield: 000002BC1E36AF50` |         |
| ABILITY\_RLF\_GRAPHIC\_DURATION\_NFD2                             | (a)   | handle  | 1315333170  | `abilityreallevelfield: 000002BC1E36AF90` |         |
| ABILITY\_RLF\_DAMAGE\_NFD3                                        | (a)   | handle  | 1315333171  | `abilityreallevelfield: 000002BC1E36AFD0` |         |
| ABILITY\_RLF\_SUMMONED\_UNIT\_DAMAGE\_AMS1                        | (a)   | handle  | 1097691953  | `abilityreallevelfield: 000002BC1E36B010` |         |
| ABILITY\_RLF\_MAGIC\_DAMAGE\_REDUCTION\_AMS2                      | (a)   | handle  | 1097691954  | `abilityreallevelfield: 000002BC1E36B050` |         |
| ABILITY\_RLF\_AURA\_DURATION                                      | (a)   | handle  | 1097886769  | `abilityreallevelfield: 000002BC1E36B090` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_APL2                           | (a)   | handle  | 1097886770  | `abilityreallevelfield: 000002BC1E36B0D0` |         |
| ABILITY\_RLF\_DURATION\_OF\_PLAGUE\_WARD                          | (a)   | handle  | 1097886771  | `abilityreallevelfield: 000002BC1E36B110` |         |
| ABILITY\_RLF\_AMOUNT\_OF\_HIT\_POINTS\_REGENERATED                | (a)   | handle  | 1331786289  | `abilityreallevelfield: 000002BC1E36B150` |         |
| ABILITY\_RLF\_ATTACK\_DAMAGE\_INCREASE\_AKB1                      | (a)   | handle  | 1097556529  | `abilityreallevelfield: 000002BC1E36B190` |         |
| ABILITY\_RLF\_MANA\_LOSS\_ADM1                                    | (a)   | handle  | 1097100593  | `abilityreallevelfield: 000002BC1E36B1D0` |         |
| ABILITY\_RLF\_SUMMONED\_UNIT\_DAMAGE\_ADM2                        | (a)   | handle  | 1097100594  | `abilityreallevelfield: 000002BC1E36B210` |         |
| ABILITY\_RLF\_EXPANSION\_AMOUNT                                   | (a)   | handle  | 1114401073  | `abilityreallevelfield: 000002BC1E36B250` |         |
| ABILITY\_RLF\_INTERVAL\_DURATION\_BGM2                            | (a)   | handle  | 1114074418  | `abilityreallevelfield: 000002BC1E36B290` |         |
| ABILITY\_RLF\_RADIUS\_OF\_MINING\_RING                            | (a)   | handle  | 1114074420  | `abilityreallevelfield: 000002BC1E36B2D0` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_INCREASE\_PERCENT\_BLO1              | (a)   | handle  | 1114402609  | `abilityreallevelfield: 000002BC1E36B310` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_INCREASE\_PERCENT\_BLO2            | (a)   | handle  | 1114402610  | `abilityreallevelfield: 000002BC1E36B350` |         |
| ABILITY\_RLF\_SCALING\_FACTOR                                     | (a)   | handle  | 1114402611  | `abilityreallevelfield: 000002BC1E36B390` |         |
| ABILITY\_RLF\_HIT\_POINTS\_PER\_SECOND\_CAN1                      | (a)   | handle  | 1130458673  | `abilityreallevelfield: 000002BC1E36B3D0` |         |
| ABILITY\_RLF\_MAX\_HIT\_POINTS                                    | (a)   | handle  | 1130458674  | `abilityreallevelfield: 000002BC1E36B410` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_DEV2                           | (a)   | handle  | 1147500082  | `abilityreallevelfield: 000002BC1E36B450` |         |
| ABILITY\_RLF\_MOVEMENT\_UPDATE\_FREQUENCY\_CHD1                   | (a)   | handle  | 1130914865  | `abilityreallevelfield: 000002BC1E36B490` |         |
| ABILITY\_RLF\_ATTACK\_UPDATE\_FREQUENCY\_CHD2                     | (a)   | handle  | 1130914866  | `abilityreallevelfield: 000002BC1E36B4D0` |         |
| ABILITY\_RLF\_SUMMONED\_UNIT\_DAMAGE\_CHD3                        | (a)   | handle  | 1130914867  | `abilityreallevelfield: 000002BC1E36B510` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_REDUCTION\_PERCENT\_CRI1           | (a)   | handle  | 1131571505  | `abilityreallevelfield: 000002BC1E36B550` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_REDUCTION\_PERCENT\_CRI2             | (a)   | handle  | 1131571506  | `abilityreallevelfield: 000002BC1E36B590` |         |
| ABILITY\_RLF\_DAMAGE\_REDUCTION\_CRI3                             | (a)   | handle  | 1131571507  | `abilityreallevelfield: 000002BC1E36B5D0` |         |
| ABILITY\_RLF\_CHANCE\_TO\_MISS\_CRS                               | (a)   | handle  | 1131574065  | `abilityreallevelfield: 000002BC1E36B610` |         |
| ABILITY\_RLF\_FULL\_DAMAGE\_RADIUS\_DDA1                          | (a)   | handle  | 1147429169  | `abilityreallevelfield: 000002BC1E36B650` |         |
| ABILITY\_RLF\_FULL\_DAMAGE\_AMOUNT\_DDA2                          | (a)   | handle  | 1147429170  | `abilityreallevelfield: 000002BC1E36B690` |         |
| ABILITY\_RLF\_PARTIAL\_DAMAGE\_RADIUS                             | (a)   | handle  | 1147429171  | `abilityreallevelfield: 000002BC1E36D6E0` |         |
| ABILITY\_RLF\_PARTIAL\_DAMAGE\_AMOUNT                             | (a)   | handle  | 1147429172  | `abilityreallevelfield: 000002BC1E36D720` |         |
| ABILITY\_RLF\_BUILDING\_DAMAGE\_FACTOR\_SDS1                      | (a)   | handle  | 1399092017  | `abilityreallevelfield: 000002BC1E36D760` |         |
| ABILITY\_RLF\_MAX\_DAMAGE\_UCO5                                   | (a)   | handle  | 1432579893  | `abilityreallevelfield: 000002BC1E36D7A0` |         |
| ABILITY\_RLF\_MOVE\_SPEED\_BONUS\_UCO6                            | (a)   | handle  | 1432579894  | `abilityreallevelfield: 000002BC1E36D7E0` |         |
| ABILITY\_RLF\_DAMAGE\_TAKEN\_PERCENT\_DEF1                        | (a)   | handle  | 1147495985  | `abilityreallevelfield: 000002BC1E36D820` |         |
| ABILITY\_RLF\_DAMAGE\_DEALT\_PERCENT\_DEF2                        | (a)   | handle  | 1147495986  | `abilityreallevelfield: 000002BC1E36D860` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_FACTOR\_DEF3                       | (a)   | handle  | 1147495987  | `abilityreallevelfield: 000002BC1E36D8A0` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_FACTOR\_DEF4                         | (a)   | handle  | 1147495988  | `abilityreallevelfield: 000002BC1E36D8E0` |         |
| ABILITY\_RLF\_MAGIC\_DAMAGE\_REDUCTION\_DEF5                      | (a)   | handle  | 1147495989  | `abilityreallevelfield: 000002BC1E36D920` |         |
| ABILITY\_RLF\_CHANCE\_TO\_DEFLECT                                 | (a)   | handle  | 1147495990  | `abilityreallevelfield: 000002BC1E36D960` |         |
| ABILITY\_RLF\_DEFLECT\_DAMAGE\_TAKEN\_PIERCING                    | (a)   | handle  | 1147495991  | `abilityreallevelfield: 000002BC1E36D9A0` |         |
| ABILITY\_RLF\_DEFLECT\_DAMAGE\_TAKEN\_SPELLS                      | (a)   | handle  | 1147495992  | `abilityreallevelfield: 000002BC1E36D9E0` |         |
| ABILITY\_RLF\_RIP\_DELAY                                          | (a)   | handle  | 1164014641  | `abilityreallevelfield: 000002BC1E36DA20` |         |
| ABILITY\_RLF\_EAT\_DELAY                                          | (a)   | handle  | 1164014642  | `abilityreallevelfield: 000002BC1E36DA60` |         |
| ABILITY\_RLF\_HIT\_POINTS\_GAINED\_EAT3                           | (a)   | handle  | 1164014643  | `abilityreallevelfield: 000002BC1E36DAA0` |         |
| ABILITY\_RLF\_AIR\_UNIT\_LOWER\_DURATION                          | (a)   | handle  | 1164866353  | `abilityreallevelfield: 000002BC1E36DAE0` |         |
| ABILITY\_RLF\_AIR\_UNIT\_HEIGHT                                   | (a)   | handle  | 1164866354  | `abilityreallevelfield: 000002BC1E36DB20` |         |
| ABILITY\_RLF\_MELEE\_ATTACK\_RANGE                                | (a)   | handle  | 1164866355  | `abilityreallevelfield: 000002BC1E36DB60` |         |
| ABILITY\_RLF\_INTERVAL\_DURATION\_EGM2                            | (a)   | handle  | 1164406066  | `abilityreallevelfield: 000002BC1E36DBA0` |         |
| ABILITY\_RLF\_EFFECT\_DELAY\_FLA2                                 | (a)   | handle  | 1181507890  | `abilityreallevelfield: 000002BC1E36DBE0` |         |
| ABILITY\_RLF\_MINING\_DURATION                                    | (a)   | handle  | 1198285874  | `abilityreallevelfield: 000002BC1E36DC20` |         |
| ABILITY\_RLF\_RADIUS\_OF\_GRAVESTONES                             | (a)   | handle  | 1199137842  | `abilityreallevelfield: 000002BC1E36DC60` |         |
| ABILITY\_RLF\_RADIUS\_OF\_CORPSES                                 | (a)   | handle  | 1199137843  | `abilityreallevelfield: 000002BC1E36DCA0` |         |
| ABILITY\_RLF\_HIT\_POINTS\_GAINED\_HEA1                           | (a)   | handle  | 1214603569  | `abilityreallevelfield: 000002BC1E36DCE0` |         |
| ABILITY\_RLF\_DAMAGE\_INCREASE\_PERCENT\_INF1                     | (a)   | handle  | 1231971889  | `abilityreallevelfield: 000002BC1E36DD20` |         |
| ABILITY\_RLF\_AUTOCAST\_RANGE                                     | (a)   | handle  | 1231971891  | `abilityreallevelfield: 000002BC1E36DD60` |         |
| ABILITY\_RLF\_LIFE\_REGEN\_RATE                                   | (a)   | handle  | 1231971892  | `abilityreallevelfield: 000002BC1E36DDA0` |         |
| ABILITY\_RLF\_GRAPHIC\_DELAY\_LIT1                                | (a)   | handle  | 1281979441  | `abilityreallevelfield: 000002BC1E36DDE0` |         |
| ABILITY\_RLF\_GRAPHIC\_DURATION\_LIT2                             | (a)   | handle  | 1281979442  | `abilityreallevelfield: 000002BC1E36DE20` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_LSH1                           | (a)   | handle  | 1282631729  | `abilityreallevelfield: 000002BC1E36DE90` |         |
| ABILITY\_RLF\_MANA\_GAINED                                        | (a)   | handle  | 1298297905  | `abilityreallevelfield: 000002BC1E36DF30` |         |
| ABILITY\_RLF\_HIT\_POINTS\_GAINED\_MBT2                           | (a)   | handle  | 1298297906  | `abilityreallevelfield: 000002BC1E36DF70` |         |
| ABILITY\_RLF\_AUTOCAST\_REQUIREMENT                               | (a)   | handle  | 1298297907  | `abilityreallevelfield: 000002BC1E36DFB0` |         |
| ABILITY\_RLF\_WATER\_HEIGHT                                       | (a)   | handle  | 1298297908  | `abilityreallevelfield: 000002BC1E36DFF0` |         |
| ABILITY\_RLF\_ACTIVATION\_DELAY\_MIN1                             | (a)   | handle  | 1298755121  | `abilityreallevelfield: 000002BC1E36E030` |         |
| ABILITY\_RLF\_INVISIBILITY\_TRANSITION\_TIME                      | (a)   | handle  | 1298755122  | `abilityreallevelfield: 000002BC1E36E070` |         |
| ABILITY\_RLF\_ACTIVATION\_RADIUS                                  | (a)   | handle  | 1315271985  | `abilityreallevelfield: 000002BC1E36E110` |         |
| ABILITY\_RLF\_AMOUNT\_REGENERATED                                 | (a)   | handle  | 1098018097  | `abilityreallevelfield: 000002BC1E36E1B0` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_POI1                           | (a)   | handle  | 1349478705  | `abilityreallevelfield: 000002BC1E36E220` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_FACTOR\_POI2                         | (a)   | handle  | 1349478706  | `abilityreallevelfield: 000002BC1E36E260` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_FACTOR\_POI3                       | (a)   | handle  | 1349478707  | `abilityreallevelfield: 000002BC1E36E2A0` |         |
| ABILITY\_RLF\_EXTRA\_DAMAGE\_POA1                                 | (a)   | handle  | 1349476657  | `abilityreallevelfield: 000002BC1E36E2E0` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_POA2                           | (a)   | handle  | 1349476658  | `abilityreallevelfield: 000002BC1E36E320` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_FACTOR\_POA3                         | (a)   | handle  | 1349476659  | `abilityreallevelfield: 000002BC1E36E360` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_FACTOR\_POA4                       | (a)   | handle  | 1349476660  | `abilityreallevelfield: 000002BC1E36E3A0` |         |
| ABILITY\_RLF\_DAMAGE\_AMPLIFICATION                               | (a)   | handle  | 1349481266  | `abilityreallevelfield: 000002BC1E36E3E0` |         |
| ABILITY\_RLF\_CHANCE\_TO\_STOMP\_PERCENT                          | (a)   | handle  | 1466004017  | `abilityreallevelfield: 000002BC1E36E450` |         |
| ABILITY\_RLF\_DAMAGE\_DEALT\_WAR2                                 | (a)   | handle  | 1466004018  | `abilityreallevelfield: 000002BC1E36E490` |         |
| ABILITY\_RLF\_FULL\_DAMAGE\_RADIUS\_WAR3                          | (a)   | handle  | 1466004019  | `abilityreallevelfield: 000002BC1E36E4D0` |         |
| ABILITY\_RLF\_HALF\_DAMAGE\_RADIUS\_WAR4                          | (a)   | handle  | 1466004020  | `abilityreallevelfield: 000002BC1E36E510` |         |
| ABILITY\_RLF\_SUMMONED\_UNIT\_DAMAGE\_PRG3                        | (a)   | handle  | 1349674803  | `abilityreallevelfield: 000002BC1E36E550` |         |
| ABILITY\_RLF\_UNIT\_PAUSE\_DURATION                               | (a)   | handle  | 1349674804  | `abilityreallevelfield: 000002BC1E36E590` |         |
| ABILITY\_RLF\_HERO\_PAUSE\_DURATION                               | (a)   | handle  | 1349674805  | `abilityreallevelfield: 000002BC1E36E5D0` |         |
| ABILITY\_RLF\_HIT\_POINTS\_GAINED\_REJ1                           | (a)   | handle  | 1382378033  | `abilityreallevelfield: 000002BC1E36E670` |         |
| ABILITY\_RLF\_MANA\_POINTS\_GAINED\_REJ2                          | (a)   | handle  | 1382378034  | `abilityreallevelfield: 000002BC1E36E6B0` |         |
| ABILITY\_RLF\_MINIMUM\_LIFE\_REQUIRED                             | (a)   | handle  | 1383096883  | `abilityreallevelfield: 000002BC1E36E720` |         |
| ABILITY\_RLF\_MINIMUM\_MANA\_REQUIRED                             | (a)   | handle  | 1383096884  | `abilityreallevelfield: 000002BC1E36E760` |         |
| ABILITY\_RLF\_REPAIR\_COST\_RATIO                                 | (a)   | handle  | 1382379569  | `abilityreallevelfield: 000002BC1E36E7A0` |         |
| ABILITY\_RLF\_REPAIR\_TIME\_RATIO                                 | (a)   | handle  | 1382379570  | `abilityreallevelfield: 000002BC1E36E7E0` |         |
| ABILITY\_RLF\_POWERBUILD\_COST                                    | (a)   | handle  | 1382379571  | `abilityreallevelfield: 000002BC1E36E820` |         |
| ABILITY\_RLF\_POWERBUILD\_RATE                                    | (a)   | handle  | 1382379572  | `abilityreallevelfield: 000002BC1E36E860` |         |
| ABILITY\_RLF\_NAVAL\_RANGE\_BONUS                                 | (a)   | handle  | 1382379573  | `abilityreallevelfield: 000002BC1E36E8A0` |         |
| ABILITY\_RLF\_DAMAGE\_INCREASE\_PERCENT\_ROA1                     | (a)   | handle  | 1383031089  | `abilityreallevelfield: 000002BC1E36E8E0` |         |
| ABILITY\_RLF\_LIFE\_REGENERATION\_RATE                            | (a)   | handle  | 1383031091  | `abilityreallevelfield: 000002BC1E36E920` |         |
| ABILITY\_RLF\_MANA\_REGEN                                         | (a)   | handle  | 1383031092  | `abilityreallevelfield: 000002BC1E36E960` |         |
| ABILITY\_RLF\_DAMAGE\_INCREASE                                    | (a)   | handle  | 1315074609  | `abilityreallevelfield: 000002BC1E36E9A0` |         |
| ABILITY\_RLF\_SALVAGE\_COST\_RATIO                                | (a)   | handle  | 1398893617  | `abilityreallevelfield: 000002BC1E36E9E0` |         |
| ABILITY\_RLF\_IN\_FLIGHT\_SIGHT\_RADIUS                           | (a)   | handle  | 1165192753  | `abilityreallevelfield: 000002BC1E36EA20` |         |
| ABILITY\_RLF\_HOVERING\_SIGHT\_RADIUS                             | (a)   | handle  | 1165192754  | `abilityreallevelfield: 000002BC1E36EA60` |         |
| ABILITY\_RLF\_HOVERING\_HEIGHT                                    | (a)   | handle  | 1165192755  | `abilityreallevelfield: 000002BC1E36EAA0` |         |
| ABILITY\_RLF\_DURATION\_OF\_OWLS                                  | (a)   | handle  | 1165192757  | `abilityreallevelfield: 000002BC1E36EAE0` |         |
| ABILITY\_RLF\_FADE\_DURATION                                      | (a)   | handle  | 1399352625  | `abilityreallevelfield: 000002BC1E36EB20` |         |
| ABILITY\_RLF\_DAY\_NIGHT\_DURATION                                | (a)   | handle  | 1399352626  | `abilityreallevelfield: 000002BC1E36EB60` |         |
| ABILITY\_RLF\_ACTION\_DURATION                                    | (a)   | handle  | 1399352627  | `abilityreallevelfield: 000002BC1E36EBA0` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_FACTOR\_SLO1                       | (a)   | handle  | 1399615281  | `abilityreallevelfield: 000002BC1E36EBE0` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_FACTOR\_SLO2                         | (a)   | handle  | 1399615282  | `abilityreallevelfield: 000002BC1E36EC20` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_SPO1                           | (a)   | handle  | 1399877425  | `abilityreallevelfield: 000002BC1E36EC60` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_FACTOR\_SPO2                       | (a)   | handle  | 1399877426  | `abilityreallevelfield: 000002BC1E36ECA0` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_FACTOR\_SPO3                         | (a)   | handle  | 1399877427  | `abilityreallevelfield: 000002BC1E36ECE0` |         |
| ABILITY\_RLF\_ACTIVATION\_DELAY\_STA1                             | (a)   | handle  | 1400135985  | `abilityreallevelfield: 000002BC1E36ED20` |         |
| ABILITY\_RLF\_DETECTION\_RADIUS\_STA2                             | (a)   | handle  | 1400135986  | `abilityreallevelfield: 000002BC1E36ED60` |         |
| ABILITY\_RLF\_DETONATION\_RADIUS                                  | (a)   | handle  | 1400135987  | `abilityreallevelfield: 000002BC1E36EDA0` |         |
| ABILITY\_RLF\_STUN\_DURATION\_STA4                                | (a)   | handle  | 1400135988  | `abilityreallevelfield: 000002BC1E36EDE0` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_BONUS\_PERCENT                       | (a)   | handle  | 1432905265  | `abilityreallevelfield: 000002BC1E36EE20` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_UHF2                           | (a)   | handle  | 1432905266  | `abilityreallevelfield: 000002BC1E36EE60` |         |
| ABILITY\_RLF\_LUMBER\_PER\_INTERVAL                               | (a)   | handle  | 1466458417  | `abilityreallevelfield: 000002BC1E36EEA0` |         |
| ABILITY\_RLF\_ART\_ATTACHMENT\_HEIGHT                             | (a)   | handle  | 1466458419  | `abilityreallevelfield: 000002BC1E36EEE0` |         |
| ABILITY\_RLF\_TELEPORT\_AREA\_WIDTH                               | (a)   | handle  | 1467117617  | `abilityreallevelfield: 000002BC1E36EF20` |         |
| ABILITY\_RLF\_TELEPORT\_AREA\_HEIGHT                              | (a)   | handle  | 1467117618  | `abilityreallevelfield: 000002BC1E36EF60` |         |
| ABILITY\_RLF\_LIFE\_STOLEN\_PER\_ATTACK                           | (a)   | handle  | 1232494957  | `abilityreallevelfield: 000002BC1E36EFA0` |         |
| ABILITY\_RLF\_DAMAGE\_BONUS\_IDAM                                 | (a)   | handle  | 1231315309  | `abilityreallevelfield: 000002BC1E36EFE0` |         |
| ABILITY\_RLF\_CHANCE\_TO\_HIT\_UNITS\_PERCENT                     | (a)   | handle  | 1232036402  | `abilityreallevelfield: 000002BC1E36F020` |         |
| ABILITY\_RLF\_CHANCE\_TO\_HIT\_HEROS\_PERCENT                     | (a)   | handle  | 1232036403  | `abilityreallevelfield: 000002BC1E36F060` |         |
| ABILITY\_RLF\_CHANCE\_TO\_HIT\_SUMMONS\_PERCENT                   | (a)   | handle  | 1232036404  | `abilityreallevelfield: 000002BC1E36F0A0` |         |
| ABILITY\_RLF\_DELAY\_FOR\_TARGET\_EFFECT                          | (a)   | handle  | 1231316332  | `abilityreallevelfield: 000002BC1E36F0E0` |         |
| ABILITY\_RLF\_DAMAGE\_DEALT\_PERCENT\_OF\_NORMAL                  | (a)   | handle  | 1231645796  | `abilityreallevelfield: 000002BC1E36F120` |         |
| ABILITY\_RLF\_DAMAGE\_RECEIVED\_MULTIPLIER                        | (a)   | handle  | 1231645815  | `abilityreallevelfield: 000002BC1E36F190` |         |
| ABILITY\_RLF\_MANA\_REGENERATION\_BONUS\_AS\_FRACTION\_OF\_NORMAL | (a)   | handle  | 1231909488  | `abilityreallevelfield: 000002BC1E36F1D0` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_INCREASE\_ISPI                     | (a)   | handle  | 1232302185  | `abilityreallevelfield: 000002BC1E36F210` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_IDPS                           | (a)   | handle  | 1231319155  | `abilityreallevelfield: 000002BC1E36F250` |         |
| ABILITY\_RLF\_ATTACK\_DAMAGE\_INCREASE\_CAC1                      | (a)   | handle  | 1130455857  | `abilityreallevelfield: 000002BC1E36F2C0` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_COR1                           | (a)   | handle  | 1131377201  | `abilityreallevelfield: 000002BC1E36F300` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_INCREASE\_ISX1                       | (a)   | handle  | 1232304177  | `abilityreallevelfield: 000002BC1E36F370` |         |
| ABILITY\_RLF\_DAMAGE\_WRS1                                        | (a)   | handle  | 1467118385  | `abilityreallevelfield: 000002BC1E36F3B0` |         |
| ABILITY\_RLF\_TERRAIN\_DEFORMATION\_AMPLITUDE                     | (a)   | handle  | 1467118386  | `abilityreallevelfield: 000002BC1E36F3F0` |         |
| ABILITY\_RLF\_DAMAGE\_CTC1                                        | (a)   | handle  | 1131701041  | `abilityreallevelfield: 000002BC1E36F430` |         |
| ABILITY\_RLF\_EXTRA\_DAMAGE\_TO\_TARGET                           | (a)   | handle  | 1131701042  | `abilityreallevelfield: 000002BC1E36F470` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_REDUCTION\_CTC3                    | (a)   | handle  | 1131701043  | `abilityreallevelfield: 000002BC1E36F4B0` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_REDUCTION\_CTC4                      | (a)   | handle  | 1131701044  | `abilityreallevelfield: 000002BC1E36F4F0` |         |
| ABILITY\_RLF\_DAMAGE\_CTB1                                        | (a)   | handle  | 1131700785  | `abilityreallevelfield: 000002BC1E36F530` |         |
| ABILITY\_RLF\_CASTING\_DELAY\_SECONDS                             | (a)   | handle  | 1432646450  | `abilityreallevelfield: 000002BC1E36F570` |         |
| ABILITY\_RLF\_MANA\_LOSS\_PER\_UNIT\_DTN1                         | (a)   | handle  | 1148481073  | `abilityreallevelfield: 000002BC1E36F5B0` |         |
| ABILITY\_RLF\_DAMAGE\_TO\_SUMMONED\_UNITS\_DTN2                   | (a)   | handle  | 1148481074  | `abilityreallevelfield: 000002BC1E36F5F0` |         |
| ABILITY\_RLF\_TRANSITION\_TIME\_SECONDS                           | (a)   | handle  | 1232499505  | `abilityreallevelfield: 000002BC1E36F630` |         |
| ABILITY\_RLF\_MANA\_DRAINED\_PER\_SECOND\_NMR1                    | (a)   | handle  | 1315795505  | `abilityreallevelfield: 000002BC1E36F670` |         |
| ABILITY\_RLF\_CHANCE\_TO\_REDUCE\_DAMAGE\_PERCENT                 | (a)   | handle  | 1400073009  | `abilityreallevelfield: 000002BC1E36F6E0` |         |
| ABILITY\_RLF\_MINIMUM\_DAMAGE                                     | (a)   | handle  | 1400073010  | `abilityreallevelfield: 000002BC1E36F720` |         |
| ABILITY\_RLF\_IGNORED\_DAMAGE                                     | (a)   | handle  | 1400073011  | `abilityreallevelfield: 000002BC1E36F760` |         |
| ABILITY\_RLF\_FULL\_DAMAGE\_DEALT                                 | (a)   | handle  | 1214673713  | `abilityreallevelfield: 000002BC1E36F7A0` |         |
| ABILITY\_RLF\_FULL\_DAMAGE\_INTERVAL                              | (a)   | handle  | 1214673714  | `abilityreallevelfield: 000002BC1E36F7E0` |         |
| ABILITY\_RLF\_HALF\_DAMAGE\_DEALT                                 | (a)   | handle  | 1214673715  | `abilityreallevelfield: 000002BC1E36F820` |         |
| ABILITY\_RLF\_HALF\_DAMAGE\_INTERVAL                              | (a)   | handle  | 1214673716  | `abilityreallevelfield: 000002BC1E36F860` |         |
| ABILITY\_RLF\_BUILDING\_REDUCTION\_HFS5                           | (a)   | handle  | 1214673717  | `abilityreallevelfield: 000002BC1E36F8A0` |         |
| ABILITY\_RLF\_MAXIMUM\_DAMAGE\_HFS6                               | (a)   | handle  | 1214673718  | `abilityreallevelfield: 000002BC1E36F8E0` |         |
| ABILITY\_RLF\_MANA\_PER\_HIT\_POINT                               | (a)   | handle  | 1315795761  | `abilityreallevelfield: 000002BC1E36F920` |         |
| ABILITY\_RLF\_DAMAGE\_ABSORBED\_PERCENT                           | (a)   | handle  | 1315795762  | `abilityreallevelfield: 000002BC1E36F960` |         |
| ABILITY\_RLF\_WAVE\_DISTANCE                                      | (a)   | handle  | 1432972593  | `abilityreallevelfield: 000002BC1E36F9A0` |         |
| ABILITY\_RLF\_WAVE\_TIME\_SECONDS                                 | (a)   | handle  | 1432972594  | `abilityreallevelfield: 000002BC1E36F9E0` |         |
| ABILITY\_RLF\_DAMAGE\_DEALT\_UIM3                                 | (a)   | handle  | 1432972595  | `abilityreallevelfield: 000002BC1E36FA20` |         |
| ABILITY\_RLF\_AIR\_TIME\_SECONDS\_UIM4                            | (a)   | handle  | 1432972596  | `abilityreallevelfield: 000002BC1E36FA60` |         |
| ABILITY\_RLF\_UNIT\_RELEASE\_INTERVAL\_SECONDS                    | (a)   | handle  | 1433170738  | `abilityreallevelfield: 000002BC1E36FAA0` |         |
| ABILITY\_RLF\_DAMAGE\_RETURN\_FACTOR                              | (a)   | handle  | 1433170740  | `abilityreallevelfield: 000002BC1E36FAE0` |         |
| ABILITY\_RLF\_DAMAGE\_RETURN\_THRESHOLD                           | (a)   | handle  | 1433170741  | `abilityreallevelfield: 000002BC1E36FB20` |         |
| ABILITY\_RLF\_RETURNED\_DAMAGE\_FACTOR                            | (a)   | handle  | 1433695025  | `abilityreallevelfield: 000002BC1E36FB60` |         |
| ABILITY\_RLF\_RECEIVED\_DAMAGE\_FACTOR                            | (a)   | handle  | 1433695026  | `abilityreallevelfield: 000002BC1E36FBA0` |         |
| ABILITY\_RLF\_DEFENSE\_BONUS\_UTS3                                | (a)   | handle  | 1433695027  | `abilityreallevelfield: 000002BC1E36FBE0` |         |
| ABILITY\_RLF\_DAMAGE\_BONUS\_NBA1                                 | (a)   | handle  | 1315070257  | `abilityreallevelfield: 000002BC1E36FC20` |         |
| ABILITY\_RLF\_SUMMONED\_UNIT\_DURATION\_SECONDS\_NBA3             | (a)   | handle  | 1315070259  | `abilityreallevelfield: 000002BC1E36FC60` |         |
| ABILITY\_RLF\_MANA\_PER\_SUMMONED\_HITPOINT                       | (a)   | handle  | 1131243314  | `abilityreallevelfield: 000002BC1E36FCA0` |         |
| ABILITY\_RLF\_CHARGE\_FOR\_CURRENT\_LIFE                          | (a)   | handle  | 1131243315  | `abilityreallevelfield: 000002BC1E36FCE0` |         |
| ABILITY\_RLF\_HIT\_POINTS\_DRAINED                                | (a)   | handle  | 1315205681  | `abilityreallevelfield: 000002BC1E36FD20` |         |
| ABILITY\_RLF\_MANA\_POINTS\_DRAINED                               | (a)   | handle  | 1315205682  | `abilityreallevelfield: 000002BC1E36FD60` |         |
| ABILITY\_RLF\_DRAIN\_INTERVAL\_SECONDS                            | (a)   | handle  | 1315205683  | `abilityreallevelfield: 000002BC1E36FDA0` |         |
| ABILITY\_RLF\_LIFE\_TRANSFERRED\_PER\_SECOND                      | (a)   | handle  | 1315205684  | `abilityreallevelfield: 000002BC1E36FDE0` |         |
| ABILITY\_RLF\_MANA\_TRANSFERRED\_PER\_SECOND                      | (a)   | handle  | 1315205685  | `abilityreallevelfield: 000002BC1E36FE20` |         |
| ABILITY\_RLF\_BONUS\_LIFE\_FACTOR                                 | (a)   | handle  | 1315205686  | `abilityreallevelfield: 000002BC1E36FE60` |         |
| ABILITY\_RLF\_BONUS\_LIFE\_DECAY                                  | (a)   | handle  | 1315205687  | `abilityreallevelfield: 000002BC1E36FEA0` |         |
| ABILITY\_RLF\_BONUS\_MANA\_FACTOR                                 | (a)   | handle  | 1315205688  | `abilityreallevelfield: 000002BC1E36FEE0` |         |
| ABILITY\_RLF\_BONUS\_MANA\_DECAY                                  | (a)   | handle  | 1315205689  | `abilityreallevelfield: 000002BC1E36FF50` |         |
| ABILITY\_RLF\_CHANCE\_TO\_MISS\_PERCENT                           | (a)   | handle  | 1316186418  | `abilityreallevelfield: 000002BC1E36FF90` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_MODIFIER                           | (a)   | handle  | 1316186419  | `abilityreallevelfield: 000002BC1E36FFD0` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_MODIFIER                             | (a)   | handle  | 1316186420  | `abilityreallevelfield: 000002BC1E370010` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_TDG1                           | (a)   | handle  | 1415866161  | `abilityreallevelfield: 000002BC1E370080` |         |
| ABILITY\_RLF\_MEDIUM\_DAMAGE\_RADIUS\_TDG2                        | (a)   | handle  | 1415866162  | `abilityreallevelfield: 000002BC1E3700C0` |         |
| ABILITY\_RLF\_MEDIUM\_DAMAGE\_PER\_SECOND                         | (a)   | handle  | 1415866163  | `abilityreallevelfield: 000002BC1E370100` |         |
| ABILITY\_RLF\_SMALL\_DAMAGE\_RADIUS\_TDG4                         | (a)   | handle  | 1415866164  | `abilityreallevelfield: 000002BC1E370140` |         |
| ABILITY\_RLF\_SMALL\_DAMAGE\_PER\_SECOND                          | (a)   | handle  | 1415866165  | `abilityreallevelfield: 000002BC1E370180` |         |
| ABILITY\_RLF\_AIR\_TIME\_SECONDS\_TSP1                            | (a)   | handle  | 1416851505  | `abilityreallevelfield: 000002BC1E3701C0` |         |
| ABILITY\_RLF\_MINIMUM\_HIT\_INTERVAL\_SECONDS                     | (a)   | handle  | 1416851506  | `abilityreallevelfield: 000002BC1E370200` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_NBF5                           | (a)   | handle  | 1315071541  | `abilityreallevelfield: 000002BC1E370240` |         |
| ABILITY\_RLF\_MAXIMUM\_RANGE                                      | (a)   | handle  | 1164078129  | `abilityreallevelfield: 000002BC1E370280` |         |
| ABILITY\_RLF\_MINIMUM\_RANGE                                      | (a)   | handle  | 1164078130  | `abilityreallevelfield: 000002BC1E3702C0` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_TARGET\_EFK1                           | (a)   | handle  | 1164340017  | `abilityreallevelfield: 000002BC1E370300` |         |
| ABILITY\_RLF\_MAXIMUM\_TOTAL\_DAMAGE                              | (a)   | handle  | 1164340018  | `abilityreallevelfield: 000002BC1E370340` |         |
| ABILITY\_RLF\_MAXIMUM\_SPEED\_ADJUSTMENT                          | (a)   | handle  | 1164340020  | `abilityreallevelfield: 000002BC1E370380` |         |
| ABILITY\_RLF\_DECAYING\_DAMAGE                                    | (a)   | handle  | 1165191217  | `abilityreallevelfield: 000002BC1E3703C0` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_FACTOR\_ESH2                       | (a)   | handle  | 1165191218  | `abilityreallevelfield: 000002BC1E370400` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_FACTOR\_ESH3                         | (a)   | handle  | 1165191219  | `abilityreallevelfield: 000002BC1E370440` |         |
| ABILITY\_RLF\_DECAY\_POWER                                        | (a)   | handle  | 1165191220  | `abilityreallevelfield: 000002BC1E370480` |         |
| ABILITY\_RLF\_INITIAL\_DAMAGE\_ESH5                               | (a)   | handle  | 1165191221  | `abilityreallevelfield: 000002BC1E3704C0` |         |
| ABILITY\_RLF\_MAXIMUM\_LIFE\_ABSORBED                             | (a)   | handle  | 1633841969  | `abilityreallevelfield: 000002BC1E370500` |         |
| ABILITY\_RLF\_MAXIMUM\_MANA\_ABSORBED                             | (a)   | handle  | 1633841970  | `abilityreallevelfield: 000002BC1E370540` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_INCREASE\_BSK1                     | (a)   | handle  | 1651731249  | `abilityreallevelfield: 000002BC1E370580` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_INCREASE\_BSK2                       | (a)   | handle  | 1651731250  | `abilityreallevelfield: 000002BC1E3705C0` |         |
| ABILITY\_RLF\_DAMAGE\_TAKEN\_INCREASE                             | (a)   | handle  | 1651731251  | `abilityreallevelfield: 000002BC1E370600` |         |
| ABILITY\_RLF\_LIFE\_PER\_UNIT                                     | (a)   | handle  | 1685482801  | `abilityreallevelfield: 000002BC1E370640` |         |
| ABILITY\_RLF\_MANA\_PER\_UNIT                                     | (a)   | handle  | 1685482802  | `abilityreallevelfield: 000002BC1E370680` |         |
| ABILITY\_RLF\_LIFE\_PER\_BUFF                                     | (a)   | handle  | 1685482803  | `abilityreallevelfield: 000002BC1E3706C0` |         |
| ABILITY\_RLF\_MANA\_PER\_BUFF                                     | (a)   | handle  | 1685482804  | `abilityreallevelfield: 000002BC1E370700` |         |
| ABILITY\_RLF\_SUMMONED\_UNIT\_DAMAGE\_DVM5                        | (a)   | handle  | 1685482805  | `abilityreallevelfield: 000002BC1E370740` |         |
| ABILITY\_RLF\_DAMAGE\_BONUS\_FAK1                                 | (a)   | handle  | 1717660465  | `abilityreallevelfield: 000002BC1E370780` |         |
| ABILITY\_RLF\_MEDIUM\_DAMAGE\_FACTOR\_FAK2                        | (a)   | handle  | 1717660466  | `abilityreallevelfield: 000002BC1E3707C0` |         |
| ABILITY\_RLF\_SMALL\_DAMAGE\_FACTOR\_FAK3                         | (a)   | handle  | 1717660467  | `abilityreallevelfield: 000002BC1E370800` |         |
| ABILITY\_RLF\_FULL\_DAMAGE\_RADIUS\_FAK4                          | (a)   | handle  | 1717660468  | `abilityreallevelfield: 000002BC1E370840` |         |
| ABILITY\_RLF\_HALF\_DAMAGE\_RADIUS\_FAK5                          | (a)   | handle  | 1717660469  | `abilityreallevelfield: 000002BC1E370880` |         |
| ABILITY\_RLF\_EXTRA\_DAMAGE\_PER\_SECOND                          | (a)   | handle  | 1818849585  | `abilityreallevelfield: 000002BC1E3708F0` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_REDUCTION\_LIQ2                    | (a)   | handle  | 1818849586  | `abilityreallevelfield: 000002BC1E370930` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_REDUCTION\_LIQ3                      | (a)   | handle  | 1818849587  | `abilityreallevelfield: 000002BC1E370970` |         |
| ABILITY\_RLF\_MAGIC\_DAMAGE\_FACTOR                               | (a)   | handle  | 1835625777  | `abilityreallevelfield: 000002BC1E3709B0` |         |
| ABILITY\_RLF\_UNIT\_DAMAGE\_PER\_MANA\_POINT                      | (a)   | handle  | 1835428913  | `abilityreallevelfield: 000002BC1E3709F0` |         |
| ABILITY\_RLF\_HERO\_DAMAGE\_PER\_MANA\_POINT                      | (a)   | handle  | 1835428914  | `abilityreallevelfield: 000002BC1E370A30` |         |
| ABILITY\_RLF\_UNIT\_MAXIMUM\_DAMAGE                               | (a)   | handle  | 1835428915  | `abilityreallevelfield: 000002BC1E370A70` |         |
| ABILITY\_RLF\_HERO\_MAXIMUM\_DAMAGE                               | (a)   | handle  | 1835428916  | `abilityreallevelfield: 000002BC1E370AB0` |         |
| ABILITY\_RLF\_DAMAGE\_COOLDOWN                                    | (a)   | handle  | 1835428917  | `abilityreallevelfield: 000002BC1E370AF0` |         |
| ABILITY\_RLF\_DISTRIBUTED\_DAMAGE\_FACTOR\_SPL1                   | (a)   | handle  | 1936747569  | `abilityreallevelfield: 000002BC1E370B30` |         |
| ABILITY\_RLF\_LIFE\_REGENERATED                                   | (a)   | handle  | 1769106481  | `abilityreallevelfield: 000002BC1E370B70` |         |
| ABILITY\_RLF\_MANA\_REGENERATED                                   | (a)   | handle  | 1769106482  | `abilityreallevelfield: 000002BC1E370BB0` |         |
| ABILITY\_RLF\_MANA\_LOSS\_PER\_UNIT\_IDC1                         | (a)   | handle  | 1768186673  | `abilityreallevelfield: 000002BC1E370BF0` |         |
| ABILITY\_RLF\_SUMMONED\_UNIT\_DAMAGE\_IDC2                        | (a)   | handle  | 1768186674  | `abilityreallevelfield: 000002BC1E370C30` |         |
| ABILITY\_RLF\_ACTIVATION\_DELAY\_IMO2                             | (a)   | handle  | 1768779570  | `abilityreallevelfield: 000002BC1E370C70` |         |
| ABILITY\_RLF\_LURE\_INTERVAL\_SECONDS                             | (a)   | handle  | 1768779571  | `abilityreallevelfield: 000002BC1E370CB0` |         |
| ABILITY\_RLF\_DAMAGE\_BONUS\_ISR1                                 | (a)   | handle  | 1769173553  | `abilityreallevelfield: 000002BC1E370CF0` |         |
| ABILITY\_RLF\_DAMAGE\_REDUCTION\_ISR2                             | (a)   | handle  | 1769173554  | `abilityreallevelfield: 000002BC1E370D30` |         |
| ABILITY\_RLF\_DAMAGE\_BONUS\_IPV1                                 | (a)   | handle  | 1768977969  | `abilityreallevelfield: 000002BC1E370D70` |         |
| ABILITY\_RLF\_LIFE\_STEAL\_AMOUNT                                 | (a)   | handle  | 1768977970  | `abilityreallevelfield: 000002BC1E370DB0` |         |
| ABILITY\_RLF\_LIFE\_RESTORED\_FACTOR                              | (a)   | handle  | 1634956337  | `abilityreallevelfield: 000002BC1E370DF0` |         |
| ABILITY\_RLF\_MANA\_RESTORED\_FACTOR                              | (a)   | handle  | 1634956338  | `abilityreallevelfield: 000002BC1E370E30` |         |
| ABILITY\_RLF\_ATTACH\_DELAY                                       | (a)   | handle  | 1735549233  | `abilityreallevelfield: 000002BC1E370E70` |         |
| ABILITY\_RLF\_REMOVE\_DELAY                                       | (a)   | handle  | 1735549234  | `abilityreallevelfield: 000002BC1E370EB0` |         |
| ABILITY\_RLF\_HERO\_REGENERATION\_DELAY                           | (a)   | handle  | 1316184370  | `abilityreallevelfield: 000002BC1E370EF0` |         |
| ABILITY\_RLF\_UNIT\_REGENERATION\_DELAY                           | (a)   | handle  | 1316184371  | `abilityreallevelfield: 000002BC1E370F30` |         |
| ABILITY\_RLF\_MAGIC\_DAMAGE\_REDUCTION\_NSA4                      | (a)   | handle  | 1316184372  | `abilityreallevelfield: 000002BC1E370F70` |         |
| ABILITY\_RLF\_HIT\_POINTS\_PER\_SECOND\_NSA5                      | (a)   | handle  | 1316184373  | `abilityreallevelfield: 000002BC1E370FB0` |         |
| ABILITY\_RLF\_DAMAGE\_TO\_SUMMONED\_UNITS\_IXS1                   | (a)   | handle  | 1232630577  | `abilityreallevelfield: 000002BC1E370FF0` |         |
| ABILITY\_RLF\_MAGIC\_DAMAGE\_REDUCTION\_IXS2                      | (a)   | handle  | 1232630578  | `abilityreallevelfield: 000002BC1E371030` |         |
| ABILITY\_RLF\_SUMMONED\_UNIT\_DURATION                            | (a)   | handle  | 1315987766  | `abilityreallevelfield: 000002BC1E371070` |         |
| ABILITY\_RLF\_SHIELD\_COOLDOWN\_TIME                              | (a)   | handle  | 1316185393  | `abilityreallevelfield: 000002BC1E3710B0` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_NDO1                           | (a)   | handle  | 1315204913  | `abilityreallevelfield: 000002BC1E3710F0` |         |
| ABILITY\_RLF\_SUMMONED\_UNIT\_DURATION\_SECONDS\_NDO3             | (a)   | handle  | 1315204915  | `abilityreallevelfield: 000002BC1E371130` |         |
| ABILITY\_RLF\_MEDIUM\_DAMAGE\_RADIUS\_FLK1                        | (a)   | handle  | 1718381361  | `abilityreallevelfield: 000002BC1E371170` |         |
| ABILITY\_RLF\_SMALL\_DAMAGE\_RADIUS\_FLK2                         | (a)   | handle  | 1718381362  | `abilityreallevelfield: 000002BC1E3711B0` |         |
| ABILITY\_RLF\_FULL\_DAMAGE\_AMOUNT\_FLK3                          | (a)   | handle  | 1718381363  | `abilityreallevelfield: 000002BC1E3711F0` |         |
| ABILITY\_RLF\_MEDIUM\_DAMAGE\_AMOUNT                              | (a)   | handle  | 1718381364  | `abilityreallevelfield: 000002BC1E371230` |         |
| ABILITY\_RLF\_SMALL\_DAMAGE\_AMOUNT                               | (a)   | handle  | 1718381365  | `abilityreallevelfield: 000002BC1E371270` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_REDUCTION\_PERCENT\_HBN1           | (a)   | handle  | 1214410289  | `abilityreallevelfield: 000002BC1E3712B0` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_REDUCTION\_PERCENT\_HBN2             | (a)   | handle  | 1214410290  | `abilityreallevelfield: 000002BC1E3712F0` |         |
| ABILITY\_RLF\_MAX\_MANA\_DRAINED\_UNITS                           | (a)   | handle  | 1717726001  | `abilityreallevelfield: 000002BC1E371330` |         |
| ABILITY\_RLF\_DAMAGE\_RATIO\_UNITS\_PERCENT                       | (a)   | handle  | 1717726002  | `abilityreallevelfield: 000002BC1E371370` |         |
| ABILITY\_RLF\_MAX\_MANA\_DRAINED\_HEROS                           | (a)   | handle  | 1717726003  | `abilityreallevelfield: 000002BC1E3713B0` |         |
| ABILITY\_RLF\_DAMAGE\_RATIO\_HEROS\_PERCENT                       | (a)   | handle  | 1717726004  | `abilityreallevelfield: 000002BC1E3713F0` |         |
| ABILITY\_RLF\_SUMMONED\_DAMAGE                                    | (a)   | handle  | 1717726005  | `abilityreallevelfield: 000002BC1E371430` |         |
| ABILITY\_RLF\_DISTRIBUTED\_DAMAGE\_FACTOR\_NCA1                   | (a)   | handle  | 1852006705  | `abilityreallevelfield: 000002BC1E371470` |         |
| ABILITY\_RLF\_INITIAL\_DAMAGE\_PXF1                               | (a)   | handle  | 1886938673  | `abilityreallevelfield: 000002BC1E3714B0` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_PXF2                           | (a)   | handle  | 1886938674  | `abilityreallevelfield: 000002BC1E3714F0` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_MLS1                           | (a)   | handle  | 1835823921  | `abilityreallevelfield: 000002BC1E371530` |         |
| ABILITY\_RLF\_BEAST\_COLLISION\_RADIUS                            | (a)   | handle  | 1316189234  | `abilityreallevelfield: 000002BC1E371570` |         |
| ABILITY\_RLF\_DAMAGE\_AMOUNT\_NST3                                | (a)   | handle  | 1316189235  | `abilityreallevelfield: 000002BC1E3715B0` |         |
| ABILITY\_RLF\_DAMAGE\_RADIUS                                      | (a)   | handle  | 1316189236  | `abilityreallevelfield: 000002BC1E3715F0` |         |
| ABILITY\_RLF\_DAMAGE\_DELAY                                       | (a)   | handle  | 1316189237  | `abilityreallevelfield: 000002BC1E371630` |         |
| ABILITY\_RLF\_FOLLOW\_THROUGH\_TIME                               | (a)   | handle  | 1315138609  | `abilityreallevelfield: 000002BC1E371670` |         |
| ABILITY\_RLF\_ART\_DURATION                                       | (a)   | handle  | 1315138612  | `abilityreallevelfield: 000002BC1E3716B0` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_REDUCTION\_PERCENT\_NAB1           | (a)   | handle  | 1315004977  | `abilityreallevelfield: 000002BC1E3716F0` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_REDUCTION\_PERCENT\_NAB2             | (a)   | handle  | 1315004978  | `abilityreallevelfield: 000002BC1E371730` |         |
| ABILITY\_RLF\_PRIMARY\_DAMAGE                                     | (a)   | handle  | 1315004980  | `abilityreallevelfield: 000002BC1E371770` |         |
| ABILITY\_RLF\_SECONDARY\_DAMAGE                                   | (a)   | handle  | 1315004981  | `abilityreallevelfield: 000002BC1E3717B0` |         |
| ABILITY\_RLF\_DAMAGE\_INTERVAL\_NAB6                              | (a)   | handle  | 1315004982  | `abilityreallevelfield: 000002BC1E3717F0` |         |
| ABILITY\_RLF\_GOLD\_COST\_FACTOR                                  | (a)   | handle  | 1316252977  | `abilityreallevelfield: 000002BC1E371830` |         |
| ABILITY\_RLF\_LUMBER\_COST\_FACTOR                                | (a)   | handle  | 1316252978  | `abilityreallevelfield: 000002BC1E371870` |         |
| ABILITY\_RLF\_MOVE\_SPEED\_BONUS\_NEG1                            | (a)   | handle  | 1315268401  | `abilityreallevelfield: 000002BC1E3718B0` |         |
| ABILITY\_RLF\_DAMAGE\_BONUS\_NEG2                                 | (a)   | handle  | 1315268402  | `abilityreallevelfield: 000002BC1E3718F0` |         |
| ABILITY\_RLF\_DAMAGE\_AMOUNT\_NCS1                                | (a)   | handle  | 1315140401  | `abilityreallevelfield: 000002BC1E371930` |         |
| ABILITY\_RLF\_DAMAGE\_INTERVAL\_NCS2                              | (a)   | handle  | 1315140402  | `abilityreallevelfield: 000002BC1E371970` |         |
| ABILITY\_RLF\_MAX\_DAMAGE\_NCS4                                   | (a)   | handle  | 1315140404  | `abilityreallevelfield: 000002BC1E3719B0` |         |
| ABILITY\_RLF\_BUILDING\_DAMAGE\_FACTOR\_NCS5                      | (a)   | handle  | 1315140405  | `abilityreallevelfield: 000002BC1E3719F0` |         |
| ABILITY\_RLF\_EFFECT\_DURATION                                    | (a)   | handle  | 1315140406  | `abilityreallevelfield: 000002BC1E371A30` |         |
| ABILITY\_RLF\_SPAWN\_INTERVAL\_NSY1                               | (a)   | handle  | 1316190513  | `abilityreallevelfield: 000002BC1E371A70` |         |
| ABILITY\_RLF\_SPAWN\_UNIT\_DURATION                               | (a)   | handle  | 1316190515  | `abilityreallevelfield: 000002BC1E371AB0` |         |
| ABILITY\_RLF\_SPAWN\_UNIT\_OFFSET                                 | (a)   | handle  | 1316190516  | `abilityreallevelfield: 000002BC1E371AF0` |         |
| ABILITY\_RLF\_LEASH\_RANGE\_NSY5                                  | (a)   | handle  | 1316190517  | `abilityreallevelfield: 000002BC1E371B30` |         |
| ABILITY\_RLF\_SPAWN\_INTERVAL\_NFY1                               | (a)   | handle  | 1315338545  | `abilityreallevelfield: 000002BC1E371B70` |         |
| ABILITY\_RLF\_LEASH\_RANGE\_NFY2                                  | (a)   | handle  | 1315338546  | `abilityreallevelfield: 000002BC1E371BB0` |         |
| ABILITY\_RLF\_CHANCE\_TO\_DEMOLISH                                | (a)   | handle  | 1315202353  | `abilityreallevelfield: 000002BC1E371BF0` |         |
| ABILITY\_RLF\_DAMAGE\_MULTIPLIER\_BUILDINGS                       | (a)   | handle  | 1315202354  | `abilityreallevelfield: 000002BC1E371C30` |         |
| ABILITY\_RLF\_DAMAGE\_MULTIPLIER\_UNITS                           | (a)   | handle  | 1315202355  | `abilityreallevelfield: 000002BC1E371C70` |         |
| ABILITY\_RLF\_DAMAGE\_MULTIPLIER\_HEROES                          | (a)   | handle  | 1315202356  | `abilityreallevelfield: 000002BC1E371CB0` |         |
| ABILITY\_RLF\_BONUS\_DAMAGE\_MULTIPLIER                           | (a)   | handle  | 1315529521  | `abilityreallevelfield: 000002BC1E371CF0` |         |
| ABILITY\_RLF\_DEATH\_DAMAGE\_FULL\_AMOUNT                         | (a)   | handle  | 1315529522  | `abilityreallevelfield: 000002BC1E371D30` |         |
| ABILITY\_RLF\_DEATH\_DAMAGE\_FULL\_AREA                           | (a)   | handle  | 1315529523  | `abilityreallevelfield: 000002BC1E371D70` |         |
| ABILITY\_RLF\_DEATH\_DAMAGE\_HALF\_AMOUNT                         | (a)   | handle  | 1315529524  | `abilityreallevelfield: 000002BC1E371DB0` |         |
| ABILITY\_RLF\_DEATH\_DAMAGE\_HALF\_AREA                           | (a)   | handle  | 1315529525  | `abilityreallevelfield: 000002BC1E371DF0` |         |
| ABILITY\_RLF\_DEATH\_DAMAGE\_DELAY                                | (a)   | handle  | 1315529526  | `abilityreallevelfield: 000002BC1E371E30` |         |
| ABILITY\_RLF\_DAMAGE\_AMOUNT\_NSO1                                | (a)   | handle  | 1316187953  | `abilityreallevelfield: 000002BC1E371E70` |         |
| ABILITY\_RLF\_DAMAGE\_PERIOD                                      | (a)   | handle  | 1316187954  | `abilityreallevelfield: 000002BC1E371EB0` |         |
| ABILITY\_RLF\_DAMAGE\_PENALTY                                     | (a)   | handle  | 1316187955  | `abilityreallevelfield: 000002BC1E371EF0` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_REDUCTION\_PERCENT\_NSO4           | (a)   | handle  | 1316187956  | `abilityreallevelfield: 000002BC1E371F30` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_REDUCTION\_PERCENT\_NSO5             | (a)   | handle  | 1316187957  | `abilityreallevelfield: 000002BC1E371F70` |         |
| ABILITY\_RLF\_SPLIT\_DELAY                                        | (a)   | handle  | 1315728690  | `abilityreallevelfield: 000002BC1E371FB0` |         |
| ABILITY\_RLF\_MAX\_HITPOINT\_FACTOR                               | (a)   | handle  | 1315728692  | `abilityreallevelfield: 000002BC1E371FF0` |         |
| ABILITY\_RLF\_LIFE\_DURATION\_SPLIT\_BONUS                        | (a)   | handle  | 1315728693  | `abilityreallevelfield: 000002BC1E372030` |         |
| ABILITY\_RLF\_WAVE\_INTERVAL                                      | (a)   | handle  | 1316381491  | `abilityreallevelfield: 000002BC1E372070` |         |
| ABILITY\_RLF\_BUILDING\_DAMAGE\_FACTOR\_NVC4                      | (a)   | handle  | 1316381492  | `abilityreallevelfield: 000002BC1E3720B0` |         |
| ABILITY\_RLF\_FULL\_DAMAGE\_AMOUNT\_NVC5                          | (a)   | handle  | 1316381493  | `abilityreallevelfield: 000002BC1E3720F0` |         |
| ABILITY\_RLF\_HALF\_DAMAGE\_FACTOR                                | (a)   | handle  | 1316381494  | `abilityreallevelfield: 000002BC1E372130` |         |
| ABILITY\_RLF\_INTERVAL\_BETWEEN\_PULSES                           | (a)   | handle  | 1415673141  | `abilityreallevelfield: 000002BC1E372170` |         |
| -1                                                                | (a)   | handle  | -1          | `abilityreallevelfield: 000002BD0A4E4F50` |         |
| past the last constant                                            | (a)   | handle  | 1936747570  | `abilityreallevelfield: 000002BD0A4B90B0` |         |
| 2147483647                                                        | (a)   | handle  | 2147483647  | `abilityreallevelfield: 000002BD09476DF0` |         |
| -2147483648                                                       | (a)   | handle  | -2147483648 | `abilityreallevelfield: 000002BD093A72F0` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertAbilityBooleanLevelField`

| Case                                           | Group | Outcome | Id          | Type                                         | Message |
| ---------------------------------------------- | ----- | ------- | ----------- | -------------------------------------------- | ------- |
| ABILITY\_BLF\_PERCENT\_BONUS\_HAB2             | (a)   | handle  | 1214341682  | `abilitybooleanlevelfield: 000002BC1E3721B0` |         |
| ABILITY\_BLF\_USE\_TELEPORT\_CLUSTERING\_HMT3  | (a)   | handle  | 1215132723  | `abilitybooleanlevelfield: 000002BC1E372220` |         |
| ABILITY\_BLF\_NEVER\_MISS\_OCR5                | (a)   | handle  | 1331917365  | `abilitybooleanlevelfield: 000002BC1E372260` |         |
| ABILITY\_BLF\_EXCLUDE\_ITEM\_DAMAGE            | (a)   | handle  | 1331917366  | `abilitybooleanlevelfield: 000002BC1E3722A0` |         |
| ABILITY\_BLF\_BACKSTAB\_DAMAGE                 | (a)   | handle  | 1333226292  | `abilitybooleanlevelfield: 000002BC1E3722E0` |         |
| ABILITY\_BLF\_INHERIT\_UPGRADES\_UAN3          | (a)   | handle  | 1432448563  | `abilitybooleanlevelfield: 000002BC1E372320` |         |
| ABILITY\_BLF\_MANA\_CONVERSION\_AS\_PERCENT    | (a)   | handle  | 1432645683  | `abilitybooleanlevelfield: 000002BC1E372360` |         |
| ABILITY\_BLF\_LIFE\_CONVERSION\_AS\_PERCENT    | (a)   | handle  | 1432645684  | `abilitybooleanlevelfield: 000002BC1E3723A0` |         |
| ABILITY\_BLF\_LEAVE\_TARGET\_ALIVE             | (a)   | handle  | 1432645685  | `abilitybooleanlevelfield: 000002BC1E3723E0` |         |
| ABILITY\_BLF\_PERCENT\_BONUS\_UAU3             | (a)   | handle  | 1432450355  | `abilitybooleanlevelfield: 000002BC1E372420` |         |
| ABILITY\_BLF\_DAMAGE\_IS\_PERCENT\_RECEIVED    | (a)   | handle  | 1164011570  | `abilitybooleanlevelfield: 000002BC1E372460` |         |
| ABILITY\_BLF\_MELEE\_BONUS                     | (a)   | handle  | 1164014130  | `abilitybooleanlevelfield: 000002BC1E3724A0` |         |
| ABILITY\_BLF\_RANGED\_BONUS                    | (a)   | handle  | 1164014131  | `abilitybooleanlevelfield: 000002BC1E3724E0` |         |
| ABILITY\_BLF\_FLAT\_BONUS                      | (a)   | handle  | 1164014132  | `abilitybooleanlevelfield: 000002BC1E372520` |         |
| ABILITY\_BLF\_NEVER\_MISS\_HBH5                | (a)   | handle  | 1214408757  | `abilitybooleanlevelfield: 000002BC1E372560` |         |
| ABILITY\_BLF\_PERCENT\_BONUS\_HAD2             | (a)   | handle  | 1214342194  | `abilitybooleanlevelfield: 000002BC1E3725A0` |         |
| ABILITY\_BLF\_CAN\_DEACTIVATE                  | (a)   | handle  | 1214542641  | `abilitybooleanlevelfield: 000002BC1E3725E0` |         |
| ABILITY\_BLF\_RAISED\_UNITS\_ARE\_INVULNERABLE | (a)   | handle  | 1215456562  | `abilitybooleanlevelfield: 000002BC1E372620` |         |
| ABILITY\_BLF\_PERCENTAGE\_OAR2                 | (a)   | handle  | 1331786290  | `abilitybooleanlevelfield: 000002BC1E372660` |         |
| ABILITY\_BLF\_SUMMON\_BUSY\_UNITS              | (a)   | handle  | 1114926130  | `abilitybooleanlevelfield: 000002BC1E3726D0` |         |
| ABILITY\_BLF\_CREATES\_BLIGHT                  | (a)   | handle  | 1114401074  | `abilitybooleanlevelfield: 000002BC1E372710` |         |
| ABILITY\_BLF\_EXPLODES\_ON\_DEATH              | (a)   | handle  | 1399092022  | `abilitybooleanlevelfield: 000002BC1E372750` |         |
| ABILITY\_BLF\_ALWAYS\_AUTOCAST\_FAE2           | (a)   | handle  | 1180788018  | `abilitybooleanlevelfield: 000002BC1E372790` |         |
| ABILITY\_BLF\_REGENERATE\_ONLY\_AT\_NIGHT      | (a)   | handle  | 1298297909  | `abilitybooleanlevelfield: 000002BC1E3727D0` |         |
| ABILITY\_BLF\_SHOW\_SELECT\_UNIT\_BUTTON       | (a)   | handle  | 1315271987  | `abilitybooleanlevelfield: 000002BC1E372810` |         |
| ABILITY\_BLF\_SHOW\_UNIT\_INDICATOR            | (a)   | handle  | 1315271988  | `abilitybooleanlevelfield: 000002BC1E372850` |         |
| ABILITY\_BLF\_CHARGE\_OWNING\_PLAYER           | (a)   | handle  | 1097757494  | `abilitybooleanlevelfield: 000002BC1E372890` |         |
| ABILITY\_BLF\_PERCENTAGE\_ARM2                 | (a)   | handle  | 1098018098  | `abilitybooleanlevelfield: 000002BC1E3728D0` |         |
| ABILITY\_BLF\_TARGET\_IS\_INVULNERABLE         | (a)   | handle  | 1349481267  | `abilitybooleanlevelfield: 000002BC1E372910` |         |
| ABILITY\_BLF\_TARGET\_IS\_MAGIC\_IMMUNE        | (a)   | handle  | 1349481268  | `abilitybooleanlevelfield: 000002BC1E372950` |         |
| ABILITY\_BLF\_KILL\_ON\_CASTER\_DEATH          | (a)   | handle  | 1432576566  | `abilitybooleanlevelfield: 000002BC1E372990` |         |
| ABILITY\_BLF\_NO\_TARGET\_REQUIRED\_REJ4       | (a)   | handle  | 1382378036  | `abilitybooleanlevelfield: 000002BC1E3729D0` |         |
| ABILITY\_BLF\_ACCEPTS\_GOLD                    | (a)   | handle  | 1383362097  | `abilitybooleanlevelfield: 000002BC1E372A10` |         |
| ABILITY\_BLF\_ACCEPTS\_LUMBER                  | (a)   | handle  | 1383362098  | `abilitybooleanlevelfield: 000002BC1E372A50` |         |
| ABILITY\_BLF\_PREFER\_HOSTILES\_ROA5           | (a)   | handle  | 1383031093  | `abilitybooleanlevelfield: 000002BC1E372A90` |         |
| ABILITY\_BLF\_PREFER\_FRIENDLIES\_ROA6         | (a)   | handle  | 1383031094  | `abilitybooleanlevelfield: 000002BC1E372AD0` |         |
| ABILITY\_BLF\_ROOTED\_TURNING                  | (a)   | handle  | 1383034675  | `abilitybooleanlevelfield: 000002BC1E372B10` |         |
| ABILITY\_BLF\_ALWAYS\_AUTOCAST\_SLO3           | (a)   | handle  | 1399615283  | `abilitybooleanlevelfield: 000002BC1E372B50` |         |
| ABILITY\_BLF\_HIDE\_BUTTON                     | (a)   | handle  | 1231579492  | `abilitybooleanlevelfield: 000002BC1E372B90` |         |
| ABILITY\_BLF\_USE\_TELEPORT\_CLUSTERING\_ITP2  | (a)   | handle  | 1232367666  | `abilitybooleanlevelfield: 000002BC1E372BD0` |         |
| ABILITY\_BLF\_IMMUNE\_TO\_MORPH\_EFFECTS       | (a)   | handle  | 1165256753  | `abilitybooleanlevelfield: 000002BC1E372C10` |         |
| ABILITY\_BLF\_DOES\_NOT\_BLOCK\_BUILDINGS      | (a)   | handle  | 1165256754  | `abilitybooleanlevelfield: 000002BC1E372C50` |         |
| ABILITY\_BLF\_AUTO\_ACQUIRE\_ATTACK\_TARGETS   | (a)   | handle  | 1198026545  | `abilitybooleanlevelfield: 000002BC1E372C90` |         |
| ABILITY\_BLF\_IMMUNE\_TO\_MORPH\_EFFECTS\_GHO2 | (a)   | handle  | 1198026546  | `abilitybooleanlevelfield: 000002BCFF9FABE0` |         |
| ABILITY\_BLF\_DO\_NOT\_BLOCK\_BUILDINGS        | (a)   | handle  | 1198026547  | `abilitybooleanlevelfield: 000002BC14E7DC30` |         |
| ABILITY\_BLF\_INCLUDE\_RANGED\_DAMAGE          | (a)   | handle  | 1400073012  | `abilitybooleanlevelfield: 000002BC14E74CE0` |         |
| ABILITY\_BLF\_INCLUDE\_MELEE\_DAMAGE           | (a)   | handle  | 1400073013  | `abilitybooleanlevelfield: 000002BC14E92230` |         |
| ABILITY\_BLF\_MOVE\_TO\_PARTNER                | (a)   | handle  | 1668243762  | `abilitybooleanlevelfield: 000002BC14E75410` |         |
| ABILITY\_BLF\_CAN\_BE\_DISPELLED               | (a)   | handle  | 1668899633  | `abilitybooleanlevelfield: 000002BC1E368620` |         |
| ABILITY\_BLF\_IGNORE\_FRIENDLY\_BUFFS          | (a)   | handle  | 1685482806  | `abilitybooleanlevelfield: 000002BCFF9FD760` |         |
| ABILITY\_BLF\_DROP\_ITEMS\_ON\_DEATH           | (a)   | handle  | 1768846898  | `abilitybooleanlevelfield: 000002BCFF9FBC90` |         |
| ABILITY\_BLF\_CAN\_USE\_ITEMS                  | (a)   | handle  | 1768846899  | `abilitybooleanlevelfield: 000002BCFF9FBE10` |         |
| ABILITY\_BLF\_CAN\_GET\_ITEMS                  | (a)   | handle  | 1768846900  | `abilitybooleanlevelfield: 000002BC14E84710` |         |
| ABILITY\_BLF\_CAN\_DROP\_ITEMS                 | (a)   | handle  | 1768846901  | `abilitybooleanlevelfield: 000002BC14E84950` |         |
| ABILITY\_BLF\_REPAIRS\_ALLOWED                 | (a)   | handle  | 1818849588  | `abilitybooleanlevelfield: 000002BC1989D140` |         |
| ABILITY\_BLF\_CASTER\_ONLY\_SPLASH             | (a)   | handle  | 1835428918  | `abilitybooleanlevelfield: 000002BC14E84640` |         |
| ABILITY\_BLF\_NO\_TARGET\_REQUIRED\_IRL4       | (a)   | handle  | 1769106484  | `abilitybooleanlevelfield: 000002BC14E84680` |         |
| ABILITY\_BLF\_DISPEL\_ON\_ATTACK               | (a)   | handle  | 1769106485  | `abilitybooleanlevelfield: 000002BC19898D50` |         |
| ABILITY\_BLF\_AMOUNT\_IS\_RAW\_VALUE           | (a)   | handle  | 1768977971  | `abilitybooleanlevelfield: 000002BC19898D90` |         |
| ABILITY\_BLF\_SHARED\_SPELL\_COOLDOWN          | (a)   | handle  | 1936745010  | `abilitybooleanlevelfield: 000002BC1E3686B0` |         |
| ABILITY\_BLF\_SLEEP\_ONCE                      | (a)   | handle  | 1936482609  | `abilitybooleanlevelfield: 000002BC1E3686F0` |         |
| ABILITY\_BLF\_ALLOW\_ON\_ANY\_PLAYER\_SLOT     | (a)   | handle  | 1936482610  | `abilitybooleanlevelfield: 000002BC1989B390` |         |
| ABILITY\_BLF\_DISABLE\_OTHER\_ABILITIES        | (a)   | handle  | 1315138613  | `abilitybooleanlevelfield: 000002BC1989B3D0` |         |
| ABILITY\_BLF\_ALLOW\_BOUNTY                    | (a)   | handle  | 1316252980  | `abilitybooleanlevelfield: 000002BCFF9FCFC0` |         |
| -1                                             | (a)   | handle  | -1          | `abilitybooleanlevelfield: 000002BC14D5C680` |         |
| past the last constant                         | (a)   | handle  | 1936745011  | `abilitybooleanlevelfield: 000002BC198962E0` |         |
| 2147483647                                     | (a)   | handle  | 2147483647  | `abilitybooleanlevelfield: 000002BD037DF9E0` |         |
| -2147483648                                    | (a)   | handle  | -2147483648 | `abilitybooleanlevelfield: 000002BD0A4D7F30` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertAbilityStringLevelField`

| Case                                       | Group | Outcome | Id          | Type                                        | Message |
| ------------------------------------------ | ----- | ------- | ----------- | ------------------------------------------- | ------- |
| ABILITY\_SLF\_ICON\_NORMAL                 | (a)   | handle  | 1633776244  | `abilitystringlevelfield: 000002BCFF9FD000` |         |
| ABILITY\_SLF\_CASTER                       | (a)   | handle  | 1633902964  | `abilitystringlevelfield: 000002BCFF9FAA50` |         |
| ABILITY\_SLF\_TARGET                       | (a)   | handle  | 1635017076  | `abilitystringlevelfield: 000002BCFF9FAAE0` |         |
| ABILITY\_SLF\_SPECIAL                      | (a)   | handle  | 1634951540  | `abilitystringlevelfield: 000002BC1E362D50` |         |
| ABILITY\_SLF\_EFFECT                       | (a)   | handle  | 1634034036  | `abilitystringlevelfield: 000002BC1E362D90` |         |
| ABILITY\_SLF\_AREA\_EFFECT                 | (a)   | handle  | 1633772897  | `abilitystringlevelfield: 000002BC1E362EE0` |         |
| ABILITY\_SLF\_LIGHTNING\_EFFECTS           | (a)   | handle  | 1634494823  | `abilitystringlevelfield: 000002BC1E362F20` |         |
| ABILITY\_SLF\_MISSILE\_ART                 | (a)   | handle  | 1634558324  | `abilitystringlevelfield: 000002BC1E362F60` |         |
| ABILITY\_SLF\_TOOLTIP\_LEARN               | (a)   | handle  | 1634887028  | `abilitystringlevelfield: 000002BC1E362FA0` |         |
| ABILITY\_SLF\_TOOLTIP\_LEARN\_EXTENDED     | (a)   | handle  | 1634891124  | `abilitystringlevelfield: 000002BC1E3631F0` |         |
| ABILITY\_SLF\_TOOLTIP\_NORMAL              | (a)   | handle  | 1635020849  | `abilitystringlevelfield: 000002BC1E363230` |         |
| ABILITY\_SLF\_TOOLTIP\_TURN\_OFF           | (a)   | handle  | 1635087409  | `abilitystringlevelfield: 000002BC1E363270` |         |
| ABILITY\_SLF\_TOOLTIP\_NORMAL\_EXTENDED    | (a)   | handle  | 1635082801  | `abilitystringlevelfield: 000002BC1E3632B0` |         |
| ABILITY\_SLF\_TOOLTIP\_TURN\_OFF\_EXTENDED | (a)   | handle  | 1635087665  | `abilitystringlevelfield: 000002BC1E3632F0` |         |
| ABILITY\_SLF\_NORMAL\_FORM\_UNIT\_EME1     | (a)   | handle  | 1164797233  | `abilitystringlevelfield: 000002BC1E363330` |         |
| ABILITY\_SLF\_SPAWNED\_UNITS               | (a)   | handle  | 1315205169  | `abilitystringlevelfield: 000002BC1E363370` |         |
| ABILITY\_SLF\_ABILITY\_FOR\_UNIT\_CREATION | (a)   | handle  | 1316119345  | `abilitystringlevelfield: 000002BC1E3633B0` |         |
| ABILITY\_SLF\_NORMAL\_FORM\_UNIT\_MIL1     | (a)   | handle  | 1298754609  | `abilitystringlevelfield: 000002BC1E3633F0` |         |
| ABILITY\_SLF\_ALTERNATE\_FORM\_UNIT\_MIL2  | (a)   | handle  | 1298754610  | `abilitystringlevelfield: 000002BC1E363430` |         |
| ABILITY\_SLF\_BASE\_ORDER\_ID\_ANS5        | (a)   | handle  | 1097757493  | `abilitystringlevelfield: 000002BC1E363470` |         |
| ABILITY\_SLF\_MORPH\_UNITS\_GROUND         | (a)   | handle  | 1349286194  | `abilitystringlevelfield: 000002BCFF9FAA90` |         |
| ABILITY\_SLF\_MORPH\_UNITS\_AIR            | (a)   | handle  | 1349286195  | `abilitystringlevelfield: 000002BCFF9FAB20` |         |
| ABILITY\_SLF\_MORPH\_UNITS\_AMPHIBIOUS     | (a)   | handle  | 1349286196  | `abilitystringlevelfield: 000002BC1E362CC0` |         |
| ABILITY\_SLF\_MORPH\_UNITS\_WATER          | (a)   | handle  | 1349286197  | `abilitystringlevelfield: 000002BC1E362D00` |         |
| ABILITY\_SLF\_UNIT\_TYPE\_ONE              | (a)   | handle  | 1382115635  | `abilitystringlevelfield: 000002BC1E362DD0` |         |
| ABILITY\_SLF\_UNIT\_TYPE\_TWO              | (a)   | handle  | 1382115636  | `abilitystringlevelfield: 000002BC1E362E10` |         |
| ABILITY\_SLF\_UNIT\_TYPE\_SOD2             | (a)   | handle  | 1399809074  | `abilitystringlevelfield: 000002BC1E362E50` |         |
| ABILITY\_SLF\_SUMMON\_1\_UNIT\_TYPE        | (a)   | handle  | 1232303153  | `abilitystringlevelfield: 000002BC1E362E90` |         |
| ABILITY\_SLF\_SUMMON\_2\_UNIT\_TYPE        | (a)   | handle  | 1232303154  | `abilitystringlevelfield: 000002BC1E362FE0` |         |
| ABILITY\_SLF\_RACE\_TO\_CONVERT            | (a)   | handle  | 1315201841  | `abilitystringlevelfield: 000002BC1E363020` |         |
| ABILITY\_SLF\_PARTNER\_UNIT\_TYPE          | (a)   | handle  | 1668243761  | `abilitystringlevelfield: 000002BC1E363060` |         |
| ABILITY\_SLF\_PARTNER\_UNIT\_TYPE\_ONE     | (a)   | handle  | 1684238385  | `abilitystringlevelfield: 000002BC1E3630A0` |         |
| ABILITY\_SLF\_PARTNER\_UNIT\_TYPE\_TWO     | (a)   | handle  | 1684238386  | `abilitystringlevelfield: 000002BC1E3630E0` |         |
| ABILITY\_SLF\_REQUIRED\_UNIT\_TYPE         | (a)   | handle  | 1953524017  | `abilitystringlevelfield: 000002BC1E363120` |         |
| ABILITY\_SLF\_CONVERTED\_UNIT\_TYPE        | (a)   | handle  | 1953524018  | `abilitystringlevelfield: 000002BC1E363160` |         |
| ABILITY\_SLF\_SPELL\_LIST                  | (a)   | handle  | 1936745009  | `abilitystringlevelfield: 000002BC1E3631A0` |         |
| ABILITY\_SLF\_BASE\_ORDER\_ID\_SPB5        | (a)   | handle  | 1936745013  | `abilitystringlevelfield: 000002BC1E364350` |         |
| ABILITY\_SLF\_BASE\_ORDER\_ID\_NCL6        | (a)   | handle  | 1315138614  | `abilitystringlevelfield: 000002BC1E364390` |         |
| ABILITY\_SLF\_ABILITY\_UPGRADE\_1          | (a)   | handle  | 1315268403  | `abilitystringlevelfield: 000002BC1E3643D0` |         |
| ABILITY\_SLF\_ABILITY\_UPGRADE\_2          | (a)   | handle  | 1315268404  | `abilitystringlevelfield: 000002BC1E364410` |         |
| ABILITY\_SLF\_ABILITY\_UPGRADE\_3          | (a)   | handle  | 1315268405  | `abilitystringlevelfield: 000002BC1E364450` |         |
| ABILITY\_SLF\_ABILITY\_UPGRADE\_4          | (a)   | handle  | 1315268406  | `abilitystringlevelfield: 000002BC1E364490` |         |
| ABILITY\_SLF\_SPAWN\_UNIT\_ID\_NSY2        | (a)   | handle  | 1316190514  | `abilitystringlevelfield: 000002BC1E3644D0` |         |
| -1                                         | (a)   | handle  | -1          | `abilitystringlevelfield: 000002BD093A4DC0` |         |
| past the last constant                     | (a)   | handle  | 1953524019  | `abilitystringlevelfield: 000002BD0A59F960` |         |
| 2147483647                                 | (a)   | handle  | 2147483647  | `abilitystringlevelfield: 000002BD0A540060` |         |
| -2147483648                                | (a)   | handle  | -2147483648 | `abilitystringlevelfield: 000002BD0A56DB90` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertAbilityIntegerLevelArrayField`

| Case       | Group | Outcome | Id         | Type                                              | Message |
| ---------- | ----- | ------- | ---------- | ------------------------------------------------- | ------- |
| 0          | (a)   | handle  | 0          | `abilityintegerlevelarrayfield: 000002BD0A4FC1D0` |         |
| 1          | (a)   | handle  | 1          | `abilityintegerlevelarrayfield: 000002BD09376670` |         |
| -1         | (a)   | handle  | -1         | `abilityintegerlevelarrayfield: 000002BD0A5B43E0` |         |
| 2147483647 | (a)   | handle  | 2147483647 | `abilityintegerlevelarrayfield: 000002BD0A4A6750` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for 0, 1, -1 and 2147483647, its type having no common.j constant (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertAbilityRealLevelArrayField`

| Case       | Group | Outcome | Id         | Type                                           | Message |
| ---------- | ----- | ------- | ---------- | ---------------------------------------------- | ------- |
| 0          | (a)   | handle  | 0          | `abilityreallevelarrayfield: 000002BD0A528550` |         |
| 1          | (a)   | handle  | 1          | `abilityreallevelarrayfield: 000002BD09378470` |         |
| -1         | (a)   | handle  | -1         | `abilityreallevelarrayfield: 000002BD0A5A88E0` |         |
| 2147483647 | (a)   | handle  | 2147483647 | `abilityreallevelarrayfield: 000002BD0A580AD0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for 0, 1, -1 and 2147483647, its type having no common.j constant (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertAbilityBooleanLevelArrayField`

| Case       | Group | Outcome | Id         | Type                                              | Message |
| ---------- | ----- | ------- | ---------- | ------------------------------------------------- | ------- |
| 0          | (a)   | handle  | 0          | `abilitybooleanlevelarrayfield: 000002BD0A59CF70` |         |
| 1          | (a)   | handle  | 1          | `abilitybooleanlevelarrayfield: 000002BD0A580340` |         |
| -1         | (a)   | handle  | -1         | `abilitybooleanlevelarrayfield: 000002BD06F0CF60` |         |
| 2147483647 | (a)   | handle  | 2147483647 | `abilitybooleanlevelarrayfield: 000002BD0A4DB770` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for 0, 1, -1 and 2147483647, its type having no common.j constant (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertAbilityStringLevelArrayField`

| Case       | Group | Outcome | Id         | Type                                             | Message |
| ---------- | ----- | ------- | ---------- | ------------------------------------------------ | ------- |
| 0          | (a)   | handle  | 0          | `abilitystringlevelarrayfield: 000002BD0A5A5780` |         |
| 1          | (a)   | handle  | 1          | `abilitystringlevelarrayfield: 000002BC2FE43720` |         |
| -1         | (a)   | handle  | -1         | `abilitystringlevelarrayfield: 000002BD093B9300` |         |
| 2147483647 | (a)   | handle  | 2147483647 | `abilitystringlevelarrayfield: 000002BD093B8CA0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for 0, 1, -1 and 2147483647, its type having no common.j constant (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

## `nullability-converters-4`

- Probe: `nullability-converters-4`
- Patch: 3.0.0.24268
- Date: 2026-10-04
- Run: `980deee9-1cbf-448b-b141-4f8debd52a57`

### `ConvertUnitIntegerField`

| Case                                                | Group | Outcome | Id          | Type                                 | Message |
| --------------------------------------------------- | ----- | ------- | ----------- | ------------------------------------ | ------- |
| UNIT\_IF\_DEFENSE\_TYPE                             | (a)   | handle  | 1969517689  | `unitintegerfield: 000001CE0A50C360` |         |
| UNIT\_IF\_ARMOR\_TYPE                               | (a)   | handle  | 1969320557  | `unitintegerfield: 000001CE0A50C3D0` |         |
| UNIT\_IF\_LOOPING\_FADE\_IN\_RATE                   | (a)   | handle  | 1970038377  | `unitintegerfield: 000001CE0A50C410` |         |
| UNIT\_IF\_LOOPING\_FADE\_OUT\_RATE                  | (a)   | handle  | 1970038383  | `unitintegerfield: 000001CE0A50C450` |         |
| UNIT\_IF\_AGILITY                                   | (a)   | handle  | 1969317731  | `unitintegerfield: 000001CE0A50C490` |         |
| UNIT\_IF\_INTELLIGENCE                              | (a)   | handle  | 1969843811  | `unitintegerfield: 000001CE0A50C4D0` |         |
| UNIT\_IF\_STRENGTH                                  | (a)   | handle  | 1970500707  | `unitintegerfield: 000001CE0A50C510` |         |
| UNIT\_IF\_AGILITY\_PERMANENT                        | (a)   | handle  | 1969317741  | `unitintegerfield: 000001CE0A50C550` |         |
| UNIT\_IF\_INTELLIGENCE\_PERMANENT                   | (a)   | handle  | 1969843821  | `unitintegerfield: 000001CE0A50C590` |         |
| UNIT\_IF\_STRENGTH\_PERMANENT                       | (a)   | handle  | 1970500717  | `unitintegerfield: 000001CE0A50C5D0` |         |
| UNIT\_IF\_AGILITY\_WITH\_BONUS                      | (a)   | handle  | 1969317730  | `unitintegerfield: 000001CE0A50C610` |         |
| UNIT\_IF\_INTELLIGENCE\_WITH\_BONUS                 | (a)   | handle  | 1969843810  | `unitintegerfield: 000001CE0A50C650` |         |
| UNIT\_IF\_STRENGTH\_WITH\_BONUS                     | (a)   | handle  | 1970500706  | `unitintegerfield: 000001CE0A50C690` |         |
| UNIT\_IF\_GOLD\_BOUNTY\_AWARDED\_NUMBER\_OF\_DICE   | (a)   | handle  | 1969382505  | `unitintegerfield: 000001CE0A50C6D0` |         |
| UNIT\_IF\_GOLD\_BOUNTY\_AWARDED\_BASE               | (a)   | handle  | 1969381985  | `unitintegerfield: 000001CE0A50C710` |         |
| UNIT\_IF\_GOLD\_BOUNTY\_AWARDED\_SIDES\_PER\_DIE    | (a)   | handle  | 1969386345  | `unitintegerfield: 000001CE0A50C750` |         |
| UNIT\_IF\_LUMBER\_BOUNTY\_AWARDED\_NUMBER\_OF\_DICE | (a)   | handle  | 1970037348  | `unitintegerfield: 000001CE0A50C790` |         |
| UNIT\_IF\_LUMBER\_BOUNTY\_AWARDED\_BASE             | (a)   | handle  | 1970037345  | `unitintegerfield: 000001CE0A50CBE0` |         |
| UNIT\_IF\_LUMBER\_BOUNTY\_AWARDED\_SIDES\_PER\_DIE  | (a)   | handle  | 1970037363  | `unitintegerfield: 000001CE0A50CC20` |         |
| UNIT\_IF\_LEVEL                                     | (a)   | handle  | 1970038134  | `unitintegerfield: 000001CE0A50CC60` |         |
| UNIT\_IF\_FORMATION\_RANK                           | (a)   | handle  | 1969647474  | `unitintegerfield: 000001CE0A50CCA0` |         |
| UNIT\_IF\_ORIENTATION\_INTERPOLATION                | (a)   | handle  | 1970238057  | `unitintegerfield: 000001CE0A50CCE0` |         |
| UNIT\_IF\_ELEVATION\_SAMPLE\_POINTS                 | (a)   | handle  | 1969582196  | `unitintegerfield: 000001CE0A50CD20` |         |
| UNIT\_IF\_TINTING\_COLOR\_RED                       | (a)   | handle  | 1969450098  | `unitintegerfield: 000001CE0A50CD60` |         |
| UNIT\_IF\_TINTING\_COLOR\_GREEN                     | (a)   | handle  | 1969450087  | `unitintegerfield: 000001CE0A50CDA0` |         |
| UNIT\_IF\_TINTING\_COLOR\_BLUE                      | (a)   | handle  | 1969450082  | `unitintegerfield: 000001CE0A50CDE0` |         |
| UNIT\_IF\_TINTING\_COLOR\_ALPHA                     | (a)   | handle  | 1969447276  | `unitintegerfield: 000001CE0A50CE20` |         |
| UNIT\_IF\_MOVE\_TYPE                                | (a)   | handle  | 1970108020  | `unitintegerfield: 000001CE0A50CE60` |         |
| UNIT\_IF\_TARGETED\_AS                              | (a)   | handle  | 1970561394  | `unitintegerfield: 000001CE0A50CEA0` |         |
| UNIT\_IF\_UNIT\_CLASSIFICATION                      | (a)   | handle  | 1970567536  | `unitintegerfield: 000001CE0A50CEE0` |         |
| UNIT\_IF\_HIT\_POINTS\_REGENERATION\_TYPE           | (a)   | handle  | 1969779316  | `unitintegerfield: 000001CE0A50CF20` |         |
| UNIT\_IF\_PLACEMENT\_PREVENTED\_BY                  | (a)   | handle  | 1970299250  | `unitintegerfield: 000001CE0A50CF60` |         |
| UNIT\_IF\_PRIMARY\_ATTRIBUTE                        | (a)   | handle  | 1970303585  | `unitintegerfield: 000001CE0A50CFA0` |         |
| -1                                                  | (a)   | handle  | -1          | `unitintegerfield: 000001CE2086D1B0` |         |
| past the last constant                              | (a)   | handle  | 1970567537  | `unitintegerfield: 000001CE20874E20` |         |
| 2147483647                                          | (a)   | handle  | 2147483647  | `unitintegerfield: 000001CE2087CEA0` |         |
| -2147483648                                         | (a)   | handle  | -2147483648 | `unitintegerfield: 000001CE20884FA0` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertUnitRealField`

| Case                                      | Group | Outcome | Id          | Type                              | Message |
| ----------------------------------------- | ----- | ------- | ----------- | --------------------------------- | ------- |
| UNIT\_RF\_STRENGTH\_PER\_LEVEL            | (a)   | handle  | 1970500720  | `unitrealfield: 000001CE0A50CFE0` |         |
| UNIT\_RF\_AGILITY\_PER\_LEVEL             | (a)   | handle  | 1969317744  | `unitrealfield: 000001CE0A50D020` |         |
| UNIT\_RF\_INTELLIGENCE\_PER\_LEVEL        | (a)   | handle  | 1969843824  | `unitrealfield: 000001CE0A50D060` |         |
| UNIT\_RF\_HIT\_POINTS\_REGENERATION\_RATE | (a)   | handle  | 1969778802  | `unitrealfield: 000001CE0A50D0A0` |         |
| UNIT\_RF\_MANA\_REGENERATION              | (a)   | handle  | 1970106482  | `unitrealfield: 000001CE0A50D0E0` |         |
| UNIT\_RF\_DEATH\_TIME                     | (a)   | handle  | 1969517677  | `unitrealfield: 000001CE0A50D120` |         |
| UNIT\_RF\_FLY\_HEIGHT                     | (a)   | handle  | 1969650024  | `unitrealfield: 000001CE0A50D160` |         |
| UNIT\_RF\_FLY\_MAX\_HEIGHT                | (a)   | handle  | 1969646952  | `unitrealfield: 000001CE0A50D1A0` |         |
| UNIT\_RF\_TURN\_RATE                      | (a)   | handle  | 1970108018  | `unitrealfield: 000001CE0A50D1E0` |         |
| UNIT\_RF\_ELEVATION\_SAMPLE\_RADIUS       | (a)   | handle  | 1969582692  | `unitrealfield: 000001CE0A50D220` |         |
| UNIT\_RF\_FOG\_OF\_WAR\_SAMPLE\_RADIUS    | (a)   | handle  | 1969648228  | `unitrealfield: 000001CE0A50D260` |         |
| UNIT\_RF\_MAXIMUM\_PITCH\_ANGLE\_DEGREES  | (a)   | handle  | 1970108528  | `unitrealfield: 000001CE0A50D2A0` |         |
| UNIT\_RF\_MAXIMUM\_ROLL\_ANGLE\_DEGREES   | (a)   | handle  | 1970108530  | `unitrealfield: 000001CE0A50D2E0` |         |
| UNIT\_RF\_SCALING\_VALUE                  | (a)   | handle  | 1970496353  | `unitrealfield: 000001CE0A50D320` |         |
| UNIT\_RF\_ANIMATION\_RUN\_SPEED           | (a)   | handle  | 1970435438  | `unitrealfield: 000001CE0A50D360` |         |
| UNIT\_RF\_SELECTION\_SCALE                | (a)   | handle  | 1970500451  | `unitrealfield: 000001CE0A50D3A0` |         |
| UNIT\_RF\_SELECTION\_CIRCLE\_HEIGHT       | (a)   | handle  | 1970498682  | `unitrealfield: 000001CE0A50D3E0` |         |
| UNIT\_RF\_SHADOW\_IMAGE\_HEIGHT           | (a)   | handle  | 1970497640  | `unitrealfield: 000001CE0A50D420` |         |
| UNIT\_RF\_SHADOW\_IMAGE\_WIDTH            | (a)   | handle  | 1970497655  | `unitrealfield: 000001CE0A50D460` |         |
| UNIT\_RF\_SHADOW\_IMAGE\_CENTER\_X        | (a)   | handle  | 1970497656  | `unitrealfield: 000001CE0A50D4A0` |         |
| UNIT\_RF\_SHADOW\_IMAGE\_CENTER\_Y        | (a)   | handle  | 1970497657  | `unitrealfield: 000001CE0A50D4E0` |         |
| UNIT\_RF\_ANIMATION\_WALK\_SPEED          | (a)   | handle  | 1970757996  | `unitrealfield: 000001CE0A50D520` |         |
| UNIT\_RF\_DEFENSE                         | (a)   | handle  | 1969514083  | `unitrealfield: 000001CE0A50D560` |         |
| UNIT\_RF\_SIGHT\_RADIUS                   | (a)   | handle  | 1970497906  | `unitrealfield: 000001CE0A50D5A0` |         |
| UNIT\_RF\_PRIORITY                        | (a)   | handle  | 1970303593  | `unitrealfield: 000001CE080133D0` |         |
| UNIT\_RF\_SPEED                           | (a)   | handle  | 1970108003  | `unitrealfield: 000001CE07F29BD0` |         |
| UNIT\_RF\_OCCLUDER\_HEIGHT                | (a)   | handle  | 1970234211  | `unitrealfield: 000001CE08014370` |         |
| UNIT\_RF\_HP                              | (a)   | handle  | 1969778787  | `unitrealfield: 000001CE08014710` |         |
| UNIT\_RF\_MANA                            | (a)   | handle  | 1970106467  | `unitrealfield: 000001CE034EEB60` |         |
| UNIT\_RF\_ACQUISITION\_RANGE              | (a)   | handle  | 1969316721  | `unitrealfield: 000001CE034EEDF0` |         |
| UNIT\_RF\_CAST\_BACK\_SWING               | (a)   | handle  | 1969447539  | `unitrealfield: 000001CE034EEF10` |         |
| UNIT\_RF\_CAST\_POINT                     | (a)   | handle  | 1969451124  | `unitrealfield: 000001CE034EF5B0` |         |
| UNIT\_RF\_MINIMUM\_ATTACK\_RANGE          | (a)   | handle  | 1969319278  | `unitrealfield: 000001CE034F0A00` |         |
| -1                                        | (a)   | handle  | -1          | `unitrealfield: 000001CE20867450` |         |
| past the last constant                    | (a)   | handle  | 1970757997  | `unitrealfield: 000001CE2085EF10` |         |
| 2147483647                                | (a)   | handle  | 2147483647  | `unitrealfield: 000001CE20849DE0` |         |
| -2147483648                               | (a)   | handle  | -2147483648 | `unitrealfield: 000001CE2086A990` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertUnitBooleanField`

| Case                                              | Group | Outcome | Id          | Type                                 | Message |
| ------------------------------------------------- | ----- | ------- | ----------- | ------------------------------------ | ------- |
| UNIT\_BF\_RAISABLE                                | (a)   | handle  | 1970430313  | `unitbooleanfield: 000001CE034EEA90` |         |
| UNIT\_BF\_DECAYABLE                               | (a)   | handle  | 1969513827  | `unitbooleanfield: 000001CE034EEAD0` |         |
| UNIT\_BF\_IS\_A\_BUILDING                         | (a)   | handle  | 1969382503  | `unitbooleanfield: 000001CE034EF7F0` |         |
| UNIT\_BF\_USE\_EXTENDED\_LINE\_OF\_SIGHT          | (a)   | handle  | 1970040691  | `unitbooleanfield: 000001CE034EF7A0` |         |
| UNIT\_BF\_NEUTRAL\_BUILDING\_SHOWS\_MINIMAP\_ICON | (a)   | handle  | 1970168429  | `unitbooleanfield: 000001CE034EF430` |         |
| UNIT\_BF\_HERO\_HIDE\_HERO\_INTERFACE\_ICON       | (a)   | handle  | 1969776738  | `unitbooleanfield: 000001CE034EF470` |         |
| UNIT\_BF\_HERO\_HIDE\_HERO\_MINIMAP\_DISPLAY      | (a)   | handle  | 1969776749  | `unitbooleanfield: 000001CE034EF4B0` |         |
| UNIT\_BF\_HERO\_HIDE\_HERO\_DEATH\_MESSAGE        | (a)   | handle  | 1969776740  | `unitbooleanfield: 000001CE07F29950` |         |
| UNIT\_BF\_HIDE\_MINIMAP\_DISPLAY                  | (a)   | handle  | 1969778541  | `unitbooleanfield: 000001CE07F29990` |         |
| UNIT\_BF\_SCALE\_PROJECTILES                      | (a)   | handle  | 1970496354  | `unitbooleanfield: 000001CE0A50CAF0` |         |
| UNIT\_BF\_SELECTION\_CIRCLE\_ON\_WATER            | (a)   | handle  | 1970496887  | `unitbooleanfield: 000001CE0A50CB30` |         |
| UNIT\_BF\_HAS\_WATER\_SHADOW                      | (a)   | handle  | 1970497650  | `unitbooleanfield: 000001CE0A50CB70` |         |
| UNIT\_BF\_SHOW\_AIR\_TO\_GROUND                   | (a)   | handle  | 1969321063  | `unitbooleanfield: 000001CE0A50C7D0` |         |
| UNIT\_BF\_FORCE\_DISPLAY\_HP                      | (a)   | handle  | 1969645680  | `unitbooleanfield: 000001CE0A50C810` |         |
| -1                                                | (a)   | handle  | -1          | `unitbooleanfield: 000001CE1F451160` |         |
| past the last constant                            | (a)   | handle  | 1970497651  | `unitbooleanfield: 000001CE1F456DF0` |         |
| 2147483647                                        | (a)   | handle  | 2147483647  | `unitbooleanfield: 000001CE1F45CC80` |         |
| -2147483648                                       | (a)   | handle  | -2147483648 | `unitbooleanfield: 000001CE1F462B00` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertUnitStringField`

| Case                          | Group | Outcome | Id          | Type                                | Message |
| ----------------------------- | ----- | ------- | ----------- | ----------------------------------- | ------- |
| UNIT\_SF\_NAME                | (a)   | handle  | 1970168173  | `unitstringfield: 000001CE0A50C850` |         |
| UNIT\_SF\_PROPER\_NAMES       | (a)   | handle  | 1970303599  | `unitstringfield: 000001CE0A50C890` |         |
| UNIT\_SF\_GROUND\_TEXTURE     | (a)   | handle  | 1970627187  | `unitstringfield: 000001CE034F1BC0` |         |
| UNIT\_SF\_SHADOW\_IMAGE\_UNIT | (a)   | handle  | 1970497653  | `unitstringfield: 000001CE034F1C90` |         |
| -1                            | (a)   | handle  | -1          | `unitstringfield: 000001CE1F485BA0` |         |
| past the last constant        | (a)   | handle  | 1970627188  | `unitstringfield: 000001CE1F48BD90` |         |
| 2147483647                    | (a)   | handle  | 2147483647  | `unitstringfield: 000001CE1F4921E0` |         |
| -2147483648                   | (a)   | handle  | -2147483648 | `unitstringfield: 000001CE1F498A10` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertUnitWeaponIntegerField`

| Case                                                   | Group | Outcome | Id          | Type                                       | Message |
| ------------------------------------------------------ | ----- | ------- | ----------- | ------------------------------------------ | ------- |
| UNIT\_WEAPON\_IF\_ATTACK\_DAMAGE\_NUMBER\_OF\_DICE     | (a)   | handle  | 1969303908  | `unitweaponintegerfield: 000001CE034F1CD0` |         |
| UNIT\_WEAPON\_IF\_ATTACK\_DAMAGE\_BASE                 | (a)   | handle  | 1969303906  | `unitweaponintegerfield: 000001CE034F1D10` |         |
| UNIT\_WEAPON\_IF\_ATTACK\_DAMAGE\_SIDES\_PER\_DIE      | (a)   | handle  | 1969303923  | `unitweaponintegerfield: 000001CE034F1D50` |         |
| UNIT\_WEAPON\_IF\_ATTACK\_MAXIMUM\_NUMBER\_OF\_TARGETS | (a)   | handle  | 1970561841  | `unitweaponintegerfield: 000001CE034F1E20` |         |
| UNIT\_WEAPON\_IF\_ATTACK\_ATTACK\_TYPE                 | (a)   | handle  | 1969303924  | `unitweaponintegerfield: 000001CE034F1E60` |         |
| UNIT\_WEAPON\_IF\_ATTACK\_WEAPON\_SOUND                | (a)   | handle  | 1969451825  | `unitweaponintegerfield: 000001CE034F1FB0` |         |
| UNIT\_WEAPON\_IF\_ATTACK\_AREA\_OF\_EFFECT\_TARGETS    | (a)   | handle  | 1969303920  | `unitweaponintegerfield: 000001CE034F1FF0` |         |
| UNIT\_WEAPON\_IF\_ATTACK\_TARGETS\_ALLOWED             | (a)   | handle  | 1969303911  | `unitweaponintegerfield: 000001CE034F2030` |         |
| -1                                                     | (a)   | handle  | -1          | `unitweaponintegerfield: 000001CE1F491370` |         |
| past the last constant                                 | (a)   | handle  | 1970561842  | `unitweaponintegerfield: 000001CE1F4369B0` |         |
| 2147483647                                             | (a)   | handle  | 2147483647  | `unitweaponintegerfield: 000001CE1F497A90` |         |
| -2147483648                                            | (a)   | handle  | -2147483648 | `unitweaponintegerfield: 000001CE1F4393E0` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertUnitWeaponRealField`

| Case                                                       | Group | Outcome | Id          | Type                                    | Message |
| ---------------------------------------------------------- | ----- | ------- | ----------- | --------------------------------------- | ------- |
| UNIT\_WEAPON\_RF\_ATTACK\_BACKSWING\_POINT                 | (a)   | handle  | 1969386289  | `unitweaponrealfield: 000001CE034F2070` |         |
| UNIT\_WEAPON\_RF\_ATTACK\_DAMAGE\_POINT                    | (a)   | handle  | 1969516593  | `unitweaponrealfield: 000001CE034F20B0` |         |
| UNIT\_WEAPON\_RF\_ATTACK\_BASE\_COOLDOWN                   | (a)   | handle  | 1969303907  | `unitweaponrealfield: 000001CE034F20F0` |         |
| UNIT\_WEAPON\_RF\_ATTACK\_DAMAGE\_LOSS\_FACTOR             | (a)   | handle  | 1969515569  | `unitweaponrealfield: 000001CE034F1B70` |         |
| UNIT\_WEAPON\_RF\_ATTACK\_DAMAGE\_FACTOR\_MEDIUM           | (a)   | handle  | 1969775665  | `unitweaponrealfield: 000001CE0A5007E0` |         |
| UNIT\_WEAPON\_RF\_ATTACK\_DAMAGE\_FACTOR\_SMALL            | (a)   | handle  | 1970365489  | `unitweaponrealfield: 000001CE0A500930` |         |
| UNIT\_WEAPON\_RF\_ATTACK\_DAMAGE\_SPILL\_DISTANCE          | (a)   | handle  | 1970496561  | `unitweaponrealfield: 000001CE0A500970` |         |
| UNIT\_WEAPON\_RF\_ATTACK\_DAMAGE\_SPILL\_RADIUS            | (a)   | handle  | 1970500145  | `unitweaponrealfield: 000001CE0A5009B0` |         |
| UNIT\_WEAPON\_RF\_ATTACK\_PROJECTILE\_SPEED                | (a)   | handle  | 1969303930  | `unitweaponrealfield: 000001CE0A5009F0` |         |
| UNIT\_WEAPON\_RF\_ATTACK\_PROJECTILE\_ARC                  | (a)   | handle  | 1970102577  | `unitweaponrealfield: 000001CE0A500C40` |         |
| UNIT\_WEAPON\_RF\_ATTACK\_AREA\_OF\_EFFECT\_FULL\_DAMAGE   | (a)   | handle  | 1969303910  | `unitweaponrealfield: 000001CE0A500C80` |         |
| UNIT\_WEAPON\_RF\_ATTACK\_AREA\_OF\_EFFECT\_MEDIUM\_DAMAGE | (a)   | handle  | 1969303912  | `unitweaponrealfield: 000001CE0A500CC0` |         |
| UNIT\_WEAPON\_RF\_ATTACK\_AREA\_OF\_EFFECT\_SMALL\_DAMAGE  | (a)   | handle  | 1969303921  | `unitweaponrealfield: 000001CE0A500D00` |         |
| UNIT\_WEAPON\_RF\_ATTACK\_RANGE                            | (a)   | handle  | 1969303922  | `unitweaponrealfield: 000001CE0A500D40` |         |
| -1                                                         | (a)   | handle  | -1          | `unitweaponrealfield: 000001CE1F447DB0` |         |
| past the last constant                                     | (a)   | handle  | 1970500146  | `unitweaponrealfield: 000001CE1F441E70` |         |
| 2147483647                                                 | (a)   | handle  | 2147483647  | `unitweaponrealfield: 000001CE1FCB8B20` |         |
| -2147483648                                                | (a)   | handle  | -2147483648 | `unitweaponrealfield: 000001CE1F490C60` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertUnitWeaponBooleanField`

| Case                                                  | Group | Outcome | Id          | Type                                       | Message |
| ----------------------------------------------------- | ----- | ------- | ----------- | ------------------------------------------ | ------- |
| UNIT\_WEAPON\_BF\_ATTACK\_SHOW\_UI                    | (a)   | handle  | 1970763057  | `unitweaponbooleanfield: 000001CE0A500D80` |         |
| UNIT\_WEAPON\_BF\_ATTACKS\_ENABLED                    | (a)   | handle  | 1969317230  | `unitweaponbooleanfield: 000001CE0A500DC0` |         |
| UNIT\_WEAPON\_BF\_ATTACK\_PROJECTILE\_HOMING\_ENABLED | (a)   | handle  | 1970104369  | `unitweaponbooleanfield: 000001CE0A500E50` |         |
| -1                                                    | (a)   | handle  | -1          | `unitweaponbooleanfield: 000001CE1F44C890` |         |
| past the last constant                                | (a)   | handle  | 1970763058  | `unitweaponbooleanfield: 000001CE20851970` |         |
| 2147483647                                            | (a)   | handle  | 2147483647  | `unitweaponbooleanfield: 000001CE2089CF10` |         |
| -2147483648                                           | (a)   | handle  | -2147483648 | `unitweaponbooleanfield: 000001CE2089DB40` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertUnitWeaponStringField`

| Case                                      | Group | Outcome | Id          | Type                                      | Message |
| ----------------------------------------- | ----- | ------- | ----------- | ----------------------------------------- | ------- |
| UNIT\_WEAPON\_SF\_ATTACK\_PROJECTILE\_ART | (a)   | handle  | 1969303917  | `unitweaponstringfield: 000001CE0A500E90` |         |
| -1                                        | (a)   | handle  | -1          | `unitweaponstringfield: 000001CE1EF34EA0` |         |
| past the last constant                    | (a)   | handle  | 1969303918  | `unitweaponstringfield: 000001CE1EF5C830` |         |
| 2147483647                                | (a)   | handle  | 2147483647  | `unitweaponstringfield: 000001CE1EF2E250` |         |
| -2147483648                               | (a)   | handle  | -2147483648 | `unitweaponstringfield: 000001CE1F414990` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertItemIntegerField`

| Case                            | Group | Outcome | Id          | Type                                 | Message |
| ------------------------------- | ----- | ------- | ----------- | ------------------------------------ | ------- |
| ITEM\_IF\_LEVEL                 | (a)   | handle  | 1768711542  | `itemintegerfield: 000001CE0A50BE30` |         |
| ITEM\_IF\_NUMBER\_OF\_CHARGES   | (a)   | handle  | 1769304933  | `itemintegerfield: 000001CE0A50BE70` |         |
| ITEM\_IF\_COOLDOWN\_GROUP       | (a)   | handle  | 1768122724  | `itemintegerfield: 000001CE0A50BEB0` |         |
| ITEM\_IF\_MAX\_HIT\_POINTS      | (a)   | handle  | 1768453232  | `itemintegerfield: 000001CE0A50BEF0` |         |
| ITEM\_IF\_HIT\_POINTS           | (a)   | handle  | 1768452195  | `itemintegerfield: 000001CE0A50BF30` |         |
| ITEM\_IF\_PRIORITY              | (a)   | handle  | 1768977001  | `itemintegerfield: 000001CE0A50BF70` |         |
| ITEM\_IF\_ARMOR\_TYPE           | (a)   | handle  | 1767993965  | `itemintegerfield: 000001CE0A50BFB0` |         |
| ITEM\_IF\_TINTING\_COLOR\_RED   | (a)   | handle  | 1768123506  | `itemintegerfield: 000001CE0A50BFF0` |         |
| ITEM\_IF\_TINTING\_COLOR\_GREEN | (a)   | handle  | 1768123495  | `itemintegerfield: 000001CE0A50C030` |         |
| ITEM\_IF\_TINTING\_COLOR\_BLUE  | (a)   | handle  | 1768123490  | `itemintegerfield: 000001CE0A50C070` |         |
| ITEM\_IF\_TINTING\_COLOR\_ALPHA | (a)   | handle  | 1768120684  | `itemintegerfield: 000001CE0A50C0B0` |         |
| -1                              | (a)   | handle  | -1          | `itemintegerfield: 000001CE2039A060` |         |
| past the last constant          | (a)   | handle  | 1769304934  | `itemintegerfield: 000001CE20759710` |         |
| 2147483647                      | (a)   | handle  | 2147483647  | `itemintegerfield: 000001CE1FCD2210` |         |
| -2147483648                     | (a)   | handle  | -2147483648 | `itemintegerfield: 000001CE1FDEEFF0` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertItemRealField`

| Case                     | Group | Outcome | Id          | Type                              | Message |
| ------------------------ | ----- | ------- | ----------- | --------------------------------- | ------- |
| ITEM\_RF\_SCALING\_VALUE | (a)   | handle  | 1769169761  | `itemrealfield: 000001CE0A50C0F0` |         |
| -1                       | (a)   | handle  | -1          | `itemrealfield: 000001CE20766540` |         |
| past the last constant   | (a)   | handle  | 1769169762  | `itemrealfield: 000001CE207681E0` |         |
| 2147483647               | (a)   | handle  | 2147483647  | `itemrealfield: 000001CE1F406B90` |         |
| -2147483648              | (a)   | handle  | -2147483648 | `itemrealfield: 000001CE1EF4DBE0` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertItemBooleanField`

| Case                                         | Group | Outcome | Id          | Type                                 | Message |
| -------------------------------------------- | ----- | ------- | ----------- | ------------------------------------ | ------- |
| ITEM\_BF\_DROPPED\_WHEN\_CARRIER\_DIES       | (a)   | handle  | 1768190576  | `itembooleanfield: 000001CE0A50C130` |         |
| ITEM\_BF\_CAN\_BE\_DROPPED                   | (a)   | handle  | 1768190575  | `itembooleanfield: 000001CE0A50C1A0` |         |
| ITEM\_BF\_PERISHABLE                         | (a)   | handle  | 1768973682  | `itembooleanfield: 000001CE0A50C1E0` |         |
| ITEM\_BF\_INCLUDE\_AS\_RANDOM\_CHOICE        | (a)   | handle  | 1768977006  | `itembooleanfield: 000001CE0A50C220` |         |
| ITEM\_BF\_USE\_AUTOMATICALLY\_WHEN\_ACQUIRED | (a)   | handle  | 1768976247  | `itembooleanfield: 000001CE0A50C260` |         |
| ITEM\_BF\_CAN\_BE\_SOLD\_TO\_MERCHANTS       | (a)   | handle  | 1768972663  | `itembooleanfield: 000001CE0A50C2A0` |         |
| ITEM\_BF\_ACTIVELY\_USED                     | (a)   | handle  | 1769304929  | `itembooleanfield: 000001CE0A50C2E0` |         |
| -1                                           | (a)   | handle  | -1          | `itembooleanfield: 000001CE2089BF10` |         |
| past the last constant                       | (a)   | handle  | 1769304930  | `itembooleanfield: 000001CE2046E1B0` |         |
| 2147483647                                   | (a)   | handle  | 2147483647  | `itembooleanfield: 000001CE1EF6BC70` |         |
| -2147483648                                  | (a)   | handle  | -2147483648 | `itembooleanfield: 000001CE1F417F30` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertItemStringField`

| Case                   | Group | Outcome | Id          | Type                                | Message |
| ---------------------- | ----- | ------- | ----------- | ----------------------------------- | ------- |
| ITEM\_SF\_MODEL\_USED  | (a)   | handle  | 1768319340  | `itemstringfield: 000001CE0A50C320` |         |
| -1                     | (a)   | handle  | -1          | `itemstringfield: 000001CE203B6ED0` |         |
| past the last constant | (a)   | handle  | 1768319341  | `itemstringfield: 000001CE1F435A00` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `itemstringfield: 000001CE20842D00` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `itemstringfield: 000001CE1EF3A100` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertMoveType`

| Case                    | Group | Outcome | Id          | Type                         | Message |
| ----------------------- | ----- | ------- | ----------- | ---------------------------- | ------- |
| MOVE\_TYPE\_UNKNOWN     | (a)   | handle  | 0           | `movetype: 000001CE0A500ED0` |         |
| MOVE\_TYPE\_FOOT        | (a)   | handle  | 1           | `movetype: 000001CE0A500F10` |         |
| MOVE\_TYPE\_FLY         | (a)   | handle  | 2           | `movetype: 000001CE0A500F50` |         |
| MOVE\_TYPE\_HORSE       | (a)   | handle  | 4           | `movetype: 000001CE0A500FD0` |         |
| MOVE\_TYPE\_HOVER       | (a)   | handle  | 8           | `movetype: 000001CE0A500F90` |         |
| MOVE\_TYPE\_FLOAT       | (a)   | handle  | 16          | `movetype: 000001CE0A501070` |         |
| MOVE\_TYPE\_AMPHIBIOUS  | (a)   | handle  | 32          | `movetype: 000001CE0A501140` |         |
| MOVE\_TYPE\_UNBUILDABLE | (a)   | handle  | 64          | `movetype: 000001CE0A501180` |         |
| -1                      | (a)   | handle  | -1          | `movetype: 000001CE1F464220` |         |
| past the last constant  | (a)   | handle  | 65          | `movetype: 000001CE20482490` |         |
| 2147483647              | (a)   | handle  | 2147483647  | `movetype: 000001CE208803F0` |         |
| -2147483648             | (a)   | handle  | -2147483648 | `movetype: 000001CE1EF60930` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertTargetFlag`

| Case                     | Group | Outcome | Id          | Type                           | Message |
| ------------------------ | ----- | ------- | ----------- | ------------------------------ | ------- |
| TARGET\_FLAG\_NONE       | (a)   | handle  | 1           | `targetflag: 000001CE0A5011C0` |         |
| TARGET\_FLAG\_GROUND     | (a)   | handle  | 2           | `targetflag: 000001CE0A501200` |         |
| TARGET\_FLAG\_AIR        | (a)   | handle  | 4           | `targetflag: 000001CE0A501280` |         |
| TARGET\_FLAG\_STRUCTURE  | (a)   | handle  | 8           | `targetflag: 000001CE0A501240` |         |
| TARGET\_FLAG\_WARD       | (a)   | handle  | 16          | `targetflag: 000001CE0A501320` |         |
| TARGET\_FLAG\_ITEM       | (a)   | handle  | 32          | `targetflag: 000001CE0A501360` |         |
| TARGET\_FLAG\_TREE       | (a)   | handle  | 64          | `targetflag: 000001CE0A5013A0` |         |
| TARGET\_FLAG\_WALL       | (a)   | handle  | 128         | `targetflag: 000001CE0A5013E0` |         |
| TARGET\_FLAG\_DEBRIS     | (a)   | handle  | 256         | `targetflag: 000001CE0A501530` |         |
| TARGET\_FLAG\_DECORATION | (a)   | handle  | 512         | `targetflag: 000001CE0A501570` |         |
| TARGET\_FLAG\_BRIDGE     | (a)   | handle  | 1024        | `targetflag: 000001CE0A5015B0` |         |
| -1                       | (a)   | handle  | -1          | `targetflag: 000001CE1EF34AF0` |         |
| past the last constant   | (a)   | handle  | 1025        | `targetflag: 000001CE1F440D60` |         |
| 2147483647               | (a)   | handle  | 2147483647  | `targetflag: 000001CE1F490B60` |         |
| -2147483648              | (a)   | handle  | -2147483648 | `targetflag: 000001CE208790C0` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertArmorType`

| Case                   | Group | Outcome | Id          | Type                          | Message |
| ---------------------- | ----- | ------- | ----------- | ----------------------------- | ------- |
| ARMOR\_TYPE\_WHOKNOWS  | (a)   | handle  | 0           | `armortype: 000001CE034C1780` |         |
| ARMOR\_TYPE\_FLESH     | (a)   | handle  | 1           | `armortype: 000001CE034C1800` |         |
| ARMOR\_TYPE\_METAL     | (a)   | handle  | 2           | `armortype: 000001CE034C1840` |         |
| ARMOR\_TYPE\_WOOD      | (a)   | handle  | 3           | `armortype: 000001CE034C18C0` |         |
| ARMOR\_TYPE\_ETHREAL   | (a)   | handle  | 4           | `armortype: 000001CE034C1880` |         |
| ARMOR\_TYPE\_STONE     | (a)   | handle  | 5           | `armortype: 000001CE034C1960` |         |
| -1                     | (a)   | handle  | -1          | `armortype: 000001CE203903F0` |         |
| past the last constant | (a)   | handle  | 6           | `armortype: 000001CE208881B0` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `armortype: 000001CE2075B330` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `armortype: 000001CE1EF2AA60` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertHeroAttribute`

| Case                   | Group | Outcome | Id          | Type                              | Message |
| ---------------------- | ----- | ------- | ----------- | --------------------------------- | ------- |
| HERO\_ATTRIBUTE\_STR   | (a)   | handle  | 1           | `heroattribute: 000001CE034C1700` |         |
| HERO\_ATTRIBUTE\_INT   | (a)   | handle  | 2           | `heroattribute: 000001CE034C1740` |         |
| HERO\_ATTRIBUTE\_AGI   | (a)   | handle  | 3           | `heroattribute: 000001CE034C17C0` |         |
| -1                     | (a)   | handle  | -1          | `heroattribute: 000001CE1EF7A1D0` |         |
| past the last constant | (a)   | handle  | 4           | `heroattribute: 000001CE204651B0` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `heroattribute: 000001CE1EF28150` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `heroattribute: 000001CE1FCD0A40` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertDefenseType`

| Case                   | Group | Outcome | Id          | Type                            | Message |
| ---------------------- | ----- | ------- | ----------- | ------------------------------- | ------- |
| DEFENSE\_TYPE\_LIGHT   | (a)   | handle  | 0           | `defensetype: 000001CE0A5015F0` |         |
| DEFENSE\_TYPE\_MEDIUM  | (a)   | handle  | 1           | `defensetype: 000001CE0A501630` |         |
| DEFENSE\_TYPE\_LARGE   | (a)   | handle  | 2           | `defensetype: 000001CE0A501670` |         |
| DEFENSE\_TYPE\_FORT    | (a)   | handle  | 3           | `defensetype: 000001CE0A5016F0` |         |
| DEFENSE\_TYPE\_NORMAL  | (a)   | handle  | 4           | `defensetype: 000001CE0A5016B0` |         |
| DEFENSE\_TYPE\_HERO    | (a)   | handle  | 5           | `defensetype: 000001CE0A501790` |         |
| DEFENSE\_TYPE\_DIVINE  | (a)   | handle  | 6           | `defensetype: 000001CE034C1680` |         |
| DEFENSE\_TYPE\_NONE    | (a)   | handle  | 7           | `defensetype: 000001CE034C16C0` |         |
| -1                     | (a)   | handle  | -1          | `defensetype: 000001CE20888E90` |         |
| past the last constant | (a)   | handle  | 8           | `defensetype: 000001CE1EF48610` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `defensetype: 000001CE1EF4FA40` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `defensetype: 000001CE1EF2AC80` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertRegenType`

| Case                       | Group | Outcome | Id          | Type                          | Message |
| -------------------------- | ----- | ------- | ----------- | ----------------------------- | ------- |
| REGENERATION\_TYPE\_NONE   | (a)   | handle  | 0           | `regentype: 000001CE034C1A40` |         |
| REGENERATION\_TYPE\_ALWAYS | (a)   | handle  | 1           | `regentype: 000001CE034C1A80` |         |
| REGENERATION\_TYPE\_BLIGHT | (a)   | handle  | 2           | `regentype: 000001CE034C1AF0` |         |
| REGENERATION\_TYPE\_DAY    | (a)   | handle  | 3           | `regentype: 000001CE034C1B70` |         |
| REGENERATION\_TYPE\_NIGHT  | (a)   | handle  | 4           | `regentype: 000001CE034C1B30` |         |
| -1                         | (a)   | handle  | -1          | `regentype: 000001CE1FCC1080` |         |
| past the last constant     | (a)   | handle  | 5           | `regentype: 000001CE1FCBB070` |         |
| 2147483647                 | (a)   | handle  | 2147483647  | `regentype: 000001CE1FCAD9A0` |         |
| -2147483648                | (a)   | handle  | -2147483648 | `regentype: 000001CE034DA470` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertUnitCategory`

| Case                       | Group | Outcome | Id          | Type                             | Message |
| -------------------------- | ----- | ------- | ----------- | -------------------------------- | ------- |
| UNIT\_CATEGORY\_GIANT      | (a)   | handle  | 1           | `unitcategory: 000001CE034C1BB0` |         |
| UNIT\_CATEGORY\_UNDEAD     | (a)   | handle  | 2           | `unitcategory: 000001CE034C1BF0` |         |
| UNIT\_CATEGORY\_SUMMONED   | (a)   | handle  | 4           | `unitcategory: 000001CE034C1C70` |         |
| UNIT\_CATEGORY\_MECHANICAL | (a)   | handle  | 8           | `unitcategory: 000001CE034C1C30` |         |
| UNIT\_CATEGORY\_PEON       | (a)   | handle  | 16          | `unitcategory: 000001CE034C1D10` |         |
| UNIT\_CATEGORY\_SAPPER     | (a)   | handle  | 32          | `unitcategory: 000001CE034C1D50` |         |
| UNIT\_CATEGORY\_TOWNHALL   | (a)   | handle  | 64          | `unitcategory: 000001CE034C1D90` |         |
| UNIT\_CATEGORY\_ANCIENT    | (a)   | handle  | 128         | `unitcategory: 000001CE034C1DD0` |         |
| UNIT\_CATEGORY\_NEUTRAL    | (a)   | handle  | 256         | `unitcategory: 000001CE034C1F20` |         |
| UNIT\_CATEGORY\_WARD       | (a)   | handle  | 512         | `unitcategory: 000001CE034C1F60` |         |
| UNIT\_CATEGORY\_STANDON    | (a)   | handle  | 1024        | `unitcategory: 000001CE034C1FA0` |         |
| UNIT\_CATEGORY\_TAUREN     | (a)   | handle  | 2048        | `unitcategory: 000001CE034C1FE0` |         |
| -1                         | (a)   | handle  | -1          | `unitcategory: 000001CE20471CF0` |         |
| past the last constant     | (a)   | handle  | 2049        | `unitcategory: 000001CE1FCBA890` |         |
| 2147483647                 | (a)   | handle  | 2147483647  | `unitcategory: 000001CE1FCD5060` |         |
| -2147483648                | (a)   | handle  | -2147483648 | `unitcategory: 000001CE1FDEE910` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertPathingFlag`

| Case                          | Group | Outcome | Id          | Type                            | Message |
| ----------------------------- | ----- | ------- | ----------- | ------------------------------- | ------- |
| PATHING\_FLAG\_UNWALKABLE     | (a)   | handle  | 2           | `pathingflag: 000001CE034C2230` |         |
| PATHING\_FLAG\_UNFLYABLE      | (a)   | handle  | 4           | `pathingflag: 000001CE034C2270` |         |
| PATHING\_FLAG\_UNBUILDABLE    | (a)   | handle  | 8           | `pathingflag: 000001CE034C22B0` |         |
| PATHING\_FLAG\_UNPEONHARVEST  | (a)   | handle  | 16          | `pathingflag: 000001CE034C22F0` |         |
| PATHING\_FLAG\_BLIGHTED       | (a)   | handle  | 32          | `pathingflag: 000001CE034C2330` |         |
| PATHING\_FLAG\_UNFLOATABLE    | (a)   | handle  | 64          | `pathingflag: 000001CE034C2370` |         |
| PATHING\_FLAG\_UNAMPHIBIOUS   | (a)   | handle  | 128         | `pathingflag: 000001CE034C23B0` |         |
| PATHING\_FLAG\_UNITEMPLACABLE | (a)   | handle  | 256         | `pathingflag: 000001CE034C23F0` |         |
| -1                            | (a)   | handle  | -1          | `pathingflag: 000001CE20881350` |         |
| past the last constant        | (a)   | handle  | 257         | `pathingflag: 000001CE1EF44A50` |         |
| 2147483647                    | (a)   | handle  | 2147483647  | `pathingflag: 000001CE20880E30` |         |
| -2147483648                   | (a)   | handle  | -2147483648 | `pathingflag: 000001CE20846380` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertFogStyle`

| Case                    | Group | Outcome | Id          | Type                         | Message |
| ----------------------- | ----- | ------- | ----------- | ---------------------------- | ------- |
| FOG\_STYLE\_LINEAR      | (a)   | handle  | 0           | `fogstyle: 000001CEFFC7DAC0` |         |
| FOG\_STYLE\_EXP         | (a)   | handle  | 1           | `fogstyle: 000001CEFFC7DB00` |         |
| FOG\_STYLE\_EXP2        | (a)   | handle  | 2           | `fogstyle: 000001CEFFC7DB70` |         |
| FOG\_STYLE\_HEIGHT      | (a)   | handle  | 3           | `fogstyle: 000001CEFFC7DBF0` |         |
| FOG\_STYLE\_NEW\_EXP    | (a)   | handle  | 4           | `fogstyle: 000001CEFFC7DBB0` |         |
| FOG\_STYLE\_NEW\_EXP\_2 | (a)   | handle  | 5           | `fogstyle: 000001CEFFC7DC90` |         |
| -1                      | (a)   | handle  | -1          | `fogstyle: 000001CE034D8640` |         |
| past the last constant  | (a)   | handle  | 6           | `fogstyle: 000001CE203AF7C0` |         |
| 2147483647              | (a)   | handle  | 2147483647  | `fogstyle: 000001CE203C0880` |         |
| -2147483648             | (a)   | handle  | -2147483648 | `fogstyle: 000001CE203B7670` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertEquipmentType`

| Case                     | Group | Outcome | Id          | Type                              | Message |
| ------------------------ | ----- | ------- | ----------- | --------------------------------- | ------- |
| EQUIPMENT\_TYPE\_NONE    | (a)   | handle  | 0           | `equipmentType: 000001CE034E6B50` |         |
| EQUIPMENT\_TYPE\_HEAD    | (a)   | handle  | 1           | `equipmentType: 000001CE034E6B90` |         |
| EQUIPMENT\_TYPE\_CHEST   | (a)   | handle  | 2           | `equipmentType: 000001CE034E6C00` |         |
| EQUIPMENT\_TYPE\_GLOVES  | (a)   | handle  | 3           | `equipmentType: 000001CE034E6C80` |         |
| EQUIPMENT\_TYPE\_BOOTS   | (a)   | handle  | 4           | `equipmentType: 000001CE034E6C40` |         |
| EQUIPMENT\_TYPE\_RING    | (a)   | handle  | 5           | `equipmentType: 000001CE034E6CC0` |         |
| EQUIPMENT\_TYPE\_PRIMARY | (a)   | handle  | 6           | `equipmentType: 000001CE034E6D00` |         |
| EQUIPMENT\_TYPE\_OFFHAND | (a)   | handle  | 7           | `equipmentType: 000001CE034E6D40` |         |
| EQUIPMENT\_TYPE\_TRINKET | (a)   | handle  | 8           | `equipmentType: 000001CE034E6D80` |         |
| EQUIPMENT\_TYPE\_ANY     | (a)   | handle  | 9           | `equipmentType: 000001CE034E6DC0` |         |
| -1                       | (a)   | handle  | -1          | `equipmentType: 000001CE2038F400` |         |
| past the last constant   | (a)   | handle  | 10          | `equipmentType: 000001CE2074BA80` |         |
| 2147483647               | (a)   | handle  | 2147483647  | `equipmentType: 000001CE20481F10` |         |
| -2147483648              | (a)   | handle  | -2147483648 | `equipmentType: 000001CE20754480` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertItemTag`

| Case                       | Group | Outcome | Id          | Type                        | Message |
| -------------------------- | ----- | ------- | ----------- | --------------------------- | ------- |
| ITEMTAG\_TYPE\_UNDEFINED   | (a)   | handle  | 0           | `itemTag: 000001CE034E6F20` |         |
| ITEMTAG\_TYPE\_DROPPABLE   | (a)   | handle  | 1           | `itemTag: 000001CE034E6F60` |         |
| ITEMTAG\_TYPE\_QUESTREWARD | (a)   | handle  | 2           | `itemTag: 000001CE034E6FD0` |         |
| ITEMTAG\_TYPE\_BOSSDROP    | (a)   | handle  | 3           | `itemTag: 000001CE034E7050` |         |
| ITEMTAG\_TYPE\_SECRET      | (a)   | handle  | 4           | `itemTag: 000001CE034E7010` |         |
| ITEMTAG\_TYPE\_PUZZLE      | (a)   | handle  | 5           | `itemTag: 000001CE034E7090` |         |
| ITEMTAG\_TYPE\_WORLD       | (a)   | handle  | 6           | `itemTag: 000001CE034E70D0` |         |
| ITEMTAG\_TYPE\_SHOP        | (a)   | handle  | 7           | `itemTag: 000001CE034E7110` |         |
| ITEMTAG\_TYPE\_ANY         | (a)   | handle  | 8           | `itemTag: 000001CE034E7150` |         |
| -1                         | (a)   | handle  | -1          | `itemTag: 000001CE203B3160` |         |
| past the last constant     | (a)   | handle  | 9           | `itemTag: 000001CE20854EF0` |         |
| 2147483647                 | (a)   | handle  | 2147483647  | `itemTag: 000001CE207745F0` |         |
| -2147483648                | (a)   | handle  | -2147483648 | `itemTag: 000001CE20774C20` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertLoadoutSlot`

| Case                              | Group | Outcome | Id          | Type                            | Message |
| --------------------------------- | ----- | ------- | ----------- | ------------------------------- | ------- |
| EQUIPMENT\_LOADOUT\_SLOT\_HEAD    | (a)   | handle  | 0           | `loadoutslot: 000001CE034E7190` |         |
| EQUIPMENT\_LOADOUT\_SLOT\_CHEST   | (a)   | handle  | 1           | `loadoutslot: 000001CE034E71D0` |         |
| EQUIPMENT\_LOADOUT\_SLOT\_GLOVES  | (a)   | handle  | 2           | `loadoutslot: 000001CE034E7240` |         |
| EQUIPMENT\_LOADOUT\_SLOT\_BOOTS   | (a)   | handle  | 3           | `loadoutslot: 000001CE034E72C0` |         |
| EQUIPMENT\_LOADOUT\_SLOT\_RING    | (a)   | handle  | 4           | `loadoutslot: 000001CE034E7280` |         |
| EQUIPMENT\_LOADOUT\_SLOT\_RINGALT | (a)   | handle  | 5           | `loadoutslot: 000001CE034E7300` |         |
| EQUIPMENT\_LOADOUT\_SLOT\_PRIMARY | (a)   | handle  | 6           | `loadoutslot: 000001CE034E73E0` |         |
| EQUIPMENT\_LOADOUT\_SLOT\_OFFHAND | (a)   | handle  | 7           | `loadoutslot: 000001CE034E7420` |         |
| EQUIPMENT\_LOADOUT\_SLOT\_TRINKET | (a)   | handle  | 8           | `loadoutslot: 000001CE034E7460` |         |
| -1                                | (a)   | handle  | -1          | `loadoutslot: 000001CE203A3820` |         |
| past the last constant            | (a)   | handle  | 9           | `loadoutslot: 000001CE1F41E0C0` |         |
| 2147483647                        | (a)   | handle  | 2147483647  | `loadoutslot: 000001CE1F463240` |         |
| -2147483648                       | (a)   | handle  | -2147483648 | `loadoutslot: 000001CE1F4993B0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.24268); the handle's id is the integer passed in. Evidence, not proof.

## `nullability-event-responses-1`

- Probe: `nullability-event-responses-1`
- Patch: 3.0.0.24268
- Date: 2026-10-04
- Run: `34ac4961-cb57-4abc-aadf-0490b4183921`

### `GetTriggeringTrigger`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetTriggerEventId`

| Case              | Group | Outcome | Id  | Type                        | Message |
| ----------------- | ----- | ------- | --- | --------------------------- | ------- |
| outside its event | (a)   | handle  | 0   | `eventid: 0000029180D01D20` |         |

- Family: `event-response`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing outside its event. Returned a handle in every case of the nullability sweep (outside its event) on 3.0.0.24268. The handle had id 0 in a case (outside its event).

### `GetEventGameState`

| Case              | Group | Outcome | Id  | Type                          | Message |
| ----------------- | ----- | ------- | --- | ----------------------------- | ------- |
| outside its event | (a)   | handle  | 0   | `gamestate: 00000291806E8E50` |         |

- Family: `event-response`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing outside its event. Returned a handle in every case of the nullability sweep (outside its event) on 3.0.0.24268. The handle had id 0 in a case (outside its event).

### `GetWinningPlayer`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetTriggeringRegion`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetEnteringUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetLeavingUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetTriggeringTrackable`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetClickedButton`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetClickedDialog`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetTournamentFinishNowPlayer`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetTriggerPlayer`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetLevelingUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetLearningUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetRevivableUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetRevivingUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetAttacker`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetRescuer`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetDyingUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetKillingUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetDecayingUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetConstructingStructure`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetCancelledStructure`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetConstructedStructure`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetResearchingUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetTrainedUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetDetectedUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetSummoningUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetSummonedUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetTransportUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetLoadedUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetSellingUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetSoldUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetBuyingUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetSoldItem`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetChangingUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetChangingUnitPrevOwner`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

## `nullability-event-responses-2`

- Probe: `nullability-event-responses-2`
- Patch: 3.0.0.24268
- Date: 2026-10-04
- Run: `ceda43ff-060f-4165-98e4-393064ab2e7b`

### `GetManipulatingUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetManipulatedItem`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetEquippedItem`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetUnequippedItem`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `BlzGetAbsorbingItem`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `BlzGetStackingItemSource`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `BlzGetStackingItemTarget`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetOrderedUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetOrderPointLoc`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetOrderTarget`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetOrderTargetDestructable`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetOrderTargetItem`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetOrderTargetUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetSpellAbilityUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetSpellAbility`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetSpellTargetLoc`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetSpellTargetDestructable`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetSpellTargetItem`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetSpellTargetUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetEventPlayerState`

| Case              | Group | Outcome | Id  | Type                            | Message |
| ----------------- | ----- | ------- | --- | ------------------------------- | ------- |
| outside its event | (a)   | handle  | 0   | `playerstate: 0000017772619A60` |         |

- Family: `event-response`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing outside its event. Returned a handle in every case of the nullability sweep (outside its event) on 3.0.0.24268. The handle had id 0 in a case (outside its event).

### `GetTriggerUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetEventUnitState`

| Case              | Group | Outcome | Id  | Type                          | Message |
| ----------------- | ----- | ------- | --- | ----------------------------- | ------- |
| outside its event | (a)   | handle  | 0   | `unitstate: 000001777261A280` |         |

- Family: `event-response`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing outside its event. Returned a handle in every case of the nullability sweep (outside its event) on 3.0.0.24268. The handle had id 0 in a case (outside its event).

### `GetEventDamageSource`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetEventDetectingPlayer`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetEventTargetUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetTriggerWidget`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `GetTriggerDestructable`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `BlzGetTriggerPlayerMousePosition`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `BlzGetTriggerPlayerMouseButton`

| Case              | Group | Outcome | Id  | Type                                | Message |
| ----------------- | ----- | ------- | --- | ----------------------------------- | ------- |
| outside its event | (a)   | handle  | 0   | `mousebuttontype: 000001777E11A5B0` |         |

- Family: `event-response`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing outside its event. Returned a handle in every case of the nullability sweep (outside its event) on 3.0.0.24268. The handle had id 0 in a case (outside its event).

### `BlzGetEventDamageTarget`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `BlzGetEventAttackType`

| Case              | Group | Outcome | Id  | Type                           | Message |
| ----------------- | ----- | ------- | --- | ------------------------------ | ------- |
| outside its event | (a)   | handle  | -1  | `attacktype: 000001777E10F930` |         |

- Family: `event-response`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing outside its event. Returned a handle in every case of the nullability sweep (outside its event) on 3.0.0.24268.

### `BlzGetEventDamageType`

| Case              | Group | Outcome | Id  | Type                           | Message |
| ----------------- | ----- | ------- | --- | ------------------------------ | ------- |
| outside its event | (a)   | handle  | 0   | `damagetype: 000001777952AB20` |         |

- Family: `event-response`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing outside its event. Returned a handle in every case of the nullability sweep (outside its event) on 3.0.0.24268. The handle had id 0 in a case (outside its event).

### `BlzGetEventWeaponType`

| Case              | Group | Outcome | Id  | Type                           | Message |
| ----------------- | ----- | ------- | --- | ------------------------------ | ------- |
| outside its event | (a)   | handle  | 0   | `weapontype: 000001777952B740` |         |

- Family: `event-response`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing outside its event. Returned a handle in every case of the nullability sweep (outside its event) on 3.0.0.24268. The handle had id 0 in a case (outside its event).

### `BlzGetTriggerFrame`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.0.24268.

### `BlzGetTriggerFrameEvent`

| Case              | Group | Outcome | Id  | Type                               | Message |
| ----------------- | ----- | ------- | --- | ---------------------------------- | ------- |
| outside its event | (a)   | handle  | 0   | `frameeventtype: 000001777F9AC280` |         |

- Family: `event-response`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing outside its event. Returned a handle in every case of the nullability sweep (outside its event) on 3.0.0.24268. The handle had id 0 in a case (outside its event).

### `BlzGetTriggerPlayerKey`

| Case              | Group | Outcome | Id  | Type                          | Message |
| ----------------- | ----- | ------- | --- | ----------------------------- | ------- |
| outside its event | (a)   | handle  | 0   | `oskeytype: 000001777F9B06B0` |         |

- Family: `event-response`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing outside its event. Returned a handle in every case of the nullability sweep (outside its event) on 3.0.0.24268. The handle had id 0 in a case (outside its event).

## `nullability-lookups-1`

- Probe: `nullability-lookups-1`
- Patch: 3.0.0.24268
- Date: 2026-10-04
- Run: `04b94ae1-c04b-4011-9f9f-0be39b716491`

### `GetStartLocationLoc`

| Case               | Group | Outcome | Id  | Type | Message |
| ------------------ | ----- | ------- | --- | ---- | ------- |
| index out of range | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returns nothing for index out of range (nullability sweep, 3.0.0.24268).

### `BlzGroupUnitAt`

| Case               | Group | Outcome | Id  | Type | Message |
| ------------------ | ----- | ------- | --- | ---- | ------- |
| index out of range | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returns nothing for index out of range (nullability sweep, 3.0.0.24268).

### `FirstOfGroup`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| empty group | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returns nothing for empty group (nullability sweep, 3.0.0.24268).

### `UnitRemoveItemFromSlot`

| Case       | Group | Outcome | Id  | Type | Message |
| ---------- | ----- | ------- | --- | ---- | ------- |
| empty slot | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returns nothing for empty slot (nullability sweep, 3.0.0.24268).

### `UnitUnequipItemFromSlot`

| Case       | Group | Outcome | Id  | Type | Message |
| ---------- | ----- | ------- | --- | ---- | ------- |
| empty slot | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returns nothing for empty slot (nullability sweep, 3.0.0.24268).

### `UnitItemInSlot`

| Case       | Group | Outcome | Id  | Type | Message |
| ---------- | ----- | ------- | --- | ---- | ------- |
| empty slot | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returns nothing for empty slot (nullability sweep, 3.0.0.24268).

### `UnitItemInBagSlot`

| Case       | Group | Outcome | Id  | Type | Message |
| ---------- | ----- | ------- | --- | ---- | ------- |
| empty slot | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returns nothing for empty slot (nullability sweep, 3.0.0.24268).

### `UnitItemInEquipmentSlot`

| Case       | Group | Outcome | Id  | Type | Message |
| ---------- | ----- | ------- | --- | ---- | ------- |
| empty slot | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returns nothing for empty slot (nullability sweep, 3.0.0.24268).

### `Player`

| Case               | Group | Outcome | Id  | Type | Message |
| ------------------ | ----- | ------- | --- | ---- | ------- |
| index out of range | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returns nothing for index out of range (nullability sweep, 3.0.0.24268).

### `RestoreUnit`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returns nothing for unsaved key (nullability sweep, 3.0.0.24268).

### `LoadPlayerHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returns nothing for unsaved key (nullability sweep, 3.0.0.24268).

### `LoadWidgetHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returns nothing for unsaved key (nullability sweep, 3.0.0.24268).

### `LoadDestructableHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returns nothing for unsaved key (nullability sweep, 3.0.0.24268).

### `LoadItemHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returns nothing for unsaved key (nullability sweep, 3.0.0.24268).

### `LoadUnitHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returns nothing for unsaved key (nullability sweep, 3.0.0.24268).

### `LoadAbilityHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returns nothing for unsaved key (nullability sweep, 3.0.0.24268).

### `LoadTimerHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returns nothing for unsaved key (nullability sweep, 3.0.0.24268).

### `LoadTriggerHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returns nothing for unsaved key (nullability sweep, 3.0.0.24268).

### `LoadTriggerConditionHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returns nothing for unsaved key (nullability sweep, 3.0.0.24268).

### `LoadTriggerActionHandle`

| Case        | Group | Outcome | Id  | Type                              | Message |
| ----------- | ----- | ------- | --- | --------------------------------- | ------- |
| unsaved key | (a)   | handle  | 0   | `triggeraction: 0000020C8BB37970` |         |

- Family: `lookup`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing when nothing is found. Returned a handle in every case of the nullability sweep (unsaved key) on 3.0.0.24268.

### `LoadTriggerEventHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returns nothing for unsaved key (nullability sweep, 3.0.0.24268).

### `LoadForceHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returns nothing for unsaved key (nullability sweep, 3.0.0.24268).

### `LoadGroupHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returns nothing for unsaved key (nullability sweep, 3.0.0.24268).

### `LoadLocationHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returns nothing for unsaved key (nullability sweep, 3.0.0.24268).

### `LoadRectHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returns nothing for unsaved key (nullability sweep, 3.0.0.24268).

### `LoadBooleanExprHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returns nothing for unsaved key (nullability sweep, 3.0.0.24268).

### `LoadSoundHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returns nothing for unsaved key (nullability sweep, 3.0.0.24268).

### `LoadEffectHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returns nothing for unsaved key (nullability sweep, 3.0.0.24268).

## `nullability-lookups-2`

- Probe: `nullability-lookups-2`
- Patch: 3.0.0.24268
- Client: 3.0.0.24268
- Date: 2026-10-04
- Run: `4074b2a5-8a34-4160-a7be-37fac463f448`

### `LoadUnitPoolHandle`

| Case        | Group | Outcome | Id  | Type                         | Message |
| ----------- | ----- | ------- | --- | ---------------------------- | ------- |
| unsaved key | (a)   | handle  | 0   | `unitpool: 0000022F58ECE500` |         |

- Family: `lookup`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing when nothing is found. Returned a handle in every case of the nullability sweep (unsaved key) on 3.0.0.24268. The handle had id 0 in a case (unsaved key).

### `LoadItemPoolHandle`

| Case        | Group | Outcome | Id  | Type                         | Message |
| ----------- | ----- | ------- | --- | ---------------------------- | ------- |
| unsaved key | (a)   | handle  | 0   | `itempool: 0000022F58ECE4C0` |         |

- Family: `lookup`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing when nothing is found. Returned a handle in every case of the nullability sweep (unsaved key) on 3.0.0.24268. The handle had id 0 in a case (unsaved key).

### `LoadQuestHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.0.24268.

### `LoadQuestItemHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.0.24268.

### `LoadDefeatConditionHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.0.24268.

### `LoadTimerDialogHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.0.24268.

### `LoadLeaderboardHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.0.24268.

### `LoadMultiboardHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.0.24268.

### `LoadMultiboardItemHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.0.24268.

### `LoadTrackableHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.0.24268.

### `LoadDialogHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.0.24268.

### `LoadButtonHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.0.24268.

### `LoadTextTagHandle`

| Case        | Group | Outcome | Id  | Type                        | Message |
| ----------- | ----- | ------- | --- | --------------------------- | ------- |
| unsaved key | (a)   | handle  | 0   | `texttag: 00000230012705A0` |         |

- Family: `lookup`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing when nothing is found. Returned a handle in every case of the nullability sweep (unsaved key) on 3.0.0.24268. The handle had id 0 in a case (unsaved key).

### `LoadLightningHandle`

| Case        | Group | Outcome | Id  | Type                          | Message |
| ----------- | ----- | ------- | --- | ----------------------------- | ------- |
| unsaved key | (a)   | handle  | 0   | `lightning: 0000023000650920` |         |

- Family: `lookup`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing when nothing is found. Returned a handle in every case of the nullability sweep (unsaved key) on 3.0.0.24268. The handle had id 0 in a case (unsaved key).

### `LoadImageHandle`

| Case        | Group | Outcome | Id  | Type                      | Message |
| ----------- | ----- | ------- | --- | ------------------------- | ------- |
| unsaved key | (a)   | handle  | 0   | `image: 00000230008D7370` |         |

- Family: `lookup`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing when nothing is found. Returned a handle in every case of the nullability sweep (unsaved key) on 3.0.0.24268. The handle had id 0 in a case (unsaved key).

### `LoadUbersplatHandle`

| Case        | Group | Outcome | Id  | Type                          | Message |
| ----------- | ----- | ------- | --- | ----------------------------- | ------- |
| unsaved key | (a)   | handle  | 0   | `ubersplat: 0000023000CCEAA0` |         |

- Family: `lookup`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing when nothing is found. Returned a handle in every case of the nullability sweep (unsaved key) on 3.0.0.24268. The handle had id 0 in a case (unsaved key).

### `LoadRegionHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.0.24268.

### `LoadFogStateHandle`

| Case        | Group | Outcome | Id  | Type                         | Message |
| ----------- | ----- | ------- | --- | ---------------------------- | ------- |
| unsaved key | (a)   | handle  | 0   | `fogstate: 0000023000CCE5F0` |         |

- Family: `lookup`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing when nothing is found. Returned a handle in every case of the nullability sweep (unsaved key) on 3.0.0.24268. The handle had id 0 in a case (unsaved key).

### `LoadFogModifierHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.0.24268.

### `LoadHashtableHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.0.24268.

### `LoadFrameHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.0.24268.

### `MultiboardGetItem`

| Case               | Group | Outcome | Id      | Type                               | Message |
| ------------------ | ----- | ------- | ------- | ---------------------------------- | ------- |
| index out of range | (a)   | handle  | 1048782 | `multiboarditem: 0000023000F546B0` |         |

- Family: `lookup`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing when nothing is found. Returned a handle in every case of the nullability sweep (index out of range) on 3.0.0.24268.

### `BlzGetOriginFrame`

| Case                    | Group | Outcome | Id  | Type | Message |
| ----------------------- | ----- | ------- | --- | ---- | ------- |
| frame type out of range | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (frame type out of range) on 3.0.0.24268.

### `BlzGetFrameByName`

| Case         | Group | Outcome | Id  | Type | Message |
| ------------ | ----- | ------- | --- | ---- | ------- |
| unknown name | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unknown name) on 3.0.0.24268.

### `BlzGetUnitAbility`

| Case             | Group | Outcome | Id  | Type | Message |
| ---------------- | ----- | ------- | --- | ---- | ------- |
| ability it lacks | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (ability it lacks) on 3.0.0.24268.

### `BlzGetUnitAbilityByIndex`

| Case               | Group | Outcome | Id  | Type | Message |
| ------------------ | ----- | ------- | --- | ---- | ------- |
| index out of range | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (index out of range) on 3.0.0.24268.

### `BlzGetItemAbilityByIndex`

| Case               | Group | Outcome | Id  | Type | Message |
| ------------------ | ----- | ------- | --- | ---- | ------- |
| index out of range | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (index out of range) on 3.0.0.24268.

### `BlzGetItemAbility`

| Case             | Group | Outcome | Id  | Type | Message |
| ---------------- | ----- | ------- | --- | ---- | ------- |
| ability it lacks | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (ability it lacks) on 3.0.0.24268.

## `nullability-callbacks-and-properties`

- Probe: `nullability-callbacks-and-properties`
- Patch: 3.0.0.24268
- Client: 3.0.0.24268
- Date: 2026-10-04
- Run: `dc314da5-38ee-4762-854f-008bc847a76a`

### `GetFilterUnit`

| Case                 | Group | Outcome | Id  | Type | Message |
| -------------------- | ----- | ------- | --- | ---- | ------- |
| outside its callback | (a)   | nil     |     |      |         |

- Family: `callback-getter`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its callback) on 3.0.0.24268.

### `GetEnumUnit`

| Case                 | Group | Outcome | Id  | Type | Message |
| -------------------- | ----- | ------- | --- | ---- | ------- |
| outside its callback | (a)   | nil     |     |      |         |

- Family: `callback-getter`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its callback) on 3.0.0.24268.

### `GetFilterDestructable`

| Case                 | Group | Outcome | Id  | Type | Message |
| -------------------- | ----- | ------- | --- | ---- | ------- |
| outside its callback | (a)   | nil     |     |      |         |

- Family: `callback-getter`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its callback) on 3.0.0.24268.

### `GetEnumDestructable`

| Case                 | Group | Outcome | Id  | Type | Message |
| -------------------- | ----- | ------- | --- | ---- | ------- |
| outside its callback | (a)   | nil     |     |      |         |

- Family: `callback-getter`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its callback) on 3.0.0.24268.

### `GetFilterItem`

| Case                 | Group | Outcome | Id  | Type | Message |
| -------------------- | ----- | ------- | --- | ---- | ------- |
| outside its callback | (a)   | nil     |     |      |         |

- Family: `callback-getter`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its callback) on 3.0.0.24268.

### `GetEnumItem`

| Case                 | Group | Outcome | Id  | Type | Message |
| -------------------- | ----- | ------- | --- | ---- | ------- |
| outside its callback | (a)   | nil     |     |      |         |

- Family: `callback-getter`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its callback) on 3.0.0.24268.

### `GetFilterPlayer`

| Case                 | Group | Outcome | Id  | Type | Message |
| -------------------- | ----- | ------- | --- | ---- | ------- |
| outside its callback | (a)   | nil     |     |      |         |

- Family: `callback-getter`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its callback) on 3.0.0.24268.

### `GetEnumPlayer`

| Case                 | Group | Outcome | Id  | Type | Message |
| -------------------- | ----- | ------- | --- | ---- | ------- |
| outside its callback | (a)   | nil     |     |      |         |

- Family: `callback-getter`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its callback) on 3.0.0.24268.

### `GetUnitRallyPoint`

| Case                     | Group | Outcome | Id  | Type | Message |
| ------------------------ | ----- | ------- | --- | ---- | ------- |
| unit with no rally point | (a)   | nil     |     |      |         |

- Family: `optional-property`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unit with no rally point) on 3.0.0.24268.

### `GetUnitRallyUnit`

| Case                     | Group | Outcome | Id  | Type | Message |
| ------------------------ | ----- | ------- | --- | ---- | ------- |
| unit with no rally point | (a)   | nil     |     |      |         |

- Family: `optional-property`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unit with no rally point) on 3.0.0.24268.

### `GetUnitRallyDestructable`

| Case                     | Group | Outcome | Id  | Type | Message |
| ------------------------ | ----- | ------- | --- | ---- | ------- |
| unit with no rally point | (a)   | nil     |     |      |         |

- Family: `optional-property`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unit with no rally point) on 3.0.0.24268.

### `PlayerGetLeaderboard`

| Case                       | Group | Outcome | Id  | Type | Message |
| -------------------------- | ----- | ------- | --- | ---- | ------- |
| player with no leaderboard | (a)   | nil     |     |      |         |

- Family: `optional-property`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (player with no leaderboard) on 3.0.0.24268.

### `BlzFrameGetParent`

| Case                   | Group | Outcome | Id  | Type | Message |
| ---------------------- | ----- | ------- | --- | ---- | ------- |
| game UI's parent frame | (a)   | nil     |     |      |         |

- Family: `optional-property`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (game UI's parent frame) on 3.0.0.24268.

### `BlzGetMouseFocusUnit`

| Case           | Group | Outcome | Id  | Type | Message |
| -------------- | ----- | ------- | --- | ---- | ------- |
| no mouse input | (a)   | nil     |     |      |         |

- Family: `optional-property`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (no mouse input) on 3.0.0.24268.

## `nullability-getters`

- Probe: `nullability-getters`
- Patch: 3.0.0.24268
- Client: 3.0.0.24268
- Date: 2026-10-04
- Run: `25b3accc-0d8b-4b30-a088-2211a7110bb8`

### `GetStartLocPrio`

| Case                             | Group | Outcome | Id  | Type                             | Message |
| -------------------------------- | ----- | ------- | --- | -------------------------------- | ------- |
| typical arguments                | (a)   | handle  | 0   | `startlocprio: 0000019CEF76DC00` |         |
| whichStartLoc: negative          | (a)   | handle  | 0   | `startlocprio: 0000019CEF76DC00` |         |
| whichStartLoc: outside the world | (a)   | handle  | 0   | `startlocprio: 0000019CEF76DC00` |         |
| whichStartLoc: 2147483647        | (a)   | handle  | 0   | `startlocprio: 0000019CEF76DC00` |         |
| prioSlotIndex: negative          | (a)   | handle  | 0   | `startlocprio: 0000019CEF76DC00` |         |
| prioSlotIndex: outside the world | (a)   | handle  | 0   | `startlocprio: 0000019CEF76DC00` |         |
| prioSlotIndex: 2147483647        | (a)   | handle  | 0   | `startlocprio: 0000019CEF76DC00` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichStartLoc: negative, whichStartLoc: outside the world, whichStartLoc: 2147483647, prioSlotIndex: negative, prioSlotIndex: outside the world, prioSlotIndex: 2147483647) on 3.0.0.24268; evidence, not proof. The handle had id 0 in 7 cases (typical arguments, whichStartLoc: negative, whichStartLoc: outside the world, whichStartLoc: 2147483647, prioSlotIndex: negative, prioSlotIndex: outside the world, prioSlotIndex: 2147483647).

### `GetGameTypeSelected`

| Case     | Group | Outcome | Id  | Type                         | Message |
| -------- | ----- | ------- | --- | ---------------------------- | ------- |
| one call | (a)   | handle  | 1   | `gametype: 0000019CEF76D3F0` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `GetGamePlacement`

| Case     | Group | Outcome | Id  | Type                          | Message |
| -------- | ----- | ------- | --- | ----------------------------- | ------- |
| one call | (a)   | handle  | 2   | `placement: 0000019CEF76DBC0` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `GetGameSpeed`

| Case     | Group | Outcome | Id  | Type                          | Message |
| -------- | ----- | ------- | --- | ----------------------------- | ------- |
| one call | (a)   | handle  | 2   | `gamespeed: 0000019CEF76E1A0` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `GetGameDifficulty`

| Case     | Group | Outcome | Id  | Type                               | Message |
| -------- | ----- | ------- | --- | ---------------------------------- | ------- |
| one call | (a)   | handle  | 0   | `gamedifficulty: 0000019CEF76DEC0` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof. The handle had id 0 in a case (one call).

### `GetResourceDensity`

| Case     | Group | Outcome | Id  | Type                           | Message |
| -------- | ----- | ------- | --- | ------------------------------ | ------- |
| one call | (a)   | handle  | 2   | `mapdensity: 0000019CEF76DE80` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `GetCreatureDensity`

| Case     | Group | Outcome | Id  | Type                           | Message |
| -------- | ----- | ------- | --- | ------------------------------ | ------- |
| one call | (a)   | handle  | 0   | `mapdensity: 0000019CEF76DDD0` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof. The handle had id 0 in a case (one call).

### `GetPlayerColor`

| Case                        | Group | Outcome | Id  | Type                            | Message |
| --------------------------- | ----- | ------- | --- | ------------------------------- | ------- |
| typical arguments           | (a)   | handle  | 0   | `playercolor: 0000019CF44948D0` |         |
| whichPlayer: empty slot     | (a)   | handle  | 23  | `playercolor: 0000019CF9202F40` |         |
| whichPlayer: neutral player | (a)   | handle  | 27  | `playercolor: 0000019D0BC0CAD0` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichPlayer: empty slot, whichPlayer: neutral player) on 3.0.0.24268; evidence, not proof. The handle had id 0 in a case (typical arguments).

### `GetPlayerController`

| Case                        | Group | Outcome | Id  | Type                           | Message |
| --------------------------- | ----- | ------- | --- | ------------------------------ | ------- |
| typical arguments           | (a)   | handle  | 0   | `mapcontrol: 0000019CEF76D170` |         |
| whichPlayer: empty slot     | (a)   | handle  | 5   | `mapcontrol: 0000019CEF76D310` |         |
| whichPlayer: neutral player | (a)   | handle  | 4   | `mapcontrol: 0000019CEF76D230` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichPlayer: empty slot, whichPlayer: neutral player) on 3.0.0.24268; evidence, not proof. The handle had id 0 in a case (typical arguments).

### `GetPlayerSlotState`

| Case                        | Group | Outcome | Id  | Type                                | Message |
| --------------------------- | ----- | ------- | --- | ----------------------------------- | ------- |
| typical arguments           | (a)   | handle  | 1   | `playerslotstate: 0000019CEF76E300` |         |
| whichPlayer: empty slot     | (a)   | handle  | 0   | `playerslotstate: 0000019CEF76E2C0` |         |
| whichPlayer: neutral player | (a)   | handle  | 1   | `playerslotstate: 0000019CEF76E300` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichPlayer: empty slot, whichPlayer: neutral player) on 3.0.0.24268; evidence, not proof. The handle had id 0 in a case (whichPlayer: empty slot).

### `GetWorldBounds`

| Case     | Group | Outcome | Id      | Type                     | Message |
| -------- | ----- | ------- | ------- | ------------------------ | ------- |
| one call | (a)   | handle  | 1048785 | `rect: 0000019D0B8B87C0` |         |

- Family: `intrinsic-property`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `GetItemPlayer`

| Case                    | Group | Outcome | Id      | Type                       | Message |
| ----------------------- | ----- | ------- | ------- | -------------------------- | ------- |
| typical arguments       | (a)   | handle  | 1048648 | `player: 0000019C45BCD7B0` |         |
| whichItem: dead item    | (b)   | handle  | 1048648 | `player: 0000019C45BCD7B0` |         |
| whichItem: removed item | (b)   | nil     |         |                            |         |

- Family: `intrinsic-property`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichItem: removed item) on 3.0.0.24268.

### `GetItemType`

| Case                    | Group | Outcome | Id  | Type                         | Message |
| ----------------------- | ----- | ------- | --- | ---------------------------- | ------- |
| typical arguments       | (a)   | handle  | 3   | `itemtype: 0000019CEF772830` |         |
| whichItem: dead item    | (b)   | handle  | 3   | `itemtype: 0000019CEF772830` |         |
| whichItem: removed item | (b)   | handle  | 8   | `itemtype: 0000019CEF772930` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichItem: dead item, whichItem: removed item) on 3.0.0.24268; evidence, not proof.

### `GetItemEquipmentType`

| Case                    | Group | Outcome | Id  | Type                              | Message |
| ----------------------- | ----- | ------- | --- | --------------------------------- | ------- |
| typical arguments       | (a)   | handle  | 0   | `equipmentType: 0000019CEF7729B0` |         |
| whichItem: dead item    | (b)   | handle  | 0   | `equipmentType: 0000019CEF7729B0` |         |
| whichItem: removed item | (b)   | handle  | 0   | `equipmentType: 0000019CEF7729B0` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichItem: dead item, whichItem: removed item) on 3.0.0.24268; evidence, not proof. The handle had id 0 in 3 cases (typical arguments, whichItem: dead item, whichItem: removed item).

### `GetItemTag`

| Case                    | Group | Outcome | Id  | Type                        | Message |
| ----------------------- | ----- | ------- | --- | --------------------------- | ------- |
| typical arguments       | (a)   | handle  | 0   | `itemTag: 0000019CEF772C60` |         |
| whichItem: dead item    | (b)   | handle  | 0   | `itemTag: 0000019CEF772C60` |         |
| whichItem: removed item | (b)   | handle  | 0   | `itemTag: 0000019CEF772C60` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichItem: dead item, whichItem: removed item) on 3.0.0.24268; evidence, not proof. The handle had id 0 in 3 cases (typical arguments, whichItem: dead item, whichItem: removed item).

### `GetUnitLoc`

| Case                    | Group | Outcome | Id      | Type                         | Message |
| ----------------------- | ----- | ------- | ------- | ---------------------------- | ------- |
| typical arguments       | (a)   | handle  | 1048786 | `location: 0000019D0BCE1950` |         |
| whichUnit: dead unit    | (b)   | handle  | 1048790 | `location: 0000019D0BC16010` |         |
| whichUnit: removed unit | (b)   | handle  | 1048791 | `location: 0000019D0BC185E0` |         |

- Family: `intrinsic-property`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichUnit: dead unit, whichUnit: removed unit) on 3.0.0.24268; evidence, not proof.

### `GetOwningPlayer`

| Case                    | Group | Outcome | Id      | Type                       | Message |
| ----------------------- | ----- | ------- | ------- | -------------------------- | ------- |
| typical arguments       | (a)   | handle  | 1048584 | `player: 0000019CF4316E50` |         |
| whichUnit: dead unit    | (b)   | handle  | 1048584 | `player: 0000019CF4316E50` |         |
| whichUnit: removed unit | (b)   | handle  | 1048584 | `player: 0000019CF4316E50` |         |

- Family: `intrinsic-property`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichUnit: dead unit, whichUnit: removed unit) on 3.0.0.24268; evidence, not proof.

### `GetUnitRace`

| Case                    | Group | Outcome | Id  | Type                     | Message |
| ----------------------- | ----- | ------- | --- | ------------------------ | ------- |
| typical arguments       | (a)   | handle  | 1   | `race: 0000019CF9202FC0` |         |
| whichUnit: dead unit    | (b)   | handle  | 1   | `race: 0000019CF9202FC0` |         |
| whichUnit: removed unit | (b)   | handle  | 1   | `race: 0000019CF9202FC0` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichUnit: dead unit, whichUnit: removed unit) on 3.0.0.24268; evidence, not proof.

### `GetLocalPlayer`

| Case     | Group | Outcome | Id      | Type                       | Message |
| -------- | ----- | ------- | ------- | -------------------------- | ------- |
| one call | (a)   | handle  | 1048584 | `player: 0000019CF4316E50` |         |

- Family: `intrinsic-property`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `GetPlayerRace`

| Case                        | Group | Outcome | Id  | Type                     | Message |
| --------------------------- | ----- | ------- | --- | ------------------------ | ------- |
| typical arguments           | (a)   | handle  | 2   | `race: 0000019CF9203000` |         |
| whichPlayer: empty slot     | (a)   | handle  | 4   | `race: 0000019CF9203040` |         |
| whichPlayer: neutral player | (a)   | handle  | 0   | `race: 0000019D0B9F7EE0` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichPlayer: empty slot, whichPlayer: neutral player) on 3.0.0.24268; evidence, not proof. The handle had id 0 in a case (whichPlayer: neutral player).

### `VersionGet`

| Case     | Group | Outcome | Id  | Type                        | Message |
| -------- | ----- | ------- | --- | --------------------------- | ------- |
| one call | (a)   | handle  | 2   | `version: 0000019C4A030510` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `GetDefaultDifficulty`

| Case     | Group | Outcome | Id  | Type                               | Message |
| -------- | ----- | ------- | --- | ---------------------------------- | ------- |
| one call | (a)   | handle  | 1   | `gamedifficulty: 0000019CEF76DFA0` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `CameraSetupGetDestPositionLoc`

| Case              | Group | Outcome | Id      | Type                         | Message |
| ----------------- | ----- | ------- | ------- | ---------------------------- | ------- |
| typical arguments | (a)   | handle  | 1048787 | `location: 0000019CF449B980` |         |

- Family: `intrinsic-property`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments) on 3.0.0.24268; evidence, not proof.

### `GetCameraTargetPositionLoc`

| Case     | Group | Outcome | Id      | Type                         | Message |
| -------- | ----- | ------- | ------- | ---------------------------- | ------- |
| one call | (a)   | handle  | 1048788 | `location: 0000019CF449F3E0` |         |

- Family: `intrinsic-property`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `GetCameraEyePositionLoc`

| Case     | Group | Outcome | Id      | Type                         | Message |
| -------- | ----- | ------- | ------- | ---------------------------- | ------- |
| one call | (a)   | handle  | 1048789 | `location: 0000019CF44A3200` |         |

- Family: `intrinsic-property`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `GetAIDifficulty`

| Case                | Group | Outcome | Id  | Type                             | Message |
| ------------------- | ----- | ------- | --- | -------------------------------- | ------- |
| typical arguments   | (a)   | handle  | 1   | `aidifficulty: 0000019CEF76F270` |         |
| num: empty slot     | (a)   | handle  | 1   | `aidifficulty: 0000019CEF76F270` |         |
| num: neutral player | (a)   | handle  | 1   | `aidifficulty: 0000019CEF76F270` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, num: empty slot, num: neutral player) on 3.0.0.24268; evidence, not proof.

## `nullability-constructors-game`

- Probe: `nullability-constructors-game`
- Patch: 3.0.0.24268
- Client: 3.0.0.24268
- Date: 2026-10-04
- Run: `77478543-2ed0-4bfa-a8ec-f4585cac0701`

### `CreateTimer`

| Case     | Group | Outcome | Id      | Type                      | Message |
| -------- | ----- | ------- | ------- | ------------------------- | ------- |
| one call | (a)   | handle  | 1048807 | `timer: 000001F980888350` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `CreateGroup`

| Case     | Group | Outcome | Id      | Type                      | Message |
| -------- | ----- | ------- | ------- | ------------------------- | ------- |
| one call | (a)   | handle  | 1048808 | `group: 000001F98088AA60` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `CreateForce`

| Case     | Group | Outcome | Id      | Type                      | Message |
| -------- | ----- | ------- | ------- | ------------------------- | ------- |
| one call | (a)   | handle  | 1048809 | `force: 000001F980888E70` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `Rect`

| Case                    | Group | Outcome | Id      | Type                     | Message |
| ----------------------- | ----- | ------- | ------- | ------------------------ | ------- |
| typical arguments       | (a)   | handle  | 1048810 | `rect: 000001F980981AC0` |         |
| minx: 0                 | (a)   | handle  | 1048811 | `rect: 000001F980987F20` |         |
| minx: negative          | (a)   | handle  | 1048812 | `rect: 000001F980982E90` |         |
| minx: outside the world | (a)   | handle  | 1048813 | `rect: 000001F98088B690` |         |
| minx: 2147483647        | (a)   | handle  | 1048814 | `rect: 000001F98098C990` |         |
| miny: 0                 | (a)   | handle  | 1048815 | `rect: 000001F980987860` |         |
| miny: negative          | (a)   | handle  | 1048816 | `rect: 000001F980989A00` |         |
| miny: outside the world | (a)   | handle  | 1048817 | `rect: 000001F9809920A0` |         |
| miny: 2147483647        | (a)   | handle  | 1048818 | `rect: 000001F980986450` |         |
| maxx: 0                 | (a)   | handle  | 1048819 | `rect: 000001F980983FC0` |         |
| maxx: negative          | (a)   | handle  | 1048820 | `rect: 000001F9809850B0` |         |
| maxx: outside the world | (a)   | handle  | 1048821 | `rect: 000001F98054D960` |         |
| maxx: 2147483647        | (a)   | handle  | 1048822 | `rect: 000001F980554180` |         |
| maxy: 0                 | (a)   | handle  | 1048823 | `rect: 000001F980992C40` |         |
| maxy: negative          | (a)   | handle  | 1048824 | `rect: 000001F980558410` |         |
| maxy: outside the world | (a)   | handle  | 1048825 | `rect: 000001F98054B5B0` |         |
| maxy: 2147483647        | (a)   | handle  | 1048826 | `rect: 000001F980991DB0` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, minx: 0, minx: negative, minx: outside the world, minx: 2147483647, miny: 0, miny: negative, miny: outside the world, miny: 2147483647, maxx: 0, maxx: negative, maxx: outside the world, maxx: 2147483647, maxy: 0, maxy: negative, maxy: outside the world, maxy: 2147483647) on 3.0.0.24268; evidence, not proof.

### `RectFromLoc`

| Case                  | Group | Outcome | Id      | Type                     | Message |
| --------------------- | ----- | ------- | ------- | ------------------------ | ------- |
| typical arguments     | (a)   | handle  | 1048827 | `rect: 000001F980557500` |         |
| min: removed location | (b)   | nil     |         |                          |         |
| max: removed location | (b)   | nil     |         |                          |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 2 cases of the nullability sweep (min: removed location, max: removed location) on 3.0.0.24268.

### `CreateRegion`

| Case     | Group | Outcome | Id      | Type                       | Message |
| -------- | ----- | ------- | ------- | -------------------------- | ------- |
| one call | (a)   | handle  | 1048828 | `region: 000001F980983EA0` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `Location`

| Case                 | Group | Outcome | Id      | Type                         | Message |
| -------------------- | ----- | ------- | ------- | ---------------------------- | ------- |
| typical arguments    | (a)   | handle  | 1048829 | `location: 000001F980543E90` |         |
| x: 0                 | (a)   | handle  | 1048830 | `location: 000001F9805514A0` |         |
| x: negative          | (a)   | handle  | 1048831 | `location: 000001F8AA9FE0B0` |         |
| x: outside the world | (a)   | handle  | 1048832 | `location: 000001F8AAA03870` |         |
| x: 2147483647        | (a)   | handle  | 1048833 | `location: 000001F8AAA0C700` |         |
| y: 0                 | (a)   | handle  | 1048834 | `location: 000001F8AAA11E30` |         |
| y: negative          | (a)   | handle  | 1048835 | `location: 000001F8AAA0FD40` |         |
| y: outside the world | (a)   | handle  | 1048836 | `location: 000001F8AAA08320` |         |
| y: 2147483647        | (a)   | handle  | 1048837 | `location: 000001F8AA9FDDF0` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, x: 0, x: negative, x: outside the world, x: 2147483647, y: 0, y: negative, y: outside the world, y: 2147483647) on 3.0.0.24268; evidence, not proof.

### `CreateTrigger`

| Case     | Group | Outcome | Id      | Type                        | Message |
| -------- | ----- | ------- | ------- | --------------------------- | ------- |
| one call | (a)   | handle  | 1048838 | `trigger: 000001F8AAA13830` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `And`

| Case                          | Group | Outcome | Id      | Type                         | Message |
| ----------------------------- | ----- | ------- | ------- | ---------------------------- | ------- |
| typical arguments             | (a)   | handle  | 1048839 | `boolexpr: 000001F8AAA027C0` |         |
| operandA: destroyed condition | (b)   | handle  | 1048903 | `boolexpr: 000001F98048ABC0` |         |
| operandA: destroyed filter    | (b)   | handle  | 1048904 | `boolexpr: 000001F8AA942870` |         |
| operandA: destroyed boolexpr  | (b)   | handle  | 1048905 | `boolexpr: 000001F8AA947E20` |         |
| operandB: destroyed condition | (b)   | handle  | 1048906 | `boolexpr: 000001F8AA94D740` |         |
| operandB: destroyed filter    | (b)   | handle  | 1048907 | `boolexpr: 000001F8AA953010` |         |
| operandB: destroyed boolexpr  | (b)   | handle  | 1048908 | `boolexpr: 000001F8AA958AE0` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, operandA: destroyed condition, operandA: destroyed filter, operandA: destroyed boolexpr, operandB: destroyed condition, operandB: destroyed filter, operandB: destroyed boolexpr) on 3.0.0.24268; evidence, not proof.

### `Or`

| Case                          | Group | Outcome | Id      | Type                         | Message |
| ----------------------------- | ----- | ------- | ------- | ---------------------------- | ------- |
| typical arguments             | (a)   | handle  | 1048840 | `boolexpr: 000001F8AAA0EDF0` |         |
| operandA: destroyed condition | (b)   | handle  | 1048909 | `boolexpr: 000001F8AA95E900` |         |
| operandA: destroyed filter    | (b)   | handle  | 1048910 | `boolexpr: 000001F8AA9646F0` |         |
| operandA: destroyed boolexpr  | (b)   | handle  | 1048911 | `boolexpr: 000001F8AA96A5A0` |         |
| operandB: destroyed condition | (b)   | handle  | 1048912 | `boolexpr: 000001F8AA970740` |         |
| operandB: destroyed filter    | (b)   | handle  | 1048913 | `boolexpr: 000001F8AA976A70` |         |
| operandB: destroyed boolexpr  | (b)   | handle  | 1048914 | `boolexpr: 000001F8AA97CE40` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, operandA: destroyed condition, operandA: destroyed filter, operandA: destroyed boolexpr, operandB: destroyed condition, operandB: destroyed filter, operandB: destroyed boolexpr) on 3.0.0.24268; evidence, not proof.

### `Not`

| Case                         | Group | Outcome | Id      | Type                         | Message |
| ---------------------------- | ----- | ------- | ------- | ---------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1048841 | `boolexpr: 000001F8AAA06630` |         |
| operand: destroyed condition | (b)   | handle  | 1048915 | `boolexpr: 000001F8AA983810` |         |
| operand: destroyed filter    | (b)   | handle  | 1048916 | `boolexpr: 000001F8AA98A120` |         |
| operand: destroyed boolexpr  | (b)   | handle  | 1048917 | `boolexpr: 000001F8AA986550` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, operand: destroyed condition, operand: destroyed filter, operand: destroyed boolexpr) on 3.0.0.24268; evidence, not proof.

### `Condition`

| Case              | Group | Outcome | Id      | Type                              | Message |
| ----------------- | ----- | ------- | ------- | --------------------------------- | ------- |
| typical arguments | (a)   | handle  | 1048842 | `conditionfunc: 000001F8AAA077E0` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments) on 3.0.0.24268; evidence, not proof.

### `Filter`

| Case              | Group | Outcome | Id      | Type                           | Message |
| ----------------- | ----- | ------- | ------- | ------------------------------ | ------- |
| typical arguments | (a)   | handle  | 1048843 | `filterfunc: 000001F98090E8A0` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments) on 3.0.0.24268; evidence, not proof.

### `TriggerAddCondition`

| Case                            | Group | Outcome | Id      | Type                                 | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------------------ | ------- |
| typical arguments               | (a)   | handle  | 1048844 | `triggercondition: 000001F9809145D0` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                                      |         |
| condition: destroyed condition  | (b)   | handle  | 1048918 | `triggercondition: 000001F8AA95B950` |         |
| condition: destroyed filter     | (b)   | handle  | 1048919 | `triggercondition: 000001F8AA978E30` |         |
| condition: destroyed boolexpr   | (b)   | handle  | 1048920 | `triggercondition: 000001F8AA97EF60` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.0.24268.

### `TriggerAddAction`

| Case                            | Group | Outcome | Id      | Type                              | Message |
| ------------------------------- | ----- | ------- | ------- | --------------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048845 | `triggeraction: 000001F980919E80` |         |
| whichTrigger: destroyed trigger | (b)   | handle  | 0       | `triggeraction: 000001F8AA979410` |         |

- Family: `constructor`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichTrigger: destroyed trigger) on 3.0.0.24268; evidence, not proof. The handle had id 0 in a case (whichTrigger: destroyed trigger).

### `CreateFogModifierRect`

| Case                | Group | Outcome | Id      | Type                            | Message |
| ------------------- | ----- | ------- | ------- | ------------------------------- | ------- |
| typical arguments   | (a)   | handle  | 1048846 | `fogmodifier: 000001F98091F9D0` |         |
| where: removed rect | (b)   | nil     |         |                                 |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (where: removed rect) on 3.0.0.24268.

### `CreateFogModifierRadius`

| Case                       | Group | Outcome | Id      | Type                            | Message                            |
| -------------------------- | ----- | ------- | ------- | ------------------------------- | ---------------------------------- |
| typical arguments          | (a)   | handle  | 1048847 | `fogmodifier: 000001F980925110` |                                    |
| centerx: 0                 | (a)   | handle  | 1048848 | `fogmodifier: 000001F98092A920` |                                    |
| centerx: negative          | (a)   | handle  | 1048849 | `fogmodifier: 000001F980930170` |                                    |
| centerx: outside the world | (a)   | handle  | 1048850 | `fogmodifier: 000001F980936160` |                                    |
| centerx: 2147483647        | (a)   | handle  | 1048851 | `fogmodifier: 000001F98093C540` |                                    |
| centerY: 0                 | (a)   | handle  | 1048852 | `fogmodifier: 000001F980942290` |                                    |
| centerY: negative          | (a)   | handle  | 1048853 | `fogmodifier: 000001F980948C50` |                                    |
| centerY: outside the world | (a)   | handle  | 1048854 | `fogmodifier: 000001F980922FB0` |                                    |
| centerY: 2147483647        | (a)   | handle  | 1048855 | `fogmodifier: 000001F98093BE40` |                                    |
| radius: 0                  | (a)   | handle  | 1048856 | `fogmodifier: 000001F9809184B0` |                                    |
| radius: negative           | (a)   | handle  | 1048857 | `fogmodifier: 000001F980940080` |                                    |
| radius: outside the world  | (a)   | handle  | 1048858 | `fogmodifier: 000001F98090D020` |                                    |
| radius: 2147483647         | (a)   | crashed |         |                                 | skipped: crashed in an earlier run |

- Family: `constructor`
- Verdict: unsafe
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Crashed the game in a case of the nullability sweep (radius: 2147483647) on 3.0.0.24268. Returned a handle in every other case (typical arguments, centerx: 0, centerx: negative, centerx: outside the world, centerx: 2147483647, centerY: 0, centerY: negative, centerY: outside the world, centerY: 2147483647, radius: 0, radius: negative, radius: outside the world).

### `CreateFogModifierRadiusLoc`

| Case                      | Group | Outcome | Id      | Type                            | Message                            |
| ------------------------- | ----- | ------- | ------- | ------------------------------- | ---------------------------------- |
| typical arguments         | (a)   | handle  | 1048859 | `fogmodifier: 000001F98091DF60` |                                    |
| radius: 0                 | (a)   | handle  | 1048860 | `fogmodifier: 000001F9809124C0` |                                    |
| radius: negative          | (a)   | handle  | 1048861 | `fogmodifier: 000001F980919180` |                                    |
| radius: outside the world | (a)   | handle  | 1048862 | `fogmodifier: 000001F980915C10` |                                    |
| radius: 2147483647        | (a)   | crashed |         |                                 | skipped: crashed in an earlier run |
| center: removed location  | (b)   | nil     |         |                                 |                                    |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Crashed the game in a case of the nullability sweep (radius: 2147483647) on 3.0.0.24268. Returned nothing in a case of the nullability sweep (center: removed location) on 3.0.0.24268.

### `DialogCreate`

| Case     | Group | Outcome | Id      | Type                       | Message |
| -------- | ----- | ------- | ------- | -------------------------- | ------- |
| one call | (a)   | handle  | 1048863 | `dialog: 000001F98090FF30` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `DialogAddButton`

| Case                          | Group | Outcome | Id      | Type                       | Message |
| ----------------------------- | ----- | ------- | ------- | -------------------------- | ------- |
| typical arguments             | (a)   | handle  | 1048864 | `button: 000001F980932E90` |         |
| buttonText: empty string      | (a)   | handle  | 1048865 | `button: 000001F98092DD50` |         |
| buttonText: unknown name      | (a)   | handle  | 1048866 | `button: 000001F980933CE0` |         |
| hotkey: negative              | (a)   | handle  | 1048867 | `button: 000001F98093A240` |         |
| hotkey: outside the world     | (a)   | handle  | 1048868 | `button: 000001F98092F640` |         |
| hotkey: 2147483647            | (a)   | handle  | 1048869 | `button: 000001F980945810` |         |
| whichDialog: destroyed dialog | (b)   | nil     |         |                            |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichDialog: destroyed dialog) on 3.0.0.24268.

### `DialogAddQuitButton`

| Case                          | Group | Outcome | Id      | Type                       | Message |
| ----------------------------- | ----- | ------- | ------- | -------------------------- | ------- |
| typical arguments             | (a)   | handle  | 1048870 | `button: 000001F98092F600` |         |
| buttonText: empty string      | (a)   | handle  | 1048871 | `button: 000001F98093EEF0` |         |
| buttonText: unknown name      | (a)   | handle  | 1048872 | `button: 000001F8AB20D9B0` |         |
| hotkey: negative              | (a)   | handle  | 1048873 | `button: 000001F8AB211070` |         |
| hotkey: outside the world     | (a)   | handle  | 1048874 | `button: 000001F8AB2145D0` |         |
| hotkey: 2147483647            | (a)   | handle  | 1048875 | `button: 000001F8AB2184A0` |         |
| whichDialog: destroyed dialog | (b)   | nil     |         |                            |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichDialog: destroyed dialog) on 3.0.0.24268.

### `InitGameCache`

| Case                       | Group | Outcome | Id      | Type                          | Message |
| -------------------------- | ----- | ------- | ------- | ----------------------------- | ------- |
| typical arguments          | (a)   | handle  | 1048876 | `gamecache: 000001F8AB21D740` |         |
| campaignFile: empty string | (a)   | nil     |         |                               |         |
| campaignFile: unknown name | (a)   | handle  | 1048877 | `gamecache: 000001F8AB225520` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (campaignFile: empty string) on 3.0.0.24268.

### `InitHashtable`

| Case     | Group | Outcome | Id      | Type                          | Message |
| -------- | ----- | ------- | ------- | ----------------------------- | ------- |
| one call | (a)   | handle  | 1048878 | `hashtable: 000001F8AB213A90` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `CreateQuest`

| Case     | Group | Outcome | Id      | Type                      | Message |
| -------- | ----- | ------- | ------- | ------------------------- | ------- |
| one call | (a)   | handle  | 1048879 | `quest: 000001F8AB225AF0` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `QuestCreateItem`

| Case                                 | Group | Outcome | Id      | Type                          | Message |
| ------------------------------------ | ----- | ------- | ------- | ----------------------------- | ------- |
| typical arguments                    | (a)   | handle  | 1048880 | `questitem: 000001F8AB21B7A0` |         |
| whichQuest: quest after DestroyQuest | (b)   | handle  | 1048921 | `questitem: 000001F8AA96C890` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichQuest: quest after DestroyQuest) on 3.0.0.24268; evidence, not proof.

### `CreateDefeatCondition`

| Case     | Group | Outcome | Id      | Type                                | Message |
| -------- | ----- | ------- | ------- | ----------------------------------- | ------- |
| one call | (a)   | handle  | 1048881 | `defeatcondition: 000001F8AB21F9A0` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `CreateTimerDialog`

| Case               | Group | Outcome | Id      | Type                            | Message |
| ------------------ | ----- | ------- | ------- | ------------------------------- | ------- |
| typical arguments  | (a)   | handle  | 1048882 | `timerdialog: 000001F8AB2168A0` |         |
| t: destroyed timer | (b)   | handle  | 1048922 | `timerdialog: 000001F8AA960DC0` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, t: destroyed timer) on 3.0.0.24268; evidence, not proof.

### `CreateLeaderboard`

| Case     | Group | Outcome | Id      | Type                            | Message |
| -------- | ----- | ------- | ------- | ------------------------------- | ------- |
| one call | (a)   | handle  | 1048883 | `leaderboard: 000001F8AB20B610` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `CreateMultiboard`

| Case     | Group | Outcome | Id      | Type                           | Message |
| -------- | ----- | ------- | ------- | ------------------------------ | ------- |
| one call | (a)   | handle  | 1048884 | `multiboard: 000001F8AB21AB30` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `CreateCameraSetup`

| Case     | Group | Outcome | Id      | Type                            | Message |
| -------- | ----- | ------- | ------- | ------------------------------- | ------- |
| one call | (a)   | handle  | 1048885 | `camerasetup: 000001F8AB21A790` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `BlzCreateFrame`

| Case                             | Group | Outcome | Id      | Type                            | Message |
| -------------------------------- | ----- | ------- | ------- | ------------------------------- | ------- |
| typical arguments                | (a)   | handle  | 1048886 | `framehandle: 000001F980466F50` |         |
| name: empty string               | (a)   | nil     |         |                                 |         |
| name: unknown name               | (a)   | nil     |         |                                 |         |
| priority: negative               | (a)   | handle  | 1048887 | `framehandle: 000001F980476B30` |         |
| priority: outside the world      | (a)   | handle  | 1048888 | `framehandle: 000001F98047C570` |         |
| priority: 2147483647             | (a)   | handle  | 1048889 | `framehandle: 000001F980482170` |         |
| createContext: negative          | (a)   | handle  | 1048890 | `framehandle: 000001F980487FD0` |         |
| createContext: outside the world | (a)   | handle  | 1048891 | `framehandle: 000001F98048DDF0` |         |
| createContext: 2147483647        | (a)   | handle  | 1048892 | `framehandle: 000001F980493FF0` |         |
| owner: destroyed frame           | (b)   | nil     |         |                                 |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 3 cases of the nullability sweep (name: empty string, name: unknown name, owner: destroyed frame) on 3.0.0.24268.

### `BlzCreateSimpleFrame`

| Case                             | Group | Outcome | Id      | Type                            | Message |
| -------------------------------- | ----- | ------- | ------- | ------------------------------- | ------- |
| typical arguments                | (a)   | handle  | 1048893 | `framehandle: 000001F980499F50` |         |
| name: empty string               | (a)   | nil     |         |                                 |         |
| name: unknown name               | (a)   | nil     |         |                                 |         |
| createContext: negative          | (a)   | handle  | 1048894 | `framehandle: 000001F9804ABA80` |         |
| createContext: outside the world | (a)   | handle  | 1048895 | `framehandle: 000001F980463340` |         |
| createContext: 2147483647        | (a)   | handle  | 1048896 | `framehandle: 000001F98048F960` |         |
| owner: destroyed frame           | (b)   | handle  | 1048923 | `framehandle: 000001F8AA93DAD0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 2 cases of the nullability sweep (name: empty string, name: unknown name) on 3.0.0.24268.

### `CreateCommandButtonEffect`

| Case                       | Group | Outcome | Id      | Type                                    | Message |
| -------------------------- | ----- | ------- | ------- | --------------------------------------- | ------- |
| typical arguments          | (a)   | handle  | 1048897 | `commandbuttoneffect: 000001F9804759D0` |         |
| abilityId: unknown rawcode | (a)   | handle  | 1048898 | `commandbuttoneffect: 000001F98046E570` |         |
| order: empty string        | (a)   | handle  | 0       | `commandbuttoneffect: 000001F980486D00` |         |
| order: unknown name        | (a)   | handle  | 0       | `commandbuttoneffect: 000001F980486D00` |         |

- Family: `constructor`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, abilityId: unknown rawcode, order: empty string, order: unknown name) on 3.0.0.24268; evidence, not proof. The handle had id 0 in 2 cases (order: empty string, order: unknown name).

### `CreateUpgradeCommandButtonEffect`

| Case                          | Group | Outcome | Id      | Type                                    | Message |
| ----------------------------- | ----- | ------- | ------- | --------------------------------------- | ------- |
| typical arguments             | (a)   | handle  | 1048899 | `commandbuttoneffect: 000001F98048D990` |         |
| whichUprgade: unknown rawcode | (a)   | handle  | 1048900 | `commandbuttoneffect: 000001F980493020` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichUprgade: unknown rawcode) on 3.0.0.24268; evidence, not proof.

### `CreateLearnCommandButtonEffect`

| Case                       | Group | Outcome | Id      | Type                                    | Message |
| -------------------------- | ----- | ------- | ------- | --------------------------------------- | ------- |
| typical arguments          | (a)   | handle  | 1048901 | `commandbuttoneffect: 000001F9804A5020` |         |
| abilityId: unknown rawcode | (a)   | handle  | 1048902 | `commandbuttoneffect: 000001F980493230` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, abilityId: unknown rawcode) on 3.0.0.24268; evidence, not proof.

## `nullability-constructors-world`

- Probe: `nullability-constructors-world`
- Patch: 3.0.0.24268
- Client: 3.0.0.24268
- Date: 2026-10-04
- Run: `3396d838-f905-4949-9b57-c73e310bfcb3`

### `CreateItem`

| Case                    | Group | Outcome | Id      | Type                     | Message |
| ----------------------- | ----- | ------- | ------- | ------------------------ | ------- |
| typical arguments       | (a)   | handle  | 1048812 | `item: 000001EC8AD01C90` |         |
| itemid: unknown rawcode | (a)   | nil     |         |                          |         |
| x: 0                    | (a)   | handle  | 1048813 | `item: 000001EC8AC5A800` |         |
| x: negative             | (a)   | handle  | 1048814 | `item: 000001EC8AC62080` |         |
| x: outside the world    | (a)   | handle  | 1048815 | `item: 000001EC8AC7BA00` |         |
| x: 2147483647           | (a)   | handle  | 1048816 | `item: 000001EC8AC63910` |         |
| y: 0                    | (a)   | handle  | 1048817 | `item: 000001EC8A4CF910` |         |
| y: negative             | (a)   | handle  | 1048818 | `item: 000001EC8AF72080` |         |
| y: outside the world    | (a)   | handle  | 1048819 | `item: 000001EC8ABC8B00` |         |
| y: 2147483647           | (a)   | handle  | 1048820 | `item: 000001EC8AF9CF60` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (itemid: unknown rawcode) on 3.0.0.24268.

### `CreateUnit`

| Case                    | Group | Outcome | Id      | Type                     | Message |
| ----------------------- | ----- | ------- | ------- | ------------------------ | ------- |
| typical arguments       | (a)   | handle  | 1048821 | `unit: 000001EC8AC845A0` |         |
| unitid: unknown rawcode | (a)   | nil     |         |                          |         |
| x: 0                    | (a)   | handle  | 1048822 | `unit: 000001EC8ABC9D80` |         |
| x: negative             | (a)   | handle  | 1048823 | `unit: 000001EC8AC3BA50` |         |
| x: outside the world    | (a)   | handle  | 1048824 | `unit: 000001EC8AC3E420` |         |
| x: 2147483647           | (a)   | handle  | 1048825 | `unit: 000001EC8AC6E440` |         |
| y: 0                    | (a)   | handle  | 1048826 | `unit: 000001EC8AC40910` |         |
| y: negative             | (a)   | handle  | 1048827 | `unit: 000001EC8AC92570` |         |
| y: outside the world    | (a)   | handle  | 1048828 | `unit: 000001EC8AF74590` |         |
| y: 2147483647           | (a)   | handle  | 1048829 | `unit: 000001EC8AC1A740` |         |
| face: 0                 | (a)   | handle  | 1048830 | `unit: 000001EC8ABC8700` |         |
| face: negative          | (a)   | handle  | 1048831 | `unit: 000001EC8AC72690` |         |
| face: outside the world | (a)   | handle  | 1048832 | `unit: 000001EC8ABA7040` |         |
| face: 2147483647        | (a)   | handle  | 1048833 | `unit: 000001EC8ABD4110` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unitid: unknown rawcode) on 3.0.0.24268.

### `CreateUnitByName`

| Case                    | Group | Outcome | Id      | Type                     | Message |
| ----------------------- | ----- | ------- | ------- | ------------------------ | ------- |
| typical arguments       | (a)   | handle  | 1048834 | `unit: 000001EC8A523DF0` |         |
| unitname: empty string  | (a)   | nil     |         |                          |         |
| unitname: unknown name  | (a)   | nil     |         |                          |         |
| x: 0                    | (a)   | handle  | 1048835 | `unit: 000001EC8AB08DB0` |         |
| x: negative             | (a)   | handle  | 1048836 | `unit: 000001EC8AAFAB30` |         |
| x: outside the world    | (a)   | handle  | 1048837 | `unit: 000001EC8AAE4440` |         |
| x: 2147483647           | (a)   | handle  | 1048838 | `unit: 000001EC8AAC0100` |         |
| y: 0                    | (a)   | handle  | 1048839 | `unit: 000001EC8AAA3E00` |         |
| y: negative             | (a)   | handle  | 1048840 | `unit: 000001EC8AA9B7E0` |         |
| y: outside the world    | (a)   | handle  | 1048841 | `unit: 000001EC8AC15310` |         |
| y: 2147483647           | (a)   | handle  | 1048842 | `unit: 000001EC8AB97E20` |         |
| face: 0                 | (a)   | handle  | 1048843 | `unit: 000001EC8A67D2E0` |         |
| face: negative          | (a)   | handle  | 1048844 | `unit: 000001EC8A98D970` |         |
| face: outside the world | (a)   | handle  | 1048845 | `unit: 000001EC8A97BF00` |         |
| face: 2147483647        | (a)   | handle  | 1048846 | `unit: 000001EC8AAB72C0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 2 cases of the nullability sweep (unitname: empty string, unitname: unknown name) on 3.0.0.24268.

### `CreateUnitAtLoc`

| Case                            | Group | Outcome | Id      | Type                     | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------ | ------- |
| typical arguments               | (a)   | handle  | 1048847 | `unit: 000001EBDF9DB930` |         |
| unitid: unknown rawcode         | (a)   | nil     |         |                          |         |
| face: 0                         | (a)   | handle  | 1048848 | `unit: 000001EC8A990310` |         |
| face: negative                  | (a)   | handle  | 1048849 | `unit: 000001EC8ABB16D0` |         |
| face: outside the world         | (a)   | handle  | 1048850 | `unit: 000001EC8AB951A0` |         |
| face: 2147483647                | (a)   | handle  | 1048851 | `unit: 000001EC8A3D8900` |         |
| whichLocation: removed location | (b)   | nil     |         |                          |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 2 cases of the nullability sweep (unitid: unknown rawcode, whichLocation: removed location) on 3.0.0.24268.

### `CreateUnitAtLocByName`

| Case                            | Group | Outcome | Id      | Type                     | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------ | ------- |
| typical arguments               | (a)   | handle  | 1048852 | `unit: 000001EC8ABD7650` |         |
| unitname: empty string          | (a)   | nil     |         |                          |         |
| unitname: unknown name          | (a)   | nil     |         |                          |         |
| face: 0                         | (a)   | handle  | 1048853 | `unit: 000001EC8AB2C7D0` |         |
| face: negative                  | (a)   | handle  | 1048854 | `unit: 000001EC8A5271C0` |         |
| face: outside the world         | (a)   | handle  | 1048855 | `unit: 000001EC8AC11A80` |         |
| face: 2147483647                | (a)   | handle  | 1048856 | `unit: 000001EC8AADE070` |         |
| whichLocation: removed location | (b)   | nil     |         |                          |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 3 cases of the nullability sweep (unitname: empty string, unitname: unknown name, whichLocation: removed location) on 3.0.0.24268.

### `CreateCorpse`

| Case                    | Group | Outcome | Id      | Type                     | Message |
| ----------------------- | ----- | ------- | ------- | ------------------------ | ------- |
| typical arguments       | (a)   | handle  | 1048857 | `unit: 000001EC8AC10550` |         |
| unitid: unknown rawcode | (a)   | nil     |         |                          |         |
| x: 0                    | (a)   | handle  | 1048858 | `unit: 000001EC8AC1BC10` |         |
| x: negative             | (a)   | handle  | 1048859 | `unit: 000001EC8AAB9E30` |         |
| x: outside the world    | (a)   | handle  | 1048860 | `unit: 000001EC8AACA3E0` |         |
| x: 2147483647           | (a)   | handle  | 1048861 | `unit: 000001EC8AB07090` |         |
| y: 0                    | (a)   | handle  | 1048862 | `unit: 000001EC8AA873A0` |         |
| y: negative             | (a)   | handle  | 1048863 | `unit: 000001EC8AAEA300` |         |
| y: outside the world    | (a)   | handle  | 1048864 | `unit: 000001EC8AA9F820` |         |
| y: 2147483647           | (a)   | handle  | 1048865 | `unit: 000001EC8AAF6270` |         |
| face: 0                 | (a)   | handle  | 1048866 | `unit: 000001EC8ABEF690` |         |
| face: negative          | (a)   | handle  | 1048867 | `unit: 000001EC8ABFF890` |         |
| face: outside the world | (a)   | handle  | 1048868 | `unit: 000001EC8ABF1EE0` |         |
| face: 2147483647        | (a)   | handle  | 1048869 | `unit: 000001EC8ABE4300` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unitid: unknown rawcode) on 3.0.0.24268.

### `UnitAddItemById`

| Case                              | Group | Outcome | Id      | Type                     | Message |
| --------------------------------- | ----- | ------- | ------- | ------------------------ | ------- |
| typical arguments                 | (a)   | handle  | 1048870 | `item: 000001EC8ABD8F90` |         |
| itemId: unknown rawcode           | (a)   | nil     |         |                          |         |
| whichUnit: unit with no inventory | (a)   | nil     |         |                          |         |
| whichUnit: dead hero              | (b)   | nil     |         |                          |         |
| whichUnit: removed hero           | (b)   | handle  | 1049025 | `item: 000001EC8B839490` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 3 cases of the nullability sweep (itemId: unknown rawcode, whichUnit: unit with no inventory, whichUnit: dead hero) on 3.0.0.24268.

### `CreateUnitPool`

| Case     | Group | Outcome | Id      | Type                         | Message |
| -------- | ----- | ------- | ------- | ---------------------------- | ------- |
| one call | (a)   | handle  | 1048871 | `unitpool: 000001EC8ABC4C80` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `PlaceRandomUnit`

| Case                           | Group | Outcome | Id      | Type                     | Message |
| ------------------------------ | ----- | ------- | ------- | ------------------------ | ------- |
| typical arguments              | (a)   | handle  | 1048872 | `unit: 000001EC8ABB4810` |         |
| x: 0                           | (a)   | handle  | 1048873 | `unit: 000001EC8ABAAAB0` |         |
| x: negative                    | (a)   | handle  | 1048874 | `unit: 000001EC8AB9D4F0` |         |
| x: outside the world           | (a)   | handle  | 1048875 | `unit: 000001EC8AB91DE0` |         |
| x: 2147483647                  | (a)   | handle  | 1048876 | `unit: 000001EC8AB301E0` |         |
| y: 0                           | (a)   | handle  | 1048877 | `unit: 000001EC8AB20100` |         |
| y: negative                    | (a)   | handle  | 1048878 | `unit: 000001EC8AB130C0` |         |
| y: outside the world           | (a)   | handle  | 1048879 | `unit: 000001EC8AB072B0` |         |
| y: 2147483647                  | (a)   | handle  | 1048880 | `unit: 000001EC8AAFFEE0` |         |
| facing: 0                      | (a)   | handle  | 1048881 | `unit: 000001EC8AAF7440` |         |
| facing: negative               | (a)   | handle  | 1048882 | `unit: 000001EC8AAE8060` |         |
| facing: outside the world      | (a)   | handle  | 1048883 | `unit: 000001EC8AADDD60` |         |
| facing: 2147483647             | (a)   | handle  | 1048884 | `unit: 000001EC8B20C9D0` |         |
| whichPool: empty unit pool     | (a)   | nil     |         |                          |         |
| whichPool: destroyed unit pool | (b)   | nil     |         |                          |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 2 cases of the nullability sweep (whichPool: empty unit pool, whichPool: destroyed unit pool) on 3.0.0.24268.

### `CreateItemPool`

| Case     | Group | Outcome | Id      | Type                         | Message |
| -------- | ----- | ------- | ------- | ---------------------------- | ------- |
| one call | (a)   | handle  | 1048885 | `itempool: 000001EC8AAC5B40` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `PlaceRandomItem`

| Case                               | Group | Outcome | Id      | Type                     | Message |
| ---------------------------------- | ----- | ------- | ------- | ------------------------ | ------- |
| typical arguments                  | (a)   | handle  | 1048886 | `item: 000001EC8AAC0820` |         |
| x: 0                               | (a)   | handle  | 1048887 | `item: 000001EC8AAB7870` |         |
| x: negative                        | (a)   | handle  | 1048888 | `item: 000001EC8AAB11E0` |         |
| x: outside the world               | (a)   | handle  | 1048889 | `item: 000001EC8AAA9730` |         |
| x: 2147483647                      | (a)   | handle  | 1048890 | `item: 000001EC8AAA30F0` |         |
| y: 0                               | (a)   | handle  | 1048891 | `item: 000001EC8AA9B2D0` |         |
| y: negative                        | (a)   | handle  | 1048892 | `item: 000001EC8AA924B0` |         |
| y: outside the world               | (a)   | handle  | 1048893 | `item: 000001EC8AAF5340` |         |
| y: 2147483647                      | (a)   | handle  | 1048894 | `item: 000001EC8AA86E10` |         |
| whichItemPool: empty item pool     | (a)   | nil     |         |                          |         |
| whichItemPool: destroyed item pool | (b)   | nil     |         |                          |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 2 cases of the nullability sweep (whichItemPool: empty item pool, whichItemPool: destroyed item pool) on 3.0.0.24268.

### `CreateMinimapIconOnUnit`

| Case                     | Group | Outcome | Id  | Type                            | Message |
| ------------------------ | ----- | ------- | --- | ------------------------------- | ------- |
| typical arguments        | (a)   | handle  | 1   | `minimapicon: 000001EC8ACA76E0` |         |
| red: 0                   | (a)   | handle  | 2   | `minimapicon: 000001EC8AC9BEC0` |         |
| red: negative            | (a)   | handle  | 3   | `minimapicon: 000001EC8ABC4180` |         |
| red: outside the world   | (a)   | handle  | 4   | `minimapicon: 000001EC8A67E010` |         |
| red: 2147483647          | (a)   | handle  | 5   | `minimapicon: 000001EC8A681B90` |         |
| green: 0                 | (a)   | handle  | 6   | `minimapicon: 000001EC8AA95D70` |         |
| green: negative          | (a)   | handle  | 7   | `minimapicon: 000001EC8AA91AD0` |         |
| green: outside the world | (a)   | handle  | 8   | `minimapicon: 000001EC8AA9C5F0` |         |
| green: 2147483647        | (a)   | handle  | 9   | `minimapicon: 000001EC8AF732D0` |         |
| blue: 0                  | (a)   | handle  | 10  | `minimapicon: 000001EC8A4D2E50` |         |
| blue: negative           | (a)   | handle  | 11  | `minimapicon: 000001EC8AB2B2E0` |         |
| blue: outside the world  | (a)   | handle  | 12  | `minimapicon: 000001EC8B192A30` |         |
| blue: 2147483647         | (a)   | handle  | 13  | `minimapicon: 000001EC8AC254A0` |         |
| pingPath: empty string   | (a)   | handle  | 14  | `minimapicon: 000001EC8AC01EB0` |         |
| pingPath: unknown name   | (a)   | handle  | 15  | `minimapicon: 000001EC8AC03EA0` |         |
| whichUnit: dead unit     | (b)   | handle  | 54  | `minimapicon: 000001EC8B855520` |         |
| whichUnit: removed unit  | (b)   | handle  | 55  | `minimapicon: 000001EC8B851F60` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, red: 0, red: negative, red: outside the world, red: 2147483647, green: 0, green: negative, green: outside the world, green: 2147483647, blue: 0, blue: negative, blue: outside the world, blue: 2147483647, pingPath: empty string, pingPath: unknown name, whichUnit: dead unit, whichUnit: removed unit) on 3.0.0.24268; evidence, not proof.

### `CreateMinimapIconAtLoc`

| Case                     | Group | Outcome | Id  | Type                            | Message |
| ------------------------ | ----- | ------- | --- | ------------------------------- | ------- |
| typical arguments        | (a)   | handle  | 16  | `minimapicon: 000001EC8ABEC920` |         |
| red: 0                   | (a)   | handle  | 17  | `minimapicon: 000001EC8ABD7C50` |         |
| red: negative            | (a)   | handle  | 18  | `minimapicon: 000001EC8ABE0C80` |         |
| red: outside the world   | (a)   | handle  | 19  | `minimapicon: 000001EC8ABBD310` |         |
| red: 2147483647          | (a)   | handle  | 20  | `minimapicon: 000001EC8ABBABB0` |         |
| green: 0                 | (a)   | handle  | 21  | `minimapicon: 000001EC8AB99790` |         |
| green: negative          | (a)   | handle  | 22  | `minimapicon: 000001EC8A525F10` |         |
| green: outside the world | (a)   | handle  | 23  | `minimapicon: 000001EC8AB33800` |         |
| green: 2147483647        | (a)   | handle  | 24  | `minimapicon: 000001EC8AB261B0` |         |
| blue: 0                  | (a)   | handle  | 25  | `minimapicon: 000001EC8AB1E540` |         |
| blue: negative           | (a)   | handle  | 26  | `minimapicon: 000001EC8AAF37B0` |         |
| blue: outside the world  | (a)   | handle  | 27  | `minimapicon: 000001EC8AACC410` |         |
| blue: 2147483647         | (a)   | handle  | 28  | `minimapicon: 000001EC8AAABA20` |         |
| pingPath: empty string   | (a)   | handle  | 29  | `minimapicon: 000001EC8A689E50` |         |
| pingPath: unknown name   | (a)   | handle  | 30  | `minimapicon: 000001EC8A67D880` |         |
| where: removed location  | (b)   | handle  | 0   | `minimapicon: 000001EC8B83B4A0` |         |

- Family: `constructor`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, red: 0, red: negative, red: outside the world, red: 2147483647, green: 0, green: negative, green: outside the world, green: 2147483647, blue: 0, blue: negative, blue: outside the world, blue: 2147483647, pingPath: empty string, pingPath: unknown name, where: removed location) on 3.0.0.24268; evidence, not proof. The handle had id 0 in a case (where: removed location).

### `CreateMinimapIcon`

| Case                     | Group | Outcome | Id  | Type                            | Message |
| ------------------------ | ----- | ------- | --- | ------------------------------- | ------- |
| typical arguments        | (a)   | handle  | 31  | `minimapicon: 000001EC8ABD9AC0` |         |
| x: 0                     | (a)   | handle  | 32  | `minimapicon: 000001EC8AF39600` |         |
| x: negative              | (a)   | handle  | 33  | `minimapicon: 000001EC8AEEA7E0` |         |
| x: outside the world     | (a)   | handle  | 34  | `minimapicon: 000001EC8B16F500` |         |
| x: 2147483647            | (a)   | handle  | 35  | `minimapicon: 000001EC8AC27540` |         |
| y: 0                     | (a)   | handle  | 36  | `minimapicon: 000001EC8AB1B7E0` |         |
| y: negative              | (a)   | handle  | 37  | `minimapicon: 000001EC8AB94A10` |         |
| y: outside the world     | (a)   | handle  | 38  | `minimapicon: 000001EC8ACF5220` |         |
| y: 2147483647            | (a)   | handle  | 39  | `minimapicon: 000001EC8B11EE50` |         |
| red: 0                   | (a)   | handle  | 40  | `minimapicon: 000001EC8A540400` |         |
| red: negative            | (a)   | handle  | 41  | `minimapicon: 000001EC8B1102D0` |         |
| red: outside the world   | (a)   | handle  | 42  | `minimapicon: 000001EC8B1196F0` |         |
| red: 2147483647          | (a)   | handle  | 43  | `minimapicon: 000001EC8AED37C0` |         |
| green: 0                 | (a)   | handle  | 44  | `minimapicon: 000001EBC9A10AC0` |         |
| green: negative          | (a)   | handle  | 45  | `minimapicon: 000001EC8B12D550` |         |
| green: outside the world | (a)   | handle  | 46  | `minimapicon: 000001EC8B1256D0` |         |
| green: 2147483647        | (a)   | handle  | 47  | `minimapicon: 000001EC8B125D50` |         |
| blue: 0                  | (a)   | handle  | 48  | `minimapicon: 000001EC8B237410` |         |
| blue: negative           | (a)   | handle  | 49  | `minimapicon: 000001EC8B23E800` |         |
| blue: outside the world  | (a)   | handle  | 50  | `minimapicon: 000001EC8B23A3D0` |         |
| blue: 2147483647         | (a)   | handle  | 51  | `minimapicon: 000001EC8B213850` |         |
| pingPath: empty string   | (a)   | handle  | 52  | `minimapicon: 000001EC8B23D680` |         |
| pingPath: unknown name   | (a)   | handle  | 53  | `minimapicon: 000001EC8B249F80` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, x: 0, x: negative, x: outside the world, x: 2147483647, y: 0, y: negative, y: outside the world, y: 2147483647, red: 0, red: negative, red: outside the world, red: 2147483647, green: 0, green: negative, green: outside the world, green: 2147483647, blue: 0, blue: negative, blue: outside the world, blue: 2147483647, pingPath: empty string, pingPath: unknown name) on 3.0.0.24268; evidence, not proof.

### `CreateTextTag`

| Case     | Group | Outcome | Id   | Type                        | Message |
| -------- | ----- | ------- | ---- | --------------------------- | ------- |
| one call | (a)   | handle  | 9999 | `texttag: 000001EC8B2472A0` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.

### `CreateTrackable`

| Case                             | Group | Outcome | Id      | Type                          | Message |
| -------------------------------- | ----- | ------- | ------- | ----------------------------- | ------- |
| typical arguments                | (a)   | handle  | 1048895 | `trackable: 000001EC8B250A10` |         |
| trackableModelPath: empty string | (a)   | handle  | 1048896 | `trackable: 000001EC8B252CA0` |         |
| trackableModelPath: unknown name | (a)   | handle  | 1048897 | `trackable: 000001EC8B31B2E0` |         |
| x: 0                             | (a)   | handle  | 1048898 | `trackable: 000001EC8B322CC0` |         |
| x: negative                      | (a)   | handle  | 1048899 | `trackable: 000001EC8B321B70` |         |
| x: outside the world             | (a)   | handle  | 1048900 | `trackable: 000001EC8B327B90` |         |
| x: 2147483647                    | (a)   | handle  | 1048901 | `trackable: 000001EC8B324EE0` |         |
| y: 0                             | (a)   | handle  | 1048902 | `trackable: 000001EC8B32C650` |         |
| y: negative                      | (a)   | handle  | 1048903 | `trackable: 000001EC8B329B10` |         |
| y: outside the world             | (a)   | handle  | 1048904 | `trackable: 000001EC8B3313E0` |         |
| y: 2147483647                    | (a)   | handle  | 1048905 | `trackable: 000001EC8B335530` |         |
| facing: 0                        | (a)   | handle  | 1048906 | `trackable: 000001EC8B336340` |         |
| facing: negative                 | (a)   | handle  | 1048907 | `trackable: 000001EC8B333720` |         |
| facing: outside the world        | (a)   | handle  | 1048908 | `trackable: 000001EC8B33AF80` |         |
| facing: 2147483647               | (a)   | handle  | 1048909 | `trackable: 000001EC8B338170` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, trackableModelPath: empty string, trackableModelPath: unknown name, x: 0, x: negative, x: outside the world, x: 2147483647, y: 0, y: negative, y: outside the world, y: 2147483647, facing: 0, facing: negative, facing: outside the world, facing: 2147483647) on 3.0.0.24268; evidence, not proof.

### `CreateSound`

| Case                           | Group | Outcome | Id      | Type                      | Message |
| ------------------------------ | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments              | (a)   | handle  | 1048910 | `sound: 000001EC8B3406E0` |         |
| fileName: empty string         | (a)   | handle  | 1048911 | `sound: 000001EC8B33D960` |         |
| fileName: unknown name         | (a)   | handle  | 1048912 | `sound: 000001EC8B344B50` |         |
| fadeInRate: 0                  | (a)   | handle  | 1048913 | `sound: 000001EC8B3490E0` |         |
| fadeInRate: negative           | (a)   | handle  | 1048914 | `sound: 000001EC8B34A2B0` |         |
| fadeInRate: outside the world  | (a)   | handle  | 1048915 | `sound: 000001EC8B346400` |         |
| fadeInRate: 2147483647         | (a)   | handle  | 1048916 | `sound: 000001EC8B34FC10` |         |
| fadeOutRate: 0                 | (a)   | handle  | 1048917 | `sound: 000001EC8B354620` |         |
| fadeOutRate: negative          | (a)   | handle  | 1048918 | `sound: 000001EC8B355460` |         |
| fadeOutRate: outside the world | (a)   | handle  | 1048919 | `sound: 000001EC8B352030` |         |
| fadeOutRate: 2147483647        | (a)   | handle  | 1048920 | `sound: 000001EC8B35ABD0` |         |
| eaxSetting: empty string       | (a)   | handle  | 1048921 | `sound: 000001EC8B35EF80` |         |
| eaxSetting: unknown name       | (a)   | handle  | 1048922 | `sound: 000001EC8B360340` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, fileName: empty string, fileName: unknown name, fadeInRate: 0, fadeInRate: negative, fadeInRate: outside the world, fadeInRate: 2147483647, fadeOutRate: 0, fadeOutRate: negative, fadeOutRate: outside the world, fadeOutRate: 2147483647, eaxSetting: empty string, eaxSetting: unknown name) on 3.0.0.24268; evidence, not proof.

### `CreateSoundFilenameWithLabel`

| Case                           | Group | Outcome | Id      | Type                      | Message |
| ------------------------------ | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments              | (a)   | handle  | 1048923 | `sound: 000001EC8B35CCA0` |         |
| fileName: empty string         | (a)   | handle  | 1048924 | `sound: 000001EC8B3654C0` |         |
| fileName: unknown name         | (a)   | handle  | 1048925 | `sound: 000001EC8B36A4A0` |         |
| fadeInRate: 0                  | (a)   | handle  | 1048926 | `sound: 000001EC8B36B630` |         |
| fadeInRate: negative           | (a)   | handle  | 1048927 | `sound: 000001EC8B3683C0` |         |
| fadeInRate: outside the world  | (a)   | handle  | 1048928 | `sound: 000001EC8B3701B0` |         |
| fadeInRate: 2147483647         | (a)   | handle  | 1048929 | `sound: 000001EC8B374920` |         |
| fadeOutRate: 0                 | (a)   | handle  | 1048930 | `sound: 000001EC8B375FA0` |         |
| fadeOutRate: negative          | (a)   | handle  | 1048931 | `sound: 000001EC8B372690` |         |
| fadeOutRate: outside the world | (a)   | handle  | 1048932 | `sound: 000001EC8B37B4B0` |         |
| fadeOutRate: 2147483647        | (a)   | handle  | 1048933 | `sound: 000001EC8B3802C0` |         |
| SLKEntryName: empty string     | (a)   | handle  | 1048934 | `sound: 000001EC8B381140` |         |
| SLKEntryName: unknown name     | (a)   | handle  | 1048935 | `sound: 000001EC8B37D260` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, fileName: empty string, fileName: unknown name, fadeInRate: 0, fadeInRate: negative, fadeInRate: outside the world, fadeInRate: 2147483647, fadeOutRate: 0, fadeOutRate: negative, fadeOutRate: outside the world, fadeOutRate: 2147483647, SLKEntryName: empty string, SLKEntryName: unknown name) on 3.0.0.24268; evidence, not proof.

### `CreateSoundFromLabel`

| Case                           | Group | Outcome | Id      | Type                      | Message |
| ------------------------------ | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments              | (a)   | handle  | 1048936 | `sound: 000001EC8B386810` |         |
| soundLabel: empty string       | (a)   | handle  | 1048937 | `sound: 000001EC8B38B1D0` |         |
| soundLabel: unknown name       | (a)   | handle  | 1048938 | `sound: 000001EC8B38BB40` |         |
| fadeInRate: 0                  | (a)   | handle  | 1048939 | `sound: 000001EC8B389630` |         |
| fadeInRate: negative           | (a)   | handle  | 1048940 | `sound: 000001EC8B38DED0` |         |
| fadeInRate: outside the world  | (a)   | handle  | 1048941 | `sound: 000001EBDF9CA3A0` |         |
| fadeInRate: 2147483647         | (a)   | handle  | 1048942 | `sound: 000001EC8B399FA0` |         |
| fadeOutRate: 0                 | (a)   | handle  | 1048943 | `sound: 000001EC8B394BC0` |         |
| fadeOutRate: negative          | (a)   | handle  | 1048944 | `sound: 000001EC8B39EAC0` |         |
| fadeOutRate: outside the world | (a)   | handle  | 1048945 | `sound: 000001EC8B3A31D0` |         |
| fadeOutRate: 2147483647        | (a)   | handle  | 1048946 | `sound: 000001EC8B3A3F40` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, soundLabel: empty string, soundLabel: unknown name, fadeInRate: 0, fadeInRate: negative, fadeInRate: outside the world, fadeInRate: 2147483647, fadeOutRate: 0, fadeOutRate: negative, fadeOutRate: outside the world, fadeOutRate: 2147483647) on 3.0.0.24268; evidence, not proof.

### `CreateMIDISound`

| Case                           | Group | Outcome | Id      | Type                      | Message |
| ------------------------------ | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments              | (a)   | handle  | 1048947 | `sound: 000001EC8B3A1C70` |         |
| soundLabel: empty string       | (a)   | handle  | 1048948 | `sound: 000001EC8B3A9080` |         |
| soundLabel: unknown name       | (a)   | handle  | 1048949 | `sound: 000001EC8B3A09C0` |         |
| fadeInRate: 0                  | (a)   | handle  | 1048950 | `sound: 000001EC8B3AEAA0` |         |
| fadeInRate: negative           | (a)   | handle  | 1048951 | `sound: 000001EC8B3ABA10` |         |
| fadeInRate: outside the world  | (a)   | handle  | 1048952 | `sound: 000001EC8B3B3240` |         |
| fadeInRate: 2147483647         | (a)   | handle  | 1048953 | `sound: 000001EC8B3B0540` |         |
| fadeOutRate: 0                 | (a)   | handle  | 1048954 | `sound: 000001EC8B3B8650` |         |
| fadeOutRate: negative          | (a)   | handle  | 1048955 | `sound: 000001EC8B3B5430` |         |
| fadeOutRate: outside the world | (a)   | handle  | 1048956 | `sound: 000001EC8B3BD920` |         |
| fadeOutRate: 2147483647        | (a)   | handle  | 1048957 | `sound: 000001EC8B3BB7D0` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, soundLabel: empty string, soundLabel: unknown name, fadeInRate: 0, fadeInRate: negative, fadeInRate: outside the world, fadeInRate: 2147483647, fadeOutRate: 0, fadeOutRate: negative, fadeOutRate: outside the world, fadeOutRate: 2147483647) on 3.0.0.24268; evidence, not proof.

### `AddWeatherEffect`

| Case                      | Group | Outcome | Id  | Type                              | Message |
| ------------------------- | ----- | ------- | --- | --------------------------------- | ------- |
| typical arguments         | (a)   | handle  | 1   | `weathereffect: 000001EC8B3F2DC0` |         |
| effectID: unknown rawcode | (a)   | handle  | -1  | `weathereffect: 000001EC8B3C7AB0` |         |
| where: removed rect       | (b)   | handle  | 0   | `weathereffect: 000001EC8B854E10` |         |

- Family: `constructor`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, effectID: unknown rawcode, where: removed rect) on 3.0.0.24268; evidence, not proof. The handle had id 0 in a case (where: removed rect).

### `TerrainDeformCrater`

| Case                        | Group | Outcome | Id  | Type                                   | Message |
| --------------------------- | ----- | ------- | --- | -------------------------------------- | ------- |
| typical arguments           | (a)   | handle  | 0   | `terraindeformation: 000001EC8B3BC800` |         |
| x: 0                        | (a)   | handle  | 1   | `terraindeformation: 000001EC8B3F5450` |         |
| x: negative                 | (a)   | handle  | 2   | `terraindeformation: 000001EC8B3C9760` |         |
| x: outside the world        | (a)   | handle  | 3   | `terraindeformation: 000001EC8B3F9AA0` |         |
| x: 2147483647               | (a)   | handle  | 4   | `terraindeformation: 000001EC8B3B7560` |         |
| y: 0                        | (a)   | handle  | 5   | `terraindeformation: 000001EC8B3FE460` |         |
| y: negative                 | (a)   | handle  | 6   | `terraindeformation: 000001EC8AC0C860` |         |
| y: outside the world        | (a)   | handle  | 7   | `terraindeformation: 000001EC8B403450` |         |
| y: 2147483647               | (a)   | handle  | 8   | `terraindeformation: 000001EC8B401C90` |         |
| radius: 0                   | (a)   | handle  | 9   | `terraindeformation: 000001EC8AC0BA30` |         |
| radius: negative            | (a)   | handle  | 10  | `terraindeformation: 000001EC8AC096A0` |         |
| radius: outside the world   | (a)   | handle  | 11  | `terraindeformation: 000001EC8B40E960` |         |
| radius: 2147483647          | (a)   | handle  | 12  | `terraindeformation: 000001EC8B405CF0` |         |
| depth: 0                    | (a)   | handle  | 13  | `terraindeformation: 000001EC8B239020` |         |
| depth: negative             | (a)   | handle  | 14  | `terraindeformation: 000001EC8B411F40` |         |
| depth: outside the world    | (a)   | handle  | 15  | `terraindeformation: 000001EC8B41F580` |         |
| depth: 2147483647           | (a)   | handle  | 16  | `terraindeformation: 000001EC8B42BD00` |         |
| duration: 0                 | (a)   | handle  | 17  | `terraindeformation: 000001EC8B426910` |         |
| duration: negative          | (a)   | handle  | 18  | `terraindeformation: 000001EC8B423FF0` |         |
| duration: outside the world | (a)   | handle  | 19  | `terraindeformation: 000001EC8B423010` |         |
| duration: 2147483647        | (a)   | handle  | 20  | `terraindeformation: 000001EC8B42BB50` |         |

- Family: `constructor`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, x: 0, x: negative, x: outside the world, x: 2147483647, y: 0, y: negative, y: outside the world, y: 2147483647, radius: 0, radius: negative, radius: outside the world, radius: 2147483647, depth: 0, depth: negative, depth: outside the world, depth: 2147483647, duration: 0, duration: negative, duration: outside the world, duration: 2147483647) on 3.0.0.24268; evidence, not proof. The handle had id 0 in a case (typical arguments).

### `TerrainDeformRipple`

| Case                              | Group | Outcome | Id  | Type                                   | Message |
| --------------------------------- | ----- | ------- | --- | -------------------------------------- | ------- |
| typical arguments                 | (a)   | handle  | 21  | `terraindeformation: 000001EC8B428DC0` |         |
| x: 0                              | (a)   | handle  | 22  | `terraindeformation: 000001EC8B432740` |         |
| x: negative                       | (a)   | handle  | 23  | `terraindeformation: 000001EC8B42A040` |         |
| x: outside the world              | (a)   | handle  | 24  | `terraindeformation: 000001EC8B41B090` |         |
| x: 2147483647                     | (a)   | handle  | 25  | `terraindeformation: 000001EC8B423460` |         |
| y: 0                              | (a)   | handle  | 26  | `terraindeformation: 000001EC8B439EC0` |         |
| y: negative                       | (a)   | handle  | 27  | `terraindeformation: 000001EC8B438060` |         |
| y: outside the world              | (a)   | handle  | 28  | `terraindeformation: 000001EC8B43F7F0` |         |
| y: 2147483647                     | (a)   | handle  | 29  | `terraindeformation: 000001EC8B443550` |         |
| radius: 0                         | (a)   | handle  | 30  | `terraindeformation: 000001EC8B442520` |         |
| radius: negative                  | (a)   | handle  | 31  | `terraindeformation: 000001EC8B444C80` |         |
| radius: outside the world         | (a)   | handle  | 32  | `terraindeformation: 000001EC8B4491B0` |         |
| radius: 2147483647                | (a)   | handle  | 33  | `terraindeformation: 000001EC8B447800` |         |
| depth: 0                          | (a)   | handle  | 34  | `terraindeformation: 000001EC8B4431E0` |         |
| depth: negative                   | (a)   | handle  | 35  | `terraindeformation: 000001EC8B45ACA0` |         |
| depth: outside the world          | (a)   | handle  | 36  | `terraindeformation: 000001EC8B45EE70` |         |
| depth: 2147483647                 | (a)   | handle  | 37  | `terraindeformation: 000001EC8B4534C0` |         |
| duration: 0                       | (a)   | handle  | 38  | `terraindeformation: 000001EC8B460590` |         |
| duration: negative                | (a)   | handle  | 39  | `terraindeformation: 000001EC8B460910` |         |
| duration: outside the world       | (a)   | handle  | 40  | `terraindeformation: 000001EC8B464D90` |         |
| duration: 2147483647              | (a)   | handle  | 41  | `terraindeformation: 000001EC8B463240` |         |
| count: 0                          | (a)   | handle  | 42  | `terraindeformation: 000001EC8B466750` |         |
| count: negative                   | (a)   | handle  | 43  | `terraindeformation: 000001EC8B46AB70` |         |
| count: outside the world          | (a)   | handle  | 44  | `terraindeformation: 000001EC8B468E20` |         |
| count: 2147483647                 | (a)   | handle  | 45  | `terraindeformation: 000001EC8B473BE0` |         |
| spaceWaves: 0                     | (a)   | handle  | 46  | `terraindeformation: 000001EC8B467F10` |         |
| spaceWaves: negative              | (a)   | handle  | 47  | `terraindeformation: 000001EC8B470170` |         |
| spaceWaves: outside the world     | (a)   | handle  | 48  | `terraindeformation: 000001EC8B474050` |         |
| spaceWaves: 2147483647            | (a)   | handle  | 49  | `terraindeformation: 000001EC8B470D70` |         |
| timeWaves: 0                      | (a)   | handle  | 50  | `terraindeformation: 000001EC8B478480` |         |
| timeWaves: negative               | (a)   | handle  | 51  | `terraindeformation: 000001EC8B47AEF0` |         |
| timeWaves: outside the world      | (a)   | handle  | 52  | `terraindeformation: 000001EC8B47F040` |         |
| timeWaves: 2147483647             | (a)   | handle  | 53  | `terraindeformation: 000001EC8B47DC90` |         |
| radiusStartPct: 0                 | (a)   | handle  | 54  | `terraindeformation: 000001EC8B481D80` |         |
| radiusStartPct: negative          | (a)   | handle  | 55  | `terraindeformation: 000001EC8B486380` |         |
| radiusStartPct: outside the world | (a)   | handle  | 56  | `terraindeformation: 000001EC8B45AC60` |         |
| radiusStartPct: 2147483647        | (a)   | handle  | 57  | `terraindeformation: 000001EC8B4549E0` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, x: 0, x: negative, x: outside the world, x: 2147483647, y: 0, y: negative, y: outside the world, y: 2147483647, radius: 0, radius: negative, radius: outside the world, radius: 2147483647, depth: 0, depth: negative, depth: outside the world, depth: 2147483647, duration: 0, duration: negative, duration: outside the world, duration: 2147483647, count: 0, count: negative, count: outside the world, count: 2147483647, spaceWaves: 0, spaceWaves: negative, spaceWaves: outside the world, spaceWaves: 2147483647, timeWaves: 0, timeWaves: negative, timeWaves: outside the world, timeWaves: 2147483647, radiusStartPct: 0, radiusStartPct: negative, radiusStartPct: outside the world, radiusStartPct: 2147483647) on 3.0.0.24268; evidence, not proof.

### `TerrainDeformWave`

| Case                         | Group | Outcome | Id  | Type                                   | Message |
| ---------------------------- | ----- | ------- | --- | -------------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 58  | `terraindeformation: 000001EC8B483A50` |         |
| x: 0                         | (a)   | handle  | 59  | `terraindeformation: 000001EC8B48BAE0` |         |
| x: negative                  | (a)   | handle  | 60  | `terraindeformation: 000001EC8B48AAC0` |         |
| x: outside the world         | (a)   | handle  | 61  | `terraindeformation: 000001EC8B489C10` |         |
| x: 2147483647                | (a)   | handle  | 62  | `terraindeformation: 000001EC8B499210` |         |
| y: 0                         | (a)   | handle  | 63  | `terraindeformation: 000001EC8B4981E0` |         |
| y: negative                  | (a)   | handle  | 64  | `terraindeformation: 000001EC8B499EA0` |         |
| y: outside the world         | (a)   | handle  | 65  | `terraindeformation: 000001EC8B49E2C0` |         |
| y: 2147483647                | (a)   | handle  | 66  | `terraindeformation: 000001EC8B49D130` |         |
| dirX: 0                      | (a)   | handle  | 67  | `terraindeformation: 000001EC8B4A0690` |         |
| dirX: negative               | (a)   | handle  | 68  | `terraindeformation: 000001EC8B4A49D0` |         |
| dirX: outside the world      | (a)   | handle  | 69  | `terraindeformation: 000001EC8B4A2F70` |         |
| dirX: 2147483647             | (a)   | handle  | 70  | `terraindeformation: 000001EC8B4ADB30` |         |
| dirY: 0                      | (a)   | handle  | 71  | `terraindeformation: 000001EC8B4AB9A0` |         |
| dirY: negative               | (a)   | handle  | 72  | `terraindeformation: 000001EC8B4AA990` |         |
| dirY: outside the world      | (a)   | handle  | 73  | `terraindeformation: 000001EC8B4AE160` |         |
| dirY: 2147483647             | (a)   | handle  | 74  | `terraindeformation: 000001EC8B4B2EC0` |         |
| distance: 0                  | (a)   | handle  | 75  | `terraindeformation: 000001EC8B4B18D0` |         |
| distance: negative           | (a)   | handle  | 76  | `terraindeformation: 000001EC8B4B4D00` |         |
| distance: outside the world  | (a)   | handle  | 77  | `terraindeformation: 000001EC8B4B9350` |         |
| distance: 2147483647         | (a)   | handle  | 78  | `terraindeformation: 000001EC8B4B6D80` |         |
| speed: 0                     | (a)   | handle  | 79  | `terraindeformation: 000001EC8B4BD520` |         |
| speed: negative              | (a)   | handle  | 80  | `terraindeformation: 000001EC8B4B8800` |         |
| speed: outside the world     | (a)   | handle  | 81  | `terraindeformation: 000001EC8B4C2B40` |         |
| speed: 2147483647            | (a)   | handle  | 82  | `terraindeformation: 000001EC8B4C7650` |         |
| radius: 0                    | (a)   | handle  | 83  | `terraindeformation: 000001EC8B4C0140` |         |
| radius: negative             | (a)   | handle  | 84  | `terraindeformation: 000001EC8B4CF380` |         |
| radius: outside the world    | (a)   | handle  | 85  | `terraindeformation: 000001EC8B4CD350` |         |
| radius: 2147483647           | (a)   | handle  | 86  | `terraindeformation: 000001EC8B4CAD70` |         |
| depth: 0                     | (a)   | handle  | 87  | `terraindeformation: 000001EC8B4D8A50` |         |
| depth: negative              | (a)   | handle  | 88  | `terraindeformation: 000001EC8B4CBDB0` |         |
| depth: outside the world     | (a)   | handle  | 89  | `terraindeformation: 000001EC8B4B2E80` |         |
| depth: 2147483647            | (a)   | handle  | 90  | `terraindeformation: 000001EC8B4BC320` |         |
| trailTime: 0                 | (a)   | handle  | 91  | `terraindeformation: 000001EC8B48E150` |         |
| trailTime: negative          | (a)   | handle  | 92  | `terraindeformation: 000001EC8B4DF290` |         |
| trailTime: outside the world | (a)   | handle  | 93  | `terraindeformation: 000001EC8B4D47A0` |         |
| trailTime: 2147483647        | (a)   | handle  | 94  | `terraindeformation: 000001EC8B4E4B60` |         |
| count: 0                     | (a)   | handle  | 95  | `terraindeformation: 000001EC8B4E97D0` |         |
| count: negative              | (a)   | handle  | 96  | `terraindeformation: 000001EC8B4E8A40` |         |
| count: outside the world     | (a)   | handle  | 97  | `terraindeformation: 000001EC8B4E69B0` |         |
| count: 2147483647            | (a)   | handle  | 98  | `terraindeformation: 000001EC8B430990` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, x: 0, x: negative, x: outside the world, x: 2147483647, y: 0, y: negative, y: outside the world, y: 2147483647, dirX: 0, dirX: negative, dirX: outside the world, dirX: 2147483647, dirY: 0, dirY: negative, dirY: outside the world, dirY: 2147483647, distance: 0, distance: negative, distance: outside the world, distance: 2147483647, speed: 0, speed: negative, speed: outside the world, speed: 2147483647, radius: 0, radius: negative, radius: outside the world, radius: 2147483647, depth: 0, depth: negative, depth: outside the world, depth: 2147483647, trailTime: 0, trailTime: negative, trailTime: outside the world, trailTime: 2147483647, count: 0, count: negative, count: outside the world, count: 2147483647) on 3.0.0.24268; evidence, not proof.

### `TerrainDeformRandom`

| Case                              | Group | Outcome | Id  | Type                                   | Message |
| --------------------------------- | ----- | ------- | --- | -------------------------------------- | ------- |
| typical arguments                 | (a)   | handle  | 99  | `terraindeformation: 000001EC8B4FB090` |         |
| x: 0                              | (a)   | handle  | 100 | `terraindeformation: 000001EC8B4F7310` |         |
| x: negative                       | (a)   | handle  | 101 | `terraindeformation: 000001EC8B4F6830` |         |
| x: outside the world              | (a)   | handle  | 102 | `terraindeformation: 000001EC8B4FB190` |         |
| x: 2147483647                     | (a)   | handle  | 103 | `terraindeformation: 000001EC8B4FEEA0` |         |
| y: 0                              | (a)   | handle  | 104 | `terraindeformation: 000001EC8B4FDF80` |         |
| y: negative                       | (a)   | handle  | 105 | `terraindeformation: 000001EC8B501820` |         |
| y: outside the world              | (a)   | handle  | 106 | `terraindeformation: 000001EC8B5055B0` |         |
| y: 2147483647                     | (a)   | handle  | 107 | `terraindeformation: 000001EC8B500B10` |         |
| radius: 0                         | (a)   | handle  | 108 | `terraindeformation: 000001EC8B507F00` |         |
| radius: negative                  | (a)   | handle  | 109 | `terraindeformation: 000001EC8B50B9D0` |         |
| radius: outside the world         | (a)   | handle  | 110 | `terraindeformation: 000001EC8B509880` |         |
| radius: 2147483647                | (a)   | handle  | 111 | `terraindeformation: 000001EC8B516830` |         |
| minDelta: 0                       | (a)   | handle  | 112 | `terraindeformation: 000001EC8B5146D0` |         |
| minDelta: negative                | (a)   | handle  | 113 | `terraindeformation: 000001EC8B510D00` |         |
| minDelta: outside the world       | (a)   | handle  | 114 | `terraindeformation: 000001EC8B50E190` |         |
| minDelta: 2147483647              | (a)   | handle  | 115 | `terraindeformation: 000001EC8B513130` |         |
| maxDelta: 0                       | (a)   | handle  | 116 | `terraindeformation: 000001EC8B5200D0` |         |
| maxDelta: negative                | (a)   | handle  | 117 | `terraindeformation: 000001EC8B513CA0` |         |
| maxDelta: outside the world       | (a)   | handle  | 118 | `terraindeformation: 000001EC8B526B30` |         |
| maxDelta: 2147483647              | (a)   | handle  | 119 | `terraindeformation: 000001EC8B52AC80` |         |
| duration: 0                       | (a)   | handle  | 120 | `terraindeformation: 000001EC8B529010` |         |
| duration: negative                | (a)   | handle  | 121 | `terraindeformation: 000001EC8B52CF60` |         |
| duration: outside the world       | (a)   | handle  | 122 | `terraindeformation: 000001EC8B530CD0` |         |
| duration: 2147483647              | (a)   | handle  | 123 | `terraindeformation: 000001EC8B52C670` |         |
| updateInterval: 0                 | (a)   | handle  | 124 | `terraindeformation: 000001EC8B533AA0` |         |
| updateInterval: negative          | (a)   | handle  | 125 | `terraindeformation: 000001EC8B537970` |         |
| updateInterval: outside the world | (a)   | handle  | 126 | `terraindeformation: 000001EC8B532A80` |         |
| updateInterval: 2147483647        | (a)   | handle  | 127 | `terraindeformation: 000001EC8B53A500` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, x: 0, x: negative, x: outside the world, x: 2147483647, y: 0, y: negative, y: outside the world, y: 2147483647, radius: 0, radius: negative, radius: outside the world, radius: 2147483647, minDelta: 0, minDelta: negative, minDelta: outside the world, minDelta: 2147483647, maxDelta: 0, maxDelta: negative, maxDelta: outside the world, maxDelta: 2147483647, duration: 0, duration: negative, duration: outside the world, duration: 2147483647, updateInterval: 0, updateInterval: negative, updateInterval: outside the world, updateInterval: 2147483647) on 3.0.0.24268; evidence, not proof.

### `AddSpecialEffect`

| Case                    | Group | Outcome | Id      | Type                       | Message |
| ----------------------- | ----- | ------- | ------- | -------------------------- | ------- |
| typical arguments       | (a)   | handle  | 1048958 | `effect: 000001EC8B551B20` |         |
| modelName: empty string | (a)   | handle  | 1048959 | `effect: 000001EC8B53D440` |         |
| modelName: unknown name | (a)   | handle  | 1048960 | `effect: 000001EC8B5B1D20` |         |
| x: 0                    | (a)   | handle  | 1048961 | `effect: 000001EC8B5B0770` |         |
| x: negative             | (a)   | handle  | 1048962 | `effect: 000001EC8B544710` |         |
| x: outside the world    | (a)   | handle  | 1048963 | `effect: 000001EC8B5B0F60` |         |
| x: 2147483647           | (a)   | handle  | 1048964 | `effect: 000001EC8B584920` |         |
| y: 0                    | (a)   | handle  | 1048965 | `effect: 000001EC8B588B00` |         |
| y: negative             | (a)   | handle  | 1048966 | `effect: 000001EC8B586DB0` |         |
| y: outside the world    | (a)   | handle  | 1048967 | `effect: 000001EC8B5FC540` |         |
| y: 2147483647           | (a)   | handle  | 1048968 | `effect: 000001EC8B5FFDC0` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, modelName: empty string, modelName: unknown name, x: 0, x: negative, x: outside the world, x: 2147483647, y: 0, y: negative, y: outside the world, y: 2147483647) on 3.0.0.24268; evidence, not proof.

### `AddSpecialEffectLoc`

| Case                    | Group | Outcome | Id      | Type                       | Message |
| ----------------------- | ----- | ------- | ------- | -------------------------- | ------- |
| typical arguments       | (a)   | handle  | 1048969 | `effect: 000001EC8B6036B0` |         |
| modelName: empty string | (a)   | handle  | 1048970 | `effect: 000001EC8B6073D0` |         |
| modelName: unknown name | (a)   | handle  | 1048971 | `effect: 000001EC8B605630` |         |
| where: removed location | (b)   | nil     |         |                            |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (where: removed location) on 3.0.0.24268.

### `AddSpecialEffectTarget`

| Case                               | Group | Outcome | Id      | Type                       | Message |
| ---------------------------------- | ----- | ------- | ------- | -------------------------- | ------- |
| typical arguments                  | (a)   | handle  | 1048972 | `effect: 000001EC8B6062C0` |         |
| modelName: empty string            | (a)   | handle  | 1048973 | `effect: 000001EC8B5F0490` |         |
| modelName: unknown name            | (a)   | handle  | 1048974 | `effect: 000001EC8B5F2360` |         |
| attachPointName: empty string      | (a)   | nil     |         |                            |         |
| attachPointName: unknown name      | (a)   | handle  | 1048975 | `effect: 000001EC8B5FA090` |         |
| targetWidget: dead unit            | (b)   | handle  | 1049026 | `effect: 000001EC8C24A2E0` |         |
| targetWidget: removed unit         | (b)   | handle  | 1049027 | `effect: 000001EC8B857990` |         |
| targetWidget: dead item            | (b)   | handle  | 1049028 | `effect: 000001EC8C246720` |         |
| targetWidget: removed item         | (b)   | nil     |         |                            |         |
| targetWidget: dead destructable    | (b)   | handle  | 1049029 | `effect: 000001EC8C250FB0` |         |
| targetWidget: removed destructable | (b)   | nil     |         |                            |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 3 cases of the nullability sweep (attachPointName: empty string, targetWidget: removed item, targetWidget: removed destructable) on 3.0.0.24268.

### `AddSpellEffect`

| Case                        | Group | Outcome | Id  | Type | Message |
| --------------------------- | ----- | ------- | --- | ---- | ------- |
| typical arguments           | (a)   | nil     |     |      |         |
| abilityString: empty string | (a)   | nil     |     |      |         |
| abilityString: unknown name | (a)   | nil     |     |      |         |
| x: 0                        | (a)   | nil     |     |      |         |
| x: negative                 | (a)   | nil     |     |      |         |
| x: outside the world        | (a)   | nil     |     |      |         |
| x: 2147483647               | (a)   | nil     |     |      |         |
| y: 0                        | (a)   | nil     |     |      |         |
| y: negative                 | (a)   | nil     |     |      |         |
| y: outside the world        | (a)   | nil     |     |      |         |
| y: 2147483647               | (a)   | nil     |     |      |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 11 cases of the nullability sweep (typical arguments, abilityString: empty string, abilityString: unknown name, x: 0, x: negative, x: outside the world, x: 2147483647, y: 0, y: negative, y: outside the world, y: 2147483647) on 3.0.0.24268.

### `AddSpellEffectLoc`

| Case                        | Group | Outcome | Id  | Type | Message |
| --------------------------- | ----- | ------- | --- | ---- | ------- |
| typical arguments           | (a)   | nil     |     |      |         |
| abilityString: empty string | (a)   | nil     |     |      |         |
| abilityString: unknown name | (a)   | nil     |     |      |         |
| where: removed location     | (b)   | nil     |     |      |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 4 cases of the nullability sweep (typical arguments, abilityString: empty string, abilityString: unknown name, where: removed location) on 3.0.0.24268.

### `AddSpellEffectById`

| Case                       | Group | Outcome | Id      | Type                       | Message |
| -------------------------- | ----- | ------- | ------- | -------------------------- | ------- |
| typical arguments          | (a)   | handle  | 1048976 | `effect: 000001EC8B64C0E0` |         |
| abilityId: unknown rawcode | (a)   | nil     |         |                            |         |
| x: 0                       | (a)   | handle  | 1048977 | `effect: 000001EC8B64A670` |         |
| x: negative                | (a)   | handle  | 1048978 | `effect: 000001EC8B65A580` |         |
| x: outside the world       | (a)   | handle  | 1048979 | `effect: 000001EC8B657DD0` |         |
| x: 2147483647              | (a)   | handle  | 1048980 | `effect: 000001EC8B6529F0` |         |
| y: 0                       | (a)   | handle  | 1048981 | `effect: 000001EC8B65A8F0` |         |
| y: negative                | (a)   | handle  | 1048982 | `effect: 000001EC8B65E720` |         |
| y: outside the world       | (a)   | handle  | 1048983 | `effect: 000001EC8B656910` |         |
| y: 2147483647              | (a)   | handle  | 1048984 | `effect: 000001EC8B687B30` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (abilityId: unknown rawcode) on 3.0.0.24268.

### `AddSpellEffectByIdLoc`

| Case                       | Group | Outcome | Id      | Type                       | Message |
| -------------------------- | ----- | ------- | ------- | -------------------------- | ------- |
| typical arguments          | (a)   | handle  | 1048985 | `effect: 000001EC8B6850E0` |         |
| abilityId: unknown rawcode | (a)   | nil     |         |                            |         |
| where: removed location    | (b)   | nil     |         |                            |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 2 cases of the nullability sweep (abilityId: unknown rawcode, where: removed location) on 3.0.0.24268.

### `AddSpellEffectTarget`

| Case                               | Group | Outcome | Id  | Type | Message |
| ---------------------------------- | ----- | ------- | --- | ---- | ------- |
| typical arguments                  | (a)   | nil     |     |      |         |
| modelName: empty string            | (a)   | nil     |     |      |         |
| modelName: unknown name            | (a)   | nil     |     |      |         |
| attachPoint: empty string          | (a)   | nil     |     |      |         |
| attachPoint: unknown name          | (a)   | nil     |     |      |         |
| targetWidget: dead unit            | (b)   | nil     |     |      |         |
| targetWidget: removed unit         | (b)   | nil     |     |      |         |
| targetWidget: dead item            | (b)   | nil     |     |      |         |
| targetWidget: removed item         | (b)   | nil     |     |      |         |
| targetWidget: dead destructable    | (b)   | nil     |     |      |         |
| targetWidget: removed destructable | (b)   | nil     |     |      |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 11 cases of the nullability sweep (typical arguments, modelName: empty string, modelName: unknown name, attachPoint: empty string, attachPoint: unknown name, targetWidget: dead unit, targetWidget: removed unit, targetWidget: dead item, targetWidget: removed item, targetWidget: dead destructable, targetWidget: removed destructable) on 3.0.0.24268.

### `AddSpellEffectTargetById`

| Case                               | Group | Outcome | Id      | Type                       | Message |
| ---------------------------------- | ----- | ------- | ------- | -------------------------- | ------- |
| typical arguments                  | (a)   | handle  | 1048986 | `effect: 000001EC8B691520` |         |
| abilityId: unknown rawcode         | (a)   | nil     |         |                            |         |
| attachPoint: empty string          | (a)   | nil     |         |                            |         |
| attachPoint: unknown name          | (a)   | handle  | 1048987 | `effect: 000001EC8B694B80` |         |
| targetWidget: dead unit            | (b)   | handle  | 1049030 | `effect: 000001EC8C2491B0` |         |
| targetWidget: removed unit         | (b)   | handle  | 1049031 | `effect: 000001EC8C2632E0` |         |
| targetWidget: dead item            | (b)   | handle  | 1049032 | `effect: 000001EC8B639C50` |         |
| targetWidget: removed item         | (b)   | nil     |         |                            |         |
| targetWidget: dead destructable    | (b)   | handle  | 1049033 | `effect: 000001EC8B6342A0` |         |
| targetWidget: removed destructable | (b)   | nil     |         |                            |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 4 cases of the nullability sweep (abilityId: unknown rawcode, attachPoint: empty string, targetWidget: removed item, targetWidget: removed destructable) on 3.0.0.24268.

### `AddLightning`

| Case                                 | Group | Outcome | Id      | Type                          | Message |
| ------------------------------------ | ----- | ------- | ------- | ----------------------------- | ------- |
| typical arguments                    | (a)   | handle  | 2       | `lightning: 000001EC8B69E4B0` |         |
| codeName: empty string               | (a)   | handle  | 0       | `lightning: 000001EC8B710480` |         |
| codeName: unknown name               | (a)   | handle  | 0       | `lightning: 000001EC8B710480` |         |
| x1: 0                                | (a)   | handle  | 65538   | `lightning: 000001EC8B6A4170` |         |
| x1: negative                         | (a)   | handle  | 131074  | `lightning: 000001EC8B70F050` |         |
| x1: outside the world                | (a)   | handle  | 196610  | `lightning: 000001EC8B710830` |         |
| x1: 2147483647                       | (a)   | handle  | 262146  | `lightning: 000001EC8B70E870` |         |
| y1: 0                                | (a)   | handle  | 327682  | `lightning: 000001EC8B7136E0` |         |
| y1: negative                         | (a)   | handle  | 393218  | `lightning: 000001EC8B717230` |         |
| y1: outside the world                | (a)   | handle  | 458754  | `lightning: 000001EC8B721880` |         |
| y1: 2147483647                       | (a)   | handle  | 524290  | `lightning: 000001EC8B6A5520` |         |
| x2: 0                                | (a)   | handle  | 589826  | `lightning: 000001EC8B71F850` |         |
| x2: negative                         | (a)   | handle  | 655362  | `lightning: 000001EC8B715490` |         |
| x2: outside the world                | (a)   | handle  | 720898  | `lightning: 000001EC8B721EE0` |         |
| x2: 2147483647                       | (a)   | handle  | 786434  | `lightning: 000001EC8B7281C0` |         |
| y2: 0                                | (a)   | handle  | 851970  | `lightning: 000001EC8B7265F0` |         |
| y2: negative                         | (a)   | handle  | 917506  | `lightning: 000001EC8B71CCC0` |         |
| y2: outside the world                | (a)   | handle  | 983042  | `lightning: 000001EC8B72B290` |         |
| y2: 2147483647                       | (a)   | handle  | 1048578 | `lightning: 000001EC8B731710` |         |
| checkVisibility: true, points unseen | (a)   | handle  | 0       | `lightning: 000001EC8B710480` |         |

- Family: `constructor`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, codeName: empty string, codeName: unknown name, x1: 0, x1: negative, x1: outside the world, x1: 2147483647, y1: 0, y1: negative, y1: outside the world, y1: 2147483647, x2: 0, x2: negative, x2: outside the world, x2: 2147483647, y2: 0, y2: negative, y2: outside the world, y2: 2147483647, checkVisibility: true, points unseen) on 3.0.0.24268; evidence, not proof. The handle had id 0 in 3 cases (codeName: empty string, codeName: unknown name, checkVisibility: true, points unseen).

### `AddLightningEx`

| Case                                 | Group | Outcome | Id      | Type                          | Message |
| ------------------------------------ | ----- | ------- | ------- | ----------------------------- | ------- |
| typical arguments                    | (a)   | handle  | 1114114 | `lightning: 000001EC8B7314A0` |         |
| codeName: empty string               | (a)   | handle  | 0       | `lightning: 000001EC8B710480` |         |
| codeName: unknown name               | (a)   | handle  | 0       | `lightning: 000001EC8B710480` |         |
| x1: 0                                | (a)   | handle  | 1179650 | `lightning: 000001EC8B739D30` |         |
| x1: negative                         | (a)   | handle  | 1245186 | `lightning: 000001EC8B7365E0` |         |
| x1: outside the world                | (a)   | handle  | 1310722 | `lightning: 000001EC8B73D7E0` |         |
| x1: 2147483647                       | (a)   | handle  | 1376258 | `lightning: 000001EC8B744BE0` |         |
| y1: 0                                | (a)   | handle  | 1441794 | `lightning: 000001EC8B744020` |         |
| y1: negative                         | (a)   | handle  | 1507330 | `lightning: 000001EC8B739740` |         |
| y1: outside the world                | (a)   | handle  | 1572866 | `lightning: 000001EC8B74A840` |         |
| y1: 2147483647                       | (a)   | handle  | 1638402 | `lightning: 000001EC8B7400D0` |         |
| z1: 0                                | (a)   | handle  | 1703938 | `lightning: 000001EC8B7416C0` |         |
| z1: negative                         | (a)   | handle  | 1769474 | `lightning: 000001EC8B74C4C0` |         |
| z1: outside the world                | (a)   | handle  | 1835010 | `lightning: 000001EC8B75DF20` |         |
| z1: 2147483647                       | (a)   | handle  | 1900546 | `lightning: 000001EC8B7627F0` |         |
| x2: 0                                | (a)   | handle  | 1966082 | `lightning: 000001EC8B740BF0` |         |
| x2: negative                         | (a)   | handle  | 2031618 | `lightning: 000001EC8B765490` |         |
| x2: outside the world                | (a)   | handle  | 2097154 | `lightning: 000001EC8B7682D0` |         |
| x2: 2147483647                       | (a)   | handle  | 2162690 | `lightning: 000001EC8B76D000` |         |
| y2: 0                                | (a)   | handle  | 2228226 | `lightning: 000001EC8B7600C0` |         |
| y2: negative                         | (a)   | handle  | 2293762 | `lightning: 000001EC8B76F490` |         |
| y2: outside the world                | (a)   | handle  | 2359298 | `lightning: 000001EC8B771200` |         |
| y2: 2147483647                       | (a)   | handle  | 2424834 | `lightning: 000001EC8B775A40` |         |
| z2: 0                                | (a)   | handle  | 2490370 | `lightning: 000001EC8B7774A0` |         |
| z2: negative                         | (a)   | handle  | 2555906 | `lightning: 000001EC8B778FA0` |         |
| z2: outside the world                | (a)   | handle  | 2621442 | `lightning: 000001EC8B77B4B0` |         |
| z2: 2147483647                       | (a)   | handle  | 2686978 | `lightning: 000001EC8B77F520` |         |
| checkVisibility: true, points unseen | (a)   | handle  | 0       | `lightning: 000001EC8B710480` |         |

- Family: `constructor`
- Verdict: non-null (evidence, handle id 0)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, codeName: empty string, codeName: unknown name, x1: 0, x1: negative, x1: outside the world, x1: 2147483647, y1: 0, y1: negative, y1: outside the world, y1: 2147483647, z1: 0, z1: negative, z1: outside the world, z1: 2147483647, x2: 0, x2: negative, x2: outside the world, x2: 2147483647, y2: 0, y2: negative, y2: outside the world, y2: 2147483647, z2: 0, z2: negative, z2: outside the world, z2: 2147483647, checkVisibility: true, points unseen) on 3.0.0.24268; evidence, not proof. The handle had id 0 in 3 cases (codeName: empty string, codeName: unknown name, checkVisibility: true, points unseen).

### `CreateImage`

| Case                         | Group | Outcome | Id  | Type                      | Message                            |
| ---------------------------- | ----- | ------- | --- | ------------------------- | ---------------------------------- |
| typical arguments            | (a)   | handle  | 144 | `image: 000001EC8B77DC30` |                                    |
| file: empty string           | (a)   | handle  | -1  | `image: 000001EC8B793CE0` |                                    |
| file: unknown name           | (a)   | handle  | -1  | `image: 000001EC8B793CE0` |                                    |
| sizeX: 0                     | (a)   | handle  | 145 | `image: 000001EC8B79C670` |                                    |
| sizeX: negative              | (a)   | handle  | 146 | `image: 000001EC8B7964B0` |                                    |
| sizeX: outside the world     | (a)   | handle  | 147 | `image: 000001EC8B799E30` |                                    |
| sizeX: 2147483647            | (a)   | handle  | 148 | `image: 000001EC8B786F70` |                                    |
| sizeY: 0                     | (a)   | handle  | 149 | `image: 000001EC8B788C80` |                                    |
| sizeY: negative              | (a)   | handle  | 150 | `image: 000001EC8B784C90` |                                    |
| sizeY: outside the world     | (a)   | handle  | 151 | `image: 000001EC8B78EB50` |                                    |
| sizeY: 2147483647            | (a)   | handle  | 152 | `image: 000001EC8B792F60` |                                    |
| sizeZ: 0                     | (a)   | handle  | 153 | `image: 000001EC8B792350` |                                    |
| sizeZ: negative              | (a)   | handle  | 154 | `image: 000001EC8B79B1D0` |                                    |
| sizeZ: outside the world     | (a)   | handle  | 155 | `image: 000001EC8B7A19E0` |                                    |
| sizeZ: 2147483647            | (a)   | handle  | 156 | `image: 000001EC8B7A5AB0` |                                    |
| posX: 0                      | (a)   | handle  | 157 | `image: 000001EC8B7A3FA0` |                                    |
| posX: negative               | (a)   | handle  | 158 | `image: 000001EC8B7FD090` |                                    |
| posX: outside the world      | (a)   | handle  | 159 | `image: 000001EC8B8015D0` |                                    |
| posX: 2147483647             | (a)   | handle  | 160 | `image: 000001EC8B7FB2A0` |                                    |
| posY: 0                      | (a)   | handle  | 161 | `image: 000001EC8B7FA5B0` |                                    |
| posY: negative               | (a)   | handle  | 162 | `image: 000001EC8B8656C0` |                                    |
| posY: outside the world      | (a)   | handle  | 163 | `image: 000001EC8B869C60` |                                    |
| posY: 2147483647             | (a)   | handle  | 164 | `image: 000001EC8B86C220` |                                    |
| posZ: 0                      | (a)   | handle  | 165 | `image: 000001EC8B868D90` |                                    |
| posZ: negative               | (a)   | handle  | 166 | `image: 000001EC8B86F700` |                                    |
| posZ: outside the world      | (a)   | handle  | 167 | `image: 000001EC8B873B80` |                                    |
| posZ: 2147483647             | (a)   | handle  | 168 | `image: 000001EC8B8779C0` |                                    |
| originX: 0                   | (a)   | handle  | 169 | `image: 000001EC8B877140` |                                    |
| originX: negative            | (a)   | handle  | 170 | `image: 000001EC8B871690` |                                    |
| originX: outside the world   | (a)   | handle  | 171 | `image: 000001EC8B7FD050` |                                    |
| originX: 2147483647          | (a)   | handle  | 172 | `image: 000001EC8B7A1850` |                                    |
| originY: 0                   | (a)   | handle  | 173 | `image: 000001EC8B76F620` |                                    |
| originY: negative            | (a)   | handle  | 174 | `image: 000001EC8B741CB0` |                                    |
| originY: outside the world   | (a)   | handle  | 175 | `image: 000001EC8B74DAE0` |                                    |
| originY: 2147483647          | (a)   | handle  | 176 | `image: 000001EC8B716AA0` |                                    |
| originZ: negative            | (a)   | handle  | 177 | `image: 000001EC8B70C8D0` |                                    |
| originZ: outside the world   | (a)   | handle  | 178 | `image: 000001EC8B6A6CD0` |                                    |
| originZ: 2147483647          | (a)   | handle  | 179 | `image: 000001EC8B721650` |                                    |
| imageType: 0                 | (a)   | handle  | -1  | `image: 000001EC8B649CC0` |                                    |
| imageType: negative          | (a)   | handle  | 180 | `image: 000001EC8B546940` |                                    |
| imageType: outside the world | (a)   | handle  | 181 | `image: 000001EC8B661530` |                                    |
| imageType: 2147483647        | (a)   | crashed |     |                           | skipped: crashed in an earlier run |

- Family: `constructor`
- Verdict: unsafe
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Crashed the game in a case of the nullability sweep (imageType: 2147483647) on 3.0.0.24268. Returned a handle in every other case (typical arguments, file: empty string, file: unknown name, sizeX: 0, sizeX: negative, sizeX: outside the world, sizeX: 2147483647, sizeY: 0, sizeY: negative, sizeY: outside the world, sizeY: 2147483647, sizeZ: 0, sizeZ: negative, sizeZ: outside the world, sizeZ: 2147483647, posX: 0, posX: negative, posX: outside the world, posX: 2147483647, posY: 0, posY: negative, posY: outside the world, posY: 2147483647, posZ: 0, posZ: negative, posZ: outside the world, posZ: 2147483647, originX: 0, originX: negative, originX: outside the world, originX: 2147483647, originY: 0, originY: negative, originY: outside the world, originY: 2147483647, originZ: negative, originZ: outside the world, originZ: 2147483647, imageType: 0, imageType: negative, imageType: outside the world).

### `CreateUbersplat`

| Case                     | Group | Outcome | Id  | Type                          | Message |
| ------------------------ | ----- | ------- | --- | ----------------------------- | ------- |
| typical arguments        | (a)   | handle  | 1   | `ubersplat: 000001EC8B867920` |         |
| x: 0                     | (a)   | handle  | 2   | `ubersplat: 000001EC8B72DA30` |         |
| x: negative              | (a)   | handle  | 3   | `ubersplat: 000001EC8B430780` |         |
| x: outside the world     | (a)   | handle  | 4   | `ubersplat: 000001EC8B5EFAE0` |         |
| x: 2147483647            | (a)   | handle  | 5   | `ubersplat: 000001EC8B4B1380` |         |
| y: 0                     | (a)   | handle  | 6   | `ubersplat: 000001EC8B5EFA40` |         |
| y: negative              | (a)   | handle  | 7   | `ubersplat: 000001EC8B488BB0` |         |
| y: outside the world     | (a)   | handle  | 8   | `ubersplat: 000001EC8B477D30` |         |
| y: 2147483647            | (a)   | handle  | 9   | `ubersplat: 000001EC8B447B40` |         |
| name: empty string       | (a)   | handle  | -1  | `ubersplat: 000001EC8B410380` |         |
| name: unknown name       | (a)   | handle  | -1  | `ubersplat: 000001EC8B410380` |         |
| red: 0                   | (a)   | handle  | 10  | `ubersplat: 000001EC8B3FD970` |         |
| red: negative            | (a)   | handle  | 11  | `ubersplat: 000001EC8B39C7B0` |         |
| red: outside the world   | (a)   | handle  | 12  | `ubersplat: 000001EC8B38E960` |         |
| red: 2147483647          | (a)   | handle  | 13  | `ubersplat: 000001EC8B4E0A00` |         |
| green: 0                 | (a)   | handle  | 14  | `ubersplat: 000001EC8B348E20` |         |
| green: negative          | (a)   | handle  | 15  | `ubersplat: 000001EC8B31AD30` |         |
| green: outside the world | (a)   | handle  | 16  | `ubersplat: 000001EC8B33EA90` |         |
| green: 2147483647        | (a)   | handle  | 17  | `ubersplat: 000001EC8B112340` |         |
| blue: 0                  | (a)   | handle  | 18  | `ubersplat: 000001EC8B3168E0` |         |
| blue: negative           | (a)   | handle  | 19  | `ubersplat: 000001EC8ABB1B70` |         |
| blue: outside the world  | (a)   | handle  | 20  | `ubersplat: 000001EC8ABC29F0` |         |
| blue: 2147483647         | (a)   | handle  | 21  | `ubersplat: 000001EC8ABE1290` |         |
| alpha: 0                 | (a)   | handle  | 22  | `ubersplat: 000001EC8B34EF40` |         |
| alpha: negative          | (a)   | handle  | 23  | `ubersplat: 000001EC8ABD1F90` |         |
| alpha: outside the world | (a)   | handle  | 24  | `ubersplat: 000001EC8B638760` |         |
| alpha: 2147483647        | (a)   | handle  | 25  | `ubersplat: 000001EC8B5438B0` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, x: 0, x: negative, x: outside the world, x: 2147483647, y: 0, y: negative, y: outside the world, y: 2147483647, name: empty string, name: unknown name, red: 0, red: negative, red: outside the world, red: 2147483647, green: 0, green: negative, green: outside the world, green: 2147483647, blue: 0, blue: negative, blue: outside the world, blue: 2147483647, alpha: 0, alpha: negative, alpha: outside the world, alpha: 2147483647) on 3.0.0.24268; evidence, not proof.

### `CreateBlightedGoldmine`

| Case                    | Group | Outcome | Id      | Type                     | Message |
| ----------------------- | ----- | ------- | ------- | ------------------------ | ------- |
| typical arguments       | (a)   | handle  | 1048988 | `unit: 000001EC8B537350` |         |
| x: 0                    | (a)   | handle  | 1048989 | `unit: 000001EC8B324380` |         |
| x: negative             | (a)   | handle  | 1048990 | `unit: 000001EC8B727620` |         |
| x: outside the world    | (a)   | handle  | 1048991 | `unit: 000001EC8AACBC80` |         |
| x: 2147483647           | (a)   | handle  | 1048992 | `unit: 000001EC8ABCF730` |         |
| y: 0                    | (a)   | handle  | 1048993 | `unit: 000001EC8AC11F30` |         |
| y: negative             | (a)   | handle  | 1048994 | `unit: 000001EC8BEBA520` |         |
| y: outside the world    | (a)   | handle  | 1048995 | `unit: 000001EC8ACA5420` |         |
| y: 2147483647           | (a)   | handle  | 1048996 | `unit: 000001EC8AB1E910` |         |
| face: 0                 | (a)   | handle  | 1048997 | `unit: 000001EC8B7262A0` |         |
| face: negative          | (a)   | handle  | 1048998 | `unit: 000001EC8AA9B520` |         |
| face: outside the world | (a)   | handle  | 1048999 | `unit: 000001EC8B5AFD10` |         |
| face: 2147483647        | (a)   | handle  | 1049000 | `unit: 000001EBD67BFFB0` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, x: 0, x: negative, x: outside the world, x: 2147483647, y: 0, y: negative, y: outside the world, y: 2147483647, face: 0, face: negative, face: outside the world, face: 2147483647) on 3.0.0.24268; evidence, not proof.

### `BlzCreateItemWithSkin`

| Case                    | Group | Outcome | Id      | Type                     | Message |
| ----------------------- | ----- | ------- | ------- | ------------------------ | ------- |
| typical arguments       | (a)   | handle  | 1049001 | `item: 000001EBC17BFA20` |         |
| itemid: unknown rawcode | (a)   | nil     |         |                          |         |
| x: 0                    | (a)   | handle  | 1049002 | `item: 000001EBC17BED80` |         |
| x: negative             | (a)   | handle  | 1049003 | `item: 000001EBC17C6800` |         |
| x: outside the world    | (a)   | handle  | 1049004 | `item: 000001EBC1612310` |         |
| x: 2147483647           | (a)   | handle  | 1049005 | `item: 000001EBC17BDF10` |         |
| y: 0                    | (a)   | handle  | 1049006 | `item: 000001EBC17CF0F0` |         |
| y: negative             | (a)   | handle  | 1049007 | `item: 000001EBC17DAB70` |         |
| y: outside the world    | (a)   | handle  | 1049008 | `item: 000001EBC17BF510` |         |
| y: 2147483647           | (a)   | handle  | 1049009 | `item: 000001EBC160E110` |         |
| skinId: unknown rawcode | (a)   | handle  | 1049010 | `item: 000001EBC16106E0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (itemid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateUnitWithSkin`

| Case                    | Group | Outcome | Id      | Type                     | Message |
| ----------------------- | ----- | ------- | ------- | ------------------------ | ------- |
| typical arguments       | (a)   | handle  | 1049011 | `unit: 000001EBC17D9BB0` |         |
| unitid: unknown rawcode | (a)   | nil     |         |                          |         |
| x: 0                    | (a)   | handle  | 1049012 | `unit: 000001EBC1602770` |         |
| x: negative             | (a)   | handle  | 1049013 | `unit: 000001EC8C0373F0` |         |
| x: outside the world    | (a)   | handle  | 1049014 | `unit: 000001EC8B91D210` |         |
| x: 2147483647           | (a)   | handle  | 1049015 | `unit: 000001EC8AF7DE90` |         |
| y: 0                    | (a)   | handle  | 1049016 | `unit: 000001EC8B22F530` |         |
| y: negative             | (a)   | handle  | 1049017 | `unit: 000001EC8AF81670` |         |
| y: outside the world    | (a)   | handle  | 1049018 | `unit: 000001EC8C02FD80` |         |
| y: 2147483647           | (a)   | handle  | 1049019 | `unit: 000001EC8BFF5350` |         |
| face: 0                 | (a)   | handle  | 1049020 | `unit: 000001EBC162AC60` |         |
| face: negative          | (a)   | handle  | 1049021 | `unit: 000001EC8B846640` |         |
| face: outside the world | (a)   | handle  | 1049022 | `unit: 000001EC8B856320` |         |
| face: 2147483647        | (a)   | handle  | 1049023 | `unit: 000001EC8B85C0D0` |         |
| skinId: unknown rawcode | (a)   | handle  | 1049024 | `unit: 000001EC8B805910` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unitid: unknown rawcode) on 3.0.0.24268.

## `nullability-constructors-destructables`

- Probe: `nullability-constructors-destructables`
- Patch: 3.0.0.24268
- Client: 3.0.0.24268
- Date: 2026-10-04
- Run: `abe30d15-8dff-46ee-9f02-3ea816f9d1eb`

### `CreateDestructable`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1048778 | `destructable: 0000017EC9EFF0A0` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1048779 | `destructable: 0000017EC9E002F0` |         |
| x: negative                  | (a)   | handle  | 1048780 | `destructable: 0000017ECBECD3B0` |         |
| x: outside the world         | (a)   | handle  | 1048781 | `destructable: 0000017ECBEB99F0` |         |
| x: 2147483647                | (a)   | handle  | 1048782 | `destructable: 0000017ECB256F40` |         |
| y: 0                         | (a)   | handle  | 1048783 | `destructable: 0000017ECA7525F0` |         |
| y: negative                  | (a)   | handle  | 1048784 | `destructable: 0000017ECAA97660` |         |
| y: outside the world         | (a)   | handle  | 1048785 | `destructable: 0000017ECBBA68D0` |         |
| y: 2147483647                | (a)   | handle  | 1048786 | `destructable: 0000017ECBEBEC40` |         |
| face: 0                      | (a)   | handle  | 1048787 | `destructable: 0000017ECA750BA0` |         |
| face: negative               | (a)   | handle  | 1048788 | `destructable: 0000017ECB1CF2F0` |         |
| face: outside the world      | (a)   | handle  | 1048789 | `destructable: 0000017ECB1ED230` |         |
| face: 2147483647             | (a)   | handle  | 1048790 | `destructable: 0000017ECA51B3C0` |         |
| scale: 0                     | (a)   | handle  | 1048791 | `destructable: 0000017ECBB12440` |         |
| scale: negative              | (a)   | handle  | 1048792 | `destructable: 0000017ECB1D7870` |         |
| scale: outside the world     | (a)   | handle  | 1048793 | `destructable: 0000017ECB1D8E40` |         |
| scale: 2147483647            | (a)   | handle  | 1048794 | `destructable: 0000017ECB470D20` |         |
| variation: negative          | (a)   | handle  | 1048795 | `destructable: 0000017ECBECBFE0` |         |
| variation: outside the world | (a)   | handle  | 1048796 | `destructable: 0000017F725912A0` |         |
| variation: 2147483647        | (a)   | handle  | 1048797 | `destructable: 0000017F6D92B7A0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `CreateDestructableZ`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1048798 | `destructable: 0000017ECA41F770` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1048799 | `destructable: 0000017ECA417430` |         |
| x: negative                  | (a)   | handle  | 1048800 | `destructable: 0000017EC9F09280` |         |
| x: outside the world         | (a)   | handle  | 1048801 | `destructable: 0000017ECBC21480` |         |
| x: 2147483647                | (a)   | handle  | 1048802 | `destructable: 0000017ECBA987F0` |         |
| y: 0                         | (a)   | handle  | 1048803 | `destructable: 0000017ECB52CFC0` |         |
| y: negative                  | (a)   | handle  | 1048804 | `destructable: 0000017ECAA8E7A0` |         |
| y: outside the world         | (a)   | handle  | 1048805 | `destructable: 0000017ECB1CCB50` |         |
| y: 2147483647                | (a)   | handle  | 1048806 | `destructable: 0000017ECB1C7AC0` |         |
| z: negative                  | (a)   | handle  | 1048807 | `destructable: 0000017ECBB9A340` |         |
| z: outside the world         | (a)   | handle  | 1048808 | `destructable: 0000017ECBB96ED0` |         |
| z: 2147483647                | (a)   | handle  | 1048809 | `destructable: 0000017ECBD566C0` |         |
| face: 0                      | (a)   | handle  | 1048810 | `destructable: 0000017ECBB93A10` |         |
| face: negative               | (a)   | handle  | 1048811 | `destructable: 0000017ECBD48C40` |         |
| face: outside the world      | (a)   | handle  | 1048812 | `destructable: 0000017ECB1DC190` |         |
| face: 2147483647             | (a)   | handle  | 1048813 | `destructable: 0000017ECB1C73B0` |         |
| scale: 0                     | (a)   | handle  | 1048814 | `destructable: 0000017ECA51F310` |         |
| scale: negative              | (a)   | handle  | 1048815 | `destructable: 0000017ECA519940` |         |
| scale: outside the world     | (a)   | handle  | 1048816 | `destructable: 0000017ECBB36660` |         |
| scale: 2147483647            | (a)   | handle  | 1048817 | `destructable: 0000017ECBB26490` |         |
| variation: negative          | (a)   | handle  | 1048818 | `destructable: 0000017ECBB1E330` |         |
| variation: outside the world | (a)   | handle  | 1048819 | `destructable: 0000017ECBB23290` |         |
| variation: 2147483647        | (a)   | handle  | 1048820 | `destructable: 0000017ECBB0D0E0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `CreateDeadDestructable`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1048821 | `destructable: 0000017ECB47D0C0` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1048822 | `destructable: 0000017ECBB1BE50` |         |
| x: negative                  | (a)   | handle  | 1048823 | `destructable: 0000017ECB46B760` |         |
| x: outside the world         | (a)   | handle  | 1048824 | `destructable: 0000017ECB457E40` |         |
| x: 2147483647                | (a)   | handle  | 1048825 | `destructable: 0000017ECB44E210` |         |
| y: 0                         | (a)   | handle  | 1048826 | `destructable: 0000017ECB459A70` |         |
| y: negative                  | (a)   | handle  | 1048827 | `destructable: 0000017F6DAAE8A0` |         |
| y: outside the world         | (a)   | handle  | 1048828 | `destructable: 0000017ECBEC6EF0` |         |
| y: 2147483647                | (a)   | handle  | 1048829 | `destructable: 0000017ECBEC86F0` |         |
| face: 0                      | (a)   | handle  | 1048830 | `destructable: 0000017ECBEB67F0` |         |
| face: negative               | (a)   | handle  | 1048831 | `destructable: 0000017ECBEB1D40` |         |
| face: outside the world      | (a)   | handle  | 1048832 | `destructable: 0000017ECA5243B0` |         |
| face: 2147483647             | (a)   | handle  | 1048833 | `destructable: 0000017ECBB9D580` |         |
| scale: 0                     | (a)   | handle  | 1048834 | `destructable: 0000017F6DAB29F0` |         |
| scale: negative              | (a)   | handle  | 1048835 | `destructable: 0000017F76E4AAE0` |         |
| scale: outside the world     | (a)   | handle  | 1048836 | `destructable: 0000017ECB47DC10` |         |
| scale: 2147483647            | (a)   | handle  | 1048837 | `destructable: 0000017ECA525670` |         |
| variation: negative          | (a)   | handle  | 1048838 | `destructable: 0000017ECBEB5E70` |         |
| variation: outside the world | (a)   | handle  | 1048839 | `destructable: 0000017ECBB9E5B0` |         |
| variation: 2147483647        | (a)   | handle  | 1048840 | `destructable: 0000017ECBB10750` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `CreateDeadDestructableZ`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1048841 | `destructable: 0000017ECBC1B6A0` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1048842 | `destructable: 0000017ECA51A810` |         |
| x: negative                  | (a)   | handle  | 1048843 | `destructable: 0000017ECBB2C770` |         |
| x: outside the world         | (a)   | handle  | 1048844 | `destructable: 0000017ECBB206B0` |         |
| x: 2147483647                | (a)   | handle  | 1048845 | `destructable: 0000017ECB4539A0` |         |
| y: 0                         | (a)   | handle  | 1048846 | `destructable: 0000017ECA7558B0` |         |
| y: negative                  | (a)   | handle  | 1048847 | `destructable: 0000017ECA2D1520` |         |
| y: outside the world         | (a)   | handle  | 1048848 | `destructable: 0000017ECA2CDE90` |         |
| y: 2147483647                | (a)   | handle  | 1048849 | `destructable: 0000017ECA2D7B60` |         |
| z: negative                  | (a)   | handle  | 1048850 | `destructable: 0000017F8B429F00` |         |
| z: outside the world         | (a)   | handle  | 1048851 | `destructable: 0000017ECBC18180` |         |
| z: 2147483647                | (a)   | handle  | 1048852 | `destructable: 0000017ECA4131A0` |         |
| face: 0                      | (a)   | handle  | 1048853 | `destructable: 0000017ECBEB46A0` |         |
| face: negative               | (a)   | handle  | 1048854 | `destructable: 0000017ECB1D0420` |         |
| face: outside the world      | (a)   | handle  | 1048855 | `destructable: 0000017ECB9A3390` |         |
| face: 2147483647             | (a)   | handle  | 1048856 | `destructable: 0000017F6DA4CA80` |         |
| scale: 0                     | (a)   | handle  | 1048857 | `destructable: 0000017ECB1C40F0` |         |
| scale: negative              | (a)   | handle  | 1048858 | `destructable: 0000017EC9E083C0` |         |
| scale: outside the world     | (a)   | handle  | 1048859 | `destructable: 0000017ECB577460` |         |
| scale: 2147483647            | (a)   | handle  | 1048860 | `destructable: 0000017ECB576790` |         |
| variation: negative          | (a)   | handle  | 1048861 | `destructable: 0000017ECBB0BF30` |         |
| variation: outside the world | (a)   | handle  | 1048862 | `destructable: 0000017ECB47AFC0` |         |
| variation: 2147483647        | (a)   | handle  | 1048863 | `destructable: 0000017ECB474920` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateDestructableWithSkin`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1048864 | `destructable: 0000017ECBB21A30` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1048865 | `destructable: 0000017ECB45FA70` |         |
| x: negative                  | (a)   | handle  | 1048866 | `destructable: 0000017ECB454690` |         |
| x: outside the world         | (a)   | handle  | 1048867 | `destructable: 0000017EC9F07000` |         |
| x: 2147483647                | (a)   | handle  | 1048868 | `destructable: 0000017ECB44FBE0` |         |
| y: 0                         | (a)   | handle  | 1048869 | `destructable: 0000017EC9E058C0` |         |
| y: negative                  | (a)   | handle  | 1048870 | `destructable: 0000017F6DAA6A40` |         |
| y: outside the world         | (a)   | handle  | 1048871 | `destructable: 0000017ECA753F70` |         |
| y: 2147483647                | (a)   | handle  | 1048872 | `destructable: 0000017ECBB0EF20` |         |
| face: 0                      | (a)   | handle  | 1048873 | `destructable: 0000017ECBBA4F10` |         |
| face: negative               | (a)   | handle  | 1048874 | `destructable: 0000017ECBC1CCF0` |         |
| face: outside the world      | (a)   | handle  | 1048875 | `destructable: 0000017ECA75B8F0` |         |
| face: 2147483647             | (a)   | handle  | 1048876 | `destructable: 0000017ECB1C4D40` |         |
| scale: 0                     | (a)   | handle  | 1048877 | `destructable: 0000017ECBD523F0` |         |
| scale: negative              | (a)   | handle  | 1048878 | `destructable: 0000017ECBA5D970` |         |
| scale: outside the world     | (a)   | handle  | 1048879 | `destructable: 0000017ECBB3A700` |         |
| scale: 2147483647            | (a)   | handle  | 1048880 | `destructable: 0000017ECBB399A0` |         |
| variation: negative          | (a)   | handle  | 1048881 | `destructable: 0000017ECBB135A0` |         |
| variation: outside the world | (a)   | handle  | 1048882 | `destructable: 0000017F6D969770` |         |
| variation: 2147483647        | (a)   | handle  | 1048883 | `destructable: 0000017ECB1D3AC0` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1048884 | `destructable: 0000017EC87211C0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateDestructableZWithSkin`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1048885 | `destructable: 0000017ECA522990` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1048886 | `destructable: 0000017ECBEBE000` |         |
| x: negative                  | (a)   | handle  | 1048887 | `destructable: 0000017ECB016240` |         |
| x: outside the world         | (a)   | handle  | 1048888 | `destructable: 0000017ECBB3EEA0` |         |
| x: 2147483647                | (a)   | handle  | 1048889 | `destructable: 0000017ECB461B70` |         |
| y: 0                         | (a)   | handle  | 1048890 | `destructable: 0000017ECBA1D800` |         |
| y: negative                  | (a)   | handle  | 1048891 | `destructable: 0000017ECBA23890` |         |
| y: outside the world         | (a)   | handle  | 1048892 | `destructable: 0000017ECBA1F8A0` |         |
| y: 2147483647                | (a)   | handle  | 1048893 | `destructable: 0000017ECBA256F0` |         |
| z: negative                  | (a)   | handle  | 1048894 | `destructable: 0000017F72764740` |         |
| z: outside the world         | (a)   | handle  | 1048895 | `destructable: 0000017ECB464180` |         |
| z: 2147483647                | (a)   | handle  | 1048896 | `destructable: 0000017ECB4F5500` |         |
| face: 0                      | (a)   | handle  | 1048897 | `destructable: 0000017ECB4FDCE0` |         |
| face: negative               | (a)   | handle  | 1048898 | `destructable: 0000017ECB506F60` |         |
| face: outside the world      | (a)   | handle  | 1048899 | `destructable: 0000017ECB50DAB0` |         |
| face: 2147483647             | (a)   | handle  | 1048900 | `destructable: 0000017ECB4F91A0` |         |
| scale: 0                     | (a)   | handle  | 1048901 | `destructable: 0000017ECB502480` |         |
| scale: negative              | (a)   | handle  | 1048902 | `destructable: 0000017ECBA1CCA0` |         |
| scale: outside the world     | (a)   | handle  | 1048903 | `destructable: 0000017ECB50A1A0` |         |
| scale: 2147483647            | (a)   | handle  | 1048904 | `destructable: 0000017ECB4F0790` |         |
| variation: negative          | (a)   | handle  | 1048905 | `destructable: 0000017ECB4EBC00` |         |
| variation: outside the world | (a)   | handle  | 1048906 | `destructable: 0000017ECB4F3D00` |         |
| variation: 2147483647        | (a)   | handle  | 1048907 | `destructable: 0000017F8B6DB190` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1048908 | `destructable: 0000017ECB4F7660` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateDeadDestructableWithSkin`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1048909 | `destructable: 0000017F8B6E3BC0` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1048910 | `destructable: 0000017F8B6E4140` |         |
| x: negative                  | (a)   | handle  | 1048911 | `destructable: 0000017F8B6E3840` |         |
| x: outside the world         | (a)   | handle  | 1048912 | `destructable: 0000017ECB477C60` |         |
| x: 2147483647                | (a)   | handle  | 1048913 | `destructable: 0000017F8B6E6860` |         |
| y: 0                         | (a)   | handle  | 1048914 | `destructable: 0000017F8B6EF3D0` |         |
| y: negative                  | (a)   | handle  | 1048915 | `destructable: 0000017ECA518640` |         |
| y: outside the world         | (a)   | handle  | 1048916 | `destructable: 0000017F8B6EA8A0` |         |
| y: 2147483647                | (a)   | handle  | 1048917 | `destructable: 0000017F8B6F70E0` |         |
| face: 0                      | (a)   | handle  | 1048918 | `destructable: 0000017F8B6F69F0` |         |
| face: negative               | (a)   | handle  | 1048919 | `destructable: 0000017F8B6FC8D0` |         |
| face: outside the world      | (a)   | handle  | 1048920 | `destructable: 0000017F8B6F93B0` |         |
| face: 2147483647             | (a)   | handle  | 1048921 | `destructable: 0000017F8B702130` |         |
| scale: 0                     | (a)   | handle  | 1048922 | `destructable: 0000017F8B6FEE00` |         |
| scale: negative              | (a)   | handle  | 1048923 | `destructable: 0000017F8B7096A0` |         |
| scale: outside the world     | (a)   | handle  | 1048924 | `destructable: 0000017F8B70D1D0` |         |
| scale: 2147483647            | (a)   | handle  | 1048925 | `destructable: 0000017F8B70C0D0` |         |
| variation: negative          | (a)   | handle  | 1048926 | `destructable: 0000017F8B711680` |         |
| variation: outside the world | (a)   | handle  | 1048927 | `destructable: 0000017ECB4F0100` |         |
| variation: 2147483647        | (a)   | handle  | 1048928 | `destructable: 0000017F8B716960` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1048929 | `destructable: 0000017F8B71B600` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateDeadDestructableZWithSkin`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1048930 | `destructable: 0000017F8B71C300` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1048931 | `destructable: 0000017F8B721680` |         |
| x: negative                  | (a)   | handle  | 1048932 | `destructable: 0000017F8B7255F0` |         |
| x: outside the world         | (a)   | handle  | 1048933 | `destructable: 0000017F8B7265B0` |         |
| x: 2147483647                | (a)   | handle  | 1048934 | `destructable: 0000017F8B724910` |         |
| y: 0                         | (a)   | handle  | 1048935 | `destructable: 0000017F8B72C040` |         |
| y: negative                  | (a)   | handle  | 1048936 | `destructable: 0000017F8B729300` |         |
| y: outside the world         | (a)   | handle  | 1048937 | `destructable: 0000017F8B733570` |         |
| y: 2147483647                | (a)   | handle  | 1048938 | `destructable: 0000017F8B7365E0` |         |
| z: negative                  | (a)   | handle  | 1048939 | `destructable: 0000017F8B72DC70` |         |
| z: outside the world         | (a)   | handle  | 1048940 | `destructable: 0000017F8B739B00` |         |
| z: 2147483647                | (a)   | handle  | 1048941 | `destructable: 0000017F8B738AB0` |         |
| face: 0                      | (a)   | handle  | 1048942 | `destructable: 0000017F8B741DA0` |         |
| face: negative               | (a)   | handle  | 1048943 | `destructable: 0000017F8B746850` |         |
| face: outside the world      | (a)   | handle  | 1048944 | `destructable: 0000017F8B7472A0` |         |
| face: 2147483647             | (a)   | handle  | 1048945 | `destructable: 0000017F8B7453A0` |         |
| scale: 0                     | (a)   | handle  | 1048946 | `destructable: 0000017F8B74C890` |         |
| scale: negative              | (a)   | handle  | 1048947 | `destructable: 0000017F8B751670` |         |
| scale: outside the world     | (a)   | handle  | 1048948 | `destructable: 0000017F8B751E70` |         |
| scale: 2147483647            | (a)   | handle  | 1048949 | `destructable: 0000017F8B74F920` |         |
| variation: negative          | (a)   | handle  | 1048950 | `destructable: 0000017F8B757980` |         |
| variation: outside the world | (a)   | handle  | 1048951 | `destructable: 0000017F8B7549F0` |         |
| variation: 2147483647        | (a)   | handle  | 1048952 | `destructable: 0000017F8B75CA30` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1048953 | `destructable: 0000017F8B75A2A0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateDestructablePitchRoll`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1048954 | `destructable: 0000017F8B761FD0` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1048955 | `destructable: 0000017F8B75D3C0` |         |
| x: negative                  | (a)   | handle  | 1048956 | `destructable: 0000017F8B76B810` |         |
| x: outside the world         | (a)   | handle  | 1048957 | `destructable: 0000017F8B76A460` |         |
| x: 2147483647                | (a)   | handle  | 1048958 | `destructable: 0000017F8B7734C0` |         |
| y: 0                         | (a)   | handle  | 1048959 | `destructable: 0000017F8B79F430` |         |
| y: negative                  | (a)   | handle  | 1048960 | `destructable: 0000017F8B773380` |         |
| y: outside the world         | (a)   | handle  | 1048961 | `destructable: 0000017F8B7A8A50` |         |
| y: 2147483647                | (a)   | handle  | 1048962 | `destructable: 0000017F8B7A1A30` |         |
| face: 0                      | (a)   | handle  | 1048963 | `destructable: 0000017F8B7A8AF0` |         |
| face: negative               | (a)   | handle  | 1048964 | `destructable: 0000017F8B7A5A10` |         |
| face: outside the world      | (a)   | handle  | 1048965 | `destructable: 0000017F8B7ADFA0` |         |
| face: 2147483647             | (a)   | handle  | 1048966 | `destructable: 0000017F8B7AAD70` |         |
| roll: negative               | (a)   | handle  | 1048967 | `destructable: 0000017F8B7B36F0` |         |
| roll: outside the world      | (a)   | handle  | 1048968 | `destructable: 0000017F8B7C1030` |         |
| roll: 2147483647             | (a)   | handle  | 1048969 | `destructable: 0000017F8B7B8080` |         |
| pitch: negative              | (a)   | handle  | 1048970 | `destructable: 0000017F8B7C10D0` |         |
| pitch: outside the world     | (a)   | handle  | 1048971 | `destructable: 0000017F8B7BC360` |         |
| pitch: 2147483647            | (a)   | handle  | 1048972 | `destructable: 0000017F8B7C6540` |         |
| scale: 0                     | (a)   | handle  | 1048973 | `destructable: 0000017F8B7B5B10` |         |
| scale: negative              | (a)   | handle  | 1048974 | `destructable: 0000017F8B7CBB70` |         |
| scale: outside the world     | (a)   | handle  | 1048975 | `destructable: 0000017F8B7CA3B0` |         |
| scale: 2147483647            | (a)   | handle  | 1048976 | `destructable: 0000017F8B7D5240` |         |
| variation: negative          | (a)   | handle  | 1048977 | `destructable: 0000017F8B7D3340` |         |
| variation: outside the world | (a)   | handle  | 1048978 | `destructable: 0000017F8B7ECE50` |         |
| variation: 2147483647        | (a)   | handle  | 1048979 | `destructable: 0000017F8B7D2C80` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateDestructableZPitchRoll`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1048980 | `destructable: 0000017F8B7F3A40` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1048981 | `destructable: 0000017F8B7FCCB0` |         |
| x: negative                  | (a)   | handle  | 1048982 | `destructable: 0000017F8B7FE060` |         |
| x: outside the world         | (a)   | handle  | 1048983 | `destructable: 0000017F8B7F0060` |         |
| x: 2147483647                | (a)   | handle  | 1048984 | `destructable: 0000017F8B807210` |         |
| y: 0                         | (a)   | handle  | 1048985 | `destructable: 0000017F8B804610` |         |
| y: negative                  | (a)   | handle  | 1048986 | `destructable: 0000017F8B8076C0` |         |
| y: outside the world         | (a)   | handle  | 1048987 | `destructable: 0000017F8B80C1F0` |         |
| y: 2147483647                | (a)   | handle  | 1048988 | `destructable: 0000017F8B80CA20` |         |
| z: negative                  | (a)   | handle  | 1048989 | `destructable: 0000017F8B8099F0` |         |
| z: outside the world         | (a)   | handle  | 1048990 | `destructable: 0000017F8B812540` |         |
| z: 2147483647                | (a)   | handle  | 1048991 | `destructable: 0000017F8B8109D0` |         |
| face: 0                      | (a)   | handle  | 1048992 | `destructable: 0000017F8B817C30` |         |
| face: negative               | (a)   | handle  | 1048993 | `destructable: 0000017F8B8159F0` |         |
| face: outside the world      | (a)   | handle  | 1048994 | `destructable: 0000017F8B6EDEE0` |         |
| face: 2147483647             | (a)   | handle  | 1048995 | `destructable: 0000017F8B8450A0` |         |
| roll: negative               | (a)   | handle  | 1048996 | `destructable: 0000017F8B84BB70` |         |
| roll: outside the world      | (a)   | handle  | 1048997 | `destructable: 0000017F8B81BB80` |         |
| roll: 2147483647             | (a)   | handle  | 1048998 | `destructable: 0000017F8B850910` |         |
| pitch: negative              | (a)   | handle  | 1048999 | `destructable: 0000017F8B84F530` |         |
| pitch: outside the world     | (a)   | handle  | 1049000 | `destructable: 0000017F8B856000` |         |
| pitch: 2147483647            | (a)   | handle  | 1049001 | `destructable: 0000017F8B853270` |         |
| scale: 0                     | (a)   | handle  | 1049002 | `destructable: 0000017F8B85B5A0` |         |
| scale: negative              | (a)   | handle  | 1049003 | `destructable: 0000017F8B85F4D0` |         |
| scale: outside the world     | (a)   | handle  | 1049004 | `destructable: 0000017F8B861180` |         |
| scale: 2147483647            | (a)   | handle  | 1049005 | `destructable: 0000017F8B8632C0` |         |
| variation: negative          | (a)   | handle  | 1049006 | `destructable: 0000017F8B866240` |         |
| variation: outside the world | (a)   | handle  | 1049007 | `destructable: 0000017F8B8688A0` |         |
| variation: 2147483647        | (a)   | handle  | 1049008 | `destructable: 0000017F8B86D000` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateDeadDestructablePitchRoll`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049009 | `destructable: 0000017F8B86A060` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049010 | `destructable: 0000017F8B876AB0` |         |
| x: negative                  | (a)   | handle  | 1049011 | `destructable: 0000017F8B875590` |         |
| x: outside the world         | (a)   | handle  | 1049012 | `destructable: 0000017F8B878800` |         |
| x: 2147483647                | (a)   | handle  | 1049013 | `destructable: 0000017F8B87B120` |         |
| y: 0                         | (a)   | handle  | 1049014 | `destructable: 0000017F8B87FC40` |         |
| y: negative                  | (a)   | handle  | 1049015 | `destructable: 0000017F8B882160` |         |
| y: outside the world         | (a)   | handle  | 1049016 | `destructable: 0000017F8B885190` |         |
| y: 2147483647                | (a)   | handle  | 1049017 | `destructable: 0000017F8B88A090` |         |
| face: 0                      | (a)   | handle  | 1049018 | `destructable: 0000017F8B88A800` |         |
| face: negative               | (a)   | handle  | 1049019 | `destructable: 0000017F8B888960` |         |
| face: outside the world      | (a)   | handle  | 1049020 | `destructable: 0000017F8B897FF0` |         |
| face: 2147483647             | (a)   | handle  | 1049021 | `destructable: 0000017F8B89CA20` |         |
| roll: negative               | (a)   | handle  | 1049022 | `destructable: 0000017F8B89EFF0` |         |
| roll: outside the world      | (a)   | handle  | 1049023 | `destructable: 0000017F8B8A4010` |         |
| roll: 2147483647             | (a)   | handle  | 1049024 | `destructable: 0000017F8B8A9C00` |         |
| pitch: negative              | (a)   | handle  | 1049025 | `destructable: 0000017F8B8A4620` |         |
| pitch: outside the world     | (a)   | handle  | 1049026 | `destructable: 0000017F8B8A9610` |         |
| pitch: 2147483647            | (a)   | handle  | 1049027 | `destructable: 0000017F8B8AC800` |         |
| scale: 0                     | (a)   | handle  | 1049028 | `destructable: 0000017F8B8AF470` |         |
| scale: negative              | (a)   | handle  | 1049029 | `destructable: 0000017F8B8B1F80` |         |
| scale: outside the world     | (a)   | handle  | 1049030 | `destructable: 0000017F8B8B6D20` |         |
| scale: 2147483647            | (a)   | handle  | 1049031 | `destructable: 0000017F8B8B77A0` |         |
| variation: negative          | (a)   | handle  | 1049032 | `destructable: 0000017F8B8BCF20` |         |
| variation: outside the world | (a)   | handle  | 1049033 | `destructable: 0000017F8B8C18B0` |         |
| variation: 2147483647        | (a)   | handle  | 1049034 | `destructable: 0000017F8B8C5680` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateDeadDestructableZPitchRoll`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049035 | `destructable: 0000017F8B8C1E00` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049036 | `destructable: 0000017F8B8CE500` |         |
| x: negative                  | (a)   | handle  | 1049037 | `destructable: 0000017F8B8FFAF0` |         |
| x: outside the world         | (a)   | handle  | 1049038 | `destructable: 0000017F8B904250` |         |
| x: 2147483647                | (a)   | handle  | 1049039 | `destructable: 0000017F8B9029B0` |         |
| y: 0                         | (a)   | handle  | 1049040 | `destructable: 0000017F8B906580` |         |
| y: negative                  | (a)   | handle  | 1049041 | `destructable: 0000017F8B90AC70` |         |
| y: outside the world         | (a)   | handle  | 1049042 | `destructable: 0000017F8B908AA0` |         |
| y: 2147483647                | (a)   | handle  | 1049043 | `destructable: 0000017F8B90E280` |         |
| z: negative                  | (a)   | handle  | 1049044 | `destructable: 0000017F8B9136D0` |         |
| z: outside the world         | (a)   | handle  | 1049045 | `destructable: 0000017F8B916670` |         |
| z: 2147483647                | (a)   | handle  | 1049046 | `destructable: 0000017F8B91B1E0` |         |
| face: 0                      | (a)   | handle  | 1049047 | `destructable: 0000017F8B919620` |         |
| face: negative               | (a)   | handle  | 1049048 | `destructable: 0000017F8B91D810` |         |
| face: outside the world      | (a)   | handle  | 1049049 | `destructable: 0000017F8B9219A0` |         |
| face: 2147483647             | (a)   | handle  | 1049050 | `destructable: 0000017F8B920990` |         |
| roll: negative               | (a)   | handle  | 1049051 | `destructable: 0000017F8B925BA0` |         |
| roll: outside the world      | (a)   | handle  | 1049052 | `destructable: 0000017F8B929680` |         |
| roll: 2147483647             | (a)   | handle  | 1049053 | `destructable: 0000017F8B928C30` |         |
| pitch: negative              | (a)   | handle  | 1049054 | `destructable: 0000017F8B92DF30` |         |
| pitch: outside the world     | (a)   | handle  | 1049055 | `destructable: 0000017F8B932320` |         |
| pitch: 2147483647            | (a)   | handle  | 1049056 | `destructable: 0000017F8B9300C0` |         |
| scale: 0                     | (a)   | handle  | 1049057 | `destructable: 0000017F8B937920` |         |
| scale: negative              | (a)   | handle  | 1049058 | `destructable: 0000017F8B93B3A0` |         |
| scale: outside the world     | (a)   | handle  | 1049059 | `destructable: 0000017F8B93E020` |         |
| scale: 2147483647            | (a)   | handle  | 1049060 | `destructable: 0000017F8B942260` |         |
| variation: negative          | (a)   | handle  | 1049061 | `destructable: 0000017ECBB9AD90` |         |
| variation: outside the world | (a)   | handle  | 1049062 | `destructable: 0000017F8B944C20` |         |
| variation: 2147483647        | (a)   | handle  | 1049063 | `destructable: 0000017F8B948D10` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateDestructableWithSkinPitchRoll`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049064 | `destructable: 0000017F8B947D40` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049065 | `destructable: 0000017F8B950530` |         |
| x: negative                  | (a)   | handle  | 1049066 | `destructable: 0000017F8B940D10` |         |
| x: outside the world         | (a)   | handle  | 1049067 | `destructable: 0000017F8B955180` |         |
| x: 2147483647                | (a)   | handle  | 1049068 | `destructable: 0000017F8B959A20` |         |
| y: 0                         | (a)   | handle  | 1049069 | `destructable: 0000017F8B957BB0` |         |
| y: negative                  | (a)   | handle  | 1049070 | `destructable: 0000017F8B95CCD0` |         |
| y: outside the world         | (a)   | handle  | 1049071 | `destructable: 0000017F8B960C10` |         |
| y: 2147483647                | (a)   | handle  | 1049072 | `destructable: 0000017F8B95ECB0` |         |
| face: 0                      | (a)   | handle  | 1049073 | `destructable: 0000017F8B96E250` |         |
| face: negative               | (a)   | handle  | 1049074 | `destructable: 0000017F8B96A170` |         |
| face: outside the world      | (a)   | handle  | 1049075 | `destructable: 0000017F8B969510` |         |
| face: 2147483647             | (a)   | handle  | 1049076 | `destructable: 0000017F8B96E430` |         |
| roll: negative               | (a)   | handle  | 1049077 | `destructable: 0000017F8B972080` |         |
| roll: outside the world      | (a)   | handle  | 1049078 | `destructable: 0000017F8B970C20` |         |
| roll: 2147483647             | (a)   | handle  | 1049079 | `destructable: 0000017F8B97DF20` |         |
| pitch: negative              | (a)   | handle  | 1049080 | `destructable: 0000017F8B97A940` |         |
| pitch: outside the world     | (a)   | handle  | 1049081 | `destructable: 0000017F8B97A0C0` |         |
| pitch: 2147483647            | (a)   | handle  | 1049082 | `destructable: 0000017F8B97E610` |         |
| scale: 0                     | (a)   | handle  | 1049083 | `destructable: 0000017F8B985DE0` |         |
| scale: negative              | (a)   | handle  | 1049084 | `destructable: 0000017F8B986760` |         |
| scale: outside the world     | (a)   | handle  | 1049085 | `destructable: 0000017F8B98B030` |         |
| scale: 2147483647            | (a)   | handle  | 1049086 | `destructable: 0000017F8B9827E0` |         |
| variation: negative          | (a)   | handle  | 1049087 | `destructable: 0000017F8B98E9F0` |         |
| variation: outside the world | (a)   | handle  | 1049088 | `destructable: 0000017F8B992A70` |         |
| variation: 2147483647        | (a)   | handle  | 1049089 | `destructable: 0000017F8B98E0C0` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1049090 | `destructable: 0000017F8B995C40` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateDestructableZWithSkinPitchRoll`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049091 | `destructable: 0000017F8B999740` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049092 | `destructable: 0000017F8B9A2870` |         |
| x: negative                  | (a)   | handle  | 1049093 | `destructable: 0000017F8B9A63C0` |         |
| x: outside the world         | (a)   | handle  | 1049094 | `destructable: 0000017F8B99C210` |         |
| x: 2147483647                | (a)   | handle  | 1049095 | `destructable: 0000017F8B9CB930` |         |
| y: 0                         | (a)   | handle  | 1049096 | `destructable: 0000017F8B9D35B0` |         |
| y: negative                  | (a)   | handle  | 1049097 | `destructable: 0000017F8B9D7850` |         |
| y: outside the world         | (a)   | handle  | 1049098 | `destructable: 0000017F8B9D9B40` |         |
| y: 2147483647                | (a)   | handle  | 1049099 | `destructable: 0000017F8B9DC9F0` |         |
| z: negative                  | (a)   | handle  | 1049100 | `destructable: 0000017F8B9E0140` |         |
| z: outside the world         | (a)   | handle  | 1049101 | `destructable: 0000017F8B9DF9F0` |         |
| z: 2147483647                | (a)   | handle  | 1049102 | `destructable: 0000017F8B9E4580` |         |
| face: 0                      | (a)   | handle  | 1049103 | `destructable: 0000017F8B9E9970` |         |
| face: negative               | (a)   | handle  | 1049104 | `destructable: 0000017F8B9E7AE0` |         |
| face: outside the world      | (a)   | handle  | 1049105 | `destructable: 0000017F8B9EC660` |         |
| face: 2147483647             | (a)   | handle  | 1049106 | `destructable: 0000017F8B9F0690` |         |
| roll: negative               | (a)   | handle  | 1049107 | `destructable: 0000017F8B9E2650` |         |
| roll: outside the world      | (a)   | handle  | 1049108 | `destructable: 0000017F8B9F78B0` |         |
| roll: 2147483647             | (a)   | handle  | 1049109 | `destructable: 0000017F8B9F6C10` |         |
| pitch: negative              | (a)   | handle  | 1049110 | `destructable: 0000017F8BA0B670` |         |
| pitch: outside the world     | (a)   | handle  | 1049111 | `destructable: 0000017F8BA102D0` |         |
| pitch: 2147483647            | (a)   | handle  | 1049112 | `destructable: 0000017F8BA0F780` |         |
| scale: 0                     | (a)   | handle  | 1049113 | `destructable: 0000017F8BA13B30` |         |
| scale: negative              | (a)   | handle  | 1049114 | `destructable: 0000017F8BA181F0` |         |
| scale: outside the world     | (a)   | handle  | 1049115 | `destructable: 0000017F8B9FB3A0` |         |
| scale: 2147483647            | (a)   | handle  | 1049116 | `destructable: 0000017F8BA1BB80` |         |
| variation: negative          | (a)   | handle  | 1049117 | `destructable: 0000017F8BA208E0` |         |
| variation: outside the world | (a)   | handle  | 1049118 | `destructable: 0000017F8BA1AA20` |         |
| variation: 2147483647        | (a)   | handle  | 1049119 | `destructable: 0000017F8BA24340` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1049120 | `destructable: 0000017F8BA28C20` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateDeadDestructableWithSkinPitchRoll`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049121 | `destructable: 0000017F8BA27D20` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049122 | `destructable: 0000017F8BA30860` |         |
| x: negative                  | (a)   | handle  | 1049123 | `destructable: 0000017F8BA2AAF0` |         |
| x: outside the world         | (a)   | handle  | 1049124 | `destructable: 0000017F8BA5BF80` |         |
| x: 2147483647                | (a)   | handle  | 1049125 | `destructable: 0000017F8BA61210` |         |
| y: 0                         | (a)   | handle  | 1049126 | `destructable: 0000017F8BA60790` |         |
| y: negative                  | (a)   | handle  | 1049127 | `destructable: 0000017F8B84B130` |         |
| y: outside the world         | (a)   | handle  | 1049128 | `destructable: 0000017F8B84AD80` |         |
| y: 2147483647                | (a)   | handle  | 1049129 | `destructable: 0000017F8BA6A180` |         |
| face: 0                      | (a)   | handle  | 1049130 | `destructable: 0000017F8BA6E400` |         |
| face: negative               | (a)   | handle  | 1049131 | `destructable: 0000017F8BA72E00` |         |
| face: outside the world      | (a)   | handle  | 1049132 | `destructable: 0000017F8BA724D0` |         |
| face: 2147483647             | (a)   | handle  | 1049133 | `destructable: 0000017F8BA76BC0` |         |
| roll: negative               | (a)   | handle  | 1049134 | `destructable: 0000017F8BA7CA80` |         |
| roll: outside the world      | (a)   | handle  | 1049135 | `destructable: 0000017F8BA75010` |         |
| roll: 2147483647             | (a)   | handle  | 1049136 | `destructable: 0000017F8BA7F0B0` |         |
| pitch: negative              | (a)   | handle  | 1049137 | `destructable: 0000017F8BA84320` |         |
| pitch: outside the world     | (a)   | handle  | 1049138 | `destructable: 0000017F8BA833D0` |         |
| pitch: 2147483647            | (a)   | handle  | 1049139 | `destructable: 0000017F8BA87600` |         |
| scale: 0                     | (a)   | handle  | 1049140 | `destructable: 0000017F8BA8CA80` |         |
| scale: negative              | (a)   | handle  | 1049141 | `destructable: 0000017F8BA8C140` |         |
| scale: outside the world     | (a)   | handle  | 1049142 | `destructable: 0000017F8BA8FAC0` |         |
| scale: 2147483647            | (a)   | handle  | 1049143 | `destructable: 0000017F8BA94ED0` |         |
| variation: negative          | (a)   | handle  | 1049144 | `destructable: 0000017F8BA94420` |         |
| variation: outside the world | (a)   | handle  | 1049145 | `destructable: 0000017F8BA94BB0` |         |
| variation: 2147483647        | (a)   | handle  | 1049146 | `destructable: 0000017F8B84B5F0` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1049147 | `destructable: 0000017F8BA7C7D0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateDeadDestructableZWithSkinPitchRoll`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049148 | `destructable: 0000017F8B9E2CC0` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049149 | `destructable: 0000017F8B9A61B0` |         |
| x: negative                  | (a)   | handle  | 1049150 | `destructable: 0000017F8B96DE90` |         |
| x: outside the world         | (a)   | handle  | 1049151 | `destructable: 0000017F8B947550` |         |
| x: 2147483647                | (a)   | handle  | 1049152 | `destructable: 0000017F8B920ED0` |         |
| y: 0                         | (a)   | handle  | 1049153 | `destructable: 0000017F8B91FFD0` |         |
| y: negative                  | (a)   | handle  | 1049154 | `destructable: 0000017F8B8C1B10` |         |
| y: outside the world         | (a)   | handle  | 1049155 | `destructable: 0000017F8B89C920` |         |
| y: 2147483647                | (a)   | handle  | 1049156 | `destructable: 0000017F8B868DC0` |         |
| z: negative                  | (a)   | handle  | 1049157 | `destructable: 0000017F8B89EEF0` |         |
| z: outside the world         | (a)   | handle  | 1049158 | `destructable: 0000017F8B8B0A20` |         |
| z: 2147483647                | (a)   | handle  | 1049159 | `destructable: 0000017F8B7FD4B0` |         |
| face: 0                      | (a)   | handle  | 1049160 | `destructable: 0000017F8B7D4DF0` |         |
| face: negative               | (a)   | handle  | 1049161 | `destructable: 0000017F8B7B2CA0` |         |
| face: outside the world      | (a)   | handle  | 1049162 | `destructable: 0000017F8B745280` |         |
| face: 2147483647             | (a)   | handle  | 1049163 | `destructable: 0000017F8B747130` |         |
| roll: negative               | (a)   | handle  | 1049164 | `destructable: 0000017F8B71EE60` |         |
| roll: outside the world      | (a)   | handle  | 1049165 | `destructable: 0000017ECB4F24E0` |         |
| roll: 2147483647             | (a)   | handle  | 1049166 | `destructable: 0000017ECBA1FA60` |         |
| pitch: negative              | (a)   | handle  | 1049167 | `destructable: 0000017F8B868960` |         |
| pitch: outside the world     | (a)   | handle  | 1049168 | `destructable: 0000017F8BA978E0` |         |
| pitch: 2147483647            | (a)   | handle  | 1049169 | `destructable: 0000017F8B9037E0` |         |
| scale: 0                     | (a)   | handle  | 1049170 | `destructable: 0000017ECBB22120` |         |
| scale: negative              | (a)   | handle  | 1049171 | `destructable: 0000017ECBC16170` |         |
| scale: outside the world     | (a)   | handle  | 1049172 | `destructable: 0000017ECBEC9A70` |         |
| scale: 2147483647            | (a)   | handle  | 1049173 | `destructable: 0000017ECBA8FBA0` |         |
| variation: negative          | (a)   | handle  | 1049174 | `destructable: 0000017EC9F09C90` |         |
| variation: outside the world | (a)   | handle  | 1049175 | `destructable: 0000017F6DA3A040` |         |
| variation: 2147483647        | (a)   | handle  | 1049176 | `destructable: 0000017ECBB97BC0` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1049177 | `destructable: 0000017EC9DFBEB0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateDestructableWithColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049178 | `destructable: 0000017ECBB10140` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049179 | `destructable: 0000017F76E3CAC0` |         |
| x: negative                  | (a)   | handle  | 1049180 | `destructable: 0000017ECAA8BC40` |         |
| x: outside the world         | (a)   | handle  | 1049181 | `destructable: 0000017F6DA47A60` |         |
| x: 2147483647                | (a)   | handle  | 1049182 | `destructable: 0000017F76E50AC0` |         |
| y: 0                         | (a)   | handle  | 1049183 | `destructable: 0000017ECB1EA0C0` |         |
| y: negative                  | (a)   | handle  | 1049184 | `destructable: 0000017ECA414740` |         |
| y: outside the world         | (a)   | handle  | 1049185 | `destructable: 0000017ECBB93B00` |         |
| y: 2147483647                | (a)   | handle  | 1049186 | `destructable: 0000017F76E54BE0` |         |
| face: 0                      | (a)   | handle  | 1049187 | `destructable: 0000017ECB1D1BE0` |         |
| face: negative               | (a)   | handle  | 1049188 | `destructable: 0000017ECA51EE20` |         |
| face: outside the world      | (a)   | handle  | 1049189 | `destructable: 0000017ECB1EDFB0` |         |
| face: 2147483647             | (a)   | handle  | 1049190 | `destructable: 0000017ECBD51B10` |         |
| scale: 0                     | (a)   | handle  | 1049191 | `destructable: 0000017F72425920` |         |
| scale: negative              | (a)   | handle  | 1049192 | `destructable: 0000017ECA730FD0` |         |
| scale: outside the world     | (a)   | handle  | 1049193 | `destructable: 0000017ECBEABCD0` |         |
| scale: 2147483647            | (a)   | handle  | 1049194 | `destructable: 0000017ECBB34C20` |         |
| variation: negative          | (a)   | handle  | 1049195 | `destructable: 0000017ECBB97050` |         |
| variation: outside the world | (a)   | handle  | 1049196 | `destructable: 0000017ECBB16620` |         |
| variation: 2147483647        | (a)   | handle  | 1049197 | `destructable: 0000017ECBA95C80` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateDestructableZWithColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049198 | `destructable: 0000017F8B4353A0` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049199 | `destructable: 0000017ECB1D21E0` |         |
| x: negative                  | (a)   | handle  | 1049200 | `destructable: 0000017ECBB1FA30` |         |
| x: outside the world         | (a)   | handle  | 1049201 | `destructable: 0000017F8B909F00` |         |
| x: 2147483647                | (a)   | handle  | 1049202 | `destructable: 0000017F8B42A2E0` |         |
| y: 0                         | (a)   | handle  | 1049203 | `destructable: 0000017ECBB2E140` |         |
| y: negative                  | (a)   | handle  | 1049204 | `destructable: 0000017F8B766F20` |         |
| y: outside the world         | (a)   | handle  | 1049205 | `destructable: 0000017ECB522860` |         |
| y: 2147483647                | (a)   | handle  | 1049206 | `destructable: 0000017ECA75DF50` |         |
| z: negative                  | (a)   | handle  | 1049207 | `destructable: 0000017ECB504280` |         |
| z: outside the world         | (a)   | handle  | 1049208 | `destructable: 0000017F8B865A50` |         |
| z: 2147483647                | (a)   | handle  | 1049209 | `destructable: 0000017ECBA98A80` |         |
| face: 0                      | (a)   | handle  | 1049210 | `destructable: 0000017F8B8A8050` |         |
| face: negative               | (a)   | handle  | 1049211 | `destructable: 0000017ECB527810` |         |
| face: outside the world      | (a)   | handle  | 1049212 | `destructable: 0000017ECB6A39E0` |         |
| face: 2147483647             | (a)   | handle  | 1049213 | `destructable: 0000017F8B871250` |         |
| scale: 0                     | (a)   | handle  | 1049214 | `destructable: 0000017ECB57A530` |         |
| scale: negative              | (a)   | handle  | 1049215 | `destructable: 0000017ECBB3DD60` |         |
| scale: outside the world     | (a)   | handle  | 1049216 | `destructable: 0000017F8B6E6630` |         |
| scale: 2147483647            | (a)   | handle  | 1049217 | `destructable: 0000017F8B888F80` |         |
| variation: negative          | (a)   | handle  | 1049218 | `destructable: 0000017F8B70C9B0` |         |
| variation: outside the world | (a)   | handle  | 1049219 | `destructable: 0000017F8B8555E0` |         |
| variation: 2147483647        | (a)   | handle  | 1049220 | `destructable: 0000017ECA2CA460` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateDeadDestructableWithColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049221 | `destructable: 0000017F8B7CF370` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049222 | `destructable: 0000017F8B7A7FD0` |         |
| x: negative                  | (a)   | handle  | 1049223 | `destructable: 0000017F8B87BDF0` |         |
| x: outside the world         | (a)   | handle  | 1049224 | `destructable: 0000017ECAA94470` |         |
| x: 2147483647                | (a)   | handle  | 1049225 | `destructable: 0000017ECBEC3A20` |         |
| y: 0                         | (a)   | handle  | 1049226 | `destructable: 0000017F8B7AC2D0` |         |
| y: negative                  | (a)   | handle  | 1049227 | `destructable: 0000017ECBEBA740` |         |
| y: outside the world         | (a)   | handle  | 1049228 | `destructable: 0000017ECA5254F0` |         |
| y: 2147483647                | (a)   | handle  | 1049229 | `destructable: 0000017ECBA97F40` |         |
| face: 0                      | (a)   | handle  | 1049230 | `destructable: 0000017ECA520D80` |         |
| face: negative               | (a)   | handle  | 1049231 | `destructable: 0000017F8BA289E0` |         |
| face: outside the world      | (a)   | handle  | 1049232 | `destructable: 0000017ECB461880` |         |
| face: 2147483647             | (a)   | handle  | 1049233 | `destructable: 0000017ECBECCDE0` |         |
| scale: 0                     | (a)   | handle  | 1049234 | `destructable: 0000017ECBC1C290` |         |
| scale: negative              | (a)   | handle  | 1049235 | `destructable: 0000017F8B73D270` |         |
| scale: outside the world     | (a)   | handle  | 1049236 | `destructable: 0000017F8B976910` |         |
| scale: 2147483647            | (a)   | handle  | 1049237 | `destructable: 0000017F8B8857B0` |         |
| variation: negative          | (a)   | handle  | 1049238 | `destructable: 0000017F8B754E70` |         |
| variation: outside the world | (a)   | handle  | 1049239 | `destructable: 0000017F8BA2AD80` |         |
| variation: 2147483647        | (a)   | handle  | 1049240 | `destructable: 0000017F6DAA68E0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateDeadDestructableZWithColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049241 | `destructable: 0000017ECB45C3D0` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049242 | `destructable: 0000017F8B757B00` |         |
| x: negative                  | (a)   | handle  | 1049243 | `destructable: 0000017F8B8A35C0` |         |
| x: outside the world         | (a)   | handle  | 1049244 | `destructable: 0000017F8B999120` |         |
| x: 2147483647                | (a)   | handle  | 1049245 | `destructable: 0000017ECBB36EA0` |         |
| y: 0                         | (a)   | handle  | 1049246 | `destructable: 0000017F8BA238C0` |         |
| y: negative                  | (a)   | handle  | 1049247 | `destructable: 0000017ECBB27700` |         |
| y: outside the world         | (a)   | handle  | 1049248 | `destructable: 0000017F8B965870` |         |
| y: 2147483647                | (a)   | handle  | 1049249 | `destructable: 0000017F8B870480` |         |
| z: negative                  | (a)   | handle  | 1049250 | `destructable: 0000017ECBA244E0` |         |
| z: outside the world         | (a)   | handle  | 1049251 | `destructable: 0000017F8B746470` |         |
| z: 2147483647                | (a)   | handle  | 1049252 | `destructable: 0000017F8B883200` |         |
| face: 0                      | (a)   | handle  | 1049253 | `destructable: 0000017ECAEF6EA0` |         |
| face: negative               | (a)   | handle  | 1049254 | `destructable: 0000017ECBEB2480` |         |
| face: outside the world      | (a)   | handle  | 1049255 | `destructable: 0000017ECBD4CB90` |         |
| face: 2147483647             | (a)   | handle  | 1049256 | `destructable: 0000017F8B7B0BB0` |         |
| scale: 0                     | (a)   | handle  | 1049257 | `destructable: 0000017F8B817E80` |         |
| scale: negative              | (a)   | handle  | 1049258 | `destructable: 0000017F8B432F70` |         |
| scale: outside the world     | (a)   | handle  | 1049259 | `destructable: 0000017F8B94C310` |         |
| scale: 2147483647            | (a)   | handle  | 1049260 | `destructable: 0000017F8B768430` |         |
| variation: negative          | (a)   | handle  | 1049261 | `destructable: 0000017ECB46F080` |         |
| variation: outside the world | (a)   | handle  | 1049262 | `destructable: 0000017F8B9A7EA0` |         |
| variation: 2147483647        | (a)   | handle  | 1049263 | `destructable: 0000017F8BA93B70` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateDestructableWithSkinColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049264 | `destructable: 0000017F6DAAD160` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049265 | `destructable: 0000017ECBB2A060` |         |
| x: negative                  | (a)   | handle  | 1049266 | `destructable: 0000017ECB50CE80` |         |
| x: outside the world         | (a)   | handle  | 1049267 | `destructable: 0000017ECBD53D80` |         |
| x: 2147483647                | (a)   | handle  | 1049268 | `destructable: 0000017F8B87A8E0` |         |
| y: 0                         | (a)   | handle  | 1049269 | `destructable: 0000017F8B6F0DE0` |         |
| y: negative                  | (a)   | handle  | 1049270 | `destructable: 0000017ECB5321C0` |         |
| y: outside the world         | (a)   | handle  | 1049271 | `destructable: 0000017ECBB38150` |         |
| y: 2147483647                | (a)   | handle  | 1049272 | `destructable: 0000017F725C58D0` |         |
| face: 0                      | (a)   | handle  | 1049273 | `destructable: 0000017F8B95BA30` |         |
| face: negative               | (a)   | handle  | 1049274 | `destructable: 0000017F8B769910` |         |
| face: outside the world      | (a)   | handle  | 1049275 | `destructable: 0000017F8B7CF950` |         |
| face: 2147483647             | (a)   | handle  | 1049276 | `destructable: 0000017ECBD53F30` |         |
| scale: 0                     | (a)   | handle  | 1049277 | `destructable: 0000017F76E4EB80` |         |
| scale: negative              | (a)   | handle  | 1049278 | `destructable: 0000017F8B7A5010` |         |
| scale: outside the world     | (a)   | handle  | 1049279 | `destructable: 0000017F8B7AF8E0` |         |
| scale: 2147483647            | (a)   | handle  | 1049280 | `destructable: 0000017ECBC189D0` |         |
| variation: negative          | (a)   | handle  | 1049281 | `destructable: 0000017F8B7C80C0` |         |
| variation: outside the world | (a)   | handle  | 1049282 | `destructable: 0000017F8B7EFDC0` |         |
| variation: 2147483647        | (a)   | handle  | 1049283 | `destructable: 0000017ECB2574C0` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1049284 | `destructable: 0000017F8BA2BB30` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateDestructableZWithSkinColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049285 | `destructable: 0000017F8BAAFF20` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049286 | `destructable: 0000017F8B84DDE0` |         |
| x: negative                  | (a)   | handle  | 1049287 | `destructable: 0000017ECB1CBD70` |         |
| x: outside the world         | (a)   | handle  | 1049288 | `destructable: 0000017ECBEB3BE0` |         |
| x: 2147483647                | (a)   | handle  | 1049289 | `destructable: 0000017F8B73A010` |         |
| y: 0                         | (a)   | handle  | 1049290 | `destructable: 0000017EC9E08A50` |         |
| y: negative                  | (a)   | handle  | 1049291 | `destructable: 0000017F8B9F35D0` |         |
| y: outside the world         | (a)   | handle  | 1049292 | `destructable: 0000017F8B6F8870` |         |
| y: 2147483647                | (a)   | handle  | 1049293 | `destructable: 0000017ECBA23FC0` |         |
| z: negative                  | (a)   | handle  | 1049294 | `destructable: 0000017F8B9DE1A0` |         |
| z: outside the world         | (a)   | handle  | 1049295 | `destructable: 0000017F8B907C10` |         |
| z: 2147483647                | (a)   | handle  | 1049296 | `destructable: 0000017F8B8627F0` |         |
| face: 0                      | (a)   | handle  | 1049297 | `destructable: 0000017F8B7BA4C0` |         |
| face: negative               | (a)   | handle  | 1049298 | `destructable: 0000017F8B727C40` |         |
| face: outside the world      | (a)   | handle  | 1049299 | `destructable: 0000017ECB4FEC40` |         |
| face: 2147483647             | (a)   | handle  | 1049300 | `destructable: 0000017F8B973A40` |         |
| scale: 0                     | (a)   | handle  | 1049301 | `destructable: 0000017F8B92ABF0` |         |
| scale: negative              | (a)   | handle  | 1049302 | `destructable: 0000017F8B7C2C60` |         |
| scale: outside the world     | (a)   | handle  | 1049303 | `destructable: 0000017F8B9E6300` |         |
| scale: 2147483647            | (a)   | handle  | 1049304 | `destructable: 0000017F8B7CAA50` |         |
| variation: negative          | (a)   | handle  | 1049305 | `destructable: 0000017ECA415250` |         |
| variation: outside the world | (a)   | handle  | 1049306 | `destructable: 0000017ECB47D690` |         |
| variation: 2147483647        | (a)   | handle  | 1049307 | `destructable: 0000017ECBEE2530` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1049308 | `destructable: 0000017ECB5013C0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateDeadDestructableWithSkinColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049309 | `destructable: 0000017F8B75EA40` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049310 | `destructable: 0000017F8B9754C0` |         |
| x: negative                  | (a)   | handle  | 1049311 | `destructable: 0000017F8B72A4A0` |         |
| x: outside the world         | (a)   | handle  | 1049312 | `destructable: 0000017F8B766140` |         |
| x: 2147483647                | (a)   | handle  | 1049313 | `destructable: 0000017F8B985800` |         |
| y: 0                         | (a)   | handle  | 1049314 | `destructable: 0000017F8B7A7030` |         |
| y: negative                  | (a)   | handle  | 1049315 | `destructable: 0000017F8BA7AF80` |         |
| y: outside the world         | (a)   | handle  | 1049316 | `destructable: 0000017F8B765680` |         |
| y: 2147483647                | (a)   | handle  | 1049317 | `destructable: 0000017F8B8BEB60` |         |
| face: 0                      | (a)   | handle  | 1049318 | `destructable: 0000017F8B867F80` |         |
| face: negative               | (a)   | handle  | 1049319 | `destructable: 0000017F8B6E2790` |         |
| face: outside the world      | (a)   | handle  | 1049320 | `destructable: 0000017ECBEE1D40` |         |
| face: 2147483647             | (a)   | handle  | 1049321 | `destructable: 0000017F8BA0D0A0` |         |
| scale: 0                     | (a)   | handle  | 1049322 | `destructable: 0000017F8BA67F20` |         |
| scale: negative              | (a)   | handle  | 1049323 | `destructable: 0000017ECB457390` |         |
| scale: outside the world     | (a)   | handle  | 1049324 | `destructable: 0000017F8BA7B9F0` |         |
| scale: 2147483647            | (a)   | handle  | 1049325 | `destructable: 0000017F8BA1F6B0` |         |
| variation: negative          | (a)   | handle  | 1049326 | `destructable: 0000017F8B92FAE0` |         |
| variation: outside the world | (a)   | handle  | 1049327 | `destructable: 0000017ECBB162E0` |         |
| variation: 2147483647        | (a)   | handle  | 1049328 | `destructable: 0000017EC9E02FF0` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1049329 | `destructable: 0000017ECBB9C380` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateDeadDestructableZWithSkinColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049330 | `destructable: 0000017ECB011390` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049331 | `destructable: 0000017ECBA21BC0` |         |
| x: negative                  | (a)   | handle  | 1049332 | `destructable: 0000017F8B74B080` |         |
| x: outside the world         | (a)   | handle  | 1049333 | `destructable: 0000017ECBEDA310` |         |
| x: 2147483647                | (a)   | handle  | 1049334 | `destructable: 0000017F8B74A180` |         |
| y: 0                         | (a)   | handle  | 1049335 | `destructable: 0000017ECA51FBF0` |         |
| y: negative                  | (a)   | handle  | 1049336 | `destructable: 0000017ECBED9920` |         |
| y: outside the world         | (a)   | handle  | 1049337 | `destructable: 0000017ECB4FE600` |         |
| y: 2147483647                | (a)   | handle  | 1049338 | `destructable: 0000017F8B6E7020` |         |
| z: negative                  | (a)   | handle  | 1049339 | `destructable: 0000017F8B7BBD90` |         |
| z: outside the world         | (a)   | handle  | 1049340 | `destructable: 0000017F8B8A5850` |         |
| z: 2147483647                | (a)   | handle  | 1049341 | `destructable: 0000017ECBA20B70` |         |
| face: 0                      | (a)   | handle  | 1049342 | `destructable: 0000017ECB44BAC0` |         |
| face: negative               | (a)   | handle  | 1049343 | `destructable: 0000017F8B6EFEA0` |         |
| face: outside the world      | (a)   | handle  | 1049344 | `destructable: 0000017F8BA1E0F0` |         |
| face: 2147483647             | (a)   | handle  | 1049345 | `destructable: 0000017ECB4714A0` |         |
| scale: 0                     | (a)   | handle  | 1049346 | `destructable: 0000017ECBB1D4F0` |         |
| scale: negative              | (a)   | handle  | 1049347 | `destructable: 0000017ECAEF62A0` |         |
| scale: outside the world     | (a)   | handle  | 1049348 | `destructable: 0000017ECBA24F80` |         |
| scale: 2147483647            | (a)   | handle  | 1049349 | `destructable: 0000017F8B91E9F0` |         |
| variation: negative          | (a)   | handle  | 1049350 | `destructable: 0000017F8B979890` |         |
| variation: outside the world | (a)   | handle  | 1049351 | `destructable: 0000017ECBEE1000` |         |
| variation: 2147483647        | (a)   | handle  | 1049352 | `destructable: 0000017ECBB3FD20` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1049353 | `destructable: 0000017F8BA190C0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateDestructablePitchRollWithColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049354 | `destructable: 0000017F8BA2E2E0` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049355 | `destructable: 0000017F8B6FD820` |         |
| x: negative                  | (a)   | handle  | 1049356 | `destructable: 0000017ECB452350` |         |
| x: outside the world         | (a)   | handle  | 1049357 | `destructable: 0000017F8BA9FDE0` |         |
| x: 2147483647                | (a)   | handle  | 1049358 | `destructable: 0000017F8B42DD30` |         |
| y: 0                         | (a)   | handle  | 1049359 | `destructable: 0000017F8B726E50` |         |
| y: negative                  | (a)   | handle  | 1049360 | `destructable: 0000017F8B8793A0` |         |
| y: outside the world         | (a)   | handle  | 1049361 | `destructable: 0000017F8B85C3A0` |         |
| y: 2147483647                | (a)   | handle  | 1049362 | `destructable: 0000017F8B7FEBF0` |         |
| face: 0                      | (a)   | handle  | 1049363 | `destructable: 0000017F8B808AA0` |         |
| face: negative               | (a)   | handle  | 1049364 | `destructable: 0000017F8B7FAC60` |         |
| face: outside the world      | (a)   | handle  | 1049365 | `destructable: 0000017F72592C50` |         |
| face: 2147483647             | (a)   | handle  | 1049366 | `destructable: 0000017F8B7433D0` |         |
| roll: negative               | (a)   | handle  | 1049367 | `destructable: 0000017F8B702F20` |         |
| roll: outside the world      | (a)   | handle  | 1049368 | `destructable: 0000017ECB507870` |         |
| roll: 2147483647             | (a)   | handle  | 1049369 | `destructable: 0000017F8B9D4800` |         |
| pitch: negative              | (a)   | handle  | 1049370 | `destructable: 0000017F8BA15130` |         |
| pitch: outside the world     | (a)   | handle  | 1049371 | `destructable: 0000017F8B80E050` |         |
| pitch: 2147483647            | (a)   | handle  | 1049372 | `destructable: 0000017F8B980E60` |         |
| scale: 0                     | (a)   | handle  | 1049373 | `destructable: 0000017F8B93EC70` |         |
| scale: negative              | (a)   | handle  | 1049374 | `destructable: 0000017F8B7C1BE0` |         |
| scale: outside the world     | (a)   | handle  | 1049375 | `destructable: 0000017F8B946030` |         |
| scale: 2147483647            | (a)   | handle  | 1049376 | `destructable: 0000017F8B92A440` |         |
| variation: negative          | (a)   | handle  | 1049377 | `destructable: 0000017F8B89DA40` |         |
| variation: outside the world | (a)   | handle  | 1049378 | `destructable: 0000017F8B956600` |         |
| variation: 2147483647        | (a)   | handle  | 1049379 | `destructable: 0000017F8B722630` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateDestructableZPitchRollWithColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049380 | `destructable: 0000017F8B977440` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049381 | `destructable: 0000017ECBEE3030` |         |
| x: negative                  | (a)   | handle  | 1049382 | `destructable: 0000017F8B748970` |         |
| x: outside the world         | (a)   | handle  | 1049383 | `destructable: 0000017F6DAAF570` |         |
| x: 2147483647                | (a)   | handle  | 1049384 | `destructable: 0000017ECBA9BB60` |         |
| y: 0                         | (a)   | handle  | 1049385 | `destructable: 0000017F8B851C60` |         |
| y: negative                  | (a)   | handle  | 1049386 | `destructable: 0000017F8B943050` |         |
| y: outside the world         | (a)   | handle  | 1049387 | `destructable: 0000017F8B9E1170` |         |
| y: 2147483647                | (a)   | handle  | 1049388 | `destructable: 0000017ECBEE33F0` |         |
| z: negative                  | (a)   | handle  | 1049389 | `destructable: 0000017F8BA67750` |         |
| z: outside the world         | (a)   | handle  | 1049390 | `destructable: 0000017F8BA5D280` |         |
| z: 2147483647                | (a)   | handle  | 1049391 | `destructable: 0000017F8B74DEA0` |         |
| face: 0                      | (a)   | handle  | 1049392 | `destructable: 0000017F8B86F8B0` |         |
| face: negative               | (a)   | handle  | 1049393 | `destructable: 0000017F8B86F770` |         |
| face: outside the world      | (a)   | handle  | 1049394 | `destructable: 0000017F8B93BD10` |         |
| face: 2147483647             | (a)   | handle  | 1049395 | `destructable: 0000017F8B9D04B0` |         |
| roll: negative               | (a)   | handle  | 1049396 | `destructable: 0000017F8B951210` |         |
| roll: outside the world      | (a)   | handle  | 1049397 | `destructable: 0000017F8B94B7F0` |         |
| roll: 2147483647             | (a)   | handle  | 1049398 | `destructable: 0000017F72765770` |         |
| pitch: negative              | (a)   | handle  | 1049399 | `destructable: 0000017F8B7F1AE0` |         |
| pitch: outside the world     | (a)   | handle  | 1049400 | `destructable: 0000017F8B729970` |         |
| pitch: 2147483647            | (a)   | handle  | 1049401 | `destructable: 0000017F8BA5FA70` |         |
| scale: 0                     | (a)   | handle  | 1049402 | `destructable: 0000017F8B92C330` |         |
| scale: negative              | (a)   | handle  | 1049403 | `destructable: 0000017ECB44CC30` |         |
| scale: outside the world     | (a)   | handle  | 1049404 | `destructable: 0000017F8B8CA780` |         |
| scale: 2147483647            | (a)   | handle  | 1049405 | `destructable: 0000017F8B700390` |         |
| variation: negative          | (a)   | handle  | 1049406 | `destructable: 0000017F8B9140D0` |         |
| variation: outside the world | (a)   | handle  | 1049407 | `destructable: 0000017F8B805910` |         |
| variation: 2147483647        | (a)   | handle  | 1049408 | `destructable: 0000017F8BA24ED0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateDeadDestructablePitchRollWithColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049409 | `destructable: 0000017F8B9144D0` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049410 | `destructable: 0000017ECB4F7830` |         |
| x: negative                  | (a)   | handle  | 1049411 | `destructable: 0000017F8B845D00` |         |
| x: outside the world         | (a)   | handle  | 1049412 | `destructable: 0000017F6D96A5B0` |         |
| x: 2147483647                | (a)   | handle  | 1049413 | `destructable: 0000017F8B9F1320` |         |
| y: 0                         | (a)   | handle  | 1049414 | `destructable: 0000017F8B9F1030` |         |
| y: negative                  | (a)   | handle  | 1049415 | `destructable: 0000017F8B949D40` |         |
| y: outside the world         | (a)   | handle  | 1049416 | `destructable: 0000017ECBEDB5C0` |         |
| y: 2147483647                | (a)   | handle  | 1049417 | `destructable: 0000017F8BA20C50` |         |
| face: 0                      | (a)   | handle  | 1049418 | `destructable: 0000017F8B9224A0` |         |
| face: negative               | (a)   | handle  | 1049419 | `destructable: 0000017F8BA10EE0` |         |
| face: outside the world      | (a)   | handle  | 1049420 | `destructable: 0000017F8CA88000` |         |
| face: 2147483647             | (a)   | handle  | 1049421 | `destructable: 0000017F8B99A690` |         |
| roll: negative               | (a)   | handle  | 1049422 | `destructable: 0000017ECB463290` |         |
| roll: outside the world      | (a)   | handle  | 1049423 | `destructable: 0000017F8B741BD0` |         |
| roll: 2147483647             | (a)   | handle  | 1049424 | `destructable: 0000017F8B7D0A70` |         |
| pitch: negative              | (a)   | handle  | 1049425 | `destructable: 0000017F8BA6CDC0` |         |
| pitch: outside the world     | (a)   | handle  | 1049426 | `destructable: 0000017ECBEE87A0` |         |
| pitch: 2147483647            | (a)   | handle  | 1049427 | `destructable: 0000017F72599160` |         |
| scale: 0                     | (a)   | handle  | 1049428 | `destructable: 0000017F725980E0` |         |
| scale: negative              | (a)   | handle  | 1049429 | `destructable: 0000017F8CAF4DE0` |         |
| scale: outside the world     | (a)   | handle  | 1049430 | `destructable: 0000017F8CAF9710` |         |
| scale: 2147483647            | (a)   | handle  | 1049431 | `destructable: 0000017F7259BA70` |         |
| variation: negative          | (a)   | handle  | 1049432 | `destructable: 0000017F8CAF3000` |         |
| variation: outside the world | (a)   | handle  | 1049433 | `destructable: 0000017F8CB2F3E0` |         |
| variation: 2147483647        | (a)   | handle  | 1049434 | `destructable: 0000017F8CB332D0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateDeadDestructableZPitchRollWithColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049435 | `destructable: 0000017F8CB32750` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049436 | `destructable: 0000017F8CBAEFC0` |         |
| x: negative                  | (a)   | handle  | 1049437 | `destructable: 0000017F8CBB36B0` |         |
| x: outside the world         | (a)   | handle  | 1049438 | `destructable: 0000017F8CBB78E0` |         |
| x: 2147483647                | (a)   | handle  | 1049439 | `destructable: 0000017F8CB35A80` |         |
| y: 0                         | (a)   | handle  | 1049440 | `destructable: 0000017F8CBBA570` |         |
| y: negative                  | (a)   | handle  | 1049441 | `destructable: 0000017F8CBE5050` |         |
| y: outside the world         | (a)   | handle  | 1049442 | `destructable: 0000017F8CBEA6D0` |         |
| y: 2147483647                | (a)   | handle  | 1049443 | `destructable: 0000017F8CBED9D0` |         |
| z: negative                  | (a)   | handle  | 1049444 | `destructable: 0000017F8CBED7A0` |         |
| z: outside the world         | (a)   | handle  | 1049445 | `destructable: 0000017F8CBE3570` |         |
| z: 2147483647                | (a)   | handle  | 1049446 | `destructable: 0000017F8CBFEBE0` |         |
| face: 0                      | (a)   | handle  | 1049447 | `destructable: 0000017F8CC05200` |         |
| face: negative               | (a)   | handle  | 1049448 | `destructable: 0000017F8CC0A130` |         |
| face: outside the world      | (a)   | handle  | 1049449 | `destructable: 0000017F8CC04850` |         |
| face: 2147483647             | (a)   | handle  | 1049450 | `destructable: 0000017F8CC03760` |         |
| roll: negative               | (a)   | handle  | 1049451 | `destructable: 0000017F8CC0E290` |         |
| roll: outside the world      | (a)   | handle  | 1049452 | `destructable: 0000017F8CC13A50` |         |
| roll: 2147483647             | (a)   | handle  | 1049453 | `destructable: 0000017F8CC19340` |         |
| pitch: negative              | (a)   | handle  | 1049454 | `destructable: 0000017F8CBEDCD0` |         |
| pitch: outside the world     | (a)   | handle  | 1049455 | `destructable: 0000017F8CC11FD0` |         |
| pitch: 2147483647            | (a)   | handle  | 1049456 | `destructable: 0000017F8CC1B8E0` |         |
| scale: 0                     | (a)   | handle  | 1049457 | `destructable: 0000017F8CC1FB00` |         |
| scale: negative              | (a)   | handle  | 1049458 | `destructable: 0000017F8CC24B50` |         |
| scale: outside the world     | (a)   | handle  | 1049459 | `destructable: 0000017F8CC29230` |         |
| scale: 2147483647            | (a)   | handle  | 1049460 | `destructable: 0000017F8CC2D110` |         |
| variation: negative          | (a)   | handle  | 1049461 | `destructable: 0000017F8CC2B6A0` |         |
| variation: outside the world | (a)   | handle  | 1049462 | `destructable: 0000017F8CC27030` |         |
| variation: 2147483647        | (a)   | handle  | 1049463 | `destructable: 0000017F8CC30790` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateDestructableWithSkinPitchRollColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049464 | `destructable: 0000017F8CC364D0` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049465 | `destructable: 0000017F8CC23E20` |         |
| x: negative                  | (a)   | handle  | 1049466 | `destructable: 0000017F8CC3DE80` |         |
| x: outside the world         | (a)   | handle  | 1049467 | `destructable: 0000017F8CC3B180` |         |
| x: 2147483647                | (a)   | handle  | 1049468 | `destructable: 0000017F8CC41340` |         |
| y: 0                         | (a)   | handle  | 1049469 | `destructable: 0000017F8CC46B00` |         |
| y: negative                  | (a)   | handle  | 1049470 | `destructable: 0000017F8CC4C370` |         |
| y: outside the world         | (a)   | handle  | 1049471 | `destructable: 0000017F8CC45A70` |         |
| y: 2147483647                | (a)   | handle  | 1049472 | `destructable: 0000017F8CC491B0` |         |
| face: 0                      | (a)   | handle  | 1049473 | `destructable: 0000017F8CC54190` |         |
| face: negative               | (a)   | handle  | 1049474 | `destructable: 0000017F8CC5A700` |         |
| face: outside the world      | (a)   | handle  | 1049475 | `destructable: 0000017F8CC5D2D0` |         |
| face: 2147483647             | (a)   | handle  | 1049476 | `destructable: 0000017F8CC59EF0` |         |
| roll: negative               | (a)   | handle  | 1049477 | `destructable: 0000017F8CC5FAA0` |         |
| roll: outside the world      | (a)   | handle  | 1049478 | `destructable: 0000017F8CC8AAF0` |         |
| roll: 2147483647             | (a)   | handle  | 1049479 | `destructable: 0000017F8CC90AD0` |         |
| pitch: negative              | (a)   | handle  | 1049480 | `destructable: 0000017F8CC16760` |         |
| pitch: outside the world     | (a)   | handle  | 1049481 | `destructable: 0000017F8CC8DB70` |         |
| pitch: 2147483647            | (a)   | handle  | 1049482 | `destructable: 0000017F8CCA8CD0` |         |
| scale: 0                     | (a)   | handle  | 1049483 | `destructable: 0000017F8CCA0520` |         |
| scale: negative              | (a)   | handle  | 1049484 | `destructable: 0000017F8CCA6980` |         |
| scale: outside the world     | (a)   | handle  | 1049485 | `destructable: 0000017F8CC97180` |         |
| scale: 2147483647            | (a)   | handle  | 1049486 | `destructable: 0000017F8CC9D600` |         |
| variation: negative          | (a)   | handle  | 1049487 | `destructable: 0000017F8CCA9000` |         |
| variation: outside the world | (a)   | handle  | 1049488 | `destructable: 0000017F8CCAF680` |         |
| variation: 2147483647        | (a)   | handle  | 1049489 | `destructable: 0000017F8CCB6130` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1049490 | `destructable: 0000017F8CCAEDB0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateDestructableZWithSkinPitchRollColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049491 | `destructable: 0000017F8CCB2250` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049492 | `destructable: 0000017F8CCB90C0` |         |
| x: negative                  | (a)   | handle  | 1049493 | `destructable: 0000017F8CCBE930` |         |
| x: outside the world         | (a)   | handle  | 1049494 | `destructable: 0000017F8CCC4BC0` |         |
| x: 2147483647                | (a)   | handle  | 1049495 | `destructable: 0000017F8CCAC2F0` |         |
| y: 0                         | (a)   | handle  | 1049496 | `destructable: 0000017F8CCC14D0` |         |
| y: negative                  | (a)   | handle  | 1049497 | `destructable: 0000017F8CCC0CF0` |         |
| y: outside the world         | (a)   | handle  | 1049498 | `destructable: 0000017F8CCCE800` |         |
| y: 2147483647                | (a)   | handle  | 1049499 | `destructable: 0000017F8CCD4100` |         |
| z: negative                  | (a)   | handle  | 1049500 | `destructable: 0000017F8CCBDB10` |         |
| z: outside the world         | (a)   | handle  | 1049501 | `destructable: 0000017F8CCCB600` |         |
| z: 2147483647                | (a)   | handle  | 1049502 | `destructable: 0000017F8CCD60E0` |         |
| face: 0                      | (a)   | handle  | 1049503 | `destructable: 0000017F8CCFFAF0` |         |
| face: negative               | (a)   | handle  | 1049504 | `destructable: 0000017F8CCF5100` |         |
| face: outside the world      | (a)   | handle  | 1049505 | `destructable: 0000017F8CCFA6F0` |         |
| face: 2147483647             | (a)   | handle  | 1049506 | `destructable: 0000017F8CCF9220` |         |
| roll: negative               | (a)   | handle  | 1049507 | `destructable: 0000017F8CCF36A0` |         |
| roll: outside the world      | (a)   | handle  | 1049508 | `destructable: 0000017F8CCF1440` |         |
| roll: 2147483647             | (a)   | handle  | 1049509 | `destructable: 0000017F8BAACFE0` |         |
| pitch: negative              | (a)   | handle  | 1049510 | `destructable: 0000017F8CCD2310` |         |
| pitch: outside the world     | (a)   | handle  | 1049511 | `destructable: 0000017F8CD06910` |         |
| pitch: 2147483647            | (a)   | handle  | 1049512 | `destructable: 0000017F8CD0C1B0` |         |
| scale: 0                     | (a)   | handle  | 1049513 | `destructable: 0000017F8BAAB630` |         |
| scale: negative              | (a)   | handle  | 1049514 | `destructable: 0000017F8CD09740` |         |
| scale: outside the world     | (a)   | handle  | 1049515 | `destructable: 0000017F8CD0E780` |         |
| scale: 2147483647            | (a)   | handle  | 1049516 | `destructable: 0000017F8CD1C9B0` |         |
| variation: negative          | (a)   | handle  | 1049517 | `destructable: 0000017F8CD22B10` |         |
| variation: outside the world | (a)   | handle  | 1049518 | `destructable: 0000017F8CD224C0` |         |
| variation: 2147483647        | (a)   | handle  | 1049519 | `destructable: 0000017F8CD1B7F0` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1049520 | `destructable: 0000017F8CD27300` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateDeadDestructableWithSkinPitchRollColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049521 | `destructable: 0000017F8CD21340` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049522 | `destructable: 0000017F8CD52C30` |         |
| x: negative                  | (a)   | handle  | 1049523 | `destructable: 0000017F8CD57B20` |         |
| x: outside the world         | (a)   | handle  | 1049524 | `destructable: 0000017F8CD1A860` |         |
| x: 2147483647                | (a)   | handle  | 1049525 | `destructable: 0000017F8CD5BDC0` |         |
| y: 0                         | (a)   | handle  | 1049526 | `destructable: 0000017F8CD567D0` |         |
| y: negative                  | (a)   | handle  | 1049527 | `destructable: 0000017F8CD5FDF0` |         |
| y: outside the world         | (a)   | handle  | 1049528 | `destructable: 0000017F8CD667D0` |         |
| y: 2147483647                | (a)   | handle  | 1049529 | `destructable: 0000017F8CD6CA60` |         |
| face: 0                      | (a)   | handle  | 1049530 | `destructable: 0000017F8CD68910` |         |
| face: negative               | (a)   | handle  | 1049531 | `destructable: 0000017F8CD4FF40` |         |
| face: outside the world      | (a)   | handle  | 1049532 | `destructable: 0000017F8CD63810` |         |
| face: 2147483647             | (a)   | handle  | 1049533 | `destructable: 0000017F8CD715F0` |         |
| roll: negative               | (a)   | handle  | 1049534 | `destructable: 0000017F8CD76B90` |         |
| roll: outside the world      | (a)   | handle  | 1049535 | `destructable: 0000017F8CD7B2E0` |         |
| roll: 2147483647             | (a)   | handle  | 1049536 | `destructable: 0000017F8CD809D0` |         |
| pitch: negative              | (a)   | handle  | 1049537 | `destructable: 0000017F8CD7A780` |         |
| pitch: outside the world     | (a)   | handle  | 1049538 | `destructable: 0000017F8CD79D40` |         |
| pitch: 2147483647            | (a)   | handle  | 1049539 | `destructable: 0000017F8CD82130` |         |
| scale: 0                     | (a)   | handle  | 1049540 | `destructable: 0000017F8CD874B0` |         |
| scale: negative              | (a)   | handle  | 1049541 | `destructable: 0000017F8CD8C100` |         |
| scale: outside the world     | (a)   | handle  | 1049542 | `destructable: 0000017F8CD90910` |         |
| scale: 2147483647            | (a)   | handle  | 1049543 | `destructable: 0000017F8CD8A5D0` |         |
| variation: negative          | (a)   | handle  | 1049544 | `destructable: 0000017F8CD8F770` |         |
| variation: outside the world | (a)   | handle  | 1049545 | `destructable: 0000017F8CD93AA0` |         |
| variation: 2147483647        | (a)   | handle  | 1049546 | `destructable: 0000017F8CD98490` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1049547 | `destructable: 0000017F8CD9E7E0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

### `BlzCreateDeadDestructableZWithSkinPitchRollColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049548 | `destructable: 0000017F8CDA0AB0` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049549 | `destructable: 0000017F8CD9D2A0` |         |
| x: negative                  | (a)   | handle  | 1049550 | `destructable: 0000017F8CDAA490` |         |
| x: outside the world         | (a)   | handle  | 1049551 | `destructable: 0000017F8CDAEE40` |         |
| x: 2147483647                | (a)   | handle  | 1049552 | `destructable: 0000017F8CDB43B0` |         |
| y: 0                         | (a)   | handle  | 1049553 | `destructable: 0000017F8CDA1EC0` |         |
| y: negative                  | (a)   | handle  | 1049554 | `destructable: 0000017F8CDB32C0` |         |
| y: outside the world         | (a)   | handle  | 1049555 | `destructable: 0000017F8CD97000` |         |
| y: 2147483647                | (a)   | handle  | 1049556 | `destructable: 0000017F8CD79A70` |         |
| z: negative                  | (a)   | handle  | 1049557 | `destructable: 0000017F8CD928E0` |         |
| z: outside the world         | (a)   | handle  | 1049558 | `destructable: 0000017F8CCCCF50` |         |
| z: 2147483647                | (a)   | handle  | 1049559 | `destructable: 0000017F8CDA07C0` |         |
| face: 0                      | (a)   | handle  | 1049560 | `destructable: 0000017F8CC9CAF0` |         |
| face: negative               | (a)   | handle  | 1049561 | `destructable: 0000017F8CC54D10` |         |
| face: outside the world      | (a)   | handle  | 1049562 | `destructable: 0000017F8CC3AB40` |         |
| face: 2147483647             | (a)   | handle  | 1049563 | `destructable: 0000017F8CCAC040` |         |
| roll: negative               | (a)   | handle  | 1049564 | `destructable: 0000017F8CC9D7C0` |         |
| roll: outside the world      | (a)   | handle  | 1049565 | `destructable: 0000017F8CBAE4A0` |         |
| roll: 2147483647             | (a)   | handle  | 1049566 | `destructable: 0000017F8CB35DA0` |         |
| pitch: negative              | (a)   | handle  | 1049567 | `destructable: 0000017F8B9F0B40` |         |
| pitch: outside the world     | (a)   | handle  | 1049568 | `destructable: 0000017F8B8CA6B0` |         |
| pitch: 2147483647            | (a)   | handle  | 1049569 | `destructable: 0000017F8B951750` |         |
| scale: 0                     | (a)   | handle  | 1049570 | `destructable: 0000017F8B9565C0` |         |
| scale: negative              | (a)   | handle  | 1049571 | `destructable: 0000017F8B977A00` |         |
| scale: outside the world     | (a)   | handle  | 1049572 | `destructable: 0000017F8BA782D0` |         |
| scale: 2147483647            | (a)   | handle  | 1049573 | `destructable: 0000017F8B772710` |         |
| variation: negative          | (a)   | handle  | 1049574 | `destructable: 0000017ECB4FE290` |         |
| variation: outside the world | (a)   | handle  | 1049575 | `destructable: 0000017ECBB0C9F0` |         |
| variation: 2147483647        | (a)   | handle  | 1049576 | `destructable: 0000017F8B8A0E40` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1049577 | `destructable: 0000017ECB47D6D0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.0.24268.

## `nullability-registrations`

- Probe: `nullability-registrations`
- Patch: 3.0.0.24268
- Client: 3.0.0.24268
- Date: 2026-10-04
- Run: `3f36541a-dc5e-49d4-b897-f7fe7ac1213a`

### `TriggerRegisterVariableEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048813 | `event: 000001B40B96A810` |         |
| varName: empty string           | (a)   | handle  | 1048814 | `event: 000001B40B98BFC0` |         |
| varName: unknown name           | (a)   | handle  | 1048815 | `event: 000001B40B998A10` |         |
| limitval: 0                     | (a)   | handle  | 1048816 | `event: 000001B40B9A8F80` |         |
| limitval: negative              | (a)   | handle  | 1048817 | `event: 000001B40B993990` |         |
| limitval: outside the world     | (a)   | handle  | 1048818 | `event: 000001B324CD9010` |         |
| limitval: 2147483647            | (a)   | handle  | 1048819 | `event: 000001B40C263EC0` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.0.24268.

### `TriggerRegisterTimerEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048820 | `event: 000001B40C266640` |         |
| timeout: 0                      | (a)   | handle  | 1048821 | `event: 000001B309F295B0` |         |
| timeout: negative               | (a)   | handle  | 1048822 | `event: 000001B309F292F0` |         |
| timeout: outside the world      | (a)   | handle  | 1048823 | `event: 000001B40C20DED0` |         |
| timeout: 2147483647             | (a)   | handle  | 1048824 | `event: 000001B40C27A530` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.0.24268.

### `TriggerRegisterTimerExpireEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048825 | `event: 000001B40C1F68D0` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |
| t: destroyed timer              | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 2 cases of the nullability sweep (whichTrigger: destroyed trigger, t: destroyed timer) on 3.0.0.24268.

### `TriggerRegisterGameStateEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048826 | `event: 000001B40C206DC0` |         |
| limitval: 0                     | (a)   | handle  | 1048827 | `event: 000001B40C281BD0` |         |
| limitval: negative              | (a)   | handle  | 1048828 | `event: 000001B40C2A6D70` |         |
| limitval: outside the world     | (a)   | handle  | 1048829 | `event: 000001B40C2BA3B0` |         |
| limitval: 2147483647            | (a)   | handle  | 1048830 | `event: 000001B40C281220` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.0.24268.

### `TriggerRegisterDialogEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048831 | `event: 000001B40C2A5420` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |
| whichDialog: destroyed dialog   | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 2 cases of the nullability sweep (whichTrigger: destroyed trigger, whichDialog: destroyed dialog) on 3.0.0.24268.

### `TriggerRegisterDialogButtonEvent`

| Case                                    | Group | Outcome | Id      | Type                      | Message |
| --------------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments                       | (a)   | handle  | 1048832 | `event: 000001B326193AE0` |         |
| whichTrigger: destroyed trigger         | (b)   | nil     |         |                           |         |
| whichButton: button after DialogDestroy | (b)   | nil     |         |                           |         |
| whichButton: button after DialogClear   | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 3 cases of the nullability sweep (whichTrigger: destroyed trigger, whichButton: button after DialogDestroy, whichButton: button after DialogClear) on 3.0.0.24268.

### `TriggerRegisterGameEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048833 | `event: 000001B40C29AB00` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.0.24268.

### `TriggerRegisterEnterRegion`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048834 | `event: 000001B40C1F74B0` |         |
| filter: nil                     | (a)   | handle  | 1048835 | `event: 000001B40C2FF710` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |
| whichRegion: removed region     | (b)   | nil     |         |                           |         |
| filter: destroyed condition     | (b)   | handle  | 1048881 | `event: 000001B40C410420` |         |
| filter: destroyed filter        | (b)   | handle  | 1048882 | `event: 000001B40C48DA90` |         |
| filter: destroyed boolexpr      | (b)   | handle  | 1048883 | `event: 000001B40C3D9650` |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 2 cases of the nullability sweep (whichTrigger: destroyed trigger, whichRegion: removed region) on 3.0.0.24268.

### `TriggerRegisterLeaveRegion`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048836 | `event: 000001B40C30B190` |         |
| filter: nil                     | (a)   | handle  | 1048837 | `event: 000001B409FF4570` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |
| whichRegion: removed region     | (b)   | nil     |         |                           |         |
| filter: destroyed condition     | (b)   | handle  | 1048884 | `event: 000001B40C5EFB20` |         |
| filter: destroyed filter        | (b)   | handle  | 1048885 | `event: 000001B40C337CD0` |         |
| filter: destroyed boolexpr      | (b)   | handle  | 1048886 | `event: 000001B40C5E9970` |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 2 cases of the nullability sweep (whichTrigger: destroyed trigger, whichRegion: removed region) on 3.0.0.24268.

### `TriggerRegisterTrackableHitEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048838 | `event: 000001B40C319180` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.0.24268.

### `TriggerRegisterTrackableTrackEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048839 | `event: 000001B40C32EB40` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.0.24268.

### `TriggerRegisterCommandEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048840 | `event: 000001B40C317370` |         |
| whichAbility: unknown rawcode   | (a)   | handle  | 1048841 | `event: 000001B40C344FC0` |         |
| order: empty string             | (a)   | nil     |         |                           |         |
| order: unknown name             | (a)   | nil     |         |                           |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 3 cases of the nullability sweep (order: empty string, order: unknown name, whichTrigger: destroyed trigger) on 3.0.0.24268.

### `TriggerRegisterUpgradeCommandEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048842 | `event: 000001B40C37AD10` |         |
| whichUpgrade: unknown rawcode   | (a)   | handle  | 1048843 | `event: 000001B40C34B4B0` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.0.24268.

### `TriggerRegisterPlayerEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048844 | `event: 000001B40C3BB8B0` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.0.24268.

### `TriggerRegisterPlayerUnitEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048845 | `event: 000001B40C3BB3A0` |         |
| filter: nil                     | (a)   | handle  | 1048846 | `event: 000001B40C3DFFB0` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |
| filter: destroyed condition     | (b)   | handle  | 1048887 | `event: 000001B40C31F4E0` |         |
| filter: destroyed filter        | (b)   | handle  | 1048888 | `event: 000001B40C487800` |         |
| filter: destroyed boolexpr      | (b)   | handle  | 1048889 | `event: 000001B40C5A7D30` |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.0.24268.

### `TriggerRegisterPlayerAllianceChange`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048847 | `event: 000001B40C407270` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.0.24268.

### `TriggerRegisterPlayerStateEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048848 | `event: 000001B40C4067D0` |         |
| limitval: 0                     | (a)   | handle  | 1048849 | `event: 000001B40C3EA540` |         |
| limitval: negative              | (a)   | handle  | 1048850 | `event: 000001B409F71720` |         |
| limitval: outside the world     | (a)   | handle  | 1048851 | `event: 000001B40C322610` |         |
| limitval: 2147483647            | (a)   | handle  | 1048852 | `event: 000001B40C38DB70` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.0.24268.

### `TriggerRegisterPlayerChatEvent`

| Case                              | Group | Outcome | Id      | Type                      | Message |
| --------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments                 | (a)   | handle  | 1048853 | `event: 000001B40C39CFB0` |         |
| chatMessageToDetect: empty string | (a)   | handle  | 1048854 | `event: 000001B40C346F40` |         |
| chatMessageToDetect: unknown name | (a)   | handle  | 1048855 | `event: 000001B409FF0EE0` |         |
| whichTrigger: destroyed trigger   | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.0.24268.

### `TriggerRegisterDeathEvent`

| Case                              | Group | Outcome | Id      | Type                      | Message |
| --------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments                 | (a)   | handle  | 1048856 | `event: 000001B40C2DB830` |         |
| whichWidget: live destructable    | (a)   | handle  | 1048857 | `event: 000001B40C46EDC0` |         |
| whichWidget: live item            | (a)   | handle  | 1048858 | `event: 000001B40C282340` |         |
| whichTrigger: destroyed trigger   | (b)   | nil     |         |                           |         |
| whichWidget: dead unit            | (b)   | handle  | 1048890 | `event: 000001B40C458EF0` |         |
| whichWidget: removed unit         | (b)   | handle  | 1048891 | `event: 000001B40C337120` |         |
| whichWidget: dead destructable    | (b)   | handle  | 1048892 | `event: 000001B40C256B90` |         |
| whichWidget: removed destructable | (b)   | nil     |         |                           |         |
| whichWidget: dead item            | (b)   | handle  | 1048893 | `event: 000001B40C45DD20` |         |
| whichWidget: removed item         | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 3 cases of the nullability sweep (whichTrigger: destroyed trigger, whichWidget: removed destructable, whichWidget: removed item) on 3.0.0.24268.

### `TriggerRegisterUnitStateEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048859 | `event: 000001B40B9A1060` |         |
| limitval: 0                     | (a)   | handle  | 1048860 | `event: 000001B40C4B8AE0` |         |
| limitval: negative              | (a)   | handle  | 1048861 | `event: 000001B40B709060` |         |
| limitval: outside the world     | (a)   | handle  | 1048862 | `event: 000001B40B9653E0` |         |
| limitval: 2147483647            | (a)   | handle  | 1048863 | `event: 000001B40B998370` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |
| whichUnit: dead unit            | (b)   | handle  | 1048894 | `event: 000001B40C3361D0` |         |
| whichUnit: removed unit         | (b)   | handle  | 1048895 | `event: 000001B40C1FB670` |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.0.24268.

### `TriggerRegisterUnitEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048864 | `event: 000001B40B969CE0` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |
| whichUnit: dead unit            | (b)   | handle  | 1048896 | `event: 000001B40C3D1690` |         |
| whichUnit: removed unit         | (b)   | handle  | 1048897 | `event: 000001B40C2DB4A0` |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.0.24268.

### `TriggerRegisterFilterUnitEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048865 | `event: 000001B40C1F59E0` |         |
| filter: nil                     | (a)   | handle  | 1048866 | `event: 000001B40B973280` |         |
| whichEvent: EVENT\_UNIT\_DEATH  | (a)   | nil     |         |                           |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |
| whichUnit: dead unit            | (b)   | handle  | 1048898 | `event: 000001B40C41BF20` |         |
| whichUnit: removed unit         | (b)   | handle  | 1048899 | `event: 000001B40C4C7D70` |         |
| filter: destroyed condition     | (b)   | handle  | 1048900 | `event: 000001B40C203F00` |         |
| filter: destroyed filter        | (b)   | handle  | 1048901 | `event: 000001B40B9AD7C0` |         |
| filter: destroyed boolexpr      | (b)   | handle  | 1048902 | `event: 000001B40B9A27B0` |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 2 cases of the nullability sweep (whichEvent: EVENT\_UNIT\_DEATH, whichTrigger: destroyed trigger) on 3.0.0.24268.

### `TriggerRegisterUnitInRange`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048867 | `event: 000001B40B9760F0` |         |
| range: 0                        | (a)   | handle  | 1048868 | `event: 000001B40C1F6810` |         |
| range: negative                 | (a)   | handle  | 1048869 | `event: 000001B40C2BD2D0` |         |
| range: outside the world        | (a)   | handle  | 1048870 | `event: 000001B40C3DE760` |         |
| range: 2147483647               | (a)   | handle  | 1048871 | `event: 000001B40C4A0C70` |         |
| filter: nil                     | (a)   | handle  | 1048872 | `event: 000001B40C4C2A80` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |
| whichUnit: dead unit            | (b)   | handle  | 1048903 | `event: 000001B40B9A56C0` |         |
| whichUnit: removed unit         | (b)   | handle  | 1048904 | `event: 000001B40C2A3540` |         |
| filter: destroyed condition     | (b)   | handle  | 1048905 | `event: 000001B40C2984F0` |         |
| filter: destroyed filter        | (b)   | handle  | 1048906 | `event: 000001B40C2B0070` |         |
| filter: destroyed boolexpr      | (b)   | handle  | 1048907 | `event: 000001B40C2A4F00` |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.0.24268.

### `BlzTriggerRegisterFrameEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048873 | `event: 000001B40C1F9BE0` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |
| frame: destroyed frame          | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 2 cases of the nullability sweep (whichTrigger: destroyed trigger, frame: destroyed frame) on 3.0.0.24268.

### `BlzTriggerRegisterPlayerSyncEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048874 | `event: 000001B40C5ED9D0` |         |
| prefix: empty string            | (a)   | handle  | 1048875 | `event: 000001B40B970230` |         |
| prefix: unknown name            | (a)   | handle  | 1048876 | `event: 000001B40B964800` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.0.24268.

### `BlzTriggerRegisterPlayerKeyEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048877 | `event: 000001B40B971630` |         |
| metaKey: negative               | (a)   | handle  | 1048878 | `event: 000001B40B9A6210` |         |
| metaKey: outside the world      | (a)   | handle  | 1048879 | `event: 000001B40C5B0D50` |         |
| metaKey: 2147483647             | (a)   | handle  | 1048880 | `event: 000001B40B9A7700` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.0.24268.
