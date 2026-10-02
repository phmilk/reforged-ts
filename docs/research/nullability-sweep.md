# Nullability sweep

The [Nullability sweep](../../CONTEXT.md)'s report: one section per Slice, written by `pnpm probe:nullability-report <probe>` from the Result file of the Slice's last Probe run, and replaced, alone, each time the command runs again. Each Native gets a verdict from its cases, compared with the Overlay's `returns.nullable`, and a proposed `notes` text. The command never writes the Overlay: every change to it goes through review.

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
