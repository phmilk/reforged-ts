// A file written to the CustomMapData folder of this client's disk, then read
// back. Every client writes and reads its own copy.
import { File, Init } from "reforged-ts";

Init.onGameStart(() => {
  File.write("data.txt", "Hello world!");
  const contents = File.read("data.txt");
  if (contents !== undefined) {
    print(contents);
  }
});
