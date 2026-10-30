/**
 * The Studio's one event stream, `GET /api/events`: Server-Sent Events,
 * which a browser tab and a VS Code webview both read with `EventSource`.
 */
import type http from "node:http";
import type { StudioEvents } from "./api-types.js";

/** The open streams, to send each event to all. */
export class EventStreams {
  readonly #streams = new Set<http.ServerResponse>();

  /**
   * Opens a stream on a response, and sends it its first event.
   *
   * @param response - The response of a `GET /api/events`.
   * @param first - The `session` event's data.
   */
  open(response: http.ServerResponse, first: StudioEvents["session"]): void {
    response.writeHead(200, {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store",
      connection: "keep-alive",
    });
    this.#streams.add(response);
    response.on("close", () => {
      this.#streams.delete(response);
    });
    this.#write(response, "session", first);
  }

  /**
   * Sends an event to every open stream.
   *
   * @param event - The event's name.
   * @param data - Its data.
   */
  send<Name extends keyof StudioEvents>(
    event: Name,
    data: StudioEvents[Name],
  ): void {
    for (const response of this.#streams) this.#write(response, event, data);
  }

  /** Ends every open stream. */
  close(): void {
    for (const response of this.#streams) response.end();
    this.#streams.clear();
  }

  #write(response: http.ServerResponse, event: string, data: unknown): void {
    response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }
}
