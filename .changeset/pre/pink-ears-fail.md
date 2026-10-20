---
"reforged-builtins": minor
---

Ship the field table of each Game version, `3.0.0/fields.json`: per Object kind its label in the World Editor's `war3map.wts` comments, and per field of its metadata the value type, the file it goes in (base or Skin), whether it is localizable, its levels and data column, the base Rawcodes it is specific to, and its enUS label. A tool that writes Object data, such as `reforged-map`'s writer, reads it to write an edit as the World Editor does. It holds no tooltip text, numbers or icons.
