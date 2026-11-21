---
"reforged-studio": patch
---

A tab of another Object kind shows its own kind on the right: the object last open in that kind, else "Choose an object." (also when an undo or a World Editor save removed that object since), and the URL matches it (`/objects/<rawcode>?kind=<kind>`, or `/objects?kind=<kind>` with no object open). It no longer keeps the object of the last kind beside the tree of the new one, and the browser's Back goes through the tabs as they were shown, back to the Units tab at `/objects`.
