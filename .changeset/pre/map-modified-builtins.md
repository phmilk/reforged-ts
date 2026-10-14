---
"reforged-map": minor
---

`generateObjects` writes a `FourCC` overload for each Built-in object the map modifies. Its TSDoc gives the game's name and the map's: "Footman (`hfoo`), a Built-in unit of Patch 3.0.0, named Militia in this map". The overload names the object's `reforged-builtins` constant, and the object gets no Custom constant. With the overloads of `reforged-builtins` turned on, the map's overload wins. A Rawcode two kinds share, such as a Custom buff and a Custom destructable at `B000`, gets no overload: `FourCC("B000")` stays an `UnknownRawcode`, and each kind keeps its constant with its exact kind. A Custom Rawcode equal to a Built-in object's is read as the map's Custom object, with a warning.
