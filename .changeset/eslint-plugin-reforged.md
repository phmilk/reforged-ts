---
"eslint-plugin-reforged": minor
---

The lint layer of the Guards, first rule.

**The plugin.** `eslint-plugin-reforged` exports the plugin object (`meta`, `rules`, `configs`). A Map project enables every rule by spreading `configs.recommended` after typescript-eslint's type-checked presets; the config registers the plugin as `reforged` and sets no parser and no project options. Every rule's `meta.docs.url` points to `https://phmilk.github.io/reforged-ts/<docs version>/lint/<rule>`, and one page per rule ships in `docs/`.

**`no-unsafe-natives`** (error). Reports a call to a Native on the plugin's ban list, `data/unsafe-natives.json`: `TriggerSleepAction`, `PolledWait`, `DestroyEffectAfterTimeBJ`, `CreateTimerBJ`, `StartTimerBJ`, `GetLastCreatedTimerBJ`, `SelectGroupForPlayerBJ` and `SmartCameraPanBJ`. The message gives the entry's reason and replacement. The callee must resolve, through the type checker, to the Native declared in `reforged-types`: a project function of the same name is not reported. Option `allow` removes entries for a project. A ban list with an unexpected shape throws at plugin load, naming the field.
