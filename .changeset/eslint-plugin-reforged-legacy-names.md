---
"eslint-plugin-reforged": minor
---

**`no-legacy-w3ts-names`** (error). Reports the w3ts 3.x names reforged-ts renamed or removed, from the rename map the library publishes (`reforged-ts/migration/renames.json`): an import from `w3ts`, an imported export, a member or static access on a library class (matched through the type checker, so a project class of the same name is not reported), and a `new` of a library class. The message gives the replacement and the entry's note; a removed symbol reads as removed. One-to-one entries are fixed: the package name in imports, `new Unit(...)` to `Unit.create(...)`, and same-signature member renames, importing the class when the receiver changes. The other renames are suggestions, one per replacement.

**Optional packages.** The plugin reads the data files of `reforged-ts` (and later `reforged-types`) from the Map project's own installation, found from the project root: the working directory, or `createPlugin({ projectRoot })`. When the package is missing, the plugin prints one warning at load naming the package and the rules, and registers those rules disabled. A file present with an unexpected shape throws a `DataFileError` naming the field.
