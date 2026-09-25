/** @noSelfInFile */

/**
 * A system which provides the ability to read and write files. There are no standard IO natives
 * so this system relies on an exploit which ended up being sanctioned by Blizzard, and because of this
 * there are some caveats.
 *
 * - All files are confined to the `Documents\Warcraft III\CustomMapData` folder.
 * - The only allowed file extensions are `.txt` and `.pld`.
 * - Generated files contain boilerplate JASS code.
 * - You cannot delete files but you can empty their contents.
 *
 * How a file is written and read back: `File.write` passes the contents to
 * `Preload` in chunks of at most 259 bytes, between an opening and a closing
 * piece of Lua user code. Running the file with `Preloader` collects the
 * chunks and sets the icon of one ability (`Amls`) to them, and `File.read`
 * reads that icon and puts the original back.
 *
 * The escape contract: each chunk sits inside a double-quoted string literal
 * of the generated file, so a double quote in the contents is written as the
 * escape character (byte 27) followed by `q`, and the escape character itself
 * as two escape characters. `File.read` undoes both in one pass, so any
 * contents made of these characters, backslashes included (`Preload` escapes
 * those itself), read back unchanged. `File.writeRaw` without reading escapes
 * nothing.
 *
 * Unspecified until verified in game:
 * - Contents holding a newline: whether the line break survives the generated
 *   file.
 * - Contents equal to the ability's icon path: `File.read` returns
 *   `undefined` for them, because the icon did not change, and whether a read
 *   can tell them from a missing file is not known.
 *
 * `File` stays a class of static members: it drives one facility of the
 * whole game, the Preload generator and one ability's icon, so it has no
 * state per object, and `File.read` and `File.write` keep their w3ts names.
 * @example
 * ```ts
 * // Write to the file
 * File.write("data.txt", "Hello world!");
 *
 * // Read its contents
 * const contents = File.read("data.txt");
 *
 * // Display the contents
 * if (contents) {
 *  print(contents);
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- File is static-only by decision (see its doc comment); step 7 (#54) settles that shape for the static namespaces together with Camera and Input
export class File {
  // The ability used to read and write data.
  private static readonly dummyAbility: number = FourCC("Amls");

  // The string limit per Preload call.
  private static readonly preloadLimit = 259;

  private constructor() {
    // nothing
  }

  /**
   * Character we use for escape sequences. Avoiding `\` since it is
   * automatically escaped by `Preload`.
   */
  private static readonly escapeCharacter = string.char(27);

  private static readonly escapedSelf =
    File.escapeCharacter + File.escapeCharacter;

  private static readonly escapedQuote = `${File.escapeCharacter}q`;

  /** What each escape sequence stands for, by the character after the escape character. */
  private static readonly unescapes: Record<string, string> = {
    q: '"',
    [File.escapeCharacter]: File.escapeCharacter,
  };

  /**
   * Escapes the double quote character, which would otherwise bork file
   * reading.
   */
  private static escape(contents: string): string {
    contents = string.gsub(contents, File.escapeCharacter, File.escapedSelf)[0];
    contents = string.gsub(contents, '"', File.escapedQuote)[0];
    return contents;
  }

  /**
   * Undoes File.escape, returning a string back to its original form. One
   * pass from left to right, so an escaped escape character followed by `q`
   * is not mistaken for an escaped quote.
   */
  private static unescape(contents: string): string {
    return string.gsub(
      contents,
      `${File.escapeCharacter}(.)`,
      File.unescapes,
    )[0];
  }

  /**
   * Read text from a file inside of the CustomMapData folder.
   * @param filename The name of the file to read.
   * @returns Returns undefined when the file could not be read.
   */
  public static read(filename: string): string | undefined {
    const originalIcon = BlzGetAbilityIcon(this.dummyAbility);
    if (originalIcon === undefined) return undefined;

    Preloader(filename);

    const preloadText = BlzGetAbilityIcon(this.dummyAbility);
    if (preloadText === undefined) return undefined;

    BlzSetAbilityIcon(this.dummyAbility, originalIcon);
    if (preloadText !== originalIcon) {
      return File.unescape(preloadText);
    }

    return undefined;
  }

  /**
   * Write text to a file with the option to not include boilerplate for reading the file back.
   * @param filename The name of the file to write to. Supported extensions are `.txt` and `.pld`.
   * @param contents The contents to write to the file.
   * @param allowReading If set to true, boilerplate code will be included for reading the file with `File.read`.
   */
  public static writeRaw(
    filename: string,
    contents: string,
    allowReading = false,
  ): void {
    PreloadGenClear();
    PreloadGenStart();

    if (allowReading) {
      Preload(
        `")\n//! beginusercode\nlocal o=''\nPreload=function(s)o=o..s end\nPreloadEnd=function()end\n//!endusercode\n//`,
      );
      contents = File.escape(contents);
    }

    const chunks = math.ceil(contents.length / File.preloadLimit);
    for (let chunk = 0; chunk < chunks; chunk++) {
      const start = chunk * File.preloadLimit;
      Preload(string.sub(contents, start + 1, start + File.preloadLimit));
    }

    if (allowReading) {
      Preload(
        `")\n//! beginusercode\nBlzSetAbilityIcon(${String(this.dummyAbility)},o)\n//!endusercode\n//`,
      );
    }

    PreloadGenEnd(filename);
  }

  /**
   * Write text to a file inside. All files are placed within the CustomMapData folder.
   * @param filename The name of the file to write to. Supported extensions are `.txt` and `.pld`.
   * @param contents The contents to write to the file.
   */
  public static write(filename: string, contents: string): void {
    this.writeRaw(filename, contents, true);
  }
}
