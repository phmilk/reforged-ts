/**
 * The label of a docs version URL of this site, as the compatibility matrix
 * writes it (`https://phmilk.github.io/reforged-ts/docs/1.0`, from
 * docs/release.md, "The docs version URL"), or undefined for any other URL.
 */
export function docsVersionLabel(
  href: string,
  site: { readonly url: string; readonly baseUrl: string },
): string | undefined {
  const prefix = `${site.url}${site.baseUrl}docs/`;
  if (!href.startsWith(prefix)) return undefined;
  const label = href.slice(prefix.length);
  return /^\d+\.\d+$/.test(label) ? label : undefined;
}
