/** @noSelfInFile */

// Stand-ins for the game's constants that the stubs do not define: the field
// constants (whose handle type the field members read from `tostring`) and
// the likes of `RACE_HUMAN`. The call log renders each by its name.

/** A value whose `tostring` is `text`, rendered in the call log by `name`. */
export function withText(text: string, name: string): handle {
  return setmetatable(
    { __name: name },
    {
      __tostring(this: unknown): string {
        return text;
      },
    },
  ) as unknown as handle;
}

/** A field constant of `kind`, whose `tostring` begins as the game's does. */
export function fieldConstant(kind: string, name: string): handle {
  return withText(`${kind}: 0000ABCD`, name);
}
