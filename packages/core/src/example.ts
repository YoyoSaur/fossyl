import { createRouter } from "./router/router";
import { authWrapper } from "./router/types/routes.types";
import { streamEvent } from "./router/types/stream.types";
import type { StreamEvent } from "./router/types/stream.types";

const authenticationMiddleware = async (headers: Record<string, string>) => {
  // Simulate async auth (e.g., OAuth, database lookup, JWT verification)
  return authWrapper({
    status: headers.authorization,
  });
};

const baseRouter = createRouter("/status");
const endpoint = baseRouter.createEndpoint("/status");

const _getter = endpoint.get({
  authenticator: authenticationMiddleware,
  handler: async (_params, _auth) => {
    return {
      typeName: "StatusResponse" as const,
      status: "ok",
    };
  },
});

const _poster = endpoint.post({
  validator: (): { a: string } => ({ a: "hello" }),
  queryValidator: (): { b: string } => ({ b: "OKAY" }),
  handler: async (_params, _body) => {
    return {
      typeName: "StatusResponse" as const,
      status: "ok",
    };
  },
});

// ============================================================
// SSE Stream Route Examples — proving AI can handle type theory
// ============================================================

// Event vocabulary for a live AI chat endpoint (type-level demonstration)
type _ChatEvents =
  | StreamEvent<"token", { text: string }>
  | StreamEvent<"status", { state: "thinking" | "streaming" | "done" }>
  | StreamEvent<"usage", { promptTokens: number; completionTokens: number }>;

// 1. Open stream route — public status feed (no auth, no query)
const _statusStream = baseRouter.createEndpoint("/status/live").stream({
  handler: async function* ({ signal: _signal }) {
    yield streamEvent("status", { state: "streaming" as const });
    yield streamEvent("token", { text: "hello" });
    yield streamEvent("usage", { promptTokens: 10, completionTokens: 5 });
  },
});

// 2. Authenticated stream route — user-specific events (with URL params)
const chatRouter = createRouter("/chat");
const _chatStream = chatRouter.createEndpoint("/chat/:sessionId").stream({
  authenticator: authenticationMiddleware,
  handler: async function* ({ url, signal: _signal }, _auth) {
    yield streamEvent("status", { state: "thinking" as const });
    yield streamEvent("token", { text: `Session: ${url.sessionId}` });
    yield streamEvent("status", { state: "done" as const });
  },
});

// 3. Stream route with query parameters
const eventsRouter = createRouter("/events");
const _filteredStream = eventsRouter.createEndpoint("/events/stream").stream({
  queryValidator: (data): { topic: string } => data as { topic: string },
  handler: async function* ({ query, signal: _signal }) {
    yield streamEvent("token", { text: `Events for ${query.topic}` });
  },
});

// ============================================================
// Type-level negative tests (these MUST fail compilation)
// ============================================================

const _badValidator = baseRouter.createEndpoint("/status/no-body").stream({
  // @ts-expect-error — Cannot add body validator to stream endpoint (SSE is GET-only, no body)
  validator: (data: unknown) => data as { name: string },
  handler: async function* ({ signal: _signal }) {
    yield streamEvent("token", { text: "hi" });
  },
});

const _badAuthValidator = chatRouter.createEndpoint("/chat/no-body-auth").stream({
  authenticator: authenticationMiddleware,
  // @ts-expect-error — validator is forbidden on authenticated stream routes too (SSE has no request body)
  validator: (data: unknown) => data as { name: string },
  handler: async function* ({ signal: _signal }) {
    yield streamEvent("token", { text: "hi" });
  },
});
