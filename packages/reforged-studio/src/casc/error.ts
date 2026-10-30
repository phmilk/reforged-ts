/**
 * What the CASC reader throws: a storage it cannot read, a file it cannot
 * find or decode. The message names the path, in the storage or on disk.
 */
export class CascError extends Error {
  override name = "CascError";
}
