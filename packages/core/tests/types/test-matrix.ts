/**
 * Test Matrix Definition for Fossyl Type Tests
 *
 * This file defines the matrix of valid/invalid combinations for type testing.
 * The generator uses this to auto-generate routes.test-d.ts
 *
 * To add a new HTTP method (e.g., PATCH):
 * 1. Add to methodCategories with its category
 * 2. Run: pnpm generate:type-tests
 */

// ============================================================================
// Method Categories
// ============================================================================

/**
 * Categories define the fundamental behavior of each HTTP method:
 * - bodyless: Cannot have a validator (GET, DELETE)
 * - body-required: Must have a validator (POST, PUT)
 * - pagination: Paginated GET with special response type (LIST)
 */
export type MethodCategory = "bodyless" | "body-required" | "pagination";

/**
 * Maps each HTTP method to its category.
 * Adding a new method here automatically generates tests for it.
 */
export const methodCategories: Record<string, MethodCategory> = {
  get: "bodyless",
  delete: "bodyless",
  post: "body-required",
  put: "body-required",
  list: "pagination",
  // Future methods:
  // patch: 'body-required',
  // read: 'bodyless',
};

// ============================================================================
// Config Types
// ============================================================================

/**
 * Defines a configuration type with its characteristics.
 */
export interface ConfigType {
  name: string;
  hasAuth: boolean;
  hasBody: boolean;
  hasQuery: boolean;
  hasPagination?: boolean;
}

/**
 * All possible handler configuration variations.
 * These map to the different route types (OpenRoute, AuthenticatedRoute, etc.)
 */
export const configTypes: readonly ConfigType[] = [
  // Bodyless configs (GET/DELETE)
  { name: "open", hasAuth: false, hasBody: false, hasQuery: false },
  { name: "openWithQuery", hasAuth: false, hasBody: false, hasQuery: true },
  { name: "authenticated", hasAuth: true, hasBody: false, hasQuery: false },
  { name: "authenticatedWithQuery", hasAuth: true, hasBody: false, hasQuery: true },

  // Body configs (POST/PUT)
  { name: "validated", hasAuth: false, hasBody: true, hasQuery: false },
  { name: "validatedWithQuery", hasAuth: false, hasBody: true, hasQuery: true },
  { name: "full", hasAuth: true, hasBody: true, hasQuery: false },
  { name: "fullWithQuery", hasAuth: true, hasBody: true, hasQuery: true },

  // Pagination configs (LIST)
  {
    name: "list",
    hasAuth: false,
    hasBody: false,
    hasQuery: false,
    hasPagination: true,
  },
  {
    name: "listWithQuery",
    hasAuth: false,
    hasBody: false,
    hasQuery: true,
    hasPagination: true,
  },
  {
    name: "authenticatedList",
    hasAuth: true,
    hasBody: false,
    hasQuery: false,
    hasPagination: true,
  },
  {
    name: "authenticatedListWithQuery",
    hasAuth: true,
    hasBody: false,
    hasQuery: true,
    hasPagination: true,
  },
] as const;

// ============================================================================
// Valid Combinations Matrix
// ============================================================================

/**
 * Maps each method category to its valid config names.
 */
export const validCombinations: Record<MethodCategory, readonly string[]> = {
  bodyless: ["open", "openWithQuery", "authenticated", "authenticatedWithQuery"],
  "body-required": ["validated", "validatedWithQuery", "full", "fullWithQuery"],
  pagination: ["list", "listWithQuery", "authenticatedList", "authenticatedListWithQuery"],
};

// ============================================================================
// Mismatch Scenarios
// ============================================================================

/**
 * Defines scenarios where handler signature doesn't match config.
 */
export interface MismatchScenario {
  name: string;
  description: string;
  /** What the handler expects */
  handlerExpects: {
    auth?: boolean;
    body?: boolean;
    query?: boolean;
  };
  /** What the config provides */
  configProvides: {
    authenticator?: boolean;
    validator?: boolean;
    queryValidator?: boolean;
  };
  /** Which method categories this applies to */
  applicableCategories: MethodCategory[];
}

/**
 * Handler/config mismatch scenarios to test.
 * These verify that TypeScript catches when handler doesn't match config.
 *
 * Note: We only test cases where handler EXPECTS something config doesn't provide.
 * The reverse (config provides, handler ignores) is valid TypeScript - functions
 * can have fewer parameters than their type signature requires.
 */
export const mismatchScenarios: readonly MismatchScenario[] = [
  // Handler expects something config doesn't provide
  {
    name: "handlerExpectsAuthNoConfig",
    description: "Handler expects auth but no authenticator provided",
    handlerExpects: { auth: true },
    configProvides: {},
    applicableCategories: ["bodyless", "body-required", "pagination"],
  },
  {
    name: "handlerExpectsBodyNoConfig",
    description: "Handler expects body but no validator provided",
    handlerExpects: { body: true },
    configProvides: {},
    applicableCategories: ["body-required"], // Only body methods can have this
  },
  {
    name: "handlerExpectsQueryNoConfig",
    description: "Handler expects query but no queryValidator provided",
    handlerExpects: { query: true },
    configProvides: {},
    applicableCategories: ["bodyless", "body-required", "pagination"],
  },
] as const;

// ============================================================================
// Invalid Category Scenarios
// ============================================================================

/**
 * Defines which configs are invalid for each category
 * (i.e., body configs on bodyless methods, bodyless configs on body methods)
 */
export function getInvalidConfigs(category: MethodCategory): ConfigType[] {
  const validNames = validCombinations[category];
  return configTypes.filter((c) => !validNames.includes(c.name));
}

/**
 * Get a config by name
 */
export function getConfigByName(name: string): ConfigType | undefined {
  return configTypes.find((c) => c.name === name);
}
