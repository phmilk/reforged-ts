---
title: The Studio
sidebar_position: 16
description: Edit a map's Object data in the Studio, the local app of reforged-studio, opened with pnpm studio, finding objects by kind, name or Rawcode, editing fields inline or in bulk, saving with an undo across the session, taking turns with the World Editor without losing an edit, Object definitions shown read-only and adopted into code, and icons and model previews read from the game's install.
---

# The Studio

The **Studio** is the Toolchain's local app: a page in the browser, served from the Map project's own installation, that edits the map's Object data (its units, items, abilities, buffs, destructables, doodads and upgrades). It has the layout of the World Editor's Object Editor, with a search across the seven Object kinds, a table for bulk edits, icons and live model previews read from the game's install, an explicit save, an undo across the whole session and a diff of what a save writes. It comes with [`reforged-studio`](https://github.com/phmilk/reforged-ts/tree/master/packages/reforged-studio), whose README gives every detail this page leaves out, its API for another host among them.

The Studio edits the map folder, as the World Editor does, and never a copy: the decision behind it is [ADR 0015](https://github.com/phmilk/reforged-ts/blob/master/docs/adr/0015-map-folder-owns-object-data-and-any-faithful-editor-may-edit-it.md), under which the map folder owns the map's Object data and any faithful editor may edit it. Every read and every write is `reforged-map`'s, in the Editor form the 3.0 World Editor saves, so a World Editor save after the Studio's leaves its edits where they are. Terrain, placed units, triggers and the map's options stay the World Editor's.

:::note[In the Template]
A Map project gets `pnpm studio` once the Template takes the package up ([phmilk/reforged-ts-template#145](https://github.com/phmilk/reforged-ts-template/issues/145)). Until then, a Map project installs it with `pnpm add -D reforged-studio@next` beside `reforged-map`, and runs its command:

```sh
pnpm exec reforged-studio --map my-map.w3m
```

:::

## Opening it

`pnpm studio` starts the Studio on the Map project's map folder and opens `http://localhost:5476/objects` in the browser. It finds the map folder, the game and the World Editor as `pnpm test:map` and `pnpm objects:sync` do: the map folder of `reforged.config.ts`, the game `WC3_EXECUTABLE` names, else the Battle.net app's default folders. It needs the game installed: the fields, their base values, the icons and the models are read from the install, never from the internet. Without one, it stops with one line naming the setting to fix.

- **The port.** 5476 when it is free, else the next free one; the command prints the URL it took. Ctrl+C stops it.
- **Only your machine.** The Studio listens on the loopback interface, and answers only its own page: a web page you visit cannot read or edit your map through it.
- **One Studio per map folder.** A second `pnpm studio` on the same map folder opens the first one's page instead of starting another.
- **From code.** While the Studio runs, the hover of a Rawcode in the editor links to its object, "Open in the Studio" ([Rawcodes](rawcodes.md#hover-and-go-to-definition-on-a-rawcode-literal)); with no Studio running, it says that `pnpm studio` opens the object. The link is `/objects/<rawcode>`, with `?kind=` when the Rawcode names one kind.

## Finding an object

The page has one tab per Object kind, each with the tree of its objects: the map's Custom objects first, then its Object definitions, the Built-in objects it modifies, and the Built-in objects grouped as the World Editor groups them (race, Melee or Campaign, then Units, Buildings, Heroes or Special for a unit). Each object shows its icon and chips for its origin.

- **The search**, Ctrl+K, finds an object by name or Rawcode across the seven kinds.
- **The map's Game data set** is named at the top. The Built-in objects outside it are hidden, and a toggle shows them, marked.
- **A Rawcode two kinds share**, such as a Custom buff and a Custom destructable both at `B000`, opens a page that asks which object, since `FourCC` gives it no single kind.
- **An unknown Rawcode** shows "neither in this map nor Built-in", with the Rawcodes one edit away, the same suggestions as [the lint rule](rawcodes.md#unknown-rawcodes-the-lint-rule), and "Create with this Rawcode".

The object's page shows its header, a "Differs from &lt;base&gt;" section with each modified field and its base's value, and its field table: each field's label, id, the value as the World Editor shows it and the raw value the file holds. A field of levels groups its rows, collapsible. Compare pins other objects of the kind as extra columns, and a toggle hides the fields at their base's value.

## Editing

A click on a value edits it by its type: a number or a text, committed on Enter; an enumeration as a select; a toggle; a list of Rawcodes as chips with an input that adds one; an icon with its picker. A value the writer refuses shows its reason on the field, and nothing changes. A field an unsaved edit changed is highlighted more strongly than a modified one, with a bar, and the counter at the top counts the unsaved changes.

- **Reset**, ↺, puts a field back to its base's value; "Reset to base" does it for a whole Custom object, and "Reset to the Built-in object" for a modified one.
- **The Table mode**, beside the tabs, shows one row per object and one column per field, the map's objects and the columns they change first. A cell edits as the field table does. "Fill…" on a column, or "Edit a field…" on objects Ctrl+clicked in the tree, sets, adds to, multiplies or resets one field on all of them at once.
- **New object** bases one on a Built-in object or copies a Custom object with its modifications. Its Rawcode is suggested as the World Editor would (the base's first letter and the lowest free number), free across the seven kinds, the Built-in objects, the Rawcodes the Object manifest records as removed and the placements on the terrain; typing another checks it live and names what holds a taken one.
- **Delete**, on a Custom object only, asks first: its confirmation lists the objects whose fields name it and how many times it is placed on the terrain. The Studio never edits the terrain: those placements stay, the game skips them, and the World Editor drops them at its next save.

## Saving

Nothing is written before a save. Ctrl+S, or Save, writes the unsaved edits to the map folder, and its message says what was written. Undo and Redo (Ctrl+Z, Ctrl+Shift+Z or Ctrl+Y) span the whole session, saves included: an undo after a save makes the map unsaved again, so no edit is final until the Studio closes. The undo is never kept on disk.

Diff shows the unsaved changes as text, the text `git diff` shows for the map's Object data files, every change since the last commit, or what the last change on disk brought.

## Taking turns with the World Editor

The World Editor keeps the map it loaded in memory, and its next save writes all of it back. The Studio takes turns with it so that neither loses the other's edits in silence:

1. **A save waits for the World Editor's unsaved edits.** While the World Editor's window shows unsaved edits for the map folder, the Studio refuses to save, keeping every edit: save or discard them in the World Editor first.
2. **After a save, the World Editor reloads.** When the World Editor holds the map folder without unsaved edits, the save's message offers "Reload in the World Editor", so that its next save keeps what the Studio wrote. A setting makes the reload follow every save. The reload closes the map in the World Editor (File, Close Map), then opens it again, and the message says whether the World Editor did: when it did not, close the map there and open it again yourself.
3. **A change on disk reloads the Studio.** With no unsaved edit, the Studio reads the map folder again when a file changes, and says so in a banner whose "Show what changed" opens Diff on what the change brought, committed or not. With unsaved edits, a banner offers "Reload and keep my edits on top": each edit is applied again on the new map folder, and a field both sides changed is a conflict, listed with your value and the map folder's to choose. Nothing is dropped without a choice, and a save waits until each conflict has one.
4. **A stale World Editor's save is caught.** A World Editor that missed the reload and saves its old copy puts back fields the Studio had saved, even after several Studio saves it never loaded. The Studio names them, and offers "Apply them again" (as unsaved edits), "Show" or "Keep the World Editor's".

The Studio holds no file of the map folder open beyond one read or write, so a World Editor save while it runs never fails on a locked file.

## Object definitions and adoption

An object defined in code ([Object definitions](object-definitions.md)) shows in the tree with a lock and its file, read-only: the Studio never writes an object the code owns, and its fields refuse an edit with a message naming the file. "Open in editor" opens the definition at its line, in VS Code when `code` is on the `PATH`, else in `$VISUAL` or `$EDITOR`.

"Adopt into code", on a Custom object or a modified Built-in object, moves it into code as [`pnpm objects:adopt`](object-definitions.md#adoption-moving-an-object-into-code) does: it writes the object's definition file and its entry in the Object manifest, and leaves the map folder as it was. It is refused while the Studio or the World Editor holds unsaved edits, since it adopts the object as the map folder holds it on disk: save first. The object then shows as an Object definition. Handing an object back stays `pnpm objects:release`.

## Previews

Icons show in the tree, the header and every icon field, read from the game's install, or from the map folder for an imported one. Every model field shows a thumbnail of its model; a click opens its live preview, animated and in team colour. The model picker searches the install's and the map's models by path, with a preview of the one highlighted.

The header's switch chooses the art layer the icons and previews are read in, SD, HD or DE as the map's Supported Modes allow; it starts on the World Editor's Asset Mode. The previews have limits the package's README lists: HD models are lit more simply than in the game, and PopcornFX particles, most HD spell effects among them, are not drawn. The thumbnails are kept in a cache on your machine, drawn from your own install and never shipped; deleting the cache only means they are drawn again.
