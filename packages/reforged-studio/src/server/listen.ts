/**
 * Where the Studio listens: the loopback interface `127.0.0.1` only, on its
 * port when free, else the next free one.
 */
import type http from "node:http";

/** The Studio's port when free: 5476. */
export const DEFAULT_PORT = 5476;

/** The loopback address the server binds, and no other. */
export const LOOPBACK = "127.0.0.1";

/** How many ports above the first are tried before giving up. */
const PORTS_TRIED = 100;

/** Listens on one port, or rejects with the server's error. */
function listenOn(server: http.Server, port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const failed = (error: Error) => {
      server.off("listening", listening);
      reject(error);
    };
    const listening = () => {
      server.off("error", failed);
      const address = server.address();
      resolve(
        typeof address === "object" && address !== null ? address.port : port,
      );
    };
    server.once("error", failed);
    server.once("listening", listening);
    server.listen(port, LOOPBACK);
  });
}

/**
 * Listens on the loopback interface, on `port` when free, else on the next
 * free port above it; port 0 takes any free one.
 *
 * @param server - The server.
 * @param port - The first port to try.
 * @returns The port it listens on.
 * @throws Error When none of the ports tried is free.
 */
export async function listen(
  server: http.Server,
  port: number,
): Promise<number> {
  for (let next = port; ; next++) {
    try {
      return await listenOn(server, next);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (port === 0 || code !== "EADDRINUSE" || next - port >= PORTS_TRIED) {
        throw error;
      }
    }
  }
}
