// AUTO-GENERATED FILE - Do not edit manually
// Regenerate with: pnpm generate:type-tests
//
// This file tests that Fossyl's type system correctly:
// 1. Allows valid route configurations
// 2. Rejects invalid route configurations at compile time
//
// Tests are generated from test-matrix.ts
// Adding a new HTTP method only requires updating the matrix

import { createRouter, authWrapper, type PaginatedResponse } from "../../src";

// ============================================================================
// Test Setup
// ============================================================================

const router = createRouter("/api");
const endpoint = router.createEndpoint("/api/test/:id");

// Authenticator function for auth tests
const authenticator = async (headers: Record<string, string>) =>
  authWrapper({ userId: headers["user-id"] });

// Validator function for body tests
const validator = (data: unknown) => data as { message: string };

// Query validator for query tests
const queryValidator = (data: unknown) => data as { search?: string };

// Standard response for non-list routes
const response = { typeName: "Test" as const };

// Paginated response for list routes
const paginatedResponse: PaginatedResponse<{ id: string }> = {
  data: [],
  pagination: { page: 1, pageSize: 20 },
};

// ============================================================================
// GET TESTS
// ============================================================================

// Valid configurations for GET
endpoint.get({ handler: async ({ url }) => response });
endpoint.get({ queryValidator, handler: async ({ url, query }) => response });
endpoint.get({ authenticator, handler: async ({ url }, auth) => response });
endpoint.get({ authenticator, queryValidator, handler: async ({ url, query }, auth) => response });

// Invalid configurations for GET (wrong category)
// @ts-expect-error - GET cannot have validator (body)
endpoint.get({ validator, handler: async ({ url }, body) => response });
// @ts-expect-error - GET cannot have validator (body)
endpoint.get({ authenticator, validator, handler: async ({ url }, auth, body) => response });

// Handler/Config mismatches for GET
// @ts-expect-error - Handler expects auth but no authenticator provided
endpoint.get({ handler: async ({ url }, auth) => response });
// @ts-expect-error - Handler expects query but no queryValidator provided
endpoint.get({ handler: async ({ url, query }) => response });

// ============================================================================
// DELETE TESTS
// ============================================================================

// Valid configurations for DELETE
endpoint.delete({ handler: async ({ url }) => response });
endpoint.delete({ queryValidator, handler: async ({ url, query }) => response });
endpoint.delete({ authenticator, handler: async ({ url }, auth) => response });
endpoint.delete({ authenticator, queryValidator, handler: async ({ url, query }, auth) => response });

// Invalid configurations for DELETE (wrong category)
// @ts-expect-error - DELETE cannot have validator (body)
endpoint.delete({ validator, handler: async ({ url }, body) => response });
// @ts-expect-error - DELETE cannot have validator (body)
endpoint.delete({ authenticator, validator, handler: async ({ url }, auth, body) => response });

// Handler/Config mismatches for DELETE
// @ts-expect-error - Handler expects auth but no authenticator provided
endpoint.delete({ handler: async ({ url }, auth) => response });
// @ts-expect-error - Handler expects query but no queryValidator provided
endpoint.delete({ handler: async ({ url, query }) => response });

// ============================================================================
// POST TESTS
// ============================================================================

// Valid configurations for POST
endpoint.post({ validator, handler: async ({ url }, body) => response });
endpoint.post({ validator, queryValidator, handler: async ({ url, query }, body) => response });
endpoint.post({ authenticator, validator, handler: async ({ url }, auth, body) => response });
endpoint.post({ authenticator, validator, queryValidator, handler: async ({ url, query }, auth, body) => response });

// Invalid configurations for POST (wrong category)
// @ts-expect-error - POST requires validator
endpoint.post({ handler: async ({ url }) => response });
// @ts-expect-error - POST requires validator
endpoint.post({ authenticator, handler: async ({ url }, auth) => response });

// Handler/Config mismatches for POST
// @ts-expect-error - Handler expects auth but no authenticator provided
endpoint.post({ handler: async ({ url }, auth) => response });
// @ts-expect-error - Handler expects body but no validator provided
endpoint.post({ handler: async ({ url }, body) => response });
// @ts-expect-error - Handler expects query but no queryValidator provided
endpoint.post({ handler: async ({ url, query }) => response });

// ============================================================================
// PUT TESTS
// ============================================================================

// Valid configurations for PUT
endpoint.put({ validator, handler: async ({ url }, body) => response });
endpoint.put({ validator, queryValidator, handler: async ({ url, query }, body) => response });
endpoint.put({ authenticator, validator, handler: async ({ url }, auth, body) => response });
endpoint.put({ authenticator, validator, queryValidator, handler: async ({ url, query }, auth, body) => response });

// Invalid configurations for PUT (wrong category)
// @ts-expect-error - PUT requires validator
endpoint.put({ handler: async ({ url }) => response });
// @ts-expect-error - PUT requires validator
endpoint.put({ authenticator, handler: async ({ url }, auth) => response });

// Handler/Config mismatches for PUT
// @ts-expect-error - Handler expects auth but no authenticator provided
endpoint.put({ handler: async ({ url }, auth) => response });
// @ts-expect-error - Handler expects body but no validator provided
endpoint.put({ handler: async ({ url }, body) => response });
// @ts-expect-error - Handler expects query but no queryValidator provided
endpoint.put({ handler: async ({ url, query }) => response });

// ============================================================================
// LIST TESTS
// ============================================================================

// Valid configurations for LIST
endpoint.list({ handler: async ({ url, pagination }) => paginatedResponse });
endpoint.list({ queryValidator, handler: async ({ url, query, pagination }) => paginatedResponse });
endpoint.list({ authenticator, handler: async ({ url, pagination }, auth) => paginatedResponse });
endpoint.list({ authenticator, queryValidator, handler: async ({ url, query, pagination }, auth) => paginatedResponse });

// Invalid configurations for LIST (wrong category)
// @ts-expect-error - list requires pagination handler signature
endpoint.list({ handler: async ({ url }) => response });
// @ts-expect-error - list requires pagination handler signature
endpoint.list({ validator, handler: async ({ url }, body) => response });

// Handler/Config mismatches for LIST
// @ts-expect-error - Handler expects auth but no authenticator provided
endpoint.list({ handler: async ({ url, pagination }, auth) => paginatedResponse });
// @ts-expect-error - Handler expects query but no queryValidator provided
endpoint.list({ handler: async ({ url, query, pagination }) => paginatedResponse });

// Return type mismatches for LIST
// @ts-expect-error - list must return PaginatedResponse, not regular response
endpoint.list({ handler: async ({ url, pagination }) => response });
// @ts-expect-error - authenticated list must return PaginatedResponse
endpoint.list({ authenticator, handler: async ({ url, pagination }, auth) => response });

