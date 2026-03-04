import { AuthenticationFunction } from "./configuration.types";
import { Authentication } from "./routes.types";
import { Params } from "./params.types";

/**
 * Base type for all stream events emitted over Server-Sent Events.
 *
 * StreamEvent is to SSE as ResponseData is to JSON responses.
 * ResponseData has `typeName` for self-describing responses.
 * StreamEvent has `eventName` for self-describing events.
 *
 * Unlike Authentication/RequestBody, StreamEvent has NO brand type marker.
 * Brands prove validation of untrusted input. Stream events are
 * developer-constructed output — structural `eventName` discriminant suffices.
 *
 * @example
 * type ChatEvents =
 *   | StreamEvent<"token", { text: string }>
 *   | StreamEvent<"done", { totalTokens: number }>;
 */
export type StreamEvent<EventName extends string = string, Payload = unknown> = {
  readonly eventName: EventName;
  readonly data: Payload;
};

/**
 * Factory function for creating typed stream events.
 *
 * Analogous to authWrapper() — constructs a properly typed StreamEvent
 * without requiring manual type annotation at each yield site.
 *
 * @example
 * yield streamEvent("token", { text: "hello" });
 * yield streamEvent("done", { totalTokens: 42 });
 */
export function streamEvent<E extends string, D>(eventName: E, data: D): StreamEvent<E, D> {
  return { eventName, data };
}

/**
 * Open stream routes are completely public — no authentication required.
 *
 * Handler receives: (params: { url, query, signal })
 * Handler returns: AsyncIterable<Events> (generators satisfy this interface)
 *
 * SSE is GET-only — no body validation. Only open and authenticated variants.
 * AbortSignal is provided for cooperative cancellation when clients disconnect.
 *
 * @example
 * const statusStream = api.createEndpoint("/api/status/live").stream({
 *   handler: async function* ({ signal }) {
 *     yield streamEvent("status", { state: "streaming" as const });
 *   },
 * });
 */
export type StreamOpenRoute<
  Path extends string,
  Events extends StreamEvent,
  Query extends unknown | undefined = undefined,
> = {
  type: "stream-open";
  path: Path;
  method: "GET";
  validator?: never;
  authenticator?: never;
  handler: (params: {
    url: Params<Path>;
    query: Query;
    signal: AbortSignal;
  }) => AsyncIterable<Events>;
};

/**
 * Authenticated stream routes require authentication before streaming.
 *
 * Handler receives: (params: { url, query, signal }, auth)
 * Handler returns: AsyncIterable<Events>
 *
 * @example
 * const userStream = api.createEndpoint("/api/chat/:sessionId").stream({
 *   authenticator: auth,
 *   handler: async function* ({ url, signal }, auth) {
 *     yield streamEvent("token", { text: `Hello ${auth.userId}` });
 *   },
 * });
 */
export type StreamAuthenticatedRoute<
  Path extends string,
  Events extends StreamEvent,
  Auth extends Authentication,
  Query extends unknown | undefined = undefined,
> = {
  type: "stream-authenticated";
  path: Path;
  method: "GET";
  validator?: never;
  authenticator: AuthenticationFunction<Auth>;
  handler: (
    params: { url: Params<Path>; query: Query; signal: AbortSignal },
    auth: Auth
  ) => AsyncIterable<Events>;
};
