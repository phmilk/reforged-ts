# Nullability sweep

The [Nullability sweep](../../CONTEXT.md)'s report: one section per Slice, written by `pnpm probe:nullability-report <probe>` from the Result file of the Slice's last Probe run, and replaced, alone, each time the command runs again. Each Native gets a verdict from its cases and its Nullability family, compared with the Overlay's `returns.nullable`, and a proposed `notes` text; a Native is a `mismatch` when the Overlay types it non-null and its verdict is neither `non-null (evidence)` nor `non-null (evidence, handle id 0 or -1)`, `unsafe`, `review` and `nullable (placeholder)` included. An `unsafe` Native, one with a case that crashed the game, is proposed nullable, and so is a `nullable (placeholder)` one, a constructor or a registration that returned a Placeholder handle (id 0 or -1) in place of nothing. Each parameter measured by call cases gets a verdict from them, compared with the Overlay's `params[].nullable`, and a proposed sentence of its Native's `notes`, since the Overlay has no `params[].notes`. A converter backed non-null gets condensed `notes`, the measured fact instead of its case list. The command never writes the Overlay: `pnpm probe:nullability-curate <probe>` applies a Slice's verdicts to it, and every change goes through review.

## `nullability-converters-1`

- Probe: `nullability-converters-1`
- Patch: 3.0.1.24370
- Client: 3.0.1.24371
- Date: 2026-10-21
- Run: `eea0f44c-ebe7-40c7-b8d8-4dec67c4a574`

### `ConvertRace`

| Case                   | Group | Outcome | Id          | Type                     | Message |
| ---------------------- | ----- | ------- | ----------- | ------------------------ | ------- |
| RACE\_HUMAN            | (a)   | handle  | 1           | `race: 00000247709DE5B0` |         |
| RACE\_ORC              | (a)   | handle  | 2           | `race: 000002476B731090` |         |
| RACE\_UNDEAD           | (a)   | handle  | 3           | `race: 000002476BACD4D0` |         |
| RACE\_NIGHTELF         | (a)   | handle  | 4           | `race: 000002476B822030` |         |
| RACE\_DEMON            | (a)   | handle  | 5           | `race: 000002476B7842E0` |         |
| RACE\_OTHER            | (a)   | handle  | 7           | `race: 000002476B738D10` |         |
| -1                     | (a)   | handle  | -1          | `race: 00000247891FDAC0` |         |
| past the last constant | (a)   | handle  | 8           | `race: 00000247891DFDA0` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `race: 00000247892073B0` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `race: 00000247891C8F70` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertAllianceType`

| Case                                | Group | Outcome | Id          | Type                             | Message |
| ----------------------------------- | ----- | ------- | ----------- | -------------------------------- | ------- |
| ALLIANCE\_PASSIVE                   | (a)   | handle  | 0           | `alliancetype: 000002476F18B070` |         |
| ALLIANCE\_HELP\_REQUEST             | (a)   | handle  | 1           | `alliancetype: 000002476EFAE8D0` |         |
| ALLIANCE\_HELP\_RESPONSE            | (a)   | handle  | 2           | `alliancetype: 000002476F2CB650` |         |
| ALLIANCE\_SHARED\_XP                | (a)   | handle  | 3           | `alliancetype: 000002476F6E8E60` |         |
| ALLIANCE\_SHARED\_SPELLS            | (a)   | handle  | 4           | `alliancetype: 000002476F2A8880` |         |
| ALLIANCE\_SHARED\_VISION            | (a)   | handle  | 5           | `alliancetype: 000002476D36D5B0` |         |
| ALLIANCE\_SHARED\_CONTROL           | (a)   | handle  | 6           | `alliancetype: 000002476F3E5860` |         |
| ALLIANCE\_SHARED\_ADVANCED\_CONTROL | (a)   | handle  | 7           | `alliancetype: 000002476F004540` |         |
| ALLIANCE\_RESCUABLE                 | (a)   | handle  | 8           | `alliancetype: 000002476EDC9230` |         |
| ALLIANCE\_SHARED\_VISION\_FORCED    | (a)   | handle  | 9           | `alliancetype: 000002476F08C4D0` |         |
| -1                                  | (a)   | handle  | -1          | `alliancetype: 0000024789202210` |         |
| past the last constant              | (a)   | handle  | 10          | `alliancetype: 00000247891FD340` |         |
| 2147483647                          | (a)   | handle  | 2147483647  | `alliancetype: 00000246CB057C00` |         |
| -2147483648                         | (a)   | handle  | -2147483648 | `alliancetype: 0000024789136910` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertRacePref`

| Case                         | Group | Outcome | Id          | Type                               | Message |
| ---------------------------- | ----- | ------- | ----------- | ---------------------------------- | ------- |
| RACE\_PREF\_HUMAN            | (a)   | handle  | 1           | `racepreference: 000002476D35D3A0` |         |
| RACE\_PREF\_ORC              | (a)   | handle  | 2           | `racepreference: 000002476D35D3E0` |         |
| RACE\_PREF\_NIGHTELF         | (a)   | handle  | 4           | `racepreference: 000002476F426710` |         |
| RACE\_PREF\_UNDEAD           | (a)   | handle  | 8           | `racepreference: 000002476F4267B0` |         |
| RACE\_PREF\_DEMON            | (a)   | handle  | 16          | `racepreference: 000002476F4267F0` |         |
| RACE\_PREF\_RANDOM           | (a)   | handle  | 32          | `racepreference: 000002476F426830` |         |
| RACE\_PREF\_USER\_SELECTABLE | (a)   | handle  | 64          | `racepreference: 000002476F426900` |         |
| RACE\_PREF\_FORSAKEN         | (a)   | handle  | 128         | `racepreference: 000002476F426940` |         |
| -1                           | (a)   | handle  | -1          | `racepreference: 00000246CAED4730` |         |
| past the last constant       | (a)   | handle  | 129         | `racepreference: 00000246CB035D00` |         |
| 2147483647                   | (a)   | handle  | 2147483647  | `racepreference: 00000246CB01EDC0` |         |
| -2147483648                  | (a)   | handle  | -2147483648 | `racepreference: 00000246CB041A30` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertIGameState`

| Case                              | Group | Outcome | Id          | Type                           | Message |
| --------------------------------- | ----- | ------- | ----------- | ------------------------------ | ------- |
| GAME\_STATE\_DIVINE\_INTERVENTION | (a)   | handle  | 0           | `igamestate: 000002476F0D0540` |         |
| GAME\_STATE\_DISCONNECTED         | (a)   | handle  | 1           | `igamestate: 000002476F0D0580` |         |
| -1                                | (a)   | handle  | -1          | `igamestate: 00000246CB013720` |         |
| past the last constant            | (a)   | handle  | 2           | `igamestate: 00000246CB009F50` |         |
| 2147483647                        | (a)   | handle  | 2147483647  | `igamestate: 00000246CAC27C40` |         |
| -2147483648                       | (a)   | handle  | -2147483648 | `igamestate: 00000246CAEF1750` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertFGameState`

| Case                       | Group | Outcome | Id          | Type                           | Message |
| -------------------------- | ----- | ------- | ----------- | ------------------------------ | ------- |
| GAME\_STATE\_TIME\_OF\_DAY | (a)   | handle  | 2           | `fgamestate: 000002476F0D05C0` |         |
| -1                         | (a)   | handle  | -1          | `fgamestate: 00000246CB050660` |         |
| past the last constant     | (a)   | handle  | 3           | `fgamestate: 00000246CAC23C20` |         |
| 2147483647                 | (a)   | handle  | 2147483647  | `fgamestate: 000002478916DD00` |         |
| -2147483648                | (a)   | handle  | -2147483648 | `fgamestate: 00000247891942F0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertPlayerState`

| Case                                  | Group | Outcome | Id          | Type                            | Message |
| ------------------------------------- | ----- | ------- | ----------- | ------------------------------- | ------- |
| PLAYER\_STATE\_GAME\_RESULT           | (a)   | handle  | 0           | `playerstate: 000002476F0D0600` |         |
| PLAYER\_STATE\_RESOURCE\_GOLD         | (a)   | handle  | 1           | `playerstate: 000002476F0D0640` |         |
| PLAYER\_STATE\_RESOURCE\_LUMBER       | (a)   | handle  | 2           | `playerstate: 000002476F2FFAA0` |         |
| PLAYER\_STATE\_RESOURCE\_HERO\_TOKENS | (a)   | handle  | 3           | `playerstate: 000002476F2E54A0` |         |
| PLAYER\_STATE\_RESOURCE\_FOOD\_CAP    | (a)   | handle  | 4           | `playerstate: 000002476F2E54E0` |         |
| PLAYER\_STATE\_RESOURCE\_FOOD\_USED   | (a)   | handle  | 5           | `playerstate: 000002476F2E5520` |         |
| PLAYER\_STATE\_FOOD\_CAP\_CEILING     | (a)   | handle  | 6           | `playerstate: 000002476F2E5600` |         |
| PLAYER\_STATE\_GIVES\_BOUNTY          | (a)   | handle  | 7           | `playerstate: 000002476F2E5640` |         |
| PLAYER\_STATE\_ALLIED\_VICTORY        | (a)   | handle  | 8           | `playerstate: 000002476F2E5680` |         |
| PLAYER\_STATE\_PLACED                 | (a)   | handle  | 9           | `playerstate: 000002476F2E56C0` |         |
| PLAYER\_STATE\_OBSERVER\_ON\_DEATH    | (a)   | handle  | 10          | `playerstate: 000002476F2E5820` |         |
| PLAYER\_STATE\_OBSERVER               | (a)   | handle  | 11          | `playerstate: 000002476F2E5860` |         |
| PLAYER\_STATE\_UNFOLLOWABLE           | (a)   | handle  | 12          | `playerstate: 000002476F2FFAE0` |         |
| PLAYER\_STATE\_GOLD\_UPKEEP\_RATE     | (a)   | handle  | 13          | `playerstate: 000002476F2E5560` |         |
| PLAYER\_STATE\_LUMBER\_UPKEEP\_RATE   | (a)   | handle  | 14          | `playerstate: 000002476F2E55A0` |         |
| PLAYER\_STATE\_GOLD\_GATHERED         | (a)   | handle  | 15          | `playerstate: 000002476F29F180` |         |
| PLAYER\_STATE\_LUMBER\_GATHERED       | (a)   | handle  | 16          | `playerstate: 000002476F29F1C0` |         |
| PLAYER\_STATE\_NO\_CREEP\_SLEEP       | (a)   | handle  | 25          | `playerstate: 000002476F29F200` |         |
| -1                                    | (a)   | handle  | -1          | `playerstate: 00000246CAEDA320` |         |
| past the last constant                | (a)   | handle  | 26          | `playerstate: 00000246CAE58A80` |         |
| 2147483647                            | (a)   | handle  | 2147483647  | `playerstate: 00000246CB034120` |         |
| -2147483648                           | (a)   | handle  | -2147483648 | `playerstate: 0000024770C1D8D0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertPlayerScore`

| Case                                | Group | Outcome | Id          | Type                            | Message |
| ----------------------------------- | ----- | ------- | ----------- | ------------------------------- | ------- |
| PLAYER\_SCORE\_UNITS\_TRAINED       | (a)   | handle  | 0           | `playerscore: 000002476F061DF0` |         |
| PLAYER\_SCORE\_UNITS\_KILLED        | (a)   | handle  | 1           | `playerscore: 000002476F061E30` |         |
| PLAYER\_SCORE\_STRUCT\_BUILT        | (a)   | handle  | 2           | `playerscore: 000002476F061E70` |         |
| PLAYER\_SCORE\_STRUCT\_RAZED        | (a)   | handle  | 3           | `playerscore: 000002476F061EF0` |         |
| PLAYER\_SCORE\_TECH\_PERCENT        | (a)   | handle  | 4           | `playerscore: 000002476F061EB0` |         |
| PLAYER\_SCORE\_FOOD\_MAXPROD        | (a)   | handle  | 5           | `playerscore: 000002476F061F90` |         |
| PLAYER\_SCORE\_FOOD\_MAXUSED        | (a)   | handle  | 6           | `playerscore: 000002476F062070` |         |
| PLAYER\_SCORE\_HEROES\_KILLED       | (a)   | handle  | 7           | `playerscore: 000002476F0620B0` |         |
| PLAYER\_SCORE\_ITEMS\_GAINED        | (a)   | handle  | 8           | `playerscore: 000002476F0620F0` |         |
| PLAYER\_SCORE\_MERCS\_HIRED         | (a)   | handle  | 9           | `playerscore: 000002476F062130` |         |
| PLAYER\_SCORE\_GOLD\_MINED\_TOTAL   | (a)   | handle  | 10          | `playerscore: 000002476F062170` |         |
| PLAYER\_SCORE\_GOLD\_MINED\_UPKEEP  | (a)   | handle  | 11          | `playerscore: 000002476F0621B0` |         |
| PLAYER\_SCORE\_GOLD\_LOST\_UPKEEP   | (a)   | handle  | 12          | `playerscore: 000002476F061F30` |         |
| PLAYER\_SCORE\_GOLD\_LOST\_TAX      | (a)   | handle  | 13          | `playerscore: 000002476F061FD0` |         |
| PLAYER\_SCORE\_GOLD\_GIVEN          | (a)   | handle  | 14          | `playerscore: 000002476F062010` |         |
| PLAYER\_SCORE\_GOLD\_RECEIVED       | (a)   | handle  | 15          | `playerscore: 000002476F2B4F10` |         |
| PLAYER\_SCORE\_LUMBER\_TOTAL        | (a)   | handle  | 16          | `playerscore: 000002476F2B4F50` |         |
| PLAYER\_SCORE\_LUMBER\_LOST\_UPKEEP | (a)   | handle  | 17          | `playerscore: 000002476F2B4F90` |         |
| PLAYER\_SCORE\_LUMBER\_LOST\_TAX    | (a)   | handle  | 18          | `playerscore: 000002476F2B4DF0` |         |
| PLAYER\_SCORE\_LUMBER\_GIVEN        | (a)   | handle  | 19          | `playerscore: 000002476F2B4E30` |         |
| PLAYER\_SCORE\_LUMBER\_RECEIVED     | (a)   | handle  | 20          | `playerscore: 000002476F2B4E70` |         |
| PLAYER\_SCORE\_UNIT\_TOTAL          | (a)   | handle  | 21          | `playerscore: 000002476F2B4EB0` |         |
| PLAYER\_SCORE\_HERO\_TOTAL          | (a)   | handle  | 22          | `playerscore: 000002476EF6C7C0` |         |
| PLAYER\_SCORE\_RESOURCE\_TOTAL      | (a)   | handle  | 23          | `playerscore: 000002476EF6C800` |         |
| PLAYER\_SCORE\_TOTAL                | (a)   | handle  | 24          | `playerscore: 000002476EF6C840` |         |
| -1                                  | (a)   | handle  | -1          | `playerscore: 00000246CABFB740` |         |
| past the last constant              | (a)   | handle  | 25          | `playerscore: 00000246CABFC250` |         |
| 2147483647                          | (a)   | handle  | 2147483647  | `playerscore: 00000246CABF2CF0` |         |
| -2147483648                         | (a)   | handle  | -2147483648 | `playerscore: 00000246CABEED30` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertPlayerGameResult`

| Case                          | Group | Outcome | Id          | Type                                 | Message |
| ----------------------------- | ----- | ------- | ----------- | ------------------------------------ | ------- |
| PLAYER\_GAME\_RESULT\_VICTORY | (a)   | handle  | 0           | `playergameresult: 000002476B82DA00` |         |
| PLAYER\_GAME\_RESULT\_DEFEAT  | (a)   | handle  | 1           | `playergameresult: 000002476B828AC0` |         |
| PLAYER\_GAME\_RESULT\_TIE     | (a)   | handle  | 2           | `playergameresult: 000002476B7985B0` |         |
| PLAYER\_GAME\_RESULT\_NEUTRAL | (a)   | handle  | 3           | `playergameresult: 000002476EF79700` |         |
| -1                            | (a)   | handle  | -1          | `playergameresult: 00000246CAEDFEF0` |         |
| past the last constant        | (a)   | handle  | 4           | `playergameresult: 00000246CAEDB750` |         |
| 2147483647                    | (a)   | handle  | 2147483647  | `playergameresult: 00000246CAED6C90` |         |
| -2147483648                   | (a)   | handle  | -2147483648 | `playergameresult: 0000024770C21EB0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertUnitState`

| Case                   | Group | Outcome | Id          | Type                          | Message |
| ---------------------- | ----- | ------- | ----------- | ----------------------------- | ------- |
| UNIT\_STATE\_LIFE      | (a)   | handle  | 0           | `unitstate: 000002476F29F460` |         |
| UNIT\_STATE\_MAX\_LIFE | (a)   | handle  | 1           | `unitstate: 000002476F29F4A0` |         |
| UNIT\_STATE\_MANA      | (a)   | handle  | 2           | `unitstate: 000002476F29F4E0` |         |
| UNIT\_STATE\_MAX\_MANA | (a)   | handle  | 3           | `unitstate: 000002476F29F560` |         |
| -1                     | (a)   | handle  | -1          | `unitstate: 000002478911E280` |         |
| past the last constant | (a)   | handle  | 4           | `unitstate: 000002478913EF20` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `unitstate: 0000024789140630` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `unitstate: 00000247891330F0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertAIDifficulty`

| Case                   | Group | Outcome | Id          | Type                             | Message |
| ---------------------- | ----- | ------- | ----------- | -------------------------------- | ------- |
| AI\_DIFFICULTY\_NEWBIE | (a)   | handle  | 0           | `aidifficulty: 000002476F29F520` |         |
| AI\_DIFFICULTY\_NORMAL | (a)   | handle  | 1           | `aidifficulty: 000002476F2E5760` |         |
| AI\_DIFFICULTY\_INSANE | (a)   | handle  | 2           | `aidifficulty: 000002476F2E57A0` |         |
| -1                     | (a)   | handle  | -1          | `aidifficulty: 00000246CB017D90` |         |
| past the last constant | (a)   | handle  | 3           | `aidifficulty: 0000024789119400` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `aidifficulty: 00000246CB025DE0` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `aidifficulty: 00000247891F9820` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertGameEvent`

| Case                                  | Group | Outcome | Id          | Type                          | Message |
| ------------------------------------- | ----- | ------- | ----------- | ----------------------------- | ------- |
| EVENT\_GAME\_VICTORY                  | (a)   | handle  | 0           | `gameevent: 000002476EF6C880` |         |
| EVENT\_GAME\_END\_LEVEL               | (a)   | handle  | 1           | `gameevent: 000002476EF6C8C0` |         |
| EVENT\_GAME\_VARIABLE\_LIMIT          | (a)   | handle  | 2           | `gameevent: 000002476EF6C900` |         |
| EVENT\_GAME\_STATE\_LIMIT             | (a)   | handle  | 3           | `gameevent: 000002476EF6C980` |         |
| EVENT\_GAME\_TIMER\_EXPIRED           | (a)   | handle  | 4           | `gameevent: 000002476EF6C940` |         |
| EVENT\_GAME\_ENTER\_REGION            | (a)   | handle  | 5           | `gameevent: 000002476EF6CA20` |         |
| EVENT\_GAME\_LEAVE\_REGION            | (a)   | handle  | 6           | `gameevent: 000002476EF6CB00` |         |
| EVENT\_GAME\_TRACKABLE\_HIT           | (a)   | handle  | 7           | `gameevent: 000002476EF6CB40` |         |
| EVENT\_GAME\_TRACKABLE\_TRACK         | (a)   | handle  | 8           | `gameevent: 000002476EF6CB80` |         |
| EVENT\_GAME\_SHOW\_SKILL              | (a)   | handle  | 9           | `gameevent: 000002476EF6C9C0` |         |
| EVENT\_GAME\_BUILD\_SUBMENU           | (a)   | handle  | 10          | `gameevent: 000002476EF6CA60` |         |
| EVENT\_GAME\_LOADED                   | (a)   | handle  | 256         | `gameevent: 000002476EFDBF10` |         |
| EVENT\_GAME\_TOURNAMENT\_FINISH\_SOON | (a)   | handle  | 257         | `gameevent: 0000024761D515D0` |         |
| EVENT\_GAME\_TOURNAMENT\_FINISH\_NOW  | (a)   | handle  | 258         | `gameevent: 0000024761D516A0` |         |
| EVENT\_GAME\_SAVE                     | (a)   | handle  | 259         | `gameevent: 0000024761D516E0` |         |
| EVENT\_GAME\_CUSTOM\_UI\_FRAME        | (a)   | handle  | 310         | `gameevent: 0000024761D51720` |         |
| -1                                    | (a)   | handle  | -1          | `gameevent: 00000247891B51E0` |         |
| past the last constant                | (a)   | handle  | 311         | `gameevent: 00000247891B1340` |         |
| 2147483647                            | (a)   | handle  | 2147483647  | `gameevent: 00000247891ADEE0` |         |
| -2147483648                           | (a)   | handle  | -2147483648 | `gameevent: 00000247891A9170` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertPlayerEvent`

| Case                              | Group | Outcome | Id          | Type                            | Message |
| --------------------------------- | ----- | ------- | ----------- | ------------------------------- | ------- |
| EVENT\_PLAYER\_STATE\_LIMIT       | (a)   | handle  | 11          | `playerevent: 000002476EF6CAA0` |         |
| EVENT\_PLAYER\_ALLIANCE\_CHANGED  | (a)   | handle  | 12          | `playerevent: 000002476F256E60` |         |
| EVENT\_PLAYER\_DEFEAT             | (a)   | handle  | 13          | `playerevent: 000002476F256EF0` |         |
| EVENT\_PLAYER\_VICTORY            | (a)   | handle  | 14          | `playerevent: 000002476F256FC0` |         |
| EVENT\_PLAYER\_LEAVE              | (a)   | handle  | 15          | `playerevent: 000002476F257000` |         |
| EVENT\_PLAYER\_CHAT               | (a)   | handle  | 16          | `playerevent: 000002476F256EA0` |         |
| EVENT\_PLAYER\_END\_CINEMATIC     | (a)   | handle  | 17          | `playerevent: 000002476F256F30` |         |
| EVENT\_PLAYER\_ARROW\_LEFT\_DOWN  | (a)   | handle  | 261         | `playerevent: 0000024761D51760` |         |
| EVENT\_PLAYER\_ARROW\_LEFT\_UP    | (a)   | handle  | 262         | `playerevent: 000002476EFDBF50` |         |
| EVENT\_PLAYER\_ARROW\_RIGHT\_DOWN | (a)   | handle  | 263         | `playerevent: 0000024761D51610` |         |
| EVENT\_PLAYER\_ARROW\_RIGHT\_UP   | (a)   | handle  | 264         | `playerevent: 0000024761D51650` |         |
| EVENT\_PLAYER\_ARROW\_DOWN\_DOWN  | (a)   | handle  | 265         | `playerevent: 000002476F0C3BF0` |         |
| EVENT\_PLAYER\_ARROW\_DOWN\_UP    | (a)   | handle  | 266         | `playerevent: 000002476F0C3C30` |         |
| EVENT\_PLAYER\_ARROW\_UP\_DOWN    | (a)   | handle  | 267         | `playerevent: 000002476F0C3C70` |         |
| EVENT\_PLAYER\_ARROW\_UP\_UP      | (a)   | handle  | 268         | `playerevent: 000002476F0C3CB0` |         |
| EVENT\_PLAYER\_MOUSE\_DOWN        | (a)   | handle  | 305         | `playerevent: 000002476F257040` |         |
| EVENT\_PLAYER\_MOUSE\_UP          | (a)   | handle  | 306         | `playerevent: 000002476F257080` |         |
| EVENT\_PLAYER\_MOUSE\_MOVE        | (a)   | handle  | 307         | `playerevent: 000002476F2570C0` |         |
| EVENT\_PLAYER\_SYNC\_DATA         | (a)   | handle  | 309         | `playerevent: 000002476F257100` |         |
| EVENT\_PLAYER\_KEY                | (a)   | handle  | 311         | `playerevent: 000002476F0C39E0` |         |
| EVENT\_PLAYER\_KEY\_DOWN          | (a)   | handle  | 312         | `playerevent: 000002476F0C3A20` |         |
| EVENT\_PLAYER\_KEY\_UP            | (a)   | handle  | 313         | `playerevent: 000002476F0C3A60` |         |
| -1                                | (a)   | handle  | -1          | `playerevent: 00000246CB013D40` |         |
| past the last constant            | (a)   | handle  | 314         | `playerevent: 00000246CAC28170` |         |
| 2147483647                        | (a)   | handle  | 2147483647  | `playerevent: 00000246C2F84440` |         |
| -2147483648                       | (a)   | handle  | -2147483648 | `playerevent: 0000024789120000` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertPlayerUnitEvent`

| Case                                                                                   | Group | Outcome | Id          | Type                                | Message |
| -------------------------------------------------------------------------------------- | ----- | ------- | ----------- | ----------------------------------- | ------- |
| EVENT\_PLAYER\_UNIT\_ATTACKED                                                          | (a)   | handle  | 18          | `playerunitevent: 000002476F256F70` |         |
| EVENT\_PLAYER\_UNIT\_RESCUED                                                           | (a)   | handle  | 19          | `playerunitevent: 000002476F402060` |         |
| EVENT\_PLAYER\_UNIT\_DEATH                                                             | (a)   | handle  | 20          | `playerunitevent: 000002476F4020F0` |         |
| EVENT\_PLAYER\_UNIT\_DECAY                                                             | (a)   | handle  | 21          | `playerunitevent: 000002476F4021C0` |         |
| EVENT\_PLAYER\_UNIT\_DETECTED                                                          | (a)   | handle  | 22          | `playerunitevent: 000002476F402200` |         |
| EVENT\_PLAYER\_UNIT\_HIDDEN                                                            | (a)   | handle  | 23          | `playerunitevent: 000002476F402350` |         |
| EVENT\_PLAYER\_UNIT\_SELECTED                                                          | (a)   | handle  | 24          | `playerunitevent: 000002476F402390` |         |
| EVENT\_PLAYER\_UNIT\_DESELECTED                                                        | (a)   | handle  | 25          | `playerunitevent: 000002476F4023D0` |         |
| EVENT\_PLAYER\_UNIT\_CONSTRUCT\_START                                                  | (a)   | handle  | 26          | `playerunitevent: 000002476F402410` |         |
| EVENT\_PLAYER\_UNIT\_CONSTRUCT\_CANCEL                                                 | (a)   | handle  | 27          | `playerunitevent: 000002476F402450` |         |
| EVENT\_PLAYER\_UNIT\_CONSTRUCT\_FINISH                                                 | (a)   | handle  | 28          | `playerunitevent: 000002476F4020A0` |         |
| EVENT\_PLAYER\_UNIT\_UPGRADE\_START                                                    | (a)   | handle  | 29          | `playerunitevent: 000002476F402130` |         |
| EVENT\_PLAYER\_UNIT\_UPGRADE\_CANCEL                                                   | (a)   | handle  | 30          | `playerunitevent: 000002476F402170` |         |
| EVENT\_PLAYER\_UNIT\_UPGRADE\_FINISH                                                   | (a)   | handle  | 31          | `playerunitevent: 000002476F402240` |         |
| EVENT\_PLAYER\_UNIT\_TRAIN\_START                                                      | (a)   | handle  | 32          | `playerunitevent: 000002476F402280` |         |
| EVENT\_PLAYER\_UNIT\_TRAIN\_CANCEL                                                     | (a)   | handle  | 33          | `playerunitevent: 000002476F4022C0` |         |
| EVENT\_PLAYER\_UNIT\_TRAIN\_FINISH                                                     | (a)   | handle  | 34          | `playerunitevent: 000002476F402300` |         |
| EVENT\_PLAYER\_UNIT\_RESEARCH\_START                                                   | (a)   | handle  | 35          | `playerunitevent: 000002476F388EA0` |         |
| EVENT\_PLAYER\_UNIT\_RESEARCH\_CANCEL                                                  | (a)   | handle  | 36          | `playerunitevent: 000002476F388EE0` |         |
| EVENT\_PLAYER\_UNIT\_RESEARCH\_FINISH                                                  | (a)   | handle  | 37          | `playerunitevent: 000002476F388F20` |         |
| EVENT\_PLAYER\_UNIT\_ISSUED\_ORDER                                                     | (a)   | handle  | 38          | `playerunitevent: 000002476F388F60` |         |
| EVENT\_PLAYER\_UNIT\_ISSUED\_POINT\_ORDER                                              | (a)   | handle  | 39          | `playerunitevent: 000002476F388FA0` |         |
| EVENT\_PLAYER\_UNIT\_ISSUED\_TARGET\_ORDER or EVENT\_PLAYER\_UNIT\_ISSUED\_UNIT\_ORDER | (a)   | handle  | 40          | `playerunitevent: 000002476F388FE0` |         |
| EVENT\_PLAYER\_HERO\_LEVEL                                                             | (a)   | handle  | 41          | `playerunitevent: 000002476F389020` |         |
| EVENT\_PLAYER\_HERO\_SKILL                                                             | (a)   | handle  | 42          | `playerunitevent: 000002476F389060` |         |
| EVENT\_PLAYER\_HERO\_REVIVABLE                                                         | (a)   | handle  | 43          | `playerunitevent: 000002476F3890A0` |         |
| EVENT\_PLAYER\_HERO\_REVIVE\_START                                                     | (a)   | handle  | 44          | `playerunitevent: 000002476F3890E0` |         |
| EVENT\_PLAYER\_HERO\_REVIVE\_CANCEL                                                    | (a)   | handle  | 45          | `playerunitevent: 000002476F389120` |         |
| EVENT\_PLAYER\_HERO\_REVIVE\_FINISH                                                    | (a)   | handle  | 46          | `playerunitevent: 000002476F389160` |         |
| EVENT\_PLAYER\_UNIT\_SUMMON                                                            | (a)   | handle  | 47          | `playerunitevent: 000002476F3891A0` |         |
| EVENT\_PLAYER\_UNIT\_DROP\_ITEM                                                        | (a)   | handle  | 48          | `playerunitevent: 000002476F3891E0` |         |
| EVENT\_PLAYER\_UNIT\_PICKUP\_ITEM                                                      | (a)   | handle  | 49          | `playerunitevent: 000002476F389220` |         |
| EVENT\_PLAYER\_UNIT\_USE\_ITEM                                                         | (a)   | handle  | 50          | `playerunitevent: 000002476F389260` |         |
| EVENT\_PLAYER\_UNIT\_LOADED                                                            | (a)   | handle  | 51          | `playerunitevent: 000002476F358AE0` |         |
| EVENT\_PLAYER\_UNIT\_DAMAGED                                                           | (a)   | handle  | 308         | `playerunitevent: 000002476F358B20` |         |
| EVENT\_PLAYER\_UNIT\_DAMAGING                                                          | (a)   | handle  | 315         | `playerunitevent: 000002476F358B60` |         |
| EVENT\_PLAYER\_UNIT\_SELL                                                              | (a)   | handle  | 269         | `playerunitevent: 000002476F0C3AA0` |         |
| EVENT\_PLAYER\_UNIT\_CHANGE\_OWNER                                                     | (a)   | handle  | 270         | `playerunitevent: 000002476F0C3B70` |         |
| EVENT\_PLAYER\_UNIT\_SELL\_ITEM                                                        | (a)   | handle  | 271         | `playerunitevent: 000002476F0C3BB0` |         |
| EVENT\_PLAYER\_UNIT\_SPELL\_CHANNEL                                                    | (a)   | handle  | 272         | `playerunitevent: 000002476F358BA0` |         |
| EVENT\_PLAYER\_UNIT\_SPELL\_CAST                                                       | (a)   | handle  | 273         | `playerunitevent: 000002476F0C3AE0` |         |
| EVENT\_PLAYER\_UNIT\_SPELL\_EFFECT                                                     | (a)   | handle  | 274         | `playerunitevent: 000002476F0C3B20` |         |
| EVENT\_PLAYER\_UNIT\_SPELL\_FINISH                                                     | (a)   | handle  | 275         | `playerunitevent: 000002476F169EB0` |         |
| EVENT\_PLAYER\_UNIT\_SPELL\_ENDCAST                                                    | (a)   | handle  | 276         | `playerunitevent: 000002476F16A100` |         |
| EVENT\_PLAYER\_UNIT\_PAWN\_ITEM                                                        | (a)   | handle  | 277         | `playerunitevent: 000002476F16A140` |         |
| EVENT\_PLAYER\_UNIT\_STACK\_ITEM                                                       | (a)   | handle  | 319         | `playerunitevent: 000002476F16A180` |         |
| EVENT\_PLAYER\_UNIT\_EQUIP\_ITEM                                                       | (a)   | handle  | 321         | `playerunitevent: 000002476F169DA0` |         |
| EVENT\_PLAYER\_UNIT\_UNEQUIP\_ITEM                                                     | (a)   | handle  | 323         | `playerunitevent: 000002476F169DE0` |         |
| -1                                                                                     | (a)   | handle  | -1          | `playerunitevent: 00000247746724D0` |         |
| past the last constant                                                                 | (a)   | handle  | 324         | `playerunitevent: 000002478924CC30` |         |
| 2147483647                                                                             | (a)   | handle  | 2147483647  | `playerunitevent: 0000024774671670` |         |
| -2147483648                                                                            | (a)   | handle  | -2147483648 | `playerunitevent: 000002478924D1F0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertWidgetEvent`

| Case                   | Group | Outcome | Id          | Type                            | Message |
| ---------------------- | ----- | ------- | ----------- | ------------------------------- | ------- |
| EVENT\_WIDGET\_DEATH   | (a)   | handle  | 89          | `widgetevent: 000002476EFDBE00` |         |
| -1                     | (a)   | handle  | -1          | `widgetevent: 0000024789251740` |         |
| past the last constant | (a)   | handle  | 90          | `widgetevent: 00000247892543C0` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `widgetevent: 0000024789255B50` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `widgetevent: 0000024789253FD0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertDialogEvent`

| Case                         | Group | Outcome | Id          | Type                            | Message |
| ---------------------------- | ----- | ------- | ----------- | ------------------------------- | ------- |
| EVENT\_DIALOG\_BUTTON\_CLICK | (a)   | handle  | 90          | `dialogevent: 000002476EFDBE40` |         |
| EVENT\_DIALOG\_CLICK         | (a)   | handle  | 91          | `dialogevent: 000002476EFDBE80` |         |
| -1                           | (a)   | handle  | -1          | `dialogevent: 0000024789262550` |         |
| past the last constant       | (a)   | handle  | 92          | `dialogevent: 000002478925CA90` |         |
| 2147483647                   | (a)   | handle  | 2147483647  | `dialogevent: 0000024789261D70` |         |
| -2147483648                  | (a)   | handle  | -2147483648 | `dialogevent: 0000024789264DE0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertUnitEvent`

| Case                               | Group | Outcome | Id          | Type                          | Message |
| ---------------------------------- | ----- | ------- | ----------- | ----------------------------- | ------- |
| EVENT\_UNIT\_DAMAGED               | (a)   | handle  | 52          | `unitevent: 000002476F358BF0` |         |
| EVENT\_UNIT\_DAMAGING              | (a)   | handle  | 314         | `unitevent: 000002476F358C30` |         |
| EVENT\_UNIT\_DEATH                 | (a)   | handle  | 53          | `unitevent: 000002476F358CC0` |         |
| EVENT\_UNIT\_DECAY                 | (a)   | handle  | 54          | `unitevent: 000002476F358D90` |         |
| EVENT\_UNIT\_DETECTED              | (a)   | handle  | 55          | `unitevent: 000002476F358DD0` |         |
| EVENT\_UNIT\_HIDDEN                | (a)   | handle  | 56          | `unitevent: 000002476F358E10` |         |
| EVENT\_UNIT\_SELECTED              | (a)   | handle  | 57          | `unitevent: 000002476F358E50` |         |
| EVENT\_UNIT\_DESELECTED            | (a)   | handle  | 58          | `unitevent: 000002476F358E90` |         |
| EVENT\_UNIT\_STATE\_LIMIT          | (a)   | handle  | 59          | `unitevent: 000002476F358ED0` |         |
| EVENT\_UNIT\_ACQUIRED\_TARGET      | (a)   | handle  | 60          | `unitevent: 000002476F358C70` |         |
| EVENT\_UNIT\_TARGET\_IN\_RANGE     | (a)   | handle  | 61          | `unitevent: 000002476F358D00` |         |
| EVENT\_UNIT\_ATTACKED              | (a)   | handle  | 62          | `unitevent: 000002476F358D40` |         |
| EVENT\_UNIT\_RESCUED               | (a)   | handle  | 63          | `unitevent: 000002476F70EB10` |         |
| EVENT\_UNIT\_CONSTRUCT\_CANCEL     | (a)   | handle  | 64          | `unitevent: 000002476F70EB50` |         |
| EVENT\_UNIT\_CONSTRUCT\_FINISH     | (a)   | handle  | 65          | `unitevent: 000002476F70EB90` |         |
| EVENT\_UNIT\_UPGRADE\_START        | (a)   | handle  | 66          | `unitevent: 000002476F70EBD0` |         |
| EVENT\_UNIT\_UPGRADE\_CANCEL       | (a)   | handle  | 67          | `unitevent: 000002476F70E7F0` |         |
| EVENT\_UNIT\_UPGRADE\_FINISH       | (a)   | handle  | 68          | `unitevent: 000002476F70E830` |         |
| EVENT\_UNIT\_TRAIN\_START          | (a)   | handle  | 69          | `unitevent: 000002476F70E870` |         |
| EVENT\_UNIT\_TRAIN\_CANCEL         | (a)   | handle  | 70          | `unitevent: 000002476F70E8B0` |         |
| EVENT\_UNIT\_TRAIN\_FINISH         | (a)   | handle  | 71          | `unitevent: 000002476F70E8F0` |         |
| EVENT\_UNIT\_RESEARCH\_START       | (a)   | handle  | 72          | `unitevent: 000002476F70E930` |         |
| EVENT\_UNIT\_RESEARCH\_CANCEL      | (a)   | handle  | 73          | `unitevent: 000002476F70E970` |         |
| EVENT\_UNIT\_RESEARCH\_FINISH      | (a)   | handle  | 74          | `unitevent: 000002476F70E9B0` |         |
| EVENT\_UNIT\_ISSUED\_ORDER         | (a)   | handle  | 75          | `unitevent: 000002476F70E9F0` |         |
| EVENT\_UNIT\_ISSUED\_POINT\_ORDER  | (a)   | handle  | 76          | `unitevent: 000002476F70EA30` |         |
| EVENT\_UNIT\_ISSUED\_TARGET\_ORDER | (a)   | handle  | 77          | `unitevent: 000002476F70EA70` |         |
| EVENT\_UNIT\_HERO\_LEVEL           | (a)   | handle  | 78          | `unitevent: 000002476F70EAB0` |         |
| EVENT\_UNIT\_HERO\_SKILL           | (a)   | handle  | 79          | `unitevent: 000002476EFDBB80` |         |
| EVENT\_UNIT\_HERO\_REVIVABLE       | (a)   | handle  | 80          | `unitevent: 000002476EFDBBC0` |         |
| EVENT\_UNIT\_HERO\_REVIVE\_START   | (a)   | handle  | 81          | `unitevent: 000002476EFDBC00` |         |
| EVENT\_UNIT\_HERO\_REVIVE\_CANCEL  | (a)   | handle  | 82          | `unitevent: 000002476EFDBC40` |         |
| EVENT\_UNIT\_HERO\_REVIVE\_FINISH  | (a)   | handle  | 83          | `unitevent: 000002476EFDBC80` |         |
| EVENT\_UNIT\_SUMMON                | (a)   | handle  | 84          | `unitevent: 000002476EFDBCC0` |         |
| EVENT\_UNIT\_DROP\_ITEM            | (a)   | handle  | 85          | `unitevent: 000002476EFDBD00` |         |
| EVENT\_UNIT\_PICKUP\_ITEM          | (a)   | handle  | 86          | `unitevent: 000002476EFDBD40` |         |
| EVENT\_UNIT\_USE\_ITEM             | (a)   | handle  | 87          | `unitevent: 000002476EFDBD80` |         |
| EVENT\_UNIT\_LOADED                | (a)   | handle  | 88          | `unitevent: 000002476EFDBDC0` |         |
| EVENT\_UNIT\_SELL                  | (a)   | handle  | 286         | `unitevent: 000002476F169E20` |         |
| EVENT\_UNIT\_CHANGE\_OWNER         | (a)   | handle  | 287         | `unitevent: 000002476F169E60` |         |
| EVENT\_UNIT\_SELL\_ITEM            | (a)   | handle  | 288         | `unitevent: 000002476F0A1850` |         |
| EVENT\_UNIT\_SPELL\_CHANNEL        | (a)   | handle  | 289         | `unitevent: 000002476F0A1890` |         |
| EVENT\_UNIT\_SPELL\_CAST           | (a)   | handle  | 290         | `unitevent: 000002476F0A18D0` |         |
| EVENT\_UNIT\_SPELL\_EFFECT         | (a)   | handle  | 291         | `unitevent: 000002476F0A1910` |         |
| EVENT\_UNIT\_SPELL\_FINISH         | (a)   | handle  | 292         | `unitevent: 000002476F0A1950` |         |
| EVENT\_UNIT\_SPELL\_ENDCAST        | (a)   | handle  | 293         | `unitevent: 000002476F0A1990` |         |
| EVENT\_UNIT\_PAWN\_ITEM            | (a)   | handle  | 294         | `unitevent: 000002476F0A19D0` |         |
| EVENT\_UNIT\_STACK\_ITEM           | (a)   | handle  | 318         | `unitevent: 000002476F0A1A10` |         |
| EVENT\_UNIT\_EQUIP\_ITEM           | (a)   | handle  | 320         | `unitevent: 000002476F0A1A50` |         |
| EVENT\_UNIT\_UNEQUIP\_ITEM         | (a)   | handle  | 322         | `unitevent: 000002476F0A1A90` |         |
| -1                                 | (a)   | handle  | -1          | `unitevent: 00000247892E39B0` |         |
| past the last constant             | (a)   | handle  | 323         | `unitevent: 00000247892E85E0` |         |
| 2147483647                         | (a)   | handle  | 2147483647  | `unitevent: 00000247892F1510` |         |
| -2147483648                        | (a)   | handle  | -2147483648 | `unitevent: 00000247892EDE10` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertLimitOp`

| Case                     | Group | Outcome | Id          | Type                        | Message |
| ------------------------ | ----- | ------- | ----------- | --------------------------- | ------- |
| LESS\_THAN               | (a)   | handle  | 0           | `limitop: 000002476F0A1AD0` |         |
| LESS\_THAN\_OR\_EQUAL    | (a)   | handle  | 1           | `limitop: 000002476F0A1B10` |         |
| EQUAL                    | (a)   | handle  | 2           | `limitop: 000002476F0A1B50` |         |
| GREATER\_THAN\_OR\_EQUAL | (a)   | handle  | 3           | `limitop: 000002476F0A1BD0` |         |
| GREATER\_THAN            | (a)   | handle  | 4           | `limitop: 000002476F0A1B90` |         |
| NOT\_EQUAL               | (a)   | handle  | 5           | `limitop: 000002476F18F210` |         |
| -1                       | (a)   | handle  | -1          | `limitop: 00000247892FA980` |         |
| past the last constant   | (a)   | handle  | 6           | `limitop: 00000247892FE350` |         |
| 2147483647               | (a)   | handle  | 2147483647  | `limitop: 0000024789302200` |         |
| -2147483648              | (a)   | handle  | -2147483648 | `limitop: 00000247892FB2A0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertUnitType`

| Case                         | Group | Outcome | Id          | Type                         | Message |
| ---------------------------- | ----- | ------- | ----------- | ---------------------------- | ------- |
| UNIT\_TYPE\_HERO             | (a)   | handle  | 0           | `unittype: 000002476F18F2F0` |         |
| UNIT\_TYPE\_DEAD             | (a)   | handle  | 1           | `unittype: 000002476F18F330` |         |
| UNIT\_TYPE\_STRUCTURE        | (a)   | handle  | 2           | `unittype: 000002476F18F370` |         |
| UNIT\_TYPE\_FLYING           | (a)   | handle  | 3           | `unittype: 000002476F18F3F0` |         |
| UNIT\_TYPE\_GROUND           | (a)   | handle  | 4           | `unittype: 000002476F18F3B0` |         |
| UNIT\_TYPE\_ATTACKS\_FLYING  | (a)   | handle  | 5           | `unittype: 000002476F18F490` |         |
| UNIT\_TYPE\_ATTACKS\_GROUND  | (a)   | handle  | 6           | `unittype: 000002476F18F570` |         |
| UNIT\_TYPE\_MELEE\_ATTACKER  | (a)   | handle  | 7           | `unittype: 000002476F18F5B0` |         |
| UNIT\_TYPE\_RANGED\_ATTACKER | (a)   | handle  | 8           | `unittype: 000002476F18F5F0` |         |
| UNIT\_TYPE\_GIANT            | (a)   | handle  | 9           | `unittype: 000002476F18F430` |         |
| UNIT\_TYPE\_SUMMONED         | (a)   | handle  | 10          | `unittype: 000002476F0A1C10` |         |
| UNIT\_TYPE\_STUNNED          | (a)   | handle  | 11          | `unittype: 000002476F18F4D0` |         |
| UNIT\_TYPE\_PLAGUED          | (a)   | handle  | 12          | `unittype: 000002476F18F510` |         |
| UNIT\_TYPE\_SNARED           | (a)   | handle  | 13          | `unittype: 000002476F2A3DB0` |         |
| UNIT\_TYPE\_UNDEAD           | (a)   | handle  | 14          | `unittype: 000002476F2A3DF0` |         |
| UNIT\_TYPE\_MECHANICAL       | (a)   | handle  | 15          | `unittype: 000002476F2A3E30` |         |
| UNIT\_TYPE\_PEON             | (a)   | handle  | 16          | `unittype: 000002476F2A3E70` |         |
| UNIT\_TYPE\_SAPPER           | (a)   | handle  | 17          | `unittype: 000002476F2A3EB0` |         |
| UNIT\_TYPE\_TOWNHALL         | (a)   | handle  | 18          | `unittype: 000002476F2A3EF0` |         |
| UNIT\_TYPE\_ANCIENT          | (a)   | handle  | 19          | `unittype: 000002476F2A3F30` |         |
| UNIT\_TYPE\_TAUREN           | (a)   | handle  | 20          | `unittype: 000002476F2A3F70` |         |
| UNIT\_TYPE\_POISONED         | (a)   | handle  | 21          | `unittype: 000002476F2A3FB0` |         |
| UNIT\_TYPE\_POLYMORPHED      | (a)   | handle  | 22          | `unittype: 000002476F2A3FF0` |         |
| UNIT\_TYPE\_SLEEPING         | (a)   | handle  | 23          | `unittype: 000002476F2A4030` |         |
| UNIT\_TYPE\_RESISTANT        | (a)   | handle  | 24          | `unittype: 000002476F2A4070` |         |
| UNIT\_TYPE\_ETHEREAL         | (a)   | handle  | 25          | `unittype: 000002476F2A3C90` |         |
| UNIT\_TYPE\_MAGIC\_IMMUNE    | (a)   | handle  | 26          | `unittype: 000002476F2A3CD0` |         |
| -1                           | (a)   | handle  | -1          | `unittype: 000002478933D1E0` |         |
| past the last constant       | (a)   | handle  | 27          | `unittype: 0000024789340390` |         |
| 2147483647                   | (a)   | handle  | 2147483647  | `unittype: 000002478933FF70` |         |
| -2147483648                  | (a)   | handle  | -2147483648 | `unittype: 0000024789343640` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertGameSpeed`

| Case                   | Group | Outcome | Id          | Type                          | Message |
| ---------------------- | ----- | ------- | ----------- | ----------------------------- | ------- |
| MAP\_SPEED\_SLOWEST    | (a)   | handle  | 0           | `gamespeed: 000002476F327350` |         |
| MAP\_SPEED\_SLOW       | (a)   | handle  | 1           | `gamespeed: 000002476F327430` |         |
| MAP\_SPEED\_NORMAL     | (a)   | handle  | 2           | `gamespeed: 000002476F327470` |         |
| MAP\_SPEED\_FAST       | (a)   | handle  | 3           | `gamespeed: 000002476F3274F0` |         |
| MAP\_SPEED\_FASTEST    | (a)   | handle  | 4           | `gamespeed: 000002476F3274B0` |         |
| -1                     | (a)   | handle  | -1          | `gamespeed: 000002478934FDC0` |         |
| past the last constant | (a)   | handle  | 5           | `gamespeed: 0000024789353200` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `gamespeed: 000002478934E850` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `gamespeed: 0000024789356280` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertPlacement`

| Case                               | Group | Outcome | Id          | Type                          | Message |
| ---------------------------------- | ----- | ------- | ----------- | ----------------------------- | ------- |
| MAP\_PLACEMENT\_RANDOM             | (a)   | handle  | 0           | `placement: 000002476F28B0A0` |         |
| MAP\_PLACEMENT\_FIXED              | (a)   | handle  | 1           | `placement: 000002476F28B0E0` |         |
| MAP\_PLACEMENT\_USE\_MAP\_SETTINGS | (a)   | handle  | 2           | `placement: 000002476F2B9870` |         |
| MAP\_PLACEMENT\_TEAMS\_TOGETHER    | (a)   | handle  | 3           | `placement: 000002476F2B98F0` |         |
| -1                                 | (a)   | handle  | -1          | `placement: 00000247893625F0` |         |
| past the last constant             | (a)   | handle  | 4           | `placement: 0000024789362CA0` |         |
| 2147483647                         | (a)   | handle  | 2147483647  | `placement: 00000247893660F0` |         |
| -2147483648                        | (a)   | handle  | -2147483648 | `placement: 00000247893565F0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertStartLocPrio`

| Case                   | Group | Outcome | Id          | Type                             | Message |
| ---------------------- | ----- | ------- | ----------- | -------------------------------- | ------- |
| MAP\_LOC\_PRIO\_LOW    | (a)   | handle  | 0           | `startlocprio: 000002476F2B98B0` |         |
| MAP\_LOC\_PRIO\_HIGH   | (a)   | handle  | 1           | `startlocprio: 000002476F2B9990` |         |
| MAP\_LOC\_PRIO\_NOT    | (a)   | handle  | 2           | `startlocprio: 000002476F2B99D0` |         |
| -1                     | (a)   | handle  | -1          | `startlocprio: 000002478936F840` |         |
| past the last constant | (a)   | handle  | 3           | `startlocprio: 0000024789373300` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `startlocprio: 0000024789371D30` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `startlocprio: 0000024789375DD0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertGameDifficulty`

| Case                    | Group | Outcome | Id          | Type                               | Message |
| ----------------------- | ----- | ------- | ----------- | ---------------------------------- | ------- |
| MAP\_DIFFICULTY\_EASY   | (a)   | handle  | 0           | `gamedifficulty: 000002476F2B9B10` |         |
| MAP\_DIFFICULTY\_NORMAL | (a)   | handle  | 1           | `gamedifficulty: 000002476F2B9BF0` |         |
| MAP\_DIFFICULTY\_HARD   | (a)   | handle  | 2           | `gamedifficulty: 000002476F2B9C30` |         |
| MAP\_DIFFICULTY\_INSANE | (a)   | handle  | 3           | `gamedifficulty: 000002476F327390` |         |
| -1                      | (a)   | handle  | -1          | `gamedifficulty: 000002478936DF40` |         |
| past the last constant  | (a)   | handle  | 4           | `gamedifficulty: 0000024789382D70` |         |
| 2147483647              | (a)   | handle  | 2147483647  | `gamedifficulty: 0000024789386270` |         |
| -2147483648             | (a)   | handle  | -2147483648 | `gamedifficulty: 00000247893817D0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertGameType`

| Case                           | Group | Outcome | Id          | Type                         | Message |
| ------------------------------ | ----- | ------- | ----------- | ---------------------------- | ------- |
| GAME\_TYPE\_MELEE              | (a)   | handle  | 1           | `gametype: 000002476F3A74C0` |         |
| GAME\_TYPE\_FFA                | (a)   | handle  | 2           | `gametype: 000002476F3A7500` |         |
| GAME\_TYPE\_USE\_MAP\_SETTINGS | (a)   | handle  | 4           | `gametype: 000002476F3A7580` |         |
| GAME\_TYPE\_BLIZ               | (a)   | handle  | 8           | `gametype: 000002476F3A7540` |         |
| GAME\_TYPE\_ONE\_ON\_ONE       | (a)   | handle  | 16          | `gametype: 000002476F3A75C0` |         |
| GAME\_TYPE\_TWO\_TEAM\_PLAY    | (a)   | handle  | 32          | `gametype: 000002476F3A7650` |         |
| GAME\_TYPE\_THREE\_TEAM\_PLAY  | (a)   | handle  | 64          | `gametype: 000002476F3A7720` |         |
| GAME\_TYPE\_FOUR\_TEAM\_PLAY   | (a)   | handle  | 128         | `gametype: 000002476F3A7760` |         |
| -1                             | (a)   | handle  | -1          | `gametype: 0000024789399EE0` |         |
| past the last constant         | (a)   | handle  | 129         | `gametype: 0000024789395370` |         |
| 2147483647                     | (a)   | handle  | 2147483647  | `gametype: 000002478939F5E0` |         |
| -2147483648                    | (a)   | handle  | -2147483648 | `gametype: 00000247893A2C30` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertMapFlag`

| Case                                 | Group | Outcome | Id          | Type                        | Message |
| ------------------------------------ | ----- | ------- | ----------- | --------------------------- | ------- |
| MAP\_FOG\_HIDE\_TERRAIN              | (a)   | handle  | 1           | `mapflag: 000002476F3A7600` |         |
| MAP\_FOG\_MAP\_EXPLORED              | (a)   | handle  | 2           | `mapflag: 000002476F3A7690` |         |
| MAP\_FOG\_ALWAYS\_VISIBLE            | (a)   | handle  | 4           | `mapflag: 000002476EF7DB50` |         |
| MAP\_USE\_HANDICAPS                  | (a)   | handle  | 8           | `mapflag: 000002476EF7DBF0` |         |
| MAP\_OBSERVERS                       | (a)   | handle  | 16          | `mapflag: 000002476EF7DC30` |         |
| MAP\_OBSERVERS\_ON\_DEATH            | (a)   | handle  | 32          | `mapflag: 000002476EF7DC70` |         |
| MAP\_FIXED\_COLORS                   | (a)   | handle  | 128         | `mapflag: 000002476EF7DD40` |         |
| MAP\_LOCK\_RESOURCE\_TRADING         | (a)   | handle  | 256         | `mapflag: 000002476EF7DD80` |         |
| MAP\_RESOURCE\_TRADING\_ALLIES\_ONLY | (a)   | handle  | 512         | `mapflag: 000002476EF7DDC0` |         |
| MAP\_LOCK\_ALLIANCE\_CHANGES         | (a)   | handle  | 1024        | `mapflag: 000002476EF7DE00` |         |
| MAP\_ALLIANCE\_CHANGES\_HIDDEN       | (a)   | handle  | 2048        | `mapflag: 000002476F3A76D0` |         |
| MAP\_CHEATS                          | (a)   | handle  | 4096        | `mapflag: 000002476EF7DCB0` |         |
| MAP\_CHEATS\_HIDDEN                  | (a)   | handle  | 8192        | `mapflag: 000002476EF7DCF0` |         |
| MAP\_LOCK\_SPEED                     | (a)   | handle  | 16384       | `mapflag: 000002476F28B340` |         |
| MAP\_LOCK\_RANDOM\_SEED              | (a)   | handle  | 32768       | `mapflag: 000002476F28B380` |         |
| MAP\_SHARED\_ADVANCED\_CONTROL       | (a)   | handle  | 65536       | `mapflag: 000002476F28B3C0` |         |
| MAP\_RANDOM\_HERO                    | (a)   | handle  | 131072      | `mapflag: 000002476F28B400` |         |
| MAP\_RANDOM\_RACES                   | (a)   | handle  | 262144      | `mapflag: 000002476F28B020` |         |
| MAP\_RELOADED                        | (a)   | handle  | 524288      | `mapflag: 000002476F28B060` |         |
| -1                                   | (a)   | handle  | -1          | `mapflag: 00000247893CCFF0` |         |
| past the last constant               | (a)   | handle  | 524289      | `mapflag: 00000247893C5E20` |         |
| 2147483647                           | (a)   | handle  | 2147483647  | `mapflag: 00000247893CF6E0` |         |
| -2147483648                          | (a)   | handle  | -2147483648 | `mapflag: 00000247893D1DF0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertMapVisibility`

| Case       | Group | Outcome | Id         | Type                              | Message |
| ---------- | ----- | ------- | ---------- | --------------------------------- | ------- |
| 0          | (a)   | handle  | 0          | `mapvisibility: 00000247893D5C80` |         |
| 1          | (a)   | handle  | 1          | `mapvisibility: 00000247893D76B0` |         |
| -1         | (a)   | handle  | -1         | `mapvisibility: 00000247893D8190` |         |
| 2147483647 | (a)   | handle  | 2147483647 | `mapvisibility: 00000247893DA600` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for 0, 1, -1 and 2147483647, its type having no common.j constant (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertMapSetting`

| Case       | Group | Outcome | Id         | Type                           | Message |
| ---------- | ----- | ------- | ---------- | ------------------------------ | ------- |
| 0          | (a)   | handle  | 0          | `mapsetting: 00000247893DDCC0` |         |
| 1          | (a)   | handle  | 1          | `mapsetting: 00000247893E0BC0` |         |
| -1         | (a)   | handle  | -1         | `mapsetting: 00000247893DCBC0` |         |
| 2147483647 | (a)   | handle  | 2147483647 | `mapsetting: 00000247893E2B10` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for 0, 1, -1 and 2147483647, its type having no common.j constant (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertMapDensity`

| Case                   | Group | Outcome | Id          | Type                           | Message |
| ---------------------- | ----- | ------- | ----------- | ------------------------------ | ------- |
| MAP\_DENSITY\_NONE     | (a)   | handle  | 0           | `mapdensity: 000002476F2B9A50` |         |
| MAP\_DENSITY\_LIGHT    | (a)   | handle  | 1           | `mapdensity: 000002476F2B9A90` |         |
| MAP\_DENSITY\_MEDIUM   | (a)   | handle  | 2           | `mapdensity: 000002476F2B9AD0` |         |
| MAP\_DENSITY\_HEAVY    | (a)   | handle  | 3           | `mapdensity: 000002476F2B9B50` |         |
| -1                     | (a)   | handle  | -1          | `mapdensity: 00000247893EEDC0` |         |
| past the last constant | (a)   | handle  | 4           | `mapdensity: 00000247893EB580` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `mapdensity: 00000247893EDE40` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `mapdensity: 00000247893F3A80` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertMapControl`

| Case                    | Group | Outcome | Id          | Type                           | Message |
| ----------------------- | ----- | ------- | ----------- | ------------------------------ | ------- |
| MAP\_CONTROL\_USER      | (a)   | handle  | 0           | `mapcontrol: 000002476F426A90` |         |
| MAP\_CONTROL\_COMPUTER  | (a)   | handle  | 1           | `mapcontrol: 000002476F426AD0` |         |
| MAP\_CONTROL\_RESCUABLE | (a)   | handle  | 2           | `mapcontrol: 000002476D35D420` |         |
| MAP\_CONTROL\_NEUTRAL   | (a)   | handle  | 3           | `mapcontrol: 000002476F4268B0` |         |
| MAP\_CONTROL\_CREEP     | (a)   | handle  | 4           | `mapcontrol: 000002476F426870` |         |
| MAP\_CONTROL\_NONE      | (a)   | handle  | 5           | `mapcontrol: 000002476F3A73E0` |         |
| -1                      | (a)   | handle  | -1          | `mapcontrol: 00000247894022C0` |         |
| past the last constant  | (a)   | handle  | 6           | `mapcontrol: 0000024789404950` |         |
| 2147483647              | (a)   | handle  | 2147483647  | `mapcontrol: 0000024789408810` |         |
| -2147483648             | (a)   | handle  | -2147483648 | `mapcontrol: 00000247894014B0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertPlayerColor`

| Case                       | Group | Outcome | Id          | Type                            | Message |
| -------------------------- | ----- | ------- | ----------- | ------------------------------- | ------- |
| PLAYER\_COLOR\_RED         | (a)   | handle  | 0           | `playercolor: 000002476BAC8360` |         |
| PLAYER\_COLOR\_BLUE        | (a)   | handle  | 1           | `playercolor: 000002476DEB8840` |         |
| PLAYER\_COLOR\_CYAN        | (a)   | handle  | 2           | `playercolor: 000002476DE4F020` |         |
| PLAYER\_COLOR\_PURPLE      | (a)   | handle  | 3           | `playercolor: 000002476DE50D00` |         |
| PLAYER\_COLOR\_YELLOW      | (a)   | handle  | 4           | `playercolor: 000002476E2C8CD0` |         |
| PLAYER\_COLOR\_ORANGE      | (a)   | handle  | 5           | `playercolor: 000002476DE4FD20` |         |
| PLAYER\_COLOR\_GREEN       | (a)   | handle  | 6           | `playercolor: 000002476B8D4170` |         |
| PLAYER\_COLOR\_PINK        | (a)   | handle  | 7           | `playercolor: 000002476DE47020` |         |
| PLAYER\_COLOR\_LIGHT\_GRAY | (a)   | handle  | 8           | `playercolor: 000002476E2CA300` |         |
| PLAYER\_COLOR\_LIGHT\_BLUE | (a)   | handle  | 9           | `playercolor: 000002476E2882F0` |         |
| PLAYER\_COLOR\_AQUA        | (a)   | handle  | 10          | `playercolor: 000002476E2883D0` |         |
| PLAYER\_COLOR\_BROWN       | (a)   | handle  | 11          | `playercolor: 000002476DE44FC0` |         |
| PLAYER\_COLOR\_MAROON      | (a)   | handle  | 12          | `playercolor: 000002476B823A80` |         |
| PLAYER\_COLOR\_NAVY        | (a)   | handle  | 13          | `playercolor: 000002476E2C8350` |         |
| PLAYER\_COLOR\_TURQUOISE   | (a)   | handle  | 14          | `playercolor: 000002476E2C04C0` |         |
| PLAYER\_COLOR\_VIOLET      | (a)   | handle  | 15          | `playercolor: 000002476B76B5C0` |         |
| PLAYER\_COLOR\_WHEAT       | (a)   | handle  | 16          | `playercolor: 000002476B697CE0` |         |
| PLAYER\_COLOR\_PEACH       | (a)   | handle  | 17          | `playercolor: 000002476B6BE8D0` |         |
| PLAYER\_COLOR\_MINT        | (a)   | handle  | 18          | `playercolor: 000002476DE3FEB0` |         |
| PLAYER\_COLOR\_LAVENDER    | (a)   | handle  | 19          | `playercolor: 000002476DE4BA50` |         |
| PLAYER\_COLOR\_COAL        | (a)   | handle  | 20          | `playercolor: 000002476DE41B90` |         |
| PLAYER\_COLOR\_SNOW        | (a)   | handle  | 21          | `playercolor: 000002476B7C8930` |         |
| PLAYER\_COLOR\_EMERALD     | (a)   | handle  | 22          | `playercolor: 000002476E2DC130` |         |
| PLAYER\_COLOR\_PEANUT      | (a)   | handle  | 23          | `playercolor: 000002476DE4F7B0` |         |
| PLAYER\_COLOR\_BLACK       | (a)   | handle  | 24          | `playercolor: 000002476F0BF770` |         |
| -1                         | (a)   | handle  | -1          | `playercolor: 000002478925E9D0` |         |
| past the last constant     | (a)   | handle  | 25          | `playercolor: 0000024789374C60` |         |
| 2147483647                 | (a)   | handle  | 2147483647  | `playercolor: 0000024789374E40` |         |
| -2147483648                | (a)   | handle  | -2147483648 | `playercolor: 0000024789348C60` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertPlayerSlotState`

| Case                         | Group | Outcome | Id          | Type                                | Message |
| ---------------------------- | ----- | ------- | ----------- | ----------------------------------- | ------- |
| PLAYER\_SLOT\_STATE\_EMPTY   | (a)   | handle  | 0           | `playerslotstate: 000002476F327590` |         |
| PLAYER\_SLOT\_STATE\_PLAYING | (a)   | handle  | 1           | `playerslotstate: 000002476F3275D0` |         |
| PLAYER\_SLOT\_STATE\_LEFT    | (a)   | handle  | 2           | `playerslotstate: 000002476F327610` |         |
| -1                           | (a)   | handle  | -1          | `playerslotstate: 00000247892EF0F0` |         |
| past the last constant       | (a)   | handle  | 3           | `playerslotstate: 00000247892BB0A0` |         |
| 2147483647                   | (a)   | handle  | 2147483647  | `playerslotstate: 00000247892E1CD0` |         |
| -2147483648                  | (a)   | handle  | -2147483648 | `playerslotstate: 00000247892B6500` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertVolumeGroup`

| Case                                             | Group | Outcome | Id          | Type                            | Message |
| ------------------------------------------------ | ----- | ------- | ----------- | ------------------------------- | ------- |
| SOUND\_VOLUMEGROUP\_UNITMOVEMENT                 | (a)   | handle  | 0           | `volumegroup: 000002476F2FF920` |         |
| SOUND\_VOLUMEGROUP\_UNITSOUNDS                   | (a)   | handle  | 1           | `volumegroup: 000002476F2FF960` |         |
| SOUND\_VOLUMEGROUP\_COMBAT                       | (a)   | handle  | 2           | `volumegroup: 000002476F2FF9A0` |         |
| SOUND\_VOLUMEGROUP\_SPELLS                       | (a)   | handle  | 3           | `volumegroup: 000002476F2FFA20` |         |
| SOUND\_VOLUMEGROUP\_UI                           | (a)   | handle  | 4           | `volumegroup: 000002476F2FF9E0` |         |
| SOUND\_VOLUMEGROUP\_MUSIC                        | (a)   | handle  | 5           | `volumegroup: 000002476F2FFA60` |         |
| SOUND\_VOLUMEGROUP\_AMBIENTSOUNDS                | (a)   | handle  | 6           | `volumegroup: 000002476F2FFB40` |         |
| SOUND\_VOLUMEGROUP\_FIRE                         | (a)   | handle  | 7           | `volumegroup: 000002476F2FF7E0` |         |
| SOUND\_VOLUMEGROUP\_CINEMATIC\_GENERAL           | (a)   | handle  | 8           | `volumegroup: 000002476F0D0260` |         |
| SOUND\_VOLUMEGROUP\_CINEMATIC\_AMBIENT           | (a)   | handle  | 9           | `volumegroup: 000002476F0D02A0` |         |
| SOUND\_VOLUMEGROUP\_CINEMATIC\_MUSIC             | (a)   | handle  | 10          | `volumegroup: 000002476F0D0400` |         |
| SOUND\_VOLUMEGROUP\_CINEMATIC\_DIALOGUE          | (a)   | handle  | 11          | `volumegroup: 000002476F0D0440` |         |
| SOUND\_VOLUMEGROUP\_CINEMATIC\_SOUND\_EFFECTS\_1 | (a)   | handle  | 12          | `volumegroup: 000002476F0D0480` |         |
| SOUND\_VOLUMEGROUP\_CINEMATIC\_SOUND\_EFFECTS\_2 | (a)   | handle  | 13          | `volumegroup: 000002476F0D04C0` |         |
| SOUND\_VOLUMEGROUP\_CINEMATIC\_SOUND\_EFFECTS\_3 | (a)   | handle  | 14          | `volumegroup: 000002476F0D0500` |         |
| -1                                               | (a)   | handle  | -1          | `volumegroup: 00000246CAC35120` |         |
| past the last constant                           | (a)   | handle  | 15          | `volumegroup: 00000246CB007DD0` |         |
| 2147483647                                       | (a)   | handle  | 2147483647  | `volumegroup: 00000247891938D0` |         |
| -2147483648                                      | (a)   | handle  | -2147483648 | `volumegroup: 00000247891FA670` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertCameraField`

| Case                                      | Group | Outcome | Id          | Type                            | Message |
| ----------------------------------------- | ----- | ------- | ----------- | ------------------------------- | ------- |
| CAMERA\_FIELD\_TARGET\_DISTANCE           | (a)   | handle  | 0           | `camerafield: 000002476F0FD150` |         |
| CAMERA\_FIELD\_FARZ                       | (a)   | handle  | 1           | `camerafield: 000002476F0FD190` |         |
| CAMERA\_FIELD\_ANGLE\_OF\_ATTACK          | (a)   | handle  | 2           | `camerafield: 000002476F0FD1D0` |         |
| CAMERA\_FIELD\_FIELD\_OF\_VIEW            | (a)   | handle  | 3           | `camerafield: 000002476F2C20B0` |         |
| CAMERA\_FIELD\_ROLL                       | (a)   | handle  | 4           | `camerafield: 000002476F2C20F0` |         |
| CAMERA\_FIELD\_ROTATION                   | (a)   | handle  | 5           | `camerafield: 000002476F2C2130` |         |
| CAMERA\_FIELD\_ZOFFSET                    | (a)   | handle  | 6           | `camerafield: 000002476F2C2210` |         |
| CAMERA\_FIELD\_NEARZ                      | (a)   | handle  | 7           | `camerafield: 000002476F2C2250` |         |
| CAMERA\_FIELD\_LOCAL\_PITCH               | (a)   | handle  | 8           | `camerafield: 000002476F2C2290` |         |
| CAMERA\_FIELD\_LOCAL\_YAW                 | (a)   | handle  | 9           | `camerafield: 000002476F2C22D0` |         |
| CAMERA\_FIELD\_LOCAL\_ROLL                | (a)   | handle  | 10          | `camerafield: 000002476F2C2430` |         |
| CAMERA\_FIELD\_DEPTH\_OF\_FIELD\_DISTANCE | (a)   | handle  | 11          | `camerafield: 000002476F2C2470` |         |
| CAMERA\_FIELD\_DEPTH\_OF\_FIELD\_SCALE    | (a)   | handle  | 12          | `camerafield: 000002476F0FCF50` |         |
| CAMERA\_FIELD\_ZABSOLUTE                  | (a)   | handle  | 13          | `camerafield: 000002476F2C2170` |         |
| -1                                        | (a)   | handle  | -1          | `camerafield: 0000024770342940` |         |
| past the last constant                    | (a)   | handle  | 14          | `camerafield: 0000024770C41130` |         |
| 2147483647                                | (a)   | handle  | 2147483647  | `camerafield: 00000247698475C0` |         |
| -2147483648                               | (a)   | handle  | -2147483648 | `camerafield: 00000246CAC05DA0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertBlendMode`

| Case                                         | Group | Outcome | Id          | Type                          | Message |
| -------------------------------------------- | ----- | ------- | ----------- | ----------------------------- | ------- |
| BLEND\_MODE\_NONE or BLEND\_MODE\_DONT\_CARE | (a)   | handle  | 0           | `blendmode: 000002476F2C21B0` |         |
| BLEND\_MODE\_KEYALPHA                        | (a)   | handle  | 1           | `blendmode: 000002476F1E9160` |         |
| BLEND\_MODE\_BLEND                           | (a)   | handle  | 2           | `blendmode: 000002476F1E91A0` |         |
| BLEND\_MODE\_ADDITIVE                        | (a)   | handle  | 3           | `blendmode: 000002476F1E9220` |         |
| BLEND\_MODE\_MODULATE                        | (a)   | handle  | 4           | `blendmode: 000002476F1E91E0` |         |
| BLEND\_MODE\_MODULATE\_2X                    | (a)   | handle  | 5           | `blendmode: 000002476F1E92C0` |         |
| -1                                           | (a)   | handle  | -1          | `blendmode: 00000246CB031BD0` |         |
| past the last constant                       | (a)   | handle  | 6           | `blendmode: 00000246CB0231E0` |         |
| 2147483647                                   | (a)   | handle  | 2147483647  | `blendmode: 00000246CAEE4D50` |         |
| -2147483648                                  | (a)   | handle  | -2147483648 | `blendmode: 00000246CAC01DA0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertRarityControl`

| Case                   | Group | Outcome | Id          | Type                              | Message |
| ---------------------- | ----- | ------- | ----------- | --------------------------------- | ------- |
| RARITY\_FREQUENT       | (a)   | handle  | 0           | `raritycontrol: 000002476F1E93A0` |         |
| RARITY\_RARE           | (a)   | handle  | 1           | `raritycontrol: 000002476F1E93E0` |         |
| -1                     | (a)   | handle  | -1          | `raritycontrol: 00000246CB046040` |         |
| past the last constant | (a)   | handle  | 2           | `raritycontrol: 00000247698451E0` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `raritycontrol: 0000024789288580` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `raritycontrol: 0000024789193B80` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertTexMapFlags`

| Case                   | Group | Outcome | Id          | Type                            | Message |
| ---------------------- | ----- | ------- | ----------- | ------------------------------- | ------- |
| TEXMAP\_FLAG\_NONE     | (a)   | handle  | 0           | `texmapflags: 000002476F1E9420` |         |
| TEXMAP\_FLAG\_WRAP\_U  | (a)   | handle  | 1           | `texmapflags: 000002476F1E9460` |         |
| TEXMAP\_FLAG\_WRAP\_V  | (a)   | handle  | 2           | `texmapflags: 000002476F1E94A0` |         |
| TEXMAP\_FLAG\_WRAP\_UV | (a)   | handle  | 3           | `texmapflags: 000002476F1E9520` |         |
| -1                     | (a)   | handle  | -1          | `texmapflags: 00000246CB018FA0` |         |
| past the last constant | (a)   | handle  | 4           | `texmapflags: 0000024769843590` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `texmapflags: 00000247891B61B0` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `texmapflags: 000002476D4121A0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertFogState`

| Case                   | Group | Outcome | Id          | Type                         | Message |
| ---------------------- | ----- | ------- | ----------- | ---------------------------- | ------- |
| FOG\_OF\_WAR\_MASKED   | (a)   | handle  | 1           | `fogstate: 000002476F1E94E0` |         |
| FOG\_OF\_WAR\_FOGGED   | (a)   | handle  | 2           | `fogstate: 000002476F7BF090` |         |
| FOG\_OF\_WAR\_VISIBLE  | (a)   | handle  | 4           | `fogstate: 000002476F7BF110` |         |
| -1                     | (a)   | handle  | -1          | `fogstate: 00000247893815C0` |         |
| past the last constant | (a)   | handle  | 5           | `fogstate: 00000246CAFF6750` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `fogstate: 00000247891EDD80` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `fogstate: 00000247891FD270` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertEffectType`

| Case                       | Group | Outcome | Id          | Type                           | Message |
| -------------------------- | ----- | ------- | ----------- | ------------------------------ | ------- |
| EFFECT\_TYPE\_EFFECT       | (a)   | handle  | 0           | `effecttype: 000002476F7BF0D0` |         |
| EFFECT\_TYPE\_TARGET       | (a)   | handle  | 1           | `effecttype: 000002476F7BF1B0` |         |
| EFFECT\_TYPE\_CASTER       | (a)   | handle  | 2           | `effecttype: 000002476F7BF1F0` |         |
| EFFECT\_TYPE\_SPECIAL      | (a)   | handle  | 3           | `effecttype: 000002476F7BF270` |         |
| EFFECT\_TYPE\_AREA\_EFFECT | (a)   | handle  | 4           | `effecttype: 000002476F7BF230` |         |
| EFFECT\_TYPE\_MISSILE      | (a)   | handle  | 5           | `effecttype: 000002476F7BF310` |         |
| EFFECT\_TYPE\_LIGHTNING    | (a)   | handle  | 6           | `effecttype: 000002476F7BF3F0` |         |
| -1                         | (a)   | handle  | -1          | `effecttype: 000002478934EAF0` |         |
| past the last constant     | (a)   | handle  | 7           | `effecttype: 0000024789395670` |         |
| 2147483647                 | (a)   | handle  | 2147483647  | `effecttype: 00000247893CCB70` |         |
| -2147483648                | (a)   | handle  | -2147483648 | `effecttype: 00000246CAC3A140` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertVersion`

| Case                      | Group | Outcome | Id          | Type                        | Message |
| ------------------------- | ----- | ------- | ----------- | --------------------------- | ------- |
| VERSION\_REIGN\_OF\_CHAOS | (a)   | handle  | 0           | `version: 000002476F241DA0` |         |
| VERSION\_FROZEN\_THRONE   | (a)   | handle  | 1           | `version: 000002476F3A2970` |         |
| -1                        | (a)   | handle  | -1          | `version: 0000024789241A90` |         |
| past the last constant    | (a)   | handle  | 2           | `version: 00000247892C9AC0` |         |
| 2147483647                | (a)   | handle  | 2147483647  | `version: 00000246CB069770` |         |
| -2147483648               | (a)   | handle  | -2147483648 | `version: 00000246CAC29400` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertItemType`

| Case                                    | Group | Outcome | Id          | Type                         | Message |
| --------------------------------------- | ----- | ------- | ----------- | ---------------------------- | ------- |
| ITEM\_TYPE\_PERMANENT                   | (a)   | handle  | 0           | `itemtype: 000002476F2A3D10` |         |
| ITEM\_TYPE\_CHARGED                     | (a)   | handle  | 1           | `itemtype: 000002476F2A3D50` |         |
| ITEM\_TYPE\_POWERUP or ITEM\_TYPE\_TOME | (a)   | handle  | 2           | `itemtype: 000002476F2D7B30` |         |
| ITEM\_TYPE\_ARTIFACT                    | (a)   | handle  | 3           | `itemtype: 000002476F2D7BB0` |         |
| ITEM\_TYPE\_PURCHASABLE                 | (a)   | handle  | 4           | `itemtype: 000002476F2D7B70` |         |
| ITEM\_TYPE\_CAMPAIGN                    | (a)   | handle  | 5           | `itemtype: 000002476F2D7C50` |         |
| ITEM\_TYPE\_MISCELLANEOUS               | (a)   | handle  | 6           | `itemtype: 000002476F2D7BF0` |         |
| ITEM\_TYPE\_EQUIPMENT                   | (a)   | handle  | 7           | `itemtype: 000002476F118E30` |         |
| ITEM\_TYPE\_UNKNOWN                     | (a)   | handle  | 8           | `itemtype: 000002476F118E70` |         |
| ITEM\_TYPE\_ANY                         | (a)   | handle  | 9           | `itemtype: 000002476F118EB0` |         |
| -1                                      | (a)   | handle  | -1          | `itemtype: 0000024769843A00` |         |
| past the last constant                  | (a)   | handle  | 10          | `itemtype: 000002477467CC10` |         |
| 2147483647                              | (a)   | handle  | 2147483647  | `itemtype: 0000024789243570` |         |
| -2147483648                             | (a)   | handle  | -2147483648 | `itemtype: 000002476984A7B0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertAttackType`

| Case                   | Group | Outcome | Id          | Type                           | Message |
| ---------------------- | ----- | ------- | ----------- | ------------------------------ | ------- |
| ATTACK\_TYPE\_NORMAL   | (a)   | handle  | 0           | `attacktype: 000002476F1E4E30` |         |
| ATTACK\_TYPE\_MELEE    | (a)   | handle  | 1           | `attacktype: 000002476F316AE0` |         |
| ATTACK\_TYPE\_PIERCE   | (a)   | handle  | 2           | `attacktype: 000002476F02C170` |         |
| ATTACK\_TYPE\_SIEGE    | (a)   | handle  | 3           | `attacktype: 000002476F1DBEC0` |         |
| ATTACK\_TYPE\_MAGIC    | (a)   | handle  | 4           | `attacktype: 000002476ED4A6D0` |         |
| ATTACK\_TYPE\_CHAOS    | (a)   | handle  | 5           | `attacktype: 000002476F443660` |         |
| ATTACK\_TYPE\_HERO     | (a)   | handle  | 6           | `attacktype: 0000024761CC96C0` |         |
| -1                     | (a)   | handle  | -1          | `attacktype: 00000246CAE83AC0` |         |
| past the last constant | (a)   | handle  | 7           | `attacktype: 00000247891CA1B0` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `attacktype: 00000246CAEEBB80` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `attacktype: 00000247893CB570` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

## `nullability-converters-2`

- Probe: `nullability-converters-2`
- Patch: 3.0.1.24370
- Client: 3.0.1.24371
- Date: 2026-10-21
- Run: `18fe8249-7c26-46d8-9b38-207ea1e578a2`

### `ConvertDamageType`

| Case                         | Group | Outcome | Id          | Type                           | Message |
| ---------------------------- | ----- | ------- | ----------- | ------------------------------ | ------- |
| DAMAGE\_TYPE\_UNKNOWN        | (a)   | handle  | 0           | `damagetype: 000001B3DF561630` |         |
| DAMAGE\_TYPE\_NORMAL         | (a)   | handle  | 4           | `damagetype: 000001B3DF561670` |         |
| DAMAGE\_TYPE\_ENHANCED       | (a)   | handle  | 5           | `damagetype: 000001B3DF5888B0` |         |
| DAMAGE\_TYPE\_FIRE           | (a)   | handle  | 8           | `damagetype: 000001B3DF588860` |         |
| DAMAGE\_TYPE\_COLD           | (a)   | handle  | 9           | `damagetype: 000001B3DF4F3FE0` |         |
| DAMAGE\_TYPE\_LIGHTNING      | (a)   | handle  | 10          | `damagetype: 000001B3DF4F4020` |         |
| DAMAGE\_TYPE\_POISON         | (a)   | handle  | 11          | `damagetype: 000001B3DF51D720` |         |
| DAMAGE\_TYPE\_DISEASE        | (a)   | handle  | 12          | `damagetype: 000001B3DF51D760` |         |
| DAMAGE\_TYPE\_DIVINE         | (a)   | handle  | 13          | `damagetype: 000001B3DF45A1A0` |         |
| DAMAGE\_TYPE\_MAGIC          | (a)   | handle  | 14          | `damagetype: 000001B3DF45A1E0` |         |
| DAMAGE\_TYPE\_SONIC          | (a)   | handle  | 15          | `damagetype: 000001B3DF42B3E0` |         |
| DAMAGE\_TYPE\_ACID           | (a)   | handle  | 16          | `damagetype: 000001B3DF42B420` |         |
| DAMAGE\_TYPE\_FORCE          | (a)   | handle  | 17          | `damagetype: 000001B3DF417830` |         |
| DAMAGE\_TYPE\_DEATH          | (a)   | handle  | 18          | `damagetype: 000001B3DF417870` |         |
| DAMAGE\_TYPE\_MIND           | (a)   | handle  | 19          | `damagetype: 000001B3DF3E93D0` |         |
| DAMAGE\_TYPE\_PLANT          | (a)   | handle  | 20          | `damagetype: 000001B3DF3E9410` |         |
| DAMAGE\_TYPE\_DEFENSIVE      | (a)   | handle  | 21          | `damagetype: 000001B3DF4F9A70` |         |
| DAMAGE\_TYPE\_DEMOLITION     | (a)   | handle  | 22          | `damagetype: 000001B3DF4F9AB0` |         |
| DAMAGE\_TYPE\_SLOW\_POISON   | (a)   | handle  | 23          | `damagetype: 000001B3DF457520` |         |
| DAMAGE\_TYPE\_SPIRIT\_LINK   | (a)   | handle  | 24          | `damagetype: 000001B3DF457560` |         |
| DAMAGE\_TYPE\_SHADOW\_STRIKE | (a)   | handle  | 25          | `damagetype: 000001B3DF477F40` |         |
| DAMAGE\_TYPE\_UNIVERSAL      | (a)   | handle  | 26          | `damagetype: 000001B3DF477F80` |         |
| -1                           | (a)   | handle  | -1          | `damagetype: 000001B3FC69D380` |         |
| past the last constant       | (a)   | handle  | 27          | `damagetype: 000001B3F3CE8F90` |         |
| 2147483647                   | (a)   | handle  | 2147483647  | `damagetype: 000001B3F3EDEC00` |         |
| -2147483648                  | (a)   | handle  | -2147483648 | `damagetype: 000001B3F3EA2530` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertWeaponType`

| Case                               | Group | Outcome | Id          | Type                           | Message |
| ---------------------------------- | ----- | ------- | ----------- | ------------------------------ | ------- |
| WEAPON\_TYPE\_WHOKNOWS             | (a)   | handle  | 0           | `weapontype: 000001B3DF4813B0` |         |
| WEAPON\_TYPE\_METAL\_LIGHT\_CHOP   | (a)   | handle  | 1           | `weapontype: 000001B3DF4813F0` |         |
| WEAPON\_TYPE\_METAL\_MEDIUM\_CHOP  | (a)   | handle  | 2           | `weapontype: 000001B3DF435CB0` |         |
| WEAPON\_TYPE\_METAL\_HEAVY\_CHOP   | (a)   | handle  | 3           | `weapontype: 000001B3DF58AA90` |         |
| WEAPON\_TYPE\_METAL\_LIGHT\_SLICE  | (a)   | handle  | 4           | `weapontype: 000001B3DF58AAD0` |         |
| WEAPON\_TYPE\_METAL\_MEDIUM\_SLICE | (a)   | handle  | 5           | `weapontype: 000001B3DF504550` |         |
| WEAPON\_TYPE\_METAL\_HEAVY\_SLICE  | (a)   | handle  | 6           | `weapontype: 000001B3DF504590` |         |
| WEAPON\_TYPE\_METAL\_MEDIUM\_BASH  | (a)   | handle  | 7           | `weapontype: 000001B3DF435CF0` |         |
| WEAPON\_TYPE\_METAL\_HEAVY\_BASH   | (a)   | handle  | 8           | `weapontype: 000001B3DF458390` |         |
| WEAPON\_TYPE\_METAL\_MEDIUM\_STAB  | (a)   | handle  | 9           | `weapontype: 000001B3DF4583D0` |         |
| WEAPON\_TYPE\_METAL\_HEAVY\_STAB   | (a)   | handle  | 10          | `weapontype: 000001B3DF3FAC00` |         |
| WEAPON\_TYPE\_WOOD\_LIGHT\_SLICE   | (a)   | handle  | 11          | `weapontype: 000001B3DF3FAC40` |         |
| WEAPON\_TYPE\_WOOD\_MEDIUM\_SLICE  | (a)   | handle  | 12          | `weapontype: 000001B3E0FC6A30` |         |
| WEAPON\_TYPE\_WOOD\_HEAVY\_SLICE   | (a)   | handle  | 13          | `weapontype: 000001B3E0FC6A70` |         |
| WEAPON\_TYPE\_WOOD\_LIGHT\_BASH    | (a)   | handle  | 14          | `weapontype: 000001B3DF51E050` |         |
| WEAPON\_TYPE\_WOOD\_MEDIUM\_BASH   | (a)   | handle  | 15          | `weapontype: 000001B3DF51E090` |         |
| WEAPON\_TYPE\_WOOD\_HEAVY\_BASH    | (a)   | handle  | 16          | `weapontype: 000001B3DF51BB80` |         |
| WEAPON\_TYPE\_WOOD\_LIGHT\_STAB    | (a)   | handle  | 17          | `weapontype: 000001B3DF51BBC0` |         |
| WEAPON\_TYPE\_WOOD\_MEDIUM\_STAB   | (a)   | handle  | 18          | `weapontype: 000001B3DFFF79D0` |         |
| WEAPON\_TYPE\_CLAW\_LIGHT\_SLICE   | (a)   | handle  | 19          | `weapontype: 000001B3DFFF7A10` |         |
| WEAPON\_TYPE\_CLAW\_MEDIUM\_SLICE  | (a)   | handle  | 20          | `weapontype: 000001B3DF511860` |         |
| WEAPON\_TYPE\_CLAW\_HEAVY\_SLICE   | (a)   | handle  | 21          | `weapontype: 000001B3DF5118A0` |         |
| WEAPON\_TYPE\_AXE\_MEDIUM\_CHOP    | (a)   | handle  | 22          | `weapontype: 000001B3DF4AB0D0` |         |
| WEAPON\_TYPE\_ROCK\_HEAVY\_BASH    | (a)   | handle  | 23          | `weapontype: 000001B3DF4AB110` |         |
| -1                                 | (a)   | handle  | -1          | `weapontype: 000001B3FB9FB690` |         |
| past the last constant             | (a)   | handle  | 24          | `weapontype: 000001B3F8997C90` |         |
| 2147483647                         | (a)   | handle  | 2147483647  | `weapontype: 000001B3F3C2B990` |         |
| -2147483648                        | (a)   | handle  | -2147483648 | `weapontype: 000001B3FC074C00` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertSoundType`

| Case                        | Group | Outcome | Id          | Type                          | Message |
| --------------------------- | ----- | ------- | ----------- | ----------------------------- | ------- |
| SOUND\_TYPE\_EFFECT         | (a)   | handle  | 0           | `soundtype: 000001B3DFACBE90` |         |
| SOUND\_TYPE\_EFFECT\_LOOPED | (a)   | handle  | 1           | `soundtype: 000001B3DFACABB0` |         |
| -1                          | (a)   | handle  | -1          | `soundtype: 000001B3FC0FD1D0` |         |
| past the last constant      | (a)   | handle  | 2           | `soundtype: 000001B3FB96B180` |         |
| 2147483647                  | (a)   | handle  | 2147483647  | `soundtype: 000001B3F3C27790` |         |
| -2147483648                 | (a)   | handle  | -2147483648 | `soundtype: 000001B3FC67FAB0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertPathingType`

| Case                              | Group | Outcome | Id          | Type                            | Message |
| --------------------------------- | ----- | ------- | ----------- | ------------------------------- | ------- |
| PATHING\_TYPE\_ANY                | (a)   | handle  | 0           | `pathingtype: 000001B3DF5109B0` |         |
| PATHING\_TYPE\_WALKABILITY        | (a)   | handle  | 1           | `pathingtype: 000001B3DF5109F0` |         |
| PATHING\_TYPE\_FLYABILITY         | (a)   | handle  | 2           | `pathingtype: 000001B3DF4163C0` |         |
| PATHING\_TYPE\_BUILDABILITY       | (a)   | handle  | 3           | `pathingtype: 000001B3DF3C1BC0` |         |
| PATHING\_TYPE\_PEONHARVESTPATHING | (a)   | handle  | 4           | `pathingtype: 000001B3DF3C1C00` |         |
| PATHING\_TYPE\_BLIGHTPATHING      | (a)   | handle  | 5           | `pathingtype: 000001B3DF445620` |         |
| PATHING\_TYPE\_FLOATABILITY       | (a)   | handle  | 6           | `pathingtype: 000001B3DF445660` |         |
| PATHING\_TYPE\_AMPHIBIOUSPATHING  | (a)   | handle  | 7           | `pathingtype: 000001B3DF416400` |         |
| -1                                | (a)   | handle  | -1          | `pathingtype: 000001B3F3C2A720` |         |
| past the last constant            | (a)   | handle  | 8           | `pathingtype: 000001B3FC6960C0` |         |
| 2147483647                        | (a)   | handle  | 2147483647  | `pathingtype: 000001B3FB3A9600` |         |
| -2147483648                       | (a)   | handle  | -2147483648 | `pathingtype: 000001B3FC6989E0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertMouseButtonType`

| Case                        | Group | Outcome | Id          | Type                                | Message |
| --------------------------- | ----- | ------- | ----------- | ----------------------------------- | ------- |
| MOUSE\_BUTTON\_TYPE\_LEFT   | (a)   | handle  | 1           | `mousebuttontype: 000001B3DF3E81C0` |         |
| MOUSE\_BUTTON\_TYPE\_MIDDLE | (a)   | handle  | 2           | `mousebuttontype: 000001B3DF3E8200` |         |
| MOUSE\_BUTTON\_TYPE\_RIGHT  | (a)   | handle  | 4           | `mousebuttontype: 000001B3DF3A79F0` |         |
| -1                          | (a)   | handle  | 1073741824  | `mousebuttontype: 000001B3FB3CDA90` |         |
| past the last constant      | (a)   | handle  | 8           | `mousebuttontype: 000001B3FC8F6090` |         |
| 2147483647                  | (a)   | handle  | 1073741824  | `mousebuttontype: 000001B3FB3CDA90` |         |
| -2147483648                 | (a)   | handle  | -2147483648 | `mousebuttontype: 000001B3F3BC7E70` |         |

- Family: `converter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the bit flag \`1 \<\< ((i - 1) & 31)\` of the integer \`i\` passed in. Evidence, not proof.

### `ConvertAnimType`

| Case                   | Group | Outcome | Id          | Type                         | Message |
| ---------------------- | ----- | ------- | ----------- | ---------------------------- | ------- |
| ANIM\_TYPE\_BIRTH      | (a)   | handle  | 0           | `animtype: 000001B3DF3A79B0` |         |
| ANIM\_TYPE\_DEATH      | (a)   | handle  | 1           | `animtype: 000001B3DF54FE10` |         |
| ANIM\_TYPE\_DECAY      | (a)   | handle  | 2           | `animtype: 000001B3DF3D22A0` |         |
| ANIM\_TYPE\_DISSIPATE  | (a)   | handle  | 3           | `animtype: 000001B3DF596260` |         |
| ANIM\_TYPE\_STAND      | (a)   | handle  | 4           | `animtype: 000001B3DF5962A0` |         |
| ANIM\_TYPE\_WALK       | (a)   | handle  | 5           | `animtype: 000001B3DF477520` |         |
| ANIM\_TYPE\_ATTACK     | (a)   | handle  | 6           | `animtype: 000001B3DF477560` |         |
| ANIM\_TYPE\_MORPH      | (a)   | handle  | 7           | `animtype: 000001B3DF3D22E0` |         |
| ANIM\_TYPE\_SLEEP      | (a)   | handle  | 8           | `animtype: 000001B3DF453870` |         |
| ANIM\_TYPE\_SPELL      | (a)   | handle  | 9           | `animtype: 000001B3DF4538B0` |         |
| ANIM\_TYPE\_PORTRAIT   | (a)   | handle  | 10          | `animtype: 000001B3DF499100` |         |
| -1                     | (a)   | handle  | -1          | `animtype: 000001B3FC934280` |         |
| past the last constant | (a)   | handle  | 11          | `animtype: 000001B3FC92B380` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `animtype: 000001B3FC9367E0` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `animtype: 000001B3FC9546D0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertSubAnimType`

| Case                          | Group | Outcome | Id          | Type                            | Message |
| ----------------------------- | ----- | ------- | ----------- | ------------------------------- | ------- |
| SUBANIM\_TYPE\_ROOTED         | (a)   | handle  | 11          | `subanimtype: 000001B3DF499140` |         |
| SUBANIM\_TYPE\_ALTERNATE\_EX  | (a)   | handle  | 12          | `subanimtype: 000001B3DF4699D0` |         |
| SUBANIM\_TYPE\_LOOPING        | (a)   | handle  | 13          | `subanimtype: 000001B3DF3D5B70` |         |
| SUBANIM\_TYPE\_SLAM           | (a)   | handle  | 14          | `subanimtype: 000001B3DF469A10` |         |
| SUBANIM\_TYPE\_THROW          | (a)   | handle  | 15          | `subanimtype: 000001B3DF3D5BB0` |         |
| SUBANIM\_TYPE\_SPIKED         | (a)   | handle  | 16          | `subanimtype: 000001B3DF3C24C0` |         |
| SUBANIM\_TYPE\_FAST           | (a)   | handle  | 17          | `subanimtype: 000001B3DF3C2500` |         |
| SUBANIM\_TYPE\_SPIN           | (a)   | handle  | 18          | `subanimtype: 000001B3DF48CEF0` |         |
| SUBANIM\_TYPE\_READY          | (a)   | handle  | 19          | `subanimtype: 000001B3DF48CF30` |         |
| SUBANIM\_TYPE\_CHANNEL        | (a)   | handle  | 20          | `subanimtype: 000001B3DF493D70` |         |
| SUBANIM\_TYPE\_DEFEND         | (a)   | handle  | 21          | `subanimtype: 000001B3DF493DB0` |         |
| SUBANIM\_TYPE\_VICTORY        | (a)   | handle  | 22          | `subanimtype: 000001B3DF5601C0` |         |
| SUBANIM\_TYPE\_TURN           | (a)   | handle  | 23          | `subanimtype: 000001B3DF560200` |         |
| SUBANIM\_TYPE\_LEFT           | (a)   | handle  | 24          | `subanimtype: 000001B3DF4A80F0` |         |
| SUBANIM\_TYPE\_RIGHT          | (a)   | handle  | 25          | `subanimtype: 000001B3DF4A8130` |         |
| SUBANIM\_TYPE\_FIRE           | (a)   | handle  | 26          | `subanimtype: 000001B3DF497180` |         |
| SUBANIM\_TYPE\_FLESH          | (a)   | handle  | 27          | `subanimtype: 000001B3DF4971C0` |         |
| SUBANIM\_TYPE\_HIT            | (a)   | handle  | 28          | `subanimtype: 000001B3DF5A9ED0` |         |
| SUBANIM\_TYPE\_WOUNDED        | (a)   | handle  | 29          | `subanimtype: 000001B3DF5A9F10` |         |
| SUBANIM\_TYPE\_LIGHT          | (a)   | handle  | 30          | `subanimtype: 000001B3DF3E1A50` |         |
| SUBANIM\_TYPE\_MODERATE       | (a)   | handle  | 31          | `subanimtype: 000001B3DF3E1A90` |         |
| SUBANIM\_TYPE\_SEVERE         | (a)   | handle  | 32          | `subanimtype: 000001B3DF44F3A0` |         |
| SUBANIM\_TYPE\_CRITICAL       | (a)   | handle  | 33          | `subanimtype: 000001B3DF44F3E0` |         |
| SUBANIM\_TYPE\_COMPLETE       | (a)   | handle  | 34          | `subanimtype: 000001B3DF4C75A0` |         |
| SUBANIM\_TYPE\_GOLD           | (a)   | handle  | 35          | `subanimtype: 000001B3DF5069C0` |         |
| SUBANIM\_TYPE\_LUMBER         | (a)   | handle  | 36          | `subanimtype: 000001B3DF4C75E0` |         |
| SUBANIM\_TYPE\_WORK           | (a)   | handle  | 37          | `subanimtype: 000001B3DF506A00` |         |
| SUBANIM\_TYPE\_TALK           | (a)   | handle  | 38          | `subanimtype: 000001B3DF39F920` |         |
| SUBANIM\_TYPE\_FIRST          | (a)   | handle  | 39          | `subanimtype: 000001B3DF39F960` |         |
| SUBANIM\_TYPE\_SECOND         | (a)   | handle  | 40          | `subanimtype: 000001B3DF4089B0` |         |
| SUBANIM\_TYPE\_THIRD          | (a)   | handle  | 41          | `subanimtype: 000001B3DF4089F0` |         |
| SUBANIM\_TYPE\_FOURTH         | (a)   | handle  | 42          | `subanimtype: 000001B3DF58C470` |         |
| SUBANIM\_TYPE\_FIFTH          | (a)   | handle  | 43          | `subanimtype: 000001B3DF58C4B0` |         |
| SUBANIM\_TYPE\_ONE            | (a)   | handle  | 44          | `subanimtype: 000001B3DF45BFC0` |         |
| SUBANIM\_TYPE\_TWO            | (a)   | handle  | 45          | `subanimtype: 000001B3DF45C000` |         |
| SUBANIM\_TYPE\_THREE          | (a)   | handle  | 46          | `subanimtype: 000001B3DF55A810` |         |
| SUBANIM\_TYPE\_FOUR           | (a)   | handle  | 47          | `subanimtype: 000001B3DF55A850` |         |
| SUBANIM\_TYPE\_FIVE           | (a)   | handle  | 48          | `subanimtype: 000001B3DF414BA0` |         |
| SUBANIM\_TYPE\_SMALL          | (a)   | handle  | 49          | `subanimtype: 000001B3DF414BE0` |         |
| SUBANIM\_TYPE\_MEDIUM         | (a)   | handle  | 50          | `subanimtype: 000001B3DF559000` |         |
| SUBANIM\_TYPE\_LARGE          | (a)   | handle  | 51          | `subanimtype: 000001B3DF559040` |         |
| SUBANIM\_TYPE\_UPGRADE        | (a)   | handle  | 52          | `subanimtype: 000001B3DF401A90` |         |
| SUBANIM\_TYPE\_DRAIN          | (a)   | handle  | 53          | `subanimtype: 000001B3DF401AD0` |         |
| SUBANIM\_TYPE\_FILL           | (a)   | handle  | 54          | `subanimtype: 000001B3DF431180` |         |
| SUBANIM\_TYPE\_CHAINLIGHTNING | (a)   | handle  | 55          | `subanimtype: 000001B3DF4311C0` |         |
| SUBANIM\_TYPE\_EATTREE        | (a)   | handle  | 56          | `subanimtype: 000001B3DF4F5220` |         |
| SUBANIM\_TYPE\_PUKE           | (a)   | handle  | 57          | `subanimtype: 000001B3DF4F5260` |         |
| SUBANIM\_TYPE\_FLAIL          | (a)   | handle  | 58          | `subanimtype: 000001B3DF3F6830` |         |
| SUBANIM\_TYPE\_OFF            | (a)   | handle  | 59          | `subanimtype: 000001B3DF3F6870` |         |
| SUBANIM\_TYPE\_SWIM           | (a)   | handle  | 60          | `subanimtype: 000001B3DF5943D0` |         |
| SUBANIM\_TYPE\_ENTANGLE       | (a)   | handle  | 61          | `subanimtype: 000001B3DF594410` |         |
| SUBANIM\_TYPE\_BERSERK        | (a)   | handle  | 62          | `subanimtype: 000001B3DF5230B0` |         |
| -1                            | (a)   | handle  | -1          | `subanimtype: 000001B3FC9D7900` |         |
| past the last constant        | (a)   | handle  | 63          | `subanimtype: 000001B3FC9D5B60` |         |
| 2147483647                    | (a)   | handle  | 2147483647  | `subanimtype: 000001B3FC9DBCA0` |         |
| -2147483648                   | (a)   | handle  | -2147483648 | `subanimtype: 000001B3FC9D7C80` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertOriginFrameType`

| Case                                         | Group | Outcome | Id          | Type                                | Message |
| -------------------------------------------- | ----- | ------- | ----------- | ----------------------------------- | ------- |
| ORIGIN\_FRAME\_GAME\_UI                      | (a)   | handle  | 0           | `originframetype: 000001B3DFACABF0` |         |
| ORIGIN\_FRAME\_COMMAND\_BUTTON               | (a)   | handle  | 1           | `originframetype: 000001B3DFAE8FF0` |         |
| ORIGIN\_FRAME\_HERO\_BAR                     | (a)   | handle  | 2           | `originframetype: 000001B3DFAE9030` |         |
| ORIGIN\_FRAME\_HERO\_BUTTON                  | (a)   | handle  | 3           | `originframetype: 000001B3DFAD2E50` |         |
| ORIGIN\_FRAME\_HERO\_HP\_BAR                 | (a)   | handle  | 4           | `originframetype: 000001B3DFAD2E10` |         |
| ORIGIN\_FRAME\_HERO\_MANA\_BAR               | (a)   | handle  | 5           | `originframetype: 000001B3DFA3C970` |         |
| ORIGIN\_FRAME\_HERO\_BUTTON\_INDICATOR       | (a)   | handle  | 6           | `originframetype: 000001B3DFA3C910` |         |
| ORIGIN\_FRAME\_ITEM\_BUTTON                  | (a)   | handle  | 7           | `originframetype: 000001B3DFAC57E0` |         |
| ORIGIN\_FRAME\_MINIMAP                       | (a)   | handle  | 8           | `originframetype: 000001B3DFAC5820` |         |
| ORIGIN\_FRAME\_MINIMAP\_BUTTON               | (a)   | handle  | 9           | `originframetype: 000001B3DF53EDC0` |         |
| ORIGIN\_FRAME\_SYSTEM\_BUTTON                | (a)   | handle  | 10          | `originframetype: 000001B3DF53EE00` |         |
| ORIGIN\_FRAME\_TOOLTIP                       | (a)   | handle  | 11          | `originframetype: 000001B3DFAE4EC0` |         |
| ORIGIN\_FRAME\_UBERTOOLTIP                   | (a)   | handle  | 12          | `originframetype: 000001B3DFAE4F00` |         |
| ORIGIN\_FRAME\_CHAT\_MSG                     | (a)   | handle  | 13          | `originframetype: 000001B3DFAF1250` |         |
| ORIGIN\_FRAME\_UNIT\_MSG                     | (a)   | handle  | 14          | `originframetype: 000001B3DFAF1290` |         |
| ORIGIN\_FRAME\_TOP\_MSG                      | (a)   | handle  | 15          | `originframetype: 000001B3E0A4A440` |         |
| ORIGIN\_FRAME\_PORTRAIT                      | (a)   | handle  | 16          | `originframetype: 000001B3E0A4A480` |         |
| ORIGIN\_FRAME\_WORLD\_FRAME                  | (a)   | handle  | 17          | `originframetype: 000001B3E0A4A4C0` |         |
| ORIGIN\_FRAME\_SIMPLE\_UI\_PARENT            | (a)   | handle  | 18          | `originframetype: 000001B3E0E980F0` |         |
| ORIGIN\_FRAME\_PORTRAIT\_HP\_TEXT            | (a)   | handle  | 19          | `originframetype: 000001B3E0E98130` |         |
| ORIGIN\_FRAME\_PORTRAIT\_MANA\_TEXT          | (a)   | handle  | 20          | `originframetype: 000001B3DFFF74A0` |         |
| ORIGIN\_FRAME\_UNIT\_PANEL\_BUFF\_BAR        | (a)   | handle  | 21          | `originframetype: 000001B3DFFF74E0` |         |
| ORIGIN\_FRAME\_UNIT\_PANEL\_BUFF\_BAR\_LABEL | (a)   | handle  | 22          | `originframetype: 000001B3DFFF7520` |         |
| -1                                           | (a)   | handle  | -1          | `originframetype: 000001B3F3D78E80` |         |
| past the last constant                       | (a)   | handle  | 23          | `originframetype: 000001B3FC8FAE20` |         |
| 2147483647                                   | (a)   | handle  | 2147483647  | `originframetype: 000001B3F3BCA240` |         |
| -2147483648                                  | (a)   | handle  | -2147483648 | `originframetype: 000001B3F3BD8B30` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertFramePointType`

| Case                    | Group | Outcome | Id          | Type                               | Message |
| ----------------------- | ----- | ------- | ----------- | ---------------------------------- | ------- |
| FRAMEPOINT\_TOPLEFT     | (a)   | handle  | 0           | `framepointtype: 000001B3DFF9C5D0` |         |
| FRAMEPOINT\_TOP         | (a)   | handle  | 1           | `framepointtype: 000001B3DFF9C610` |         |
| FRAMEPOINT\_TOPRIGHT    | (a)   | handle  | 2           | `framepointtype: 000001B3DFF9C650` |         |
| FRAMEPOINT\_LEFT        | (a)   | handle  | 3           | `framepointtype: 000001B3D3C1E3C0` |         |
| FRAMEPOINT\_CENTER      | (a)   | handle  | 4           | `framepointtype: 000001B3D3C1E380` |         |
| FRAMEPOINT\_RIGHT       | (a)   | handle  | 5           | `framepointtype: 000001B3D3C1E400` |         |
| FRAMEPOINT\_BOTTOMLEFT  | (a)   | handle  | 6           | `framepointtype: 000001B3D3B1B260` |         |
| FRAMEPOINT\_BOTTOM      | (a)   | handle  | 7           | `framepointtype: 000001B3D3B1B2A0` |         |
| FRAMEPOINT\_BOTTOMRIGHT | (a)   | handle  | 8           | `framepointtype: 000001B3D3B1B2E0` |         |
| -1                      | (a)   | handle  | -1          | `framepointtype: 000001B3F3C1D8F0` |         |
| past the last constant  | (a)   | handle  | 9           | `framepointtype: 000001B3E2010C20` |         |
| 2147483647              | (a)   | handle  | 2147483647  | `framepointtype: 000001B3F3C0E910` |         |
| -2147483648             | (a)   | handle  | -2147483648 | `framepointtype: 000001B3FC8FDD30` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertTextAlignType`

| Case                   | Group | Outcome | Id          | Type                              | Message |
| ---------------------- | ----- | ------- | ----------- | --------------------------------- | ------- |
| TEXT\_JUSTIFY\_TOP     | (a)   | handle  | 0           | `textaligntype: 000001B3D3ADF060` |         |
| TEXT\_JUSTIFY\_MIDDLE  | (a)   | handle  | 1           | `textaligntype: 000001B3D3ADF0A0` |         |
| TEXT\_JUSTIFY\_BOTTOM  | (a)   | handle  | 2           | `textaligntype: 000001B3D3ADF0E0` |         |
| TEXT\_JUSTIFY\_LEFT    | (a)   | handle  | 3           | `textaligntype: 000001B3D3AEFAB0` |         |
| TEXT\_JUSTIFY\_CENTER  | (a)   | handle  | 4           | `textaligntype: 000001B3D3AEFA70` |         |
| TEXT\_JUSTIFY\_RIGHT   | (a)   | handle  | 5           | `textaligntype: 000001B3D3AEFAF0` |         |
| -1                     | (a)   | handle  | -1          | `textaligntype: 000001B3F3BC0680` |         |
| past the last constant | (a)   | handle  | 6           | `textaligntype: 000001B3F3E5BB50` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `textaligntype: 000001B3FC95C6C0` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `textaligntype: 000001B3FC0A4A20` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertFrameEventType`

| Case                                 | Group | Outcome | Id          | Type                               | Message |
| ------------------------------------ | ----- | ------- | ----------- | ---------------------------------- | ------- |
| FRAMEEVENT\_CONTROL\_CLICK           | (a)   | handle  | 1           | `frameeventtype: 000001B3E28477B0` |         |
| FRAMEEVENT\_MOUSE\_ENTER             | (a)   | handle  | 2           | `frameeventtype: 000001B3E28477F0` |         |
| FRAMEEVENT\_MOUSE\_LEAVE             | (a)   | handle  | 3           | `frameeventtype: 000001B3DFBFDC80` |         |
| FRAMEEVENT\_MOUSE\_UP                | (a)   | handle  | 4           | `frameeventtype: 000001B3E2847830` |         |
| FRAMEEVENT\_MOUSE\_DOWN              | (a)   | handle  | 5           | `frameeventtype: 000001B3D39E8A80` |         |
| FRAMEEVENT\_MOUSE\_WHEEL             | (a)   | handle  | 6           | `frameeventtype: 000001B3DFBFDCC0` |         |
| FRAMEEVENT\_CHECKBOX\_CHECKED        | (a)   | handle  | 7           | `frameeventtype: 000001B3DFBFDD00` |         |
| FRAMEEVENT\_CHECKBOX\_UNCHECKED      | (a)   | handle  | 8           | `frameeventtype: 000001B3D39E8AC0` |         |
| FRAMEEVENT\_EDITBOX\_TEXT\_CHANGED   | (a)   | handle  | 9           | `frameeventtype: 000001B3D39E8B00` |         |
| FRAMEEVENT\_POPUPMENU\_ITEM\_CHANGED | (a)   | handle  | 10          | `frameeventtype: 000001B3DF11F7D0` |         |
| FRAMEEVENT\_MOUSE\_DOUBLECLICK       | (a)   | handle  | 11          | `frameeventtype: 000001B3DF11F810` |         |
| FRAMEEVENT\_SPRITE\_ANIM\_UPDATE     | (a)   | handle  | 12          | `frameeventtype: 000001B3DF11F850` |         |
| FRAMEEVENT\_SLIDER\_VALUE\_CHANGED   | (a)   | handle  | 13          | `frameeventtype: 000001B3D3AF92F0` |         |
| FRAMEEVENT\_DIALOG\_CANCEL           | (a)   | handle  | 14          | `frameeventtype: 000001B3D3AF9330` |         |
| FRAMEEVENT\_DIALOG\_ACCEPT           | (a)   | handle  | 15          | `frameeventtype: 000001B3D3AF9370` |         |
| FRAMEEVENT\_EDITBOX\_ENTER           | (a)   | handle  | 16          | `frameeventtype: 000001B3D3AF5EB0` |         |
| -1                                   | (a)   | handle  | -1          | `frameeventtype: 000001B3FC92E0D0` |         |
| past the last constant               | (a)   | handle  | 17          | `frameeventtype: 000001B3FC9DDAC0` |         |
| 2147483647                           | (a)   | handle  | 2147483647  | `frameeventtype: 000001B3FC974FF0` |         |
| -2147483648                          | (a)   | handle  | -2147483648 | `frameeventtype: 000001B3FC9EF790` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertOsKeyType`

| Case                                            | Group | Outcome | Id          | Type                          | Message |
| ----------------------------------------------- | ----- | ------- | ----------- | ----------------------------- | ------- |
| OSKEY\_BACKSPACE                                | (a)   | handle  | 8           | `oskeytype: 000001B3D3AF5EF0` |         |
| OSKEY\_TAB                                      | (a)   | handle  | 9           | `oskeytype: 000001B3D3AF5F30` |         |
| OSKEY\_CLEAR                                    | (a)   | handle  | 12          | `oskeytype: 000001B3D3B1BCE0` |         |
| OSKEY\_RETURN                                   | (a)   | handle  | 13          | `oskeytype: 000001B3D3B1BC90` |         |
| OSKEY\_SHIFT                                    | (a)   | handle  | 16          | `oskeytype: 000001B3E26AD060` |         |
| OSKEY\_CONTROL                                  | (a)   | handle  | 17          | `oskeytype: 000001B3E26AD0A0` |         |
| OSKEY\_ALT                                      | (a)   | handle  | 18          | `oskeytype: 000001B3E26AD0E0` |         |
| OSKEY\_PAUSE                                    | (a)   | handle  | 19          | `oskeytype: 000001B3D3C213E0` |         |
| OSKEY\_CAPSLOCK                                 | (a)   | handle  | 20          | `oskeytype: 000001B3D3C21420` |         |
| OSKEY\_KANA or OSKEY\_HANGUL                    | (a)   | handle  | 21          | `oskeytype: 000001B3D3C21460` |         |
| OSKEY\_JUNJA                                    | (a)   | handle  | 23          | `oskeytype: 000001B3E26EEB50` |         |
| OSKEY\_FINAL                                    | (a)   | handle  | 24          | `oskeytype: 000001B3E26EEB90` |         |
| OSKEY\_HANJA or OSKEY\_KANJI                    | (a)   | handle  | 25          | `oskeytype: 000001B3E26EEBD0` |         |
| OSKEY\_ESCAPE                                   | (a)   | handle  | 27          | `oskeytype: 000001B3DD696E30` |         |
| OSKEY\_CONVERT                                  | (a)   | handle  | 28          | `oskeytype: 000001B3DD696E70` |         |
| OSKEY\_NONCONVERT                               | (a)   | handle  | 29          | `oskeytype: 000001B3DD696EB0` |         |
| OSKEY\_ACCEPT                                   | (a)   | handle  | 30          | `oskeytype: 000001B3E0AF0A60` |         |
| OSKEY\_MODECHANGE                               | (a)   | handle  | 31          | `oskeytype: 000001B3E0AF0AA0` |         |
| OSKEY\_SPACE                                    | (a)   | handle  | 32          | `oskeytype: 000001B3E0AF0AE0` |         |
| OSKEY\_PAGEUP                                   | (a)   | handle  | 33          | `oskeytype: 000001B3E114C620` |         |
| OSKEY\_PAGEDOWN                                 | (a)   | handle  | 34          | `oskeytype: 000001B3E114C660` |         |
| OSKEY\_END                                      | (a)   | handle  | 35          | `oskeytype: 000001B3E114C6A0` |         |
| OSKEY\_HOME                                     | (a)   | handle  | 36          | `oskeytype: 000001B3DFC0A700` |         |
| OSKEY\_LEFT                                     | (a)   | handle  | 37          | `oskeytype: 000001B3DFC0A740` |         |
| OSKEY\_UP                                       | (a)   | handle  | 38          | `oskeytype: 000001B3DFC0A780` |         |
| OSKEY\_RIGHT                                    | (a)   | handle  | 39          | `oskeytype: 000001B3DFBABCA0` |         |
| OSKEY\_DOWN                                     | (a)   | handle  | 40          | `oskeytype: 000001B3DFBABCE0` |         |
| OSKEY\_SELECT                                   | (a)   | handle  | 41          | `oskeytype: 000001B3DFBABD20` |         |
| OSKEY\_PRINT                                    | (a)   | handle  | 42          | `oskeytype: 000001B3DFC0B600` |         |
| OSKEY\_EXECUTE                                  | (a)   | handle  | 43          | `oskeytype: 000001B3DFC0B640` |         |
| OSKEY\_PRINTSCREEN                              | (a)   | handle  | 44          | `oskeytype: 000001B3DFC0B680` |         |
| OSKEY\_INSERT                                   | (a)   | handle  | 45          | `oskeytype: 000001B3DD3D1980` |         |
| OSKEY\_DELETE                                   | (a)   | handle  | 46          | `oskeytype: 000001B3DD3D19C0` |         |
| OSKEY\_HELP                                     | (a)   | handle  | 47          | `oskeytype: 000001B3DD3D1A00` |         |
| OSKEY\_0                                        | (a)   | handle  | 48          | `oskeytype: 000001B3DD3831D0` |         |
| OSKEY\_1                                        | (a)   | handle  | 49          | `oskeytype: 000001B3DD383210` |         |
| OSKEY\_2                                        | (a)   | handle  | 50          | `oskeytype: 000001B3DD383250` |         |
| OSKEY\_3                                        | (a)   | handle  | 51          | `oskeytype: 000001B3D39ADBD0` |         |
| OSKEY\_4                                        | (a)   | handle  | 52          | `oskeytype: 000001B3D39ADC10` |         |
| OSKEY\_5                                        | (a)   | handle  | 53          | `oskeytype: 000001B3D39ADC50` |         |
| OSKEY\_6                                        | (a)   | handle  | 54          | `oskeytype: 000001B3D39AD7B0` |         |
| OSKEY\_7                                        | (a)   | handle  | 55          | `oskeytype: 000001B3D39AD7F0` |         |
| OSKEY\_8                                        | (a)   | handle  | 56          | `oskeytype: 000001B3D39AD830` |         |
| OSKEY\_9                                        | (a)   | handle  | 57          | `oskeytype: 000001B3DD3AEE60` |         |
| OSKEY\_A                                        | (a)   | handle  | 65          | `oskeytype: 000001B3DD3AEEA0` |         |
| OSKEY\_B                                        | (a)   | handle  | 66          | `oskeytype: 000001B3DD3AEEE0` |         |
| OSKEY\_C                                        | (a)   | handle  | 67          | `oskeytype: 000001B3DFE528B0` |         |
| OSKEY\_D                                        | (a)   | handle  | 68          | `oskeytype: 000001B3DFE612F0` |         |
| OSKEY\_E                                        | (a)   | handle  | 69          | `oskeytype: 000001B3DFEC5040` |         |
| OSKEY\_F                                        | (a)   | handle  | 70          | `oskeytype: 000001B3DF3D8100` |         |
| OSKEY\_G                                        | (a)   | handle  | 71          | `oskeytype: 000001B3D3B1B640` |         |
| OSKEY\_H                                        | (a)   | handle  | 72          | `oskeytype: 000001B3DF06E3A0` |         |
| OSKEY\_I                                        | (a)   | handle  | 73          | `oskeytype: 000001B3DFDE8BE0` |         |
| OSKEY\_J                                        | (a)   | handle  | 74          | `oskeytype: 000001B3DFDE8C20` |         |
| OSKEY\_K                                        | (a)   | handle  | 75          | `oskeytype: 000001B3D3C21FF0` |         |
| OSKEY\_L                                        | (a)   | handle  | 76          | `oskeytype: 000001B3D3C22030` |         |
| OSKEY\_M                                        | (a)   | handle  | 77          | `oskeytype: 000001B3DD396020` |         |
| OSKEY\_N                                        | (a)   | handle  | 78          | `oskeytype: 000001B3DD396060` |         |
| OSKEY\_O                                        | (a)   | handle  | 79          | `oskeytype: 000001B3DD3960A0` |         |
| OSKEY\_P                                        | (a)   | handle  | 80          | `oskeytype: 000001B3D3927140` |         |
| OSKEY\_Q                                        | (a)   | handle  | 81          | `oskeytype: 000001B3D3927180` |         |
| OSKEY\_R                                        | (a)   | handle  | 82          | `oskeytype: 000001B3D39271C0` |         |
| OSKEY\_S                                        | (a)   | handle  | 83          | `oskeytype: 000001B3DB8BD400` |         |
| OSKEY\_T                                        | (a)   | handle  | 84          | `oskeytype: 000001B3DB8BD440` |         |
| OSKEY\_U                                        | (a)   | handle  | 85          | `oskeytype: 000001B3DB8BD480` |         |
| OSKEY\_V                                        | (a)   | handle  | 86          | `oskeytype: 000001B3DB5E3910` |         |
| OSKEY\_W                                        | (a)   | handle  | 87          | `oskeytype: 000001B3DB5E3950` |         |
| OSKEY\_X                                        | (a)   | handle  | 88          | `oskeytype: 000001B3DB5E3990` |         |
| OSKEY\_Y                                        | (a)   | handle  | 89          | `oskeytype: 000001B3DD39AB30` |         |
| OSKEY\_Z                                        | (a)   | handle  | 90          | `oskeytype: 000001B3DD39AB70` |         |
| OSKEY\_LMETA                                    | (a)   | handle  | 91          | `oskeytype: 000001B3DD39ABB0` |         |
| OSKEY\_RMETA                                    | (a)   | handle  | 92          | `oskeytype: 000001B3D3AFDC80` |         |
| OSKEY\_APPS                                     | (a)   | handle  | 93          | `oskeytype: 000001B3D3AFDCC0` |         |
| OSKEY\_SLEEP                                    | (a)   | handle  | 95          | `oskeytype: 000001B3D3AFDD00` |         |
| OSKEY\_NUMPAD0                                  | (a)   | handle  | 96          | `oskeytype: 000001B3D390EEE0` |         |
| OSKEY\_NUMPAD1                                  | (a)   | handle  | 97          | `oskeytype: 000001B3D390EF20` |         |
| OSKEY\_NUMPAD2                                  | (a)   | handle  | 98          | `oskeytype: 000001B3D390EF60` |         |
| OSKEY\_NUMPAD3                                  | (a)   | handle  | 99          | `oskeytype: 000001B3D3966420` |         |
| OSKEY\_NUMPAD4                                  | (a)   | handle  | 100         | `oskeytype: 000001B3D3966460` |         |
| OSKEY\_NUMPAD5                                  | (a)   | handle  | 101         | `oskeytype: 000001B3D39664A0` |         |
| OSKEY\_NUMPAD6                                  | (a)   | handle  | 102         | `oskeytype: 000001B3E2AA1540` |         |
| OSKEY\_NUMPAD7                                  | (a)   | handle  | 103         | `oskeytype: 000001B3E2AA1580` |         |
| OSKEY\_NUMPAD8                                  | (a)   | handle  | 104         | `oskeytype: 000001B3E2AA15C0` |         |
| OSKEY\_NUMPAD9                                  | (a)   | handle  | 105         | `oskeytype: 000001B3E288D250` |         |
| OSKEY\_MULTIPLY                                 | (a)   | handle  | 106         | `oskeytype: 000001B3E288D290` |         |
| OSKEY\_ADD                                      | (a)   | handle  | 107         | `oskeytype: 000001B3E288D2D0` |         |
| OSKEY\_SEPARATOR                                | (a)   | handle  | 108         | `oskeytype: 000001B3E28963C0` |         |
| OSKEY\_SUBTRACT                                 | (a)   | handle  | 109         | `oskeytype: 000001B3E2896400` |         |
| OSKEY\_DECIMAL                                  | (a)   | handle  | 110         | `oskeytype: 000001B3E2896440` |         |
| OSKEY\_DIVIDE                                   | (a)   | handle  | 111         | `oskeytype: 000001B3E289B2B0` |         |
| OSKEY\_F1                                       | (a)   | handle  | 112         | `oskeytype: 000001B3E289B2F0` |         |
| OSKEY\_F2                                       | (a)   | handle  | 113         | `oskeytype: 000001B3E289B330` |         |
| OSKEY\_F3                                       | (a)   | handle  | 114         | `oskeytype: 000001B3E28AA0A0` |         |
| OSKEY\_F4                                       | (a)   | handle  | 115         | `oskeytype: 000001B3E28AA0E0` |         |
| OSKEY\_F5                                       | (a)   | handle  | 116         | `oskeytype: 000001B3E28AA120` |         |
| OSKEY\_F6                                       | (a)   | handle  | 117         | `oskeytype: 000001B3E2A70CF0` |         |
| OSKEY\_F7                                       | (a)   | handle  | 118         | `oskeytype: 000001B3E2A70D30` |         |
| OSKEY\_F8                                       | (a)   | handle  | 119         | `oskeytype: 000001B3E2A70D70` |         |
| OSKEY\_F9                                       | (a)   | handle  | 120         | `oskeytype: 000001B3E28A43D0` |         |
| OSKEY\_F10                                      | (a)   | handle  | 121         | `oskeytype: 000001B3E28A4410` |         |
| OSKEY\_F11                                      | (a)   | handle  | 122         | `oskeytype: 000001B3E28A4450` |         |
| OSKEY\_F12                                      | (a)   | handle  | 123         | `oskeytype: 000001B3DD7AA700` |         |
| OSKEY\_F13                                      | (a)   | handle  | 124         | `oskeytype: 000001B3DD7AA740` |         |
| OSKEY\_F14                                      | (a)   | handle  | 125         | `oskeytype: 000001B3DD7AA780` |         |
| OSKEY\_F15                                      | (a)   | handle  | 126         | `oskeytype: 000001B3E1227690` |         |
| OSKEY\_F16                                      | (a)   | handle  | 127         | `oskeytype: 000001B3E12276D0` |         |
| OSKEY\_F17                                      | (a)   | handle  | 128         | `oskeytype: 000001B3E1227710` |         |
| OSKEY\_F18                                      | (a)   | handle  | 129         | `oskeytype: 000001B3E0B52270` |         |
| OSKEY\_F19                                      | (a)   | handle  | 130         | `oskeytype: 000001B3E0B522B0` |         |
| OSKEY\_F20                                      | (a)   | handle  | 131         | `oskeytype: 000001B3E0B522F0` |         |
| OSKEY\_F21                                      | (a)   | handle  | 132         | `oskeytype: 000001B3E10DDF40` |         |
| OSKEY\_F22                                      | (a)   | handle  | 133         | `oskeytype: 000001B3E10DDF80` |         |
| OSKEY\_F23                                      | (a)   | handle  | 134         | `oskeytype: 000001B3E10DDFC0` |         |
| OSKEY\_F24                                      | (a)   | handle  | 135         | `oskeytype: 000001B3E129CDC0` |         |
| OSKEY\_NUMLOCK                                  | (a)   | handle  | 144         | `oskeytype: 000001B3E129CE00` |         |
| OSKEY\_SCROLLLOCK                               | (a)   | handle  | 145         | `oskeytype: 000001B3E129CE40` |         |
| OSKEY\_OEM\_NEC\_EQUAL or OSKEY\_OEM\_FJ\_JISHO | (a)   | handle  | 146         | `oskeytype: 000001B3DFAA9420` |         |
| OSKEY\_OEM\_FJ\_MASSHOU                         | (a)   | handle  | 147         | `oskeytype: 000001B3DFAA9460` |         |
| OSKEY\_OEM\_FJ\_TOUROKU                         | (a)   | handle  | 148         | `oskeytype: 000001B3DFAA94A0` |         |
| OSKEY\_OEM\_FJ\_LOYA                            | (a)   | handle  | 149         | `oskeytype: 000001B3E15556B0` |         |
| OSKEY\_OEM\_FJ\_ROYA                            | (a)   | handle  | 150         | `oskeytype: 000001B3E15556F0` |         |
| OSKEY\_LSHIFT                                   | (a)   | handle  | 160         | `oskeytype: 000001B3E1555730` |         |
| OSKEY\_RSHIFT                                   | (a)   | handle  | 161         | `oskeytype: 000001B3DE4E6020` |         |
| OSKEY\_LCONTROL                                 | (a)   | handle  | 162         | `oskeytype: 000001B3DE4E6060` |         |
| OSKEY\_RCONTROL                                 | (a)   | handle  | 163         | `oskeytype: 000001B3DE4E60A0` |         |
| OSKEY\_LALT                                     | (a)   | handle  | 164         | `oskeytype: 000001B3DE04F1D0` |         |
| OSKEY\_RALT                                     | (a)   | handle  | 165         | `oskeytype: 000001B3DE04F210` |         |
| OSKEY\_BROWSER\_BACK                            | (a)   | handle  | 166         | `oskeytype: 000001B3DE04F250` |         |
| OSKEY\_BROWSER\_FORWARD                         | (a)   | handle  | 167         | `oskeytype: 000001B3DEE142F0` |         |
| OSKEY\_BROWSER\_REFRESH                         | (a)   | handle  | 168         | `oskeytype: 000001B3DEE14330` |         |
| OSKEY\_BROWSER\_STOP                            | (a)   | handle  | 169         | `oskeytype: 000001B3DEE14370` |         |
| OSKEY\_BROWSER\_SEARCH                          | (a)   | handle  | 170         | `oskeytype: 000001B3DE5C1CB0` |         |
| OSKEY\_BROWSER\_FAVORITES                       | (a)   | handle  | 171         | `oskeytype: 000001B3DE5C1CF0` |         |
| OSKEY\_BROWSER\_HOME                            | (a)   | handle  | 172         | `oskeytype: 000001B3DE5C1D30` |         |
| OSKEY\_VOLUME\_MUTE                             | (a)   | handle  | 173         | `oskeytype: 000001B3DE9F1790` |         |
| OSKEY\_VOLUME\_DOWN                             | (a)   | handle  | 174         | `oskeytype: 000001B3DE9F17D0` |         |
| OSKEY\_VOLUME\_UP                               | (a)   | handle  | 175         | `oskeytype: 000001B3DE9F1810` |         |
| OSKEY\_MEDIA\_NEXT\_TRACK                       | (a)   | handle  | 176         | `oskeytype: 000001B3E5136F00` |         |
| OSKEY\_MEDIA\_PREV\_TRACK                       | (a)   | handle  | 177         | `oskeytype: 000001B3E5136F40` |         |
| OSKEY\_MEDIA\_STOP                              | (a)   | handle  | 178         | `oskeytype: 000001B3E5136F80` |         |
| OSKEY\_MEDIA\_PLAY\_PAUSE                       | (a)   | handle  | 179         | `oskeytype: 000001B3E2AFE420` |         |
| OSKEY\_LAUNCH\_MAIL                             | (a)   | handle  | 180         | `oskeytype: 000001B3E2AFE460` |         |
| OSKEY\_LAUNCH\_MEDIA\_SELECT                    | (a)   | handle  | 181         | `oskeytype: 000001B3E2AFE4A0` |         |
| OSKEY\_LAUNCH\_APP1                             | (a)   | handle  | 182         | `oskeytype: 000001B3E0AE8370` |         |
| OSKEY\_LAUNCH\_APP2                             | (a)   | handle  | 183         | `oskeytype: 000001B3E0AE83B0` |         |
| OSKEY\_OEM\_1                                   | (a)   | handle  | 186         | `oskeytype: 000001B3E0AE83F0` |         |
| OSKEY\_OEM\_PLUS                                | (a)   | handle  | 187         | `oskeytype: 000001B3E11A46F0` |         |
| OSKEY\_OEM\_COMMA                               | (a)   | handle  | 188         | `oskeytype: 000001B3E11A4730` |         |
| OSKEY\_OEM\_MINUS                               | (a)   | handle  | 189         | `oskeytype: 000001B3E11A4770` |         |
| OSKEY\_OEM\_PERIOD                              | (a)   | handle  | 190         | `oskeytype: 000001B3E0C22D30` |         |
| OSKEY\_OEM\_2                                   | (a)   | handle  | 191         | `oskeytype: 000001B3E0C22D70` |         |
| OSKEY\_OEM\_3                                   | (a)   | handle  | 192         | `oskeytype: 000001B3E0C22DB0` |         |
| OSKEY\_OEM\_4                                   | (a)   | handle  | 219         | `oskeytype: 000001B3E106CDC0` |         |
| OSKEY\_OEM\_5                                   | (a)   | handle  | 220         | `oskeytype: 000001B3E106CE00` |         |
| OSKEY\_OEM\_6                                   | (a)   | handle  | 221         | `oskeytype: 000001B3E106CE40` |         |
| OSKEY\_OEM\_7                                   | (a)   | handle  | 222         | `oskeytype: 000001B3E16955C0` |         |
| OSKEY\_OEM\_8                                   | (a)   | handle  | 223         | `oskeytype: 000001B3E1695600` |         |
| OSKEY\_OEM\_AX                                  | (a)   | handle  | 225         | `oskeytype: 000001B3E1695640` |         |
| OSKEY\_OEM\_102                                 | (a)   | handle  | 226         | `oskeytype: 000001B3E0ED4BE0` |         |
| OSKEY\_ICO\_HELP                                | (a)   | handle  | 227         | `oskeytype: 000001B3E0ED4C20` |         |
| OSKEY\_ICO\_00                                  | (a)   | handle  | 228         | `oskeytype: 000001B3E0ED4C60` |         |
| OSKEY\_PROCESSKEY                               | (a)   | handle  | 229         | `oskeytype: 000001B3E11862F0` |         |
| OSKEY\_ICO\_CLEAR                               | (a)   | handle  | 230         | `oskeytype: 000001B3E1186330` |         |
| OSKEY\_PACKET                                   | (a)   | handle  | 231         | `oskeytype: 000001B3E1186370` |         |
| OSKEY\_OEM\_RESET                               | (a)   | handle  | 233         | `oskeytype: 000001B3DEE60E80` |         |
| OSKEY\_OEM\_JUMP                                | (a)   | handle  | 234         | `oskeytype: 000001B3DEE60EC0` |         |
| OSKEY\_OEM\_PA1                                 | (a)   | handle  | 235         | `oskeytype: 000001B3DEE60F00` |         |
| OSKEY\_OEM\_PA2                                 | (a)   | handle  | 236         | `oskeytype: 000001B3DDF44BC0` |         |
| OSKEY\_OEM\_PA3                                 | (a)   | handle  | 237         | `oskeytype: 000001B3DDF44C00` |         |
| OSKEY\_OEM\_WSCTRL                              | (a)   | handle  | 238         | `oskeytype: 000001B3DDF44C40` |         |
| OSKEY\_OEM\_CUSEL                               | (a)   | handle  | 239         | `oskeytype: 000001B3E2CA3540` |         |
| OSKEY\_OEM\_ATTN                                | (a)   | handle  | 240         | `oskeytype: 000001B3E2CA3580` |         |
| OSKEY\_OEM\_FINISH                              | (a)   | handle  | 241         | `oskeytype: 000001B3E2CA35C0` |         |
| OSKEY\_OEM\_COPY                                | (a)   | handle  | 242         | `oskeytype: 000001B3DE4E9320` |         |
| OSKEY\_OEM\_AUTO                                | (a)   | handle  | 243         | `oskeytype: 000001B3DE4E9360` |         |
| OSKEY\_OEM\_ENLW                                | (a)   | handle  | 244         | `oskeytype: 000001B3DE4E93A0` |         |
| OSKEY\_OEM\_BACKTAB                             | (a)   | handle  | 245         | `oskeytype: 000001B3DEDF7200` |         |
| OSKEY\_ATTN                                     | (a)   | handle  | 246         | `oskeytype: 000001B3DEDF7240` |         |
| OSKEY\_CRSEL                                    | (a)   | handle  | 247         | `oskeytype: 000001B3DEDF7280` |         |
| OSKEY\_EXSEL                                    | (a)   | handle  | 248         | `oskeytype: 000001B3DE95E4A0` |         |
| OSKEY\_EREOF                                    | (a)   | handle  | 249         | `oskeytype: 000001B3DE95E4E0` |         |
| OSKEY\_PLAY                                     | (a)   | handle  | 250         | `oskeytype: 000001B3DE95E520` |         |
| OSKEY\_ZOOM                                     | (a)   | handle  | 251         | `oskeytype: 000001B3DE0E3A10` |         |
| OSKEY\_NONAME                                   | (a)   | handle  | 252         | `oskeytype: 000001B3DE0E3A50` |         |
| OSKEY\_PA1                                      | (a)   | handle  | 253         | `oskeytype: 000001B3DE0E3A90` |         |
| OSKEY\_OEM\_CLEAR                               | (a)   | handle  | 254         | `oskeytype: 000001B3DDF205D0` |         |
| -1                                              | (a)   | handle  | -1          | `oskeytype: 000001B3F3C14D90` |         |
| past the last constant                          | (a)   | handle  | 255         | `oskeytype: 000001B3F3A14280` |         |
| 2147483647                                      | (a)   | handle  | 2147483647  | `oskeytype: 000001B3F3B24880` |         |
| -2147483648                                     | (a)   | handle  | -2147483648 | `oskeytype: 000001B3FB3E0CA0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertAbilityIntegerField`

| Case                                        | Group | Outcome | Id          | Type                                    | Message |
| ------------------------------------------- | ----- | ------- | ----------- | --------------------------------------- | ------- |
| ABILITY\_IF\_BUTTON\_POSITION\_NORMAL\_X    | (a)   | handle  | 1633841272  | `abilityintegerfield: 000001B3E26B0100` |         |
| ABILITY\_IF\_BUTTON\_POSITION\_NORMAL\_Y    | (a)   | handle  | 1633841273  | `abilityintegerfield: 000001B3E26B0140` |         |
| ABILITY\_IF\_BUTTON\_POSITION\_ACTIVATED\_X | (a)   | handle  | 1635082872  | `abilityintegerfield: 000001B3E3630B60` |         |
| ABILITY\_IF\_BUTTON\_POSITION\_ACTIVATED\_Y | (a)   | handle  | 1635082873  | `abilityintegerfield: 000001B3E3630B10` |         |
| ABILITY\_IF\_BUTTON\_POSITION\_RESEARCH\_X  | (a)   | handle  | 1634889848  | `abilityintegerfield: 000001B3DE4EBEB0` |         |
| ABILITY\_IF\_BUTTON\_POSITION\_RESEARCH\_Y  | (a)   | handle  | 1634889849  | `abilityintegerfield: 000001B3DE4EBEF0` |         |
| ABILITY\_IF\_MISSILE\_SPEED                 | (a)   | handle  | 1634562928  | `abilityintegerfield: 000001B3DE4EBF30` |         |
| ABILITY\_IF\_TARGET\_ATTACHMENTS            | (a)   | handle  | 1635017059  | `abilityintegerfield: 000001B3DE9FF250` |         |
| ABILITY\_IF\_CASTER\_ATTACHMENTS            | (a)   | handle  | 1633902947  | `abilityintegerfield: 000001B3DE9FF290` |         |
| ABILITY\_IF\_PRIORITY                       | (a)   | handle  | 1634759273  | `abilityintegerfield: 000001B3DE9FF2D0` |         |
| ABILITY\_IF\_LEVELS                         | (a)   | handle  | 1634493814  | `abilityintegerfield: 000001B3DFFEAD30` |         |
| ABILITY\_IF\_REQUIRED\_LEVEL                | (a)   | handle  | 1634888822  | `abilityintegerfield: 000001B3DFFEAD70` |         |
| ABILITY\_IF\_LEVEL\_SKIP\_REQUIREMENT       | (a)   | handle  | 1634497387  | `abilityintegerfield: 000001B3DFFEADB0` |         |
| -1                                          | (a)   | handle  | -1          | `abilityintegerfield: 000001B3F9DA33F0` |         |
| past the last constant                      | (a)   | handle  | 1635082874  | `abilityintegerfield: 000001B3FC967930` |         |
| 2147483647                                  | (a)   | handle  | 2147483647  | `abilityintegerfield: 000001B3F3C28B40` |         |
| -2147483648                                 | (a)   | handle  | -2147483648 | `abilityintegerfield: 000001B3FC9545F0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertAbilityRealField`

| Case                           | Group | Outcome | Id          | Type                                 | Message |
| ------------------------------ | ----- | ------- | ----------- | ------------------------------------ | ------- |
| ABILITY\_RF\_ARF\_MISSILE\_ARC | (a)   | handle  | 1634558307  | `abilityrealfield: 000001B3DFF94970` |         |
| -1                             | (a)   | handle  | -1          | `abilityrealfield: 000001B3F3EECA30` |         |
| past the last constant         | (a)   | handle  | 1634558308  | `abilityrealfield: 000001B3FC976370` |         |
| 2147483647                     | (a)   | handle  | 2147483647  | `abilityrealfield: 000001B3FC976E10` |         |
| -2147483648                    | (a)   | handle  | -2147483648 | `abilityrealfield: 000001B3FC959EA0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertAbilityBooleanField`

| Case                             | Group | Outcome | Id          | Type                                    | Message |
| -------------------------------- | ----- | ------- | ----------- | --------------------------------------- | ------- |
| ABILITY\_BF\_HERO\_ABILITY       | (a)   | handle  | 1634231666  | `abilitybooleanfield: 000001B3DFF948F0` |         |
| ABILITY\_BF\_ITEM\_ABILITY       | (a)   | handle  | 1634301029  | `abilitybooleanfield: 000001B3DFF94930` |         |
| ABILITY\_BF\_CHECK\_DEPENDENCIES | (a)   | handle  | 1633904740  | `abilitybooleanfield: 000001B3E2AA6610` |         |
| -1                               | (a)   | handle  | -1          | `abilitybooleanfield: 000001B3F3A0D380` |         |
| past the last constant           | (a)   | handle  | 1634301030  | `abilitybooleanfield: 000001B3FB3C23F0` |         |
| 2147483647                       | (a)   | handle  | 2147483647  | `abilitybooleanfield: 000001B3E293E3C0` |         |
| -2147483648                      | (a)   | handle  | -2147483648 | `abilitybooleanfield: 000001B3E293D0F0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertAbilityStringField`

| Case                                | Group | Outcome | Id          | Type                                   | Message |
| ----------------------------------- | ----- | ------- | ----------- | -------------------------------------- | ------- |
| ABILITY\_SF\_NAME                   | (a)   | handle  | 1634623853  | `abilitystringfield: 000001B3D3A710A0` |         |
| ABILITY\_SF\_ICON\_ACTIVATED        | (a)   | handle  | 1635082610  | `abilitystringfield: 000001B3D3A710E0` |         |
| ABILITY\_SF\_ICON\_RESEARCH         | (a)   | handle  | 1634886002  | `abilitystringfield: 000001B3DFFE36F0` |         |
| ABILITY\_SF\_EFFECT\_SOUND          | (a)   | handle  | 1634035315  | `abilitystringfield: 000001B3D3A71120` |         |
| ABILITY\_SF\_EFFECT\_SOUND\_LOOPING | (a)   | handle  | 1634035308  | `abilitystringfield: 000001B3DFFB40F0` |         |
| -1                                  | (a)   | handle  | -1          | `abilitystringfield: 000001B3DB623DF0` |         |
| past the last constant              | (a)   | handle  | 1635082611  | `abilitystringfield: 000001B3E2937E10` |         |
| 2147483647                          | (a)   | handle  | 2147483647  | `abilitystringfield: 000001B3DF6BB7C0` |         |
| -2147483648                         | (a)   | handle  | -2147483648 | `abilitystringfield: 000001B3DF6C7D00` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

## `nullability-converters-3`

- Probe: `nullability-converters-3`
- Patch: 3.0.1.24370
- Client: 3.0.1.24371
- Date: 2026-10-21
- Run: `7860faf7-884a-4db9-9bdd-93b5647eff04`

### `ConvertAbilityIntegerLevelField`

| Case                                                  | Group | Outcome | Id          | Type                                         | Message |
| ----------------------------------------------------- | ----- | ------- | ----------- | -------------------------------------------- | ------- |
| ABILITY\_ILF\_MANA\_COST                              | (a)   | handle  | 1634558835  | `abilityintegerlevelfield: 000001B6DC36F8F0` |         |
| ABILITY\_ILF\_NUMBER\_OF\_WAVES                       | (a)   | handle  | 1214413361  | `abilityintegerlevelfield: 000001B6DD8DC320` |         |
| ABILITY\_ILF\_NUMBER\_OF\_SHARDS                      | (a)   | handle  | 1214413363  | `abilityintegerlevelfield: 000001B6DD8DC3B0` |         |
| ABILITY\_ILF\_NUMBER\_OF\_UNITS\_TELEPORTED           | (a)   | handle  | 1215132721  | `abilityintegerlevelfield: 000001B6DD8DC480` |         |
| ABILITY\_ILF\_SUMMONED\_UNIT\_COUNT\_HWE2             | (a)   | handle  | 1215784242  | `abilityintegerlevelfield: 000001B6DD8DC520` |         |
| ABILITY\_ILF\_NUMBER\_OF\_IMAGES                      | (a)   | handle  | 1332570417  | `abilityintegerlevelfield: 000001B6DD8DC560` |         |
| ABILITY\_ILF\_NUMBER\_OF\_CORPSES\_RAISED\_UAN1       | (a)   | handle  | 1432448561  | `abilityintegerlevelfield: 000001B6DD8DC5A0` |         |
| ABILITY\_ILF\_MORPHING\_FLAGS                         | (a)   | handle  | 1164797234  | `abilityintegerlevelfield: 000001B6DC36F930` |         |
| ABILITY\_ILF\_STRENGTH\_BONUS\_NRG5                   | (a)   | handle  | 1316120373  | `abilityintegerlevelfield: 000001B6DD8DC360` |         |
| ABILITY\_ILF\_DEFENSE\_BONUS\_NRG6                    | (a)   | handle  | 1316120374  | `abilityintegerlevelfield: 000001B6DD8DC2C0` |         |
| ABILITY\_ILF\_NUMBER\_OF\_TARGETS\_HIT                | (a)   | handle  | 1331915826  | `abilityintegerlevelfield: 000001B6DD8DC4C0` |         |
| ABILITY\_ILF\_DETECTION\_TYPE\_OFS1                   | (a)   | handle  | 1332114225  | `abilityintegerlevelfield: 000001B6DD8DC3F0` |         |
| ABILITY\_ILF\_NUMBER\_OF\_SUMMONED\_UNITS\_OSF2       | (a)   | handle  | 1332962866  | `abilityintegerlevelfield: 000001B6DD8DC430` |         |
| ABILITY\_ILF\_NUMBER\_OF\_SUMMONED\_UNITS\_EFN1       | (a)   | handle  | 1164340785  | `abilityintegerlevelfield: 000001B6DD660380` |         |
| ABILITY\_ILF\_NUMBER\_OF\_CORPSES\_RAISED\_HRE1       | (a)   | handle  | 1215456561  | `abilityintegerlevelfield: 000001B6DD6603C0` |         |
| ABILITY\_ILF\_STACK\_FLAGS                            | (a)   | handle  | 1214472500  | `abilityintegerlevelfield: 000001B6DD660430` |         |
| ABILITY\_ILF\_MINIMUM\_NUMBER\_OF\_UNITS              | (a)   | handle  | 1315205170  | `abilityintegerlevelfield: 000001B6DD6600C0` |         |
| ABILITY\_ILF\_MAXIMUM\_NUMBER\_OF\_UNITS\_NDP3        | (a)   | handle  | 1315205171  | `abilityintegerlevelfield: 000001B6DD660130` |         |
| ABILITY\_ILF\_NUMBER\_OF\_UNITS\_CREATED\_NRC2        | (a)   | handle  | 1316119346  | `abilityintegerlevelfield: 000001B6DD660170` |         |
| ABILITY\_ILF\_SHIELD\_LIFE                            | (a)   | handle  | 1097691955  | `abilityintegerlevelfield: 000001B6DD6601E0` |         |
| ABILITY\_ILF\_MANA\_LOSS\_AMS4                        | (a)   | handle  | 1097691956  | `abilityintegerlevelfield: 000001B6DD660220` |         |
| ABILITY\_ILF\_GOLD\_PER\_INTERVAL\_BGM1               | (a)   | handle  | 1114074417  | `abilityintegerlevelfield: 000001B6DD660290` |         |
| ABILITY\_ILF\_MAX\_NUMBER\_OF\_MINERS                 | (a)   | handle  | 1114074419  | `abilityintegerlevelfield: 000001B6DD6602D0` |         |
| ABILITY\_ILF\_CARGO\_CAPACITY                         | (a)   | handle  | 1130459697  | `abilityintegerlevelfield: 000001B6DD660340` |         |
| ABILITY\_ILF\_MAXIMUM\_CREEP\_LEVEL\_DEV3             | (a)   | handle  | 1147500083  | `abilityintegerlevelfield: 000001B6DDC0C7E0` |         |
| ABILITY\_ILF\_MAX\_CREEP\_LEVEL\_DEV1                 | (a)   | handle  | 1147500081  | `abilityintegerlevelfield: 000001B6DDC0C820` |         |
| ABILITY\_ILF\_GOLD\_PER\_INTERVAL\_EGM1               | (a)   | handle  | 1164406065  | `abilityintegerlevelfield: 000001B6DDC0C860` |         |
| ABILITY\_ILF\_DEFENSE\_REDUCTION                      | (a)   | handle  | 1180788017  | `abilityintegerlevelfield: 000001B6DDC0C8D0` |         |
| ABILITY\_ILF\_DETECTION\_TYPE\_FLA1                   | (a)   | handle  | 1181507889  | `abilityintegerlevelfield: 000001B6DDC0C910` |         |
| ABILITY\_ILF\_FLARE\_COUNT                            | (a)   | handle  | 1181507891  | `abilityintegerlevelfield: 000001B6DDC0C950` |         |
| ABILITY\_ILF\_MAX\_GOLD                               | (a)   | handle  | 1198285873  | `abilityintegerlevelfield: 000001B6DDC0C9C0` |         |
| ABILITY\_ILF\_MINING\_CAPACITY                        | (a)   | handle  | 1198285875  | `abilityintegerlevelfield: 000001B6DDC0CA00` |         |
| ABILITY\_ILF\_MAXIMUM\_NUMBER\_OF\_CORPSES\_GYD1      | (a)   | handle  | 1199137841  | `abilityintegerlevelfield: 000001B6DDC0CA70` |         |
| ABILITY\_ILF\_DAMAGE\_TO\_TREE                        | (a)   | handle  | 1214345777  | `abilityintegerlevelfield: 000001B6DDC0CAB0` |         |
| ABILITY\_ILF\_LUMBER\_CAPACITY                        | (a)   | handle  | 1214345778  | `abilityintegerlevelfield: 000001B6DDC0CAF0` |         |
| ABILITY\_ILF\_GOLD\_CAPACITY                          | (a)   | handle  | 1214345779  | `abilityintegerlevelfield: 000001B6DDC0CB30` |         |
| ABILITY\_ILF\_DEFENSE\_INCREASE\_INF2                 | (a)   | handle  | 1231971890  | `abilityintegerlevelfield: 000001B6DDC0CBA0` |         |
| ABILITY\_ILF\_INTERACTION\_TYPE                       | (a)   | handle  | 1315271986  | `abilityintegerlevelfield: 000001B6DF26ABD0` |         |
| ABILITY\_ILF\_GOLD\_COST\_NDT1                        | (a)   | handle  | 1315206193  | `abilityintegerlevelfield: 000001B6DF26AC40` |         |
| ABILITY\_ILF\_LUMBER\_COST\_NDT2                      | (a)   | handle  | 1315206194  | `abilityintegerlevelfield: 000001B6DF26AC80` |         |
| ABILITY\_ILF\_DETECTION\_TYPE\_NDT3                   | (a)   | handle  | 1315206195  | `abilityintegerlevelfield: 000001B6DF26ACC0` |         |
| ABILITY\_ILF\_STACKING\_TYPE\_POI4                    | (a)   | handle  | 1349478708  | `abilityintegerlevelfield: 000001B6DF26AD60` |         |
| ABILITY\_ILF\_STACKING\_TYPE\_POA5                    | (a)   | handle  | 1349476661  | `abilityintegerlevelfield: 000001B6DF26ADA0` |         |
| ABILITY\_ILF\_MAXIMUM\_CREEP\_LEVEL\_PLY1             | (a)   | handle  | 1349286193  | `abilityintegerlevelfield: 000001B6DD994E30` |         |
| ABILITY\_ILF\_MAXIMUM\_CREEP\_LEVEL\_POS1             | (a)   | handle  | 1349481265  | `abilityintegerlevelfield: 000001B6DD994E70` |         |
| ABILITY\_ILF\_MOVEMENT\_UPDATE\_FREQUENCY\_PRG1       | (a)   | handle  | 1349674801  | `abilityintegerlevelfield: 000001B6DD994EB0` |         |
| ABILITY\_ILF\_ATTACK\_UPDATE\_FREQUENCY\_PRG2         | (a)   | handle  | 1349674802  | `abilityintegerlevelfield: 000001B6DD994EF0` |         |
| ABILITY\_ILF\_MANA\_LOSS\_PRG6                        | (a)   | handle  | 1349674806  | `abilityintegerlevelfield: 000001B6DD994F30` |         |
| ABILITY\_ILF\_UNITS\_SUMMONED\_TYPE\_ONE              | (a)   | handle  | 1382115633  | `abilityintegerlevelfield: 000001B6DD994FA0` |         |
| ABILITY\_ILF\_UNITS\_SUMMONED\_TYPE\_TWO              | (a)   | handle  | 1382115634  | `abilityintegerlevelfield: 000001B6DD994FE0` |         |
| ABILITY\_ILF\_MAX\_UNITS\_SUMMONED                    | (a)   | handle  | 1432576565  | `abilityintegerlevelfield: 000001B6DD995050` |         |
| ABILITY\_ILF\_ALLOW\_WHEN\_FULL\_REJ3                 | (a)   | handle  | 1382378035  | `abilityintegerlevelfield: 000001B6DD9950C0` |         |
| ABILITY\_ILF\_MAXIMUM\_UNITS\_CHARGED\_TO\_CASTER     | (a)   | handle  | 1383096885  | `abilityintegerlevelfield: 000001B6DD995100` |         |
| ABILITY\_ILF\_MAXIMUM\_UNITS\_AFFECTED                | (a)   | handle  | 1383096886  | `abilityintegerlevelfield: 000001B6DD995140` |         |
| ABILITY\_ILF\_DEFENSE\_INCREASE\_ROA2                 | (a)   | handle  | 1383031090  | `abilityintegerlevelfield: 000001B6DD995180` |         |
| ABILITY\_ILF\_MAX\_UNITS\_ROA7                        | (a)   | handle  | 1383031095  | `abilityintegerlevelfield: 000001B6DD9951F0` |         |
| ABILITY\_ILF\_ROOTED\_WEAPONS                         | (a)   | handle  | 1383034673  | `abilityintegerlevelfield: 000001B6DD8A8640` |         |
| ABILITY\_ILF\_UPROOTED\_WEAPONS                       | (a)   | handle  | 1383034674  | `abilityintegerlevelfield: 000001B6DD8A8680` |         |
| ABILITY\_ILF\_UPROOTED\_DEFENSE\_TYPE                 | (a)   | handle  | 1383034676  | `abilityintegerlevelfield: 000001B6DD8A86C0` |         |
| ABILITY\_ILF\_ACCUMULATION\_STEP                      | (a)   | handle  | 1398893618  | `abilityintegerlevelfield: 000001B6DD8A8700` |         |
| ABILITY\_ILF\_NUMBER\_OF\_OWLS                        | (a)   | handle  | 1165192756  | `abilityintegerlevelfield: 000001B6DD8A8740` |         |
| ABILITY\_ILF\_STACKING\_TYPE\_SPO4                    | (a)   | handle  | 1399877428  | `abilityintegerlevelfield: 000001B6DD8A8780` |         |
| ABILITY\_ILF\_NUMBER\_OF\_UNITS                       | (a)   | handle  | 1399809073  | `abilityintegerlevelfield: 000001B6DD8A87C0` |         |
| ABILITY\_ILF\_SPIDER\_CAPACITY                        | (a)   | handle  | 1399873841  | `abilityintegerlevelfield: 000001B6DD8A8800` |         |
| ABILITY\_ILF\_INTERVALS\_BEFORE\_CHANGING\_TREES      | (a)   | handle  | 1466458418  | `abilityintegerlevelfield: 000001B6DD8A88A0` |         |
| ABILITY\_ILF\_AGILITY\_BONUS                          | (a)   | handle  | 1231120233  | `abilityintegerlevelfield: 000001B6DD8A88E0` |         |
| ABILITY\_ILF\_INTELLIGENCE\_BONUS                     | (a)   | handle  | 1231646324  | `abilityintegerlevelfield: 000001B6DD8A8920` |         |
| ABILITY\_ILF\_STRENGTH\_BONUS\_ISTR                   | (a)   | handle  | 1232303218  | `abilityintegerlevelfield: 000001B6DD8A8960` |         |
| ABILITY\_ILF\_ATTACK\_BONUS                           | (a)   | handle  | 1231123572  | `abilityintegerlevelfield: 000001B6DD8A89A0` |         |
| ABILITY\_ILF\_DEFENSE\_BONUS\_IDEF                    | (a)   | handle  | 1231316326  | `abilityintegerlevelfield: 000001B6DD8A89E0` |         |
| ABILITY\_ILF\_SUMMON\_1\_AMOUNT                       | (a)   | handle  | 1232301617  | `abilityintegerlevelfield: 000001B6DD8A8A20` |         |
| ABILITY\_ILF\_SUMMON\_2\_AMOUNT                       | (a)   | handle  | 1232301618  | `abilityintegerlevelfield: 000001B6DD936E30` |         |
| ABILITY\_ILF\_EXPERIENCE\_GAINED                      | (a)   | handle  | 1232629863  | `abilityintegerlevelfield: 000001B6DD936EA0` |         |
| ABILITY\_ILF\_HIT\_POINTS\_GAINED\_IHPG               | (a)   | handle  | 1231581287  | `abilityintegerlevelfield: 000001B6DD936EE0` |         |
| ABILITY\_ILF\_MANA\_POINTS\_GAINED\_IMPG              | (a)   | handle  | 1231908967  | `abilityintegerlevelfield: 000001B6DD936F20` |         |
| ABILITY\_ILF\_HIT\_POINTS\_GAINED\_IHP2               | (a)   | handle  | 1231581234  | `abilityintegerlevelfield: 000001B6DD936F60` |         |
| ABILITY\_ILF\_MANA\_POINTS\_GAINED\_IMP2              | (a)   | handle  | 1231908914  | `abilityintegerlevelfield: 000001B6DD936FA0` |         |
| ABILITY\_ILF\_DAMAGE\_BONUS\_DICE                     | (a)   | handle  | 1231317347  | `abilityintegerlevelfield: 000001B6DD936FE0` |         |
| ABILITY\_ILF\_ARMOR\_PENALTY\_IARP                    | (a)   | handle  | 1231123056  | `abilityintegerlevelfield: 000001B6DD937020` |         |
| ABILITY\_ILF\_ENABLED\_ATTACK\_INDEX\_IOB5            | (a)   | handle  | 1232036405  | `abilityintegerlevelfield: 000001B6DD937060` |         |
| ABILITY\_ILF\_LEVELS\_GAINED                          | (a)   | handle  | 1231840630  | `abilityintegerlevelfield: 000001B6DD9370A0` |         |
| ABILITY\_ILF\_MAX\_LIFE\_GAINED                       | (a)   | handle  | 1231841638  | `abilityintegerlevelfield: 000001B6DD9370E0` |         |
| ABILITY\_ILF\_MAX\_MANA\_GAINED                       | (a)   | handle  | 1231905134  | `abilityintegerlevelfield: 000001B6DD937120` |         |
| ABILITY\_ILF\_GOLD\_GIVEN                             | (a)   | handle  | 1231515500  | `abilityintegerlevelfield: 000001B6DD937160` |         |
| ABILITY\_ILF\_LUMBER\_GIVEN                           | (a)   | handle  | 1231844717  | `abilityintegerlevelfield: 000001B6DD9371A0` |         |
| ABILITY\_ILF\_DETECTION\_TYPE\_IFA1                   | (a)   | handle  | 1231446321  | `abilityintegerlevelfield: 000001B6DD9371E0` |         |
| ABILITY\_ILF\_MAXIMUM\_CREEP\_LEVEL\_ICRE             | (a)   | handle  | 1231254117  | `abilityintegerlevelfield: 000001B6DD937220` |         |
| ABILITY\_ILF\_MOVEMENT\_SPEED\_BONUS                  | (a)   | handle  | 1231910498  | `abilityintegerlevelfield: 000001B6DD8F5200` |         |
| ABILITY\_ILF\_HIT\_POINTS\_REGENERATED\_PER\_SECOND   | (a)   | handle  | 1231581298  | `abilityintegerlevelfield: 000001B6DD8F5240` |         |
| ABILITY\_ILF\_SIGHT\_RANGE\_BONUS                     | (a)   | handle  | 1232300386  | `abilityintegerlevelfield: 000001B6DD8F5280` |         |
| ABILITY\_ILF\_DAMAGE\_PER\_DURATION                   | (a)   | handle  | 1231251044  | `abilityintegerlevelfield: 000001B6DD8F52C0` |         |
| ABILITY\_ILF\_MANA\_USED\_PER\_SECOND                 | (a)   | handle  | 1231251053  | `abilityintegerlevelfield: 000001B6DD8F5300` |         |
| ABILITY\_ILF\_EXTRA\_MANA\_REQUIRED                   | (a)   | handle  | 1231251064  | `abilityintegerlevelfield: 000001B6DD8F5340` |         |
| ABILITY\_ILF\_DETECTION\_RADIUS\_IDET                 | (a)   | handle  | 1231316340  | `abilityintegerlevelfield: 000001B6DD8F5380` |         |
| ABILITY\_ILF\_MANA\_LOSS\_PER\_UNIT\_IDIM             | (a)   | handle  | 1231317357  | `abilityintegerlevelfield: 000001B6DD8F53C0` |         |
| ABILITY\_ILF\_DAMAGE\_TO\_SUMMONED\_UNITS\_IDID       | (a)   | handle  | 1231317348  | `abilityintegerlevelfield: 000001B6DD8F5400` |         |
| ABILITY\_ILF\_MAXIMUM\_NUMBER\_OF\_UNITS\_IREC        | (a)   | handle  | 1232233827  | `abilityintegerlevelfield: 000001B6DD8F5440` |         |
| ABILITY\_ILF\_DELAY\_AFTER\_DEATH\_SECONDS            | (a)   | handle  | 1232233316  | `abilityintegerlevelfield: 000001B6DD8F5480` |         |
| ABILITY\_ILF\_RESTORED\_LIFE                          | (a)   | handle  | 1769104178  | `abilityintegerlevelfield: 000001B6DD8F54C0` |         |
| ABILITY\_ILF\_RESTORED\_MANA\_\_1\_FOR\_CURRENT       | (a)   | handle  | 1769104179  | `abilityintegerlevelfield: 000001B6DD8F5500` |         |
| ABILITY\_ILF\_HIT\_POINTS\_RESTORED                   | (a)   | handle  | 1231581299  | `abilityintegerlevelfield: 000001B6DD8F5540` |         |
| ABILITY\_ILF\_MANA\_POINTS\_RESTORED                  | (a)   | handle  | 1231908979  | `abilityintegerlevelfield: 000001B6DD8F5580` |         |
| ABILITY\_ILF\_MAXIMUM\_NUMBER\_OF\_UNITS\_ITPM        | (a)   | handle  | 1232367725  | `abilityintegerlevelfield: 000001B6DD8F55C0` |         |
| ABILITY\_ILF\_NUMBER\_OF\_CORPSES\_RAISED\_CAD1       | (a)   | handle  | 1130456113  | `abilityintegerlevelfield: 000001B6DD571150` |         |
| ABILITY\_ILF\_TERRAIN\_DEFORMATION\_DURATION\_MS      | (a)   | handle  | 1467118387  | `abilityintegerlevelfield: 000001B6DD571190` |         |
| ABILITY\_ILF\_MAXIMUM\_UNITS                          | (a)   | handle  | 1432646449  | `abilityintegerlevelfield: 000001B6DD5711D0` |         |
| ABILITY\_ILF\_DETECTION\_TYPE\_DET1                   | (a)   | handle  | 1147499569  | `abilityintegerlevelfield: 000001B6DD571210` |         |
| ABILITY\_ILF\_GOLD\_COST\_PER\_STRUCTURE              | (a)   | handle  | 1316188209  | `abilityintegerlevelfield: 000001B6DD571250` |         |
| ABILITY\_ILF\_LUMBER\_COST\_PER\_USE                  | (a)   | handle  | 1316188210  | `abilityintegerlevelfield: 000001B6DD571290` |         |
| ABILITY\_ILF\_DETECTION\_TYPE\_NSP3                   | (a)   | handle  | 1316188211  | `abilityintegerlevelfield: 000001B6DD5712D0` |         |
| ABILITY\_ILF\_NUMBER\_OF\_SWARM\_UNITS                | (a)   | handle  | 1433170737  | `abilityintegerlevelfield: 000001B6DD571310` |         |
| ABILITY\_ILF\_MAX\_SWARM\_UNITS\_PER\_TARGET          | (a)   | handle  | 1433170739  | `abilityintegerlevelfield: 000001B6DD571350` |         |
| ABILITY\_ILF\_NUMBER\_OF\_SUMMONED\_UNITS\_NBA2       | (a)   | handle  | 1315070258  | `abilityintegerlevelfield: 000001B6DD571390` |         |
| ABILITY\_ILF\_MAXIMUM\_CREEP\_LEVEL\_NCH1             | (a)   | handle  | 1315137585  | `abilityintegerlevelfield: 000001B6DD5713D0` |         |
| ABILITY\_ILF\_ATTACKS\_PREVENTED                      | (a)   | handle  | 1316186417  | `abilityintegerlevelfield: 000001B6DD571410` |         |
| ABILITY\_ILF\_MAXIMUM\_NUMBER\_OF\_TARGETS\_EFK3      | (a)   | handle  | 1164340019  | `abilityintegerlevelfield: 000001B6DD571450` |         |
| ABILITY\_ILF\_NUMBER\_OF\_SUMMONED\_UNITS\_ESV1       | (a)   | handle  | 1165194801  | `abilityintegerlevelfield: 000001B6DD571490` |         |
| ABILITY\_ILF\_MAXIMUM\_NUMBER\_OF\_CORPSES\_EXH1      | (a)   | handle  | 1702389809  | `abilityintegerlevelfield: 000001B6DD5714D0` |         |
| ABILITY\_ILF\_ITEM\_CAPACITY                          | (a)   | handle  | 1768846897  | `abilityintegerlevelfield: 000001B6DD571510` |         |
| ABILITY\_ILF\_MAXIMUM\_NUMBER\_OF\_TARGETS\_SPL2      | (a)   | handle  | 1936747570  | `abilityintegerlevelfield: 000001B6DD4F4680` |         |
| ABILITY\_ILF\_ALLOW\_WHEN\_FULL\_IRL3                 | (a)   | handle  | 1769106483  | `abilityintegerlevelfield: 000001B6DD4F46C0` |         |
| ABILITY\_ILF\_MAXIMUM\_DISPELLED\_UNITS               | (a)   | handle  | 1768186675  | `abilityintegerlevelfield: 000001B6DD4F4700` |         |
| ABILITY\_ILF\_NUMBER\_OF\_LURES                       | (a)   | handle  | 1768779569  | `abilityintegerlevelfield: 000001B6DD4F4740` |         |
| ABILITY\_ILF\_NEW\_TIME\_OF\_DAY\_HOUR                | (a)   | handle  | 1768125489  | `abilityintegerlevelfield: 000001B6DD4F4780` |         |
| ABILITY\_ILF\_NEW\_TIME\_OF\_DAY\_MINUTE              | (a)   | handle  | 1768125490  | `abilityintegerlevelfield: 000001B6DD4F47C0` |         |
| ABILITY\_ILF\_NUMBER\_OF\_UNITS\_CREATED\_MEC1        | (a)   | handle  | 1835361073  | `abilityintegerlevelfield: 000001B6DD4F4800` |         |
| ABILITY\_ILF\_MINIMUM\_SPELLS                         | (a)   | handle  | 1936745011  | `abilityintegerlevelfield: 000001B6DD4F4840` |         |
| ABILITY\_ILF\_MAXIMUM\_SPELLS                         | (a)   | handle  | 1936745012  | `abilityintegerlevelfield: 000001B6DD4F4880` |         |
| ABILITY\_ILF\_DISABLED\_ATTACK\_INDEX                 | (a)   | handle  | 1735549235  | `abilityintegerlevelfield: 000001B6DD4F48C0` |         |
| ABILITY\_ILF\_ENABLED\_ATTACK\_INDEX\_GRA4            | (a)   | handle  | 1735549236  | `abilityintegerlevelfield: 000001B6DD4F4900` |         |
| ABILITY\_ILF\_MAXIMUM\_ATTACKS                        | (a)   | handle  | 1735549237  | `abilityintegerlevelfield: 000001B6DD4F4940` |         |
| ABILITY\_ILF\_BUILDING\_TYPES\_ALLOWED\_NPR1          | (a)   | handle  | 1315992113  | `abilityintegerlevelfield: 000001B6DD4F4980` |         |
| ABILITY\_ILF\_BUILDING\_TYPES\_ALLOWED\_NSA1          | (a)   | handle  | 1316184369  | `abilityintegerlevelfield: 000001B6DD4F49C0` |         |
| ABILITY\_ILF\_ATTACK\_MODIFICATION                    | (a)   | handle  | 1231118641  | `abilityintegerlevelfield: 000001B6DD4F4A00` |         |
| ABILITY\_ILF\_SUMMONED\_UNIT\_COUNT\_NPA5             | (a)   | handle  | 1315987765  | `abilityintegerlevelfield: 000001B6DD4F4A40` |         |
| ABILITY\_ILF\_UPGRADE\_LEVELS                         | (a)   | handle  | 1231514673  | `abilityintegerlevelfield: 000001B6DA655DC0` |         |
| ABILITY\_ILF\_NUMBER\_OF\_SUMMONED\_UNITS\_NDO2       | (a)   | handle  | 1315204914  | `abilityintegerlevelfield: 000001B6DA655E00` |         |
| ABILITY\_ILF\_BEASTS\_PER\_SECOND                     | (a)   | handle  | 1316189233  | `abilityintegerlevelfield: 000001B6DA655E40` |         |
| ABILITY\_ILF\_TARGET\_TYPE                            | (a)   | handle  | 1315138610  | `abilityintegerlevelfield: 000001B6DA655E80` |         |
| ABILITY\_ILF\_OPTIONS                                 | (a)   | handle  | 1315138611  | `abilityintegerlevelfield: 000001B6DA655EC0` |         |
| ABILITY\_ILF\_ARMOR\_PENALTY\_NAB3                    | (a)   | handle  | 1315004979  | `abilityintegerlevelfield: 000001B6DA655F00` |         |
| ABILITY\_ILF\_WAVE\_COUNT\_NHS6                       | (a)   | handle  | 1315468086  | `abilityintegerlevelfield: 000001B6DA655F40` |         |
| ABILITY\_ILF\_MAX\_CREEP\_LEVEL\_NTM3                 | (a)   | handle  | 1316252979  | `abilityintegerlevelfield: 000001B6DA655F80` |         |
| ABILITY\_ILF\_MISSILE\_COUNT                          | (a)   | handle  | 1315140403  | `abilityintegerlevelfield: 000001B6DA655FC0` |         |
| ABILITY\_ILF\_SPLIT\_ATTACK\_COUNT                    | (a)   | handle  | 1315728691  | `abilityintegerlevelfield: 000001B6DA656000` |         |
| ABILITY\_ILF\_GENERATION\_COUNT                       | (a)   | handle  | 1315728694  | `abilityintegerlevelfield: 000001B6DA656040` |         |
| ABILITY\_ILF\_ROCK\_RING\_COUNT                       | (a)   | handle  | 1316381489  | `abilityintegerlevelfield: 000001B6DA656080` |         |
| ABILITY\_ILF\_WAVE\_COUNT\_NVC2                       | (a)   | handle  | 1316381490  | `abilityintegerlevelfield: 000001B6DA6560C0` |         |
| ABILITY\_ILF\_PREFER\_HOSTILES\_TAU1                  | (a)   | handle  | 1415673137  | `abilityintegerlevelfield: 000001B6DA656100` |         |
| ABILITY\_ILF\_PREFER\_FRIENDLIES\_TAU2                | (a)   | handle  | 1415673138  | `abilityintegerlevelfield: 000001B6DA656140` |         |
| ABILITY\_ILF\_MAX\_UNITS\_TAU3                        | (a)   | handle  | 1415673139  | `abilityintegerlevelfield: 000001B6DA656180` |         |
| ABILITY\_ILF\_NUMBER\_OF\_PULSES                      | (a)   | handle  | 1415673140  | `abilityintegerlevelfield: 000001B6DDE05EB0` |         |
| ABILITY\_ILF\_SUMMONED\_UNIT\_TYPE\_HWE1              | (a)   | handle  | 1215784241  | `abilityintegerlevelfield: 000001B6DDE05EF0` |         |
| ABILITY\_ILF\_SUMMONED\_UNIT\_UIN4                    | (a)   | handle  | 1432972852  | `abilityintegerlevelfield: 000001B6DDE05F30` |         |
| ABILITY\_ILF\_SUMMONED\_UNIT\_OSF1                    | (a)   | handle  | 1332962865  | `abilityintegerlevelfield: 000001B6DDE05F70` |         |
| ABILITY\_ILF\_SUMMONED\_UNIT\_TYPE\_EFNU              | (a)   | handle  | 1164340853  | `abilityintegerlevelfield: 000001B6DDE05FB0` |         |
| ABILITY\_ILF\_SUMMONED\_UNIT\_TYPE\_NBAU              | (a)   | handle  | 1315070325  | `abilityintegerlevelfield: 000001B6DDE05FF0` |         |
| ABILITY\_ILF\_SUMMONED\_UNIT\_TYPE\_NTOU              | (a)   | handle  | 1316253557  | `abilityintegerlevelfield: 000001B6DDE06030` |         |
| ABILITY\_ILF\_SUMMONED\_UNIT\_TYPE\_ESVU              | (a)   | handle  | 1165194869  | `abilityintegerlevelfield: 000001B6DDE06070` |         |
| ABILITY\_ILF\_SUMMONED\_UNIT\_TYPES                   | (a)   | handle  | 1315268145  | `abilityintegerlevelfield: 000001B6DDE060B0` |         |
| ABILITY\_ILF\_SUMMONED\_UNIT\_TYPE\_NDOU              | (a)   | handle  | 1315204981  | `abilityintegerlevelfield: 000001B6DDE060F0` |         |
| ABILITY\_ILF\_ALTERNATE\_FORM\_UNIT\_EMEU             | (a)   | handle  | 1164797301  | `abilityintegerlevelfield: 000001B6DDE06130` |         |
| ABILITY\_ILF\_PLAGUE\_WARD\_UNIT\_TYPE                | (a)   | handle  | 1097886837  | `abilityintegerlevelfield: 000001B6DDE06170` |         |
| ABILITY\_ILF\_ALLOWED\_UNIT\_TYPE\_BTL1               | (a)   | handle  | 1114926129  | `abilityintegerlevelfield: 000001B6DDE061B0` |         |
| ABILITY\_ILF\_NEW\_UNIT\_TYPE                         | (a)   | handle  | 1130914097  | `abilityintegerlevelfield: 000001B6DDE061F0` |         |
| ABILITY\_ILF\_RESULTING\_UNIT\_TYPE\_ENT1             | (a)   | handle  | 1701737521  | `abilityintegerlevelfield: 000001B6DDE06230` |         |
| ABILITY\_ILF\_CORPSE\_UNIT\_TYPE                      | (a)   | handle  | 1199137909  | `abilityintegerlevelfield: 000001B6DDE06270` |         |
| ABILITY\_ILF\_ALLOWED\_UNIT\_TYPE\_LOA1               | (a)   | handle  | 1282367793  | `abilityintegerlevelfield: 000001B6DD922580` |         |
| ABILITY\_ILF\_UNIT\_TYPE\_FOR\_LIMIT\_CHECK           | (a)   | handle  | 1382115701  | `abilityintegerlevelfield: 000001B6DD9225C0` |         |
| ABILITY\_ILF\_WARD\_UNIT\_TYPE\_STAU                  | (a)   | handle  | 1400136053  | `abilityintegerlevelfield: 000001B6DD922600` |         |
| ABILITY\_ILF\_EFFECT\_ABILITY                         | (a)   | handle  | 1232036469  | `abilityintegerlevelfield: 000001B6DD922640` |         |
| ABILITY\_ILF\_CONVERSION\_UNIT                        | (a)   | handle  | 1315201842  | `abilityintegerlevelfield: 000001B6DD922680` |         |
| ABILITY\_ILF\_UNIT\_TO\_PRESERVE                      | (a)   | handle  | 1316187185  | `abilityintegerlevelfield: 000001B6DD9226C0` |         |
| ABILITY\_ILF\_UNIT\_TYPE\_ALLOWED                     | (a)   | handle  | 1130916913  | `abilityintegerlevelfield: 000001B6DD922700` |         |
| ABILITY\_ILF\_SWARM\_UNIT\_TYPE                       | (a)   | handle  | 1433170805  | `abilityintegerlevelfield: 000001B6DD922740` |         |
| ABILITY\_ILF\_RESULTING\_UNIT\_TYPE\_COAU             | (a)   | handle  | 1668243829  | `abilityintegerlevelfield: 000001B6DD922780` |         |
| ABILITY\_ILF\_UNIT\_TYPE\_EXHU                        | (a)   | handle  | 1702389877  | `abilityintegerlevelfield: 000001B6DD9227C0` |         |
| ABILITY\_ILF\_WARD\_UNIT\_TYPE\_HWDU                  | (a)   | handle  | 1752654965  | `abilityintegerlevelfield: 000001B6DD922800` |         |
| ABILITY\_ILF\_LURE\_UNIT\_TYPE                        | (a)   | handle  | 1768779637  | `abilityintegerlevelfield: 000001B6DD922840` |         |
| ABILITY\_ILF\_UNIT\_TYPE\_IPMU                        | (a)   | handle  | 1768975733  | `abilityintegerlevelfield: 000001B6DD922880` |         |
| ABILITY\_ILF\_FACTORY\_UNIT\_ID                       | (a)   | handle  | 1316190581  | `abilityintegerlevelfield: 000001B6DD9228C0` |         |
| ABILITY\_ILF\_SPAWN\_UNIT\_ID\_NFYU                   | (a)   | handle  | 1315338613  | `abilityintegerlevelfield: 000001B6DD922900` |         |
| ABILITY\_ILF\_DESTRUCTIBLE\_ID                        | (a)   | handle  | 1316381557  | `abilityintegerlevelfield: 000001B6DD922940` |         |
| ABILITY\_ILF\_UPGRADE\_TYPE                           | (a)   | handle  | 1231514741  | `abilityintegerlevelfield: 000001B6DD82FA30` |         |
| ABILITY\_ILF\_MIND\_CONTROLLED\_UNIT\_LIMIT           | (a)   | handle  | 1751999283  | `abilityintegerlevelfield: 000001B6DD82FA70` |         |
| ABILITY\_ILF\_DAMAGE\_STRENGTH\_MODIFIER\_PERCENT     | (a)   | handle  | 1937207349  | `abilityintegerlevelfield: 000001B6DD82FAB0` |         |
| ABILITY\_ILF\_MAX\_TARGETS\_HIT                       | (a)   | handle  | 1937207351  | `abilityintegerlevelfield: 000001B6DD82FAF0` |         |
| ABILITY\_ILF\_ATTACK\_SPEED\_REDUCTION\_PERCENT\_SWP9 | (a)   | handle  | 1937207353  | `abilityintegerlevelfield: 000001B6DD82FB30` |         |
| ABILITY\_ILF\_ALLY\_PASSIVE\_STAT\_AMPLIFY\_PERCENT   | (a)   | handle  | 1936682038  | `abilityintegerlevelfield: 000001B6DD82FB70` |         |
| ABILITY\_ILF\_ATTACK\_SPEED\_GAIN\_PERCENT            | (a)   | handle  | 1936682039  | `abilityintegerlevelfield: 000001B6DD82FBB0` |         |
| ABILITY\_ILF\_MOVEMENT\_SPEED\_GAIN\_PERCENT          | (a)   | handle  | 1936682040  | `abilityintegerlevelfield: 000001B6DD82FC20` |         |
| ABILITY\_ILF\_HEALTH\_COST\_PERCENT                   | (a)   | handle  | 1970693937  | `abilityintegerlevelfield: 000001B6DD82FC60` |         |
| ABILITY\_ILF\_BONUS\_STRENGTH\_UVG2                   | (a)   | handle  | 1970693938  | `abilityintegerlevelfield: 000001B6DD82FCA0` |         |
| ABILITY\_ILF\_BONUS\_RESOLVE\_PERCENT                 | (a)   | handle  | 1970693939  | `abilityintegerlevelfield: 000001B6DD82FCE0` |         |
| ABILITY\_ILF\_BONUS\_LIFE\_STEAL\_PERCENT             | (a)   | handle  | 1970693940  | `abilityintegerlevelfield: 000001B6DD82FD20` |         |
| ABILITY\_ILF\_BONUS\_SPELL\_VAMP\_PERCENT             | (a)   | handle  | 1970693941  | `abilityintegerlevelfield: 000001B6DD82FD60` |         |
| ABILITY\_ILF\_DOUBLE\_BONUS\_BELOW\_HEALTH\_PERCENT   | (a)   | handle  | 1970693942  | `abilityintegerlevelfield: 000001B6DD82FDA0` |         |
| ABILITY\_ILF\_MAX\_CHARGES\_UBR3                      | (a)   | handle  | 1969386035  | `abilityintegerlevelfield: 000001B6DD82FDE0` |         |
| ABILITY\_ILF\_STACKS\_REQUIRED                        | (a)   | handle  | 1969513011  | `abilityintegerlevelfield: 000001B6DD82FE20` |         |
| ABILITY\_ILF\_MAX\_ATTACK\_SPEED\_STACKS              | (a)   | handle  | 1969513013  | `abilityintegerlevelfield: 000001B6DDCEF360` |         |
| ABILITY\_ILF\_MAX\_CHARGES\_UWF1                      | (a)   | handle  | 1970759217  | `abilityintegerlevelfield: 000001B6DDCEF3A0` |         |
| ABILITY\_ILF\_TARGET\_ARMOR\_REDUCTION                | (a)   | handle  | 1970759220  | `abilityintegerlevelfield: 000001B6DDCEF3E0` |         |
| -1                                                    | (a)   | handle  | -1          | `abilityintegerlevelfield: 000001B703639160` |         |
| past the last constant                                | (a)   | handle  | 1970759221  | `abilityintegerlevelfield: 000001B70363D540` |         |
| 2147483647                                            | (a)   | handle  | 2147483647  | `abilityintegerlevelfield: 000001B70363DB00` |         |
| -2147483648                                           | (a)   | handle  | -2147483648 | `abilityintegerlevelfield: 000001B70363B9A0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertAbilityRealLevelField`

| Case                                                              | Group | Outcome | Id          | Type                                      | Message |
| ----------------------------------------------------------------- | ----- | ------- | ----------- | ----------------------------------------- | ------- |
| ABILITY\_RLF\_CASTING\_TIME                                       | (a)   | handle  | 1633902963  | `abilityreallevelfield: 000001B6DDCEF420` |         |
| ABILITY\_RLF\_DURATION\_NORMAL                                    | (a)   | handle  | 1633973618  | `abilityreallevelfield: 000001B6DDCEF490` |         |
| ABILITY\_RLF\_DURATION\_HERO                                      | (a)   | handle  | 1634231413  | `abilityreallevelfield: 000001B6DDCEF520` |         |
| ABILITY\_RLF\_COOLDOWN                                            | (a)   | handle  | 1633903726  | `abilityreallevelfield: 000001B6DDCEF5F0` |         |
| ABILITY\_RLF\_AREA\_OF\_EFFECT                                    | (a)   | handle  | 1633776229  | `abilityreallevelfield: 000001B6DDCEF630` |         |
| ABILITY\_RLF\_CAST\_RANGE                                         | (a)   | handle  | 1634885998  | `abilityreallevelfield: 000001B6DDCEF4D0` |         |
| ABILITY\_RLF\_DAMAGE\_HBZ2                                        | (a)   | handle  | 1214413362  | `abilityreallevelfield: 000001B6DDCEF560` |         |
| ABILITY\_RLF\_BUILDING\_REDUCTION\_HBZ4                           | (a)   | handle  | 1214413364  | `abilityreallevelfield: 000001B6DDCEF5A0` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_HBZ5                           | (a)   | handle  | 1214413365  | `abilityreallevelfield: 000001B6DD989770` |         |
| ABILITY\_RLF\_MAXIMUM\_DAMAGE\_PER\_WAVE                          | (a)   | handle  | 1214413366  | `abilityreallevelfield: 000001B6DD9899C0` |         |
| ABILITY\_RLF\_MANA\_REGENERATION\_INCREASE                        | (a)   | handle  | 1214341681  | `abilityreallevelfield: 000001B6DD989A00` |         |
| ABILITY\_RLF\_CASTING\_DELAY                                      | (a)   | handle  | 1215132722  | `abilityreallevelfield: 000001B6DD989A40` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_OWW1                           | (a)   | handle  | 1333229361  | `abilityreallevelfield: 000001B6DD989A80` |         |
| ABILITY\_RLF\_MAGIC\_DAMAGE\_REDUCTION\_OWW2                      | (a)   | handle  | 1333229362  | `abilityreallevelfield: 000001B6DD989AC0` |         |
| ABILITY\_RLF\_CHANCE\_TO\_CRITICAL\_STRIKE                        | (a)   | handle  | 1331917361  | `abilityreallevelfield: 000001B6DD989B00` |         |
| ABILITY\_RLF\_DAMAGE\_MULTIPLIER\_OCR2                            | (a)   | handle  | 1331917362  | `abilityreallevelfield: 000001B6DD989B40` |         |
| ABILITY\_RLF\_DAMAGE\_BONUS\_OCR3                                 | (a)   | handle  | 1331917363  | `abilityreallevelfield: 000001B6DDCEF670` |         |
| ABILITY\_RLF\_CHANCE\_TO\_EVADE\_OCR4                             | (a)   | handle  | 1331917364  | `abilityreallevelfield: 000001B6DDCEF6B0` |         |
| ABILITY\_RLF\_DAMAGE\_DEALT\_PERCENT\_OMI2                        | (a)   | handle  | 1332570418  | `abilityreallevelfield: 000001B6DDCEF6F0` |         |
| ABILITY\_RLF\_DAMAGE\_TAKEN\_PERCENT\_OMI3                        | (a)   | handle  | 1332570419  | `abilityreallevelfield: 000001B6DDCEF730` |         |
| ABILITY\_RLF\_ANIMATION\_DELAY                                    | (a)   | handle  | 1332570420  | `abilityreallevelfield: 000001B6DD9897B0` |         |
| ABILITY\_RLF\_TRANSITION\_TIME                                    | (a)   | handle  | 1333226289  | `abilityreallevelfield: 000001B6DD9897F0` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_INCREASE\_PERCENT\_OWK2            | (a)   | handle  | 1333226290  | `abilityreallevelfield: 000001B6DD989830` |         |
| ABILITY\_RLF\_BACKSTAB\_DAMAGE                                    | (a)   | handle  | 1333226291  | `abilityreallevelfield: 000001B6DD989870` |         |
| ABILITY\_RLF\_AMOUNT\_HEALED\_DAMAGED\_UDC1                       | (a)   | handle  | 1432642353  | `abilityreallevelfield: 000001B6DD9898B0` |         |
| ABILITY\_RLF\_LIFE\_CONVERTED\_TO\_MANA                           | (a)   | handle  | 1432645681  | `abilityreallevelfield: 000001B6DD9898F0` |         |
| ABILITY\_RLF\_LIFE\_CONVERTED\_TO\_LIFE                           | (a)   | handle  | 1432645682  | `abilityreallevelfield: 000001B6DD989930` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_INCREASE\_PERCENT\_UAU1            | (a)   | handle  | 1432450353  | `abilityreallevelfield: 000001B6DD989970` |         |
| ABILITY\_RLF\_LIFE\_REGENERATION\_INCREASE\_PERCENT               | (a)   | handle  | 1432450354  | `abilityreallevelfield: 000001B6DD82B160` |         |
| ABILITY\_RLF\_CHANCE\_TO\_EVADE\_EEV1                             | (a)   | handle  | 1164277297  | `abilityreallevelfield: 000001B6DD82B1A0` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_INTERVAL                               | (a)   | handle  | 1164537137  | `abilityreallevelfield: 000001B6DD82B1E0` |         |
| ABILITY\_RLF\_MANA\_DRAINED\_PER\_SECOND\_EIM2                    | (a)   | handle  | 1164537138  | `abilityreallevelfield: 000001B6DD82B220` |         |
| ABILITY\_RLF\_BUFFER\_MANA\_REQUIRED                              | (a)   | handle  | 1164537139  | `abilityreallevelfield: 000001B6DD82B260` |         |
| ABILITY\_RLF\_MAX\_MANA\_DRAINED                                  | (a)   | handle  | 1164796465  | `abilityreallevelfield: 000001B6DD82B2A0` |         |
| ABILITY\_RLF\_BOLT\_DELAY                                         | (a)   | handle  | 1164796466  | `abilityreallevelfield: 000001B6DD82B2E0` |         |
| ABILITY\_RLF\_BOLT\_LIFETIME                                      | (a)   | handle  | 1164796467  | `abilityreallevelfield: 000001B6DD82B320` |         |
| ABILITY\_RLF\_ALTITUDE\_ADJUSTMENT\_DURATION                      | (a)   | handle  | 1164797235  | `abilityreallevelfield: 000001B6DD82B360` |         |
| ABILITY\_RLF\_LANDING\_DELAY\_TIME                                | (a)   | handle  | 1164797236  | `abilityreallevelfield: 000001B6DD82B3A0` |         |
| ABILITY\_RLF\_ALTERNATE\_FORM\_HIT\_POINT\_BONUS                  | (a)   | handle  | 1164797237  | `abilityreallevelfield: 000001B6DD82B3E0` |         |
| ABILITY\_RLF\_MOVE\_SPEED\_BONUS\_INFO\_PANEL\_ONLY               | (a)   | handle  | 1315140149  | `abilityreallevelfield: 000001B6DD82B420` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_BONUS\_INFO\_PANEL\_ONLY             | (a)   | handle  | 1315140150  | `abilityreallevelfield: 000001B6DD82B460` |         |
| ABILITY\_RLF\_LIFE\_REGENERATION\_RATE\_PER\_SECOND               | (a)   | handle  | 1635149109  | `abilityreallevelfield: 000001B6DD82B4A0` |         |
| ABILITY\_RLF\_STUN\_DURATION\_USL1                                | (a)   | handle  | 1433627697  | `abilityreallevelfield: 000001B6DD82B4E0` |         |
| ABILITY\_RLF\_ATTACK\_DAMAGE\_STOLEN\_PERCENT                     | (a)   | handle  | 1432450609  | `abilityreallevelfield: 000001B6DD82B520` |         |
| ABILITY\_RLF\_DAMAGE\_UCS1                                        | (a)   | handle  | 1432580913  | `abilityreallevelfield: 000001B6DD557FA0` |         |
| ABILITY\_RLF\_MAX\_DAMAGE\_UCS2                                   | (a)   | handle  | 1432580914  | `abilityreallevelfield: 000001B6DD557FE0` |         |
| ABILITY\_RLF\_DISTANCE\_UCS3                                      | (a)   | handle  | 1432580915  | `abilityreallevelfield: 000001B6DD558020` |         |
| ABILITY\_RLF\_FINAL\_AREA\_UCS4                                   | (a)   | handle  | 1432580916  | `abilityreallevelfield: 000001B6DD558060` |         |
| ABILITY\_RLF\_DAMAGE\_UIN1                                        | (a)   | handle  | 1432972849  | `abilityreallevelfield: 000001B6DD5580A0` |         |
| ABILITY\_RLF\_DURATION                                            | (a)   | handle  | 1432972850  | `abilityreallevelfield: 000001B6DD5580E0` |         |
| ABILITY\_RLF\_IMPACT\_DELAY                                       | (a)   | handle  | 1432972851  | `abilityreallevelfield: 000001B6DD558120` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_TARGET\_OCL1                           | (a)   | handle  | 1331915825  | `abilityreallevelfield: 000001B6DD558160` |         |
| ABILITY\_RLF\_DAMAGE\_REDUCTION\_PER\_TARGET                      | (a)   | handle  | 1331915827  | `abilityreallevelfield: 000001B6DD5581A0` |         |
| ABILITY\_RLF\_EFFECT\_DELAY\_OEQ1                                 | (a)   | handle  | 1332048177  | `abilityreallevelfield: 000001B6DD5581E0` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_TO\_BUILDINGS                  | (a)   | handle  | 1332048178  | `abilityreallevelfield: 000001B6DD558220` |         |
| ABILITY\_RLF\_UNITS\_SLOWED\_PERCENT                              | (a)   | handle  | 1332048179  | `abilityreallevelfield: 000001B6DD558260` |         |
| ABILITY\_RLF\_FINAL\_AREA\_OEQ4                                   | (a)   | handle  | 1332048180  | `abilityreallevelfield: 000001B6DD5582A0` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_EER1                           | (a)   | handle  | 1164276273  | `abilityreallevelfield: 000001B6DD5582E0` |         |
| ABILITY\_RLF\_DAMAGE\_DEALT\_TO\_ATTACKERS                        | (a)   | handle  | 1164011569  | `abilityreallevelfield: 000001B6DD558320` |         |
| ABILITY\_RLF\_LIFE\_HEALED                                        | (a)   | handle  | 1165259057  | `abilityreallevelfield: 000001B6DD558360` |         |
| ABILITY\_RLF\_HEAL\_INTERVAL                                      | (a)   | handle  | 1165259058  | `abilityreallevelfield: 000001B6DD8D7650` |         |
| ABILITY\_RLF\_BUILDING\_REDUCTION\_ETQ3                           | (a)   | handle  | 1165259059  | `abilityreallevelfield: 000001B6DD8D7690` |         |
| ABILITY\_RLF\_INITIAL\_IMMUNITY\_DURATION                         | (a)   | handle  | 1165259060  | `abilityreallevelfield: 000001B6DD8D76D0` |         |
| ABILITY\_RLF\_MAX\_LIFE\_DRAINED\_PER\_SECOND\_PERCENT            | (a)   | handle  | 1432642609  | `abilityreallevelfield: 000001B6DD8D7710` |         |
| ABILITY\_RLF\_BUILDING\_REDUCTION\_UDD2                           | (a)   | handle  | 1432642610  | `abilityreallevelfield: 000001B6DD8D7750` |         |
| ABILITY\_RLF\_ARMOR\_DURATION                                     | (a)   | handle  | 1432772913  | `abilityreallevelfield: 000001B6DBD256E0` |         |
| ABILITY\_RLF\_ARMOR\_BONUS\_UFA2                                  | (a)   | handle  | 1432772914  | `abilityreallevelfield: 000001B6DD8D7790` |         |
| ABILITY\_RLF\_AREA\_OF\_EFFECT\_DAMAGE                            | (a)   | handle  | 1432776241  | `abilityreallevelfield: 000001B6DD8D77D0` |         |
| ABILITY\_RLF\_SPECIFIC\_TARGET\_DAMAGE\_UFN2                      | (a)   | handle  | 1432776242  | `abilityreallevelfield: 000001B6DD8D7810` |         |
| ABILITY\_RLF\_DAMAGE\_BONUS\_HFA1                                 | (a)   | handle  | 1214669105  | `abilityreallevelfield: 000001B6DD8D7850` |         |
| ABILITY\_RLF\_DAMAGE\_DEALT\_ESF1                                 | (a)   | handle  | 1165190705  | `abilityreallevelfield: 000001B6DD8D7890` |         |
| ABILITY\_RLF\_DAMAGE\_INTERVAL\_ESF2                              | (a)   | handle  | 1165190706  | `abilityreallevelfield: 000001B6DD8D78D0` |         |
| ABILITY\_RLF\_BUILDING\_REDUCTION\_ESF3                           | (a)   | handle  | 1165190707  | `abilityreallevelfield: 000001B6DD8D7910` |         |
| ABILITY\_RLF\_DAMAGE\_BONUS\_PERCENT                              | (a)   | handle  | 1164014129  | `abilityreallevelfield: 000001B6DD8D7950` |         |
| ABILITY\_RLF\_DEFENSE\_BONUS\_HAV1                                | (a)   | handle  | 1214346801  | `abilityreallevelfield: 000001B6DD8D7990` |         |
| ABILITY\_RLF\_HIT\_POINT\_BONUS                                   | (a)   | handle  | 1214346802  | `abilityreallevelfield: 000001B6DD8D79D0` |         |
| ABILITY\_RLF\_DAMAGE\_BONUS\_HAV3                                 | (a)   | handle  | 1214346803  | `abilityreallevelfield: 000001B6DD8D7A10` |         |
| ABILITY\_RLF\_MAGIC\_DAMAGE\_REDUCTION\_HAV4                      | (a)   | handle  | 1214346804  | `abilityreallevelfield: 000001B6DBD1C920` |         |
| ABILITY\_RLF\_CHANCE\_TO\_BASH                                    | (a)   | handle  | 1214408753  | `abilityreallevelfield: 000001B6DBC47DA0` |         |
| ABILITY\_RLF\_DAMAGE\_MULTIPLIER\_HBH2                            | (a)   | handle  | 1214408754  | `abilityreallevelfield: 000001B6DC828600` |         |
| ABILITY\_RLF\_DAMAGE\_BONUS\_HBH3                                 | (a)   | handle  | 1214408755  | `abilityreallevelfield: 000001B6DBC765F0` |         |
| ABILITY\_RLF\_CHANCE\_TO\_MISS\_HBH4                              | (a)   | handle  | 1214408756  | `abilityreallevelfield: 000001B6DBD444A0` |         |
| ABILITY\_RLF\_DAMAGE\_HTB1                                        | (a)   | handle  | 1215586865  | `abilityreallevelfield: 000001B6DBD444E0` |         |
| ABILITY\_RLF\_AOE\_DAMAGE                                         | (a)   | handle  | 1215587121  | `abilityreallevelfield: 000001B6DBCB3350` |         |
| ABILITY\_RLF\_SPECIFIC\_TARGET\_DAMAGE\_HTC2                      | (a)   | handle  | 1215587122  | `abilityreallevelfield: 000001B6DBCB3390` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_REDUCTION\_PERCENT\_HTC3           | (a)   | handle  | 1215587123  | `abilityreallevelfield: 000001B6D0700D20` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_REDUCTION\_PERCENT\_HTC4             | (a)   | handle  | 1215587124  | `abilityreallevelfield: 000001B6D0700D60` |         |
| ABILITY\_RLF\_ARMOR\_BONUS\_HAD1                                  | (a)   | handle  | 1214342193  | `abilityreallevelfield: 000001B6DDC53B50` |         |
| ABILITY\_RLF\_AMOUNT\_HEALED\_DAMAGED\_HHB1                       | (a)   | handle  | 1214800433  | `abilityreallevelfield: 000001B6DDC53B90` |         |
| ABILITY\_RLF\_EXTRA\_DAMAGE\_HCA1                                 | (a)   | handle  | 1214472497  | `abilityreallevelfield: 000001B6DDC53BD0` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_FACTOR\_HCA2                       | (a)   | handle  | 1214472498  | `abilityreallevelfield: 000001B6DDC53C10` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_FACTOR\_HCA3                         | (a)   | handle  | 1214472499  | `abilityreallevelfield: 000001B6DDC53C50` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_INCREASE\_PERCENT\_OAE1            | (a)   | handle  | 1331782961  | `abilityreallevelfield: 000001B6DDC53C90` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_INCREASE\_PERCENT\_OAE2              | (a)   | handle  | 1331782962  | `abilityreallevelfield: 000001B6DDC53CD0` |         |
| ABILITY\_RLF\_REINCARNATION\_DELAY                                | (a)   | handle  | 1332897073  | `abilityreallevelfield: 000001B6DDC53D10` |         |
| ABILITY\_RLF\_DAMAGE\_OSH1                                        | (a)   | handle  | 1332963377  | `abilityreallevelfield: 000001B6DDC53D50` |         |
| ABILITY\_RLF\_MAXIMUM\_DAMAGE\_OSH2                               | (a)   | handle  | 1332963378  | `abilityreallevelfield: 000001B6DDC53D90` |         |
| ABILITY\_RLF\_DISTANCE\_OSH3                                      | (a)   | handle  | 1332963379  | `abilityreallevelfield: 000001B6DDC53DD0` |         |
| ABILITY\_RLF\_FINAL\_AREA\_OSH4                                   | (a)   | handle  | 1332963380  | `abilityreallevelfield: 000001B6DDC53E10` |         |
| ABILITY\_RLF\_GRAPHIC\_DELAY\_NFD1                                | (a)   | handle  | 1315333169  | `abilityreallevelfield: 000001B6DDC53E50` |         |
| ABILITY\_RLF\_GRAPHIC\_DURATION\_NFD2                             | (a)   | handle  | 1315333170  | `abilityreallevelfield: 000001B6DDC53E90` |         |
| ABILITY\_RLF\_DAMAGE\_NFD3                                        | (a)   | handle  | 1315333171  | `abilityreallevelfield: 000001B6DDC53ED0` |         |
| ABILITY\_RLF\_SUMMONED\_UNIT\_DAMAGE\_AMS1                        | (a)   | handle  | 1097691953  | `abilityreallevelfield: 000001B6DDC53F10` |         |
| ABILITY\_RLF\_MAGIC\_DAMAGE\_REDUCTION\_AMS2                      | (a)   | handle  | 1097691954  | `abilityreallevelfield: 000001B6DD719430` |         |
| ABILITY\_RLF\_AURA\_DURATION                                      | (a)   | handle  | 1097886769  | `abilityreallevelfield: 000001B6DD719470` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_APL2                           | (a)   | handle  | 1097886770  | `abilityreallevelfield: 000001B6DD7194B0` |         |
| ABILITY\_RLF\_DURATION\_OF\_PLAGUE\_WARD                          | (a)   | handle  | 1097886771  | `abilityreallevelfield: 000001B6DD7194F0` |         |
| ABILITY\_RLF\_AMOUNT\_OF\_HIT\_POINTS\_REGENERATED                | (a)   | handle  | 1331786289  | `abilityreallevelfield: 000001B6DD719530` |         |
| ABILITY\_RLF\_ATTACK\_DAMAGE\_INCREASE\_AKB1                      | (a)   | handle  | 1097556529  | `abilityreallevelfield: 000001B6DD719570` |         |
| ABILITY\_RLF\_MANA\_LOSS\_ADM1                                    | (a)   | handle  | 1097100593  | `abilityreallevelfield: 000001B6DD7195B0` |         |
| ABILITY\_RLF\_SUMMONED\_UNIT\_DAMAGE\_ADM2                        | (a)   | handle  | 1097100594  | `abilityreallevelfield: 000001B6DD7195F0` |         |
| ABILITY\_RLF\_EXPANSION\_AMOUNT                                   | (a)   | handle  | 1114401073  | `abilityreallevelfield: 000001B6DD719630` |         |
| ABILITY\_RLF\_INTERVAL\_DURATION\_BGM2                            | (a)   | handle  | 1114074418  | `abilityreallevelfield: 000001B6DD719670` |         |
| ABILITY\_RLF\_RADIUS\_OF\_MINING\_RING                            | (a)   | handle  | 1114074420  | `abilityreallevelfield: 000001B6DD7196B0` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_INCREASE\_PERCENT\_BLO1              | (a)   | handle  | 1114402609  | `abilityreallevelfield: 000001B6DD7196F0` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_INCREASE\_PERCENT\_BLO2            | (a)   | handle  | 1114402610  | `abilityreallevelfield: 000001B6DD719730` |         |
| ABILITY\_RLF\_SCALING\_FACTOR                                     | (a)   | handle  | 1114402611  | `abilityreallevelfield: 000001B6DD719770` |         |
| ABILITY\_RLF\_HIT\_POINTS\_PER\_SECOND\_CAN1                      | (a)   | handle  | 1130458673  | `abilityreallevelfield: 000001B6DD7197B0` |         |
| ABILITY\_RLF\_MAX\_HIT\_POINTS                                    | (a)   | handle  | 1130458674  | `abilityreallevelfield: 000001B6DD7197F0` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_DEV2                           | (a)   | handle  | 1147500082  | `abilityreallevelfield: 000001B6DB88CA70` |         |
| ABILITY\_RLF\_MOVEMENT\_UPDATE\_FREQUENCY\_CHD1                   | (a)   | handle  | 1130914865  | `abilityreallevelfield: 000001B6DB88CAB0` |         |
| ABILITY\_RLF\_ATTACK\_UPDATE\_FREQUENCY\_CHD2                     | (a)   | handle  | 1130914866  | `abilityreallevelfield: 000001B6DB88CAF0` |         |
| ABILITY\_RLF\_SUMMONED\_UNIT\_DAMAGE\_CHD3                        | (a)   | handle  | 1130914867  | `abilityreallevelfield: 000001B6DB88CB30` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_REDUCTION\_PERCENT\_CRI1           | (a)   | handle  | 1131571505  | `abilityreallevelfield: 000001B6DB88CB70` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_REDUCTION\_PERCENT\_CRI2             | (a)   | handle  | 1131571506  | `abilityreallevelfield: 000001B6DB88CBB0` |         |
| ABILITY\_RLF\_DAMAGE\_REDUCTION\_CRI3                             | (a)   | handle  | 1131571507  | `abilityreallevelfield: 000001B6DB88CBF0` |         |
| ABILITY\_RLF\_CHANCE\_TO\_MISS\_CRS                               | (a)   | handle  | 1131574065  | `abilityreallevelfield: 000001B6DB88CC30` |         |
| ABILITY\_RLF\_FULL\_DAMAGE\_RADIUS\_DDA1                          | (a)   | handle  | 1147429169  | `abilityreallevelfield: 000001B6DB88CC70` |         |
| ABILITY\_RLF\_FULL\_DAMAGE\_AMOUNT\_DDA2                          | (a)   | handle  | 1147429170  | `abilityreallevelfield: 000001B6DB88CCB0` |         |
| ABILITY\_RLF\_PARTIAL\_DAMAGE\_RADIUS                             | (a)   | handle  | 1147429171  | `abilityreallevelfield: 000001B6DB88CCF0` |         |
| ABILITY\_RLF\_PARTIAL\_DAMAGE\_AMOUNT                             | (a)   | handle  | 1147429172  | `abilityreallevelfield: 000001B6DB88CD30` |         |
| ABILITY\_RLF\_BUILDING\_DAMAGE\_FACTOR\_SDS1                      | (a)   | handle  | 1399092017  | `abilityreallevelfield: 000001B6DB88CD70` |         |
| ABILITY\_RLF\_MAX\_DAMAGE\_UCO5                                   | (a)   | handle  | 1432579893  | `abilityreallevelfield: 000001B6DB88CDB0` |         |
| ABILITY\_RLF\_MOVE\_SPEED\_BONUS\_UCO6                            | (a)   | handle  | 1432579894  | `abilityreallevelfield: 000001B6DB88CDF0` |         |
| ABILITY\_RLF\_DAMAGE\_TAKEN\_PERCENT\_DEF1                        | (a)   | handle  | 1147495985  | `abilityreallevelfield: 000001B6DB88CE30` |         |
| ABILITY\_RLF\_DAMAGE\_DEALT\_PERCENT\_DEF2                        | (a)   | handle  | 1147495986  | `abilityreallevelfield: 000001B6DB88CE70` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_FACTOR\_DEF3                       | (a)   | handle  | 1147495987  | `abilityreallevelfield: 000001B6D9FFD470` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_FACTOR\_DEF4                         | (a)   | handle  | 1147495988  | `abilityreallevelfield: 000001B6D9FFD4B0` |         |
| ABILITY\_RLF\_MAGIC\_DAMAGE\_REDUCTION\_DEF5                      | (a)   | handle  | 1147495989  | `abilityreallevelfield: 000001B6D9FFD4F0` |         |
| ABILITY\_RLF\_CHANCE\_TO\_DEFLECT                                 | (a)   | handle  | 1147495990  | `abilityreallevelfield: 000001B6D9FFD530` |         |
| ABILITY\_RLF\_DEFLECT\_DAMAGE\_TAKEN\_PIERCING                    | (a)   | handle  | 1147495991  | `abilityreallevelfield: 000001B6D9FFD570` |         |
| ABILITY\_RLF\_DEFLECT\_DAMAGE\_TAKEN\_SPELLS                      | (a)   | handle  | 1147495992  | `abilityreallevelfield: 000001B6D9FFD5B0` |         |
| ABILITY\_RLF\_RIP\_DELAY                                          | (a)   | handle  | 1164014641  | `abilityreallevelfield: 000001B6D9FFD5F0` |         |
| ABILITY\_RLF\_EAT\_DELAY                                          | (a)   | handle  | 1164014642  | `abilityreallevelfield: 000001B6D9FFD630` |         |
| ABILITY\_RLF\_HIT\_POINTS\_GAINED\_EAT3                           | (a)   | handle  | 1164014643  | `abilityreallevelfield: 000001B6D9FFD670` |         |
| ABILITY\_RLF\_AIR\_UNIT\_LOWER\_DURATION                          | (a)   | handle  | 1164866353  | `abilityreallevelfield: 000001B6D9FFD6B0` |         |
| ABILITY\_RLF\_AIR\_UNIT\_HEIGHT                                   | (a)   | handle  | 1164866354  | `abilityreallevelfield: 000001B6D9FFD6F0` |         |
| ABILITY\_RLF\_MELEE\_ATTACK\_RANGE                                | (a)   | handle  | 1164866355  | `abilityreallevelfield: 000001B6D9FFD730` |         |
| ABILITY\_RLF\_INTERVAL\_DURATION\_EGM2                            | (a)   | handle  | 1164406066  | `abilityreallevelfield: 000001B6D9FFD770` |         |
| ABILITY\_RLF\_EFFECT\_DELAY\_FLA2                                 | (a)   | handle  | 1181507890  | `abilityreallevelfield: 000001B6D9FFD7B0` |         |
| ABILITY\_RLF\_MINING\_DURATION                                    | (a)   | handle  | 1198285874  | `abilityreallevelfield: 000001B6D9FFD7F0` |         |
| ABILITY\_RLF\_RADIUS\_OF\_GRAVESTONES                             | (a)   | handle  | 1199137842  | `abilityreallevelfield: 000001B6D9FFD830` |         |
| ABILITY\_RLF\_RADIUS\_OF\_CORPSES                                 | (a)   | handle  | 1199137843  | `abilityreallevelfield: 000001B6D9FFD870` |         |
| ABILITY\_RLF\_HIT\_POINTS\_GAINED\_HEA1                           | (a)   | handle  | 1214603569  | `abilityreallevelfield: 000001B6D9D47EE0` |         |
| ABILITY\_RLF\_DAMAGE\_INCREASE\_PERCENT\_INF1                     | (a)   | handle  | 1231971889  | `abilityreallevelfield: 000001B6D9D47F20` |         |
| ABILITY\_RLF\_AUTOCAST\_RANGE                                     | (a)   | handle  | 1231971891  | `abilityreallevelfield: 000001B6D9D47F60` |         |
| ABILITY\_RLF\_LIFE\_REGEN\_RATE                                   | (a)   | handle  | 1231971892  | `abilityreallevelfield: 000001B6D9D47FA0` |         |
| ABILITY\_RLF\_GRAPHIC\_DELAY\_LIT1                                | (a)   | handle  | 1281979441  | `abilityreallevelfield: 000001B6D9D47FE0` |         |
| ABILITY\_RLF\_GRAPHIC\_DURATION\_LIT2                             | (a)   | handle  | 1281979442  | `abilityreallevelfield: 000001B6D9D48020` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_LSH1                           | (a)   | handle  | 1282631729  | `abilityreallevelfield: 000001B6D9D48060` |         |
| ABILITY\_RLF\_MANA\_GAINED                                        | (a)   | handle  | 1298297905  | `abilityreallevelfield: 000001B6D9D480A0` |         |
| ABILITY\_RLF\_HIT\_POINTS\_GAINED\_MBT2                           | (a)   | handle  | 1298297906  | `abilityreallevelfield: 000001B6D9D480E0` |         |
| ABILITY\_RLF\_AUTOCAST\_REQUIREMENT                               | (a)   | handle  | 1298297907  | `abilityreallevelfield: 000001B6D9D48120` |         |
| ABILITY\_RLF\_WATER\_HEIGHT                                       | (a)   | handle  | 1298297908  | `abilityreallevelfield: 000001B6D9D48160` |         |
| ABILITY\_RLF\_ACTIVATION\_DELAY\_MIN1                             | (a)   | handle  | 1298755121  | `abilityreallevelfield: 000001B6D9D481A0` |         |
| ABILITY\_RLF\_INVISIBILITY\_TRANSITION\_TIME                      | (a)   | handle  | 1298755122  | `abilityreallevelfield: 000001B6D9D481E0` |         |
| ABILITY\_RLF\_ACTIVATION\_RADIUS                                  | (a)   | handle  | 1315271985  | `abilityreallevelfield: 000001B6D9D48220` |         |
| ABILITY\_RLF\_AMOUNT\_REGENERATED                                 | (a)   | handle  | 1098018097  | `abilityreallevelfield: 000001B6D9D48260` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_POI1                           | (a)   | handle  | 1349478705  | `abilityreallevelfield: 000001B6D9D482A0` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_FACTOR\_POI2                         | (a)   | handle  | 1349478706  | `abilityreallevelfield: 000001B6D9D482E0` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_FACTOR\_POI3                       | (a)   | handle  | 1349478707  | `abilityreallevelfield: 000001B6D9DEB480` |         |
| ABILITY\_RLF\_EXTRA\_DAMAGE\_POA1                                 | (a)   | handle  | 1349476657  | `abilityreallevelfield: 000001B6D9DEB4C0` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_POA2                           | (a)   | handle  | 1349476658  | `abilityreallevelfield: 000001B6D9DEB500` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_FACTOR\_POA3                         | (a)   | handle  | 1349476659  | `abilityreallevelfield: 000001B6D9DEB540` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_FACTOR\_POA4                       | (a)   | handle  | 1349476660  | `abilityreallevelfield: 000001B6D9DEB580` |         |
| ABILITY\_RLF\_DAMAGE\_AMPLIFICATION                               | (a)   | handle  | 1349481266  | `abilityreallevelfield: 000001B6D9DEB5C0` |         |
| ABILITY\_RLF\_CHANCE\_TO\_STOMP\_PERCENT                          | (a)   | handle  | 1466004017  | `abilityreallevelfield: 000001B6D9DEB600` |         |
| ABILITY\_RLF\_DAMAGE\_DEALT\_WAR2                                 | (a)   | handle  | 1466004018  | `abilityreallevelfield: 000001B6D9DEB640` |         |
| ABILITY\_RLF\_FULL\_DAMAGE\_RADIUS\_WAR3                          | (a)   | handle  | 1466004019  | `abilityreallevelfield: 000001B6D9DEB680` |         |
| ABILITY\_RLF\_HALF\_DAMAGE\_RADIUS\_WAR4                          | (a)   | handle  | 1466004020  | `abilityreallevelfield: 000001B6D9DEB6C0` |         |
| ABILITY\_RLF\_SUMMONED\_UNIT\_DAMAGE\_PRG3                        | (a)   | handle  | 1349674803  | `abilityreallevelfield: 000001B6D9DEB700` |         |
| ABILITY\_RLF\_UNIT\_PAUSE\_DURATION                               | (a)   | handle  | 1349674804  | `abilityreallevelfield: 000001B6D9DEB740` |         |
| ABILITY\_RLF\_HERO\_PAUSE\_DURATION                               | (a)   | handle  | 1349674805  | `abilityreallevelfield: 000001B6D9DEB780` |         |
| ABILITY\_RLF\_HIT\_POINTS\_GAINED\_REJ1                           | (a)   | handle  | 1382378033  | `abilityreallevelfield: 000001B6D9DEB7C0` |         |
| ABILITY\_RLF\_MANA\_POINTS\_GAINED\_REJ2                          | (a)   | handle  | 1382378034  | `abilityreallevelfield: 000001B6D9DEB800` |         |
| ABILITY\_RLF\_MINIMUM\_LIFE\_REQUIRED                             | (a)   | handle  | 1383096883  | `abilityreallevelfield: 000001B6D9DEB840` |         |
| ABILITY\_RLF\_MINIMUM\_MANA\_REQUIRED                             | (a)   | handle  | 1383096884  | `abilityreallevelfield: 000001B6D9DEB880` |         |
| ABILITY\_RLF\_REPAIR\_COST\_RATIO                                 | (a)   | handle  | 1382379569  | `abilityreallevelfield: 000001B6DB904080` |         |
| ABILITY\_RLF\_REPAIR\_TIME\_RATIO                                 | (a)   | handle  | 1382379570  | `abilityreallevelfield: 000001B6DB9040C0` |         |
| ABILITY\_RLF\_POWERBUILD\_COST                                    | (a)   | handle  | 1382379571  | `abilityreallevelfield: 000001B6DB904100` |         |
| ABILITY\_RLF\_POWERBUILD\_RATE                                    | (a)   | handle  | 1382379572  | `abilityreallevelfield: 000001B6DB904140` |         |
| ABILITY\_RLF\_NAVAL\_RANGE\_BONUS                                 | (a)   | handle  | 1382379573  | `abilityreallevelfield: 000001B6DB904180` |         |
| ABILITY\_RLF\_DAMAGE\_INCREASE\_PERCENT\_ROA1                     | (a)   | handle  | 1383031089  | `abilityreallevelfield: 000001B6DB9041C0` |         |
| ABILITY\_RLF\_LIFE\_REGENERATION\_RATE                            | (a)   | handle  | 1383031091  | `abilityreallevelfield: 000001B6DB904200` |         |
| ABILITY\_RLF\_MANA\_REGEN                                         | (a)   | handle  | 1383031092  | `abilityreallevelfield: 000001B6DB904240` |         |
| ABILITY\_RLF\_DAMAGE\_INCREASE                                    | (a)   | handle  | 1315074609  | `abilityreallevelfield: 000001B6DB904280` |         |
| ABILITY\_RLF\_SALVAGE\_COST\_RATIO                                | (a)   | handle  | 1398893617  | `abilityreallevelfield: 000001B6DB9042C0` |         |
| ABILITY\_RLF\_IN\_FLIGHT\_SIGHT\_RADIUS                           | (a)   | handle  | 1165192753  | `abilityreallevelfield: 000001B6DB904300` |         |
| ABILITY\_RLF\_HOVERING\_SIGHT\_RADIUS                             | (a)   | handle  | 1165192754  | `abilityreallevelfield: 000001B6DB904340` |         |
| ABILITY\_RLF\_HOVERING\_HEIGHT                                    | (a)   | handle  | 1165192755  | `abilityreallevelfield: 000001B6DB904380` |         |
| ABILITY\_RLF\_DURATION\_OF\_OWLS                                  | (a)   | handle  | 1165192757  | `abilityreallevelfield: 000001B6DB9043C0` |         |
| ABILITY\_RLF\_FADE\_DURATION                                      | (a)   | handle  | 1399352625  | `abilityreallevelfield: 000001B6DB904400` |         |
| ABILITY\_RLF\_DAY\_NIGHT\_DURATION                                | (a)   | handle  | 1399352626  | `abilityreallevelfield: 000001B6DB904440` |         |
| ABILITY\_RLF\_ACTION\_DURATION                                    | (a)   | handle  | 1399352627  | `abilityreallevelfield: 000001B6DB904480` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_FACTOR\_SLO1                       | (a)   | handle  | 1399615281  | `abilityreallevelfield: 000001B6D9D08F40` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_FACTOR\_SLO2                         | (a)   | handle  | 1399615282  | `abilityreallevelfield: 000001B6D9D08F80` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_SPO1                           | (a)   | handle  | 1399877425  | `abilityreallevelfield: 000001B6D9D08FC0` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_FACTOR\_SPO2                       | (a)   | handle  | 1399877426  | `abilityreallevelfield: 000001B6D9D09000` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_FACTOR\_SPO3                         | (a)   | handle  | 1399877427  | `abilityreallevelfield: 000001B6D9D09040` |         |
| ABILITY\_RLF\_ACTIVATION\_DELAY\_STA1                             | (a)   | handle  | 1400135985  | `abilityreallevelfield: 000001B6D9D09080` |         |
| ABILITY\_RLF\_DETECTION\_RADIUS\_STA2                             | (a)   | handle  | 1400135986  | `abilityreallevelfield: 000001B6D9D090C0` |         |
| ABILITY\_RLF\_DETONATION\_RADIUS                                  | (a)   | handle  | 1400135987  | `abilityreallevelfield: 000001B6D9D09100` |         |
| ABILITY\_RLF\_STUN\_DURATION\_STA4                                | (a)   | handle  | 1400135988  | `abilityreallevelfield: 000001B6D9D09140` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_BONUS\_PERCENT                       | (a)   | handle  | 1432905265  | `abilityreallevelfield: 000001B6D9D09180` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_UHF2                           | (a)   | handle  | 1432905266  | `abilityreallevelfield: 000001B6D9D091C0` |         |
| ABILITY\_RLF\_LUMBER\_PER\_INTERVAL                               | (a)   | handle  | 1466458417  | `abilityreallevelfield: 000001B6D9D09200` |         |
| ABILITY\_RLF\_ART\_ATTACHMENT\_HEIGHT                             | (a)   | handle  | 1466458419  | `abilityreallevelfield: 000001B6D9D09240` |         |
| ABILITY\_RLF\_TELEPORT\_AREA\_WIDTH                               | (a)   | handle  | 1467117617  | `abilityreallevelfield: 000001B6D9D09280` |         |
| ABILITY\_RLF\_TELEPORT\_AREA\_HEIGHT                              | (a)   | handle  | 1467117618  | `abilityreallevelfield: 000001B6D9D092C0` |         |
| ABILITY\_RLF\_LIFE\_STOLEN\_PER\_ATTACK                           | (a)   | handle  | 1232494957  | `abilityreallevelfield: 000001B6D9D09300` |         |
| ABILITY\_RLF\_DAMAGE\_BONUS\_IDAM                                 | (a)   | handle  | 1231315309  | `abilityreallevelfield: 000001B6D9D09340` |         |
| ABILITY\_RLF\_CHANCE\_TO\_HIT\_UNITS\_PERCENT                     | (a)   | handle  | 1232036402  | `abilityreallevelfield: 000001B6D9D04050` |         |
| ABILITY\_RLF\_CHANCE\_TO\_HIT\_HEROS\_PERCENT                     | (a)   | handle  | 1232036403  | `abilityreallevelfield: 000001B6D9D04090` |         |
| ABILITY\_RLF\_CHANCE\_TO\_HIT\_SUMMONS\_PERCENT                   | (a)   | handle  | 1232036404  | `abilityreallevelfield: 000001B6D9D040D0` |         |
| ABILITY\_RLF\_DELAY\_FOR\_TARGET\_EFFECT                          | (a)   | handle  | 1231316332  | `abilityreallevelfield: 000001B6D9D04110` |         |
| ABILITY\_RLF\_DAMAGE\_DEALT\_PERCENT\_OF\_NORMAL                  | (a)   | handle  | 1231645796  | `abilityreallevelfield: 000001B6D9D04150` |         |
| ABILITY\_RLF\_DAMAGE\_RECEIVED\_MULTIPLIER                        | (a)   | handle  | 1231645815  | `abilityreallevelfield: 000001B6D9D04190` |         |
| ABILITY\_RLF\_MANA\_REGENERATION\_BONUS\_AS\_FRACTION\_OF\_NORMAL | (a)   | handle  | 1231909488  | `abilityreallevelfield: 000001B6D9D041D0` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_INCREASE\_ISPI                     | (a)   | handle  | 1232302185  | `abilityreallevelfield: 000001B6D9D04210` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_IDPS                           | (a)   | handle  | 1231319155  | `abilityreallevelfield: 000001B6D9D04250` |         |
| ABILITY\_RLF\_ATTACK\_DAMAGE\_INCREASE\_CAC1                      | (a)   | handle  | 1130455857  | `abilityreallevelfield: 000001B6D9D04290` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_COR1                           | (a)   | handle  | 1131377201  | `abilityreallevelfield: 000001B6D9D042D0` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_INCREASE\_ISX1                       | (a)   | handle  | 1232304177  | `abilityreallevelfield: 000001B6D9D04310` |         |
| ABILITY\_RLF\_DAMAGE\_WRS1                                        | (a)   | handle  | 1467118385  | `abilityreallevelfield: 000001B6D9D04350` |         |
| ABILITY\_RLF\_TERRAIN\_DEFORMATION\_AMPLITUDE                     | (a)   | handle  | 1467118386  | `abilityreallevelfield: 000001B6D9D04390` |         |
| ABILITY\_RLF\_DAMAGE\_CTC1                                        | (a)   | handle  | 1131701041  | `abilityreallevelfield: 000001B6D9D043D0` |         |
| ABILITY\_RLF\_EXTRA\_DAMAGE\_TO\_TARGET                           | (a)   | handle  | 1131701042  | `abilityreallevelfield: 000001B6D9D04410` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_REDUCTION\_CTC3                    | (a)   | handle  | 1131701043  | `abilityreallevelfield: 000001B6D9D04450` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_REDUCTION\_CTC4                      | (a)   | handle  | 1131701044  | `abilityreallevelfield: 000001B6DF0CC8C0` |         |
| ABILITY\_RLF\_DAMAGE\_CTB1                                        | (a)   | handle  | 1131700785  | `abilityreallevelfield: 000001B6DF0CC900` |         |
| ABILITY\_RLF\_CASTING\_DELAY\_SECONDS                             | (a)   | handle  | 1432646450  | `abilityreallevelfield: 000001B6DF0CC940` |         |
| ABILITY\_RLF\_MANA\_LOSS\_PER\_UNIT\_DTN1                         | (a)   | handle  | 1148481073  | `abilityreallevelfield: 000001B6DF0CC980` |         |
| ABILITY\_RLF\_DAMAGE\_TO\_SUMMONED\_UNITS\_DTN2                   | (a)   | handle  | 1148481074  | `abilityreallevelfield: 000001B6DF0CC9C0` |         |
| ABILITY\_RLF\_TRANSITION\_TIME\_SECONDS                           | (a)   | handle  | 1232499505  | `abilityreallevelfield: 000001B6DF0CCA00` |         |
| ABILITY\_RLF\_MANA\_DRAINED\_PER\_SECOND\_NMR1                    | (a)   | handle  | 1315795505  | `abilityreallevelfield: 000001B6DF0CCA40` |         |
| ABILITY\_RLF\_CHANCE\_TO\_REDUCE\_DAMAGE\_PERCENT                 | (a)   | handle  | 1400073009  | `abilityreallevelfield: 000001B6DF0CCA80` |         |
| ABILITY\_RLF\_MINIMUM\_DAMAGE                                     | (a)   | handle  | 1400073010  | `abilityreallevelfield: 000001B6DF0CCAC0` |         |
| ABILITY\_RLF\_IGNORED\_DAMAGE                                     | (a)   | handle  | 1400073011  | `abilityreallevelfield: 000001B6DF0CCB00` |         |
| ABILITY\_RLF\_FULL\_DAMAGE\_DEALT                                 | (a)   | handle  | 1214673713  | `abilityreallevelfield: 000001B6DF0CCB40` |         |
| ABILITY\_RLF\_FULL\_DAMAGE\_INTERVAL                              | (a)   | handle  | 1214673714  | `abilityreallevelfield: 000001B6DF0CCB80` |         |
| ABILITY\_RLF\_HALF\_DAMAGE\_DEALT                                 | (a)   | handle  | 1214673715  | `abilityreallevelfield: 000001B6DF0CCBC0` |         |
| ABILITY\_RLF\_HALF\_DAMAGE\_INTERVAL                              | (a)   | handle  | 1214673716  | `abilityreallevelfield: 000001B6DF0CCC00` |         |
| ABILITY\_RLF\_BUILDING\_REDUCTION\_HFS5                           | (a)   | handle  | 1214673717  | `abilityreallevelfield: 000001B6DF0CCC40` |         |
| ABILITY\_RLF\_MAXIMUM\_DAMAGE\_HFS6                               | (a)   | handle  | 1214673718  | `abilityreallevelfield: 000001B6DF0CCC80` |         |
| ABILITY\_RLF\_MANA\_PER\_HIT\_POINT                               | (a)   | handle  | 1315795761  | `abilityreallevelfield: 000001B6DF0CCCC0` |         |
| ABILITY\_RLF\_DAMAGE\_ABSORBED\_PERCENT                           | (a)   | handle  | 1315795762  | `abilityreallevelfield: 000001B6D9FEE620` |         |
| ABILITY\_RLF\_WAVE\_DISTANCE                                      | (a)   | handle  | 1432972593  | `abilityreallevelfield: 000001B6D9FEE660` |         |
| ABILITY\_RLF\_WAVE\_TIME\_SECONDS                                 | (a)   | handle  | 1432972594  | `abilityreallevelfield: 000001B6D9FEE6A0` |         |
| ABILITY\_RLF\_DAMAGE\_DEALT\_UIM3                                 | (a)   | handle  | 1432972595  | `abilityreallevelfield: 000001B6D9FEE6E0` |         |
| ABILITY\_RLF\_AIR\_TIME\_SECONDS\_UIM4                            | (a)   | handle  | 1432972596  | `abilityreallevelfield: 000001B6D9FEE720` |         |
| ABILITY\_RLF\_UNIT\_RELEASE\_INTERVAL\_SECONDS                    | (a)   | handle  | 1433170738  | `abilityreallevelfield: 000001B6D9FEE760` |         |
| ABILITY\_RLF\_DAMAGE\_RETURN\_FACTOR                              | (a)   | handle  | 1433170740  | `abilityreallevelfield: 000001B6D9FEE7A0` |         |
| ABILITY\_RLF\_DAMAGE\_RETURN\_THRESHOLD                           | (a)   | handle  | 1433170741  | `abilityreallevelfield: 000001B6D9FEE7E0` |         |
| ABILITY\_RLF\_RETURNED\_DAMAGE\_FACTOR                            | (a)   | handle  | 1433695025  | `abilityreallevelfield: 000001B6D9FEE820` |         |
| ABILITY\_RLF\_RECEIVED\_DAMAGE\_FACTOR                            | (a)   | handle  | 1433695026  | `abilityreallevelfield: 000001B6D9FEE860` |         |
| ABILITY\_RLF\_DEFENSE\_BONUS\_UTS3                                | (a)   | handle  | 1433695027  | `abilityreallevelfield: 000001B6D9FEE8A0` |         |
| ABILITY\_RLF\_DAMAGE\_BONUS\_NBA1                                 | (a)   | handle  | 1315070257  | `abilityreallevelfield: 000001B6D9FEE8E0` |         |
| ABILITY\_RLF\_SUMMONED\_UNIT\_DURATION\_SECONDS\_NBA3             | (a)   | handle  | 1315070259  | `abilityreallevelfield: 000001B6D9FEE920` |         |
| ABILITY\_RLF\_MANA\_PER\_SUMMONED\_HITPOINT                       | (a)   | handle  | 1131243314  | `abilityreallevelfield: 000001B6D9FEE960` |         |
| ABILITY\_RLF\_CHARGE\_FOR\_CURRENT\_LIFE                          | (a)   | handle  | 1131243315  | `abilityreallevelfield: 000001B6D9FEE9A0` |         |
| ABILITY\_RLF\_HIT\_POINTS\_DRAINED                                | (a)   | handle  | 1315205681  | `abilityreallevelfield: 000001B6D9FEE9E0` |         |
| ABILITY\_RLF\_MANA\_POINTS\_DRAINED                               | (a)   | handle  | 1315205682  | `abilityreallevelfield: 000001B6D9FEEA20` |         |
| ABILITY\_RLF\_DRAIN\_INTERVAL\_SECONDS                            | (a)   | handle  | 1315205683  | `abilityreallevelfield: 000001B6DF0B71F0` |         |
| ABILITY\_RLF\_LIFE\_TRANSFERRED\_PER\_SECOND                      | (a)   | handle  | 1315205684  | `abilityreallevelfield: 000001B6DF0B7230` |         |
| ABILITY\_RLF\_MANA\_TRANSFERRED\_PER\_SECOND                      | (a)   | handle  | 1315205685  | `abilityreallevelfield: 000001B6DF0B7270` |         |
| ABILITY\_RLF\_BONUS\_LIFE\_FACTOR                                 | (a)   | handle  | 1315205686  | `abilityreallevelfield: 000001B6DF0B72B0` |         |
| ABILITY\_RLF\_BONUS\_LIFE\_DECAY                                  | (a)   | handle  | 1315205687  | `abilityreallevelfield: 000001B6DF0B72F0` |         |
| ABILITY\_RLF\_BONUS\_MANA\_FACTOR                                 | (a)   | handle  | 1315205688  | `abilityreallevelfield: 000001B6DF0B7330` |         |
| ABILITY\_RLF\_BONUS\_MANA\_DECAY                                  | (a)   | handle  | 1315205689  | `abilityreallevelfield: 000001B6DF0B7370` |         |
| ABILITY\_RLF\_CHANCE\_TO\_MISS\_PERCENT                           | (a)   | handle  | 1316186418  | `abilityreallevelfield: 000001B6DF0B73B0` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_MODIFIER                           | (a)   | handle  | 1316186419  | `abilityreallevelfield: 000001B6DF0B73F0` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_MODIFIER                             | (a)   | handle  | 1316186420  | `abilityreallevelfield: 000001B6DF0B7430` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_TDG1                           | (a)   | handle  | 1415866161  | `abilityreallevelfield: 000001B6D9FE2E40` |         |
| ABILITY\_RLF\_MEDIUM\_DAMAGE\_RADIUS\_TDG2                        | (a)   | handle  | 1415866162  | `abilityreallevelfield: 000001B6D9FE2E80` |         |
| ABILITY\_RLF\_MEDIUM\_DAMAGE\_PER\_SECOND                         | (a)   | handle  | 1415866163  | `abilityreallevelfield: 000001B6D9FE2EC0` |         |
| ABILITY\_RLF\_SMALL\_DAMAGE\_RADIUS\_TDG4                         | (a)   | handle  | 1415866164  | `abilityreallevelfield: 000001B6D9FE2F00` |         |
| ABILITY\_RLF\_SMALL\_DAMAGE\_PER\_SECOND                          | (a)   | handle  | 1415866165  | `abilityreallevelfield: 000001B6D9FE2F40` |         |
| ABILITY\_RLF\_AIR\_TIME\_SECONDS\_TSP1                            | (a)   | handle  | 1416851505  | `abilityreallevelfield: 000001B6D9FE2F80` |         |
| ABILITY\_RLF\_MINIMUM\_HIT\_INTERVAL\_SECONDS                     | (a)   | handle  | 1416851506  | `abilityreallevelfield: 000001B6D9FE2FC0` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_NBF5                           | (a)   | handle  | 1315071541  | `abilityreallevelfield: 000001B6D9FE3000` |         |
| ABILITY\_RLF\_MAXIMUM\_RANGE                                      | (a)   | handle  | 1164078129  | `abilityreallevelfield: 000001B6D9FE3040` |         |
| ABILITY\_RLF\_MINIMUM\_RANGE                                      | (a)   | handle  | 1164078130  | `abilityreallevelfield: 000001B6D9FE3080` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_TARGET\_EFK1                           | (a)   | handle  | 1164340017  | `abilityreallevelfield: 000001B6D9FE30C0` |         |
| ABILITY\_RLF\_MAXIMUM\_TOTAL\_DAMAGE                              | (a)   | handle  | 1164340018  | `abilityreallevelfield: 000001B6D9FE3100` |         |
| ABILITY\_RLF\_MAXIMUM\_SPEED\_ADJUSTMENT                          | (a)   | handle  | 1164340020  | `abilityreallevelfield: 000001B6D9FE3140` |         |
| ABILITY\_RLF\_DECAYING\_DAMAGE                                    | (a)   | handle  | 1165191217  | `abilityreallevelfield: 000001B6D9FE3180` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_FACTOR\_ESH2                       | (a)   | handle  | 1165191218  | `abilityreallevelfield: 000001B6D9FE31C0` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_FACTOR\_ESH3                         | (a)   | handle  | 1165191219  | `abilityreallevelfield: 000001B6D9FE3200` |         |
| ABILITY\_RLF\_DECAY\_POWER                                        | (a)   | handle  | 1165191220  | `abilityreallevelfield: 000001B6D9FE3240` |         |
| ABILITY\_RLF\_INITIAL\_DAMAGE\_ESH5                               | (a)   | handle  | 1165191221  | `abilityreallevelfield: 000001B6DB911F00` |         |
| ABILITY\_RLF\_MAXIMUM\_LIFE\_ABSORBED                             | (a)   | handle  | 1633841969  | `abilityreallevelfield: 000001B6DB911F40` |         |
| ABILITY\_RLF\_MAXIMUM\_MANA\_ABSORBED                             | (a)   | handle  | 1633841970  | `abilityreallevelfield: 000001B6DB911F80` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_INCREASE\_BSK1                     | (a)   | handle  | 1651731249  | `abilityreallevelfield: 000001B6DB911FC0` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_INCREASE\_BSK2                       | (a)   | handle  | 1651731250  | `abilityreallevelfield: 000001B6DB912000` |         |
| ABILITY\_RLF\_DAMAGE\_TAKEN\_INCREASE                             | (a)   | handle  | 1651731251  | `abilityreallevelfield: 000001B6DB912040` |         |
| ABILITY\_RLF\_LIFE\_PER\_UNIT                                     | (a)   | handle  | 1685482801  | `abilityreallevelfield: 000001B6DB912080` |         |
| ABILITY\_RLF\_MANA\_PER\_UNIT                                     | (a)   | handle  | 1685482802  | `abilityreallevelfield: 000001B6DB9120C0` |         |
| ABILITY\_RLF\_LIFE\_PER\_BUFF                                     | (a)   | handle  | 1685482803  | `abilityreallevelfield: 000001B6DB912100` |         |
| ABILITY\_RLF\_MANA\_PER\_BUFF                                     | (a)   | handle  | 1685482804  | `abilityreallevelfield: 000001B6DB912140` |         |
| ABILITY\_RLF\_SUMMONED\_UNIT\_DAMAGE\_DVM5                        | (a)   | handle  | 1685482805  | `abilityreallevelfield: 000001B6DB912180` |         |
| ABILITY\_RLF\_DAMAGE\_BONUS\_FAK1                                 | (a)   | handle  | 1717660465  | `abilityreallevelfield: 000001B6DB9121C0` |         |
| ABILITY\_RLF\_MEDIUM\_DAMAGE\_FACTOR\_FAK2                        | (a)   | handle  | 1717660466  | `abilityreallevelfield: 000001B6DB912200` |         |
| ABILITY\_RLF\_SMALL\_DAMAGE\_FACTOR\_FAK3                         | (a)   | handle  | 1717660467  | `abilityreallevelfield: 000001B6DB912240` |         |
| ABILITY\_RLF\_FULL\_DAMAGE\_RADIUS\_FAK4                          | (a)   | handle  | 1717660468  | `abilityreallevelfield: 000001B6DB912280` |         |
| ABILITY\_RLF\_HALF\_DAMAGE\_RADIUS\_FAK5                          | (a)   | handle  | 1717660469  | `abilityreallevelfield: 000001B6DB9122C0` |         |
| ABILITY\_RLF\_EXTRA\_DAMAGE\_PER\_SECOND                          | (a)   | handle  | 1818849585  | `abilityreallevelfield: 000001B6DB912300` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_REDUCTION\_LIQ2                    | (a)   | handle  | 1818849586  | `abilityreallevelfield: 000001B6D9FAC070` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_REDUCTION\_LIQ3                      | (a)   | handle  | 1818849587  | `abilityreallevelfield: 000001B6D9FAC0B0` |         |
| ABILITY\_RLF\_MAGIC\_DAMAGE\_FACTOR                               | (a)   | handle  | 1835625777  | `abilityreallevelfield: 000001B6D9FAC0F0` |         |
| ABILITY\_RLF\_UNIT\_DAMAGE\_PER\_MANA\_POINT                      | (a)   | handle  | 1835428913  | `abilityreallevelfield: 000001B6D9FAC130` |         |
| ABILITY\_RLF\_HERO\_DAMAGE\_PER\_MANA\_POINT                      | (a)   | handle  | 1835428914  | `abilityreallevelfield: 000001B6D9FAC170` |         |
| ABILITY\_RLF\_UNIT\_MAXIMUM\_DAMAGE                               | (a)   | handle  | 1835428915  | `abilityreallevelfield: 000001B6D9FAC1B0` |         |
| ABILITY\_RLF\_HERO\_MAXIMUM\_DAMAGE                               | (a)   | handle  | 1835428916  | `abilityreallevelfield: 000001B6D9FAC1F0` |         |
| ABILITY\_RLF\_DAMAGE\_COOLDOWN                                    | (a)   | handle  | 1835428917  | `abilityreallevelfield: 000001B6D9FAC230` |         |
| ABILITY\_RLF\_DISTRIBUTED\_DAMAGE\_FACTOR\_SPL1                   | (a)   | handle  | 1936747569  | `abilityreallevelfield: 000001B6D9FAC270` |         |
| ABILITY\_RLF\_LIFE\_REGENERATED                                   | (a)   | handle  | 1769106481  | `abilityreallevelfield: 000001B6D9FAC2B0` |         |
| ABILITY\_RLF\_MANA\_REGENERATED                                   | (a)   | handle  | 1769106482  | `abilityreallevelfield: 000001B6D9FAC2F0` |         |
| ABILITY\_RLF\_MANA\_LOSS\_PER\_UNIT\_IDC1                         | (a)   | handle  | 1768186673  | `abilityreallevelfield: 000001B6D9FAC330` |         |
| ABILITY\_RLF\_SUMMONED\_UNIT\_DAMAGE\_IDC2                        | (a)   | handle  | 1768186674  | `abilityreallevelfield: 000001B6D9FAC370` |         |
| ABILITY\_RLF\_ACTIVATION\_DELAY\_IMO2                             | (a)   | handle  | 1768779570  | `abilityreallevelfield: 000001B6D9FAC3B0` |         |
| ABILITY\_RLF\_LURE\_INTERVAL\_SECONDS                             | (a)   | handle  | 1768779571  | `abilityreallevelfield: 000001B6D9FAC3F0` |         |
| ABILITY\_RLF\_DAMAGE\_BONUS\_ISR1                                 | (a)   | handle  | 1769173553  | `abilityreallevelfield: 000001B6D9FAC430` |         |
| ABILITY\_RLF\_DAMAGE\_REDUCTION\_ISR2                             | (a)   | handle  | 1769173554  | `abilityreallevelfield: 000001B6D9FAC470` |         |
| ABILITY\_RLF\_DAMAGE\_BONUS\_IPV1                                 | (a)   | handle  | 1768977969  | `abilityreallevelfield: 000001B6D9FBFE10` |         |
| ABILITY\_RLF\_LIFE\_STEAL\_AMOUNT                                 | (a)   | handle  | 1768977970  | `abilityreallevelfield: 000001B6D9FBFE50` |         |
| ABILITY\_RLF\_LIFE\_RESTORED\_FACTOR                              | (a)   | handle  | 1634956337  | `abilityreallevelfield: 000001B6D9FBFE90` |         |
| ABILITY\_RLF\_MANA\_RESTORED\_FACTOR                              | (a)   | handle  | 1634956338  | `abilityreallevelfield: 000001B6D9FBFED0` |         |
| ABILITY\_RLF\_ATTACH\_DELAY                                       | (a)   | handle  | 1735549233  | `abilityreallevelfield: 000001B6D9FBFF10` |         |
| ABILITY\_RLF\_REMOVE\_DELAY                                       | (a)   | handle  | 1735549234  | `abilityreallevelfield: 000001B6D9FBFF50` |         |
| ABILITY\_RLF\_HERO\_REGENERATION\_DELAY                           | (a)   | handle  | 1316184370  | `abilityreallevelfield: 000001B6D9FBFF90` |         |
| ABILITY\_RLF\_UNIT\_REGENERATION\_DELAY                           | (a)   | handle  | 1316184371  | `abilityreallevelfield: 000001B6D9FBFFD0` |         |
| ABILITY\_RLF\_MAGIC\_DAMAGE\_REDUCTION\_NSA4                      | (a)   | handle  | 1316184372  | `abilityreallevelfield: 000001B6D9FC0010` |         |
| ABILITY\_RLF\_HIT\_POINTS\_PER\_SECOND\_NSA5                      | (a)   | handle  | 1316184373  | `abilityreallevelfield: 000001B6D9FC0050` |         |
| ABILITY\_RLF\_DAMAGE\_TO\_SUMMONED\_UNITS\_IXS1                   | (a)   | handle  | 1232630577  | `abilityreallevelfield: 000001B6D9FC0090` |         |
| ABILITY\_RLF\_MAGIC\_DAMAGE\_REDUCTION\_IXS2                      | (a)   | handle  | 1232630578  | `abilityreallevelfield: 000001B6D9FC00D0` |         |
| ABILITY\_RLF\_SUMMONED\_UNIT\_DURATION                            | (a)   | handle  | 1315987766  | `abilityreallevelfield: 000001B6D9FC0110` |         |
| ABILITY\_RLF\_SHIELD\_COOLDOWN\_TIME                              | (a)   | handle  | 1316185393  | `abilityreallevelfield: 000001B6D9FC0150` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_NDO1                           | (a)   | handle  | 1315204913  | `abilityreallevelfield: 000001B6D9FC0190` |         |
| ABILITY\_RLF\_SUMMONED\_UNIT\_DURATION\_SECONDS\_NDO3             | (a)   | handle  | 1315204915  | `abilityreallevelfield: 000001B6D9FC01D0` |         |
| ABILITY\_RLF\_MEDIUM\_DAMAGE\_RADIUS\_FLK1                        | (a)   | handle  | 1718381361  | `abilityreallevelfield: 000001B6D9FC0210` |         |
| ABILITY\_RLF\_SMALL\_DAMAGE\_RADIUS\_FLK2                         | (a)   | handle  | 1718381362  | `abilityreallevelfield: 000001B6D9FC50F0` |         |
| ABILITY\_RLF\_FULL\_DAMAGE\_AMOUNT\_FLK3                          | (a)   | handle  | 1718381363  | `abilityreallevelfield: 000001B6D9FC5130` |         |
| ABILITY\_RLF\_MEDIUM\_DAMAGE\_AMOUNT                              | (a)   | handle  | 1718381364  | `abilityreallevelfield: 000001B6D9FC5170` |         |
| ABILITY\_RLF\_SMALL\_DAMAGE\_AMOUNT                               | (a)   | handle  | 1718381365  | `abilityreallevelfield: 000001B6D9FC51B0` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_REDUCTION\_PERCENT\_HBN1           | (a)   | handle  | 1214410289  | `abilityreallevelfield: 000001B6D9FC51F0` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_REDUCTION\_PERCENT\_HBN2             | (a)   | handle  | 1214410290  | `abilityreallevelfield: 000001B6D9FC5230` |         |
| ABILITY\_RLF\_MAX\_MANA\_DRAINED\_UNITS                           | (a)   | handle  | 1717726001  | `abilityreallevelfield: 000001B6D9FC5270` |         |
| ABILITY\_RLF\_DAMAGE\_RATIO\_UNITS\_PERCENT                       | (a)   | handle  | 1717726002  | `abilityreallevelfield: 000001B6D9FC52B0` |         |
| ABILITY\_RLF\_MAX\_MANA\_DRAINED\_HEROS                           | (a)   | handle  | 1717726003  | `abilityreallevelfield: 000001B6D9FC52F0` |         |
| ABILITY\_RLF\_DAMAGE\_RATIO\_HEROS\_PERCENT                       | (a)   | handle  | 1717726004  | `abilityreallevelfield: 000001B6D9FC5330` |         |
| ABILITY\_RLF\_SUMMONED\_DAMAGE                                    | (a)   | handle  | 1717726005  | `abilityreallevelfield: 000001B6D9FC5370` |         |
| ABILITY\_RLF\_DISTRIBUTED\_DAMAGE\_FACTOR\_NCA1                   | (a)   | handle  | 1852006705  | `abilityreallevelfield: 000001B6D9FC53B0` |         |
| ABILITY\_RLF\_INITIAL\_DAMAGE\_PXF1                               | (a)   | handle  | 1886938673  | `abilityreallevelfield: 000001B6D9FC53F0` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_PXF2                           | (a)   | handle  | 1886938674  | `abilityreallevelfield: 000001B6D9FC5430` |         |
| ABILITY\_RLF\_DAMAGE\_PER\_SECOND\_MLS1                           | (a)   | handle  | 1835823921  | `abilityreallevelfield: 000001B6D9FC5470` |         |
| ABILITY\_RLF\_BEAST\_COLLISION\_RADIUS                            | (a)   | handle  | 1316189234  | `abilityreallevelfield: 000001B6D9FC54B0` |         |
| ABILITY\_RLF\_DAMAGE\_AMOUNT\_NST3                                | (a)   | handle  | 1316189235  | `abilityreallevelfield: 000001B6D9FC54F0` |         |
| ABILITY\_RLF\_DAMAGE\_RADIUS                                      | (a)   | handle  | 1316189236  | `abilityreallevelfield: 000001B6DC7F7B90` |         |
| ABILITY\_RLF\_DAMAGE\_DELAY                                       | (a)   | handle  | 1316189237  | `abilityreallevelfield: 000001B6DC7F7BD0` |         |
| ABILITY\_RLF\_FOLLOW\_THROUGH\_TIME                               | (a)   | handle  | 1315138609  | `abilityreallevelfield: 000001B6DC7F7C10` |         |
| ABILITY\_RLF\_ART\_DURATION                                       | (a)   | handle  | 1315138612  | `abilityreallevelfield: 000001B6DC7F7C50` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_REDUCTION\_PERCENT\_NAB1           | (a)   | handle  | 1315004977  | `abilityreallevelfield: 000001B6DC7F7C90` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_REDUCTION\_PERCENT\_NAB2             | (a)   | handle  | 1315004978  | `abilityreallevelfield: 000001B6DC7F7CD0` |         |
| ABILITY\_RLF\_PRIMARY\_DAMAGE                                     | (a)   | handle  | 1315004980  | `abilityreallevelfield: 000001B6DC7F7D10` |         |
| ABILITY\_RLF\_SECONDARY\_DAMAGE                                   | (a)   | handle  | 1315004981  | `abilityreallevelfield: 000001B6DC7F7D50` |         |
| ABILITY\_RLF\_DAMAGE\_INTERVAL\_NAB6                              | (a)   | handle  | 1315004982  | `abilityreallevelfield: 000001B6DC7F7D90` |         |
| ABILITY\_RLF\_GOLD\_COST\_FACTOR                                  | (a)   | handle  | 1316252977  | `abilityreallevelfield: 000001B6DC7F7DD0` |         |
| ABILITY\_RLF\_LUMBER\_COST\_FACTOR                                | (a)   | handle  | 1316252978  | `abilityreallevelfield: 000001B6DC7F7E10` |         |
| ABILITY\_RLF\_MOVE\_SPEED\_BONUS\_NEG1                            | (a)   | handle  | 1315268401  | `abilityreallevelfield: 000001B6DC7F7E50` |         |
| ABILITY\_RLF\_DAMAGE\_BONUS\_NEG2                                 | (a)   | handle  | 1315268402  | `abilityreallevelfield: 000001B6DC7F7E90` |         |
| ABILITY\_RLF\_DAMAGE\_AMOUNT\_NCS1                                | (a)   | handle  | 1315140401  | `abilityreallevelfield: 000001B6DC7F7ED0` |         |
| ABILITY\_RLF\_DAMAGE\_INTERVAL\_NCS2                              | (a)   | handle  | 1315140402  | `abilityreallevelfield: 000001B6DC7F7F10` |         |
| ABILITY\_RLF\_MAX\_DAMAGE\_NCS4                                   | (a)   | handle  | 1315140404  | `abilityreallevelfield: 000001B6DC7F7F50` |         |
| ABILITY\_RLF\_BUILDING\_DAMAGE\_FACTOR\_NCS5                      | (a)   | handle  | 1315140405  | `abilityreallevelfield: 000001B6DC7F7F90` |         |
| ABILITY\_RLF\_EFFECT\_DURATION                                    | (a)   | handle  | 1315140406  | `abilityreallevelfield: 000001B6DEEDF820` |         |
| ABILITY\_RLF\_SPAWN\_INTERVAL\_NSY1                               | (a)   | handle  | 1316190513  | `abilityreallevelfield: 000001B6DEEDF860` |         |
| ABILITY\_RLF\_SPAWN\_UNIT\_DURATION                               | (a)   | handle  | 1316190515  | `abilityreallevelfield: 000001B6DEEDF8A0` |         |
| ABILITY\_RLF\_SPAWN\_UNIT\_OFFSET                                 | (a)   | handle  | 1316190516  | `abilityreallevelfield: 000001B6DEEDF8E0` |         |
| ABILITY\_RLF\_LEASH\_RANGE\_NSY5                                  | (a)   | handle  | 1316190517  | `abilityreallevelfield: 000001B6DEEDF920` |         |
| ABILITY\_RLF\_SPAWN\_INTERVAL\_NFY1                               | (a)   | handle  | 1315338545  | `abilityreallevelfield: 000001B6DEEDF960` |         |
| ABILITY\_RLF\_LEASH\_RANGE\_NFY2                                  | (a)   | handle  | 1315338546  | `abilityreallevelfield: 000001B6DEEDF9A0` |         |
| ABILITY\_RLF\_CHANCE\_TO\_DEMOLISH                                | (a)   | handle  | 1315202353  | `abilityreallevelfield: 000001B6DEEDF9E0` |         |
| ABILITY\_RLF\_DAMAGE\_MULTIPLIER\_BUILDINGS                       | (a)   | handle  | 1315202354  | `abilityreallevelfield: 000001B6DEEDFA20` |         |
| ABILITY\_RLF\_DAMAGE\_MULTIPLIER\_UNITS                           | (a)   | handle  | 1315202355  | `abilityreallevelfield: 000001B6DEEDFA60` |         |
| ABILITY\_RLF\_DAMAGE\_MULTIPLIER\_HEROES                          | (a)   | handle  | 1315202356  | `abilityreallevelfield: 000001B6DEEDFAA0` |         |
| ABILITY\_RLF\_BONUS\_DAMAGE\_MULTIPLIER                           | (a)   | handle  | 1315529521  | `abilityreallevelfield: 000001B6DEEDFAE0` |         |
| ABILITY\_RLF\_DEATH\_DAMAGE\_FULL\_AMOUNT                         | (a)   | handle  | 1315529522  | `abilityreallevelfield: 000001B6DEEDFB20` |         |
| ABILITY\_RLF\_DEATH\_DAMAGE\_FULL\_AREA                           | (a)   | handle  | 1315529523  | `abilityreallevelfield: 000001B6DEEDFB60` |         |
| ABILITY\_RLF\_DEATH\_DAMAGE\_HALF\_AMOUNT                         | (a)   | handle  | 1315529524  | `abilityreallevelfield: 000001B6DEEDFBA0` |         |
| ABILITY\_RLF\_DEATH\_DAMAGE\_HALF\_AREA                           | (a)   | handle  | 1315529525  | `abilityreallevelfield: 000001B6DEEDFBE0` |         |
| ABILITY\_RLF\_DEATH\_DAMAGE\_DELAY                                | (a)   | handle  | 1315529526  | `abilityreallevelfield: 000001B6DEEDFC20` |         |
| ABILITY\_RLF\_DAMAGE\_AMOUNT\_NSO1                                | (a)   | handle  | 1316187953  | `abilityreallevelfield: 000001B6DC08BA60` |         |
| ABILITY\_RLF\_DAMAGE\_PERIOD                                      | (a)   | handle  | 1316187954  | `abilityreallevelfield: 000001B6DC08BAA0` |         |
| ABILITY\_RLF\_DAMAGE\_PENALTY                                     | (a)   | handle  | 1316187955  | `abilityreallevelfield: 000001B6DC08BAE0` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_REDUCTION\_PERCENT\_NSO4           | (a)   | handle  | 1316187956  | `abilityreallevelfield: 000001B6DC08BB20` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_REDUCTION\_PERCENT\_NSO5             | (a)   | handle  | 1316187957  | `abilityreallevelfield: 000001B6DC08BB60` |         |
| ABILITY\_RLF\_SPLIT\_DELAY                                        | (a)   | handle  | 1315728690  | `abilityreallevelfield: 000001B6DC08BBA0` |         |
| ABILITY\_RLF\_MAX\_HITPOINT\_FACTOR                               | (a)   | handle  | 1315728692  | `abilityreallevelfield: 000001B6DC08BBE0` |         |
| ABILITY\_RLF\_LIFE\_DURATION\_SPLIT\_BONUS                        | (a)   | handle  | 1315728693  | `abilityreallevelfield: 000001B6DC08BC20` |         |
| ABILITY\_RLF\_WAVE\_INTERVAL                                      | (a)   | handle  | 1316381491  | `abilityreallevelfield: 000001B6DC08BC60` |         |
| ABILITY\_RLF\_BUILDING\_DAMAGE\_FACTOR\_NVC4                      | (a)   | handle  | 1316381492  | `abilityreallevelfield: 000001B6DC08BCA0` |         |
| ABILITY\_RLF\_FULL\_DAMAGE\_AMOUNT\_NVC5                          | (a)   | handle  | 1316381493  | `abilityreallevelfield: 000001B6DC08BCE0` |         |
| ABILITY\_RLF\_HALF\_DAMAGE\_FACTOR                                | (a)   | handle  | 1316381494  | `abilityreallevelfield: 000001B6DC08BD20` |         |
| ABILITY\_RLF\_INTERVAL\_BETWEEN\_PULSES                           | (a)   | handle  | 1415673141  | `abilityreallevelfield: 000001B6DC08BD60` |         |
| ABILITY\_RLF\_ALLY\_HEALING\_PER\_SECOND                          | (a)   | handle  | 1751347761  | `abilityreallevelfield: 000001B6DC08BDA0` |         |
| ABILITY\_RLF\_ENEMY\_DAMAGE\_PER\_SECOND                          | (a)   | handle  | 1751347762  | `abilityreallevelfield: 000001B6DC08BDE0` |         |
| ABILITY\_RLF\_ENEMY\_HEALING\_REDUCTION\_PERCENT                  | (a)   | handle  | 1751347763  | `abilityreallevelfield: 000001B6DC08BE20` |         |
| ABILITY\_RLF\_ALLY\_HEALING\_BASE                                 | (a)   | handle  | 1751346225  | `abilityreallevelfield: 000001B6DC08BE60` |         |
| ABILITY\_RLF\_HEALING\_PER\_DEBUFF\_REMOVED                       | (a)   | handle  | 1751346226  | `abilityreallevelfield: 000001B6D044D990` |         |
| ABILITY\_RLF\_ALLY\_BUFF\_DURATION                                | (a)   | handle  | 1751346227  | `abilityreallevelfield: 000001B6D044D9D0` |         |
| ABILITY\_RLF\_ALLY\_DAMAGE\_BONUS\_PERCENT\_BASE                  | (a)   | handle  | 1751346228  | `abilityreallevelfield: 000001B6D044DA10` |         |
| ABILITY\_RLF\_ALLY\_DAMAGE\_BONUS\_PERCENT\_PER\_DEBUFF\_REMOVED  | (a)   | handle  | 1751346229  | `abilityreallevelfield: 000001B6D044DA50` |         |
| ABILITY\_RLF\_ENEMY\_STUN\_DURATION                               | (a)   | handle  | 1751346230  | `abilityreallevelfield: 000001B6D044DA90` |         |
| ABILITY\_RLF\_DAMAGE\_TO\_SUMMONS                                 | (a)   | handle  | 1751346231  | `abilityreallevelfield: 000001B6D044DAD0` |         |
| ABILITY\_RLF\_ALLY\_PERCENT\_MAGIC\_RESIST\_INCREASE              | (a)   | handle  | 1752391985  | `abilityreallevelfield: 000001B6D044DB10` |         |
| ABILITY\_RLF\_ALLY\_PERCENT\_HEALING\_INCREASE                    | (a)   | handle  | 1752391986  | `abilityreallevelfield: 000001B6D044DB50` |         |
| ABILITY\_RLF\_ALLY\_PERCENT\_COOLDOWN\_DECREASE                   | (a)   | handle  | 1752391987  | `abilityreallevelfield: 000001B6D044DB90` |         |
| ABILITY\_RLF\_ENEMY\_PERCENT\_MAGIC\_RESIST\_DECREASE             | (a)   | handle  | 1752391988  | `abilityreallevelfield: 000001B6D044DBD0` |         |
| ABILITY\_RLF\_ENEMY\_PERCENT\_HEALING\_DECREASE                   | (a)   | handle  | 1752391989  | `abilityreallevelfield: 000001B6D044DC10` |         |
| ABILITY\_RLF\_ENEMY\_PERCENT\_COOLDOWN\_INCREASE                  | (a)   | handle  | 1752391990  | `abilityreallevelfield: 000001B6D044DC50` |         |
| ABILITY\_RLF\_ALLY\_FLAT\_MANA\_REGEN                             | (a)   | handle  | 1752391991  | `abilityreallevelfield: 000001B6D044DC90` |         |
| ABILITY\_RLF\_DASH\_SPEED                                         | (a)   | handle  | 1667789361  | `abilityreallevelfield: 000001B6D044DCD0` |         |
| ABILITY\_RLF\_DASH\_DAMAGE                                        | (a)   | handle  | 1667789362  | `abilityreallevelfield: 000001B6D044DD10` |         |
| ABILITY\_RLF\_BONUS\_CRITICAL\_STRIKE                             | (a)   | handle  | 1667789363  | `abilityreallevelfield: 000001B6D044DD50` |         |
| ABILITY\_RLF\_NORMAL\_BONUS\_CRITICAL\_STRIKE\_DURATION           | (a)   | handle  | 1667789364  | `abilityreallevelfield: 000001B6D044DD90` |         |
| ABILITY\_RLF\_HERO\_BONUS\_CRITICAL\_STRIKE\_DURATION             | (a)   | handle  | 1667789365  | `abilityreallevelfield: 000001B6DC384520` |         |
| ABILITY\_RLF\_STUN\_DURATION\_ENS4                                | (a)   | handle  | 1164866356  | `abilityreallevelfield: 000001B6DC384560` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_REDUCTION\_PERCENT\_ENS5             | (a)   | handle  | 1164866357  | `abilityreallevelfield: 000001B6DC3845A0` |         |
| ABILITY\_RLF\_BONUS\_DAMAGE\_TAKEN\_PERCENT\_ENS6                 | (a)   | handle  | 1164866358  | `abilityreallevelfield: 000001B6DC3845E0` |         |
| ABILITY\_RLF\_DAMAGE\_SWP1                                        | (a)   | handle  | 1937207345  | `abilityreallevelfield: 000001B6DC384620` |         |
| ABILITY\_RLF\_ATTACK\_DISTANCE\_SWP2                              | (a)   | handle  | 1937207346  | `abilityreallevelfield: 000001B6DC384660` |         |
| ABILITY\_RLF\_ATTACK\_ANGLE\_SWP3                                 | (a)   | handle  | 1937207347  | `abilityreallevelfield: 000001B6DC3846A0` |         |
| ABILITY\_RLF\_DAMAGE\_DELAY\_SWP4                                 | (a)   | handle  | 1937207348  | `abilityreallevelfield: 000001B6DC3846E0` |         |
| ABILITY\_RLF\_DAMAGE\_HSL1                                        | (a)   | handle  | 1752394801  | `abilityreallevelfield: 000001B6DC384720` |         |
| ABILITY\_RLF\_BONUS\_DAMAGE\_PERCENT\_AGAINST\_DEBUFFED           | (a)   | handle  | 1752394802  | `abilityreallevelfield: 000001B6DC384760` |         |
| ABILITY\_RLF\_HEAL\_PERCENT\_ON\_DAMAGE\_DEALT                    | (a)   | handle  | 1752394804  | `abilityreallevelfield: 000001B6DC3847A0` |         |
| ABILITY\_RLF\_TARGET\_INTERSECT\_RADIUS                           | (a)   | handle  | 1667789409  | `abilityreallevelfield: 000001B6DC3847E0` |         |
| ABILITY\_RLF\_BURN\_DAMAGE                                        | (a)   | handle  | 1752393265  | `abilityreallevelfield: 000001B6DC384820` |         |
| ABILITY\_RLF\_BURN\_DAMAGE\_PULSE\_FREQUENCY                      | (a)   | handle  | 1752393266  | `abilityreallevelfield: 000001B6DC384860` |         |
| ABILITY\_RLF\_BONUS\_DAMAGE\_TO\_SUMMONS                          | (a)   | handle  | 1752393267  | `abilityreallevelfield: 000001B6DC3848A0` |         |
| ABILITY\_RLF\_HEAL\_AMOUNT\_TO\_ALLY\_UNITS                       | (a)   | handle  | 1752393268  | `abilityreallevelfield: 000001B6DC3848E0` |         |
| ABILITY\_RLF\_DEFENSE\_HIC1                                       | (a)   | handle  | 1751737137  | `abilityreallevelfield: 000001B6DC384920` |         |
| ABILITY\_RLF\_SPELL\_DAMAGE\_RESISTANCE                           | (a)   | handle  | 1751737138  | `abilityreallevelfield: 000001B6DC7B2790` |         |
| ABILITY\_RLF\_HEALING\_HIC4                                       | (a)   | handle  | 1751737140  | `abilityreallevelfield: 000001B6DC7B27D0` |         |
| ABILITY\_RLF\_EXPLOSION\_DAMAGE                                   | (a)   | handle  | 1751999282  | `abilityreallevelfield: 000001B6DC7B2810` |         |
| ABILITY\_RLF\_HEALING\_PER\_TARGET\_HIT                           | (a)   | handle  | 1937207350  | `abilityreallevelfield: 000001B6DC7B2850` |         |
| ABILITY\_RLF\_ARMOR\_REDUCTION\_SWP8                              | (a)   | handle  | 1937207352  | `abilityreallevelfield: 000001B6DC7B2890` |         |
| ABILITY\_RLF\_DAMAGE\_PERCENT\_OF\_TARGET\_MAX\_HEALTH            | (a)   | handle  | 1937207393  | `abilityreallevelfield: 000001B6DC7B28D0` |         |
| ABILITY\_RLF\_COOLDOWN\_REDUCTION\_ON\_HIT                        | (a)   | handle  | 1937207394  | `abilityreallevelfield: 000001B6DC7B2910` |         |
| ABILITY\_RLF\_DAMAGE\_BONUS\_HHR1                                 | (a)   | handle  | 1751675441  | `abilityreallevelfield: 000001B6DC7B2950` |         |
| ABILITY\_RLF\_STUN\_DURATION\_NORMAL                              | (a)   | handle  | 1751675442  | `abilityreallevelfield: 000001B6DC7B2990` |         |
| ABILITY\_RLF\_STUN\_DURATION\_HERO                                | (a)   | handle  | 1751675443  | `abilityreallevelfield: 000001B6DC7B29D0` |         |
| ABILITY\_RLF\_BONUS\_DAMAGE\_DEBUFF\_DURATION\_NORMAL             | (a)   | handle  | 1751675444  | `abilityreallevelfield: 000001B6DC7B2A10` |         |
| ABILITY\_RLF\_BONUS\_DAMAGE\_DEBUFF\_DURATION\_HERO               | (a)   | handle  | 1751675445  | `abilityreallevelfield: 000001B6DC7B2A50` |         |
| ABILITY\_RLF\_DEBUFF\_BONUS\_DAMAGE\_RECEIVED\_PERCENT            | (a)   | handle  | 1751675446  | `abilityreallevelfield: 000001B6DC7B2A90` |         |
| ABILITY\_RLF\_DEFENSE\_INCREASE                                   | (a)   | handle  | 1751609905  | `abilityreallevelfield: 000001B6DC7B2AD0` |         |
| ABILITY\_RLF\_DEFENSE\_CAP                                        | (a)   | handle  | 1751609906  | `abilityreallevelfield: 000001B6DC7B2B10` |         |
| ABILITY\_RLF\_MAGIC\_RESISTANCE\_AT\_CAP                          | (a)   | handle  | 1751609907  | `abilityreallevelfield: 000001B6DC7B2B50` |         |
| ABILITY\_RLF\_BONUS\_ATTACK\_DAMAGE\_PERCENT\_AT\_CAP             | (a)   | handle  | 1751609908  | `abilityreallevelfield: 000001B6DC7B2B90` |         |
| ABILITY\_RLF\_ARMOR\_REDUCTION\_DURATION\_NORMAL                  | (a)   | handle  | 1937207395  | `abilityreallevelfield: 000001B6DB988B40` |         |
| ABILITY\_RLF\_ARMOR\_REDUCTION\_DURATION\_HERO                    | (a)   | handle  | 1937207396  | `abilityreallevelfield: 000001B6DB988B80` |         |
| ABILITY\_RLF\_ALLY\_INSTANT\_HEAL                                 | (a)   | handle  | 1936682033  | `abilityreallevelfield: 000001B6DB988BC0` |         |
| ABILITY\_RLF\_ALLY\_HEAL\_PER\_SECOND                             | (a)   | handle  | 1936682034  | `abilityreallevelfield: 000001B6DB988C00` |         |
| ABILITY\_RLF\_ALLY\_MANA\_RESTORE                                 | (a)   | handle  | 1936682035  | `abilityreallevelfield: 000001B6DB988C40` |         |
| ABILITY\_RLF\_ALLY\_PASSIVE\_COOLDOWN                             | (a)   | handle  | 1936682036  | `abilityreallevelfield: 000001B6DB988C80` |         |
| ABILITY\_RLF\_ALLY\_PASSIVE\_DURATION                             | (a)   | handle  | 1936682037  | `abilityreallevelfield: 000001B6DB988CC0` |         |
| ABILITY\_RLF\_PASSIVE\_RADIUS                                     | (a)   | handle  | 1936487012  | `abilityreallevelfield: 000001B6DB988D00` |         |
| ABILITY\_RLF\_MIND\_CONTROL\_DURATION\_NORMAL                     | (a)   | handle  | 1835230322  | `abilityreallevelfield: 000001B6DB988D40` |         |
| ABILITY\_RLF\_EXPLOSION\_RADIUS\_MCRD                             | (a)   | handle  | 1835233892  | `abilityreallevelfield: 000001B6DB988D80` |         |
| ABILITY\_RLF\_EXPLOSION\_RADIUS\_SFRD                             | (a)   | handle  | 1936093796  | `abilityreallevelfield: 000001B6DB988DC0` |         |
| ABILITY\_RLF\_DAMAGE\_REDUCTION\_PERCENT\_BLD1                    | (a)   | handle  | 1651270705  | `abilityreallevelfield: 000001B6DB988E00` |         |
| ABILITY\_RLF\_MOVEMENT\_SPEED\_REDUCTION\_PERCENT\_BLD2           | (a)   | handle  | 1651270706  | `abilityreallevelfield: 000001B6DB988E40` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_INCREASE\_PERCENT\_BLD3              | (a)   | handle  | 1651270707  | `abilityreallevelfield: 000001B6DB988E80` |         |
| ABILITY\_RLF\_ON\_DAMAGE\_TAKEN\_BONUS\_DURATION                  | (a)   | handle  | 1651270708  | `abilityreallevelfield: 000001B6DB988EC0` |         |
| ABILITY\_RLF\_SWEEP\_COOLDOWN\_REDUCTION\_ON\_HIT                 | (a)   | handle  | 1651270709  | `abilityreallevelfield: 000001B6DB988F00` |         |
| ABILITY\_RLF\_DAMAGE\_REFLECTION\_PERCENT                         | (a)   | handle  | 1651270710  | `abilityreallevelfield: 000001B6DB988F40` |         |
| ABILITY\_RLF\_FLAT\_DAMAGE\_REFLECTION                            | (a)   | handle  | 1651270711  | `abilityreallevelfield: 000001B6D9FE9760` |         |
| ABILITY\_RLF\_ABILITY\_SPEED\_INCREASE\_PERCENT                   | (a)   | handle  | 1651270712  | `abilityreallevelfield: 000001B6D9FE97A0` |         |
| ABILITY\_RLF\_SHIELD\_HEALTH                                      | (a)   | handle  | 1751671601  | `abilityreallevelfield: 000001B6D9FE97E0` |         |
| ABILITY\_RLF\_SHIELD\_REFLECT\_PERCENT                            | (a)   | handle  | 1751671602  | `abilityreallevelfield: 000001B6D9FE9820` |         |
| ABILITY\_RLF\_SHIELD\_DURATION                                    | (a)   | handle  | 1751671603  | `abilityreallevelfield: 000001B6D9FE9860` |         |
| ABILITY\_RLF\_TAUNTED\_DEFENSE\_REDUCTION                         | (a)   | handle  | 1751671604  | `abilityreallevelfield: 000001B6D9FE98A0` |         |
| ABILITY\_RLF\_BONUS\_ATTACK\_SPEED\_PERCENT\_HGH1                 | (a)   | handle  | 1751607345  | `abilityreallevelfield: 000001B6D9FE98E0` |         |
| ABILITY\_RLF\_BONUS\_MOVE\_SPEED\_PERCENT\_HGH2                   | (a)   | handle  | 1751607346  | `abilityreallevelfield: 000001B6D9FE9920` |         |
| ABILITY\_RLF\_BONUS\_CRITICAL\_HIT\_PERCENT                       | (a)   | handle  | 1751607347  | `abilityreallevelfield: 000001B6D9FE9960` |         |
| ABILITY\_RLF\_BONUS\_CRITICAL\_DAMAGE\_PERCENT                    | (a)   | handle  | 1751607348  | `abilityreallevelfield: 000001B6D9FE99A0` |         |
| ABILITY\_RLF\_MANA\_PER\_SECOND\_HGH6                             | (a)   | handle  | 1751607350  | `abilityreallevelfield: 000001B6D9FE99E0` |         |
| ABILITY\_RLF\_BONUS\_COOLDOWN\_REDUCTION\_PERCENT                 | (a)   | handle  | 1751607351  | `abilityreallevelfield: 000001B6D9FE9A20` |         |
| ABILITY\_RLF\_BONUS\_DAMAGE\_UBR1                                 | (a)   | handle  | 1969386033  | `abilityreallevelfield: 000001B6D9FE9A60` |         |
| ABILITY\_RLF\_BONUS\_DAMAGE\_DURATION\_UBR2                       | (a)   | handle  | 1969386034  | `abilityreallevelfield: 000001B6D9FE9AA0` |         |
| ABILITY\_RLF\_CHARGE\_REGEN\_TIME\_UBR4                           | (a)   | handle  | 1969386036  | `abilityreallevelfield: 000001B6D9FE9AE0` |         |
| ABILITY\_RLF\_ALLY\_MANA\_PER\_SECOND                             | (a)   | handle  | 1970037041  | `abilityreallevelfield: 000001B6D9FE9B20` |         |
| ABILITY\_RLF\_ALLY\_HEALING\_PER\_SECOND\_ULA2                    | (a)   | handle  | 1970037042  | `abilityreallevelfield: 000001B6D9FE9B60` |         |
| ABILITY\_RLF\_ALLY\_SPELL\_RESIST\_PERCENT                        | (a)   | handle  | 1970037043  | `abilityreallevelfield: 000001B6D9FECC30` |         |
| ABILITY\_RLF\_ALLY\_SPELL\_AMP\_PERCENT                           | (a)   | handle  | 1970037044  | `abilityreallevelfield: 000001B6D9FECC70` |         |
| ABILITY\_RLF\_ALLY\_SPELL\_CRIT\_HIT\_PERCENT                     | (a)   | handle  | 1970037045  | `abilityreallevelfield: 000001B6D9FECCB0` |         |
| ABILITY\_RLF\_ALLY\_MOVEMENT\_SPEED\_PERCENT                      | (a)   | handle  | 1970037046  | `abilityreallevelfield: 000001B6D9FECCF0` |         |
| ABILITY\_RLF\_ENEMY\_MANA\_PER\_SECOND                            | (a)   | handle  | 1970037047  | `abilityreallevelfield: 000001B6D9FECD30` |         |
| ABILITY\_RLF\_ENEMY\_DAMAGE\_PER\_SECOND\_ULA8                    | (a)   | handle  | 1970037048  | `abilityreallevelfield: 000001B6D9FECD70` |         |
| ABILITY\_RLF\_FLAT\_MANA\_GAIN                                    | (a)   | handle  | 1651405622  | `abilityreallevelfield: 000001B6D9FECDB0` |         |
| ABILITY\_RLF\_HEALING\_RADIUS                                     | (a)   | handle  | 1651405623  | `abilityreallevelfield: 000001B6D9FECDF0` |         |
| ABILITY\_RLF\_FLAT\_DAMAGE\_UDB1                                  | (a)   | handle  | 1969513009  | `abilityreallevelfield: 000001B6D9FECE30` |         |
| ABILITY\_RLF\_PERCENT\_DAMAGE\_UDB2                               | (a)   | handle  | 1969513010  | `abilityreallevelfield: 000001B6D9FECE70` |         |
| ABILITY\_RLF\_BONUS\_ATTACK\_SPEED\_PER\_ATTACK                   | (a)   | handle  | 1969513012  | `abilityreallevelfield: 000001B6D9FECEB0` |         |
| ABILITY\_RLF\_CHARGE\_REGEN\_TIME\_UWF2                           | (a)   | handle  | 1970759218  | `abilityreallevelfield: 000001B6D9FECEF0` |         |
| ABILITY\_RLF\_DAMAGE\_UWF3                                        | (a)   | handle  | 1970759219  | `abilityreallevelfield: 000001B6D9FECF30` |         |
| ABILITY\_RLF\_COOLDOWN\_REDUCTION\_ON\_AUTO\_ATTACK               | (a)   | handle  | 1970759221  | `abilityreallevelfield: 000001B6D9FECF70` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_REDUCTION\_DURATION\_NORMAL          | (a)   | handle  | 1937207397  | `abilityreallevelfield: 000001B6D9FECFB0` |         |
| ABILITY\_RLF\_ATTACK\_SPEED\_REDUCTION\_DURATION\_HERO            | (a)   | handle  | 1937207398  | `abilityreallevelfield: 000001B6D9FECFF0` |         |
| ABILITY\_RLF\_DAMAGE\_BY\_TARGET\_MAX\_HEALTH\_DURATION\_NORMAL   | (a)   | handle  | 1937207399  | `abilityreallevelfield: 000001B6D9FED030` |         |
| ABILITY\_RLF\_DAMAGE\_BY\_TARGET\_MAX\_HEALTH\_DURATION\_HERO     | (a)   | handle  | 1937207400  | `abilityreallevelfield: 000001B6D9FF00A0` |         |
| -1                                                                | (a)   | handle  | -1          | `abilityreallevelfield: 000001B7037821A0` |         |
| past the last constant                                            | (a)   | handle  | 1970759222  | `abilityreallevelfield: 000001B70378B280` |         |
| 2147483647                                                        | (a)   | handle  | 2147483647  | `abilityreallevelfield: 000001B703790DF0` |         |
| -2147483648                                                       | (a)   | handle  | -2147483648 | `abilityreallevelfield: 000001B703797540` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertAbilityBooleanLevelField`

| Case                                                    | Group | Outcome | Id          | Type                                         | Message |
| ------------------------------------------------------- | ----- | ------- | ----------- | -------------------------------------------- | ------- |
| ABILITY\_BLF\_PERCENT\_BONUS\_HAB2                      | (a)   | handle  | 1214341682  | `abilitybooleanlevelfield: 000001B6D9FF00E0` |         |
| ABILITY\_BLF\_USE\_TELEPORT\_CLUSTERING\_HMT3           | (a)   | handle  | 1215132723  | `abilitybooleanlevelfield: 000001B6D9FF0120` |         |
| ABILITY\_BLF\_NEVER\_MISS\_OCR5                         | (a)   | handle  | 1331917365  | `abilitybooleanlevelfield: 000001B6D9FF01B0` |         |
| ABILITY\_BLF\_EXCLUDE\_ITEM\_DAMAGE                     | (a)   | handle  | 1331917366  | `abilitybooleanlevelfield: 000001B6D9FF0280` |         |
| ABILITY\_BLF\_BACKSTAB\_DAMAGE                          | (a)   | handle  | 1333226292  | `abilitybooleanlevelfield: 000001B6D9FF02C0` |         |
| ABILITY\_BLF\_INHERIT\_UPGRADES\_UAN3                   | (a)   | handle  | 1432448563  | `abilitybooleanlevelfield: 000001B6D9FF0410` |         |
| ABILITY\_BLF\_MANA\_CONVERSION\_AS\_PERCENT             | (a)   | handle  | 1432645683  | `abilitybooleanlevelfield: 000001B6D9FF0450` |         |
| ABILITY\_BLF\_LIFE\_CONVERSION\_AS\_PERCENT             | (a)   | handle  | 1432645684  | `abilitybooleanlevelfield: 000001B6D9FF0490` |         |
| ABILITY\_BLF\_LEAVE\_TARGET\_ALIVE                      | (a)   | handle  | 1432645685  | `abilitybooleanlevelfield: 000001B6D9FF04D0` |         |
| ABILITY\_BLF\_PERCENT\_BONUS\_UAU3                      | (a)   | handle  | 1432450355  | `abilitybooleanlevelfield: 000001B6D9FF0160` |         |
| ABILITY\_BLF\_DAMAGE\_IS\_PERCENT\_RECEIVED             | (a)   | handle  | 1164011570  | `abilitybooleanlevelfield: 000001B6D9FF01F0` |         |
| ABILITY\_BLF\_MELEE\_BONUS                              | (a)   | handle  | 1164014130  | `abilitybooleanlevelfield: 000001B6D9FF0230` |         |
| ABILITY\_BLF\_RANGED\_BONUS                             | (a)   | handle  | 1164014131  | `abilitybooleanlevelfield: 000001B6D9FF0300` |         |
| ABILITY\_BLF\_FLAT\_BONUS                               | (a)   | handle  | 1164014132  | `abilitybooleanlevelfield: 000001B6D9FF0340` |         |
| ABILITY\_BLF\_NEVER\_MISS\_HBH5                         | (a)   | handle  | 1214408757  | `abilitybooleanlevelfield: 000001B6D9FF0380` |         |
| ABILITY\_BLF\_PERCENT\_BONUS\_HAD2                      | (a)   | handle  | 1214342194  | `abilitybooleanlevelfield: 000001B6D9FF03C0` |         |
| ABILITY\_BLF\_CAN\_DEACTIVATE                           | (a)   | handle  | 1214542641  | `abilitybooleanlevelfield: 000001B6D9ECF770` |         |
| ABILITY\_BLF\_RAISED\_UNITS\_ARE\_INVULNERABLE          | (a)   | handle  | 1215456562  | `abilitybooleanlevelfield: 000001B6D9ECF7B0` |         |
| ABILITY\_BLF\_PERCENTAGE\_OAR2                          | (a)   | handle  | 1331786290  | `abilitybooleanlevelfield: 000001B6D9ECF7F0` |         |
| ABILITY\_BLF\_SUMMON\_BUSY\_UNITS                       | (a)   | handle  | 1114926130  | `abilitybooleanlevelfield: 000001B6D9ECF830` |         |
| ABILITY\_BLF\_CREATES\_BLIGHT                           | (a)   | handle  | 1114401074  | `abilitybooleanlevelfield: 000001B6D9ECF870` |         |
| ABILITY\_BLF\_EXPLODES\_ON\_DEATH                       | (a)   | handle  | 1399092022  | `abilitybooleanlevelfield: 000001B6D9ECF8B0` |         |
| ABILITY\_BLF\_ALWAYS\_AUTOCAST\_FAE2                    | (a)   | handle  | 1180788018  | `abilitybooleanlevelfield: 000001B6D9ECF8F0` |         |
| ABILITY\_BLF\_REGENERATE\_ONLY\_AT\_NIGHT               | (a)   | handle  | 1298297909  | `abilitybooleanlevelfield: 000001B6D9ECF930` |         |
| ABILITY\_BLF\_SHOW\_SELECT\_UNIT\_BUTTON                | (a)   | handle  | 1315271987  | `abilitybooleanlevelfield: 000001B6D9ECF970` |         |
| ABILITY\_BLF\_SHOW\_UNIT\_INDICATOR                     | (a)   | handle  | 1315271988  | `abilitybooleanlevelfield: 000001B6DF0D7050` |         |
| ABILITY\_BLF\_CHARGE\_OWNING\_PLAYER                    | (a)   | handle  | 1097757494  | `abilitybooleanlevelfield: 000001B6DF0D7090` |         |
| ABILITY\_BLF\_PERCENTAGE\_ARM2                          | (a)   | handle  | 1098018098  | `abilitybooleanlevelfield: 000001B6DF0D70D0` |         |
| ABILITY\_BLF\_TARGET\_IS\_INVULNERABLE                  | (a)   | handle  | 1349481267  | `abilitybooleanlevelfield: 000001B6DF0D7110` |         |
| ABILITY\_BLF\_TARGET\_IS\_MAGIC\_IMMUNE                 | (a)   | handle  | 1349481268  | `abilitybooleanlevelfield: 000001B6DF0D7150` |         |
| ABILITY\_BLF\_KILL\_ON\_CASTER\_DEATH                   | (a)   | handle  | 1432576566  | `abilitybooleanlevelfield: 000001B6D9ECF560` |         |
| ABILITY\_BLF\_NO\_TARGET\_REQUIRED\_REJ4                | (a)   | handle  | 1382378036  | `abilitybooleanlevelfield: 000001B6D9ECF5A0` |         |
| ABILITY\_BLF\_ACCEPTS\_GOLD                             | (a)   | handle  | 1383362097  | `abilitybooleanlevelfield: 000001B6D9ECF5E0` |         |
| ABILITY\_BLF\_ACCEPTS\_LUMBER                           | (a)   | handle  | 1383362098  | `abilitybooleanlevelfield: 000001B6D9ECF620` |         |
| ABILITY\_BLF\_PREFER\_HOSTILES\_ROA5                    | (a)   | handle  | 1383031093  | `abilitybooleanlevelfield: 000001B6D9ECF660` |         |
| ABILITY\_BLF\_PREFER\_FRIENDLIES\_ROA6                  | (a)   | handle  | 1383031094  | `abilitybooleanlevelfield: 000001B6D9ECF6A0` |         |
| ABILITY\_BLF\_ROOTED\_TURNING                           | (a)   | handle  | 1383034675  | `abilitybooleanlevelfield: 000001B6D9ECF6E0` |         |
| ABILITY\_BLF\_ALWAYS\_AUTOCAST\_SLO3                    | (a)   | handle  | 1399615283  | `abilitybooleanlevelfield: 000001B6D9ECF720` |         |
| ABILITY\_BLF\_HIDE\_BUTTON                              | (a)   | handle  | 1231579492  | `abilitybooleanlevelfield: 000001B6DF0D6C40` |         |
| ABILITY\_BLF\_USE\_TELEPORT\_CLUSTERING\_ITP2           | (a)   | handle  | 1232367666  | `abilitybooleanlevelfield: 000001B6DF0D6C80` |         |
| ABILITY\_BLF\_IMMUNE\_TO\_MORPH\_EFFECTS                | (a)   | handle  | 1165256753  | `abilitybooleanlevelfield: 000001B6DF0D6CC0` |         |
| ABILITY\_BLF\_DOES\_NOT\_BLOCK\_BUILDINGS               | (a)   | handle  | 1165256754  | `abilitybooleanlevelfield: 000001B6DF0D6D00` |         |
| ABILITY\_BLF\_AUTO\_ACQUIRE\_ATTACK\_TARGETS            | (a)   | handle  | 1198026545  | `abilitybooleanlevelfield: 000001B6DF0D6D40` |         |
| ABILITY\_BLF\_IMMUNE\_TO\_MORPH\_EFFECTS\_GHO2          | (a)   | handle  | 1198026546  | `abilitybooleanlevelfield: 000001B6DF0D6D80` |         |
| ABILITY\_BLF\_DO\_NOT\_BLOCK\_BUILDINGS                 | (a)   | handle  | 1198026547  | `abilitybooleanlevelfield: 000001B6DF0D6DC0` |         |
| ABILITY\_BLF\_INCLUDE\_RANGED\_DAMAGE                   | (a)   | handle  | 1400073012  | `abilitybooleanlevelfield: 000001B6DF0D6E00` |         |
| ABILITY\_BLF\_INCLUDE\_MELEE\_DAMAGE                    | (a)   | handle  | 1400073013  | `abilitybooleanlevelfield: 000001B6DF0D6E40` |         |
| ABILITY\_BLF\_MOVE\_TO\_PARTNER                         | (a)   | handle  | 1668243762  | `abilitybooleanlevelfield: 000001B6DF0D6E80` |         |
| ABILITY\_BLF\_CAN\_BE\_DISPELLED                        | (a)   | handle  | 1668899633  | `abilitybooleanlevelfield: 000001B6DF0D6EC0` |         |
| ABILITY\_BLF\_IGNORE\_FRIENDLY\_BUFFS                   | (a)   | handle  | 1685482806  | `abilitybooleanlevelfield: 000001B6DF0D6F00` |         |
| ABILITY\_BLF\_DROP\_ITEMS\_ON\_DEATH                    | (a)   | handle  | 1768846898  | `abilitybooleanlevelfield: 000001B6DF0D6F40` |         |
| ABILITY\_BLF\_CAN\_USE\_ITEMS                           | (a)   | handle  | 1768846899  | `abilitybooleanlevelfield: 000001B6DF0D6F80` |         |
| ABILITY\_BLF\_CAN\_GET\_ITEMS                           | (a)   | handle  | 1768846900  | `abilitybooleanlevelfield: 000001B6DF0D6FC0` |         |
| ABILITY\_BLF\_CAN\_DROP\_ITEMS                          | (a)   | handle  | 1768846901  | `abilitybooleanlevelfield: 000001B6DF0D7000` |         |
| ABILITY\_BLF\_REPAIRS\_ALLOWED                          | (a)   | handle  | 1818849588  | `abilitybooleanlevelfield: 000001B6D9ED0F80` |         |
| ABILITY\_BLF\_CASTER\_ONLY\_SPLASH                      | (a)   | handle  | 1835428918  | `abilitybooleanlevelfield: 000001B6D9ED0FC0` |         |
| ABILITY\_BLF\_NO\_TARGET\_REQUIRED\_IRL4                | (a)   | handle  | 1769106484  | `abilitybooleanlevelfield: 000001B6D9ED1000` |         |
| ABILITY\_BLF\_DISPEL\_ON\_ATTACK                        | (a)   | handle  | 1769106485  | `abilitybooleanlevelfield: 000001B6D9ED1040` |         |
| ABILITY\_BLF\_AMOUNT\_IS\_RAW\_VALUE                    | (a)   | handle  | 1768977971  | `abilitybooleanlevelfield: 000001B6D9ED1080` |         |
| ABILITY\_BLF\_SHARED\_SPELL\_COOLDOWN                   | (a)   | handle  | 1936745010  | `abilitybooleanlevelfield: 000001B6D9ED10C0` |         |
| ABILITY\_BLF\_SLEEP\_ONCE                               | (a)   | handle  | 1936482609  | `abilitybooleanlevelfield: 000001B6D9ED1100` |         |
| ABILITY\_BLF\_ALLOW\_ON\_ANY\_PLAYER\_SLOT              | (a)   | handle  | 1936482610  | `abilitybooleanlevelfield: 000001B6D9ED1140` |         |
| ABILITY\_BLF\_DISABLE\_OTHER\_ABILITIES                 | (a)   | handle  | 1315138613  | `abilitybooleanlevelfield: 000001B6D9ED1180` |         |
| ABILITY\_BLF\_ALLOW\_BOUNTY                             | (a)   | handle  | 1316252980  | `abilitybooleanlevelfield: 000001B6D9ED11C0` |         |
| ABILITY\_BLF\_REMOVE\_BUFFS\_ON\_ABILITY\_START         | (a)   | handle  | 1667789366  | `abilitybooleanlevelfield: 000001B6D9ED1200` |         |
| ABILITY\_BLF\_SILENCES\_WHEN\_ENSNARED                  | (a)   | handle  | 1164866359  | `abilitybooleanlevelfield: 000001B6D9ED1240` |         |
| ABILITY\_BLF\_REFRESH\_COOLDOWN\_ON\_KILL\_HSL3         | (a)   | handle  | 1752394803  | `abilitybooleanlevelfield: 000001B6D9ED1280` |         |
| ABILITY\_BLF\_ENABLE\_CHAIN\_EXPLOSION                  | (a)   | handle  | 1752393269  | `abilitybooleanlevelfield: 000001B6D9ED12C0` |         |
| ABILITY\_BLF\_DISPEL\_MAGIC\_BONUS\_DAMAGE\_TO\_SUMMONS | (a)   | handle  | 1752393270  | `abilitybooleanlevelfield: 000001B6D9ED1300` |         |
| ABILITY\_BLF\_REMOVES\_NEGATIVE\_DEBUFFS                | (a)   | handle  | 1751737139  | `abilitybooleanlevelfield: 000001B6D9ED1340` |         |
| ABILITY\_BLF\_REFRESH\_COOLDOWN\_ON\_KILL\_HHR7         | (a)   | handle  | 1751675447  | `abilitybooleanlevelfield: 000001B6D9ED1380` |         |
| ABILITY\_BLF\_MAKES\_UNITS\_UNDYING                     | (a)   | handle  | 1751607349  | `abilitybooleanlevelfield: 000001B6D9ED7980` |         |
| -1                                                      | (a)   | handle  | -1          | `abilitybooleanlevelfield: 000001B70361CD20` |         |
| past the last constant                                  | (a)   | handle  | 1936745011  | `abilitybooleanlevelfield: 000001B6FA3C2F40` |         |
| 2147483647                                              | (a)   | handle  | 2147483647  | `abilitybooleanlevelfield: 000001B6D7DC7220` |         |
| -2147483648                                             | (a)   | handle  | -2147483648 | `abilitybooleanlevelfield: 000001B6F8613AC0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertAbilityStringLevelField`

| Case                                       | Group | Outcome | Id          | Type                                        | Message |
| ------------------------------------------ | ----- | ------- | ----------- | ------------------------------------------- | ------- |
| ABILITY\_SLF\_ICON\_NORMAL                 | (a)   | handle  | 1633776244  | `abilitystringlevelfield: 000001B6D9ED79C0` |         |
| ABILITY\_SLF\_CASTER                       | (a)   | handle  | 1633902964  | `abilitystringlevelfield: 000001B6D9ED7A00` |         |
| ABILITY\_SLF\_TARGET                       | (a)   | handle  | 1635017076  | `abilitystringlevelfield: 000001B6D9ED7A90` |         |
| ABILITY\_SLF\_SPECIAL                      | (a)   | handle  | 1634951540  | `abilitystringlevelfield: 000001B6D9ED7B60` |         |
| ABILITY\_SLF\_EFFECT                       | (a)   | handle  | 1634034036  | `abilitystringlevelfield: 000001B6D9ED7BA0` |         |
| ABILITY\_SLF\_AREA\_EFFECT                 | (a)   | handle  | 1633772897  | `abilitystringlevelfield: 000001B6D9ED7CF0` |         |
| ABILITY\_SLF\_LIGHTNING\_EFFECTS           | (a)   | handle  | 1634494823  | `abilitystringlevelfield: 000001B6D9ED7D30` |         |
| ABILITY\_SLF\_MISSILE\_ART                 | (a)   | handle  | 1634558324  | `abilitystringlevelfield: 000001B6D9ED7D70` |         |
| ABILITY\_SLF\_TOOLTIP\_LEARN               | (a)   | handle  | 1634887028  | `abilitystringlevelfield: 000001B6D9ED7DB0` |         |
| ABILITY\_SLF\_TOOLTIP\_LEARN\_EXTENDED     | (a)   | handle  | 1634891124  | `abilitystringlevelfield: 000001B6D9ED7A40` |         |
| ABILITY\_SLF\_TOOLTIP\_NORMAL              | (a)   | handle  | 1635020849  | `abilitystringlevelfield: 000001B6D9ED7AD0` |         |
| ABILITY\_SLF\_TOOLTIP\_TURN\_OFF           | (a)   | handle  | 1635087409  | `abilitystringlevelfield: 000001B6D9ED7B10` |         |
| ABILITY\_SLF\_TOOLTIP\_NORMAL\_EXTENDED    | (a)   | handle  | 1635082801  | `abilitystringlevelfield: 000001B6D9ED7BE0` |         |
| ABILITY\_SLF\_TOOLTIP\_TURN\_OFF\_EXTENDED | (a)   | handle  | 1635087665  | `abilitystringlevelfield: 000001B6D9ED7C20` |         |
| ABILITY\_SLF\_NORMAL\_FORM\_UNIT\_EME1     | (a)   | handle  | 1164797233  | `abilitystringlevelfield: 000001B6D9ED7C60` |         |
| ABILITY\_SLF\_SPAWNED\_UNITS               | (a)   | handle  | 1315205169  | `abilitystringlevelfield: 000001B6D9ED7CA0` |         |
| ABILITY\_SLF\_ABILITY\_FOR\_UNIT\_CREATION | (a)   | handle  | 1316119345  | `abilitystringlevelfield: 000001B6D9ED6110` |         |
| ABILITY\_SLF\_NORMAL\_FORM\_UNIT\_MIL1     | (a)   | handle  | 1298754609  | `abilitystringlevelfield: 000001B6D9ED6150` |         |
| ABILITY\_SLF\_ALTERNATE\_FORM\_UNIT\_MIL2  | (a)   | handle  | 1298754610  | `abilitystringlevelfield: 000001B6D9ED6190` |         |
| ABILITY\_SLF\_BASE\_ORDER\_ID\_ANS5        | (a)   | handle  | 1097757493  | `abilitystringlevelfield: 000001B6D9ED61D0` |         |
| ABILITY\_SLF\_MORPH\_UNITS\_GROUND         | (a)   | handle  | 1349286194  | `abilitystringlevelfield: 000001B6D9ED6210` |         |
| ABILITY\_SLF\_MORPH\_UNITS\_AIR            | (a)   | handle  | 1349286195  | `abilitystringlevelfield: 000001B6D9ED6250` |         |
| ABILITY\_SLF\_MORPH\_UNITS\_AMPHIBIOUS     | (a)   | handle  | 1349286196  | `abilitystringlevelfield: 000001B6D9ED6290` |         |
| ABILITY\_SLF\_MORPH\_UNITS\_WATER          | (a)   | handle  | 1349286197  | `abilitystringlevelfield: 000001B6D9ED62D0` |         |
| ABILITY\_SLF\_UNIT\_TYPE\_ONE              | (a)   | handle  | 1382115635  | `abilitystringlevelfield: 000001B6D9ED6310` |         |
| ABILITY\_SLF\_UNIT\_TYPE\_TWO              | (a)   | handle  | 1382115636  | `abilitystringlevelfield: 000001B6DF0C59C0` |         |
| ABILITY\_SLF\_UNIT\_TYPE\_SOD2             | (a)   | handle  | 1399809074  | `abilitystringlevelfield: 000001B6DF0C5A00` |         |
| ABILITY\_SLF\_SUMMON\_1\_UNIT\_TYPE        | (a)   | handle  | 1232303153  | `abilitystringlevelfield: 000001B6DF0C5A40` |         |
| ABILITY\_SLF\_SUMMON\_2\_UNIT\_TYPE        | (a)   | handle  | 1232303154  | `abilitystringlevelfield: 000001B6DF0C5A80` |         |
| ABILITY\_SLF\_RACE\_TO\_CONVERT            | (a)   | handle  | 1315201841  | `abilitystringlevelfield: 000001B6DF0C5AC0` |         |
| ABILITY\_SLF\_PARTNER\_UNIT\_TYPE          | (a)   | handle  | 1668243761  | `abilitystringlevelfield: 000001B6D9ED5F00` |         |
| ABILITY\_SLF\_PARTNER\_UNIT\_TYPE\_ONE     | (a)   | handle  | 1684238385  | `abilitystringlevelfield: 000001B6D9ED5F40` |         |
| ABILITY\_SLF\_PARTNER\_UNIT\_TYPE\_TWO     | (a)   | handle  | 1684238386  | `abilitystringlevelfield: 000001B6D9ED5F80` |         |
| ABILITY\_SLF\_REQUIRED\_UNIT\_TYPE         | (a)   | handle  | 1953524017  | `abilitystringlevelfield: 000001B6D9ED5FC0` |         |
| ABILITY\_SLF\_CONVERTED\_UNIT\_TYPE        | (a)   | handle  | 1953524018  | `abilitystringlevelfield: 000001B6D9ED6000` |         |
| ABILITY\_SLF\_SPELL\_LIST                  | (a)   | handle  | 1936745009  | `abilitystringlevelfield: 000001B6D9ED6040` |         |
| ABILITY\_SLF\_BASE\_ORDER\_ID\_SPB5        | (a)   | handle  | 1936745013  | `abilitystringlevelfield: 000001B6D9ED6080` |         |
| ABILITY\_SLF\_BASE\_ORDER\_ID\_NCL6        | (a)   | handle  | 1315138614  | `abilitystringlevelfield: 000001B6D9ED60C0` |         |
| ABILITY\_SLF\_ABILITY\_UPGRADE\_1          | (a)   | handle  | 1315268403  | `abilitystringlevelfield: 000001B6DF0C55B0` |         |
| ABILITY\_SLF\_ABILITY\_UPGRADE\_2          | (a)   | handle  | 1315268404  | `abilitystringlevelfield: 000001B6DF0C55F0` |         |
| ABILITY\_SLF\_ABILITY\_UPGRADE\_3          | (a)   | handle  | 1315268405  | `abilitystringlevelfield: 000001B6DF0C5630` |         |
| ABILITY\_SLF\_ABILITY\_UPGRADE\_4          | (a)   | handle  | 1315268406  | `abilitystringlevelfield: 000001B6DF0C5670` |         |
| ABILITY\_SLF\_SPAWN\_UNIT\_ID\_NSY2        | (a)   | handle  | 1316190514  | `abilitystringlevelfield: 000001B6DF0C56B0` |         |
| -1                                         | (a)   | handle  | -1          | `abilitystringlevelfield: 000001B6F9C61C60` |         |
| past the last constant                     | (a)   | handle  | 1953524019  | `abilitystringlevelfield: 000001B7036E97F0` |         |
| 2147483647                                 | (a)   | handle  | 2147483647  | `abilitystringlevelfield: 000001B6F98DE0A0` |         |
| -2147483648                                | (a)   | handle  | -2147483648 | `abilitystringlevelfield: 000001B6F1D68EB0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertAbilityIntegerLevelArrayField`

| Case       | Group | Outcome | Id         | Type                                              | Message |
| ---------- | ----- | ------- | ---------- | ------------------------------------------------- | ------- |
| 0          | (a)   | handle  | 0          | `abilityintegerlevelarrayfield: 000001B70366E500` |         |
| 1          | (a)   | handle  | 1          | `abilityintegerlevelarrayfield: 000001B6F9C6B590` |         |
| -1         | (a)   | handle  | -1         | `abilityintegerlevelarrayfield: 000001B6FA8A9010` |         |
| 2147483647 | (a)   | handle  | 2147483647 | `abilityintegerlevelarrayfield: 000001B7035FE3D0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for 0, 1, -1 and 2147483647, its type having no common.j constant (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertAbilityRealLevelArrayField`

| Case       | Group | Outcome | Id         | Type                                           | Message |
| ---------- | ----- | ------- | ---------- | ---------------------------------------------- | ------- |
| 0          | (a)   | handle  | 0          | `abilityreallevelarrayfield: 000001B703792930` |         |
| 1          | (a)   | handle  | 1          | `abilityreallevelarrayfield: 000001B6F9C41D70` |         |
| -1         | (a)   | handle  | -1         | `abilityreallevelarrayfield: 000001B6FA0BD8E0` |         |
| 2147483647 | (a)   | handle  | 2147483647 | `abilityreallevelarrayfield: 000001B6F8619050` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for 0, 1, -1 and 2147483647, its type having no common.j constant (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertAbilityBooleanLevelArrayField`

| Case       | Group | Outcome | Id         | Type                                              | Message |
| ---------- | ----- | ------- | ---------- | ------------------------------------------------- | ------- |
| 0          | (a)   | handle  | 0          | `abilitybooleanlevelarrayfield: 000001B6DB94C5B0` |         |
| 1          | (a)   | handle  | 1          | `abilitybooleanlevelarrayfield: 000001B6F8636BC0` |         |
| -1         | (a)   | handle  | -1         | `abilitybooleanlevelarrayfield: 000001B6F8640070` |         |
| 2147483647 | (a)   | handle  | 2147483647 | `abilitybooleanlevelarrayfield: 000001B6F1D68380` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for 0, 1, -1 and 2147483647, its type having no common.j constant (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertAbilityStringLevelArrayField`

| Case       | Group | Outcome | Id         | Type                                             | Message |
| ---------- | ----- | ------- | ---------- | ------------------------------------------------ | ------- |
| 0          | (a)   | handle  | 0          | `abilitystringlevelarrayfield: 000001B70366F670` |         |
| 1          | (a)   | handle  | 1          | `abilitystringlevelarrayfield: 000001B6DA644720` |         |
| -1         | (a)   | handle  | -1         | `abilitystringlevelarrayfield: 000001B6F85E70D0` |         |
| 2147483647 | (a)   | handle  | 2147483647 | `abilitystringlevelarrayfield: 000001B6D7DACD40` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for 0, 1, -1 and 2147483647, its type having no common.j constant (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

## `nullability-converters-4`

- Probe: `nullability-converters-4`
- Patch: 3.0.1.24370
- Client: 3.0.1.24371
- Date: 2026-10-21
- Run: `16be82a3-cf32-4637-8226-adefc7c12a4d`

### `ConvertUnitIntegerField`

| Case                                                | Group | Outcome | Id          | Type                                 | Message |
| --------------------------------------------------- | ----- | ------- | ----------- | ------------------------------------ | ------- |
| UNIT\_IF\_DEFENSE\_TYPE                             | (a)   | handle  | 1969517689  | `unitintegerfield: 0000028BFC784960` |         |
| UNIT\_IF\_ARMOR\_TYPE                               | (a)   | handle  | 1969320557  | `unitintegerfield: 0000028BFC7849A0` |         |
| UNIT\_IF\_LOOPING\_FADE\_IN\_RATE                   | (a)   | handle  | 1970038377  | `unitintegerfield: 0000028BFC7849E0` |         |
| UNIT\_IF\_LOOPING\_FADE\_OUT\_RATE                  | (a)   | handle  | 1970038383  | `unitintegerfield: 0000028BFDD93AA0` |         |
| UNIT\_IF\_AGILITY                                   | (a)   | handle  | 1969317731  | `unitintegerfield: 0000028BFD42B990` |         |
| UNIT\_IF\_INTELLIGENCE                              | (a)   | handle  | 1969843811  | `unitintegerfield: 0000028BFD42BAE0` |         |
| UNIT\_IF\_STRENGTH                                  | (a)   | handle  | 1970500707  | `unitintegerfield: 0000028BFD42BB20` |         |
| UNIT\_IF\_AGILITY\_PERMANENT                        | (a)   | handle  | 1969317741  | `unitintegerfield: 0000028BFD42BB60` |         |
| UNIT\_IF\_INTELLIGENCE\_PERMANENT                   | (a)   | handle  | 1969843821  | `unitintegerfield: 0000028BFD42BBA0` |         |
| UNIT\_IF\_STRENGTH\_PERMANENT                       | (a)   | handle  | 1970500717  | `unitintegerfield: 0000028BFD42BBE0` |         |
| UNIT\_IF\_AGILITY\_WITH\_BONUS                      | (a)   | handle  | 1969317730  | `unitintegerfield: 0000028BFD42BC20` |         |
| UNIT\_IF\_INTELLIGENCE\_WITH\_BONUS                 | (a)   | handle  | 1969843810  | `unitintegerfield: 0000028BFD42BC60` |         |
| UNIT\_IF\_STRENGTH\_WITH\_BONUS                     | (a)   | handle  | 1970500706  | `unitintegerfield: 0000028BFD42BCA0` |         |
| UNIT\_IF\_GOLD\_BOUNTY\_AWARDED\_NUMBER\_OF\_DICE   | (a)   | handle  | 1969382505  | `unitintegerfield: 0000028BFD42BCE0` |         |
| UNIT\_IF\_GOLD\_BOUNTY\_AWARDED\_BASE               | (a)   | handle  | 1969381985  | `unitintegerfield: 0000028BFD42BD20` |         |
| UNIT\_IF\_GOLD\_BOUNTY\_AWARDED\_SIDES\_PER\_DIE    | (a)   | handle  | 1969386345  | `unitintegerfield: 0000028BFC784680` |         |
| UNIT\_IF\_LUMBER\_BOUNTY\_AWARDED\_NUMBER\_OF\_DICE | (a)   | handle  | 1970037348  | `unitintegerfield: 0000028BFC7846C0` |         |
| UNIT\_IF\_LUMBER\_BOUNTY\_AWARDED\_BASE             | (a)   | handle  | 1970037345  | `unitintegerfield: 0000028BFD42B9D0` |         |
| UNIT\_IF\_LUMBER\_BOUNTY\_AWARDED\_SIDES\_PER\_DIE  | (a)   | handle  | 1970037363  | `unitintegerfield: 0000028BFD42BA10` |         |
| UNIT\_IF\_LEVEL                                     | (a)   | handle  | 1970038134  | `unitintegerfield: 0000028BFD42BA50` |         |
| UNIT\_IF\_FORMATION\_RANK                           | (a)   | handle  | 1969647474  | `unitintegerfield: 0000028BFD42BA90` |         |
| UNIT\_IF\_ORIENTATION\_INTERPOLATION                | (a)   | handle  | 1970238057  | `unitintegerfield: 0000028BFC77C680` |         |
| UNIT\_IF\_ELEVATION\_SAMPLE\_POINTS                 | (a)   | handle  | 1969582196  | `unitintegerfield: 0000028BFC77C6C0` |         |
| UNIT\_IF\_TINTING\_COLOR\_RED                       | (a)   | handle  | 1969450098  | `unitintegerfield: 0000028BFC77C700` |         |
| UNIT\_IF\_TINTING\_COLOR\_GREEN                     | (a)   | handle  | 1969450087  | `unitintegerfield: 0000028BFC77C740` |         |
| UNIT\_IF\_TINTING\_COLOR\_BLUE                      | (a)   | handle  | 1969450082  | `unitintegerfield: 0000028BFC77C780` |         |
| UNIT\_IF\_TINTING\_COLOR\_ALPHA                     | (a)   | handle  | 1969447276  | `unitintegerfield: 0000028BFC77C7C0` |         |
| UNIT\_IF\_MOVE\_TYPE                                | (a)   | handle  | 1970108020  | `unitintegerfield: 0000028BFC77C800` |         |
| UNIT\_IF\_TARGETED\_AS                              | (a)   | handle  | 1970561394  | `unitintegerfield: 0000028BFC77C840` |         |
| UNIT\_IF\_UNIT\_CLASSIFICATION                      | (a)   | handle  | 1970567536  | `unitintegerfield: 0000028BFC77C880` |         |
| UNIT\_IF\_HIT\_POINTS\_REGENERATION\_TYPE           | (a)   | handle  | 1969779316  | `unitintegerfield: 0000028BFC77C8C0` |         |
| UNIT\_IF\_PLACEMENT\_PREVENTED\_BY                  | (a)   | handle  | 1970299250  | `unitintegerfield: 0000028BFC77C900` |         |
| UNIT\_IF\_PRIMARY\_ATTRIBUTE                        | (a)   | handle  | 1970303585  | `unitintegerfield: 0000028BFC77C940` |         |
| -1                                                  | (a)   | handle  | -1          | `unitintegerfield: 0000028C01DE89F0` |         |
| past the last constant                              | (a)   | handle  | 1970567537  | `unitintegerfield: 0000028C0220AF60` |         |
| 2147483647                                          | (a)   | handle  | 2147483647  | `unitintegerfield: 0000028C01F81ED0` |         |
| -2147483648                                         | (a)   | handle  | -2147483648 | `unitintegerfield: 0000028C02D4F690` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertUnitRealField`

| Case                                      | Group | Outcome | Id          | Type                              | Message |
| ----------------------------------------- | ----- | ------- | ----------- | --------------------------------- | ------- |
| UNIT\_RF\_STRENGTH\_PER\_LEVEL            | (a)   | handle  | 1970500720  | `unitrealfield: 0000028BFC77C980` |         |
| UNIT\_RF\_AGILITY\_PER\_LEVEL             | (a)   | handle  | 1969317744  | `unitrealfield: 0000028BFC77C9C0` |         |
| UNIT\_RF\_INTELLIGENCE\_PER\_LEVEL        | (a)   | handle  | 1969843824  | `unitrealfield: 0000028BFC7DBDD0` |         |
| UNIT\_RF\_HIT\_POINTS\_REGENERATION\_RATE | (a)   | handle  | 1969778802  | `unitrealfield: 0000028BFC7DBEA0` |         |
| UNIT\_RF\_MANA\_REGENERATION              | (a)   | handle  | 1970106482  | `unitrealfield: 0000028BFC7DBEE0` |         |
| UNIT\_RF\_DEATH\_TIME                     | (a)   | handle  | 1969517677  | `unitrealfield: 0000028BFC7DC030` |         |
| UNIT\_RF\_FLY\_HEIGHT                     | (a)   | handle  | 1969650024  | `unitrealfield: 0000028BFC7DC070` |         |
| UNIT\_RF\_FLY\_MAX\_HEIGHT                | (a)   | handle  | 1969646952  | `unitrealfield: 0000028BFC7DC0B0` |         |
| UNIT\_RF\_TURN\_RATE                      | (a)   | handle  | 1970108018  | `unitrealfield: 0000028BFC7DC0F0` |         |
| UNIT\_RF\_ELEVATION\_SAMPLE\_RADIUS       | (a)   | handle  | 1969582692  | `unitrealfield: 0000028BFC7DC130` |         |
| UNIT\_RF\_FOG\_OF\_WAR\_SAMPLE\_RADIUS    | (a)   | handle  | 1969648228  | `unitrealfield: 0000028BFC7DC170` |         |
| UNIT\_RF\_MAXIMUM\_PITCH\_ANGLE\_DEGREES  | (a)   | handle  | 1970108528  | `unitrealfield: 0000028BFC77CA00` |         |
| UNIT\_RF\_MAXIMUM\_ROLL\_ANGLE\_DEGREES   | (a)   | handle  | 1970108530  | `unitrealfield: 0000028BFC7DBE10` |         |
| UNIT\_RF\_SCALING\_VALUE                  | (a)   | handle  | 1970496353  | `unitrealfield: 0000028BFC7DBE50` |         |
| UNIT\_RF\_ANIMATION\_RUN\_SPEED           | (a)   | handle  | 1970435438  | `unitrealfield: 0000028BFC7DBF20` |         |
| UNIT\_RF\_SELECTION\_SCALE                | (a)   | handle  | 1970500451  | `unitrealfield: 0000028BFC7DBF60` |         |
| UNIT\_RF\_SELECTION\_CIRCLE\_HEIGHT       | (a)   | handle  | 1970498682  | `unitrealfield: 0000028BFC7DBFA0` |         |
| UNIT\_RF\_SHADOW\_IMAGE\_HEIGHT           | (a)   | handle  | 1970497640  | `unitrealfield: 0000028BFC7DBFE0` |         |
| UNIT\_RF\_SHADOW\_IMAGE\_WIDTH            | (a)   | handle  | 1970497655  | `unitrealfield: 0000028BFC771CF0` |         |
| UNIT\_RF\_SHADOW\_IMAGE\_CENTER\_X        | (a)   | handle  | 1970497656  | `unitrealfield: 0000028BFC771D30` |         |
| UNIT\_RF\_SHADOW\_IMAGE\_CENTER\_Y        | (a)   | handle  | 1970497657  | `unitrealfield: 0000028BFC771D70` |         |
| UNIT\_RF\_ANIMATION\_WALK\_SPEED          | (a)   | handle  | 1970757996  | `unitrealfield: 0000028BFC771DB0` |         |
| UNIT\_RF\_DEFENSE                         | (a)   | handle  | 1969514083  | `unitrealfield: 0000028BFC771DF0` |         |
| UNIT\_RF\_SIGHT\_RADIUS                   | (a)   | handle  | 1970497906  | `unitrealfield: 0000028BFC771E30` |         |
| UNIT\_RF\_PRIORITY                        | (a)   | handle  | 1970303593  | `unitrealfield: 0000028BFC771E70` |         |
| UNIT\_RF\_SPEED                           | (a)   | handle  | 1970108003  | `unitrealfield: 0000028BFC771EB0` |         |
| UNIT\_RF\_OCCLUDER\_HEIGHT                | (a)   | handle  | 1970234211  | `unitrealfield: 0000028BFC771EF0` |         |
| UNIT\_RF\_HP                              | (a)   | handle  | 1969778787  | `unitrealfield: 0000028BFC771F30` |         |
| UNIT\_RF\_MANA                            | (a)   | handle  | 1970106467  | `unitrealfield: 0000028BFC771F70` |         |
| UNIT\_RF\_ACQUISITION\_RANGE              | (a)   | handle  | 1969316721  | `unitrealfield: 0000028BFC771FB0` |         |
| UNIT\_RF\_CAST\_BACK\_SWING               | (a)   | handle  | 1969447539  | `unitrealfield: 0000028BFC771FF0` |         |
| UNIT\_RF\_CAST\_POINT                     | (a)   | handle  | 1969451124  | `unitrealfield: 0000028BFC772030` |         |
| UNIT\_RF\_MINIMUM\_ATTACK\_RANGE          | (a)   | handle  | 1969319278  | `unitrealfield: 0000028BFC772070` |         |
| -1                                        | (a)   | handle  | -1          | `unitrealfield: 0000028B1E5E6C20` |         |
| past the last constant                    | (a)   | handle  | 1970757997  | `unitrealfield: 0000028C03665740` |         |
| 2147483647                                | (a)   | handle  | 2147483647  | `unitrealfield: 0000028C036845D0` |         |
| -2147483648                               | (a)   | handle  | -2147483648 | `unitrealfield: 0000028C036A3310` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertUnitBooleanField`

| Case                                              | Group | Outcome | Id          | Type                                 | Message |
| ------------------------------------------------- | ----- | ------- | ----------- | ------------------------------------ | ------- |
| UNIT\_BF\_RAISABLE                                | (a)   | handle  | 1970430313  | `unitbooleanfield: 0000028BF0240DF0` |         |
| UNIT\_BF\_DECAYABLE                               | (a)   | handle  | 1969513827  | `unitbooleanfield: 0000028BF0240E30` |         |
| UNIT\_BF\_IS\_A\_BUILDING                         | (a)   | handle  | 1969382503  | `unitbooleanfield: 0000028BF0240EC0` |         |
| UNIT\_BF\_USE\_EXTENDED\_LINE\_OF\_SIGHT          | (a)   | handle  | 1970040691  | `unitbooleanfield: 0000028BF0240F90` |         |
| UNIT\_BF\_NEUTRAL\_BUILDING\_SHOWS\_MINIMAP\_ICON | (a)   | handle  | 1970168429  | `unitbooleanfield: 0000028BF0240FD0` |         |
| UNIT\_BF\_HERO\_HIDE\_HERO\_INTERFACE\_ICON       | (a)   | handle  | 1969776738  | `unitbooleanfield: 0000028BF0241010` |         |
| UNIT\_BF\_HERO\_HIDE\_HERO\_MINIMAP\_DISPLAY      | (a)   | handle  | 1969776749  | `unitbooleanfield: 0000028BF0240E70` |         |
| UNIT\_BF\_HERO\_HIDE\_HERO\_DEATH\_MESSAGE        | (a)   | handle  | 1969776740  | `unitbooleanfield: 0000028BF0240F00` |         |
| UNIT\_BF\_HIDE\_MINIMAP\_DISPLAY                  | (a)   | handle  | 1969778541  | `unitbooleanfield: 0000028BF0240F40` |         |
| UNIT\_BF\_SCALE\_PROJECTILES                      | (a)   | handle  | 1970496354  | `unitbooleanfield: 0000028BFC772530` |         |
| UNIT\_BF\_SELECTION\_CIRCLE\_ON\_WATER            | (a)   | handle  | 1970496887  | `unitbooleanfield: 0000028BFC772570` |         |
| UNIT\_BF\_HAS\_WATER\_SHADOW                      | (a)   | handle  | 1970497650  | `unitbooleanfield: 0000028BFC7725B0` |         |
| UNIT\_BF\_SHOW\_AIR\_TO\_GROUND                   | (a)   | handle  | 1969321063  | `unitbooleanfield: 0000028BFC772210` |         |
| UNIT\_BF\_FORCE\_DISPLAY\_HP                      | (a)   | handle  | 1969645680  | `unitbooleanfield: 0000028BFC772250` |         |
| -1                                                | (a)   | handle  | -1          | `unitbooleanfield: 0000028C0429C140` |         |
| past the last constant                            | (a)   | handle  | 1970497651  | `unitbooleanfield: 0000028C02D06B80` |         |
| 2147483647                                        | (a)   | handle  | 2147483647  | `unitbooleanfield: 0000028C039D3550` |         |
| -2147483648                                       | (a)   | handle  | -2147483648 | `unitbooleanfield: 0000028C042C2900` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertUnitStringField`

| Case                          | Group | Outcome | Id          | Type                                | Message |
| ----------------------------- | ----- | ------- | ----------- | ----------------------------------- | ------- |
| UNIT\_SF\_NAME                | (a)   | handle  | 1970168173  | `unitstringfield: 0000028BFC772290` |         |
| UNIT\_SF\_PROPER\_NAMES       | (a)   | handle  | 1970303599  | `unitstringfield: 0000028BFC7722D0` |         |
| UNIT\_SF\_GROUND\_TEXTURE     | (a)   | handle  | 1970627187  | `unitstringfield: 0000028BFC7731C0` |         |
| UNIT\_SF\_SHADOW\_IMAGE\_UNIT | (a)   | handle  | 1970497653  | `unitstringfield: 0000028BFC773290` |         |
| -1                            | (a)   | handle  | -1          | `unitstringfield: 0000028C02E604D0` |         |
| past the last constant        | (a)   | handle  | 1970627188  | `unitstringfield: 0000028C042EFC40` |         |
| 2147483647                    | (a)   | handle  | 2147483647  | `unitstringfield: 0000028C042EE240` |         |
| -2147483648                   | (a)   | handle  | -2147483648 | `unitstringfield: 0000028BFF393A40` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertUnitWeaponIntegerField`

| Case                                                   | Group | Outcome | Id          | Type                                       | Message |
| ------------------------------------------------------ | ----- | ------- | ----------- | ------------------------------------------ | ------- |
| UNIT\_WEAPON\_IF\_ATTACK\_DAMAGE\_NUMBER\_OF\_DICE     | (a)   | handle  | 1969303908  | `unitweaponintegerfield: 0000028BFC7732D0` |         |
| UNIT\_WEAPON\_IF\_ATTACK\_DAMAGE\_BASE                 | (a)   | handle  | 1969303906  | `unitweaponintegerfield: 0000028BFC773310` |         |
| UNIT\_WEAPON\_IF\_ATTACK\_DAMAGE\_SIDES\_PER\_DIE      | (a)   | handle  | 1969303923  | `unitweaponintegerfield: 0000028BFC773350` |         |
| UNIT\_WEAPON\_IF\_ATTACK\_MAXIMUM\_NUMBER\_OF\_TARGETS | (a)   | handle  | 1970561841  | `unitweaponintegerfield: 0000028BFC773420` |         |
| UNIT\_WEAPON\_IF\_ATTACK\_ATTACK\_TYPE                 | (a)   | handle  | 1969303924  | `unitweaponintegerfield: 0000028BFC773460` |         |
| UNIT\_WEAPON\_IF\_ATTACK\_WEAPON\_SOUND                | (a)   | handle  | 1969451825  | `unitweaponintegerfield: 0000028BFC7734A0` |         |
| UNIT\_WEAPON\_IF\_ATTACK\_AREA\_OF\_EFFECT\_TARGETS    | (a)   | handle  | 1969303920  | `unitweaponintegerfield: 0000028BFC7734E0` |         |
| UNIT\_WEAPON\_IF\_ATTACK\_TARGETS\_ALLOWED             | (a)   | handle  | 1969303911  | `unitweaponintegerfield: 0000028BFC773520` |         |
| -1                                                     | (a)   | handle  | -1          | `unitweaponintegerfield: 0000028B00378B30` |         |
| past the last constant                                 | (a)   | handle  | 1970561842  | `unitweaponintegerfield: 0000028BFF353270` |         |
| 2147483647                                             | (a)   | handle  | 2147483647  | `unitweaponintegerfield: 0000028C023C2830` |         |
| -2147483648                                            | (a)   | handle  | -2147483648 | `unitweaponintegerfield: 0000028C03BCC7D0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertUnitWeaponRealField`

| Case                                                       | Group | Outcome | Id          | Type                                    | Message |
| ---------------------------------------------------------- | ----- | ------- | ----------- | --------------------------------------- | ------- |
| UNIT\_WEAPON\_RF\_ATTACK\_BACKSWING\_POINT                 | (a)   | handle  | 1969386289  | `unitweaponrealfield: 0000028BFC773170` |         |
| UNIT\_WEAPON\_RF\_ATTACK\_DAMAGE\_POINT                    | (a)   | handle  | 1969516593  | `unitweaponrealfield: 0000028BFC773390` |         |
| UNIT\_WEAPON\_RF\_ATTACK\_BASE\_COOLDOWN                   | (a)   | handle  | 1969303907  | `unitweaponrealfield: 0000028BFC772D60` |         |
| UNIT\_WEAPON\_RF\_ATTACK\_DAMAGE\_LOSS\_FACTOR             | (a)   | handle  | 1969515569  | `unitweaponrealfield: 0000028BFC772E30` |         |
| UNIT\_WEAPON\_RF\_ATTACK\_DAMAGE\_FACTOR\_MEDIUM           | (a)   | handle  | 1969775665  | `unitweaponrealfield: 0000028BFC772E70` |         |
| UNIT\_WEAPON\_RF\_ATTACK\_DAMAGE\_FACTOR\_SMALL            | (a)   | handle  | 1970365489  | `unitweaponrealfield: 0000028BFC772FC0` |         |
| UNIT\_WEAPON\_RF\_ATTACK\_DAMAGE\_SPILL\_DISTANCE          | (a)   | handle  | 1970496561  | `unitweaponrealfield: 0000028BFC773000` |         |
| UNIT\_WEAPON\_RF\_ATTACK\_DAMAGE\_SPILL\_RADIUS            | (a)   | handle  | 1970500145  | `unitweaponrealfield: 0000028BFC7733D0` |         |
| UNIT\_WEAPON\_RF\_ATTACK\_PROJECTILE\_SPEED                | (a)   | handle  | 1969303930  | `unitweaponrealfield: 0000028BFC772DA0` |         |
| UNIT\_WEAPON\_RF\_ATTACK\_PROJECTILE\_ARC                  | (a)   | handle  | 1970102577  | `unitweaponrealfield: 0000028BFC772DE0` |         |
| UNIT\_WEAPON\_RF\_ATTACK\_AREA\_OF\_EFFECT\_FULL\_DAMAGE   | (a)   | handle  | 1969303910  | `unitweaponrealfield: 0000028BFC772EB0` |         |
| UNIT\_WEAPON\_RF\_ATTACK\_AREA\_OF\_EFFECT\_MEDIUM\_DAMAGE | (a)   | handle  | 1969303912  | `unitweaponrealfield: 0000028BFC772EF0` |         |
| UNIT\_WEAPON\_RF\_ATTACK\_AREA\_OF\_EFFECT\_SMALL\_DAMAGE  | (a)   | handle  | 1969303921  | `unitweaponrealfield: 0000028BFC772F30` |         |
| UNIT\_WEAPON\_RF\_ATTACK\_RANGE                            | (a)   | handle  | 1969303922  | `unitweaponrealfield: 0000028BFC772F70` |         |
| -1                                                         | (a)   | handle  | -1          | `unitweaponrealfield: 0000028C04379FA0` |         |
| past the last constant                                     | (a)   | handle  | 1970500146  | `unitweaponrealfield: 0000028C02481D30` |         |
| 2147483647                                                 | (a)   | handle  | 2147483647  | `unitweaponrealfield: 0000028BFF394050` |         |
| -2147483648                                                | (a)   | handle  | -2147483648 | `unitweaponrealfield: 0000028B1E6F7B10` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertUnitWeaponBooleanField`

| Case                                                  | Group | Outcome | Id          | Type                                       | Message |
| ----------------------------------------------------- | ----- | ------- | ----------- | ------------------------------------------ | ------- |
| UNIT\_WEAPON\_BF\_ATTACK\_SHOW\_UI                    | (a)   | handle  | 1970763057  | `unitweaponbooleanfield: 0000028BFC77BE50` |         |
| UNIT\_WEAPON\_BF\_ATTACKS\_ENABLED                    | (a)   | handle  | 1969317230  | `unitweaponbooleanfield: 0000028BFC77BE90` |         |
| UNIT\_WEAPON\_BF\_ATTACK\_PROJECTILE\_HOMING\_ENABLED | (a)   | handle  | 1970104369  | `unitweaponbooleanfield: 0000028BFC77BF20` |         |
| -1                                                    | (a)   | handle  | -1          | `unitweaponbooleanfield: 0000028B1569C5C0` |         |
| past the last constant                                | (a)   | handle  | 1970763058  | `unitweaponbooleanfield: 0000028C020558E0` |         |
| 2147483647                                            | (a)   | handle  | 2147483647  | `unitweaponbooleanfield: 0000028B1E6D3D10` |         |
| -2147483648                                           | (a)   | handle  | -2147483648 | `unitweaponbooleanfield: 0000028B1E632350` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertUnitWeaponStringField`

| Case                                      | Group | Outcome | Id          | Type                                      | Message |
| ----------------------------------------- | ----- | ------- | ----------- | ----------------------------------------- | ------- |
| UNIT\_WEAPON\_SF\_ATTACK\_PROJECTILE\_ART | (a)   | handle  | 1969303917  | `unitweaponstringfield: 0000028BFC77BFF0` |         |
| -1                                        | (a)   | handle  | -1          | `unitweaponstringfield: 0000028C01F7E410` |         |
| past the last constant                    | (a)   | handle  | 1969303918  | `unitweaponstringfield: 0000028C02ECB650` |         |
| 2147483647                                | (a)   | handle  | 2147483647  | `unitweaponstringfield: 0000028BFF447060` |         |
| -2147483648                               | (a)   | handle  | -2147483648 | `unitweaponstringfield: 0000028C0396FD70` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertItemIntegerField`

| Case                            | Group | Outcome | Id          | Type                                 | Message |
| ------------------------------- | ----- | ------- | ----------- | ------------------------------------ | ------- |
| ITEM\_IF\_LEVEL                 | (a)   | handle  | 1768711542  | `itemintegerfield: 0000028BFC7815B0` |         |
| ITEM\_IF\_NUMBER\_OF\_CHARGES   | (a)   | handle  | 1769304933  | `itemintegerfield: 0000028BFC7815F0` |         |
| ITEM\_IF\_COOLDOWN\_GROUP       | (a)   | handle  | 1768122724  | `itemintegerfield: 0000028BFC781680` |         |
| ITEM\_IF\_MAX\_HIT\_POINTS      | (a)   | handle  | 1768453232  | `itemintegerfield: 0000028BFC781750` |         |
| ITEM\_IF\_HIT\_POINTS           | (a)   | handle  | 1768452195  | `itemintegerfield: 0000028BFC781790` |         |
| ITEM\_IF\_PRIORITY              | (a)   | handle  | 1768977001  | `itemintegerfield: 0000028BFC781630` |         |
| ITEM\_IF\_ARMOR\_TYPE           | (a)   | handle  | 1767993965  | `itemintegerfield: 0000028BFC7816C0` |         |
| ITEM\_IF\_TINTING\_COLOR\_RED   | (a)   | handle  | 1768123506  | `itemintegerfield: 0000028BFC781700` |         |
| ITEM\_IF\_TINTING\_COLOR\_GREEN | (a)   | handle  | 1768123495  | `itemintegerfield: 0000028BFDD93AF0` |         |
| ITEM\_IF\_TINTING\_COLOR\_BLUE  | (a)   | handle  | 1768123490  | `itemintegerfield: 0000028BFDD93D40` |         |
| ITEM\_IF\_TINTING\_COLOR\_ALPHA | (a)   | handle  | 1768120684  | `itemintegerfield: 0000028BFDD93D80` |         |
| -1                              | (a)   | handle  | -1          | `itemintegerfield: 0000028B1E798A20` |         |
| past the last constant          | (a)   | handle  | 1769304934  | `itemintegerfield: 0000028C01EBBB70` |         |
| 2147483647                      | (a)   | handle  | 2147483647  | `itemintegerfield: 0000028C02562000` |         |
| -2147483648                     | (a)   | handle  | -2147483648 | `itemintegerfield: 0000028C01C3DBC0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertItemRealField`

| Case                     | Group | Outcome | Id          | Type                              | Message |
| ------------------------ | ----- | ------- | ----------- | --------------------------------- | ------- |
| ITEM\_RF\_SCALING\_VALUE | (a)   | handle  | 1769169761  | `itemrealfield: 0000028BFDD939E0` |         |
| -1                       | (a)   | handle  | -1          | `itemrealfield: 0000028B1EBFAB40` |         |
| past the last constant   | (a)   | handle  | 1769169762  | `itemrealfield: 0000028B1EBD6A10` |         |
| 2147483647               | (a)   | handle  | 2147483647  | `itemrealfield: 0000028BFF442D60` |         |
| -2147483648              | (a)   | handle  | -2147483648 | `itemrealfield: 0000028B1E6FE230` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertItemBooleanField`

| Case                                         | Group | Outcome | Id          | Type                                 | Message |
| -------------------------------------------- | ----- | ------- | ----------- | ------------------------------------ | ------- |
| ITEM\_BF\_DROPPED\_WHEN\_CARRIER\_DIES       | (a)   | handle  | 1768190576  | `itembooleanfield: 0000028BFDD93A20` |         |
| ITEM\_BF\_CAN\_BE\_DROPPED                   | (a)   | handle  | 1768190575  | `itembooleanfield: 0000028BFDD93A60` |         |
| ITEM\_BF\_PERISHABLE                         | (a)   | handle  | 1768973682  | `itembooleanfield: 0000028BFC784640` |         |
| ITEM\_BF\_INCLUDE\_AS\_RANDOM\_CHOICE        | (a)   | handle  | 1768977006  | `itembooleanfield: 0000028BFC784710` |         |
| ITEM\_BF\_USE\_AUTOMATICALLY\_WHEN\_ACQUIRED | (a)   | handle  | 1768976247  | `itembooleanfield: 0000028BFC784750` |         |
| ITEM\_BF\_CAN\_BE\_SOLD\_TO\_MERCHANTS       | (a)   | handle  | 1768972663  | `itembooleanfield: 0000028BFC7848A0` |         |
| ITEM\_BF\_ACTIVELY\_USED                     | (a)   | handle  | 1769304929  | `itembooleanfield: 0000028BFC7848E0` |         |
| -1                                           | (a)   | handle  | -1          | `itembooleanfield: 0000028C01EB99F0` |         |
| past the last constant                       | (a)   | handle  | 1769304930  | `itembooleanfield: 0000028C02485780` |         |
| 2147483647                                   | (a)   | handle  | 2147483647  | `itembooleanfield: 0000028C027C2A20` |         |
| -2147483648                                  | (a)   | handle  | -2147483648 | `itembooleanfield: 0000028C0326E0A0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertItemStringField`

| Case                   | Group | Outcome | Id          | Type                                | Message |
| ---------------------- | ----- | ------- | ----------- | ----------------------------------- | ------- |
| ITEM\_SF\_MODEL\_USED  | (a)   | handle  | 1768319340  | `itemstringfield: 0000028BFC784920` |         |
| -1                     | (a)   | handle  | -1          | `itemstringfield: 0000028C03541430` |         |
| past the last constant | (a)   | handle  | 1768319341  | `itemstringfield: 0000028B156A0C70` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `itemstringfield: 0000028C03BCB2B0` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `itemstringfield: 0000028B1E9E3BE0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertMoveType`

| Case                    | Group | Outcome | Id          | Type                         | Message |
| ----------------------- | ----- | ------- | ----------- | ---------------------------- | ------- |
| MOVE\_TYPE\_UNKNOWN     | (a)   | handle  | 0           | `movetype: 0000028BFC77BED0` |         |
| MOVE\_TYPE\_FOOT        | (a)   | handle  | 1           | `movetype: 0000028BFD7B9C50` |         |
| MOVE\_TYPE\_FLY         | (a)   | handle  | 2           | `movetype: 0000028BFD7B9C90` |         |
| MOVE\_TYPE\_HORSE       | (a)   | handle  | 4           | `movetype: 0000028BFD7B9D10` |         |
| MOVE\_TYPE\_HOVER       | (a)   | handle  | 8           | `movetype: 0000028BFD7B9CD0` |         |
| MOVE\_TYPE\_FLOAT       | (a)   | handle  | 16          | `movetype: 0000028BFD7B9E00` |         |
| MOVE\_TYPE\_AMPHIBIOUS  | (a)   | handle  | 32          | `movetype: 0000028BFD7B9ED0` |         |
| MOVE\_TYPE\_UNBUILDABLE | (a)   | handle  | 64          | `movetype: 0000028BFD7B9F10` |         |
| -1                      | (a)   | handle  | -1          | `movetype: 0000028B1E63F7F0` |         |
| past the last constant  | (a)   | handle  | 65          | `movetype: 0000028B1E5ED2D0` |         |
| 2147483647              | (a)   | handle  | 2147483647  | `movetype: 0000028B1E6F8B30` |         |
| -2147483648             | (a)   | handle  | -2147483648 | `movetype: 0000028BFF62C350` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertTargetFlag`

| Case                     | Group | Outcome | Id          | Type                           | Message |
| ------------------------ | ----- | ------- | ----------- | ------------------------------ | ------- |
| TARGET\_FLAG\_NONE       | (a)   | handle  | 1           | `targetflag: 0000028BFD7B9F50` |         |
| TARGET\_FLAG\_GROUND     | (a)   | handle  | 2           | `targetflag: 0000028BFD7B9F90` |         |
| TARGET\_FLAG\_AIR        | (a)   | handle  | 4           | `targetflag: 0000028BFD7B9DB0` |         |
| TARGET\_FLAG\_STRUCTURE  | (a)   | handle  | 8           | `targetflag: 0000028BFD7B9E40` |         |
| TARGET\_FLAG\_WARD       | (a)   | handle  | 16          | `targetflag: 0000028BFD7B9E80` |         |
| TARGET\_FLAG\_ITEM       | (a)   | handle  | 32          | `targetflag: 0000028BFC77C2C0` |         |
| TARGET\_FLAG\_TREE       | (a)   | handle  | 64          | `targetflag: 0000028BFC77C390` |         |
| TARGET\_FLAG\_WALL       | (a)   | handle  | 128         | `targetflag: 0000028BFC77C3D0` |         |
| TARGET\_FLAG\_DEBRIS     | (a)   | handle  | 256         | `targetflag: 0000028BFC77C270` |         |
| TARGET\_FLAG\_DECORATION | (a)   | handle  | 512         | `targetflag: 0000028BFC77C300` |         |
| TARGET\_FLAG\_BRIDGE     | (a)   | handle  | 1024        | `targetflag: 0000028BFC77C340` |         |
| -1                       | (a)   | handle  | -1          | `targetflag: 0000028C037F9FE0` |         |
| past the last constant   | (a)   | handle  | 1025        | `targetflag: 0000028B1E91A040` |         |
| 2147483647               | (a)   | handle  | 2147483647  | `targetflag: 0000028B15B80600` |         |
| -2147483648              | (a)   | handle  | -2147483648 | `targetflag: 0000028B1EBE6070` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertArmorType`

| Case                   | Group | Outcome | Id          | Type                          | Message |
| ---------------------- | ----- | ------- | ----------- | ----------------------------- | ------- |
| ARMOR\_TYPE\_WHOKNOWS  | (a)   | handle  | 0           | `armortype: 0000028BFD44D900` |         |
| ARMOR\_TYPE\_FLESH     | (a)   | handle  | 1           | `armortype: 0000028BFD44D940` |         |
| ARMOR\_TYPE\_METAL     | (a)   | handle  | 2           | `armortype: 0000028BFD44D980` |         |
| ARMOR\_TYPE\_WOOD      | (a)   | handle  | 3           | `armortype: 0000028BFD44DA00` |         |
| ARMOR\_TYPE\_ETHREAL   | (a)   | handle  | 4           | `armortype: 0000028BFD44D9C0` |         |
| ARMOR\_TYPE\_STONE     | (a)   | handle  | 5           | `armortype: 0000028BFD44DAA0` |         |
| -1                     | (a)   | handle  | -1          | `armortype: 0000028B15DEB630` |         |
| past the last constant | (a)   | handle  | 6           | `armortype: 0000028BFF366F60` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `armortype: 0000028B1E8AE5E0` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `armortype: 0000028BFF393E50` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertHeroAttribute`

| Case                   | Group | Outcome | Id          | Type                              | Message |
| ---------------------- | ----- | ------- | ----------- | --------------------------------- | ------- |
| HERO\_ATTRIBUTE\_STR   | (a)   | handle  | 1           | `heroattribute: 0000028BFD778780` |         |
| HERO\_ATTRIBUTE\_INT   | (a)   | handle  | 2           | `heroattribute: 0000028BFD7787C0` |         |
| HERO\_ATTRIBUTE\_AGI   | (a)   | handle  | 3           | `heroattribute: 0000028BFD7785C0` |         |
| -1                     | (a)   | handle  | -1          | `heroattribute: 0000028BFF3839F0` |         |
| past the last constant | (a)   | handle  | 4           | `heroattribute: 0000028B1E6F4830` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `heroattribute: 0000028B1E8BAAF0` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `heroattribute: 0000028BFF357F20` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertDefenseType`

| Case                   | Group | Outcome | Id          | Type                            | Message |
| ---------------------- | ----- | ------- | ----------- | ------------------------------- | ------- |
| DEFENSE\_TYPE\_LIGHT   | (a)   | handle  | 0           | `defensetype: 0000028BFD778480` |         |
| DEFENSE\_TYPE\_MEDIUM  | (a)   | handle  | 1           | `defensetype: 0000028BFD7784C0` |         |
| DEFENSE\_TYPE\_LARGE   | (a)   | handle  | 2           | `defensetype: 0000028BFD778500` |         |
| DEFENSE\_TYPE\_FORT    | (a)   | handle  | 3           | `defensetype: 0000028BFD778580` |         |
| DEFENSE\_TYPE\_NORMAL  | (a)   | handle  | 4           | `defensetype: 0000028BFD778540` |         |
| DEFENSE\_TYPE\_HERO    | (a)   | handle  | 5           | `defensetype: 0000028BFD778620` |         |
| DEFENSE\_TYPE\_DIVINE  | (a)   | handle  | 6           | `defensetype: 0000028BFD778700` |         |
| DEFENSE\_TYPE\_NONE    | (a)   | handle  | 7           | `defensetype: 0000028BFD778740` |         |
| -1                     | (a)   | handle  | -1          | `defensetype: 0000028B1E5E7CD0` |         |
| past the last constant | (a)   | handle  | 8           | `defensetype: 0000028C01DE9770` |         |
| 2147483647             | (a)   | handle  | 2147483647  | `defensetype: 0000028BFF62AED0` |         |
| -2147483648            | (a)   | handle  | -2147483648 | `defensetype: 0000028B1E6FD040` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertRegenType`

| Case                       | Group | Outcome | Id          | Type                          | Message |
| -------------------------- | ----- | ------- | ----------- | ----------------------------- | ------- |
| REGENERATION\_TYPE\_NONE   | (a)   | handle  | 0           | `regentype: 0000028BFD44DB80` |         |
| REGENERATION\_TYPE\_ALWAYS | (a)   | handle  | 1           | `regentype: 0000028BFD44DBC0` |         |
| REGENERATION\_TYPE\_BLIGHT | (a)   | handle  | 2           | `regentype: 0000028BFD44DC00` |         |
| REGENERATION\_TYPE\_DAY    | (a)   | handle  | 3           | `regentype: 0000028BFD44DC80` |         |
| REGENERATION\_TYPE\_NIGHT  | (a)   | handle  | 4           | `regentype: 0000028BFD44DC40` |         |
| -1                         | (a)   | handle  | -1          | `regentype: 0000028C01EBD1B0` |         |
| past the last constant     | (a)   | handle  | 5           | `regentype: 0000028B1E631CD0` |         |
| 2147483647                 | (a)   | handle  | 2147483647  | `regentype: 0000028C0324DF20` |         |
| -2147483648                | (a)   | handle  | -2147483648 | `regentype: 0000028B15E00120` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertUnitCategory`

| Case                       | Group | Outcome | Id          | Type                             | Message |
| -------------------------- | ----- | ------- | ----------- | -------------------------------- | ------- |
| UNIT\_CATEGORY\_GIANT      | (a)   | handle  | 1           | `unitcategory: 0000028BFC777FC0` |         |
| UNIT\_CATEGORY\_UNDEAD     | (a)   | handle  | 2           | `unitcategory: 0000028BFC778000` |         |
| UNIT\_CATEGORY\_SUMMONED   | (a)   | handle  | 4           | `unitcategory: 0000028BFC778080` |         |
| UNIT\_CATEGORY\_MECHANICAL | (a)   | handle  | 8           | `unitcategory: 0000028BFC778040` |         |
| UNIT\_CATEGORY\_PEON       | (a)   | handle  | 16          | `unitcategory: 0000028BFC778120` |         |
| UNIT\_CATEGORY\_SAPPER     | (a)   | handle  | 32          | `unitcategory: 0000028BFC7781B0` |         |
| UNIT\_CATEGORY\_TOWNHALL   | (a)   | handle  | 64          | `unitcategory: 0000028BFC778280` |         |
| UNIT\_CATEGORY\_ANCIENT    | (a)   | handle  | 128         | `unitcategory: 0000028BFC7782C0` |         |
| UNIT\_CATEGORY\_NEUTRAL    | (a)   | handle  | 256         | `unitcategory: 0000028BFC778300` |         |
| UNIT\_CATEGORY\_WARD       | (a)   | handle  | 512         | `unitcategory: 0000028BFC778340` |         |
| UNIT\_CATEGORY\_STANDON    | (a)   | handle  | 1024        | `unitcategory: 0000028BFC778160` |         |
| UNIT\_CATEGORY\_TAUREN     | (a)   | handle  | 2048        | `unitcategory: 0000028BFC7781F0` |         |
| -1                         | (a)   | handle  | -1          | `unitcategory: 0000028C02071970` |         |
| past the last constant     | (a)   | handle  | 2049        | `unitcategory: 0000028C02567090` |         |
| 2147483647                 | (a)   | handle  | 2147483647  | `unitcategory: 0000028B16F4DE90` |         |
| -2147483648                | (a)   | handle  | -2147483648 | `unitcategory: 0000028B1E63E820` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertPathingFlag`

| Case                          | Group | Outcome | Id          | Type                            | Message |
| ----------------------------- | ----- | ------- | ----------- | ------------------------------- | ------- |
| PATHING\_FLAG\_UNWALKABLE     | (a)   | handle  | 2           | `pathingflag: 0000028BFC778230` |         |
| PATHING\_FLAG\_UNFLYABLE      | (a)   | handle  | 4           | `pathingflag: 0000028BFC78B440` |         |
| PATHING\_FLAG\_UNBUILDABLE    | (a)   | handle  | 8           | `pathingflag: 0000028BFC78B4D0` |         |
| PATHING\_FLAG\_UNPEONHARVEST  | (a)   | handle  | 16          | `pathingflag: 0000028BFC78B1B0` |         |
| PATHING\_FLAG\_BLIGHTED       | (a)   | handle  | 32          | `pathingflag: 0000028BFC78B1F0` |         |
| PATHING\_FLAG\_UNFLOATABLE    | (a)   | handle  | 64          | `pathingflag: 0000028BFC78B480` |         |
| PATHING\_FLAG\_UNAMPHIBIOUS   | (a)   | handle  | 128         | `pathingflag: 0000028BFC78B120` |         |
| PATHING\_FLAG\_UNITEMPLACABLE | (a)   | handle  | 256         | `pathingflag: 0000028BFC78B160` |         |
| -1                            | (a)   | handle  | -1          | `pathingflag: 0000028B1E61B920` |         |
| past the last constant        | (a)   | handle  | 257         | `pathingflag: 0000028BFF62C8E0` |         |
| 2147483647                    | (a)   | handle  | 2147483647  | `pathingflag: 0000028B1EBF7970` |         |
| -2147483648                   | (a)   | handle  | -2147483648 | `pathingflag: 0000028C0206F460` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertFogStyle`

| Case                    | Group | Outcome | Id          | Type                         | Message |
| ----------------------- | ----- | ------- | ----------- | ---------------------------- | ------- |
| FOG\_STYLE\_LINEAR      | (a)   | handle  | 0           | `fogstyle: 0000028BFBB8E070` |         |
| FOG\_STYLE\_EXP         | (a)   | handle  | 1           | `fogstyle: 0000028BFBBAA570` |         |
| FOG\_STYLE\_EXP2        | (a)   | handle  | 2           | `fogstyle: 0000028BFBBAA5B0` |         |
| FOG\_STYLE\_HEIGHT      | (a)   | handle  | 3           | `fogstyle: 0000028BFBCBF700` |         |
| FOG\_STYLE\_NEW\_EXP    | (a)   | handle  | 4           | `fogstyle: 0000028BFBCBF6C0` |         |
| FOG\_STYLE\_NEW\_EXP\_2 | (a)   | handle  | 5           | `fogstyle: 0000028BFBC88330` |         |
| -1                      | (a)   | handle  | -1          | `fogstyle: 0000028C037CB1D0` |         |
| past the last constant  | (a)   | handle  | 6           | `fogstyle: 0000028C02D07410` |         |
| 2147483647              | (a)   | handle  | 2147483647  | `fogstyle: 0000028B1E5F0950` |         |
| -2147483648             | (a)   | handle  | -2147483648 | `fogstyle: 0000028C02E5F130` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertEquipmentType`

| Case                     | Group | Outcome | Id          | Type                              | Message |
| ------------------------ | ----- | ------- | ----------- | --------------------------------- | ------- |
| EQUIPMENT\_TYPE\_NONE    | (a)   | handle  | 0           | `equipmentType: 0000028BFBC60FF0` |         |
| EQUIPMENT\_TYPE\_HEAD    | (a)   | handle  | 1           | `equipmentType: 0000028BFBC61030` |         |
| EQUIPMENT\_TYPE\_CHEST   | (a)   | handle  | 2           | `equipmentType: 0000028BFBCBFE20` |         |
| EQUIPMENT\_TYPE\_GLOVES  | (a)   | handle  | 3           | `equipmentType: 0000028BFBB8C740` |         |
| EQUIPMENT\_TYPE\_BOOTS   | (a)   | handle  | 4           | `equipmentType: 0000028BFBB8C780` |         |
| EQUIPMENT\_TYPE\_RING    | (a)   | handle  | 5           | `equipmentType: 0000028BFBCAA3B0` |         |
| EQUIPMENT\_TYPE\_PRIMARY | (a)   | handle  | 6           | `equipmentType: 0000028BFBCAA3F0` |         |
| EQUIPMENT\_TYPE\_OFFHAND | (a)   | handle  | 7           | `equipmentType: 0000028BFBCBFE60` |         |
| EQUIPMENT\_TYPE\_TRINKET | (a)   | handle  | 8           | `equipmentType: 0000028BFBC9E680` |         |
| EQUIPMENT\_TYPE\_ANY     | (a)   | handle  | 9           | `equipmentType: 0000028BFBC9E6C0` |         |
| -1                       | (a)   | handle  | -1          | `equipmentType: 0000028C024F9540` |         |
| past the last constant   | (a)   | handle  | 10          | `equipmentType: 0000028C024FAD70` |         |
| 2147483647               | (a)   | handle  | 2147483647  | `equipmentType: 0000028B1E5C3E60` |         |
| -2147483648              | (a)   | handle  | -2147483648 | `equipmentType: 0000028C02ED05C0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertItemTag`

| Case                       | Group | Outcome | Id          | Type                        | Message |
| -------------------------- | ----- | ------- | ----------- | --------------------------- | ------- |
| ITEMTAG\_TYPE\_UNDEFINED   | (a)   | handle  | 0           | `itemTag: 0000028BFBBACBC0` |         |
| ITEMTAG\_TYPE\_DROPPABLE   | (a)   | handle  | 1           | `itemTag: 0000028BFBBACC00` |         |
| ITEMTAG\_TYPE\_QUESTREWARD | (a)   | handle  | 2           | `itemTag: 0000028BFC772A70` |         |
| ITEMTAG\_TYPE\_BOSSDROP    | (a)   | handle  | 3           | `itemTag: 0000028BFBB79620` |         |
| ITEMTAG\_TYPE\_SECRET      | (a)   | handle  | 4           | `itemTag: 0000028BFBB79660` |         |
| ITEMTAG\_TYPE\_PUZZLE      | (a)   | handle  | 5           | `itemTag: 0000028BFBC23FE0` |         |
| ITEMTAG\_TYPE\_WORLD       | (a)   | handle  | 6           | `itemTag: 0000028BFBC24020` |         |
| ITEMTAG\_TYPE\_SHOP        | (a)   | handle  | 7           | `itemTag: 0000028BFC772AB0` |         |
| ITEMTAG\_TYPE\_ANY         | (a)   | handle  | 8           | `itemTag: 0000028BFBBF29E0` |         |
| -1                         | (a)   | handle  | -1          | `itemTag: 0000028B150DB420` |         |
| past the last constant     | (a)   | handle  | 9           | `itemTag: 0000028B15441C10` |         |
| 2147483647                 | (a)   | handle  | 2147483647  | `itemTag: 0000028B15F8F480` |         |
| -2147483648                | (a)   | handle  | -2147483648 | `itemTag: 0000028BF80EE4E0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

### `ConvertLoadoutSlot`

| Case                              | Group | Outcome | Id          | Type                            | Message |
| --------------------------------- | ----- | ------- | ----------- | ------------------------------- | ------- |
| EQUIPMENT\_LOADOUT\_SLOT\_HEAD    | (a)   | handle  | 0           | `loadoutslot: 0000028BFBBF2A20` |         |
| EQUIPMENT\_LOADOUT\_SLOT\_CHEST   | (a)   | handle  | 1           | `loadoutslot: 0000028BFBD0BF20` |         |
| EQUIPMENT\_LOADOUT\_SLOT\_GLOVES  | (a)   | handle  | 2           | `loadoutslot: 0000028BFBD0BF60` |         |
| EQUIPMENT\_LOADOUT\_SLOT\_BOOTS   | (a)   | handle  | 3           | `loadoutslot: 0000028BFBCEF350` |         |
| EQUIPMENT\_LOADOUT\_SLOT\_RING    | (a)   | handle  | 4           | `loadoutslot: 0000028BFBCEF310` |         |
| EQUIPMENT\_LOADOUT\_SLOT\_RINGALT | (a)   | handle  | 5           | `loadoutslot: 0000028BFBBD82C0` |         |
| EQUIPMENT\_LOADOUT\_SLOT\_PRIMARY | (a)   | handle  | 6           | `loadoutslot: 0000028BFBBD8260` |         |
| EQUIPMENT\_LOADOUT\_SLOT\_OFFHAND | (a)   | handle  | 7           | `loadoutslot: 0000028BFBCFC740` |         |
| EQUIPMENT\_LOADOUT\_SLOT\_TRINKET | (a)   | handle  | 8           | `loadoutslot: 0000028BFBCFC780` |         |
| -1                                | (a)   | handle  | -1          | `loadoutslot: 0000028BFF361850` |         |
| past the last constant            | (a)   | handle  | 9           | `loadoutslot: 0000028BFF380DB0` |         |
| 2147483647                        | (a)   | handle  | 2147483647  | `loadoutslot: 0000028C02030150` |         |
| -2147483648                       | (a)   | handle  | -2147483648 | `loadoutslot: 0000028B1E79B1B0` |         |

- Family: `converter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.1.24370); the handle's id is the integer passed in. Evidence, not proof.

## `nullability-event-responses-1`

- Probe: `nullability-event-responses-1`
- Patch: 3.0.1.24370
- Client: 3.0.1.24371
- Date: 2026-10-21
- Run: `396ce44e-822f-485a-b6cd-74409bb106c9`

### `GetTriggeringTrigger`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetTriggerEventId`

| Case              | Group | Outcome | Id  | Type                        | Message |
| ----------------- | ----- | ------- | --- | --------------------------- | ------- |
| outside its event | (a)   | handle  | 0   | `eventid: 00000253FE03E970` |         |

- Family: `event-response`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing outside its event. Returned a handle in every case of the nullability sweep (outside its event) on 3.0.1.24370. The handle had id 0 in a case (outside its event).

### `GetEventGameState`

| Case              | Group | Outcome | Id  | Type                          | Message |
| ----------------- | ----- | ------- | --- | ----------------------------- | ------- |
| outside its event | (a)   | handle  | 0   | `gamestate: 00000253FE0436E0` |         |

- Family: `event-response`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing outside its event. Returned a handle in every case of the nullability sweep (outside its event) on 3.0.1.24370. The handle had id 0 in a case (outside its event).

### `GetWinningPlayer`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetTriggeringRegion`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetEnteringUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetLeavingUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetTriggeringTrackable`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetClickedButton`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetClickedDialog`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetTournamentFinishNowPlayer`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetTriggerPlayer`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetLevelingUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetLearningUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetRevivableUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetRevivingUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetAttacker`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetRescuer`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetDyingUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetKillingUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetDecayingUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetConstructingStructure`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetCancelledStructure`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetConstructedStructure`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetResearchingUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetTrainedUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetDetectedUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetSummoningUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetSummonedUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetTransportUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetLoadedUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetSellingUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetSoldUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetBuyingUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetSoldItem`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetChangingUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetChangingUnitPrevOwner`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

## `nullability-event-responses-2`

- Probe: `nullability-event-responses-2`
- Patch: 3.0.1.24370
- Client: 3.0.1.24371
- Date: 2026-10-21
- Run: `e36398a0-5640-4bd2-8528-fb6d0b5b0ca2`

### `GetManipulatingUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetManipulatedItem`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetEquippedItem`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `BlzGetEquippedItem`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetUnequippedItem`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `BlzGetUnequippedItem`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `BlzGetAbsorbingItem`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `BlzGetStackingItemSource`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `BlzGetStackingItemTarget`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetOrderedUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetOrderPointLoc`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetOrderTarget`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetOrderTargetDestructable`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetOrderTargetItem`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetOrderTargetUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetSpellAbilityUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetSpellAbility`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetSpellTargetLoc`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetSpellTargetDestructable`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetSpellTargetItem`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetSpellTargetUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetEventPlayerState`

| Case              | Group | Outcome | Id  | Type                            | Message |
| ----------------- | ----- | ------- | --- | ------------------------------- | ------- |
| outside its event | (a)   | handle  | 0   | `playerstate: 00000234DF8B6990` |         |

- Family: `event-response`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing outside its event. Returned a handle in every case of the nullability sweep (outside its event) on 3.0.1.24370. The handle had id 0 in a case (outside its event).

### `GetTriggerUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetEventUnitState`

| Case              | Group | Outcome | Id  | Type                          | Message |
| ----------------- | ----- | ------- | --- | ----------------------------- | ------- |
| outside its event | (a)   | handle  | 0   | `unitstate: 00000234DF60EAB0` |         |

- Family: `event-response`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing outside its event. Returned a handle in every case of the nullability sweep (outside its event) on 3.0.1.24370. The handle had id 0 in a case (outside its event).

### `GetEventDamageSource`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetEventDetectingPlayer`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetEventTargetUnit`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetTriggerWidget`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `GetTriggerDestructable`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `BlzGetTriggerPlayerMousePosition`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `BlzGetTriggerPlayerMouseButton`

| Case              | Group | Outcome | Id  | Type                                | Message |
| ----------------- | ----- | ------- | --- | ----------------------------------- | ------- |
| outside its event | (a)   | handle  | 0   | `mousebuttontype: 00000234FB4F7DA0` |         |

- Family: `event-response`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing outside its event. Returned a handle in every case of the nullability sweep (outside its event) on 3.0.1.24370. The handle had id 0 in a case (outside its event).

### `BlzGetEventDamageTarget`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `BlzGetEventAttackType`

| Case              | Group | Outcome | Id  | Type                           | Message |
| ----------------- | ----- | ------- | --- | ------------------------------ | ------- |
| outside its event | (a)   | handle  | -1  | `attacktype: 00000234FB4EE2B0` |         |

- Family: `event-response`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing outside its event. Returned a handle in every case of the nullability sweep (outside its event) on 3.0.1.24370. The handle had id -1 in a case (outside its event).

### `BlzGetEventDamageType`

| Case              | Group | Outcome | Id  | Type                           | Message |
| ----------------- | ----- | ------- | --- | ------------------------------ | ------- |
| outside its event | (a)   | handle  | 0   | `damagetype: 00000234DE7E8D60` |         |

- Family: `event-response`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing outside its event. Returned a handle in every case of the nullability sweep (outside its event) on 3.0.1.24370. The handle had id 0 in a case (outside its event).

### `BlzGetEventWeaponType`

| Case              | Group | Outcome | Id  | Type                           | Message |
| ----------------- | ----- | ------- | --- | ------------------------------ | ------- |
| outside its event | (a)   | handle  | 0   | `weapontype: 00000234DF744150` |         |

- Family: `event-response`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing outside its event. Returned a handle in every case of the nullability sweep (outside its event) on 3.0.1.24370. The handle had id 0 in a case (outside its event).

### `BlzGetTriggerFrame`

| Case              | Group | Outcome | Id  | Type | Message |
| ----------------- | ----- | ------- | --- | ---- | ------- |
| outside its event | (a)   | nil     |     |      |         |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its event) on 3.0.1.24370.

### `BlzGetTriggerFrameEvent`

| Case              | Group | Outcome | Id  | Type                               | Message |
| ----------------- | ----- | ------- | --- | ---------------------------------- | ------- |
| outside its event | (a)   | handle  | 0   | `frameeventtype: 00000234FB91F700` |         |

- Family: `event-response`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing outside its event. Returned a handle in every case of the nullability sweep (outside its event) on 3.0.1.24370. The handle had id 0 in a case (outside its event).

### `BlzGetTriggerPlayerKey`

| Case              | Group | Outcome | Id  | Type                          | Message |
| ----------------- | ----- | ------- | --- | ----------------------------- | ------- |
| outside its event | (a)   | handle  | 0   | `oskeytype: 00000234FB9197E0` |         |

- Family: `event-response`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing outside its event. Returned a handle in every case of the nullability sweep (outside its event) on 3.0.1.24370. The handle had id 0 in a case (outside its event).

## `nullability-lookups-1`

- Probe: `nullability-lookups-1`
- Patch: 3.0.1.24370
- Client: 3.0.1.24371
- Date: 2026-10-21
- Run: `e90710de-8d9d-40ad-b30f-bda1f2605752`

### `GetStartLocationLoc`

| Case               | Group | Outcome | Id  | Type | Message |
| ------------------ | ----- | ------- | --- | ---- | ------- |
| index out of range | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (index out of range) on 3.0.1.24370.

### `BlzGroupUnitAt`

| Case               | Group | Outcome | Id  | Type | Message |
| ------------------ | ----- | ------- | --- | ---- | ------- |
| index out of range | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (index out of range) on 3.0.1.24370.

### `FirstOfGroup`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| empty group | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (empty group) on 3.0.1.24370.

### `UnitRemoveItemFromSlot`

| Case       | Group | Outcome | Id  | Type | Message |
| ---------- | ----- | ------- | --- | ---- | ------- |
| empty slot | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (empty slot) on 3.0.1.24370.

### `UnitUnequipItemFromSlot`

| Case       | Group | Outcome | Id  | Type | Message |
| ---------- | ----- | ------- | --- | ---- | ------- |
| empty slot | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (empty slot) on 3.0.1.24370.

### `UnitItemInSlot`

| Case       | Group | Outcome | Id  | Type | Message |
| ---------- | ----- | ------- | --- | ---- | ------- |
| empty slot | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (empty slot) on 3.0.1.24370.

### `UnitItemInBagSlot`

| Case       | Group | Outcome | Id  | Type | Message |
| ---------- | ----- | ------- | --- | ---- | ------- |
| empty slot | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (empty slot) on 3.0.1.24370.

### `UnitItemInEquipmentSlot`

| Case       | Group | Outcome | Id  | Type | Message |
| ---------- | ----- | ------- | --- | ---- | ------- |
| empty slot | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (empty slot) on 3.0.1.24370.

### `Player`

| Case               | Group | Outcome | Id  | Type | Message |
| ------------------ | ----- | ------- | --- | ---- | ------- |
| index out of range | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (index out of range) on 3.0.1.24370.

### `RestoreUnit`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadPlayerHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadWidgetHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadDestructableHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadItemHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadUnitHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadAbilityHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadTimerHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadTriggerHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadTriggerConditionHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadTriggerActionHandle`

| Case        | Group | Outcome | Id  | Type                              | Message |
| ----------- | ----- | ------- | --- | --------------------------------- | ------- |
| unsaved key | (a)   | handle  | 0   | `triggeraction: 0000013321051680` |         |

- Family: `lookup`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing when nothing is found. Returned a handle in every case of the nullability sweep (unsaved key) on 3.0.1.24370. The handle had id 0 in a case (unsaved key).

### `LoadTriggerEventHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadForceHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadGroupHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadLocationHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadRectHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadBooleanExprHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadSoundHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadEffectHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

## `nullability-lookups-2`

- Probe: `nullability-lookups-2`
- Patch: 3.0.1.24370
- Client: 3.0.1.24371
- Date: 2026-10-21
- Run: `badec539-fa7f-45a2-81b8-2d1bbf570cd4`

### `LoadUnitPoolHandle`

| Case        | Group | Outcome | Id  | Type                         | Message |
| ----------- | ----- | ------- | --- | ---------------------------- | ------- |
| unsaved key | (a)   | handle  | 0   | `unitpool: 0000023E83118D50` |         |

- Family: `lookup`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing when nothing is found. Returned a handle in every case of the nullability sweep (unsaved key) on 3.0.1.24370. The handle had id 0 in a case (unsaved key).

### `LoadItemPoolHandle`

| Case        | Group | Outcome | Id  | Type                         | Message |
| ----------- | ----- | ------- | --- | ---------------------------- | ------- |
| unsaved key | (a)   | handle  | 0   | `itempool: 0000023E83118D10` |         |

- Family: `lookup`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing when nothing is found. Returned a handle in every case of the nullability sweep (unsaved key) on 3.0.1.24370. The handle had id 0 in a case (unsaved key).

### `LoadQuestHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadQuestItemHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadDefeatConditionHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadTimerDialogHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadLeaderboardHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadMultiboardHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadMultiboardItemHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadTrackableHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadDialogHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadButtonHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadTextTagHandle`

| Case        | Group | Outcome | Id  | Type                        | Message |
| ----------- | ----- | ------- | --- | --------------------------- | ------- |
| unsaved key | (a)   | handle  | 0   | `texttag: 0000023E83E65E80` |         |

- Family: `lookup`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing when nothing is found. Returned a handle in every case of the nullability sweep (unsaved key) on 3.0.1.24370. The handle had id 0 in a case (unsaved key).

### `LoadLightningHandle`

| Case        | Group | Outcome | Id  | Type                          | Message |
| ----------- | ----- | ------- | --- | ----------------------------- | ------- |
| unsaved key | (a)   | handle  | 0   | `lightning: 0000023E83E6B470` |         |

- Family: `lookup`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing when nothing is found. Returned a handle in every case of the nullability sweep (unsaved key) on 3.0.1.24370. The handle had id 0 in a case (unsaved key).

### `LoadImageHandle`

| Case        | Group | Outcome | Id  | Type                      | Message |
| ----------- | ----- | ------- | --- | ------------------------- | ------- |
| unsaved key | (a)   | handle  | 0   | `image: 0000023E83E6FB40` |         |

- Family: `lookup`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing when nothing is found. Returned a handle in every case of the nullability sweep (unsaved key) on 3.0.1.24370. The handle had id 0 in a case (unsaved key).

### `LoadUbersplatHandle`

| Case        | Group | Outcome | Id  | Type                          | Message |
| ----------- | ----- | ------- | --- | ----------------------------- | ------- |
| unsaved key | (a)   | handle  | 0   | `ubersplat: 0000023E83E751B0` |         |

- Family: `lookup`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing when nothing is found. Returned a handle in every case of the nullability sweep (unsaved key) on 3.0.1.24370. The handle had id 0 in a case (unsaved key).

### `LoadRegionHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadFogStateHandle`

| Case        | Group | Outcome | Id  | Type                         | Message |
| ----------- | ----- | ------- | --- | ---------------------------- | ------- |
| unsaved key | (a)   | handle  | 0   | `fogstate: 0000023E83E807C0` |         |

- Family: `lookup`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing when nothing is found. Returned a handle in every case of the nullability sweep (unsaved key) on 3.0.1.24370. The handle had id 0 in a case (unsaved key).

### `LoadFogModifierHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadHashtableHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `LoadFrameHandle`

| Case        | Group | Outcome | Id  | Type | Message |
| ----------- | ----- | ------- | --- | ---- | ------- |
| unsaved key | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.1.24370.

### `MultiboardGetItem`

| Case               | Group | Outcome | Id      | Type                               | Message |
| ------------------ | ----- | ------- | ------- | ---------------------------------- | ------- |
| index out of range | (a)   | handle  | 1048783 | `multiboarditem: 0000023E83E87210` |         |

- Family: `lookup`
- Verdict: nullable (rule)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: May return nothing when nothing is found. Returned a handle in every case of the nullability sweep (index out of range) on 3.0.1.24370.

### `BlzGetOriginFrame`

| Case                    | Group | Outcome | Id  | Type | Message |
| ----------------------- | ----- | ------- | --- | ---- | ------- |
| frame type out of range | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (frame type out of range) on 3.0.1.24370.

### `BlzGetFrameByName`

| Case         | Group | Outcome | Id  | Type | Message |
| ------------ | ----- | ------- | --- | ---- | ------- |
| unknown name | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unknown name) on 3.0.1.24370.

### `BlzGetUnitAbility`

| Case             | Group | Outcome | Id  | Type | Message |
| ---------------- | ----- | ------- | --- | ---- | ------- |
| ability it lacks | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (ability it lacks) on 3.0.1.24370.

### `BlzGetUnitAbilityByIndex`

| Case               | Group | Outcome | Id  | Type | Message |
| ------------------ | ----- | ------- | --- | ---- | ------- |
| index out of range | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (index out of range) on 3.0.1.24370.

### `BlzGetItemAbilityByIndex`

| Case               | Group | Outcome | Id  | Type | Message |
| ------------------ | ----- | ------- | --- | ---- | ------- |
| index out of range | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (index out of range) on 3.0.1.24370.

### `BlzGetItemAbility`

| Case             | Group | Outcome | Id  | Type | Message |
| ---------------- | ----- | ------- | --- | ---- | ------- |
| ability it lacks | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (ability it lacks) on 3.0.1.24370.

### `BlzUnitUnequipItemFromSlot`

| Case       | Group | Outcome | Id  | Type | Message |
| ---------- | ----- | ------- | --- | ---- | ------- |
| empty slot | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (empty slot) on 3.0.1.24370.

### `BlzUnitItemInBagSlot`

| Case       | Group | Outcome | Id  | Type | Message |
| ---------- | ----- | ------- | --- | ---- | ------- |
| empty slot | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (empty slot) on 3.0.1.24370.

### `BlzUnitItemInEquipmentSlot`

| Case       | Group | Outcome | Id  | Type | Message |
| ---------- | ----- | ------- | --- | ---- | ------- |
| empty slot | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (empty slot) on 3.0.1.24370.

## `nullability-callbacks-and-properties`

- Probe: `nullability-callbacks-and-properties`
- Patch: 3.0.1.24370
- Client: 3.0.1.24371
- Date: 2026-10-21
- Run: `b3955283-eb49-429c-8a59-ff469ed48298`

### `GetFilterUnit`

| Case                 | Group | Outcome | Id  | Type | Message |
| -------------------- | ----- | ------- | --- | ---- | ------- |
| outside its callback | (a)   | nil     |     |      |         |

- Family: `callback-getter`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its callback) on 3.0.1.24370.

### `GetEnumUnit`

| Case                 | Group | Outcome | Id  | Type | Message |
| -------------------- | ----- | ------- | --- | ---- | ------- |
| outside its callback | (a)   | nil     |     |      |         |

- Family: `callback-getter`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its callback) on 3.0.1.24370.

### `GetFilterDestructable`

| Case                 | Group | Outcome | Id  | Type | Message |
| -------------------- | ----- | ------- | --- | ---- | ------- |
| outside its callback | (a)   | nil     |     |      |         |

- Family: `callback-getter`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its callback) on 3.0.1.24370.

### `GetEnumDestructable`

| Case                 | Group | Outcome | Id  | Type | Message |
| -------------------- | ----- | ------- | --- | ---- | ------- |
| outside its callback | (a)   | nil     |     |      |         |

- Family: `callback-getter`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its callback) on 3.0.1.24370.

### `GetFilterItem`

| Case                 | Group | Outcome | Id  | Type | Message |
| -------------------- | ----- | ------- | --- | ---- | ------- |
| outside its callback | (a)   | nil     |     |      |         |

- Family: `callback-getter`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its callback) on 3.0.1.24370.

### `GetEnumItem`

| Case                 | Group | Outcome | Id  | Type | Message |
| -------------------- | ----- | ------- | --- | ---- | ------- |
| outside its callback | (a)   | nil     |     |      |         |

- Family: `callback-getter`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its callback) on 3.0.1.24370.

### `GetFilterPlayer`

| Case                 | Group | Outcome | Id  | Type | Message |
| -------------------- | ----- | ------- | --- | ---- | ------- |
| outside its callback | (a)   | nil     |     |      |         |

- Family: `callback-getter`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its callback) on 3.0.1.24370.

### `GetEnumPlayer`

| Case                 | Group | Outcome | Id  | Type | Message |
| -------------------- | ----- | ------- | --- | ---- | ------- |
| outside its callback | (a)   | nil     |     |      |         |

- Family: `callback-getter`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (outside its callback) on 3.0.1.24370.

### `GetUnitRallyPoint`

| Case                     | Group | Outcome | Id  | Type | Message |
| ------------------------ | ----- | ------- | --- | ---- | ------- |
| unit with no rally point | (a)   | nil     |     |      |         |

- Family: `optional-property`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unit with no rally point) on 3.0.1.24370.

### `GetUnitRallyUnit`

| Case                     | Group | Outcome | Id  | Type | Message |
| ------------------------ | ----- | ------- | --- | ---- | ------- |
| unit with no rally point | (a)   | nil     |     |      |         |

- Family: `optional-property`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unit with no rally point) on 3.0.1.24370.

### `GetUnitRallyDestructable`

| Case                     | Group | Outcome | Id  | Type | Message |
| ------------------------ | ----- | ------- | --- | ---- | ------- |
| unit with no rally point | (a)   | nil     |     |      |         |

- Family: `optional-property`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unit with no rally point) on 3.0.1.24370.

### `PlayerGetLeaderboard`

| Case                       | Group | Outcome | Id  | Type | Message |
| -------------------------- | ----- | ------- | --- | ---- | ------- |
| player with no leaderboard | (a)   | nil     |     |      |         |

- Family: `optional-property`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (player with no leaderboard) on 3.0.1.24370.

### `BlzFrameGetParent`

| Case                   | Group | Outcome | Id  | Type | Message |
| ---------------------- | ----- | ------- | --- | ---- | ------- |
| game UI's parent frame | (a)   | nil     |     |      |         |

- Family: `optional-property`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (game UI's parent frame) on 3.0.1.24370.

### `BlzGetMouseFocusUnit`

| Case           | Group | Outcome | Id  | Type | Message |
| -------------- | ----- | ------- | --- | ---- | ------- |
| no mouse input | (a)   | nil     |     |      |         |

- Family: `optional-property`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (no mouse input) on 3.0.1.24370.

## `nullability-getters`

- Probe: `nullability-getters`
- Patch: 3.0.1.24370
- Client: 3.0.1.24371
- Date: 2026-10-21
- Run: `e2ff1c94-fa63-4991-a8fd-503edee97b28`

### `GetStartLocPrio`

| Case                             | Group | Outcome | Id  | Type                             | Message |
| -------------------------------- | ----- | ------- | --- | -------------------------------- | ------- |
| typical arguments                | (a)   | handle  | 0   | `startlocprio: 000001E9CFA8C3E0` |         |
| whichStartLoc: negative          | (a)   | handle  | 0   | `startlocprio: 000001E9CFA8C3E0` |         |
| whichStartLoc: outside the world | (a)   | handle  | 0   | `startlocprio: 000001E9CFA8C3E0` |         |
| whichStartLoc: 2147483647        | (a)   | handle  | 0   | `startlocprio: 000001E9CFA8C3E0` |         |
| prioSlotIndex: negative          | (a)   | handle  | 0   | `startlocprio: 000001E9CFA8C3E0` |         |
| prioSlotIndex: outside the world | (a)   | handle  | 0   | `startlocprio: 000001E9CFA8C3E0` |         |
| prioSlotIndex: 2147483647        | (a)   | handle  | 0   | `startlocprio: 000001E9CFA8C3E0` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichStartLoc: negative, whichStartLoc: outside the world, whichStartLoc: 2147483647, prioSlotIndex: negative, prioSlotIndex: outside the world, prioSlotIndex: 2147483647) on 3.0.1.24370; evidence, not proof. The handle had id 0 in 7 cases (typical arguments, whichStartLoc: negative, whichStartLoc: outside the world, whichStartLoc: 2147483647, prioSlotIndex: negative, prioSlotIndex: outside the world, prioSlotIndex: 2147483647).

### `GetGameTypeSelected`

| Case     | Group | Outcome | Id  | Type                         | Message |
| -------- | ----- | ------- | --- | ---------------------------- | ------- |
| one call | (a)   | handle  | 1   | `gametype: 000001E9CFC87720` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.1.24370; evidence, not proof.

### `GetGamePlacement`

| Case     | Group | Outcome | Id  | Type                          | Message |
| -------- | ----- | ------- | --- | ----------------------------- | ------- |
| one call | (a)   | handle  | 2   | `placement: 000001E9CFA8C3A0` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.1.24370; evidence, not proof.

### `GetGameSpeed`

| Case     | Group | Outcome | Id  | Type                          | Message |
| -------- | ----- | ------- | --- | ----------------------------- | ------- |
| one call | (a)   | handle  | 2   | `gamespeed: 000001E9CFBAFE30` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.1.24370; evidence, not proof.

### `GetGameDifficulty`

| Case     | Group | Outcome | Id  | Type                               | Message |
| -------- | ----- | ------- | --- | ---------------------------------- | ------- |
| one call | (a)   | handle  | 0   | `gamedifficulty: 000001E9CFBAFB50` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.1.24370; evidence, not proof. The handle had id 0 in a case (one call).

### `GetResourceDensity`

| Case     | Group | Outcome | Id  | Type                           | Message |
| -------- | ----- | ------- | --- | ------------------------------ | ------- |
| one call | (a)   | handle  | 2   | `mapdensity: 000001E9CFBAFB10` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.1.24370; evidence, not proof.

### `GetCreatureDensity`

| Case     | Group | Outcome | Id  | Type                           | Message |
| -------- | ----- | ------- | --- | ------------------------------ | ------- |
| one call | (a)   | handle  | 0   | `mapdensity: 000001E9CFA8C580` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.1.24370; evidence, not proof. The handle had id 0 in a case (one call).

### `GetPlayerColor`

| Case                        | Group | Outcome | Id  | Type                            | Message |
| --------------------------- | ----- | ------- | --- | ------------------------------- | ------- |
| typical arguments           | (a)   | handle  | 0   | `playercolor: 000001E9CFA90C80` |         |
| whichPlayer: empty slot     | (a)   | handle  | 23  | `playercolor: 000001E9CFA81150` |         |
| whichPlayer: neutral player | (a)   | handle  | 27  | `playercolor: 000001E9E92A8AD0` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichPlayer: empty slot, whichPlayer: neutral player) on 3.0.1.24370; evidence, not proof. The handle had id 0 in a case (typical arguments).

### `GetPlayerController`

| Case                        | Group | Outcome | Id  | Type                           | Message |
| --------------------------- | ----- | ------- | --- | ------------------------------ | ------- |
| typical arguments           | (a)   | handle  | 0   | `mapcontrol: 000001E9CFC57910` |         |
| whichPlayer: empty slot     | (a)   | handle  | 5   | `mapcontrol: 000001E9CFC57A50` |         |
| whichPlayer: neutral player | (a)   | handle  | 4   | `mapcontrol: 000001E9CFC579D0` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichPlayer: empty slot, whichPlayer: neutral player) on 3.0.1.24370; evidence, not proof. The handle had id 0 in a case (typical arguments).

### `GetPlayerSlotState`

| Case                        | Group | Outcome | Id  | Type                                | Message |
| --------------------------- | ----- | ------- | --- | ----------------------------------- | ------- |
| typical arguments           | (a)   | handle  | 1   | `playerslotstate: 000001E9CF8EC8B0` |         |
| whichPlayer: empty slot     | (a)   | handle  | 0   | `playerslotstate: 000001E9CF8EC870` |         |
| whichPlayer: neutral player | (a)   | handle  | 1   | `playerslotstate: 000001E9CF8EC8B0` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichPlayer: empty slot, whichPlayer: neutral player) on 3.0.1.24370; evidence, not proof. The handle had id 0 in a case (whichPlayer: empty slot).

### `GetWorldBounds`

| Case     | Group | Outcome | Id      | Type                     | Message |
| -------- | ----- | ------- | ------- | ------------------------ | ------- |
| one call | (a)   | handle  | 1048785 | `rect: 000001EA40F09B30` |         |

- Family: `intrinsic-property`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.1.24370; evidence, not proof.

### `GetItemPlayer`

| Case                    | Group | Outcome | Id      | Type                       | Message |
| ----------------------- | ----- | ------- | ------- | -------------------------- | ------- |
| typical arguments       | (a)   | handle  | 1048648 | `player: 000001E9E34556D0` |         |
| whichItem: dead item    | (b)   | handle  | 1048648 | `player: 000001E9E34556D0` |         |
| whichItem: removed item | (b)   | nil     |         |                            |         |

- Family: `intrinsic-property`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichItem: removed item) on 3.0.1.24370.

### `GetItemType`

| Case                    | Group | Outcome | Id  | Type                         | Message |
| ----------------------- | ----- | ------- | --- | ---------------------------- | ------- |
| typical arguments       | (a)   | handle  | 3   | `itemtype: 000001E9CF81CD70` |         |
| whichItem: dead item    | (b)   | handle  | 3   | `itemtype: 000001E9CF81CD70` |         |
| whichItem: removed item | (b)   | handle  | 8   | `itemtype: 000001E9CFCB6ED0` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichItem: dead item, whichItem: removed item) on 3.0.1.24370; evidence, not proof.

### `GetItemEquipmentType`

| Case                    | Group | Outcome | Id  | Type                              | Message |
| ----------------------- | ----- | ------- | --- | --------------------------------- | ------- |
| typical arguments       | (a)   | handle  | 0   | `equipmentType: 000001E9CFCB7070` |         |
| whichItem: dead item    | (b)   | handle  | 0   | `equipmentType: 000001E9CFCB7070` |         |
| whichItem: removed item | (b)   | handle  | 0   | `equipmentType: 000001E9CFCB7070` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichItem: dead item, whichItem: removed item) on 3.0.1.24370; evidence, not proof. The handle had id 0 in 3 cases (typical arguments, whichItem: dead item, whichItem: removed item).

### `GetItemTag`

| Case                    | Group | Outcome | Id  | Type                        | Message |
| ----------------------- | ----- | ------- | --- | --------------------------- | ------- |
| typical arguments       | (a)   | handle  | 0   | `itemTag: 000001E9CFB0BD30` |         |
| whichItem: dead item    | (b)   | handle  | 0   | `itemTag: 000001E9CFB0BD30` |         |
| whichItem: removed item | (b)   | handle  | 0   | `itemTag: 000001E9CFB0BD30` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichItem: dead item, whichItem: removed item) on 3.0.1.24370; evidence, not proof. The handle had id 0 in 3 cases (typical arguments, whichItem: dead item, whichItem: removed item).

### `BlzGetItemEquipmentType`

| Case                    | Group | Outcome | Id  | Type                              | Message |
| ----------------------- | ----- | ------- | --- | --------------------------------- | ------- |
| typical arguments       | (a)   | handle  | 0   | `equipmentType: 000001E9CFCB7070` |         |
| whichItem: dead item    | (b)   | handle  | 0   | `equipmentType: 000001E9CFCB7070` |         |
| whichItem: removed item | (b)   | handle  | 0   | `equipmentType: 000001E9CFCB7070` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichItem: dead item, whichItem: removed item) on 3.0.1.24370; evidence, not proof. The handle had id 0 in 3 cases (typical arguments, whichItem: dead item, whichItem: removed item).

### `BlzGetItemTag`

| Case                    | Group | Outcome | Id  | Type                        | Message |
| ----------------------- | ----- | ------- | --- | --------------------------- | ------- |
| typical arguments       | (a)   | handle  | 0   | `itemTag: 000001E9CFB0BD30` |         |
| whichItem: dead item    | (b)   | handle  | 0   | `itemTag: 000001E9CFB0BD30` |         |
| whichItem: removed item | (b)   | handle  | 0   | `itemTag: 000001E9CFB0BD30` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichItem: dead item, whichItem: removed item) on 3.0.1.24370; evidence, not proof. The handle had id 0 in 3 cases (typical arguments, whichItem: dead item, whichItem: removed item).

### `GetUnitLoc`

| Case                    | Group | Outcome | Id      | Type                         | Message |
| ----------------------- | ----- | ------- | ------- | ---------------------------- | ------- |
| typical arguments       | (a)   | handle  | 1048786 | `location: 000001EA40E09A30` |         |
| whichUnit: dead unit    | (b)   | handle  | 1048790 | `location: 000001EA40EDDEA0` |         |
| whichUnit: removed unit | (b)   | handle  | 1048791 | `location: 000001E9E8326950` |         |

- Family: `intrinsic-property`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichUnit: dead unit, whichUnit: removed unit) on 3.0.1.24370; evidence, not proof.

### `GetOwningPlayer`

| Case                    | Group | Outcome | Id      | Type                       | Message |
| ----------------------- | ----- | ------- | ------- | -------------------------- | ------- |
| typical arguments       | (a)   | handle  | 1048584 | `player: 000001E9D14E6720` |         |
| whichUnit: dead unit    | (b)   | handle  | 1048584 | `player: 000001E9D14E6720` |         |
| whichUnit: removed unit | (b)   | handle  | 1048584 | `player: 000001E9D14E6720` |         |

- Family: `intrinsic-property`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichUnit: dead unit, whichUnit: removed unit) on 3.0.1.24370; evidence, not proof.

### `GetUnitRace`

| Case                    | Group | Outcome | Id  | Type                     | Message |
| ----------------------- | ----- | ------- | --- | ------------------------ | ------- |
| typical arguments       | (a)   | handle  | 1   | `race: 000001E9CFA50630` |         |
| whichUnit: dead unit    | (b)   | handle  | 1   | `race: 000001E9CFA50630` |         |
| whichUnit: removed unit | (b)   | handle  | 1   | `race: 000001E9CFA50630` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichUnit: dead unit, whichUnit: removed unit) on 3.0.1.24370; evidence, not proof.

### `GetLocalPlayer`

| Case     | Group | Outcome | Id      | Type                       | Message |
| -------- | ----- | ------- | ------- | -------------------------- | ------- |
| one call | (a)   | handle  | 1048584 | `player: 000001E9D14E6720` |         |

- Family: `intrinsic-property`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.1.24370; evidence, not proof.

### `GetPlayerRace`

| Case                        | Group | Outcome | Id  | Type                     | Message |
| --------------------------- | ----- | ------- | --- | ------------------------ | ------- |
| typical arguments           | (a)   | handle  | 2   | `race: 000001E9CFA814A0` |         |
| whichPlayer: empty slot     | (a)   | handle  | 1   | `race: 000001E9CFA50630` |         |
| whichPlayer: neutral player | (a)   | handle  | 0   | `race: 000001EA40E05320` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichPlayer: empty slot, whichPlayer: neutral player) on 3.0.1.24370; evidence, not proof. The handle had id 0 in a case (whichPlayer: neutral player).

### `VersionGet`

| Case     | Group | Outcome | Id  | Type                        | Message |
| -------- | ----- | ------- | --- | --------------------------- | ------- |
| one call | (a)   | handle  | 2   | `version: 000001E9E5FE2250` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.1.24370; evidence, not proof.

### `GetDefaultDifficulty`

| Case     | Group | Outcome | Id  | Type                               | Message |
| -------- | ----- | ------- | --- | ---------------------------------- | ------- |
| one call | (a)   | handle  | 1   | `gamedifficulty: 000001E9CFBAFC30` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.1.24370; evidence, not proof.

### `CameraSetupGetDestPositionLoc`

| Case              | Group | Outcome | Id      | Type                         | Message |
| ----------------- | ----- | ------- | ------- | ---------------------------- | ------- |
| typical arguments | (a)   | handle  | 1048787 | `location: 000001E9D15D2DA0` |         |

- Family: `intrinsic-property`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments) on 3.0.1.24370; evidence, not proof.

### `GetCameraTargetPositionLoc`

| Case     | Group | Outcome | Id      | Type                         | Message |
| -------- | ----- | ------- | ------- | ---------------------------- | ------- |
| one call | (a)   | handle  | 1048788 | `location: 000001E9D15D68E0` |         |

- Family: `intrinsic-property`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.1.24370; evidence, not proof.

### `GetCameraEyePositionLoc`

| Case     | Group | Outcome | Id      | Type                         | Message |
| -------- | ----- | ------- | ------- | ---------------------------- | ------- |
| one call | (a)   | handle  | 1048789 | `location: 000001E9D15D5CA0` |         |

- Family: `intrinsic-property`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.1.24370; evidence, not proof.

### `GetAIDifficulty`

| Case                | Group | Outcome | Id  | Type                             | Message |
| ------------------- | ----- | ------- | --- | -------------------------------- | ------- |
| typical arguments   | (a)   | handle  | 1   | `aidifficulty: 000001E9CFF992C0` |         |
| num: empty slot     | (a)   | handle  | 1   | `aidifficulty: 000001E9CFF992C0` |         |
| num: neutral player | (a)   | handle  | 1   | `aidifficulty: 000001E9CFF992C0` |         |

- Family: `enum-getter`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, num: empty slot, num: neutral player) on 3.0.1.24370; evidence, not proof.

## `nullability-constructors-game`

- Probe: `nullability-constructors-game`
- Patch: 3.0.1.24370
- Client: 3.0.1.24371
- Date: 2026-10-21
- Run: `a7408dfa-2c64-4b4f-aa42-4db3d650596b`

### `CreateTimer`

| Case     | Group | Outcome | Id      | Type                      | Message |
| -------- | ----- | ------- | ------- | ------------------------- | ------- |
| one call | (a)   | handle  | 1048806 | `timer: 000001FD064E4520` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.1.24370; evidence, not proof.

### `CreateGroup`

| Case     | Group | Outcome | Id      | Type                      | Message |
| -------- | ----- | ------- | ------- | ------------------------- | ------- |
| one call | (a)   | handle  | 1048807 | `group: 000001FD064E4270` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.1.24370; evidence, not proof.

### `CreateForce`

| Case     | Group | Outcome | Id      | Type                      | Message |
| -------- | ----- | ------- | ------- | ------------------------- | ------- |
| one call | (a)   | handle  | 1048808 | `force: 000001FD064F2010` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.1.24370; evidence, not proof.

### `Rect`

| Case                    | Group | Outcome | Id      | Type                     | Message |
| ----------------------- | ----- | ------- | ------- | ------------------------ | ------- |
| typical arguments       | (a)   | handle  | 1048809 | `rect: 000001FD064D2CE0` |         |
| minx: 0                 | (a)   | handle  | 1048810 | `rect: 000001FD064F27A0` |         |
| minx: negative          | (a)   | handle  | 1048811 | `rect: 000001FD064D0E50` |         |
| minx: outside the world | (a)   | handle  | 1048812 | `rect: 000001FD064CBBC0` |         |
| minx: 2147483647        | (a)   | handle  | 1048813 | `rect: 000001FD064D3750` |         |
| miny: 0                 | (a)   | handle  | 1048814 | `rect: 000001FC079829E0` |         |
| miny: negative          | (a)   | handle  | 1048815 | `rect: 000001FD064D0AD0` |         |
| miny: outside the world | (a)   | handle  | 1048816 | `rect: 000001FD064F8DD0` |         |
| miny: 2147483647        | (a)   | handle  | 1048817 | `rect: 000001FD064F3EC0` |         |
| maxx: 0                 | (a)   | handle  | 1048818 | `rect: 000001FD064DE660` |         |
| maxx: negative          | (a)   | handle  | 1048819 | `rect: 000001FD064DD760` |         |
| maxx: outside the world | (a)   | handle  | 1048820 | `rect: 000001FD064E6700` |         |
| maxx: 2147483647        | (a)   | handle  | 1048821 | `rect: 000001FD064EB2F0` |         |
| maxy: 0                 | (a)   | handle  | 1048822 | `rect: 000001FD064E0130` |         |
| maxy: negative          | (a)   | handle  | 1048823 | `rect: 000001FD064E92D0` |         |
| maxy: outside the world | (a)   | handle  | 1048824 | `rect: 000001FD06304E10` |         |
| maxy: 2147483647        | (a)   | handle  | 1048825 | `rect: 000001FD0630A1B0` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, minx: 0, minx: negative, minx: outside the world, minx: 2147483647, miny: 0, miny: negative, miny: outside the world, miny: 2147483647, maxx: 0, maxx: negative, maxx: outside the world, maxx: 2147483647, maxy: 0, maxy: negative, maxy: outside the world, maxy: 2147483647) on 3.0.1.24370; evidence, not proof.

### `RectFromLoc`

| Case                  | Group | Outcome | Id      | Type                     | Message |
| --------------------- | ----- | ------- | ------- | ------------------------ | ------- |
| typical arguments     | (a)   | handle  | 1048826 | `rect: 000001FD0630F530` |         |
| min: removed location | (b)   | nil     |         |                          |         |
| max: removed location | (b)   | nil     |         |                          |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 2 cases of the nullability sweep (min: removed location, max: removed location) on 3.0.1.24370.

### `CreateRegion`

| Case     | Group | Outcome | Id      | Type                       | Message |
| -------- | ----- | ------- | ------- | -------------------------- | ------- |
| one call | (a)   | handle  | 1048827 | `region: 000001FD06315460` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.1.24370; evidence, not proof.

### `Location`

| Case                 | Group | Outcome | Id      | Type                         | Message |
| -------------------- | ----- | ------- | ------- | ---------------------------- | ------- |
| typical arguments    | (a)   | handle  | 1048828 | `location: 000001FD0631B620` |         |
| x: 0                 | (a)   | handle  | 1048829 | `location: 000001FD06321540` |         |
| x: negative          | (a)   | handle  | 1048830 | `location: 000001FD06326530` |         |
| x: outside the world | (a)   | handle  | 1048831 | `location: 000001FD0632C110` |         |
| x: 2147483647        | (a)   | handle  | 1048832 | `location: 000001FD06332220` |         |
| y: 0                 | (a)   | handle  | 1048833 | `location: 000001FD0633BDC0` |         |
| y: negative          | (a)   | handle  | 1048834 | `location: 000001FD063410B0` |         |
| y: outside the world | (a)   | handle  | 1048835 | `location: 000001FD06346CA0` |         |
| y: 2147483647        | (a)   | handle  | 1048836 | `location: 000001FD0634C430` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, x: 0, x: negative, x: outside the world, x: 2147483647, y: 0, y: negative, y: outside the world, y: 2147483647) on 3.0.1.24370; evidence, not proof.

### `CreateTrigger`

| Case     | Group | Outcome | Id      | Type                        | Message |
| -------- | ----- | ------- | ------- | --------------------------- | ------- |
| one call | (a)   | handle  | 1048837 | `trigger: 000001FD063521F0` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.1.24370; evidence, not proof.

### `And`

| Case                          | Group | Outcome | Id      | Type                         | Message |
| ----------------------------- | ----- | ------- | ------- | ---------------------------- | ------- |
| typical arguments             | (a)   | handle  | 1048838 | `boolexpr: 000001FD06346290` |         |
| operandA: destroyed condition | (b)   | handle  | 1048902 | `boolexpr: 000001FD06654250` |         |
| operandA: destroyed filter    | (b)   | handle  | 1048903 | `boolexpr: 000001FD0665A4C0` |         |
| operandA: destroyed boolexpr  | (b)   | handle  | 1048904 | `boolexpr: 000001FD06660720` |         |
| operandB: destroyed condition | (b)   | handle  | 1048905 | `boolexpr: 000001FD06666CB0` |         |
| operandB: destroyed filter    | (b)   | handle  | 1048906 | `boolexpr: 000001FD0666DA90` |         |
| operandB: destroyed boolexpr  | (b)   | handle  | 1048907 | `boolexpr: 000001FD065B2990` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, operandA: destroyed condition, operandA: destroyed filter, operandA: destroyed boolexpr, operandB: destroyed condition, operandB: destroyed filter, operandB: destroyed boolexpr) on 3.0.1.24370; evidence, not proof.

### `Or`

| Case                          | Group | Outcome | Id      | Type                         | Message |
| ----------------------------- | ----- | ------- | ------- | ---------------------------- | ------- |
| typical arguments             | (a)   | handle  | 1048839 | `boolexpr: 000001FD0634EA80` |         |
| operandA: destroyed condition | (b)   | handle  | 1048908 | `boolexpr: 000001FD0663DCA0` |         |
| operandA: destroyed filter    | (b)   | handle  | 1048909 | `boolexpr: 000001FD06619E30` |         |
| operandA: destroyed boolexpr  | (b)   | handle  | 1048910 | `boolexpr: 000001FD0660C070` |         |
| operandB: destroyed condition | (b)   | handle  | 1048911 | `boolexpr: 000001FD065B6870` |         |
| operandB: destroyed filter    | (b)   | handle  | 1048912 | `boolexpr: 000001FD066664F0` |         |
| operandB: destroyed boolexpr  | (b)   | handle  | 1048913 | `boolexpr: 000001FD0656A930` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, operandA: destroyed condition, operandA: destroyed filter, operandA: destroyed boolexpr, operandB: destroyed condition, operandB: destroyed filter, operandB: destroyed boolexpr) on 3.0.1.24370; evidence, not proof.

### `Not`

| Case                         | Group | Outcome | Id      | Type                         | Message |
| ---------------------------- | ----- | ------- | ------- | ---------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1048840 | `boolexpr: 000001FD0630EF90` |         |
| operand: destroyed condition | (b)   | handle  | 1048914 | `boolexpr: 000001FD065F6750` |         |
| operand: destroyed filter    | (b)   | handle  | 1048915 | `boolexpr: 000001FD06599990` |         |
| operand: destroyed boolexpr  | (b)   | handle  | 1048916 | `boolexpr: 000001FD065C9300` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, operand: destroyed condition, operand: destroyed filter, operand: destroyed boolexpr) on 3.0.1.24370; evidence, not proof.

### `Condition`

| Case              | Group | Outcome | Id      | Type                              | Message |
| ----------------- | ----- | ------- | ------- | --------------------------------- | ------- |
| typical arguments | (a)   | handle  | 1048841 | `conditionfunc: 000001FD0632E9A0` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments) on 3.0.1.24370; evidence, not proof.

### `Filter`

| Case              | Group | Outcome | Id      | Type                           | Message |
| ----------------- | ----- | ------- | ------- | ------------------------------ | ------- |
| typical arguments | (a)   | handle  | 1048842 | `filterfunc: 000001FD06308530` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments) on 3.0.1.24370; evidence, not proof.

### `TriggerAddCondition`

| Case                            | Group | Outcome | Id      | Type                                 | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------------------ | ------- |
| typical arguments               | (a)   | handle  | 1048843 | `triggercondition: 000001FD0630EC50` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                                      |         |
| condition: destroyed condition  | (b)   | handle  | 1048917 | `triggercondition: 000001FD0663E960` |         |
| condition: destroyed filter     | (b)   | handle  | 1048918 | `triggercondition: 000001FD0660E5F0` |         |
| condition: destroyed boolexpr   | (b)   | handle  | 1048919 | `triggercondition: 000001FD065F3E70` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.1.24370.

### `TriggerAddAction`

| Case                            | Group | Outcome | Id      | Type                              | Message |
| ------------------------------- | ----- | ------- | ------- | --------------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048844 | `triggeraction: 000001FD06343380` |         |
| whichTrigger: destroyed trigger | (b)   | handle  | 0       | `triggeraction: 000001FD0661AFC0` |         |

- Family: `constructor`
- Verdict: nullable (placeholder)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a placeholder handle in place of nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.1.24370: id 0, so a nil check does not catch it.

### `CreateFogModifierRect`

| Case                | Group | Outcome | Id      | Type                            | Message |
| ------------------- | ----- | ------- | ------- | ------------------------------- | ------- |
| typical arguments   | (a)   | handle  | 1048845 | `fogmodifier: 000001FD06344010` |         |
| where: removed rect | (b)   | nil     |         |                                 |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (where: removed rect) on 3.0.1.24370.

### `CreateFogModifierRadius`

| Case                       | Group | Outcome | Id      | Type                            | Message                            |
| -------------------------- | ----- | ------- | ------- | ------------------------------- | ---------------------------------- |
| typical arguments          | (a)   | handle  | 1048846 | `fogmodifier: 000001FD063312D0` |                                    |
| centerx: 0                 | (a)   | handle  | 1048847 | `fogmodifier: 000001FD0633D9E0` |                                    |
| centerx: negative          | (a)   | handle  | 1048848 | `fogmodifier: 000001FD0633E3B0` |                                    |
| centerx: outside the world | (a)   | handle  | 1048849 | `fogmodifier: 000001FD06323400` |                                    |
| centerx: 2147483647        | (a)   | handle  | 1048850 | `fogmodifier: 000001FD06349F50` |                                    |
| centerY: 0                 | (a)   | handle  | 1048851 | `fogmodifier: 000001FD06328BE0` |                                    |
| centerY: negative          | (a)   | handle  | 1048852 | `fogmodifier: 000001FD0631F0B0` |                                    |
| centerY: outside the world | (a)   | handle  | 1048853 | `fogmodifier: 000001FD0631AC60` |                                    |
| centerY: 2147483647        | (a)   | handle  | 1048854 | `fogmodifier: 000001FD0631D710` |                                    |
| radius: 0                  | (a)   | handle  | 1048855 | `fogmodifier: 000001FD063124F0` |                                    |
| radius: negative           | (a)   | handle  | 1048856 | `fogmodifier: 000001FD0631AB10` |                                    |
| radius: outside the world  | (a)   | handle  | 1048857 | `fogmodifier: 000001FC07899C50` |                                    |
| radius: 2147483647         | (a)   | crashed |         |                                 | skipped: crashed in an earlier run |

- Family: `constructor`
- Verdict: unsafe
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Crashed the game in a case of the nullability sweep (radius: 2147483647) on 3.0.1.24370. Returned a handle in every other case (typical arguments, centerx: 0, centerx: negative, centerx: outside the world, centerx: 2147483647, centerY: 0, centerY: negative, centerY: outside the world, centerY: 2147483647, radius: 0, radius: negative, radius: outside the world).

### `CreateFogModifierRadiusLoc`

| Case                      | Group | Outcome | Id      | Type                            | Message                            |
| ------------------------- | ----- | ------- | ------- | ------------------------------- | ---------------------------------- |
| typical arguments         | (a)   | handle  | 1048858 | `fogmodifier: 000001FC078990A0` |                                    |
| radius: 0                 | (a)   | handle  | 1048859 | `fogmodifier: 000001FD0653EF50` |                                    |
| radius: negative          | (a)   | handle  | 1048860 | `fogmodifier: 000001FD06543A40` |                                    |
| radius: outside the world | (a)   | handle  | 1048861 | `fogmodifier: 000001FD065488C0` |                                    |
| radius: 2147483647        | (a)   | crashed |         |                                 | skipped: crashed in an earlier run |
| center: removed location  | (b)   | nil     |         |                                 |                                    |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Crashed the game in a case of the nullability sweep (radius: 2147483647) on 3.0.1.24370. Returned nothing in a case of the nullability sweep (center: removed location) on 3.0.1.24370.

### `DialogCreate`

| Case     | Group | Outcome | Id      | Type                       | Message |
| -------- | ----- | ------- | ------- | -------------------------- | ------- |
| one call | (a)   | handle  | 1048862 | `dialog: 000001FD0654F650` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.1.24370; evidence, not proof.

### `DialogAddButton`

| Case                          | Group | Outcome | Id      | Type                       | Message |
| ----------------------------- | ----- | ------- | ------- | -------------------------- | ------- |
| typical arguments             | (a)   | handle  | 1048863 | `button: 000001FD06553670` |         |
| buttonText: empty string      | (a)   | handle  | 1048864 | `button: 000001FD06557300` |         |
| buttonText: unknown name      | (a)   | handle  | 1048865 | `button: 000001FD0655D230` |         |
| hotkey: negative              | (a)   | handle  | 1048866 | `button: 000001FD06562520` |         |
| hotkey: outside the world     | (a)   | handle  | 1048867 | `button: 000001FD06567A30` |         |
| hotkey: 2147483647            | (a)   | handle  | 1048868 | `button: 000001FD0656CAE0` |         |
| whichDialog: destroyed dialog | (b)   | nil     |         |                            |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichDialog: destroyed dialog) on 3.0.1.24370.

### `DialogAddQuitButton`

| Case                          | Group | Outcome | Id      | Type                       | Message |
| ----------------------------- | ----- | ------- | ------- | -------------------------- | ------- |
| typical arguments             | (a)   | handle  | 1048869 | `button: 000001FD065679F0` |         |
| buttonText: empty string      | (a)   | handle  | 1048870 | `button: 000001FD06577E10` |         |
| buttonText: unknown name      | (a)   | handle  | 1048871 | `button: 000001FD0657D630` |         |
| hotkey: negative              | (a)   | handle  | 1048872 | `button: 000001FD065829D0` |         |
| hotkey: outside the world     | (a)   | handle  | 1048873 | `button: 000001FD065883C0` |         |
| hotkey: 2147483647            | (a)   | handle  | 1048874 | `button: 000001FD0658E100` |         |
| whichDialog: destroyed dialog | (b)   | nil     |         |                            |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichDialog: destroyed dialog) on 3.0.1.24370.

### `InitGameCache`

| Case                       | Group | Outcome | Id      | Type                          | Message |
| -------------------------- | ----- | ------- | ------- | ----------------------------- | ------- |
| typical arguments          | (a)   | handle  | 1048875 | `gamecache: 000001FD06592710` |         |
| campaignFile: empty string | (a)   | nil     |         |                               |         |
| campaignFile: unknown name | (a)   | handle  | 1048876 | `gamecache: 000001FD0659B380` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (campaignFile: empty string) on 3.0.1.24370.

### `InitHashtable`

| Case     | Group | Outcome | Id      | Type                          | Message |
| -------- | ----- | ------- | ------- | ----------------------------- | ------- |
| one call | (a)   | handle  | 1048877 | `hashtable: 000001FD0659FF80` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.1.24370; evidence, not proof.

### `CreateQuest`

| Case     | Group | Outcome | Id      | Type                      | Message |
| -------- | ----- | ------- | ------- | ------------------------- | ------- |
| one call | (a)   | handle  | 1048878 | `quest: 000001FD065A4850` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.1.24370; evidence, not proof.

### `QuestCreateItem`

| Case                                 | Group | Outcome | Id      | Type                          | Message |
| ------------------------------------ | ----- | ------- | ------- | ----------------------------- | ------- |
| typical arguments                    | (a)   | handle  | 1048879 | `questitem: 000001FD065A93F0` |         |
| whichQuest: quest after DestroyQuest | (b)   | handle  | 1048920 | `questitem: 000001FD06622B20` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichQuest: quest after DestroyQuest) on 3.0.1.24370; evidence, not proof.

### `CreateDefeatCondition`

| Case     | Group | Outcome | Id      | Type                                | Message |
| -------- | ----- | ------- | ------- | ----------------------------------- | ------- |
| one call | (a)   | handle  | 1048880 | `defeatcondition: 000001FD065AE120` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.1.24370; evidence, not proof.

### `CreateTimerDialog`

| Case               | Group | Outcome | Id      | Type                            | Message |
| ------------------ | ----- | ------- | ------- | ------------------------------- | ------- |
| typical arguments  | (a)   | handle  | 1048881 | `timerdialog: 000001FD065B2F60` |         |
| t: destroyed timer | (b)   | handle  | 1048921 | `timerdialog: 000001FD065861A0` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, t: destroyed timer) on 3.0.1.24370; evidence, not proof.

### `CreateLeaderboard`

| Case     | Group | Outcome | Id      | Type                            | Message |
| -------- | ----- | ------- | ------- | ------------------------------- | ------- |
| one call | (a)   | handle  | 1048882 | `leaderboard: 000001FD065B7840` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.1.24370; evidence, not proof.

### `CreateMultiboard`

| Case     | Group | Outcome | Id      | Type                           | Message |
| -------- | ----- | ------- | ------- | ------------------------------ | ------- |
| one call | (a)   | handle  | 1048883 | `multiboard: 000001FD065BC450` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.1.24370; evidence, not proof.

### `CreateCameraSetup`

| Case     | Group | Outcome | Id      | Type                            | Message |
| -------- | ----- | ------- | ------- | ------------------------------- | ------- |
| one call | (a)   | handle  | 1048884 | `camerasetup: 000001FD065C4CB0` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.1.24370; evidence, not proof.

### `BlzCreateFrame`

| Case                             | Group | Outcome | Id      | Type                            | Message |
| -------------------------------- | ----- | ------- | ------- | ------------------------------- | ------- |
| typical arguments                | (a)   | handle  | 1048885 | `framehandle: 000001FD06551930` |         |
| name: empty string               | (a)   | nil     |         |                                 |         |
| name: unknown name               | (a)   | nil     |         |                                 |         |
| priority: negative               | (a)   | handle  | 1048886 | `framehandle: 000001FD065D8660` |         |
| priority: outside the world      | (a)   | handle  | 1048887 | `framehandle: 000001FD065DD760` |         |
| priority: 2147483647             | (a)   | handle  | 1048888 | `framehandle: 000001FD065E26A0` |         |
| createContext: negative          | (a)   | handle  | 1048889 | `framehandle: 000001FD065E7940` |         |
| createContext: outside the world | (a)   | handle  | 1048890 | `framehandle: 000001FD065EC870` |         |
| createContext: 2147483647        | (a)   | handle  | 1048891 | `framehandle: 000001FD065F1F00` |         |
| owner: destroyed frame           | (b)   | nil     |         |                                 |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 3 cases of the nullability sweep (name: empty string, name: unknown name, owner: destroyed frame) on 3.0.1.24370.

### `BlzCreateSimpleFrame`

| Case                             | Group | Outcome | Id      | Type                            | Message |
| -------------------------------- | ----- | ------- | ------- | ------------------------------- | ------- |
| typical arguments                | (a)   | handle  | 1048892 | `framehandle: 000001FD065F7270` |         |
| name: empty string               | (a)   | nil     |         |                                 |         |
| name: unknown name               | (a)   | nil     |         |                                 |         |
| createContext: negative          | (a)   | handle  | 1048893 | `framehandle: 000001FD06606F60` |         |
| createContext: outside the world | (a)   | handle  | 1048894 | `framehandle: 000001FD0660CCC0` |         |
| createContext: 2147483647        | (a)   | handle  | 1048895 | `framehandle: 000001FD06612800` |         |
| owner: destroyed frame           | (b)   | handle  | 1048922 | `framehandle: 000001FD06646990` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 2 cases of the nullability sweep (name: empty string, name: unknown name) on 3.0.1.24370.

### `CreateCommandButtonEffect`

| Case                       | Group | Outcome | Id      | Type                                    | Message |
| -------------------------- | ----- | ------- | ------- | --------------------------------------- | ------- |
| typical arguments          | (a)   | handle  | 1048896 | `commandbuttoneffect: 000001FD06618330` |         |
| abilityId: unknown rawcode | (a)   | handle  | 1048897 | `commandbuttoneffect: 000001FD0661E2C0` |         |
| order: empty string        | (a)   | handle  | 0       | `commandbuttoneffect: 000001FD06623AE0` |         |
| order: unknown name        | (a)   | handle  | 0       | `commandbuttoneffect: 000001FD06623AE0` |         |

- Family: `constructor`
- Verdict: nullable (placeholder)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a placeholder handle in place of nothing in 2 cases of the nullability sweep (order: empty string, order: unknown name) on 3.0.1.24370: id 0, so a nil check does not catch it.

### `CreateUpgradeCommandButtonEffect`

| Case                          | Group | Outcome | Id      | Type                                    | Message |
| ----------------------------- | ----- | ------- | ------- | --------------------------------------- | ------- |
| typical arguments             | (a)   | handle  | 1048898 | `commandbuttoneffect: 000001FD0662F610` |         |
| whichUprgade: unknown rawcode | (a)   | handle  | 1048899 | `commandbuttoneffect: 000001FD06635860` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, whichUprgade: unknown rawcode) on 3.0.1.24370; evidence, not proof.

### `CreateLearnCommandButtonEffect`

| Case                       | Group | Outcome | Id      | Type                                    | Message |
| -------------------------- | ----- | ------- | ------- | --------------------------------------- | ------- |
| typical arguments          | (a)   | handle  | 1048900 | `commandbuttoneffect: 000001FD0663BB50` |         |
| abilityId: unknown rawcode | (a)   | handle  | 1048901 | `commandbuttoneffect: 000001FD06642570` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, abilityId: unknown rawcode) on 3.0.1.24370; evidence, not proof.

## `nullability-constructors-world`

- Probe: `nullability-constructors-world`
- Patch: 3.0.1.24370
- Client: 3.0.1.24371
- Date: 2026-10-21
- Run: `562086e5-1793-4d8e-b880-0221943bcfe6`

### `CreateItem`

| Case                    | Group | Outcome | Id      | Type                     | Message |
| ----------------------- | ----- | ------- | ------- | ------------------------ | ------- |
| typical arguments       | (a)   | handle  | 1048812 | `item: 0000020787F23470` |         |
| itemid: unknown rawcode | (a)   | nil     |         |                          |         |
| x: 0                    | (a)   | handle  | 1048813 | `item: 0000020787EE8E30` |         |
| x: negative             | (a)   | handle  | 1048814 | `item: 0000020787EFD610` |         |
| x: outside the world    | (a)   | handle  | 1048815 | `item: 0000020787ED7A90` |         |
| x: 2147483647           | (a)   | handle  | 1048816 | `item: 0000020787EFEFB0` |         |
| y: 0                    | (a)   | handle  | 1048817 | `item: 0000020787F02B20` |         |
| y: negative             | (a)   | handle  | 1048818 | `item: 0000020787F62700` |         |
| y: outside the world    | (a)   | handle  | 1048819 | `item: 0000020787EB44E0` |         |
| y: 2147483647           | (a)   | handle  | 1048820 | `item: 0000020787F43780` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (itemid: unknown rawcode) on 3.0.1.24370.

### `CreateUnit`

| Case                    | Group | Outcome | Id      | Type                     | Message |
| ----------------------- | ----- | ------- | ------- | ------------------------ | ------- |
| typical arguments       | (a)   | handle  | 1048821 | `unit: 0000020787F71D70` |         |
| unitid: unknown rawcode | (a)   | nil     |         |                          |         |
| x: 0                    | (a)   | handle  | 1048822 | `unit: 0000020787F52760` |         |
| x: negative             | (a)   | handle  | 1048823 | `unit: 0000020787EA9260` |         |
| x: outside the world    | (a)   | handle  | 1048824 | `unit: 0000020787ECAA40` |         |
| x: 2147483647           | (a)   | handle  | 1048825 | `unit: 0000020787F502B0` |         |
| y: 0                    | (a)   | handle  | 1048826 | `unit: 0000020787F3E4F0` |         |
| y: negative             | (a)   | handle  | 1048827 | `unit: 0000020787F4E790` |         |
| y: outside the world    | (a)   | handle  | 1048828 | `unit: 00000207826ABEA0` |         |
| y: 2147483647           | (a)   | handle  | 1048829 | `unit: 0000020787EA3890` |         |
| face: 0                 | (a)   | handle  | 1048830 | `unit: 0000020788263A50` |         |
| face: negative          | (a)   | handle  | 1048831 | `unit: 0000020787FC15A0` |         |
| face: outside the world | (a)   | handle  | 1048832 | `unit: 0000020787F707A0` |         |
| face: 2147483647        | (a)   | handle  | 1048833 | `unit: 00000207881FCDD0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unitid: unknown rawcode) on 3.0.1.24370.

### `CreateUnitByName`

| Case                    | Group | Outcome | Id      | Type                     | Message |
| ----------------------- | ----- | ------- | ------- | ------------------------ | ------- |
| typical arguments       | (a)   | handle  | 1048834 | `unit: 0000020788208CA0` |         |
| unitname: empty string  | (a)   | nil     |         |                          |         |
| unitname: unknown name  | (a)   | nil     |         |                          |         |
| x: 0                    | (a)   | handle  | 1048835 | `unit: 0000020787E99220` |         |
| x: negative             | (a)   | handle  | 1048836 | `unit: 00000207882064E0` |         |
| x: outside the world    | (a)   | handle  | 1048837 | `unit: 0000020788267EE0` |         |
| x: 2147483647           | (a)   | handle  | 1048838 | `unit: 0000020788236F60` |         |
| y: 0                    | (a)   | handle  | 1048839 | `unit: 000002078820F540` |         |
| y: negative             | (a)   | handle  | 1048840 | `unit: 0000020788232A90` |         |
| y: outside the world    | (a)   | handle  | 1048841 | `unit: 000002078821C330` |         |
| y: 2147483647           | (a)   | handle  | 1048842 | `unit: 00000207883F5260` |         |
| face: 0                 | (a)   | handle  | 1048843 | `unit: 00000207881A13A0` |         |
| face: negative          | (a)   | handle  | 1048844 | `unit: 00000207881ACFA0` |         |
| face: outside the world | (a)   | handle  | 1048845 | `unit: 00000207881BE110` |         |
| face: 2147483647        | (a)   | handle  | 1048846 | `unit: 000002078841EE50` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 2 cases of the nullability sweep (unitname: empty string, unitname: unknown name) on 3.0.1.24370.

### `CreateUnitAtLoc`

| Case                            | Group | Outcome | Id      | Type                     | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------ | ------- |
| typical arguments               | (a)   | handle  | 1048847 | `unit: 0000020788427780` |         |
| unitid: unknown rawcode         | (a)   | nil     |         |                          |         |
| face: 0                         | (a)   | handle  | 1048848 | `unit: 0000020787F446D0` |         |
| face: negative                  | (a)   | handle  | 1048849 | `unit: 000002078821C1D0` |         |
| face: outside the world         | (a)   | handle  | 1048850 | `unit: 0000020788454560` |         |
| face: 2147483647                | (a)   | handle  | 1048851 | `unit: 000002078844AE30` |         |
| whichLocation: removed location | (b)   | nil     |         |                          |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 2 cases of the nullability sweep (unitid: unknown rawcode, whichLocation: removed location) on 3.0.1.24370.

### `CreateUnitAtLocByName`

| Case                            | Group | Outcome | Id      | Type                     | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------ | ------- |
| typical arguments               | (a)   | handle  | 1048852 | `unit: 0000020788456B50` |         |
| unitname: empty string          | (a)   | nil     |         |                          |         |
| unitname: unknown name          | (a)   | nil     |         |                          |         |
| face: 0                         | (a)   | handle  | 1048853 | `unit: 000002078849CD00` |         |
| face: negative                  | (a)   | handle  | 1048854 | `unit: 00000207884A9920` |         |
| face: outside the world         | (a)   | handle  | 1048855 | `unit: 000002078849F390` |         |
| face: 2147483647                | (a)   | handle  | 1048856 | `unit: 00000207884C7850` |         |
| whichLocation: removed location | (b)   | nil     |         |                          |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 3 cases of the nullability sweep (unitname: empty string, unitname: unknown name, whichLocation: removed location) on 3.0.1.24370.

### `CreateCorpse`

| Case                    | Group | Outcome | Id      | Type                     | Message |
| ----------------------- | ----- | ------- | ------- | ------------------------ | ------- |
| typical arguments       | (a)   | handle  | 1048857 | `unit: 00000207884E7660` |         |
| unitid: unknown rawcode | (a)   | nil     |         |                          |         |
| x: 0                    | (a)   | handle  | 1048858 | `unit: 00000207884F5950` |         |
| x: negative             | (a)   | handle  | 1048859 | `unit: 0000020788500430` |         |
| x: outside the world    | (a)   | handle  | 1048860 | `unit: 0000020788509B80` |         |
| x: 2147483647           | (a)   | handle  | 1048861 | `unit: 00000207885088A0` |         |
| y: 0                    | (a)   | handle  | 1048862 | `unit: 000002078851E1E0` |         |
| y: negative             | (a)   | handle  | 1048863 | `unit: 000002078852B220` |         |
| y: outside the world    | (a)   | handle  | 1048864 | `unit: 0000020788535390` |         |
| y: 2147483647           | (a)   | handle  | 1048865 | `unit: 00000207882655E0` |         |
| face: 0                 | (a)   | handle  | 1048866 | `unit: 00000207883DF950` |         |
| face: negative          | (a)   | handle  | 1048867 | `unit: 0000020788553420` |         |
| face: outside the world | (a)   | handle  | 1048868 | `unit: 000002078855C860` |         |
| face: 2147483647        | (a)   | handle  | 1048869 | `unit: 0000020788571CD0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unitid: unknown rawcode) on 3.0.1.24370.

### `UnitAddItemById`

| Case                              | Group | Outcome | Id      | Type                     | Message |
| --------------------------------- | ----- | ------- | ------- | ------------------------ | ------- |
| typical arguments                 | (a)   | handle  | 1048870 | `item: 0000020788578A70` |         |
| itemId: unknown rawcode           | (a)   | nil     |         |                          |         |
| whichUnit: unit with no inventory | (a)   | nil     |         |                          |         |
| whichUnit: dead hero              | (b)   | nil     |         |                          |         |
| whichUnit: removed hero           | (b)   | handle  | 1049025 | `item: 00000208A4397730` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 3 cases of the nullability sweep (itemId: unknown rawcode, whichUnit: unit with no inventory, whichUnit: dead hero) on 3.0.1.24370.

### `CreateUnitPool`

| Case     | Group | Outcome | Id      | Type                         | Message |
| -------- | ----- | ------- | ------- | ---------------------------- | ------- |
| one call | (a)   | handle  | 1048871 | `unitpool: 000002078857CCF0` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.1.24370; evidence, not proof.

### `PlaceRandomUnit`

| Case                           | Group | Outcome | Id      | Type                     | Message |
| ------------------------------ | ----- | ------- | ------- | ------------------------ | ------- |
| typical arguments              | (a)   | handle  | 1048872 | `unit: 0000020788580A40` |         |
| x: 0                           | (a)   | handle  | 1048873 | `unit: 0000020788590740` |         |
| x: negative                    | (a)   | handle  | 1048874 | `unit: 00000207885A3330` |         |
| x: outside the world           | (a)   | handle  | 1048875 | `unit: 00000207885AD210` |         |
| x: 2147483647                  | (a)   | handle  | 1048876 | `unit: 00000207885BEA30` |         |
| y: 0                           | (a)   | handle  | 1048877 | `unit: 00000207885C7620` |         |
| y: negative                    | (a)   | handle  | 1048878 | `unit: 00000207885D56C0` |         |
| y: outside the world           | (a)   | handle  | 1048879 | `unit: 00000207885E2C00` |         |
| y: 2147483647                  | (a)   | handle  | 1048880 | `unit: 00000207885F05E0` |         |
| facing: 0                      | (a)   | handle  | 1048881 | `unit: 00000207885FB880` |         |
| facing: negative               | (a)   | handle  | 1048882 | `unit: 0000020788630740` |         |
| facing: outside the world      | (a)   | handle  | 1048883 | `unit: 000002078863AFA0` |         |
| facing: 2147483647             | (a)   | handle  | 1048884 | `unit: 0000020788653D00` |         |
| whichPool: empty unit pool     | (a)   | nil     |         |                          |         |
| whichPool: destroyed unit pool | (b)   | nil     |         |                          |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 2 cases of the nullability sweep (whichPool: empty unit pool, whichPool: destroyed unit pool) on 3.0.1.24370.

### `CreateItemPool`

| Case     | Group | Outcome | Id      | Type                         | Message |
| -------- | ----- | ------- | ------- | ---------------------------- | ------- |
| one call | (a)   | handle  | 1048885 | `itempool: 00000207886562D0` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.1.24370; evidence, not proof.

### `PlaceRandomItem`

| Case                               | Group | Outcome | Id      | Type                     | Message |
| ---------------------------------- | ----- | ------- | ------- | ------------------------ | ------- |
| typical arguments                  | (a)   | handle  | 1048886 | `item: 000002078865D060` |         |
| x: 0                               | (a)   | handle  | 1048887 | `item: 0000020788660BF0` |         |
| x: negative                        | (a)   | handle  | 1048888 | `item: 0000020788663A30` |         |
| x: outside the world               | (a)   | handle  | 1048889 | `item: 00000207884FE0D0` |         |
| x: 2147483647                      | (a)   | handle  | 1048890 | `item: 000002078866AB50` |         |
| y: 0                               | (a)   | handle  | 1048891 | `item: 000002078866D180` |         |
| y: negative                        | (a)   | handle  | 1048892 | `item: 0000020788670520` |         |
| y: outside the world               | (a)   | handle  | 1048893 | `item: 00000207886733E0` |         |
| y: 2147483647                      | (a)   | handle  | 1048894 | `item: 0000020787EF7860` |         |
| whichItemPool: empty item pool     | (a)   | nil     |         |                          |         |
| whichItemPool: destroyed item pool | (b)   | nil     |         |                          |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 2 cases of the nullability sweep (whichItemPool: empty item pool, whichItemPool: destroyed item pool) on 3.0.1.24370.

### `CreateMinimapIconOnUnit`

| Case                     | Group | Outcome | Id  | Type                            | Message |
| ------------------------ | ----- | ------- | --- | ------------------------------- | ------- |
| typical arguments        | (a)   | handle  | 1   | `minimapicon: 0000020788678850` |         |
| red: 0                   | (a)   | handle  | 2   | `minimapicon: 00000207884440C0` |         |
| red: negative            | (a)   | handle  | 3   | `minimapicon: 000002078868E070` |         |
| red: outside the world   | (a)   | handle  | 4   | `minimapicon: 00000207886911C0` |         |
| red: 2147483647          | (a)   | handle  | 5   | `minimapicon: 000002078868B9C0` |         |
| green: 0                 | (a)   | handle  | 6   | `minimapicon: 000002078868AB80` |         |
| green: negative          | (a)   | handle  | 7   | `minimapicon: 000002078868D180` |         |
| green: outside the world | (a)   | handle  | 8   | `minimapicon: 000002078869E380` |         |
| green: 2147483647        | (a)   | handle  | 9   | `minimapicon: 00000207886A2640` |         |
| blue: 0                  | (a)   | handle  | 10  | `minimapicon: 00000207886A4C60` |         |
| blue: negative           | (a)   | handle  | 11  | `minimapicon: 00000207886A7040` |         |
| blue: outside the world  | (a)   | handle  | 12  | `minimapicon: 0000020788692F70` |         |
| blue: 2147483647         | (a)   | handle  | 13  | `minimapicon: 00000207886A72C0` |         |
| pingPath: empty string   | (a)   | handle  | 14  | `minimapicon: 00000207885F7A30` |         |
| pingPath: unknown name   | (a)   | handle  | 15  | `minimapicon: 000002078854AA40` |         |
| whichUnit: dead unit     | (b)   | handle  | 54  | `minimapicon: 00000208A43959E0` |         |
| whichUnit: removed unit  | (b)   | handle  | 55  | `minimapicon: 00000208A4386D80` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, red: 0, red: negative, red: outside the world, red: 2147483647, green: 0, green: negative, green: outside the world, green: 2147483647, blue: 0, blue: negative, blue: outside the world, blue: 2147483647, pingPath: empty string, pingPath: unknown name, whichUnit: dead unit, whichUnit: removed unit) on 3.0.1.24370; evidence, not proof.

### `CreateMinimapIconAtLoc`

| Case                     | Group | Outcome | Id  | Type                            | Message |
| ------------------------ | ----- | ------- | --- | ------------------------------- | ------- |
| typical arguments        | (a)   | handle  | 16  | `minimapicon: 0000020788642560` |         |
| red: 0                   | (a)   | handle  | 17  | `minimapicon: 000002078849EF80` |         |
| red: negative            | (a)   | handle  | 18  | `minimapicon: 00000207883F0140` |         |
| red: outside the world   | (a)   | handle  | 19  | `minimapicon: 0000020788434590` |         |
| red: 2147483647          | (a)   | handle  | 20  | `minimapicon: 0000020787ED1AA0` |         |
| green: 0                 | (a)   | handle  | 21  | `minimapicon: 0000020787EDD020` |         |
| green: negative          | (a)   | handle  | 22  | `minimapicon: 0000020787EF9DD0` |         |
| green: outside the world | (a)   | handle  | 23  | `minimapicon: 0000020787ED3710` |         |
| green: 2147483647        | (a)   | handle  | 24  | `minimapicon: 0000020787EC90E0` |         |
| blue: 0                  | (a)   | handle  | 25  | `minimapicon: 0000020787E98320` |         |
| blue: negative           | (a)   | handle  | 26  | `minimapicon: 0000020787EDCE30` |         |
| blue: outside the world  | (a)   | handle  | 27  | `minimapicon: 0000020787F03460` |         |
| blue: 2147483647         | (a)   | handle  | 28  | `minimapicon: 00000207883FC8F0` |         |
| pingPath: empty string   | (a)   | handle  | 29  | `minimapicon: 00000207884F7D50` |         |
| pingPath: unknown name   | (a)   | handle  | 30  | `minimapicon: 0000020787C29B80` |         |
| where: removed location  | (b)   | handle  | 0   | `minimapicon: 00000208A4391D30` |         |

- Family: `constructor`
- Verdict: nullable (placeholder)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a placeholder handle in place of nothing in a case of the nullability sweep (where: removed location) on 3.0.1.24370: id 0, so a nil check does not catch it.

### `CreateMinimapIcon`

| Case                     | Group | Outcome | Id  | Type                            | Message |
| ------------------------ | ----- | ------- | --- | ------------------------------- | ------- |
| typical arguments        | (a)   | handle  | 31  | `minimapicon: 0000020787F586E0` |         |
| x: 0                     | (a)   | handle  | 32  | `minimapicon: 0000020787F45FE0` |         |
| x: negative              | (a)   | handle  | 33  | `minimapicon: 0000020787E75020` |         |
| x: outside the world     | (a)   | handle  | 34  | `minimapicon: 0000020787DB1AD0` |         |
| x: 2147483647            | (a)   | handle  | 35  | `minimapicon: 0000020787D966E0` |         |
| y: 0                     | (a)   | handle  | 36  | `minimapicon: 0000020787D88DE0` |         |
| y: negative              | (a)   | handle  | 37  | `minimapicon: 0000020787D6F900` |         |
| y: outside the world     | (a)   | handle  | 38  | `minimapicon: 0000020784688C00` |         |
| y: 2147483647            | (a)   | handle  | 39  | `minimapicon: 0000020787D47700` |         |
| red: 0                   | (a)   | handle  | 40  | `minimapicon: 0000020787E43530` |         |
| red: negative            | (a)   | handle  | 41  | `minimapicon: 00000207836FCC70` |         |
| red: outside the world   | (a)   | handle  | 42  | `minimapicon: 00000207836FF150` |         |
| red: 2147483647          | (a)   | handle  | 43  | `minimapicon: 0000020783023EE0` |         |
| green: 0                 | (a)   | handle  | 44  | `minimapicon: 00000208610AC1F0` |         |
| green: negative          | (a)   | handle  | 45  | `minimapicon: 0000020783393B40` |         |
| green: outside the world | (a)   | handle  | 46  | `minimapicon: 0000020787DB8730` |         |
| green: 2147483647        | (a)   | handle  | 47  | `minimapicon: 0000020783365100` |         |
| blue: 0                  | (a)   | handle  | 48  | `minimapicon: 000002078334DD70` |         |
| blue: negative           | (a)   | handle  | 49  | `minimapicon: 000002078469C0B0` |         |
| blue: outside the world  | (a)   | handle  | 50  | `minimapicon: 000002078468AC00` |         |
| blue: 2147483647         | (a)   | handle  | 51  | `minimapicon: 0000020784680660` |         |
| pingPath: empty string   | (a)   | handle  | 52  | `minimapicon: 0000020787D324A0` |         |
| pingPath: unknown name   | (a)   | handle  | 53  | `minimapicon: 0000020783376640` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, x: 0, x: negative, x: outside the world, x: 2147483647, y: 0, y: negative, y: outside the world, y: 2147483647, red: 0, red: negative, red: outside the world, red: 2147483647, green: 0, green: negative, green: outside the world, green: 2147483647, blue: 0, blue: negative, blue: outside the world, blue: 2147483647, pingPath: empty string, pingPath: unknown name) on 3.0.1.24370; evidence, not proof.

### `CreateTextTag`

| Case     | Group | Outcome | Id   | Type                        | Message |
| -------- | ----- | ------- | ---- | --------------------------- | ------- |
| one call | (a)   | handle  | 9999 | `texttag: 000002078469D600` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (one call) on 3.0.1.24370; evidence, not proof.

### `CreateTrackable`

| Case                             | Group | Outcome | Id      | Type                          | Message |
| -------------------------------- | ----- | ------- | ------- | ----------------------------- | ------- |
| typical arguments                | (a)   | handle  | 1048895 | `trackable: 0000020787F65950` |         |
| trackableModelPath: empty string | (a)   | handle  | 1048896 | `trackable: 0000020784682420` |         |
| trackableModelPath: unknown name | (a)   | handle  | 1048897 | `trackable: 0000020784699520` |         |
| x: 0                             | (a)   | handle  | 1048898 | `trackable: 00000207846855F0` |         |
| x: negative                      | (a)   | handle  | 1048899 | `trackable: 00000207846A77B0` |         |
| x: outside the world             | (a)   | handle  | 1048900 | `trackable: 000002078469C6D0` |         |
| x: 2147483647                    | (a)   | handle  | 1048901 | `trackable: 0000020787E7E4E0` |         |
| y: 0                             | (a)   | handle  | 1048902 | `trackable: 0000020787E6E630` |         |
| y: negative                      | (a)   | handle  | 1048903 | `trackable: 0000020787E5D260` |         |
| y: outside the world             | (a)   | handle  | 1048904 | `trackable: 0000020787E54360` |         |
| y: 2147483647                    | (a)   | handle  | 1048905 | `trackable: 0000020787D8A9A0` |         |
| facing: 0                        | (a)   | handle  | 1048906 | `trackable: 0000020787D82970` |         |
| facing: negative                 | (a)   | handle  | 1048907 | `trackable: 0000020787D78430` |         |
| facing: outside the world        | (a)   | handle  | 1048908 | `trackable: 0000020787D741D0` |         |
| facing: 2147483647               | (a)   | handle  | 1048909 | `trackable: 0000020787D60560` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, trackableModelPath: empty string, trackableModelPath: unknown name, x: 0, x: negative, x: outside the world, x: 2147483647, y: 0, y: negative, y: outside the world, y: 2147483647, facing: 0, facing: negative, facing: outside the world, facing: 2147483647) on 3.0.1.24370; evidence, not proof.

### `CreateSound`

| Case                           | Group | Outcome | Id      | Type                      | Message |
| ------------------------------ | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments              | (a)   | handle  | 1048910 | `sound: 0000020787D47240` |         |
| fileName: empty string         | (a)   | handle  | 1048911 | `sound: 0000020787D32220` |         |
| fileName: unknown name         | (a)   | handle  | 1048912 | `sound: 0000020787D1FB10` |         |
| fadeInRate: 0                  | (a)   | handle  | 1048913 | `sound: 0000020783376500` |         |
| fadeInRate: negative           | (a)   | handle  | 1048914 | `sound: 0000020787E56920` |         |
| fadeInRate: outside the world  | (a)   | handle  | 1048915 | `sound: 0000020783364960` |         |
| fadeInRate: 2147483647         | (a)   | handle  | 1048916 | `sound: 00000207846A94F0` |         |
| fadeOutRate: 0                 | (a)   | handle  | 1048917 | `sound: 000002078336D2F0` |         |
| fadeOutRate: negative          | (a)   | handle  | 1048918 | `sound: 0000020787E6EBF0` |         |
| fadeOutRate: outside the world | (a)   | handle  | 1048919 | `sound: 0000020787E53AF0` |         |
| fadeOutRate: 2147483647        | (a)   | handle  | 1048920 | `sound: 0000020787D6D5F0` |         |
| eaxSetting: empty string       | (a)   | handle  | 1048921 | `sound: 0000020787D61900` |         |
| eaxSetting: unknown name       | (a)   | handle  | 1048922 | `sound: 0000020787D54FE0` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, fileName: empty string, fileName: unknown name, fadeInRate: 0, fadeInRate: negative, fadeInRate: outside the world, fadeInRate: 2147483647, fadeOutRate: 0, fadeOutRate: negative, fadeOutRate: outside the world, fadeOutRate: 2147483647, eaxSetting: empty string, eaxSetting: unknown name) on 3.0.1.24370; evidence, not proof.

### `CreateSoundFilenameWithLabel`

| Case                           | Group | Outcome | Id      | Type                      | Message |
| ------------------------------ | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments              | (a)   | handle  | 1048923 | `sound: 0000020787D315D0` |         |
| fileName: empty string         | (a)   | handle  | 1048924 | `sound: 0000020783398860` |         |
| fileName: unknown name         | (a)   | handle  | 1048925 | `sound: 000002078336C420` |         |
| fadeInRate: 0                  | (a)   | handle  | 1048926 | `sound: 00000207846A8A70` |         |
| fadeInRate: negative           | (a)   | handle  | 1048927 | `sound: 0000020787DAF7E0` |         |
| fadeInRate: outside the world  | (a)   | handle  | 1048928 | `sound: 0000020787DA25C0` |         |
| fadeInRate: 2147483647         | (a)   | handle  | 1048929 | `sound: 00000207846ADF90` |         |
| fadeOutRate: 0                 | (a)   | handle  | 1048930 | `sound: 0000020787E55A40` |         |
| fadeOutRate: negative          | (a)   | handle  | 1048931 | `sound: 0000020787DAF440` |         |
| fadeOutRate: outside the world | (a)   | handle  | 1048932 | `sound: 000002078337FF00` |         |
| fadeOutRate: 2147483647        | (a)   | handle  | 1048933 | `sound: 0000020787D6F7C0` |         |
| SLKEntryName: empty string     | (a)   | handle  | 1048934 | `sound: 0000020787D5BED0` |         |
| SLKEntryName: unknown name     | (a)   | handle  | 1048935 | `sound: 0000020787D3E6E0` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, fileName: empty string, fileName: unknown name, fadeInRate: 0, fadeInRate: negative, fadeInRate: outside the world, fadeInRate: 2147483647, fadeOutRate: 0, fadeOutRate: negative, fadeOutRate: outside the world, fadeOutRate: 2147483647, SLKEntryName: empty string, SLKEntryName: unknown name) on 3.0.1.24370; evidence, not proof.

### `CreateSoundFromLabel`

| Case                           | Group | Outcome | Id      | Type                      | Message |
| ------------------------------ | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments              | (a)   | handle  | 1048936 | `sound: 0000020787D27B30` |         |
| soundLabel: empty string       | (a)   | handle  | 1048937 | `sound: 0000020787D4E880` |         |
| soundLabel: unknown name       | (a)   | handle  | 1048938 | `sound: 0000020787DA0650` |         |
| fadeInRate: 0                  | (a)   | handle  | 1048939 | `sound: 0000020787D4C2F0` |         |
| fadeInRate: negative           | (a)   | handle  | 1048940 | `sound: 0000020787DB7FD0` |         |
| fadeInRate: outside the world  | (a)   | handle  | 1048941 | `sound: 00000207837EEE50` |         |
| fadeInRate: 2147483647         | (a)   | handle  | 1048942 | `sound: 0000020787DB2820` |         |
| fadeOutRate: 0                 | (a)   | handle  | 1048943 | `sound: 00000207833521E0` |         |
| fadeOutRate: negative          | (a)   | handle  | 1048944 | `sound: 00000207885142F0` |         |
| fadeOutRate: outside the world | (a)   | handle  | 1048945 | `sound: 0000020783382F90` |         |
| fadeOutRate: 2147483647        | (a)   | handle  | 1048946 | `sound: 000002078335BDB0` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, soundLabel: empty string, soundLabel: unknown name, fadeInRate: 0, fadeInRate: negative, fadeInRate: outside the world, fadeInRate: 2147483647, fadeOutRate: 0, fadeOutRate: negative, fadeOutRate: outside the world, fadeOutRate: 2147483647) on 3.0.1.24370; evidence, not proof.

### `CreateMIDISound`

| Case                           | Group | Outcome | Id      | Type                      | Message |
| ------------------------------ | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments              | (a)   | handle  | 1048947 | `sound: 0000020787D94540` |         |
| soundLabel: empty string       | (a)   | handle  | 1048948 | `sound: 00000207884F6C20` |         |
| soundLabel: unknown name       | (a)   | handle  | 1048949 | `sound: 0000020787E8D790` |         |
| fadeInRate: 0                  | (a)   | handle  | 1048950 | `sound: 0000020787E7A9B0` |         |
| fadeInRate: negative           | (a)   | handle  | 1048951 | `sound: 0000020787E73760` |         |
| fadeInRate: outside the world  | (a)   | handle  | 1048952 | `sound: 0000020787D8CCA0` |         |
| fadeInRate: 2147483647         | (a)   | handle  | 1048953 | `sound: 0000020787D7A500` |         |
| fadeOutRate: 0                 | (a)   | handle  | 1048954 | `sound: 0000020787D74FF0` |         |
| fadeOutRate: negative          | (a)   | handle  | 1048955 | `sound: 0000020787D55EB0` |         |
| fadeOutRate: outside the world | (a)   | handle  | 1048956 | `sound: 0000020787D2E300` |         |
| fadeOutRate: 2147483647        | (a)   | handle  | 1048957 | `sound: 0000020787D58750` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, soundLabel: empty string, soundLabel: unknown name, fadeInRate: 0, fadeInRate: negative, fadeInRate: outside the world, fadeInRate: 2147483647, fadeOutRate: 0, fadeOutRate: negative, fadeOutRate: outside the world, fadeOutRate: 2147483647) on 3.0.1.24370; evidence, not proof.

### `AddWeatherEffect`

| Case                      | Group | Outcome | Id  | Type                              | Message |
| ------------------------- | ----- | ------- | --- | --------------------------------- | ------- |
| typical arguments         | (a)   | handle  | 1   | `weathereffect: 0000020784699890` |         |
| effectID: unknown rawcode | (a)   | handle  | -1  | `weathereffect: 0000020787E94C80` |         |
| where: removed rect       | (b)   | handle  | 0   | `weathereffect: 00000208A4399E40` |         |

- Family: `constructor`
- Verdict: nullable (placeholder)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a placeholder handle in place of nothing in 2 cases of the nullability sweep (effectID: unknown rawcode, where: removed rect) on 3.0.1.24370: id 0 or -1, so a nil check does not catch it.

### `TerrainDeformCrater`

| Case                        | Group | Outcome | Id  | Type                                   | Message |
| --------------------------- | ----- | ------- | --- | -------------------------------------- | ------- |
| typical arguments           | (a)   | handle  | 0   | `terraindeformation: 0000020787DAECF0` |         |
| x: 0                        | (a)   | handle  | 1   | `terraindeformation: 0000020787DA88A0` |         |
| x: negative                 | (a)   | handle  | 2   | `terraindeformation: 0000020787DAC050` |         |
| x: outside the world        | (a)   | handle  | 3   | `terraindeformation: 000002078469B150` |         |
| x: 2147483647               | (a)   | handle  | 4   | `terraindeformation: 0000020787E54F20` |         |
| y: 0                        | (a)   | handle  | 5   | `terraindeformation: 0000020783390710` |         |
| y: negative                 | (a)   | handle  | 6   | `terraindeformation: 00000207837F4E80` |         |
| y: outside the world        | (a)   | handle  | 7   | `terraindeformation: 0000020787D86570` |         |
| y: 2147483647               | (a)   | handle  | 8   | `terraindeformation: 0000020787D72D20` |         |
| radius: 0                   | (a)   | handle  | 9   | `terraindeformation: 00000207837F4E30` |         |
| radius: negative            | (a)   | handle  | 10  | `terraindeformation: 0000020787D3AD40` |         |
| radius: outside the world   | (a)   | handle  | 11  | `terraindeformation: 000002078338DF00` |         |
| radius: 2147483647          | (a)   | handle  | 12  | `terraindeformation: 000002078338BA90` |         |
| depth: 0                    | (a)   | handle  | 13  | `terraindeformation: 000002078339B570` |         |
| depth: negative             | (a)   | handle  | 14  | `terraindeformation: 0000020787DC08B0` |         |
| depth: outside the world    | (a)   | handle  | 15  | `terraindeformation: 0000020787E70D70` |         |
| depth: 2147483647           | (a)   | handle  | 16  | `terraindeformation: 0000020787DC24D0` |         |
| duration: 0                 | (a)   | handle  | 17  | `terraindeformation: 0000020787DBEA10` |         |
| duration: negative          | (a)   | handle  | 18  | `terraindeformation: 00000207837F8D40` |         |
| duration: outside the world | (a)   | handle  | 19  | `terraindeformation: 0000020787DC3A50` |         |
| duration: 2147483647        | (a)   | handle  | 20  | `terraindeformation: 0000020787E59470` |         |

- Family: `constructor`
- Verdict: non-null (evidence, handle id 0 or -1)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, x: 0, x: negative, x: outside the world, x: 2147483647, y: 0, y: negative, y: outside the world, y: 2147483647, radius: 0, radius: negative, radius: outside the world, radius: 2147483647, depth: 0, depth: negative, depth: outside the world, depth: 2147483647, duration: 0, duration: negative, duration: outside the world, duration: 2147483647) on 3.0.1.24370; evidence, not proof. The handle had id 0 in a case (typical arguments).

### `TerrainDeformRipple`

| Case                              | Group | Outcome | Id  | Type                                   | Message |
| --------------------------------- | ----- | ------- | --- | -------------------------------------- | ------- |
| typical arguments                 | (a)   | handle  | 21  | `terraindeformation: 0000020787DBC5B0` |         |
| x: 0                              | (a)   | handle  | 22  | `terraindeformation: 0000020787E59430` |         |
| x: negative                       | (a)   | handle  | 23  | `terraindeformation: 0000020787DBDAB0` |         |
| x: outside the world              | (a)   | handle  | 24  | `terraindeformation: 0000020787D66070` |         |
| x: 2147483647                     | (a)   | handle  | 25  | `terraindeformation: 0000020783396890` |         |
| y: 0                              | (a)   | handle  | 26  | `terraindeformation: 0000020783387E40` |         |
| y: negative                       | (a)   | handle  | 27  | `terraindeformation: 0000020787D281A0` |         |
| y: outside the world              | (a)   | handle  | 28  | `terraindeformation: 0000020787D401B0` |         |
| y: 2147483647                     | (a)   | handle  | 29  | `terraindeformation: 00000207884AA6B0` |         |
| radius: 0                         | (a)   | handle  | 30  | `terraindeformation: 000002078845F320` |         |
| radius: negative                  | (a)   | handle  | 31  | `terraindeformation: 00000207885D6040` |         |
| radius: outside the world         | (a)   | handle  | 32  | `terraindeformation: 000002078855D5C0` |         |
| radius: 2147483647                | (a)   | handle  | 33  | `terraindeformation: 00000207881B1CF0` |         |
| depth: 0                          | (a)   | handle  | 34  | `terraindeformation: 00000207884692F0` |         |
| depth: negative                   | (a)   | handle  | 35  | `terraindeformation: 0000020787DC3A10` |         |
| depth: outside the world          | (a)   | handle  | 36  | `terraindeformation: 00000207881A1ED0` |         |
| depth: 2147483647                 | (a)   | handle  | 37  | `terraindeformation: 0000020788663ED0` |         |
| duration: 0                       | (a)   | handle  | 38  | `terraindeformation: 0000020788443420` |         |
| duration: negative                | (a)   | handle  | 39  | `terraindeformation: 000002078842B980` |         |
| duration: outside the world       | (a)   | handle  | 40  | `terraindeformation: 0000020788579150` |         |
| duration: 2147483647              | (a)   | handle  | 41  | `terraindeformation: 000002078857D690` |         |
| count: 0                          | (a)   | handle  | 42  | `terraindeformation: 00000207885A3870` |         |
| count: negative                   | (a)   | handle  | 43  | `terraindeformation: 000002078865E7A0` |         |
| count: outside the world          | (a)   | handle  | 44  | `terraindeformation: 0000020788673FA0` |         |
| count: 2147483647                 | (a)   | handle  | 45  | `terraindeformation: 0000020788631750` |         |
| spaceWaves: 0                     | (a)   | handle  | 46  | `terraindeformation: 0000020788630DA0` |         |
| spaceWaves: negative              | (a)   | handle  | 47  | `terraindeformation: 0000020787E71BF0` |         |
| spaceWaves: outside the world     | (a)   | handle  | 48  | `terraindeformation: 0000020783395460` |         |
| spaceWaves: 2147483647            | (a)   | handle  | 49  | `terraindeformation: 00000207886A00A0` |         |
| timeWaves: 0                      | (a)   | handle  | 50  | `terraindeformation: 00000207837F67B0` |         |
| timeWaves: negative               | (a)   | handle  | 51  | `terraindeformation: 000002078822A2B0` |         |
| timeWaves: outside the world      | (a)   | handle  | 52  | `terraindeformation: 00000207837FA160` |         |
| timeWaves: 2147483647             | (a)   | handle  | 53  | `terraindeformation: 00000207837F2BB0` |         |
| radiusStartPct: 0                 | (a)   | handle  | 54  | `terraindeformation: 000002078338F970` |         |
| radiusStartPct: negative          | (a)   | handle  | 55  | `terraindeformation: 000002078338A760` |         |
| radiusStartPct: outside the world | (a)   | handle  | 56  | `terraindeformation: 0000020787DC2490` |         |
| radiusStartPct: 2147483647        | (a)   | handle  | 57  | `terraindeformation: 000002078866DD40` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, x: 0, x: negative, x: outside the world, x: 2147483647, y: 0, y: negative, y: outside the world, y: 2147483647, radius: 0, radius: negative, radius: outside the world, radius: 2147483647, depth: 0, depth: negative, depth: outside the world, depth: 2147483647, duration: 0, duration: negative, duration: outside the world, duration: 2147483647, count: 0, count: negative, count: outside the world, count: 2147483647, spaceWaves: 0, spaceWaves: negative, spaceWaves: outside the world, spaceWaves: 2147483647, timeWaves: 0, timeWaves: negative, timeWaves: outside the world, timeWaves: 2147483647, radiusStartPct: 0, radiusStartPct: negative, radiusStartPct: outside the world, radiusStartPct: 2147483647) on 3.0.1.24370; evidence, not proof.

### `TerrainDeformWave`

| Case                         | Group | Outcome | Id  | Type                                   | Message |
| ---------------------------- | ----- | ------- | --- | -------------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 58  | `terraindeformation: 000002086815B7F0` |         |
| x: 0                         | (a)   | handle  | 59  | `terraindeformation: 0000020783372B10` |         |
| x: negative                  | (a)   | handle  | 60  | `terraindeformation: 0000020783389530` |         |
| x: outside the world         | (a)   | handle  | 61  | `terraindeformation: 0000020787E846D0` |         |
| x: 2147483647                | (a)   | handle  | 62  | `terraindeformation: 0000020787E83B70` |         |
| y: 0                         | (a)   | handle  | 63  | `terraindeformation: 0000020787D93BC0` |         |
| y: negative                  | (a)   | handle  | 64  | `terraindeformation: 0000020787D7D740` |         |
| y: outside the world         | (a)   | handle  | 65  | `terraindeformation: 0000020787E82830` |         |
| y: 2147483647                | (a)   | handle  | 66  | `terraindeformation: 0000020787E8B9D0` |         |
| dirX: 0                      | (a)   | handle  | 67  | `terraindeformation: 0000020787E66ED0` |         |
| dirX: negative               | (a)   | handle  | 68  | `terraindeformation: 0000020787E658A0` |         |
| dirX: outside the world      | (a)   | handle  | 69  | `terraindeformation: 0000020868156960` |         |
| dirX: 2147483647             | (a)   | handle  | 70  | `terraindeformation: 0000020868155270` |         |
| dirY: 0                      | (a)   | handle  | 71  | `terraindeformation: 000002086539D750` |         |
| dirY: negative               | (a)   | handle  | 72  | `terraindeformation: 000002086539B580` |         |
| dirY: outside the world      | (a)   | handle  | 73  | `terraindeformation: 00000207886E8190` |         |
| dirY: 2147483647             | (a)   | handle  | 74  | `terraindeformation: 00000207886EC7B0` |         |
| distance: 0                  | (a)   | handle  | 75  | `terraindeformation: 00000207886EB480` |         |
| distance: negative           | (a)   | handle  | 76  | `terraindeformation: 00000207886EED40` |         |
| distance: outside the world  | (a)   | handle  | 77  | `terraindeformation: 00000207886F3890` |         |
| distance: 2147483647         | (a)   | handle  | 78  | `terraindeformation: 00000207886FB320` |         |
| speed: 0                     | (a)   | handle  | 79  | `terraindeformation: 00000207886F5840` |         |
| speed: negative              | (a)   | handle  | 80  | `terraindeformation: 00000207886FA160` |         |
| speed: outside the world     | (a)   | handle  | 81  | `terraindeformation: 00000207886F8B70` |         |
| speed: 2147483647            | (a)   | handle  | 82  | `terraindeformation: 00000207886FE340` |         |
| radius: 0                    | (a)   | handle  | 83  | `terraindeformation: 0000020788702800` |         |
| radius: negative             | (a)   | handle  | 84  | `terraindeformation: 00000207887010F0` |         |
| radius: outside the world    | (a)   | handle  | 85  | `terraindeformation: 0000020788709510` |         |
| radius: 2147483647           | (a)   | handle  | 86  | `terraindeformation: 0000020788708430` |         |
| depth: 0                     | (a)   | handle  | 87  | `terraindeformation: 0000020788706C30` |         |
| depth: negative              | (a)   | handle  | 88  | `terraindeformation: 000002078870F1B0` |         |
| depth: outside the world     | (a)   | handle  | 89  | `terraindeformation: 00000207886EC770` |         |
| depth: 2147483647            | (a)   | handle  | 90  | `terraindeformation: 00000207837E23F0` |         |
| trailTime: 0                 | (a)   | handle  | 91  | `terraindeformation: 00000207886F14A0` |         |
| trailTime: negative          | (a)   | handle  | 92  | `terraindeformation: 000002078871DA30` |         |
| trailTime: outside the world | (a)   | handle  | 93  | `terraindeformation: 0000020788721D10` |         |
| trailTime: 2147483647        | (a)   | handle  | 94  | `terraindeformation: 000002078871D3F0` |         |
| count: 0                     | (a)   | handle  | 95  | `terraindeformation: 0000020788724000` |         |
| count: negative              | (a)   | handle  | 96  | `terraindeformation: 00000207887287C0` |         |
| count: outside the world     | (a)   | handle  | 97  | `terraindeformation: 000002078872C9F0` |         |
| count: 2147483647            | (a)   | handle  | 98  | `terraindeformation: 000002078872B1F0` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, x: 0, x: negative, x: outside the world, x: 2147483647, y: 0, y: negative, y: outside the world, y: 2147483647, dirX: 0, dirX: negative, dirX: outside the world, dirX: 2147483647, dirY: 0, dirY: negative, dirY: outside the world, dirY: 2147483647, distance: 0, distance: negative, distance: outside the world, distance: 2147483647, speed: 0, speed: negative, speed: outside the world, speed: 2147483647, radius: 0, radius: negative, radius: outside the world, radius: 2147483647, depth: 0, depth: negative, depth: outside the world, depth: 2147483647, trailTime: 0, trailTime: negative, trailTime: outside the world, trailTime: 2147483647, count: 0, count: negative, count: outside the world, count: 2147483647) on 3.0.1.24370; evidence, not proof.

### `TerrainDeformRandom`

| Case                              | Group | Outcome | Id  | Type                                   | Message |
| --------------------------------- | ----- | ------- | --- | -------------------------------------- | ------- |
| typical arguments                 | (a)   | handle  | 99  | `terraindeformation: 000002078872E490` |         |
| x: 0                              | (a)   | handle  | 100 | `terraindeformation: 0000020788732220` |         |
| x: negative                       | (a)   | handle  | 101 | `terraindeformation: 0000020788730140` |         |
| x: outside the world              | (a)   | handle  | 102 | `terraindeformation: 000002078873B790` |         |
| x: 2147483647                     | (a)   | handle  | 103 | `terraindeformation: 0000020788739320` |         |
| y: 0                              | (a)   | handle  | 104 | `terraindeformation: 0000020788737690` |         |
| y: negative                       | (a)   | handle  | 105 | `terraindeformation: 000002078873BB10` |         |
| y: outside the world              | (a)   | handle  | 106 | `terraindeformation: 000002078873FA30` |         |
| y: 2147483647                     | (a)   | handle  | 107 | `terraindeformation: 0000020788741BD0` |         |
| radius: 0                         | (a)   | handle  | 108 | `terraindeformation: 0000020788742230` |         |
| radius: negative                  | (a)   | handle  | 109 | `terraindeformation: 0000020788745F50` |         |
| radius: outside the world         | (a)   | handle  | 110 | `terraindeformation: 0000020788748190` |         |
| radius: 2147483647                | (a)   | handle  | 111 | `terraindeformation: 0000020788750DD0` |         |
| minDelta: 0                       | (a)   | handle  | 112 | `terraindeformation: 000002078874F420` |         |
| minDelta: negative                | (a)   | handle  | 113 | `terraindeformation: 000002078874B750` |         |
| minDelta: outside the world       | (a)   | handle  | 114 | `terraindeformation: 0000020788741470` |         |
| minDelta: 2147483647              | (a)   | handle  | 115 | `terraindeformation: 000002078874E5D0` |         |
| maxDelta: 0                       | (a)   | handle  | 116 | `terraindeformation: 000002078875A360` |         |
| maxDelta: negative                | (a)   | handle  | 117 | `terraindeformation: 000002078874D850` |         |
| maxDelta: outside the world       | (a)   | handle  | 118 | `terraindeformation: 0000020788760CA0` |         |
| maxDelta: 2147483647              | (a)   | handle  | 119 | `terraindeformation: 0000020788764E00` |         |
| duration: 0                       | (a)   | handle  | 120 | `terraindeformation: 000002078875C930` |         |
| duration: negative                | (a)   | handle  | 121 | `terraindeformation: 000002078876D700` |         |
| duration: outside the world       | (a)   | handle  | 122 | `terraindeformation: 000002078876B0C0` |         |
| duration: 2147483647              | (a)   | handle  | 123 | `terraindeformation: 00000207887665D0` |         |
| updateInterval: 0                 | (a)   | handle  | 124 | `terraindeformation: 0000020788774090` |         |
| updateInterval: negative          | (a)   | handle  | 125 | `terraindeformation: 0000020788771F80` |         |
| updateInterval: outside the world | (a)   | handle  | 126 | `terraindeformation: 000002078876A6A0` |         |
| updateInterval: 2147483647        | (a)   | handle  | 127 | `terraindeformation: 00000207887749F0` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, x: 0, x: negative, x: outside the world, x: 2147483647, y: 0, y: negative, y: outside the world, y: 2147483647, radius: 0, radius: negative, radius: outside the world, radius: 2147483647, minDelta: 0, minDelta: negative, minDelta: outside the world, minDelta: 2147483647, maxDelta: 0, maxDelta: negative, maxDelta: outside the world, maxDelta: 2147483647, duration: 0, duration: negative, duration: outside the world, duration: 2147483647, updateInterval: 0, updateInterval: negative, updateInterval: outside the world, updateInterval: 2147483647) on 3.0.1.24370; evidence, not proof.

### `AddSpecialEffect`

| Case                    | Group | Outcome | Id      | Type                       | Message |
| ----------------------- | ----- | ------- | ------- | -------------------------- | ------- |
| typical arguments       | (a)   | handle  | 1048958 | `effect: 00000207888093F0` |         |
| modelName: empty string | (a)   | handle  | 1048959 | `effect: 00000207887FA5F0` |         |
| modelName: unknown name | (a)   | handle  | 1048960 | `effect: 00000207887FE680` |         |
| x: 0                    | (a)   | handle  | 1048961 | `effect: 000002078882D350` |         |
| x: negative             | (a)   | handle  | 1048962 | `effect: 00000207887F88A0` |         |
| x: outside the world    | (a)   | handle  | 1048963 | `effect: 0000020788776A90` |         |
| x: 2147483647           | (a)   | handle  | 1048964 | `effect: 00000207887F1280` |         |
| y: 0                    | (a)   | handle  | 1048965 | `effect: 00000207887F50B0` |         |
| y: negative             | (a)   | handle  | 1048966 | `effect: 000002078877C770` |         |
| y: outside the world    | (a)   | handle  | 1048967 | `effect: 0000020788780550` |         |
| y: 2147483647           | (a)   | handle  | 1048968 | `effect: 000002078877EA40` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, modelName: empty string, modelName: unknown name, x: 0, x: negative, x: outside the world, x: 2147483647, y: 0, y: negative, y: outside the world, y: 2147483647) on 3.0.1.24370; evidence, not proof.

### `AddSpecialEffectLoc`

| Case                    | Group | Outcome | Id      | Type                       | Message |
| ----------------------- | ----- | ------- | ------- | -------------------------- | ------- |
| typical arguments       | (a)   | handle  | 1048969 | `effect: 0000020788852D80` |         |
| modelName: empty string | (a)   | handle  | 1048970 | `effect: 000002078885D410` |         |
| modelName: unknown name | (a)   | handle  | 1048971 | `effect: 0000020788856060` |         |
| where: removed location | (b)   | nil     |         |                            |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (where: removed location) on 3.0.1.24370.

### `AddSpecialEffectTarget`

| Case                               | Group | Outcome | Id      | Type                       | Message |
| ---------------------------------- | ----- | ------- | ------- | -------------------------- | ------- |
| typical arguments                  | (a)   | handle  | 1048972 | `effect: 0000020788844C70` |         |
| modelName: empty string            | (a)   | handle  | 1048973 | `effect: 0000020788848870` |         |
| modelName: unknown name            | (a)   | handle  | 1048974 | `effect: 000002078884CE80` |         |
| attachPointName: empty string      | (a)   | nil     |         |                            |         |
| attachPointName: unknown name      | (a)   | handle  | 1048975 | `effect: 000002078884C860` |         |
| targetWidget: dead unit            | (b)   | handle  | 1049026 | `effect: 00000208A438FC80` |         |
| targetWidget: removed unit         | (b)   | handle  | 1049027 | `effect: 00000208A439C630` |         |
| targetWidget: dead item            | (b)   | handle  | 1049028 | `effect: 00000208A43B17F0` |         |
| targetWidget: removed item         | (b)   | nil     |         |                            |         |
| targetWidget: dead destructable    | (b)   | handle  | 1049029 | `effect: 0000020788A5ED00` |         |
| targetWidget: removed destructable | (b)   | nil     |         |                            |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 3 cases of the nullability sweep (attachPointName: empty string, targetWidget: removed item, targetWidget: removed destructable) on 3.0.1.24370.

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
- Proposed `notes`: Returned nothing in 11 cases of the nullability sweep (typical arguments, abilityString: empty string, abilityString: unknown name, x: 0, x: negative, x: outside the world, x: 2147483647, y: 0, y: negative, y: outside the world, y: 2147483647) on 3.0.1.24370.

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
- Proposed `notes`: Returned nothing in 4 cases of the nullability sweep (typical arguments, abilityString: empty string, abilityString: unknown name, where: removed location) on 3.0.1.24370.

### `AddSpellEffectById`

| Case                       | Group | Outcome | Id      | Type                       | Message |
| -------------------------- | ----- | ------- | ------- | -------------------------- | ------- |
| typical arguments          | (a)   | handle  | 1048976 | `effect: 0000020788884020` |         |
| abilityId: unknown rawcode | (a)   | nil     |         |                            |         |
| x: 0                       | (a)   | handle  | 1048977 | `effect: 000002078888C150` |         |
| x: negative                | (a)   | handle  | 1048978 | `effect: 00000207888908A0` |         |
| x: outside the world       | (a)   | handle  | 1048979 | `effect: 0000020788887F40` |         |
| x: 2147483647              | (a)   | handle  | 1048980 | `effect: 00000207888961E0` |         |
| y: 0                       | (a)   | handle  | 1048981 | `effect: 000002078889A370` |         |
| y: negative                | (a)   | handle  | 1048982 | `effect: 0000020788898D60` |         |
| y: outside the world       | (a)   | handle  | 1048983 | `effect: 000002078889FEB0` |         |
| y: 2147483647              | (a)   | handle  | 1048984 | `effect: 000002078888FB50` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (abilityId: unknown rawcode) on 3.0.1.24370.

### `AddSpellEffectByIdLoc`

| Case                       | Group | Outcome | Id      | Type                       | Message |
| -------------------------- | ----- | ------- | ------- | -------------------------- | ------- |
| typical arguments          | (a)   | handle  | 1048985 | `effect: 00000207888C6DF0` |         |
| abilityId: unknown rawcode | (a)   | nil     |         |                            |         |
| where: removed location    | (b)   | nil     |         |                            |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 2 cases of the nullability sweep (abilityId: unknown rawcode, where: removed location) on 3.0.1.24370.

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
- Proposed `notes`: Returned nothing in 11 cases of the nullability sweep (typical arguments, modelName: empty string, modelName: unknown name, attachPoint: empty string, attachPoint: unknown name, targetWidget: dead unit, targetWidget: removed unit, targetWidget: dead item, targetWidget: removed item, targetWidget: dead destructable, targetWidget: removed destructable) on 3.0.1.24370.

### `AddSpellEffectTargetById`

| Case                               | Group | Outcome | Id      | Type                       | Message |
| ---------------------------------- | ----- | ------- | ------- | -------------------------- | ------- |
| typical arguments                  | (a)   | handle  | 1048986 | `effect: 00000207888D0A70` |         |
| abilityId: unknown rawcode         | (a)   | nil     |         |                            |         |
| attachPoint: empty string          | (a)   | nil     |         |                            |         |
| attachPoint: unknown name          | (a)   | handle  | 1048987 | `effect: 00000207888D5550` |         |
| targetWidget: dead unit            | (b)   | handle  | 1049030 | `effect: 00000208A43C0B90` |         |
| targetWidget: removed unit         | (b)   | handle  | 1049031 | `effect: 00000208A43AC1D0` |         |
| targetWidget: dead item            | (b)   | handle  | 1049032 | `effect: 00000208A43C5C80` |         |
| targetWidget: removed item         | (b)   | nil     |         |                            |         |
| targetWidget: dead destructable    | (b)   | handle  | 1049033 | `effect: 00000208A43C75A0` |         |
| targetWidget: removed destructable | (b)   | nil     |         |                            |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 4 cases of the nullability sweep (abilityId: unknown rawcode, attachPoint: empty string, targetWidget: removed item, targetWidget: removed destructable) on 3.0.1.24370.

### `AddLightning`

| Case                                 | Group | Outcome | Id      | Type                          | Message |
| ------------------------------------ | ----- | ------- | ------- | ----------------------------- | ------- |
| typical arguments                    | (a)   | handle  | 2       | `lightning: 00000207889315D0` |         |
| codeName: empty string               | (a)   | handle  | 0       | `lightning: 00000207888D9560` |         |
| codeName: unknown name               | (a)   | handle  | 0       | `lightning: 00000207888D9560` |         |
| x1: 0                                | (a)   | handle  | 65538   | `lightning: 00000207889484C0` |         |
| x1: negative                         | (a)   | handle  | 131074  | `lightning: 0000020788949470` |         |
| x1: outside the world                | (a)   | handle  | 196610  | `lightning: 0000020788956150` |         |
| x1: 2147483647                       | (a)   | handle  | 262146  | `lightning: 0000020788954610` |         |
| y1: 0                                | (a)   | handle  | 327682  | `lightning: 00000207888DCC10` |         |
| y1: negative                         | (a)   | handle  | 393218  | `lightning: 00000207888DD720` |         |
| y1: outside the world                | (a)   | handle  | 458754  | `lightning: 0000020788956260` |         |
| y1: 2147483647                       | (a)   | handle  | 524290  | `lightning: 000002078895AFF0` |         |
| x2: 0                                | (a)   | handle  | 589826  | `lightning: 000002078895A030` |         |
| x2: negative                         | (a)   | handle  | 655362  | `lightning: 000002078895AA50` |         |
| x2: outside the world                | (a)   | handle  | 720898  | `lightning: 000002078895EF20` |         |
| x2: 2147483647                       | (a)   | handle  | 786434  | `lightning: 000002078895D1D0` |         |
| y2: 0                                | (a)   | handle  | 851970  | `lightning: 0000020788958FF0` |         |
| y2: negative                         | (a)   | handle  | 917506  | `lightning: 0000020788962DE0` |         |
| y2: outside the world                | (a)   | handle  | 983042  | `lightning: 000002078896E210` |         |
| y2: 2147483647                       | (a)   | handle  | 1048578 | `lightning: 000002078896CDB0` |         |
| checkVisibility: true, points unseen | (a)   | handle  | 0       | `lightning: 00000207888D9560` |         |

- Family: `constructor`
- Verdict: nullable (placeholder)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a placeholder handle in place of nothing in 3 cases of the nullability sweep (codeName: empty string, codeName: unknown name, checkVisibility: true, points unseen) on 3.0.1.24370: id 0, so a nil check does not catch it.

### `AddLightningEx`

| Case                                 | Group | Outcome | Id      | Type                          | Message |
| ------------------------------------ | ----- | ------- | ------- | ----------------------------- | ------- |
| typical arguments                    | (a)   | handle  | 1114114 | `lightning: 0000020788970280` |         |
| codeName: empty string               | (a)   | handle  | 0       | `lightning: 00000207888D9560` |         |
| codeName: unknown name               | (a)   | handle  | 0       | `lightning: 00000207888D9560` |         |
| x1: 0                                | (a)   | handle  | 1179650 | `lightning: 000002078896D8D0` |         |
| x1: negative                         | (a)   | handle  | 1245186 | `lightning: 0000020788978360` |         |
| x1: outside the world                | (a)   | handle  | 1310722 | `lightning: 000002078897D450` |         |
| x1: 2147483647                       | (a)   | handle  | 1376258 | `lightning: 000002078897CC90` |         |
| y1: 0                                | (a)   | handle  | 1441794 | `lightning: 000002078897B870` |         |
| y1: negative                         | (a)   | handle  | 1507330 | `lightning: 00000207889846A0` |         |
| y1: outside the world                | (a)   | handle  | 1572866 | `lightning: 000002078897ED90` |         |
| y1: 2147483647                       | (a)   | handle  | 1638402 | `lightning: 0000020788981D10` |         |
| z1: 0                                | (a)   | handle  | 1703938 | `lightning: 0000020788983BE0` |         |
| z1: negative                         | (a)   | handle  | 1769474 | `lightning: 0000020788999410` |         |
| z1: outside the world                | (a)   | handle  | 1835010 | `lightning: 000002078899DDE0` |         |
| z1: 2147483647                       | (a)   | handle  | 1900546 | `lightning: 0000020788972E70` |         |
| x2: 0                                | (a)   | handle  | 1966082 | `lightning: 000002078899CD00` |         |
| x2: negative                         | (a)   | handle  | 2031618 | `lightning: 00000207889A24E0` |         |
| x2: outside the world                | (a)   | handle  | 2097154 | `lightning: 00000207889A7270` |         |
| x2: 2147483647                       | (a)   | handle  | 2162690 | `lightning: 0000020788982BA0` |         |
| y2: 0                                | (a)   | handle  | 2228226 | `lightning: 00000207889A9FD0` |         |
| y2: negative                         | (a)   | handle  | 2293762 | `lightning: 00000207889AB600` |         |
| y2: outside the world                | (a)   | handle  | 2359298 | `lightning: 00000207889B05F0` |         |
| y2: 2147483647                       | (a)   | handle  | 2424834 | `lightning: 00000207889B2430` |         |
| z2: 0                                | (a)   | handle  | 2490370 | `lightning: 00000207889AEF00` |         |
| z2: negative                         | (a)   | handle  | 2555906 | `lightning: 00000207889B4550` |         |
| z2: outside the world                | (a)   | handle  | 2621442 | `lightning: 00000207889BA7A0` |         |
| z2: 2147483647                       | (a)   | handle  | 2686978 | `lightning: 00000207889B63C0` |         |
| checkVisibility: true, points unseen | (a)   | handle  | 0       | `lightning: 00000207888D9560` |         |

- Family: `constructor`
- Verdict: nullable (placeholder)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a placeholder handle in place of nothing in 3 cases of the nullability sweep (codeName: empty string, codeName: unknown name, checkVisibility: true, points unseen) on 3.0.1.24370: id 0, so a nil check does not catch it.

### `CreateImage`

| Case                         | Group | Outcome | Id  | Type                      | Message                            |
| ---------------------------- | ----- | ------- | --- | ------------------------- | ---------------------------------- |
| typical arguments            | (a)   | handle  | 143 | `image: 00000207889BD510` |                                    |
| file: empty string           | (a)   | handle  | -1  | `image: 00000207889C4290` |                                    |
| file: unknown name           | (a)   | handle  | -1  | `image: 00000207889C4290` |                                    |
| sizeX: 0                     | (a)   | handle  | 144 | `image: 00000207889C1840` |                                    |
| sizeX: negative              | (a)   | handle  | 145 | `image: 00000207889C6A00` |                                    |
| sizeX: outside the world     | (a)   | handle  | 146 | `image: 00000207889CB3F0` |                                    |
| sizeX: 2147483647            | (a)   | handle  | 147 | `image: 00000207889B2290` |                                    |
| sizeY: 0                     | (a)   | handle  | 148 | `image: 00000207889C9B00` |                                    |
| sizeY: negative              | (a)   | handle  | 149 | `image: 00000207889D35F0` |                                    |
| sizeY: outside the world     | (a)   | handle  | 150 | `image: 00000207889D7CD0` |                                    |
| sizeY: 2147483647            | (a)   | handle  | 151 | `image: 00000207889CD7D0` |                                    |
| sizeZ: 0                     | (a)   | handle  | 152 | `image: 00000207889D68D0` |                                    |
| sizeZ: negative              | (a)   | handle  | 153 | `image: 0000020788A30660` |                                    |
| sizeZ: outside the world     | (a)   | handle  | 154 | `image: 00000207889D5460` |                                    |
| sizeZ: 2147483647            | (a)   | handle  | 155 | `image: 0000020788A33290` |                                    |
| posX: 0                      | (a)   | handle  | 156 | `image: 0000020788A978A0` |                                    |
| posX: negative               | (a)   | handle  | 157 | `image: 0000020788A9C400` |                                    |
| posX: outside the world      | (a)   | handle  | 158 | `image: 0000020788A9BEE0` |                                    |
| posX: 2147483647             | (a)   | handle  | 159 | `image: 0000020788A9A360` |                                    |
| posY: 0                      | (a)   | handle  | 160 | `image: 0000020788AA0710` |                                    |
| posY: negative               | (a)   | handle  | 161 | `image: 0000020788AA4D10` |                                    |
| posY: outside the world      | (a)   | handle  | 162 | `image: 0000020788A9E8B0` |                                    |
| posY: 2147483647             | (a)   | handle  | 163 | `image: 0000020788AA3D70` |                                    |
| posZ: 0                      | (a)   | handle  | 164 | `image: 0000020788AA9C20` |                                    |
| posZ: negative               | (a)   | handle  | 165 | `image: 0000020788AADF50` |                                    |
| posZ: outside the world      | (a)   | handle  | 166 | `image: 0000020788AB1EF0` |                                    |
| posZ: 2147483647             | (a)   | handle  | 167 | `image: 0000020788AACEF0` |                                    |
| originX: 0                   | (a)   | handle  | 168 | `image: 0000020788AB2FD0` |                                    |
| originX: negative            | (a)   | handle  | 169 | `image: 0000020788AB7420` |                                    |
| originX: outside the world   | (a)   | handle  | 170 | `image: 0000020788ABB590` |                                    |
| originX: 2147483647          | (a)   | handle  | 171 | `image: 0000020788ABA770` |                                    |
| originY: 0                   | (a)   | handle  | 172 | `image: 0000020788ABC1F0` |                                    |
| originY: negative            | (a)   | handle  | 173 | `image: 0000020788AC0740` |                                    |
| originY: outside the world   | (a)   | handle  | 174 | `image: 0000020788AAB9C0` |                                    |
| originY: 2147483647          | (a)   | handle  | 175 | `image: 0000020788AC2BE0` |                                    |
| originZ: negative            | (a)   | handle  | 176 | `image: 0000020788AC54E0` |                                    |
| originZ: outside the world   | (a)   | handle  | 177 | `image: 0000020788AC9990` |                                    |
| originZ: 2147483647          | (a)   | handle  | 178 | `image: 0000020788ACD980` |                                    |
| imageType: 0                 | (a)   | handle  | -1  | `image: 00000207889C4290` |                                    |
| imageType: negative          | (a)   | handle  | 179 | `image: 0000020788ACED90` |                                    |
| imageType: outside the world | (a)   | handle  | 180 | `image: 0000020788AD2ED0` |                                    |
| imageType: 2147483647        | (a)   | crashed |     |                           | skipped: crashed in an earlier run |

- Family: `constructor`
- Verdict: unsafe
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Crashed the game in a case of the nullability sweep (imageType: 2147483647) on 3.0.1.24370. Returned a handle in every other case (typical arguments, file: empty string, file: unknown name, sizeX: 0, sizeX: negative, sizeX: outside the world, sizeX: 2147483647, sizeY: 0, sizeY: negative, sizeY: outside the world, sizeY: 2147483647, sizeZ: 0, sizeZ: negative, sizeZ: outside the world, sizeZ: 2147483647, posX: 0, posX: negative, posX: outside the world, posX: 2147483647, posY: 0, posY: negative, posY: outside the world, posY: 2147483647, posZ: 0, posZ: negative, posZ: outside the world, posZ: 2147483647, originX: 0, originX: negative, originX: outside the world, originX: 2147483647, originY: 0, originY: negative, originY: outside the world, originY: 2147483647, originZ: negative, originZ: outside the world, originZ: 2147483647, imageType: 0, imageType: negative, imageType: outside the world). The handle had id -1 in 3 cases (file: empty string, file: unknown name, imageType: 0).

### `CreateUbersplat`

| Case                     | Group | Outcome | Id  | Type                          | Message |
| ------------------------ | ----- | ------- | --- | ----------------------------- | ------- |
| typical arguments        | (a)   | handle  | 1   | `ubersplat: 0000020788AD6960` |         |
| x: 0                     | (a)   | handle  | 2   | `ubersplat: 0000020788ACD360` |         |
| x: negative              | (a)   | handle  | 3   | `ubersplat: 0000020788B0DAC0` |         |
| x: outside the world     | (a)   | handle  | 4   | `ubersplat: 0000020788B13A50` |         |
| x: 2147483647            | (a)   | handle  | 5   | `ubersplat: 0000020788B07CF0` |         |
| y: 0                     | (a)   | handle  | 6   | `ubersplat: 0000020788AF8260` |         |
| y: negative              | (a)   | handle  | 7   | `ubersplat: 0000020788AFE9E0` |         |
| y: outside the world     | (a)   | handle  | 8   | `ubersplat: 0000020788AF6840` |         |
| y: 2147483647            | (a)   | handle  | 9   | `ubersplat: 0000020788B10E70` |         |
| name: empty string       | (a)   | handle  | -1  | `ubersplat: 0000020788B0DF20` |         |
| name: unknown name       | (a)   | handle  | -1  | `ubersplat: 0000020788B0DF20` |         |
| red: 0                   | (a)   | handle  | 10  | `ubersplat: 000002078851FB00` |         |
| red: negative            | (a)   | handle  | 11  | `ubersplat: 0000020788B0A860` |         |
| red: outside the world   | (a)   | handle  | 12  | `ubersplat: 0000020788AF96C0` |         |
| red: 2147483647          | (a)   | handle  | 13  | `ubersplat: 0000020788AFA9A0` |         |
| green: 0                 | (a)   | handle  | 14  | `ubersplat: 0000020788B0CD60` |         |
| green: negative          | (a)   | handle  | 15  | `ubersplat: 0000020788AEF000` |         |
| green: outside the world | (a)   | handle  | 16  | `ubersplat: 0000020788AE37D0` |         |
| green: 2147483647        | (a)   | handle  | 17  | `ubersplat: 0000020788AE3B00` |         |
| blue: 0                  | (a)   | handle  | 18  | `ubersplat: 0000020788ADBCF0` |         |
| blue: negative           | (a)   | handle  | 19  | `ubersplat: 0000020788AE0070` |         |
| blue: outside the world  | (a)   | handle  | 20  | `ubersplat: 0000020788ADA290` |         |
| blue: 2147483647         | (a)   | handle  | 21  | `ubersplat: 0000020788AF0E10` |         |
| alpha: 0                 | (a)   | handle  | 22  | `ubersplat: 0000020788AEA180` |         |
| alpha: negative          | (a)   | handle  | 23  | `ubersplat: 0000020788AE9D40` |         |
| alpha: outside the world | (a)   | handle  | 24  | `ubersplat: 0000020788AEDC00` |         |
| alpha: 2147483647        | (a)   | handle  | 25  | `ubersplat: 0000020788AE7BC0` |         |

- Family: `constructor`
- Verdict: nullable (placeholder)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned a placeholder handle in place of nothing in 2 cases of the nullability sweep (name: empty string, name: unknown name) on 3.0.1.24370: id -1, so a nil check does not catch it.

### `CreateBlightedGoldmine`

| Case                    | Group | Outcome | Id      | Type                     | Message |
| ----------------------- | ----- | ------- | ------- | ------------------------ | ------- |
| typical arguments       | (a)   | handle  | 1048988 | `unit: 0000020788B1A200` |         |
| x: 0                    | (a)   | handle  | 1048989 | `unit: 000002078895E510` |         |
| x: negative             | (a)   | handle  | 1048990 | `unit: 000002087BA98890` |         |
| x: outside the world    | (a)   | handle  | 1048991 | `unit: 0000020788B3D2E0` |         |
| x: 2147483647           | (a)   | handle  | 1048992 | `unit: 00000208840811A0` |         |
| y: 0                    | (a)   | handle  | 1048993 | `unit: 0000020788B3ADB0` |         |
| y: negative             | (a)   | handle  | 1048994 | `unit: 0000020788B6A6B0` |         |
| y: outside the world    | (a)   | handle  | 1048995 | `unit: 0000020788B87140` |         |
| y: 2147483647           | (a)   | handle  | 1048996 | `unit: 0000020788B798D0` |         |
| face: 0                 | (a)   | handle  | 1048997 | `unit: 000002088410A9D0` |         |
| face: negative          | (a)   | handle  | 1048998 | `unit: 0000020788B568C0` |         |
| face: outside the world | (a)   | handle  | 1048999 | `unit: 0000020788277A70` |         |
| face: 2147483647        | (a)   | handle  | 1049000 | `unit: 0000020788B6D470` |         |

- Family: `constructor`
- Verdict: non-null (evidence)
- Overlay `returns.nullable`: `false`
- Comparison: consistent
- Proposed `notes`: Returned a handle in every case of the nullability sweep (typical arguments, x: 0, x: negative, x: outside the world, x: 2147483647, y: 0, y: negative, y: outside the world, y: 2147483647, face: 0, face: negative, face: outside the world, face: 2147483647) on 3.0.1.24370; evidence, not proof.

### `BlzCreateItemWithSkin`

| Case                    | Group | Outcome | Id      | Type                     | Message |
| ----------------------- | ----- | ------- | ------- | ------------------------ | ------- |
| typical arguments       | (a)   | handle  | 1049001 | `item: 0000020788A67290` |         |
| itemid: unknown rawcode | (a)   | nil     |         |                          |         |
| x: 0                    | (a)   | handle  | 1049002 | `item: 0000020788A90340` |         |
| x: negative             | (a)   | handle  | 1049003 | `item: 000002087BA05230` |         |
| x: outside the world    | (a)   | handle  | 1049004 | `item: 0000020788A76C50` |         |
| x: 2147483647           | (a)   | handle  | 1049005 | `item: 0000020788A738C0` |         |
| y: 0                    | (a)   | handle  | 1049006 | `item: 0000020788A8A2D0` |         |
| y: negative             | (a)   | handle  | 1049007 | `item: 0000020788A59C80` |         |
| y: outside the world    | (a)   | handle  | 1049008 | `item: 0000020788A92CD0` |         |
| y: 2147483647           | (a)   | handle  | 1049009 | `item: 0000020788A8C980` |         |
| skinId: unknown rawcode | (a)   | handle  | 1049010 | `item: 0000020788A82FD0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (itemid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateUnitWithSkin`

| Case                    | Group | Outcome | Id      | Type                     | Message |
| ----------------------- | ----- | ------- | ------- | ------------------------ | ------- |
| typical arguments       | (a)   | handle  | 1049011 | `unit: 000002088420F2B0` |         |
| unitid: unknown rawcode | (a)   | nil     |         |                          |         |
| x: 0                    | (a)   | handle  | 1049012 | `unit: 0000020788A74A10` |         |
| x: negative             | (a)   | handle  | 1049013 | `unit: 0000020788A7D890` |         |
| x: outside the world    | (a)   | handle  | 1049014 | `unit: 00000208A42CE780` |         |
| x: 2147483647           | (a)   | handle  | 1049015 | `unit: 0000020788A6EE40` |         |
| y: 0                    | (a)   | handle  | 1049016 | `unit: 00000208A42FEBE0` |         |
| y: negative             | (a)   | handle  | 1049017 | `unit: 00000208A4333A20` |         |
| y: outside the world    | (a)   | handle  | 1049018 | `unit: 00000208A4348DF0` |         |
| y: 2147483647           | (a)   | handle  | 1049019 | `unit: 00000208A4341170` |         |
| face: 0                 | (a)   | handle  | 1049020 | `unit: 00000208A4359890` |         |
| face: negative          | (a)   | handle  | 1049021 | `unit: 00000208A4368560` |         |
| face: outside the world | (a)   | handle  | 1049022 | `unit: 00000208A4373390` |         |
| face: 2147483647        | (a)   | handle  | 1049023 | `unit: 00000208A437F760` |         |
| skinId: unknown rawcode | (a)   | handle  | 1049024 | `unit: 00000208A43835B0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (unitid: unknown rawcode) on 3.0.1.24370.

## `nullability-constructors-destructables`

- Probe: `nullability-constructors-destructables`
- Patch: 3.0.1.24370
- Client: 3.0.1.24371
- Date: 2026-10-21
- Run: `0d6d4ba8-ae02-43f9-927d-dc81715af8f2`

### `CreateDestructable`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1048777 | `destructable: 00000171878C0550` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1048778 | `destructable: 00000171878525E0` |         |
| x: negative                  | (a)   | handle  | 1048779 | `destructable: 000001718782E4A0` |         |
| x: outside the world         | (a)   | handle  | 1048780 | `destructable: 000001718785D7F0` |         |
| x: 2147483647                | (a)   | handle  | 1048781 | `destructable: 00000171877EC9F0` |         |
| y: 0                         | (a)   | handle  | 1048782 | `destructable: 0000017187806750` |         |
| y: negative                  | (a)   | handle  | 1048783 | `destructable: 00000171877CA980` |         |
| y: outside the world         | (a)   | handle  | 1048784 | `destructable: 00000171877C1B70` |         |
| y: 2147483647                | (a)   | handle  | 1048785 | `destructable: 000001718779E2C0` |         |
| face: 0                      | (a)   | handle  | 1048786 | `destructable: 0000017187783F40` |         |
| face: negative               | (a)   | handle  | 1048787 | `destructable: 00000170C6579070` |         |
| face: outside the world      | (a)   | handle  | 1048788 | `destructable: 00000170C6572330` |         |
| face: 2147483647             | (a)   | handle  | 1048789 | `destructable: 00000170C6565050` |         |
| scale: 0                     | (a)   | handle  | 1048790 | `destructable: 00000170C65403A0` |         |
| scale: negative              | (a)   | handle  | 1048791 | `destructable: 00000170C654F350` |         |
| scale: outside the world     | (a)   | handle  | 1048792 | `destructable: 00000170C651FCA0` |         |
| scale: 2147483647            | (a)   | handle  | 1048793 | `destructable: 00000170C65578C0` |         |
| variation: negative          | (a)   | handle  | 1048794 | `destructable: 00000171877B9410` |         |
| variation: outside the world | (a)   | handle  | 1048795 | `destructable: 00000170C61B9560` |         |
| variation: 2147483647        | (a)   | handle  | 1048796 | `destructable: 00000170C5BC3560` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `CreateDestructableZ`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1048797 | `destructable: 00000171877B6CF0` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1048798 | `destructable: 00000170C621E200` |         |
| x: negative                  | (a)   | handle  | 1048799 | `destructable: 00000170C621FFA0` |         |
| x: outside the world         | (a)   | handle  | 1048800 | `destructable: 00000170C620DB40` |         |
| x: 2147483647                | (a)   | handle  | 1048801 | `destructable: 00000170C63450B0` |         |
| y: 0                         | (a)   | handle  | 1048802 | `destructable: 00000171878DD770` |         |
| y: negative                  | (a)   | handle  | 1048803 | `destructable: 00000170C5BB3EA0` |         |
| y: outside the world         | (a)   | handle  | 1048804 | `destructable: 00000170C5EB9E80` |         |
| y: 2147483647                | (a)   | handle  | 1048805 | `destructable: 00000170C5E163E0` |         |
| z: negative                  | (a)   | handle  | 1048806 | `destructable: 00000170C65F5940` |         |
| z: outside the world         | (a)   | handle  | 1048807 | `destructable: 000001717F4B5E90` |         |
| z: 2147483647                | (a)   | handle  | 1048808 | `destructable: 00000170C64E5C00` |         |
| face: 0                      | (a)   | handle  | 1048809 | `destructable: 0000017185778800` |         |
| face: negative               | (a)   | handle  | 1048810 | `destructable: 00000170C64B5A70` |         |
| face: outside the world      | (a)   | handle  | 1048811 | `destructable: 00000170C635A6A0` |         |
| face: 2147483647             | (a)   | handle  | 1048812 | `destructable: 00000170C6228C60` |         |
| scale: 0                     | (a)   | handle  | 1048813 | `destructable: 00000170C6222340` |         |
| scale: negative              | (a)   | handle  | 1048814 | `destructable: 00000170C62192A0` |         |
| scale: outside the world     | (a)   | handle  | 1048815 | `destructable: 00000170C620E400` |         |
| scale: 2147483647            | (a)   | handle  | 1048816 | `destructable: 00000170C5BB3020` |         |
| variation: negative          | (a)   | handle  | 1048817 | `destructable: 00000170C621B440` |         |
| variation: outside the world | (a)   | handle  | 1048818 | `destructable: 00000170C62115E0` |         |
| variation: 2147483647        | (a)   | handle  | 1048819 | `destructable: 00000170C6209920` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `CreateDeadDestructable`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1048820 | `destructable: 00000170C5BD5F20` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1048821 | `destructable: 00000170C5BB7830` |         |
| x: negative                  | (a)   | handle  | 1048822 | `destructable: 00000170C622FC80` |         |
| x: outside the world         | (a)   | handle  | 1048823 | `destructable: 00000170C6360250` |         |
| x: 2147483647                | (a)   | handle  | 1048824 | `destructable: 00000170C6205270` |         |
| y: 0                         | (a)   | handle  | 1048825 | `destructable: 00000170C64DEB10` |         |
| y: negative                  | (a)   | handle  | 1048826 | `destructable: 000001718781BB20` |         |
| y: outside the world         | (a)   | handle  | 1048827 | `destructable: 00000171878122C0` |         |
| y: 2147483647                | (a)   | handle  | 1048828 | `destructable: 0000017187809460` |         |
| face: 0                      | (a)   | handle  | 1048829 | `destructable: 0000017187801AA0` |         |
| face: negative               | (a)   | handle  | 1048830 | `destructable: 00000171877F82D0` |         |
| face: outside the world      | (a)   | handle  | 1048831 | `destructable: 000001718779D830` |         |
| face: 2147483647             | (a)   | handle  | 1048832 | `destructable: 00000171877DCAB0` |         |
| scale: 0                     | (a)   | handle  | 1048833 | `destructable: 00000170C6536F30` |         |
| scale: negative              | (a)   | handle  | 1048834 | `destructable: 00000170C65308C0` |         |
| scale: outside the world     | (a)   | handle  | 1048835 | `destructable: 00000171877F3780` |         |
| scale: 2147483647            | (a)   | handle  | 1048836 | `destructable: 00000170C6353300` |         |
| variation: negative          | (a)   | handle  | 1048837 | `destructable: 00000170C6346E60` |         |
| variation: outside the world | (a)   | handle  | 1048838 | `destructable: 0000017185775360` |         |
| variation: 2147483647        | (a)   | handle  | 1048839 | `destructable: 00000170C64DC150` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `CreateDeadDestructableZ`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1048840 | `destructable: 00000171877EF240` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1048841 | `destructable: 00000170C6226960` |         |
| x: negative                  | (a)   | handle  | 1048842 | `destructable: 00000170C621AB70` |         |
| x: outside the world         | (a)   | handle  | 1048843 | `destructable: 00000170C620F630` |         |
| x: 2147483647                | (a)   | handle  | 1048844 | `destructable: 0000017185779390` |         |
| y: 0                         | (a)   | handle  | 1048845 | `destructable: 00000170C5BCA780` |         |
| y: negative                  | (a)   | handle  | 1048846 | `destructable: 00000170C64DF830` |         |
| y: outside the world         | (a)   | handle  | 1048847 | `destructable: 00000170C5BD8DE0` |         |
| y: 2147483647                | (a)   | handle  | 1048848 | `destructable: 000001718577B9F0` |         |
| z: negative                  | (a)   | handle  | 1048849 | `destructable: 0000017187790560` |         |
| z: outside the world         | (a)   | handle  | 1048850 | `destructable: 00000170C6557170` |         |
| z: 2147483647                | (a)   | handle  | 1048851 | `destructable: 000001716B5A9080` |         |
| face: 0                      | (a)   | handle  | 1048852 | `destructable: 00000170C635CA30` |         |
| face: negative               | (a)   | handle  | 1048853 | `destructable: 00000171877CFB70` |         |
| face: outside the world      | (a)   | handle  | 1048854 | `destructable: 00000171877C9120` |         |
| face: 2147483647             | (a)   | handle  | 1048855 | `destructable: 00000171877BA8C0` |         |
| scale: 0                     | (a)   | handle  | 1048856 | `destructable: 00000171877A8A40` |         |
| scale: negative              | (a)   | handle  | 1048857 | `destructable: 00000171877A04E0` |         |
| scale: outside the world     | (a)   | handle  | 1048858 | `destructable: 000001718779A420` |         |
| scale: 2147483647            | (a)   | handle  | 1048859 | `destructable: 000001718778F6F0` |         |
| variation: negative          | (a)   | handle  | 1048860 | `destructable: 0000017187788A50` |         |
| variation: outside the world | (a)   | handle  | 1048861 | `destructable: 00000170C5BE4C30` |         |
| variation: 2147483647        | (a)   | handle  | 1048862 | `destructable: 00000170C5BE3E60` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateDestructableWithSkin`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1048863 | `destructable: 00000170C657F1A0` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1048864 | `destructable: 00000170C61EEF20` |         |
| x: negative                  | (a)   | handle  | 1048865 | `destructable: 00000170C61E4B80` |         |
| x: outside the world         | (a)   | handle  | 1048866 | `destructable: 00000170C61DD920` |         |
| x: 2147483647                | (a)   | handle  | 1048867 | `destructable: 00000170C61E2CD0` |         |
| y: 0                         | (a)   | handle  | 1048868 | `destructable: 00000170C61C8AE0` |         |
| y: negative                  | (a)   | handle  | 1048869 | `destructable: 00000170C61C49D0` |         |
| y: outside the world         | (a)   | handle  | 1048870 | `destructable: 00000170C61C2280` |         |
| y: 2147483647                | (a)   | handle  | 1048871 | `destructable: 00000170C61B7C00` |         |
| face: 0                      | (a)   | handle  | 1048872 | `destructable: 00000170C5BE8560` |         |
| face: negative               | (a)   | handle  | 1048873 | `destructable: 00000170C5BB3AA0` |         |
| face: outside the world      | (a)   | handle  | 1048874 | `destructable: 000001716B5A36B0` |         |
| face: 2147483647             | (a)   | handle  | 1048875 | `destructable: 00000170C64B3CA0` |         |
| scale: 0                     | (a)   | handle  | 1048876 | `destructable: 00000170C5BDA920` |         |
| scale: negative              | (a)   | handle  | 1048877 | `destructable: 00000170C61E8040` |         |
| scale: outside the world     | (a)   | handle  | 1048878 | `destructable: 0000017187828AD0` |         |
| scale: 2147483647            | (a)   | handle  | 1048879 | `destructable: 0000017187819BE0` |         |
| variation: negative          | (a)   | handle  | 1048880 | `destructable: 0000017187815780` |         |
| variation: outside the world | (a)   | handle  | 1048881 | `destructable: 00000171878293F0` |         |
| variation: 2147483647        | (a)   | handle  | 1048882 | `destructable: 0000017187803400` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1048883 | `destructable: 00000171877F72F0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateDestructableZWithSkin`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1048884 | `destructable: 00000171877F22B0` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1048885 | `destructable: 00000171877E9160` |         |
| x: negative                  | (a)   | handle  | 1048886 | `destructable: 00000171877DD540` |         |
| x: outside the world         | (a)   | handle  | 1048887 | `destructable: 00000171877D9780` |         |
| x: 2147483647                | (a)   | handle  | 1048888 | `destructable: 00000170C6534530` |         |
| y: 0                         | (a)   | handle  | 1048889 | `destructable: 00000170C652F950` |         |
| y: negative                  | (a)   | handle  | 1048890 | `destructable: 00000170C652A3D0` |         |
| y: outside the world         | (a)   | handle  | 1048891 | `destructable: 00000170C6520C40` |         |
| y: 2147483647                | (a)   | handle  | 1048892 | `destructable: 00000170C634D3D0` |         |
| z: negative                  | (a)   | handle  | 1048893 | `destructable: 000001718577F9A0` |         |
| z: outside the world         | (a)   | handle  | 1048894 | `destructable: 00000170C65843F0` |         |
| z: 2147483647                | (a)   | handle  | 1048895 | `destructable: 0000017187841AE0` |         |
| face: 0                      | (a)   | handle  | 1048896 | `destructable: 00000171878566D0` |         |
| face: negative               | (a)   | handle  | 1048897 | `destructable: 0000017187850DE0` |         |
| face: outside the world      | (a)   | handle  | 1048898 | `destructable: 000001718784CD20` |         |
| face: 2147483647             | (a)   | handle  | 1048899 | `destructable: 0000017187843110` |         |
| scale: 0                     | (a)   | handle  | 1048900 | `destructable: 00000170C61F0EB0` |         |
| scale: negative              | (a)   | handle  | 1048901 | `destructable: 000001718782F0F0` |         |
| scale: outside the world     | (a)   | handle  | 1048902 | `destructable: 00000170C6229CD0` |         |
| scale: 2147483647            | (a)   | handle  | 1048903 | `destructable: 00000170C620ADE0` |         |
| variation: negative          | (a)   | handle  | 1048904 | `destructable: 00000170C6209310` |         |
| variation: outside the world | (a)   | handle  | 1048905 | `destructable: 00000171877C9BD0` |         |
| variation: 2147483647        | (a)   | handle  | 1048906 | `destructable: 00000171877B0F00` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1048907 | `destructable: 0000017187794D00` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateDeadDestructableWithSkin`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1048908 | `destructable: 00000170C6566CD0` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1048909 | `destructable: 00000170C655C5D0` |         |
| x: negative                  | (a)   | handle  | 1048910 | `destructable: 000001716B7CBF60` |         |
| x: outside the world         | (a)   | handle  | 1048911 | `destructable: 00000170C6230C60` |         |
| x: 2147483647                | (a)   | handle  | 1048912 | `destructable: 00000170C64E0F70` |         |
| y: 0                         | (a)   | handle  | 1048913 | `destructable: 00000170C5BB69D0` |         |
| y: negative                  | (a)   | handle  | 1048914 | `destructable: 00000171877A5D40` |         |
| y: outside the world         | (a)   | handle  | 1048915 | `destructable: 00000171877D5140` |         |
| y: 2147483647                | (a)   | handle  | 1048916 | `destructable: 00000170C65268A0` |         |
| face: 0                      | (a)   | handle  | 1048917 | `destructable: 00000170C6578030` |         |
| face: negative               | (a)   | handle  | 1048918 | `destructable: 0000017187793360` |         |
| face: outside the world      | (a)   | handle  | 1048919 | `destructable: 0000017187784B50` |         |
| face: 2147483647             | (a)   | handle  | 1048920 | `destructable: 00000171877960C0` |         |
| scale: 0                     | (a)   | handle  | 1048921 | `destructable: 00000170C6572C60` |         |
| scale: negative              | (a)   | handle  | 1048922 | `destructable: 00000170C6566750` |         |
| scale: outside the world     | (a)   | handle  | 1048923 | `destructable: 00000170C6555960` |         |
| scale: 2147483647            | (a)   | handle  | 1048924 | `destructable: 00000170C61E6AF0` |         |
| variation: negative          | (a)   | handle  | 1048925 | `destructable: 00000170C61D1D00` |         |
| variation: outside the world | (a)   | handle  | 1048926 | `destructable: 00000170C61D8D60` |         |
| variation: 2147483647        | (a)   | handle  | 1048927 | `destructable: 00000170C61B9E40` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1048928 | `destructable: 00000170C5BDF670` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateDeadDestructableZWithSkin`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1048929 | `destructable: 00000170C5BB1560` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1048930 | `destructable: 000001716B59DEC0` |         |
| x: negative                  | (a)   | handle  | 1048931 | `destructable: 000001716B5A7DB0` |         |
| x: outside the world         | (a)   | handle  | 1048932 | `destructable: 00000170C5BC1150` |         |
| x: 2147483647                | (a)   | handle  | 1048933 | `destructable: 00000171878247C0` |         |
| y: 0                         | (a)   | handle  | 1048934 | `destructable: 00000171878218D0` |         |
| y: negative                  | (a)   | handle  | 1048935 | `destructable: 00000170C6549400` |         |
| y: outside the world         | (a)   | handle  | 1048936 | `destructable: 00000170C653C290` |         |
| y: 2147483647                | (a)   | handle  | 1048937 | `destructable: 00000170C5BCC590` |         |
| z: negative                  | (a)   | handle  | 1048938 | `destructable: 00000170C5BBABA0` |         |
| z: outside the world         | (a)   | handle  | 1048939 | `destructable: 00000170C64DAD80` |         |
| z: 2147483647                | (a)   | handle  | 1048940 | `destructable: 00000170C64D8E10` |         |
| face: 0                      | (a)   | handle  | 1048941 | `destructable: 000001718788FF70` |         |
| face: negative               | (a)   | handle  | 1048942 | `destructable: 00000170C6227440` |         |
| face: outside the world      | (a)   | handle  | 1048943 | `destructable: 00000170C5BC6AA0` |         |
| face: 2147483647             | (a)   | handle  | 1048944 | `destructable: 00000171877C0FC0` |         |
| scale: 0                     | (a)   | handle  | 1048945 | `destructable: 00000171877B8800` |         |
| scale: negative              | (a)   | handle  | 1048946 | `destructable: 00000171877AAE00` |         |
| scale: outside the world     | (a)   | handle  | 1048947 | `destructable: 0000017187798210` |         |
| scale: 2147483647            | (a)   | handle  | 1048948 | `destructable: 00000170C61D3E90` |         |
| variation: negative          | (a)   | handle  | 1048949 | `destructable: 00000170C5BB4DC0` |         |
| variation: outside the world | (a)   | handle  | 1048950 | `destructable: 00000171877F28D0` |         |
| variation: 2147483647        | (a)   | handle  | 1048951 | `destructable: 00000170C6351E00` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1048952 | `destructable: 00000171877D77A0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateDestructablePitchRoll`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1048953 | `destructable: 00000170C1AD4EC0` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1048954 | `destructable: 00000171877C2780` |         |
| x: negative                  | (a)   | handle  | 1048955 | `destructable: 00000170C6232090` |         |
| x: outside the world         | (a)   | handle  | 1048956 | `destructable: 000001718780EAB0` |         |
| x: 2147483647                | (a)   | handle  | 1048957 | `destructable: 00000171877E6DF0` |         |
| y: 0                         | (a)   | handle  | 1048958 | `destructable: 000001718780D050` |         |
| y: negative                  | (a)   | handle  | 1048959 | `destructable: 00000171877E4FE0` |         |
| y: outside the world         | (a)   | handle  | 1048960 | `destructable: 00000171877C25F0` |         |
| y: 2147483647                | (a)   | handle  | 1048961 | `destructable: 00000171667695E0` |         |
| face: 0                      | (a)   | handle  | 1048962 | `destructable: 00000171878E5F20` |         |
| face: negative               | (a)   | handle  | 1048963 | `destructable: 000001716B76EE10` |         |
| face: outside the world      | (a)   | handle  | 1048964 | `destructable: 000001716676B9E0` |         |
| face: 2147483647             | (a)   | handle  | 1048965 | `destructable: 000001716B76DA40` |         |
| roll: negative               | (a)   | handle  | 1048966 | `destructable: 0000017187973570` |         |
| roll: outside the world      | (a)   | handle  | 1048967 | `destructable: 0000017187981640` |         |
| roll: 2147483647             | (a)   | handle  | 1048968 | `destructable: 000001718796E680` |         |
| pitch: negative              | (a)   | handle  | 1048969 | `destructable: 000001718796D460` |         |
| pitch: outside the world     | (a)   | handle  | 1048970 | `destructable: 000001718796B010` |         |
| pitch: 2147483647            | (a)   | handle  | 1048971 | `destructable: 0000017187972E40` |         |
| scale: 0                     | (a)   | handle  | 1048972 | `destructable: 000001718797DA50` |         |
| scale: negative              | (a)   | handle  | 1048973 | `destructable: 0000017187980640` |         |
| scale: outside the world     | (a)   | handle  | 1048974 | `destructable: 00000171879F7B50` |         |
| scale: 2147483647            | (a)   | handle  | 1048975 | `destructable: 0000017187A1E6E0` |         |
| variation: negative          | (a)   | handle  | 1048976 | `destructable: 00000171879F6B60` |         |
| variation: outside the world | (a)   | handle  | 1048977 | `destructable: 0000017187A39950` |         |
| variation: 2147483647        | (a)   | handle  | 1048978 | `destructable: 0000017187A3CAD0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateDestructableZPitchRoll`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1048979 | `destructable: 0000017187A41D10` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1048980 | `destructable: 0000017187A47270` |         |
| x: negative                  | (a)   | handle  | 1048981 | `destructable: 0000017187A4D2A0` |         |
| x: outside the world         | (a)   | handle  | 1048982 | `destructable: 0000017187A4C8B0` |         |
| x: 2147483647                | (a)   | handle  | 1048983 | `destructable: 0000017187A4D940` |         |
| y: 0                         | (a)   | handle  | 1048984 | `destructable: 0000017187A51000` |         |
| y: negative                  | (a)   | handle  | 1048985 | `destructable: 0000017187A52A90` |         |
| y: outside the world         | (a)   | handle  | 1048986 | `destructable: 0000017187A56B00` |         |
| y: 2147483647                | (a)   | handle  | 1048987 | `destructable: 0000017187A5CCB0` |         |
| z: negative                  | (a)   | handle  | 1048988 | `destructable: 0000017187A5B6A0` |         |
| z: outside the world         | (a)   | handle  | 1048989 | `destructable: 0000017187A5D750` |         |
| z: 2147483647                | (a)   | handle  | 1048990 | `destructable: 0000017187A60FD0` |         |
| face: 0                      | (a)   | handle  | 1048991 | `destructable: 0000017187A62730` |         |
| face: negative               | (a)   | handle  | 1048992 | `destructable: 0000017187A66070` |         |
| face: outside the world      | (a)   | handle  | 1048993 | `destructable: 00000171685035F0` |         |
| face: 2147483647             | (a)   | handle  | 1048994 | `destructable: 0000017187A6A100` |         |
| roll: negative               | (a)   | handle  | 1048995 | `destructable: 0000017187A70CA0` |         |
| roll: outside the world      | (a)   | handle  | 1048996 | `destructable: 0000017187A74CA0` |         |
| roll: 2147483647             | (a)   | handle  | 1048997 | `destructable: 0000017187A75880` |         |
| pitch: negative              | (a)   | handle  | 1048998 | `destructable: 0000017187A798C0` |         |
| pitch: outside the world     | (a)   | handle  | 1048999 | `destructable: 0000017187A7BF40` |         |
| pitch: 2147483647            | (a)   | handle  | 1049000 | `destructable: 0000017187A7FBB0` |         |
| scale: 0                     | (a)   | handle  | 1049001 | `destructable: 0000017187A80EF0` |         |
| scale: negative              | (a)   | handle  | 1049002 | `destructable: 0000017187A84A70` |         |
| scale: outside the world     | (a)   | handle  | 1049003 | `destructable: 0000017187A8B430` |         |
| scale: 2147483647            | (a)   | handle  | 1049004 | `destructable: 0000017187A8AA80` |         |
| variation: negative          | (a)   | handle  | 1049005 | `destructable: 0000017187A8B830` |         |
| variation: outside the world | (a)   | handle  | 1049006 | `destructable: 0000017187A8F620` |         |
| variation: 2147483647        | (a)   | handle  | 1049007 | `destructable: 0000017187A92A10` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateDeadDestructablePitchRoll`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049008 | `destructable: 0000017187A8FFD0` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049009 | `destructable: 0000017187A9AE60` |         |
| x: negative                  | (a)   | handle  | 1049010 | `destructable: 0000017187A99AE0` |         |
| x: outside the world         | (a)   | handle  | 1049011 | `destructable: 0000017187A9E280` |         |
| x: 2147483647                | (a)   | handle  | 1049012 | `destructable: 0000017187AA2240` |         |
| y: 0                         | (a)   | handle  | 1049013 | `destructable: 0000017187AA4F40` |         |
| y: negative                  | (a)   | handle  | 1049014 | `destructable: 0000017187AA8AD0` |         |
| y: outside the world         | (a)   | handle  | 1049015 | `destructable: 0000017187AAA9D0` |         |
| y: 2147483647                | (a)   | handle  | 1049016 | `destructable: 0000017187AAE6C0` |         |
| face: 0                      | (a)   | handle  | 1049017 | `destructable: 0000017187AB0080` |         |
| face: negative               | (a)   | handle  | 1049018 | `destructable: 0000017187AB3CA0` |         |
| face: outside the world      | (a)   | handle  | 1049019 | `destructable: 0000017187AB4FD0` |         |
| face: 2147483647             | (a)   | handle  | 1049020 | `destructable: 0000017187AB87D0` |         |
| roll: negative               | (a)   | handle  | 1049021 | `destructable: 0000017187ABBFC0` |         |
| roll: outside the world      | (a)   | handle  | 1049022 | `destructable: 0000017187ABF900` |         |
| roll: 2147483647             | (a)   | handle  | 1049023 | `destructable: 0000017187AC1540` |         |
| pitch: negative              | (a)   | handle  | 1049024 | `destructable: 0000017187AC54A0` |         |
| pitch: outside the world     | (a)   | handle  | 1049025 | `destructable: 0000017187AC6A80` |         |
| pitch: 2147483647            | (a)   | handle  | 1049026 | `destructable: 0000017187AC9FE0` |         |
| scale: 0                     | (a)   | handle  | 1049027 | `destructable: 0000017187AC9370` |         |
| scale: negative              | (a)   | handle  | 1049028 | `destructable: 0000017187ACF680` |         |
| scale: outside the world     | (a)   | handle  | 1049029 | `destructable: 0000017187AD1D10` |         |
| scale: 2147483647            | (a)   | handle  | 1049030 | `destructable: 0000017187AD4C60` |         |
| variation: negative          | (a)   | handle  | 1049031 | `destructable: 0000017187AD7240` |         |
| variation: outside the world | (a)   | handle  | 1049032 | `destructable: 0000017187ADA9A0` |         |
| variation: 2147483647        | (a)   | handle  | 1049033 | `destructable: 0000017187AD9590` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateDeadDestructableZPitchRoll`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049034 | `destructable: 0000017187AE5800` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049035 | `destructable: 00000171878E3AE0` |         |
| x: negative                  | (a)   | handle  | 1049036 | `destructable: 0000017187B22170` |         |
| x: outside the world         | (a)   | handle  | 1049037 | `destructable: 0000017187B1F400` |         |
| x: 2147483647                | (a)   | handle  | 1049038 | `destructable: 0000017187B1E8E0` |         |
| y: 0                         | (a)   | handle  | 1049039 | `destructable: 0000017187B22600` |         |
| y: negative                  | (a)   | handle  | 1049040 | `destructable: 0000017187B26560` |         |
| y: outside the world         | (a)   | handle  | 1049041 | `destructable: 0000017187B25950` |         |
| y: 2147483647                | (a)   | handle  | 1049042 | `destructable: 0000017187B2AB10` |         |
| z: negative                  | (a)   | handle  | 1049043 | `destructable: 0000017187B2DF90` |         |
| z: outside the world         | (a)   | handle  | 1049044 | `destructable: 0000017187B325D0` |         |
| z: 2147483647                | (a)   | handle  | 1049045 | `destructable: 0000017187B363D0` |         |
| face: 0                      | (a)   | handle  | 1049046 | `destructable: 0000017187B353A0` |         |
| face: negative               | (a)   | handle  | 1049047 | `destructable: 0000017187B39D40` |         |
| face: outside the world      | (a)   | handle  | 1049048 | `destructable: 0000017187B3D6C0` |         |
| face: 2147483647             | (a)   | handle  | 1049049 | `destructable: 0000017187B3BA80` |         |
| roll: negative               | (a)   | handle  | 1049050 | `destructable: 0000017187B416F0` |         |
| roll: outside the world      | (a)   | handle  | 1049051 | `destructable: 0000017187B45570` |         |
| roll: 2147483647             | (a)   | handle  | 1049052 | `destructable: 0000017187B44A00` |         |
| pitch: negative              | (a)   | handle  | 1049053 | `destructable: 0000017187B49720` |         |
| pitch: outside the world     | (a)   | handle  | 1049054 | `destructable: 0000017187B4CE40` |         |
| pitch: 2147483647            | (a)   | handle  | 1049055 | `destructable: 0000017187B4C210` |         |
| scale: 0                     | (a)   | handle  | 1049056 | `destructable: 0000017187B51810` |         |
| scale: negative              | (a)   | handle  | 1049057 | `destructable: 0000017187B57310` |         |
| scale: outside the world     | (a)   | handle  | 1049058 | `destructable: 0000017187B59F60` |         |
| scale: 2147483647            | (a)   | handle  | 1049059 | `destructable: 0000017187B5D7B0` |         |
| variation: negative          | (a)   | handle  | 1049060 | `destructable: 0000017187B55860` |         |
| variation: outside the world | (a)   | handle  | 1049061 | `destructable: 0000017187B61040` |         |
| variation: 2147483647        | (a)   | handle  | 1049062 | `destructable: 0000017187B64BA0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateDestructableWithSkinPitchRoll`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049063 | `destructable: 0000017187B63710` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049064 | `destructable: 0000017187B6C3D0` |         |
| x: negative                  | (a)   | handle  | 1049065 | `destructable: 0000017187B6B6B0` |         |
| x: outside the world         | (a)   | handle  | 1049066 | `destructable: 0000017187B71800` |         |
| x: 2147483647                | (a)   | handle  | 1049067 | `destructable: 0000017187B75500` |         |
| y: 0                         | (a)   | handle  | 1049068 | `destructable: 0000017187B73CD0` |         |
| y: negative                  | (a)   | handle  | 1049069 | `destructable: 0000017187B78840` |         |
| y: outside the world         | (a)   | handle  | 1049070 | `destructable: 000001716B766300` |         |
| y: 2147483647                | (a)   | handle  | 1049071 | `destructable: 0000017187B88620` |         |
| face: 0                      | (a)   | handle  | 1049072 | `destructable: 0000017187B852B0` |         |
| face: negative               | (a)   | handle  | 1049073 | `destructable: 0000017187B82CB0` |         |
| face: outside the world      | (a)   | handle  | 1049074 | `destructable: 0000017187B89010` |         |
| face: 2147483647             | (a)   | handle  | 1049075 | `destructable: 0000017187B8DC60` |         |
| roll: negative               | (a)   | handle  | 1049076 | `destructable: 0000017187B8C7B0` |         |
| roll: outside the world      | (a)   | handle  | 1049077 | `destructable: 0000017187B911A0` |         |
| roll: 2147483647             | (a)   | handle  | 1049078 | `destructable: 0000017187B957E0` |         |
| pitch: negative              | (a)   | handle  | 1049079 | `destructable: 0000017187B93FB0` |         |
| pitch: outside the world     | (a)   | handle  | 1049080 | `destructable: 0000017187BA0A90` |         |
| pitch: 2147483647            | (a)   | handle  | 1049081 | `destructable: 0000017187B9D2D0` |         |
| scale: 0                     | (a)   | handle  | 1049082 | `destructable: 0000017187BA0650` |         |
| scale: negative              | (a)   | handle  | 1049083 | `destructable: 0000017187BA0E50` |         |
| scale: outside the world     | (a)   | handle  | 1049084 | `destructable: 0000017187BA5960` |         |
| scale: 2147483647            | (a)   | handle  | 1049085 | `destructable: 0000017187A40FF0` |         |
| variation: negative          | (a)   | handle  | 1049086 | `destructable: 0000017187BAB9E0` |         |
| variation: outside the world | (a)   | handle  | 1049087 | `destructable: 0000017187BB0330` |         |
| variation: 2147483647        | (a)   | handle  | 1049088 | `destructable: 0000017187BADE00` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1049089 | `destructable: 0000017187BBB620` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateDestructableZWithSkinPitchRoll`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049090 | `destructable: 0000017187BA32D0` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049091 | `destructable: 0000017187BBFB70` |         |
| x: negative                  | (a)   | handle  | 1049092 | `destructable: 0000017187BBD540` |         |
| x: outside the world         | (a)   | handle  | 1049093 | `destructable: 0000017187BB8E90` |         |
| x: 2147483647                | (a)   | handle  | 1049094 | `destructable: 0000017187BC80A0` |         |
| y: 0                         | (a)   | handle  | 1049095 | `destructable: 0000017187BC5A90` |         |
| y: negative                  | (a)   | handle  | 1049096 | `destructable: 0000017187BD0B80` |         |
| y: outside the world         | (a)   | handle  | 1049097 | `destructable: 0000017187BD2F70` |         |
| y: 2147483647                | (a)   | handle  | 1049098 | `destructable: 0000017187BD81C0` |         |
| z: negative                  | (a)   | handle  | 1049099 | `destructable: 0000017187BDCD40` |         |
| z: outside the world         | (a)   | handle  | 1049100 | `destructable: 0000017187BD3690` |         |
| z: 2147483647                | (a)   | handle  | 1049101 | `destructable: 0000017187C05700` |         |
| face: 0                      | (a)   | handle  | 1049102 | `destructable: 0000017187C0AC70` |         |
| face: negative               | (a)   | handle  | 1049103 | `destructable: 0000017187C094B0` |         |
| face: outside the world      | (a)   | handle  | 1049104 | `destructable: 0000017187C0D830` |         |
| face: 2147483647             | (a)   | handle  | 1049105 | `destructable: 0000017187C13560` |         |
| roll: negative               | (a)   | handle  | 1049106 | `destructable: 0000017187C098B0` |         |
| roll: outside the world      | (a)   | handle  | 1049107 | `destructable: 0000017187C259E0` |         |
| roll: 2147483647             | (a)   | handle  | 1049108 | `destructable: 0000017187C2BC30` |         |
| pitch: negative              | (a)   | handle  | 1049109 | `destructable: 0000017187C2DBA0` |         |
| pitch: outside the world     | (a)   | handle  | 1049110 | `destructable: 0000017187C323C0` |         |
| pitch: 2147483647            | (a)   | handle  | 1049111 | `destructable: 0000017187C31920` |         |
| scale: 0                     | (a)   | handle  | 1049112 | `destructable: 0000017187C352D0` |         |
| scale: negative              | (a)   | handle  | 1049113 | `destructable: 0000017187C39260` |         |
| scale: outside the world     | (a)   | handle  | 1049114 | `destructable: 0000017187C38850` |         |
| scale: 2147483647            | (a)   | handle  | 1049115 | `destructable: 0000017187C3CFA0` |         |
| variation: negative          | (a)   | handle  | 1049116 | `destructable: 0000017187C41510` |         |
| variation: outside the world | (a)   | handle  | 1049117 | `destructable: 0000017187C3B7B0` |         |
| variation: 2147483647        | (a)   | handle  | 1049118 | `destructable: 0000017187C45750` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1049119 | `destructable: 0000017187C49A00` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateDeadDestructableWithSkinPitchRoll`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049120 | `destructable: 0000017187C437D0` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049121 | `destructable: 0000017187C50ED0` |         |
| x: negative                  | (a)   | handle  | 1049122 | `destructable: 0000017187C4F7A0` |         |
| x: outside the world         | (a)   | handle  | 1049123 | `destructable: 0000017187C55810` |         |
| x: 2147483647                | (a)   | handle  | 1049124 | `destructable: 0000017187C5A700` |         |
| y: 0                         | (a)   | handle  | 1049125 | `destructable: 0000017187C57AC0` |         |
| y: negative                  | (a)   | handle  | 1049126 | `destructable: 0000017187C54A70` |         |
| y: outside the world         | (a)   | handle  | 1049127 | `destructable: 0000017187A6EF90` |         |
| y: 2147483647                | (a)   | handle  | 1049128 | `destructable: 0000017187C65520` |         |
| face: 0                      | (a)   | handle  | 1049129 | `destructable: 0000017187C695E0` |         |
| face: negative               | (a)   | handle  | 1049130 | `destructable: 0000017187C6D6A0` |         |
| face: outside the world      | (a)   | handle  | 1049131 | `destructable: 0000017187C63B60` |         |
| face: 2147483647             | (a)   | handle  | 1049132 | `destructable: 0000017187C797C0` |         |
| roll: negative               | (a)   | handle  | 1049133 | `destructable: 0000017187C7E3B0` |         |
| roll: outside the world      | (a)   | handle  | 1049134 | `destructable: 0000017187C7C320` |         |
| roll: 2147483647             | (a)   | handle  | 1049135 | `destructable: 0000017187C8A0E0` |         |
| pitch: negative              | (a)   | handle  | 1049136 | `destructable: 0000017187C86E40` |         |
| pitch: outside the world     | (a)   | handle  | 1049137 | `destructable: 0000017187C84C00` |         |
| pitch: 2147483647            | (a)   | handle  | 1049138 | `destructable: 0000017187C8A2E0` |         |
| scale: 0                     | (a)   | handle  | 1049139 | `destructable: 0000017187C8ED80` |         |
| scale: negative              | (a)   | handle  | 1049140 | `destructable: 0000017187C89380` |         |
| scale: outside the world     | (a)   | handle  | 1049141 | `destructable: 0000017187C92660` |         |
| scale: 2147483647            | (a)   | handle  | 1049142 | `destructable: 0000017187C972E0` |         |
| variation: negative          | (a)   | handle  | 1049143 | `destructable: 0000017187C911D0` |         |
| variation: outside the world | (a)   | handle  | 1049144 | `destructable: 0000017187CA2C00` |         |
| variation: 2147483647        | (a)   | handle  | 1049145 | `destructable: 0000017187C9F8F0` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1049146 | `destructable: 0000017187C9F4B0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateDeadDestructableZWithSkinPitchRoll`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049147 | `destructable: 0000017187CA2860` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049148 | `destructable: 0000017187CA2720` |         |
| x: negative                  | (a)   | handle  | 1049149 | `destructable: 0000017187CA9930` |         |
| x: outside the world         | (a)   | handle  | 1049150 | `destructable: 0000017187CAB290` |         |
| x: 2147483647                | (a)   | handle  | 1049151 | `destructable: 0000017187CAFA10` |         |
| y: 0                         | (a)   | handle  | 1049152 | `destructable: 0000017187CB1D30` |         |
| y: negative                  | (a)   | handle  | 1049153 | `destructable: 0000017187CB5890` |         |
| y: outside the world         | (a)   | handle  | 1049154 | `destructable: 0000017187CBC750` |         |
| y: 2147483647                | (a)   | handle  | 1049155 | `destructable: 0000017187CB1670` |         |
| z: negative                  | (a)   | handle  | 1049156 | `destructable: 0000017187CC3790` |         |
| z: outside the world         | (a)   | handle  | 1049157 | `destructable: 000001716676C920` |         |
| z: 2147483647                | (a)   | handle  | 1049158 | `destructable: 0000017187CC5830` |         |
| face: 0                      | (a)   | handle  | 1049159 | `destructable: 0000017187CC7A90` |         |
| face: negative               | (a)   | handle  | 1049160 | `destructable: 0000017187CCB850` |         |
| face: outside the world      | (a)   | handle  | 1049161 | `destructable: 0000017187CCF260` |         |
| face: 2147483647             | (a)   | handle  | 1049162 | `destructable: 0000017187CD62F0` |         |
| roll: negative               | (a)   | handle  | 1049163 | `destructable: 0000017187CDA570` |         |
| roll: outside the world      | (a)   | handle  | 1049164 | `destructable: 0000017187CDE1E0` |         |
| roll: 2147483647             | (a)   | handle  | 1049165 | `destructable: 0000017187CE6B00` |         |
| pitch: negative              | (a)   | handle  | 1049166 | `destructable: 0000017187CE2F30` |         |
| pitch: outside the world     | (a)   | handle  | 1049167 | `destructable: 0000017187CE5BD0` |         |
| pitch: 2147483647            | (a)   | handle  | 1049168 | `destructable: 0000017187CE6D30` |         |
| scale: 0                     | (a)   | handle  | 1049169 | `destructable: 0000017187CEB3D0` |         |
| scale: negative              | (a)   | handle  | 1049170 | `destructable: 0000017187CEDD60` |         |
| scale: outside the world     | (a)   | handle  | 1049171 | `destructable: 0000017187CEF920` |         |
| scale: 2147483647            | (a)   | handle  | 1049172 | `destructable: 0000017187CF39F0` |         |
| variation: negative          | (a)   | handle  | 1049173 | `destructable: 0000017187CF6130` |         |
| variation: outside the world | (a)   | handle  | 1049174 | `destructable: 0000017187CF7500` |         |
| variation: 2147483647        | (a)   | handle  | 1049175 | `destructable: 0000017187CF7E70` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1049176 | `destructable: 0000017187CFC9E0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateDestructableWithColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049177 | `destructable: 0000017187CF5C90` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049178 | `destructable: 0000017187D02DB0` |         |
| x: negative                  | (a)   | handle  | 1049179 | `destructable: 0000017187D07760` |         |
| x: outside the world         | (a)   | handle  | 1049180 | `destructable: 0000017187D0B3D0` |         |
| x: 2147483647                | (a)   | handle  | 1049181 | `destructable: 0000017187D097C0` |         |
| y: 0                         | (a)   | handle  | 1049182 | `destructable: 0000017187D10920` |         |
| y: negative                  | (a)   | handle  | 1049183 | `destructable: 0000017187D0C770` |         |
| y: outside the world         | (a)   | handle  | 1049184 | `destructable: 0000017187D0E280` |         |
| y: 2147483647                | (a)   | handle  | 1049185 | `destructable: 0000017187D20310` |         |
| face: 0                      | (a)   | handle  | 1049186 | `destructable: 0000017187D1B180` |         |
| face: negative               | (a)   | handle  | 1049187 | `destructable: 0000017187D1DA90` |         |
| face: outside the world      | (a)   | handle  | 1049188 | `destructable: 0000017187D19170` |         |
| face: 2147483647             | (a)   | handle  | 1049189 | `destructable: 0000017187D24770` |         |
| scale: 0                     | (a)   | handle  | 1049190 | `destructable: 0000017187D27050` |         |
| scale: negative              | (a)   | handle  | 1049191 | `destructable: 0000017187D22B10` |         |
| scale: outside the world     | (a)   | handle  | 1049192 | `destructable: 0000017187D2F620` |         |
| scale: 2147483647            | (a)   | handle  | 1049193 | `destructable: 0000017187D32D50` |         |
| variation: negative          | (a)   | handle  | 1049194 | `destructable: 0000017187D2E040` |         |
| variation: outside the world | (a)   | handle  | 1049195 | `destructable: 0000017187D5AE00` |         |
| variation: 2147483647        | (a)   | handle  | 1049196 | `destructable: 0000017187D5E1B0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateDestructableZWithColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049197 | `destructable: 0000017187D1ED40` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049198 | `destructable: 0000017187D2F430` |         |
| x: negative                  | (a)   | handle  | 1049199 | `destructable: 0000017187CB5720` |         |
| x: outside the world         | (a)   | handle  | 1049200 | `destructable: 0000017187C9AAE0` |         |
| x: 2147483647                | (a)   | handle  | 1049201 | `destructable: 0000017187CF3880` |         |
| y: 0                         | (a)   | handle  | 1049202 | `destructable: 0000017187C4FB80` |         |
| y: negative                  | (a)   | handle  | 1049203 | `destructable: 0000017187C2AD20` |         |
| y: outside the world         | (a)   | handle  | 1049204 | `destructable: 0000017187BDB250` |         |
| y: 2147483647                | (a)   | handle  | 1049205 | `destructable: 0000017187B9F010` |         |
| z: negative                  | (a)   | handle  | 1049206 | `destructable: 0000017187B94760` |         |
| z: outside the world         | (a)   | handle  | 1049207 | `destructable: 0000017187B94A20` |         |
| z: 2147483647                | (a)   | handle  | 1049208 | `destructable: 0000017187B4C710` |         |
| face: 0                      | (a)   | handle  | 1049209 | `destructable: 0000017187B30490` |         |
| face: negative               | (a)   | handle  | 1049210 | `destructable: 0000017187B21270` |         |
| face: outside the world      | (a)   | handle  | 1049211 | `destructable: 0000017187B1EE00` |         |
| face: 2147483647             | (a)   | handle  | 1049212 | `destructable: 0000017187AA1A30` |         |
| scale: 0                     | (a)   | handle  | 1049213 | `destructable: 0000017187AA88C0` |         |
| scale: negative              | (a)   | handle  | 1049214 | `destructable: 0000017187A74B10` |         |
| scale: outside the world     | (a)   | handle  | 1049215 | `destructable: 0000017187AAD040` |         |
| scale: 2147483647            | (a)   | handle  | 1049216 | `destructable: 000001716B767BA0` |         |
| variation: negative          | (a)   | handle  | 1049217 | `destructable: 00000171877E49F0` |         |
| variation: outside the world | (a)   | handle  | 1049218 | `destructable: 00000171878E6060` |         |
| variation: 2147483647        | (a)   | handle  | 1049219 | `destructable: 00000170C654B300` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateDeadDestructableWithColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049220 | `destructable: 00000170C5BCC370` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049221 | `destructable: 000001716B59D930` |         |
| x: negative                  | (a)   | handle  | 1049222 | `destructable: 00000170C622D070` |         |
| x: outside the world         | (a)   | handle  | 1049223 | `destructable: 000001718796CC30` |         |
| x: 2147483647                | (a)   | handle  | 1049224 | `destructable: 00000171877FDC20` |         |
| y: 0                         | (a)   | handle  | 1049225 | `destructable: 00000170C61C63E0` |         |
| y: negative                  | (a)   | handle  | 1049226 | `destructable: 00000170C6583B90` |         |
| y: outside the world         | (a)   | handle  | 1049227 | `destructable: 00000170C5BD9C10` |         |
| y: 2147483647                | (a)   | handle  | 1049228 | `destructable: 00000171878D1FD0` |         |
| face: 0                      | (a)   | handle  | 1049229 | `destructable: 0000017185776F40` |         |
| face: negative               | (a)   | handle  | 1049230 | `destructable: 00000170C2821760` |         |
| face: outside the world      | (a)   | handle  | 1049231 | `destructable: 000001718782A5D0` |         |
| face: 2147483647             | (a)   | handle  | 1049232 | `destructable: 00000171877C8660` |         |
| scale: 0                     | (a)   | handle  | 1049233 | `destructable: 00000171878D1DF0` |         |
| scale: negative              | (a)   | handle  | 1049234 | `destructable: 00000170C6565120` |         |
| scale: outside the world     | (a)   | handle  | 1049235 | `destructable: 00000170C5BC2CE0` |         |
| scale: 2147483647            | (a)   | handle  | 1049236 | `destructable: 00000171877EC600` |         |
| variation: negative          | (a)   | handle  | 1049237 | `destructable: 00000170C5EB3B50` |         |
| variation: outside the world | (a)   | handle  | 1049238 | `destructable: 00000171878664B0` |         |
| variation: 2147483647        | (a)   | handle  | 1049239 | `destructable: 00000171878655A0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateDeadDestructableZWithColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049240 | `destructable: 00000170C61C99D0` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049241 | `destructable: 000001717FF5BA00` |         |
| x: negative                  | (a)   | handle  | 1049242 | `destructable: 0000017187896130` |         |
| x: outside the world         | (a)   | handle  | 1049243 | `destructable: 00000171642F0FC0` |         |
| x: 2147483647                | (a)   | handle  | 1049244 | `destructable: 000001715C6E2F50` |         |
| y: 0                         | (a)   | handle  | 1049245 | `destructable: 00000171642EFCD0` |         |
| y: negative                  | (a)   | handle  | 1049246 | `destructable: 000001715C6EB270` |         |
| y: outside the world         | (a)   | handle  | 1049247 | `destructable: 00000170C5880690` |         |
| y: 2147483647                | (a)   | handle  | 1049248 | `destructable: 00000170C5BE8D10` |         |
| z: negative                  | (a)   | handle  | 1049249 | `destructable: 00000170C61D8BA0` |         |
| z: outside the world         | (a)   | handle  | 1049250 | `destructable: 00000170C6209DB0` |         |
| z: 2147483647                | (a)   | handle  | 1049251 | `destructable: 00000170C61C65C0` |         |
| face: 0                      | (a)   | handle  | 1049252 | `destructable: 000001718779B0A0` |         |
| face: negative               | (a)   | handle  | 1049253 | `destructable: 00000170C6573AE0` |         |
| face: outside the world      | (a)   | handle  | 1049254 | `destructable: 00000170C6535B10` |         |
| face: 2147483647             | (a)   | handle  | 1049255 | `destructable: 0000017187D25FB0` |         |
| scale: 0                     | (a)   | handle  | 1049256 | `destructable: 00000170C61E8B50` |         |
| scale: negative              | (a)   | handle  | 1049257 | `destructable: 000001715C6E6C00` |         |
| scale: outside the world     | (a)   | handle  | 1049258 | `destructable: 00000171877CA190` |         |
| scale: 2147483647            | (a)   | handle  | 1049259 | `destructable: 00000170C61D3AB0` |         |
| variation: negative          | (a)   | handle  | 1049260 | `destructable: 00000171877F4A70` |         |
| variation: outside the world | (a)   | handle  | 1049261 | `destructable: 00000170C5BB1350` |         |
| variation: 2147483647        | (a)   | handle  | 1049262 | `destructable: 00000170C5EB71E0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateDestructableWithSkinColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049263 | `destructable: 00000170C5F5EAC0` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049264 | `destructable: 00000170C5EC81E0` |         |
| x: negative                  | (a)   | handle  | 1049265 | `destructable: 000001718796B920` |         |
| x: outside the world         | (a)   | handle  | 1049266 | `destructable: 00000171642F25F0` |         |
| x: 2147483647                | (a)   | handle  | 1049267 | `destructable: 00000170C622FB80` |         |
| y: 0                         | (a)   | handle  | 1049268 | `destructable: 0000017187C63D60` |         |
| y: negative                  | (a)   | handle  | 1049269 | `destructable: 00000171878460B0` |         |
| y: outside the world         | (a)   | handle  | 1049270 | `destructable: 00000170C6545F30` |         |
| y: 2147483647                | (a)   | handle  | 1049271 | `destructable: 00000170C6211390` |         |
| face: 0                      | (a)   | handle  | 1049272 | `destructable: 000001716B5A12D0` |         |
| face: negative               | (a)   | handle  | 1049273 | `destructable: 00000170C5F5C400` |         |
| face: outside the world      | (a)   | handle  | 1049274 | `destructable: 0000017187C41240` |         |
| face: 2147483647             | (a)   | handle  | 1049275 | `destructable: 00000171879F4330` |         |
| scale: 0                     | (a)   | handle  | 1049276 | `destructable: 0000017187C50D30` |         |
| scale: negative              | (a)   | handle  | 1049277 | `destructable: 0000017185777E00` |         |
| scale: outside the world     | (a)   | handle  | 1049278 | `destructable: 00000170C6231F90` |         |
| scale: 2147483647            | (a)   | handle  | 1049279 | `destructable: 0000017187BD2AB0` |         |
| variation: negative          | (a)   | handle  | 1049280 | `destructable: 0000017187A920C0` |         |
| variation: outside the world | (a)   | handle  | 1049281 | `destructable: 00000170C5B74340` |         |
| variation: 2147483647        | (a)   | handle  | 1049282 | `destructable: 00000170C6583D70` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1049283 | `destructable: 00000170C61D00C0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateDestructableZWithSkinColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049284 | `destructable: 00000170C6559540` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049285 | `destructable: 00000171642EC5E0` |         |
| x: negative                  | (a)   | handle  | 1049286 | `destructable: 00000170C6556F90` |         |
| x: outside the world         | (a)   | handle  | 1049287 | `destructable: 00000170C61EBAA0` |         |
| x: 2147483647                | (a)   | handle  | 1049288 | `destructable: 0000017187C35370` |         |
| y: 0                         | (a)   | handle  | 1049289 | `destructable: 0000017187AAAA90` |         |
| y: negative                  | (a)   | handle  | 1049290 | `destructable: 0000017187C697E0` |         |
| y: outside the world         | (a)   | handle  | 1049291 | `destructable: 0000017187A7E700` |         |
| y: 2147483647                | (a)   | handle  | 1049292 | `destructable: 0000017187C789A0` |         |
| z: negative                  | (a)   | handle  | 1049293 | `destructable: 00000171877E4C30` |         |
| z: outside the world         | (a)   | handle  | 1049294 | `destructable: 00000171877EA250` |         |
| z: 2147483647                | (a)   | handle  | 1049295 | `destructable: 0000017187CB1FC0` |         |
| face: 0                      | (a)   | handle  | 1049296 | `destructable: 00000171877A1DD0` |         |
| face: negative               | (a)   | handle  | 1049297 | `destructable: 000001718780BDA0` |         |
| face: outside the world      | (a)   | handle  | 1049298 | `destructable: 000001716B768610` |         |
| face: 2147483647             | (a)   | handle  | 1049299 | `destructable: 0000017187C9B220` |         |
| scale: 0                     | (a)   | handle  | 1049300 | `destructable: 0000017187B49EF0` |         |
| scale: negative              | (a)   | handle  | 1049301 | `destructable: 0000017187AB57A0` |         |
| scale: outside the world     | (a)   | handle  | 1049302 | `destructable: 0000017187BA1780` |         |
| scale: 2147483647            | (a)   | handle  | 1049303 | `destructable: 00000170C621F9A0` |         |
| variation: negative          | (a)   | handle  | 1049304 | `destructable: 00000170C62179C0` |         |
| variation: outside the world | (a)   | handle  | 1049305 | `destructable: 00000171857749D0` |         |
| variation: 2147483647        | (a)   | handle  | 1049306 | `destructable: 000001718784A9A0` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1049307 | `destructable: 00000171877F40C0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateDeadDestructableWithSkinColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049308 | `destructable: 0000017187C86D40` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049309 | `destructable: 0000017187D24670` |         |
| x: negative                  | (a)   | handle  | 1049310 | `destructable: 00000170C620A2C0` |         |
| x: outside the world         | (a)   | handle  | 1049311 | `destructable: 0000017187D187D0` |         |
| x: 2147483647                | (a)   | handle  | 1049312 | `destructable: 0000017187CAEA70` |         |
| y: 0                         | (a)   | handle  | 1049313 | `destructable: 0000017187C89710` |         |
| y: negative                  | (a)   | handle  | 1049314 | `destructable: 0000017187C04CF0` |         |
| y: outside the world         | (a)   | handle  | 1049315 | `destructable: 0000017187B77B60` |         |
| y: 2147483647                | (a)   | handle  | 1049316 | `destructable: 0000017187B20C90` |         |
| face: 0                      | (a)   | handle  | 1049317 | `destructable: 00000171877FEBC0` |         |
| face: negative               | (a)   | handle  | 1049318 | `destructable: 00000170C61BC1D0` |         |
| face: outside the world      | (a)   | handle  | 1049319 | `destructable: 00000170C622F6C0` |         |
| face: 2147483647             | (a)   | handle  | 1049320 | `destructable: 00000171877FCE20` |         |
| scale: 0                     | (a)   | handle  | 1049321 | `destructable: 0000017187D26740` |         |
| scale: negative              | (a)   | handle  | 1049322 | `destructable: 000001715C6D3CE0` |         |
| scale: outside the world     | (a)   | handle  | 1049323 | `destructable: 000001715C6E7D40` |         |
| scale: 2147483647            | (a)   | handle  | 1049324 | `destructable: 0000017187AD10F0` |         |
| variation: negative          | (a)   | handle  | 1049325 | `destructable: 0000017187A9CA00` |         |
| variation: outside the world | (a)   | handle  | 1049326 | `destructable: 00000170C6220580` |         |
| variation: 2147483647        | (a)   | handle  | 1049327 | `destructable: 0000017187AA44E0` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1049328 | `destructable: 00000170C587CAD0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateDeadDestructableZWithSkinColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049329 | `destructable: 0000017187C0CCA0` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049330 | `destructable: 00000170C6579B10` |         |
| x: negative                  | (a)   | handle  | 1049331 | `destructable: 00000170C63462C0` |         |
| x: outside the world         | (a)   | handle  | 1049332 | `destructable: 00000170C5BE2CE0` |         |
| x: 2147483647                | (a)   | handle  | 1049333 | `destructable: 0000017187B29930` |         |
| y: 0                         | (a)   | handle  | 1049334 | `destructable: 00000170C5BEA4C0` |         |
| y: negative                  | (a)   | handle  | 1049335 | `destructable: 0000017187CECE80` |         |
| y: outside the world         | (a)   | handle  | 1049336 | `destructable: 000001716B769420` |         |
| y: 2147483647                | (a)   | handle  | 1049337 | `destructable: 0000017187CE48B0` |         |
| z: negative                  | (a)   | handle  | 1049338 | `destructable: 0000017187CBA3C0` |         |
| z: outside the world         | (a)   | handle  | 1049339 | `destructable: 00000170C6232E00` |         |
| z: 2147483647                | (a)   | handle  | 1049340 | `destructable: 00000170C652D180` |         |
| face: 0                      | (a)   | handle  | 1049341 | `destructable: 00000170C652CC80` |         |
| face: negative               | (a)   | handle  | 1049342 | `destructable: 00000170C6348220` |         |
| face: outside the world      | (a)   | handle  | 1049343 | `destructable: 0000017187CDBFB0` |         |
| face: 2147483647             | (a)   | handle  | 1049344 | `destructable: 000001716B5A1D90` |         |
| scale: 0                     | (a)   | handle  | 1049345 | `destructable: 00000170C6563D10` |         |
| scale: negative              | (a)   | handle  | 1049346 | `destructable: 00000170C61C3500` |         |
| scale: outside the world     | (a)   | handle  | 1049347 | `destructable: 00000170C6224C30` |         |
| scale: 2147483647            | (a)   | handle  | 1049348 | `destructable: 00000170C6579950` |         |
| variation: negative          | (a)   | handle  | 1049349 | `destructable: 00000170C65678A0` |         |
| variation: outside the world | (a)   | handle  | 1049350 | `destructable: 0000017187A543A0` |         |
| variation: 2147483647        | (a)   | handle  | 1049351 | `destructable: 00000170C5BC93A0` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1049352 | `destructable: 0000017187B217A0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateDestructablePitchRollWithColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049353 | `destructable: 00000170C5BD7D60` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049354 | `destructable: 0000017187A3E190` |         |
| x: negative                  | (a)   | handle  | 1049355 | `destructable: 0000017187A88610` |         |
| x: outside the world         | (a)   | handle  | 1049356 | `destructable: 00000170C656CB90` |         |
| x: 2147483647                | (a)   | handle  | 1049357 | `destructable: 0000017187D0B9A0` |         |
| y: 0                         | (a)   | handle  | 1049358 | `destructable: 000001715C6D8030` |         |
| y: negative                  | (a)   | handle  | 1049359 | `destructable: 0000017187A44FB0` |         |
| y: outside the world         | (a)   | handle  | 1049360 | `destructable: 00000170C64DEF70` |         |
| y: 2147483647                | (a)   | handle  | 1049361 | `destructable: 000001716676ACB0` |         |
| face: 0                      | (a)   | handle  | 1049362 | `destructable: 0000017187CFDE00` |         |
| face: negative               | (a)   | handle  | 1049363 | `destructable: 0000017187BA9230` |         |
| face: outside the world      | (a)   | handle  | 1049364 | `destructable: 0000017187800410` |         |
| face: 2147483647             | (a)   | handle  | 1049365 | `destructable: 00000171877B8FD0` |         |
| roll: negative               | (a)   | handle  | 1049366 | `destructable: 0000017187847AB0` |         |
| roll: outside the world      | (a)   | handle  | 1049367 | `destructable: 00000170C6524030` |         |
| roll: 2147483647             | (a)   | handle  | 1049368 | `destructable: 00000170C5BE0D60` |         |
| pitch: negative              | (a)   | handle  | 1049369 | `destructable: 00000170C6213110` |         |
| pitch: outside the world     | (a)   | handle  | 1049370 | `destructable: 0000017187B2C230` |         |
| pitch: 2147483647            | (a)   | handle  | 1049371 | `destructable: 00000170C653A8C0` |         |
| scale: 0                     | (a)   | handle  | 1049372 | `destructable: 0000017187A6B5B0` |         |
| scale: negative              | (a)   | handle  | 1049373 | `destructable: 00000170C6539C10` |         |
| scale: outside the world     | (a)   | handle  | 1049374 | `destructable: 0000017187BC5450` |         |
| scale: 2147483647            | (a)   | handle  | 1049375 | `destructable: 0000017187AD34D0` |         |
| variation: negative          | (a)   | handle  | 1049376 | `destructable: 00000170C5BE1410` |         |
| variation: outside the world | (a)   | handle  | 1049377 | `destructable: 00000170C6525880` |         |
| variation: 2147483647        | (a)   | handle  | 1049378 | `destructable: 0000017187A61470` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateDestructableZPitchRollWithColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049379 | `destructable: 0000017187CC9F00` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049380 | `destructable: 000001718577D670` |         |
| x: negative                  | (a)   | handle  | 1049381 | `destructable: 0000017187B31740` |         |
| x: outside the world         | (a)   | handle  | 1049382 | `destructable: 00000170C5BDCA90` |         |
| x: 2147483647                | (a)   | handle  | 1049383 | `destructable: 0000017187B87B40` |         |
| y: 0                         | (a)   | handle  | 1049384 | `destructable: 000001715C6DBD30` |         |
| y: negative                  | (a)   | handle  | 1049385 | `destructable: 00000170C6563980` |         |
| y: outside the world         | (a)   | handle  | 1049386 | `destructable: 0000017187BB79D0` |         |
| y: 2147483647                | (a)   | handle  | 1049387 | `destructable: 00000170C5BC5440` |         |
| z: negative                  | (a)   | handle  | 1049388 | `destructable: 0000017187BBEAE0` |         |
| z: outside the world         | (a)   | handle  | 1049389 | `destructable: 0000017187B8FAA0` |         |
| z: 2147483647                | (a)   | handle  | 1049390 | `destructable: 00000170C65829B0` |         |
| face: 0                      | (a)   | handle  | 1049391 | `destructable: 00000171877C7600` |         |
| face: negative               | (a)   | handle  | 1049392 | `destructable: 0000017187D19B20` |         |
| face: outside the world      | (a)   | handle  | 1049393 | `destructable: 00000171877CE3D0` |         |
| face: 2147483647             | (a)   | handle  | 1049394 | `destructable: 0000017187C90660` |         |
| roll: negative               | (a)   | handle  | 1049395 | `destructable: 0000017187822070` |         |
| roll: outside the world      | (a)   | handle  | 1049396 | `destructable: 00000170C61F2EE0` |         |
| roll: 2147483647             | (a)   | handle  | 1049397 | `destructable: 00000170C6208690` |         |
| pitch: negative              | (a)   | handle  | 1049398 | `destructable: 0000017187C96290` |         |
| pitch: outside the world     | (a)   | handle  | 1049399 | `destructable: 0000017187855E60` |         |
| pitch: 2147483647            | (a)   | handle  | 1049400 | `destructable: 0000017187CC69F0` |         |
| scale: 0                     | (a)   | handle  | 1049401 | `destructable: 000001715C6F1850` |         |
| scale: negative              | (a)   | handle  | 1049402 | `destructable: 000001716B5A6600` |         |
| scale: outside the world     | (a)   | handle  | 1049403 | `destructable: 0000017187806DD0` |         |
| scale: 2147483647            | (a)   | handle  | 1049404 | `destructable: 0000017187CAE3F0` |         |
| variation: negative          | (a)   | handle  | 1049405 | `destructable: 000001716B5BFB90` |         |
| variation: outside the world | (a)   | handle  | 1049406 | `destructable: 0000017187CB4610` |         |
| variation: 2147483647        | (a)   | handle  | 1049407 | `destructable: 00000170C6573950` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateDeadDestructablePitchRollWithColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049408 | `destructable: 00000170C64DA250` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049409 | `destructable: 00000170C620B510` |         |
| x: negative                  | (a)   | handle  | 1049410 | `destructable: 00000170C61BABC0` |         |
| x: outside the world         | (a)   | handle  | 1049411 | `destructable: 00000170C6523B20` |         |
| x: 2147483647                | (a)   | handle  | 1049412 | `destructable: 0000017187B93930` |         |
| y: 0                         | (a)   | handle  | 1049413 | `destructable: 00000170C653D500` |         |
| y: negative                  | (a)   | handle  | 1049414 | `destructable: 00000171877A2920` |         |
| y: outside the world         | (a)   | handle  | 1049415 | `destructable: 00000170C61CA6D0` |         |
| y: 2147483647                | (a)   | handle  | 1049416 | `destructable: 0000017187810000` |         |
| face: 0                      | (a)   | handle  | 1049417 | `destructable: 0000017187CA84E0` |         |
| face: negative               | (a)   | handle  | 1049418 | `destructable: 00000171877E5E20` |         |
| face: outside the world      | (a)   | handle  | 1049419 | `destructable: 0000017187A5A420` |         |
| face: 2147483647             | (a)   | handle  | 1049420 | `destructable: 00000170C61D2730` |         |
| roll: negative               | (a)   | handle  | 1049421 | `destructable: 0000017187808B20` |         |
| roll: outside the world      | (a)   | handle  | 1049422 | `destructable: 000001716B5A4370` |         |
| roll: 2147483647             | (a)   | handle  | 1049423 | `destructable: 0000017187848A50` |         |
| pitch: negative              | (a)   | handle  | 1049424 | `destructable: 00000170C5BBE820` |         |
| pitch: outside the world     | (a)   | handle  | 1049425 | `destructable: 0000017187A518E0` |         |
| pitch: 2147483647            | (a)   | handle  | 1049426 | `destructable: 00000171877F0830` |         |
| scale: 0                     | (a)   | handle  | 1049427 | `destructable: 00000170C656FE40` |         |
| scale: negative              | (a)   | handle  | 1049428 | `destructable: 00000170C65445C0` |         |
| scale: outside the world     | (a)   | handle  | 1049429 | `destructable: 00000171877F33D0` |         |
| scale: 2147483647            | (a)   | handle  | 1049430 | `destructable: 000001718784A170` |         |
| variation: negative          | (a)   | handle  | 1049431 | `destructable: 0000017187812AE0` |         |
| variation: outside the world | (a)   | handle  | 1049432 | `destructable: 00000170C5BD0820` |         |
| variation: 2147483647        | (a)   | handle  | 1049433 | `destructable: 00000171878505D0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateDeadDestructableZPitchRollWithColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049434 | `destructable: 00000170C61EFE60` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049435 | `destructable: 00000170C6218F70` |         |
| x: negative                  | (a)   | handle  | 1049436 | `destructable: 0000017187AAF230` |         |
| x: outside the world         | (a)   | handle  | 1049437 | `destructable: 000001715C6E83F0` |         |
| x: 2147483647                | (a)   | handle  | 1049438 | `destructable: 0000017187D0ECF0` |         |
| y: 0                         | (a)   | handle  | 1049439 | `destructable: 0000017187BBBE00` |         |
| y: negative                  | (a)   | handle  | 1049440 | `destructable: 0000017187C938D0` |         |
| y: outside the world         | (a)   | handle  | 1049441 | `destructable: 000001716B5A9260` |         |
| y: 2147483647                | (a)   | handle  | 1049442 | `destructable: 00000170C5BD22D0` |         |
| z: negative                  | (a)   | handle  | 1049443 | `destructable: 0000017187CAD7C0` |         |
| z: outside the world         | (a)   | handle  | 1049444 | `destructable: 0000017187CF2570` |         |
| z: 2147483647                | (a)   | handle  | 1049445 | `destructable: 0000017187C47C80` |         |
| face: 0                      | (a)   | handle  | 1049446 | `destructable: 0000017187D17990` |         |
| face: negative               | (a)   | handle  | 1049447 | `destructable: 0000017187A766F0` |         |
| face: outside the world      | (a)   | handle  | 1049448 | `destructable: 0000017187A1F9C0` |         |
| face: 2147483647             | (a)   | handle  | 1049449 | `destructable: 0000017187A53DF0` |         |
| roll: negative               | (a)   | handle  | 1049450 | `destructable: 0000017187C3F610` |         |
| roll: outside the world      | (a)   | handle  | 1049451 | `destructable: 0000017187C36340` |         |
| roll: 2147483647             | (a)   | handle  | 1049452 | `destructable: 0000017187B54930` |         |
| pitch: negative              | (a)   | handle  | 1049453 | `destructable: 0000017187AB0D90` |         |
| pitch: outside the world     | (a)   | handle  | 1049454 | `destructable: 0000017187C464A0` |         |
| pitch: 2147483647            | (a)   | handle  | 1049455 | `destructable: 0000017187A73450` |         |
| scale: 0                     | (a)   | handle  | 1049456 | `destructable: 0000017187B5A9F0` |         |
| scale: negative              | (a)   | handle  | 1049457 | `destructable: 0000017187B33760` |         |
| scale: outside the world     | (a)   | handle  | 1049458 | `destructable: 0000017187AD82E0` |         |
| scale: 2147483647            | (a)   | handle  | 1049459 | `destructable: 0000017187A730A0` |         |
| variation: negative          | (a)   | handle  | 1049460 | `destructable: 0000017187A3A9E0` |         |
| variation: outside the world | (a)   | handle  | 1049461 | `destructable: 0000017187AC2630` |         |
| variation: 2147483647        | (a)   | handle  | 1049462 | `destructable: 00000170C64E9900` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateDestructableWithSkinPitchRollColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049463 | `destructable: 0000017187ACAF80` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049464 | `destructable: 0000017187CA4170` |         |
| x: negative                  | (a)   | handle  | 1049465 | `destructable: 00000170C657E780` |         |
| x: outside the world         | (a)   | handle  | 1049466 | `destructable: 0000017187D23E40` |         |
| x: 2147483647                | (a)   | handle  | 1049467 | `destructable: 0000017187D232F0` |         |
| y: 0                         | (a)   | handle  | 1049468 | `destructable: 00000170C65770F0` |         |
| y: negative                  | (a)   | handle  | 1049469 | `destructable: 0000017187C8B100` |         |
| y: outside the world         | (a)   | handle  | 1049470 | `destructable: 0000017187C69F40` |         |
| y: 2147483647                | (a)   | handle  | 1049471 | `destructable: 0000017187CF0500` |         |
| face: 0                      | (a)   | handle  | 1049472 | `destructable: 0000017187C568D0` |         |
| face: negative               | (a)   | handle  | 1049473 | `destructable: 0000017187C95770` |         |
| face: outside the world      | (a)   | handle  | 1049474 | `destructable: 00000170C6225400` |         |
| face: 2147483647             | (a)   | handle  | 1049475 | `destructable: 0000017187827750` |         |
| roll: negative               | (a)   | handle  | 1049476 | `destructable: 0000017187A936C0` |         |
| roll: outside the world      | (a)   | handle  | 1049477 | `destructable: 0000017187D11600` |         |
| roll: 2147483647             | (a)   | handle  | 1049478 | `destructable: 00000170C61E1E20` |         |
| pitch: negative              | (a)   | handle  | 1049479 | `destructable: 0000017187C6B580` |         |
| pitch: outside the world     | (a)   | handle  | 1049480 | `destructable: 0000017187CFD3B0` |         |
| pitch: 2147483647            | (a)   | handle  | 1049481 | `destructable: 000001718779F240` |         |
| scale: 0                     | (a)   | handle  | 1049482 | `destructable: 00000171878E4C00` |         |
| scale: negative              | (a)   | handle  | 1049483 | `destructable: 0000017187B50030` |         |
| scale: outside the world     | (a)   | handle  | 1049484 | `destructable: 00000171642AE280` |         |
| scale: 2147483647            | (a)   | handle  | 1049485 | `destructable: 0000017187CE9B10` |         |
| variation: negative          | (a)   | handle  | 1049486 | `destructable: 0000017187981EA0` |         |
| variation: outside the world | (a)   | handle  | 1049487 | `destructable: 0000017187D01060` |         |
| variation: 2147483647        | (a)   | handle  | 1049488 | `destructable: 0000017187B71EF0` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1049489 | `destructable: 0000017187CB41B0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateDestructableZWithSkinPitchRollColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049490 | `destructable: 0000017187B81420` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049491 | `destructable: 0000017187C0C0B0` |         |
| x: negative                  | (a)   | handle  | 1049492 | `destructable: 0000017187B81D60` |         |
| x: outside the world         | (a)   | handle  | 1049493 | `destructable: 0000017187D30030` |         |
| x: 2147483647                | (a)   | handle  | 1049494 | `destructable: 0000017187ADB7B0` |         |
| y: 0                         | (a)   | handle  | 1049495 | `destructable: 0000017187ADAF10` |         |
| y: negative                  | (a)   | handle  | 1049496 | `destructable: 0000017187BD19B0` |         |
| y: outside the world         | (a)   | handle  | 1049497 | `destructable: 0000017187AC0960` |         |
| y: 2147483647                | (a)   | handle  | 1049498 | `destructable: 0000017187BD2090` |         |
| z: negative                  | (a)   | handle  | 1049499 | `destructable: 0000017187CEC750` |         |
| z: outside the world         | (a)   | handle  | 1049500 | `destructable: 0000017187AD0800` |         |
| z: 2147483647                | (a)   | handle  | 1049501 | `destructable: 000001715C6FF8B0` |         |
| face: 0                      | (a)   | handle  | 1049502 | `destructable: 0000017187AA2C80` |         |
| face: negative               | (a)   | handle  | 1049503 | `destructable: 0000017187BA63C0` |         |
| face: outside the world      | (a)   | handle  | 1049504 | `destructable: 0000017187BC0930` |         |
| face: 2147483647             | (a)   | handle  | 1049505 | `destructable: 0000017187AE6C60` |         |
| roll: negative               | (a)   | handle  | 1049506 | `destructable: 0000017187B6D6C0` |         |
| roll: outside the world      | (a)   | handle  | 1049507 | `destructable: 0000017187BAD150` |         |
| roll: 2147483647             | (a)   | handle  | 1049508 | `destructable: 0000017187B65E70` |         |
| pitch: negative              | (a)   | handle  | 1049509 | `destructable: 0000017187D6B4B0` |         |
| pitch: outside the world     | (a)   | handle  | 1049510 | `destructable: 0000017187C4A5F0` |         |
| pitch: 2147483647            | (a)   | handle  | 1049511 | `destructable: 0000017187C5BB40` |         |
| scale: 0                     | (a)   | handle  | 1049512 | `destructable: 0000017187C988F0` |         |
| scale: negative              | (a)   | handle  | 1049513 | `destructable: 0000017187C7F0F0` |         |
| scale: outside the world     | (a)   | handle  | 1049514 | `destructable: 0000017187CA07B0` |         |
| scale: 2147483647            | (a)   | handle  | 1049515 | `destructable: 000001716B5E2B40` |         |
| variation: negative          | (a)   | handle  | 1049516 | `destructable: 000001715C6CA4A0` |         |
| variation: outside the world | (a)   | handle  | 1049517 | `destructable: 000001716B5CAD30` |         |
| variation: 2147483647        | (a)   | handle  | 1049518 | `destructable: 000001716B5D0EB0` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1049519 | `destructable: 000001716B5D3EE0` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateDeadDestructableWithSkinPitchRollColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049520 | `destructable: 000001716B5CD4A0` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049521 | `destructable: 000001716B5D3020` |         |
| x: negative                  | (a)   | handle  | 1049522 | `destructable: 000001716B5E8650` |         |
| x: outside the world         | (a)   | handle  | 1049523 | `destructable: 00000171685AB490` |         |
| x: 2147483647                | (a)   | handle  | 1049524 | `destructable: 00000171685AFB80` |         |
| y: 0                         | (a)   | handle  | 1049525 | `destructable: 00000171685B47F0` |         |
| y: negative                  | (a)   | handle  | 1049526 | `destructable: 00000171685AEF30` |         |
| y: outside the world         | (a)   | handle  | 1049527 | `destructable: 0000017187DED6A0` |         |
| y: 2147483647                | (a)   | handle  | 1049528 | `destructable: 0000017187DF16D0` |         |
| face: 0                      | (a)   | handle  | 1049529 | `destructable: 0000017187DF5A30` |         |
| face: negative               | (a)   | handle  | 1049530 | `destructable: 00000171685AE640` |         |
| face: outside the world      | (a)   | handle  | 1049531 | `destructable: 0000017187E38750` |         |
| face: 2147483647             | (a)   | handle  | 1049532 | `destructable: 0000017187E3CEF0` |         |
| roll: negative               | (a)   | handle  | 1049533 | `destructable: 0000017187DF0640` |         |
| roll: outside the world      | (a)   | handle  | 1049534 | `destructable: 0000017187E3AAE0` |         |
| roll: 2147483647             | (a)   | handle  | 1049535 | `destructable: 0000017187E51880` |         |
| pitch: negative              | (a)   | handle  | 1049536 | `destructable: 0000017187E56C40` |         |
| pitch: outside the world     | (a)   | handle  | 1049537 | `destructable: 0000017187E5B3C0` |         |
| pitch: 2147483647            | (a)   | handle  | 1049538 | `destructable: 0000017187E53D30` |         |
| scale: 0                     | (a)   | handle  | 1049539 | `destructable: 0000017187E54D70` |         |
| scale: negative              | (a)   | handle  | 1049540 | `destructable: 0000017187E87860` |         |
| scale: outside the world     | (a)   | handle  | 1049541 | `destructable: 0000017187E8C9C0` |         |
| scale: 2147483647            | (a)   | handle  | 1049542 | `destructable: 0000017187E90C70` |         |
| variation: negative          | (a)   | handle  | 1049543 | `destructable: 0000017187E8FDB0` |         |
| variation: outside the world | (a)   | handle  | 1049544 | `destructable: 0000017187E85FC0` |         |
| variation: 2147483647        | (a)   | handle  | 1049545 | `destructable: 0000017187EA9EE0` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1049546 | `destructable: 0000017187EAE620` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

### `BlzCreateDeadDestructableZWithSkinPitchRollColor`

| Case                         | Group | Outcome | Id      | Type                             | Message |
| ---------------------------- | ----- | ------- | ------- | -------------------------------- | ------- |
| typical arguments            | (a)   | handle  | 1049547 | `destructable: 0000017187E8A700` |         |
| objectid: unknown rawcode    | (a)   | nil     |         |                                  |         |
| x: 0                         | (a)   | handle  | 1049548 | `destructable: 0000017187ED4700` |         |
| x: negative                  | (a)   | handle  | 1049549 | `destructable: 0000017187ED9060` |         |
| x: outside the world         | (a)   | handle  | 1049550 | `destructable: 0000017187EDD3C0` |         |
| x: 2147483647                | (a)   | handle  | 1049551 | `destructable: 0000017187EA78A0` |         |
| y: 0                         | (a)   | handle  | 1049552 | `destructable: 0000017187EDB2E0` |         |
| y: negative                  | (a)   | handle  | 1049553 | `destructable: 0000017187ED7A30` |         |
| y: outside the world         | (a)   | handle  | 1049554 | `destructable: 0000017187F451E0` |         |
| y: 2147483647                | (a)   | handle  | 1049555 | `destructable: 0000017187F4A4D0` |         |
| z: negative                  | (a)   | handle  | 1049556 | `destructable: 0000017187F44AD0` |         |
| z: outside the world         | (a)   | handle  | 1049557 | `destructable: 0000017187F4CB40` |         |
| z: 2147483647                | (a)   | handle  | 1049558 | `destructable: 0000017187F493B0` |         |
| face: 0                      | (a)   | handle  | 1049559 | `destructable: 0000017187F6B130` |         |
| face: negative               | (a)   | handle  | 1049560 | `destructable: 0000017187F70370` |         |
| face: outside the world      | (a)   | handle  | 1049561 | `destructable: 0000017187F750D0` |         |
| face: 2147483647             | (a)   | handle  | 1049562 | `destructable: 0000017187F48010` |         |
| roll: negative               | (a)   | handle  | 1049563 | `destructable: 0000017187F6E260` |         |
| roll: outside the world      | (a)   | handle  | 1049564 | `destructable: 0000017187F97A00` |         |
| roll: 2147483647             | (a)   | handle  | 1049565 | `destructable: 0000017187F9E710` |         |
| pitch: negative              | (a)   | handle  | 1049566 | `destructable: 0000017187FA3A50` |         |
| pitch: outside the world     | (a)   | handle  | 1049567 | `destructable: 0000017187F69440` |         |
| pitch: 2147483647            | (a)   | handle  | 1049568 | `destructable: 0000017187FA0AD0` |         |
| scale: 0                     | (a)   | handle  | 1049569 | `destructable: 0000017187FA1EE0` |         |
| scale: negative              | (a)   | handle  | 1049570 | `destructable: 0000017187D7CC00` |         |
| scale: outside the world     | (a)   | handle  | 1049571 | `destructable: 0000017187D82270` |         |
| scale: 2147483647            | (a)   | handle  | 1049572 | `destructable: 0000017187F9DC80` |         |
| variation: negative          | (a)   | handle  | 1049573 | `destructable: 0000017187FAD820` |         |
| variation: outside the world | (a)   | handle  | 1049574 | `destructable: 0000017187FB3920` |         |
| variation: 2147483647        | (a)   | handle  | 1049575 | `destructable: 0000017187FB9160` |         |
| skinId: unknown rawcode      | (a)   | handle  | 1049576 | `destructable: 0000017187FAFD90` |         |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (objectid: unknown rawcode) on 3.0.1.24370.

## `nullability-registrations`

- Probe: `nullability-registrations`
- Patch: 3.0.1.24370
- Client: 3.0.1.24371
- Date: 2026-10-21
- Run: `c45af9c2-6ecc-4737-aa45-a138d020329d`

### `TriggerRegisterVariableEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048813 | `event: 000001C80F694130` |         |
| varName: empty string           | (a)   | handle  | 1048814 | `event: 000001C8E9287470` |         |
| varName: unknown name           | (a)   | handle  | 1048815 | `event: 000001C8E927DBA0` |         |
| limitval: 0                     | (a)   | handle  | 1048816 | `event: 000001C80F69D240` |         |
| limitval: negative              | (a)   | handle  | 1048817 | `event: 000001C80F692920` |         |
| limitval: outside the world     | (a)   | handle  | 1048818 | `event: 000001C80F7BDFA0` |         |
| limitval: 2147483647            | (a)   | handle  | 1048819 | `event: 000001C80F7C0510` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.1.24370.

### `TriggerRegisterTimerEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048820 | `event: 000001C80F7C2C00` |         |
| timeout: 0                      | (a)   | handle  | 1048821 | `event: 000001C80F7C8F20` |         |
| timeout: negative               | (a)   | handle  | 1048822 | `event: 000001C80F7C87A0` |         |
| timeout: outside the world      | (a)   | handle  | 1048823 | `event: 000001C80F7CB7F0` |         |
| timeout: 2147483647             | (a)   | handle  | 1048824 | `event: 000001C80F7CB230` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.1.24370.

### `TriggerRegisterTimerExpireEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048825 | `event: 000001C80F618E50` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |
| t: destroyed timer              | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 2 cases of the nullability sweep (whichTrigger: destroyed trigger, t: destroyed timer) on 3.0.1.24370.

### `TriggerRegisterGameStateEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048826 | `event: 000001C80F61EE90` |         |
| limitval: 0                     | (a)   | handle  | 1048827 | `event: 000001C80F697690` |         |
| limitval: negative              | (a)   | handle  | 1048828 | `event: 000001C80F621A70` |         |
| limitval: outside the world     | (a)   | handle  | 1048829 | `event: 000001C80F61BA10` |         |
| limitval: 2147483647            | (a)   | handle  | 1048830 | `event: 000001C80F618580` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.1.24370.

### `TriggerRegisterDialogEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048831 | `event: 000001C80F6230C0` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |
| whichDialog: destroyed dialog   | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 2 cases of the nullability sweep (whichTrigger: destroyed trigger, whichDialog: destroyed dialog) on 3.0.1.24370.

### `TriggerRegisterDialogButtonEvent`

| Case                                    | Group | Outcome | Id      | Type                      | Message |
| --------------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments                       | (a)   | handle  | 1048832 | `event: 000001C80F625800` |         |
| whichTrigger: destroyed trigger         | (b)   | nil     |         |                           |         |
| whichButton: button after DialogDestroy | (b)   | nil     |         |                           |         |
| whichButton: button after DialogClear   | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 3 cases of the nullability sweep (whichTrigger: destroyed trigger, whichButton: button after DialogDestroy, whichButton: button after DialogClear) on 3.0.1.24370.

### `TriggerRegisterGameEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048833 | `event: 000001C80F62F150` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.1.24370.

### `TriggerRegisterEnterRegion`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048834 | `event: 000001C80F633DF0` |         |
| filter: nil                     | (a)   | handle  | 1048835 | `event: 000001C80F6164C0` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |
| whichRegion: removed region     | (b)   | nil     |         |                           |         |
| filter: destroyed condition     | (b)   | handle  | 1048881 | `event: 000001C80F786710` |         |
| filter: destroyed filter        | (b)   | handle  | 1048882 | `event: 000001C80F7A6A70` |         |
| filter: destroyed boolexpr      | (b)   | handle  | 1048883 | `event: 000001C80F759450` |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 2 cases of the nullability sweep (whichTrigger: destroyed trigger, whichRegion: removed region) on 3.0.1.24370.

### `TriggerRegisterLeaveRegion`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048836 | `event: 000001C80F6321B0` |         |
| filter: nil                     | (a)   | handle  | 1048837 | `event: 000001C80F633330` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |
| whichRegion: removed region     | (b)   | nil     |         |                           |         |
| filter: destroyed condition     | (b)   | handle  | 1048884 | `event: 000001C80F768500` |         |
| filter: destroyed filter        | (b)   | handle  | 1048885 | `event: 000001C80F788BE0` |         |
| filter: destroyed boolexpr      | (b)   | handle  | 1048886 | `event: 000001C80F7A23F0` |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 2 cases of the nullability sweep (whichTrigger: destroyed trigger, whichRegion: removed region) on 3.0.1.24370.

### `TriggerRegisterTrackableHitEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048838 | `event: 000001C80F515420` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.1.24370.

### `TriggerRegisterTrackableTrackEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048839 | `event: 000001C80F51BA00` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.1.24370.

### `TriggerRegisterCommandEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048840 | `event: 000001C80F616E60` |         |
| whichAbility: unknown rawcode   | (a)   | handle  | 1048841 | `event: 000001C80F51DA20` |         |
| order: empty string             | (a)   | nil     |         |                           |         |
| order: unknown name             | (a)   | nil     |         |                           |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 3 cases of the nullability sweep (order: empty string, order: unknown name, whichTrigger: destroyed trigger) on 3.0.1.24370.

### `TriggerRegisterUpgradeCommandEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048842 | `event: 000001C80F51A280` |         |
| whichUpgrade: unknown rawcode   | (a)   | handle  | 1048843 | `event: 000001C80F5235E0` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.1.24370.

### `TriggerRegisterPlayerEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048844 | `event: 000001C80F529980` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.1.24370.

### `TriggerRegisterPlayerUnitEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048845 | `event: 000001C80F52E2F0` |         |
| filter: nil                     | (a)   | handle  | 1048846 | `event: 000001C80F628120` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |
| filter: destroyed condition     | (b)   | handle  | 1048887 | `event: 000001C80F792400` |         |
| filter: destroyed filter        | (b)   | handle  | 1048888 | `event: 000001C80F78E340` |         |
| filter: destroyed boolexpr      | (b)   | handle  | 1048889 | `event: 000001C80F678320` |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.1.24370.

### `TriggerRegisterPlayerAllianceChange`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048847 | `event: 000001C80F5302B0` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.1.24370.

### `TriggerRegisterPlayerStateEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048848 | `event: 000001C80F527090` |         |
| limitval: 0                     | (a)   | handle  | 1048849 | `event: 000001C80F51A000` |         |
| limitval: negative              | (a)   | handle  | 1048850 | `event: 000001C80F4A7B70` |         |
| limitval: outside the world     | (a)   | handle  | 1048851 | `event: 000001C80F4ACAA0` |         |
| limitval: 2147483647            | (a)   | handle  | 1048852 | `event: 000001C80F4B1930` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.1.24370.

### `TriggerRegisterPlayerChatEvent`

| Case                              | Group | Outcome | Id      | Type                      | Message |
| --------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments                 | (a)   | handle  | 1048853 | `event: 000001C80F4B6E60` |         |
| chatMessageToDetect: empty string | (a)   | handle  | 1048854 | `event: 000001C80F4BC370` |         |
| chatMessageToDetect: unknown name | (a)   | handle  | 1048855 | `event: 000001C80F4B5160` |         |
| whichTrigger: destroyed trigger   | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.1.24370.

### `TriggerRegisterDeathEvent`

| Case                              | Group | Outcome | Id      | Type                      | Message |
| --------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments                 | (a)   | handle  | 1048856 | `event: 000001C80F4B49A0` |         |
| whichWidget: live destructable    | (a)   | handle  | 1048857 | `event: 000001C80F4B9800` |         |
| whichWidget: live item            | (a)   | handle  | 1048858 | `event: 000001C80F4AAF60` |         |
| whichTrigger: destroyed trigger   | (b)   | nil     |         |                           |         |
| whichWidget: dead unit            | (b)   | handle  | 1048890 | `event: 000001C80F68DD20` |         |
| whichWidget: removed unit         | (b)   | handle  | 1048891 | `event: 000001C80F67FCA0` |         |
| whichWidget: dead destructable    | (b)   | handle  | 1048892 | `event: 000001C80F6865B0` |         |
| whichWidget: removed destructable | (b)   | nil     |         |                           |         |
| whichWidget: dead item            | (b)   | handle  | 1048893 | `event: 000001C80F67AE80` |         |
| whichWidget: removed item         | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 3 cases of the nullability sweep (whichTrigger: destroyed trigger, whichWidget: removed destructable, whichWidget: removed item) on 3.0.1.24370.

### `TriggerRegisterUnitStateEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048859 | `event: 000001C80F4AB250` |         |
| limitval: 0                     | (a)   | handle  | 1048860 | `event: 000001C80F798B70` |         |
| limitval: negative              | (a)   | handle  | 1048861 | `event: 000001C80F79DFE0` |         |
| limitval: outside the world     | (a)   | handle  | 1048862 | `event: 000001C80F7A3A10` |         |
| limitval: 2147483647            | (a)   | handle  | 1048863 | `event: 000001C80F7A9260` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |
| whichUnit: dead unit            | (b)   | handle  | 1048894 | `event: 000001C80F674830` |         |
| whichUnit: removed unit         | (b)   | handle  | 1048895 | `event: 000001C80F68BD90` |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.1.24370.

### `TriggerRegisterUnitEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048864 | `event: 000001C80F7AF2A0` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |
| whichUnit: dead unit            | (b)   | handle  | 1048896 | `event: 000001C80F549710` |         |
| whichUnit: removed unit         | (b)   | handle  | 1048897 | `event: 000001C80F54F810` |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.1.24370.

### `TriggerRegisterFilterUnitEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048865 | `event: 000001C80F7B4970` |         |
| filter: nil                     | (a)   | handle  | 1048866 | `event: 000001C80F7B97C0` |         |
| whichEvent: EVENT\_UNIT\_DEATH  | (a)   | nil     |         |                           |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |
| whichUnit: dead unit            | (b)   | handle  | 1048898 | `event: 000001C80F55C380` |         |
| whichUnit: removed unit         | (b)   | handle  | 1048899 | `event: 000001C80F562C90` |         |
| filter: destroyed condition     | (b)   | handle  | 1048900 | `event: 000001C80F569A90` |         |
| filter: destroyed filter        | (b)   | handle  | 1048901 | `event: 000001C80F5700C0` |         |
| filter: destroyed boolexpr      | (b)   | handle  | 1048902 | `event: 000001C80F576E60` |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 2 cases of the nullability sweep (whichEvent: EVENT\_UNIT\_DEATH, whichTrigger: destroyed trigger) on 3.0.1.24370.

### `TriggerRegisterUnitInRange`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048867 | `event: 000001C80F4AAC00` |         |
| range: 0                        | (a)   | handle  | 1048868 | `event: 000001C80F7BC460` |         |
| range: negative                 | (a)   | handle  | 1048869 | `event: 000001C80F7A0610` |         |
| range: outside the world        | (a)   | handle  | 1048870 | `event: 000001C80F7B2260` |         |
| range: 2147483647               | (a)   | handle  | 1048871 | `event: 000001C80F7A5BC0` |         |
| filter: nil                     | (a)   | handle  | 1048872 | `event: 000001C80F7A0F40` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |
| whichUnit: dead unit            | (b)   | handle  | 1048903 | `event: 000001C80F585350` |         |
| whichUnit: removed unit         | (b)   | handle  | 1048904 | `event: 000001C80F58CC90` |         |
| filter: destroyed condition     | (b)   | handle  | 1048905 | `event: 000001C80F594910` |         |
| filter: destroyed filter        | (b)   | handle  | 1048906 | `event: 000001C80F560320` |         |
| filter: destroyed boolexpr      | (b)   | handle  | 1048907 | `event: 000001C80F559AF0` |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.1.24370.

### `BlzTriggerRegisterFrameEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048873 | `event: 000001C80F7B37D0` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |
| frame: destroyed frame          | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in 2 cases of the nullability sweep (whichTrigger: destroyed trigger, frame: destroyed frame) on 3.0.1.24370.

### `BlzTriggerRegisterPlayerSyncEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048874 | `event: 000001C80F7B7AA0` |         |
| prefix: empty string            | (a)   | handle  | 1048875 | `event: 000001C80F754640` |         |
| prefix: unknown name            | (a)   | handle  | 1048876 | `event: 000001C80F759D80` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.1.24370.

### `BlzTriggerRegisterPlayerKeyEvent`

| Case                            | Group | Outcome | Id      | Type                      | Message |
| ------------------------------- | ----- | ------- | ------- | ------------------------- | ------- |
| typical arguments               | (a)   | handle  | 1048877 | `event: 000001C80F760700` |         |
| metaKey: negative               | (a)   | handle  | 1048878 | `event: 000001C80F765800` |         |
| metaKey: outside the world      | (a)   | handle  | 1048879 | `event: 000001C80F76AAC0` |         |
| metaKey: 2147483647             | (a)   | handle  | 1048880 | `event: 000001C80F7703D0` |         |
| whichTrigger: destroyed trigger | (b)   | nil     |         |                           |         |

- Family: `registration`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.1.24370.

## `nullability-filters`

- Probe: `nullability-filters`
- Patch: 3.0.1.24370
- Client: 3.0.1.24371
- Date: 2026-10-21
- Run: `4a8f8980-affc-4b5f-b805-dc52a6b6f77f`

### `GroupEnumUnitsOfType` parameter `filter`

| Case                | Group | Argument    | Outcome   | Count | Message |
| ------------------- | ----- | ----------- | --------- | ----- | ------- |
| filter: always-true | (a)   | always-true | completed | 1     |         |
| filter: nil         | (a)   | nil         | completed | 1     |         |
| filter: live        | (a)   | live        | completed | 0     |         |

- Verdict: nullable (completed)
- Overlay `params[].nullable`: `true`
- Comparison: consistent
- Proposed sentence of the Native's `notes`: A nil filter keeps every unit (nullability sweep, 3.0.1.24370).

### `GroupEnumUnitsOfPlayer` parameter `filter`

| Case                | Group | Argument    | Outcome   | Count | Message |
| ------------------- | ----- | ----------- | --------- | ----- | ------- |
| filter: always-true | (a)   | always-true | completed | 8     |         |
| filter: nil         | (a)   | nil         | completed | 8     |         |
| filter: live        | (a)   | live        | completed | 1     |         |

- Verdict: nullable (completed)
- Overlay `params[].nullable`: `true`
- Comparison: consistent
- Proposed sentence of the Native's `notes`: A nil filter keeps every unit (nullability sweep, 3.0.1.24370).

### `GroupEnumUnitsOfTypeCounted` parameter `filter`

| Case                | Group | Argument    | Outcome   | Count | Message |
| ------------------- | ----- | ----------- | --------- | ----- | ------- |
| filter: always-true | (a)   | always-true | completed | 1     |         |
| filter: nil         | (a)   | nil         | completed | 1     |         |
| filter: live        | (a)   | live        | completed | 0     |         |

- Verdict: nullable (completed)
- Overlay `params[].nullable`: `true`
- Comparison: consistent
- Proposed sentence of the Native's `notes`: A nil filter keeps every unit (nullability sweep, 3.0.1.24370).

### `GroupEnumUnitsInRect` parameter `filter`

| Case                | Group | Argument    | Outcome   | Count | Message |
| ------------------- | ----- | ----------- | --------- | ----- | ------- |
| filter: always-true | (a)   | always-true | completed | 2     |         |
| filter: nil         | (a)   | nil         | completed | 2     |         |
| filter: live        | (a)   | live        | completed | 1     |         |

- Verdict: nullable (completed)
- Overlay `params[].nullable`: `true`
- Comparison: consistent
- Proposed sentence of the Native's `notes`: A nil filter keeps every unit (nullability sweep, 3.0.1.24370).

### `GroupEnumUnitsInRectCounted` parameter `filter`

| Case                | Group | Argument    | Outcome   | Count | Message |
| ------------------- | ----- | ----------- | --------- | ----- | ------- |
| filter: always-true | (a)   | always-true | completed | 2     |         |
| filter: nil         | (a)   | nil         | completed | 2     |         |
| filter: live        | (a)   | live        | completed | 1     |         |

- Verdict: nullable (completed)
- Overlay `params[].nullable`: `true`
- Comparison: consistent
- Proposed sentence of the Native's `notes`: A nil filter keeps every unit (nullability sweep, 3.0.1.24370).

### `GroupEnumUnitsInRange` parameter `filter`

| Case                | Group | Argument    | Outcome   | Count | Message |
| ------------------- | ----- | ----------- | --------- | ----- | ------- |
| filter: always-true | (a)   | always-true | completed | 2     |         |
| filter: nil         | (a)   | nil         | completed | 2     |         |
| filter: live        | (a)   | live        | completed | 1     |         |

- Verdict: nullable (completed)
- Overlay `params[].nullable`: `true`
- Comparison: consistent
- Proposed sentence of the Native's `notes`: A nil filter keeps every unit (nullability sweep, 3.0.1.24370).

### `GroupEnumUnitsInRangeOfLoc` parameter `filter`

| Case                | Group | Argument    | Outcome   | Count | Message |
| ------------------- | ----- | ----------- | --------- | ----- | ------- |
| filter: always-true | (a)   | always-true | completed | 2     |         |
| filter: nil         | (a)   | nil         | completed | 2     |         |
| filter: live        | (a)   | live        | completed | 1     |         |

- Verdict: nullable (completed)
- Overlay `params[].nullable`: `true`
- Comparison: consistent
- Proposed sentence of the Native's `notes`: A nil filter keeps every unit (nullability sweep, 3.0.1.24370).

### `GroupEnumUnitsInRangeCounted` parameter `filter`

| Case                | Group | Argument    | Outcome   | Count | Message |
| ------------------- | ----- | ----------- | --------- | ----- | ------- |
| filter: always-true | (a)   | always-true | completed | 2     |         |
| filter: nil         | (a)   | nil         | completed | 2     |         |
| filter: live        | (a)   | live        | completed | 1     |         |

- Verdict: nullable (completed)
- Overlay `params[].nullable`: `true`
- Comparison: consistent
- Proposed sentence of the Native's `notes`: A nil filter keeps every unit (nullability sweep, 3.0.1.24370).

### `GroupEnumUnitsInRangeOfLocCounted` parameter `filter`

| Case                | Group | Argument    | Outcome   | Count | Message |
| ------------------- | ----- | ----------- | --------- | ----- | ------- |
| filter: always-true | (a)   | always-true | completed | 2     |         |
| filter: nil         | (a)   | nil         | completed | 2     |         |
| filter: live        | (a)   | live        | completed | 1     |         |

- Verdict: nullable (completed)
- Overlay `params[].nullable`: `true`
- Comparison: consistent
- Proposed sentence of the Native's `notes`: A nil filter keeps every unit (nullability sweep, 3.0.1.24370).

### `GroupEnumUnitsSelected` parameter `filter`

| Case                | Group | Argument    | Outcome   | Count | Message |
| ------------------- | ----- | ----------- | --------- | ----- | ------- |
| filter: always-true | (a)   | always-true | completed | 2     |         |
| filter: nil         | (a)   | nil         | completed | 2     |         |
| filter: live        | (a)   | live        | completed | 1     |         |

- Verdict: nullable (completed)
- Overlay `params[].nullable`: `true`
- Comparison: consistent
- Proposed sentence of the Native's `notes`: A nil filter keeps every unit (nullability sweep, 3.0.1.24370).

### `ForceEnumPlayers` parameter `filter`

| Case                | Group | Argument    | Outcome   | Count | Message |
| ------------------- | ----- | ----------- | --------- | ----- | ------- |
| filter: always-true | (a)   | always-true | completed | 1     |         |
| filter: nil         | (a)   | nil         | completed | 1     |         |
| filter: live        | (a)   | live        | completed | 0     |         |

- Verdict: nullable (completed)
- Overlay `params[].nullable`: `true`
- Comparison: consistent
- Proposed sentence of the Native's `notes`: A nil filter keeps every player (nullability sweep, 3.0.1.24370).

### `ForceEnumPlayersCounted` parameter `filter`

| Case                | Group | Argument    | Outcome   | Count | Message |
| ------------------- | ----- | ----------- | --------- | ----- | ------- |
| filter: always-true | (a)   | always-true | completed | 1     |         |
| filter: nil         | (a)   | nil         | completed | 1     |         |
| filter: live        | (a)   | live        | completed | 0     |         |

- Verdict: nullable (completed)
- Overlay `params[].nullable`: `true`
- Comparison: consistent
- Proposed sentence of the Native's `notes`: A nil filter keeps every player (nullability sweep, 3.0.1.24370).

### `ForceEnumAllies` parameter `filter`

| Case                | Group | Argument    | Outcome   | Count | Message |
| ------------------- | ----- | ----------- | --------- | ----- | ------- |
| filter: always-true | (a)   | always-true | completed | 1     |         |
| filter: nil         | (a)   | nil         | completed | 1     |         |
| filter: live        | (a)   | live        | completed | 0     |         |

- Verdict: nullable (completed)
- Overlay `params[].nullable`: `true`
- Comparison: consistent
- Proposed sentence of the Native's `notes`: A nil filter keeps every player (nullability sweep, 3.0.1.24370).

### `ForceEnumEnemies` parameter `filter`

| Case                | Group | Argument    | Outcome   | Count | Message |
| ------------------- | ----- | ----------- | --------- | ----- | ------- |
| filter: always-true | (a)   | always-true | completed | 0     |         |
| filter: nil         | (a)   | nil         | completed | 0     |         |
| filter: live        | (a)   | live        | completed | 0     |         |

- Verdict: nullable (completed)
- Overlay `params[].nullable`: `true`
- Comparison: consistent
- Proposed sentence of the Native's `notes`: A nil filter is accepted (nullability sweep, 3.0.1.24370).

### `EnumDestructablesInRect` parameter `filter`

| Case                | Group | Argument    | Outcome   | Count | Message |
| ------------------- | ----- | ----------- | --------- | ----- | ------- |
| filter: always-true | (a)   | always-true | completed | 2     |         |
| filter: nil         | (a)   | nil         | completed | 2     |         |
| filter: live        | (a)   | live        | completed | 1     |         |

- Verdict: nullable (completed)
- Overlay `params[].nullable`: `true`
- Comparison: consistent
- Proposed sentence of the Native's `notes`: A nil filter keeps every destructable (nullability sweep, 3.0.1.24370).

### `EnumItemsInRect` parameter `filter`

| Case                | Group | Argument    | Outcome   | Count | Message |
| ------------------- | ----- | ----------- | --------- | ----- | ------- |
| filter: always-true | (a)   | always-true | completed | 2     |         |
| filter: nil         | (a)   | nil         | completed | 2     |         |
| filter: live        | (a)   | live        | completed | 1     |         |

- Verdict: nullable (completed)
- Overlay `params[].nullable`: `true`
- Comparison: consistent
- Proposed sentence of the Native's `notes`: A nil filter keeps every item (nullability sweep, 3.0.1.24370).

## `nullability-risky`

- Probe: `nullability-risky`
- Patch: 3.0.1.24370
- Client: 3.0.1.24371
- Date: 2026-10-21
- Run: `7b87e7bd-8701-4872-bede-51396eb437a7`

### `GetExpiredTimer`

| Case                          | Group | Outcome | Id  | Type | Message                            |
| ----------------------------- | ----- | ------- | --- | ---- | ---------------------------------- |
| outside its event             | (a)   | crashed |     |      | skipped: crashed in an earlier run |
| callback of a destroyed timer | (a)   | nil     |     |      |                                    |

- Family: `event-response`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Crashed the game in a case of the nullability sweep (outside its event) on 3.0.1.24370. Returned nothing in a case of the nullability sweep (callback of a destroyed timer) on 3.0.1.24370.

### `BlzCreateFrameByType`

| Case                                                | Group | Outcome | Id      | Type                            | Message                            |
| --------------------------------------------------- | ----- | ------- | ------- | ------------------------------- | ---------------------------------- |
| typical arguments                                   | (a)   | handle  | 1048784 | `framehandle: 0000025448FD35E0` |                                    |
| typeName: empty string                              | (a)   | nil     |         |                                 |                                    |
| typeName: unknown name                              | (a)   | nil     |         |                                 |                                    |
| name: empty string                                  | (a)   | handle  | 1048785 | `framehandle: 00000255020B7F60` |                                    |
| name: unknown name                                  | (a)   | handle  | 1048786 | `framehandle: 00000255020BBFE0` |                                    |
| inherits: unknown name                              | (a)   | handle  | 1048787 | `framehandle: 00000255020C0840` |                                    |
| createContext: negative                             | (a)   | handle  | 1048788 | `framehandle: 00000255020C5390` |                                    |
| createContext: outside the world                    | (a)   | handle  | 1048789 | `framehandle: 00000255020CA370` |                                    |
| createContext: 2147483647                           | (a)   | handle  | 1048790 | `framehandle: 00000255020CF4C0` |                                    |
| typeName: BACKDROP without its FDF fields           | (a)   | handle  | 1048791 | `framehandle: 00000255020D1B40` |                                    |
| typeName: TEXTAREA without its FDF fields           | (a)   | handle  | 1048792 | `framehandle: 00000254FB702730` |                                    |
| typeName: SIMPLEMESSAGEFRAME without its FDF fields | (a)   | crashed |         |                                 | skipped: crashed in an earlier run |
| typeName: DIALOG without its FDF fields             | (a)   | handle  | 1048793 | `framehandle: 00000254494D3DE0` |                                    |
| typeName: CONTROL without its FDF fields            | (a)   | crashed |         |                                 | skipped: crashed in an earlier run |
| owner: destroyed frame                              | (b)   | handle  | 1048794 | `framehandle: 00000255020D1580` |                                    |

- Family: `constructor`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Crashed the game in 2 cases of the nullability sweep (typeName: SIMPLEMESSAGEFRAME without its FDF fields, typeName: CONTROL without its FDF fields) on 3.0.1.24370. Returned nothing in 2 cases of the nullability sweep (typeName: empty string, typeName: unknown name) on 3.0.1.24370.

### `BlzFrameGetChild`

| Case               | Group | Outcome | Id  | Type | Message |
| ------------------ | ----- | ------- | --- | ---- | ------- |
| index out of range | (a)   | nil     |     |      |         |

- Family: `lookup`
- Verdict: nullable (proved)
- Overlay `returns.nullable`: `true`
- Comparison: consistent
- Proposed `notes`: Returned nothing in a case of the nullability sweep (index out of range) on 3.0.1.24370.
