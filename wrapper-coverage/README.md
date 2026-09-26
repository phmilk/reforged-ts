# Wrapper coverage report

The coverage rule of ADR 0008 as a command: which common.j Natives each Wrapper owns, and which of them the library covers, excludes or misses. Private to the workspace, never published.

```sh
pnpm coverage:report
```

It reads the manifest of the library's Patch (`packages/reforged-types/<Game version>/manifest.json`), scans the library sources (`packages/reforged-ts/src`), and writes `report.json` and `report.md` here. Exit codes: 0 nothing missing and no problem, 1 a missing Native, a problem or unreadable inputs (then nothing is written), 2 usage. Commit both files whenever a change moves coverage: `pnpm test` fails when they differ from a fresh run.

## The rule

- **Owner.** A Native is owned by the Wrapper whose handle type is the Jass type of its first parameter. A Native whose first parameter is not a handle (or that takes none) and that returns a wrapped handle type is owned by the returned type's Wrapper (`CreateTimer`, `Player`, `GetTriggerUnit`). Every other Native is unowned and outside the rule: its first parameter is a handle type no Wrapper owns (`hashtable`, `ability`), or it takes no handle first and returns no wrapped one.
- **Covered.** An owned Native is covered when any class declaration of the library calls it by its bare name, static-only classes (`Camera`, `File`) included; a call outside every class counts for none. The report names each calling class, so `CreateUnit`, owned by `MapPlayer`, shows as covered by `Unit`.
- **Excluded or missing.** An owned Native no class calls is excluded when `exclusions.json` names it, and missing otherwise.

## Configuration

`wrappers.json` lists every Wrapper, one line each: the class name, then the handle type it owns. The report fails when a class extending `Handle` is not listed, when a listed class has no declaration, or when a listed type appears nowhere in the manifest. Add the line in the same change as the Wrapper.

`exclusions.json` is an array of entries with exactly these keys, each a non-empty string:

```json
[
  {
    "native": "IsUnitInvisible",
    "reason": "What the Native does wrong, so that no member is written for it.",
    "source": "The jassdoc bug note or the probe-map measurement that shows it.",
    "date": "2026-09-25"
  }
]
```

"Not useful" is not a reason. An exclusion fails the report once any class calls the Native, when the Native is not a common.j Native of the manifest, or when no Wrapper owns it.
