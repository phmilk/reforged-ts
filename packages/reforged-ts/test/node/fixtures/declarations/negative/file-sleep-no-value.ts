// The File write methods return nothing, where they returned the class, and
// `sleep` resolves with no value, where it resolved with null.
import { File, sleep } from "reforged-ts";

// eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- Negative: the method returns nothing, which the line proves
export const written: typeof File = File.write("save.txt", "contents"); // error TS2322

// eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- Negative: the method returns nothing, which the line proves
export const writtenRaw: typeof File = File.writeRaw("raw.txt", "contents"); // error TS2322

export const slept: Promise<null> = sleep(1); // error TS2322
