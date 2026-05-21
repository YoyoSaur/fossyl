import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { start, stop } from "./index";

const PORT = parseInt(process.env.REGRESSION_PORT || process.env.PORT || "9877", 10);
const BASE = process.env.REGRESSION_BASE_URL || `http://localhost:${PORT}`;

const AUTH_HEADERS = { "Content-Type": "application/json", "x-user-id": "user-1" };
const NO_AUTH_HEADERS = { "Content-Type": "application/json" };

// When REGRESSION_BASE_URL is set (Docker/CI mode), assume the server is already running.
// Otherwise start an in-process server for local development.
const isContainerMode = !!process.env.REGRESSION_BASE_URL;

beforeAll(async () => {
  if (!isContainerMode) {
    await start(PORT);
  }
});

afterAll(async () => {
  if (!isContainerMode) {
    await stop();
  }
});

describe("CRUD flow: post \u2192 get \u2192 delete \u2192 verify gone", () => {
  let todoId: number;

  it("POST /api/todos with auth + valid body creates a todo", async () => {
    const res = await fetch(`${BASE}/api/todos`, {
      method: "POST",
      headers: AUTH_HEADERS,
      body: JSON.stringify({ title: "CRUD Test Todo" }),
    });
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body).toMatchObject({ success: "true", type: "Todo" });
    todoId = body.data.id;
    expect(todoId).toBeGreaterThan(0);
    expect(body.data.title).toBe("CRUD Test Todo");
  });

  it("GET /api/todos/:id returns the created todo", async () => {
    const res = await fetch(`${BASE}/api/todos/${todoId}`, {
      headers: AUTH_HEADERS,
    });
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.data.id).toBe(todoId);
    expect(body.data.title).toBe("CRUD Test Todo");
  });

  it("DELETE /api/todos/:id deletes the todo", async () => {
    const res = await fetch(`${BASE}/api/todos/${todoId}`, {
      method: "DELETE",
      headers: AUTH_HEADERS,
    });
    expect(res.status).toBe(200);
  });

  it("GET deleted todo returns error (handler never reached)", async () => {
    const res = await fetch(`${BASE}/api/todos/${todoId}`, {
      headers: AUTH_HEADERS,
    });
    expect(res.status).toBe(500);
  });
});

describe("validation errors stop before handler", () => {
  it("POST with invalid body (missing title) returns error", async () => {
    const res = await fetch(`${BASE}/api/todos`, {
      method: "POST",
      headers: AUTH_HEADERS,
      body: JSON.stringify({ badField: "no title here" }),
    });
    expect(res.status).not.toBe(200);
  });
});

describe("authentication errors", () => {
  it("POST /api/todos without auth returns 401", async () => {
    const res = await fetch(`${BASE}/api/todos`, {
      method: "POST",
      headers: NO_AUTH_HEADERS,
      body: JSON.stringify({ title: "no auth" }),
    });
    expect(res.status).toBe(401);
  });

  it("GET /api/todos/:id without auth returns 401", async () => {
    const res = await fetch(`${BASE}/api/todos/1`, {
      headers: NO_AUTH_HEADERS,
    });
    expect(res.status).toBe(401);
  });
});

describe("open routes (no auth required)", () => {
  let userId: number;

  it("POST /api/users with auth creates a user for read test", async () => {
    const res = await fetch(`${BASE}/api/users`, {
      method: "POST",
      headers: AUTH_HEADERS,
      body: JSON.stringify({ name: "Alice", email: "alice@test.com" }),
    });
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body).toMatchObject({ success: "true", type: "User" });
    userId = body.data.id;
    expect(userId).toBeGreaterThan(0);
  });

  it("GET /api/users/:id returns user (open route)", async () => {
    const res = await fetch(`${BASE}/api/users/${userId}`);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body).toMatchObject({
      success: "true",
      type: "User",
      data: { typeName: "User", name: "Alice", email: "alice@test.com" },
    });
  });

  it("GET /api/users/:id with unknown id returns 500", async () => {
    const res = await fetch(`${BASE}/api/users/999`);
    expect(res.status).toBe(500);
  });
});

describe("paginated list", () => {
  it("GET /api/todos?page=1&pageSize=10 returns paginated response", async () => {
    const res = await fetch(`${BASE}/api/todos?page=1&pageSize=10`);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body).toMatchObject({
      data: expect.any(Array),
      pagination: {
        page: 1,
        pageSize: 10,
        hasMore: expect.any(Boolean),
        total: expect.any(Number),
      },
    });
  });
});
