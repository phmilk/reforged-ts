# Variable: DialogEvents

> `const` **DialogEvents**: [`EventDescriptors`](../type-aliases/EventDescriptors.md)\<\{ `buttonClick`: \{ `read`: (`event`) => [`DialogClick`](../interfaces/DialogClick.md); `register`: (`trigger`, `button`) => `void`; \}; `click`: \{ `read`: (`event`) => [`DialogClick`](../interfaces/DialogClick.md); `register`: (`trigger`, `dialog`) => `void`; \}; \}\>

Defined in: [events/dialog.ts:33](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/dialog.ts#L33)

The dialog Event descriptors: `DialogEvents.click(dialog)` for any button
of one Dialog, `DialogEvents.buttonClick(button)` for one DialogButton.
Their payload, a [DialogClick](../interfaces/DialogClick.md), always holds the dialog and the
button.
