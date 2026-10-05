// PROTOTYPE (#476), throwaway: serves objects.prototype.html at every path, so
// /objects/<rawcode>?variant=A behaves like the Studio's real route. No data
// is read or written; everything lives in the page's memory.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const page = new URL("./objects.prototype.html", import.meta.url);
const port = Number(process.env.PORT ?? 5476);

createServer((request, response) => {
  if (request.url === "/favicon.ico") {
    response.writeHead(204).end();
    return;
  }
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(readFileSync(page));
}).listen(port, () => {
  console.log(`Studio prototype (#476): http://localhost:${port}/objects/h000?variant=A`);
  console.log("Variants: A (Object Editor layout), B (Spreadsheet), C (Search and pages)");
});
