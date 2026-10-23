---
"reforged-builtins": minor
"reforged-map": patch
---

reforged-builtins: format 2 of the field table and its declarations. The field table of Game version 3.0.1 now gives each field its metadata type (`metaType`) and its category for Object definitions (`number`, `boolean`, `text`, `enumeration`, `rawcode`, `rawcodeList`, `stringList`, with `of` naming the kind of a Rawcode), and lists each enumeration with its raw values (`enumerations`); a metadata type the generator does not map takes its value type's category. The new `reforged-builtins/fields` entry declares each Object kind's fields by field id, each with its enUS label, metadata name, value type, levels, file and specific bases on hover. 3.0.0 keeps format 1. reforged-map reads field tables of format 1 and 2 for its Object data writer; a tool that reads `fields.json` itself should accept format 2, whose format 1 facts are unchanged.
