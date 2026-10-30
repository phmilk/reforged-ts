/**
 * The Studio's page: the static files its build writes to `dist/page/`,
 * served as they are. `/objects` and every path under it are the page's
 * `index.html`, which reads its route from the path; its assets are under
 * `/assets/`. The Content-Security-Policy keeps it to its own origin, so
 * that it fetches nothing from a CDN.
 */
import fs from "node:fs";
import type http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** The headers every page answer carries. */
export const PAGE_HEADERS = {
  "content-security-policy":
    "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'",
  "x-content-type-options": "nosniff",
} as const;

const TYPES: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
  ".woff2": "font/woff2",
};

/** The package's root: the nearest folder above this module that holds package.json. */
function packageRoot(): string {
  for (
    let folder = path.dirname(fileURLToPath(import.meta.url));
    ;
    folder = path.dirname(folder)
  ) {
    if (fs.existsSync(path.join(folder, "package.json"))) return folder;
    if (path.dirname(folder) === folder) return folder;
  }
}

/** The folder of the built page. */
export const PAGE_FOLDER = path.join(packageRoot(), "dist", "page");

/**
 * Answers a request for the page or one of its files: 404 for a file it
 * does not have, 503 when the page was not built.
 *
 * @param pathname - The request's path.
 * @param response - Its response.
 */
export function servePage(
  pathname: string,
  response: http.ServerResponse,
): void {
  const index = path.join(PAGE_FOLDER, "index.html");
  const file =
    pathname === "/objects" || pathname.startsWith("/objects/")
      ? index
      : path.join(PAGE_FOLDER, path.normalize(decodeURIComponent(pathname)));
  if (!file.startsWith(PAGE_FOLDER + path.sep)) {
    response.writeHead(404, PAGE_HEADERS).end();
    return;
  }
  let bytes: Buffer;
  try {
    bytes = fs.readFileSync(file);
  } catch {
    const built = fs.existsSync(index);
    response
      .writeHead(built ? 404 : 503, {
        ...PAGE_HEADERS,
        "content-type": "text/plain; charset=utf-8",
      })
      .end(
        built
          ? "Not found."
          : "The Studio's page is not built: run the build of reforged-studio.",
      );
    return;
  }
  response
    .writeHead(200, {
      ...PAGE_HEADERS,
      "content-type": TYPES[path.extname(file)] ?? "application/octet-stream",
      "cache-control": file === index ? "no-store" : "max-age=3600",
    })
    .end(bytes);
}
