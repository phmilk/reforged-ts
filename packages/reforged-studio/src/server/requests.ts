/**
 * The Studio's request rules: it answers only a request whose `Host` names
 * it, `localhost:<port>` or `127.0.0.1:<port>`, against DNS rebinding; and
 * accepts a write, any method but `GET`, only with an `Origin` of its own,
 * against a page elsewhere posting to it. The server listens on the
 * loopback interface alone (`./listen.ts`).
 */
import type http from "node:http";

/** The hosts the Studio answers on a port. */
const hostsOf = (port: number): string[] => [
  `localhost:${String(port)}`,
  `127.0.0.1:${String(port)}`,
];

/** Why a request is refused: the API's reason and its message. */
export interface Refusal {
  readonly reason: "forbidden-host" | "forbidden-origin";
  readonly message: string;
}

/**
 * Checks a request against the rules.
 *
 * @param request - The request.
 * @param port - The port the Studio listens on.
 * @returns Why it is refused, or undefined when it is answered.
 */
export function refusal(
  request: http.IncomingMessage,
  port: number,
): Refusal | undefined {
  const hosts = hostsOf(port);
  const host = request.headers.host ?? "";
  if (!hosts.includes(host.toLowerCase())) {
    return {
      reason: "forbidden-host",
      message: `The Studio answers only the Host ${hosts.join(" or ")}.`,
    };
  }
  if (request.method !== "GET") {
    const origin = request.headers.origin ?? "";
    if (!hosts.some((own) => origin.toLowerCase() === `http://${own}`)) {
      return {
        reason: "forbidden-origin",
        message: `The Studio accepts a ${request.method ?? "write"} only from its own page, http://${hosts[0] ?? ""}.`,
      };
    }
  }
  return undefined;
}
