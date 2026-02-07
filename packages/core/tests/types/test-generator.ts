#!/usr/bin/env tsx
/**
 * Type Test Generator for Fossyl
 *
 * Generates routes.test-d.ts from the test matrix.
 * Run with: pnpm generate:type-tests
 */

import * as fs from "fs";
import * as path from "path";
import {
  methodCategories,
  validCombinations,
  mismatchScenarios,
  getInvalidConfigs,
  type MethodCategory,
  type ConfigType,
  type MismatchScenario,
} from "./test-matrix";

// ============================================================================
// Configuration Generators
// ============================================================================

/**
 * Generates the config object for a valid test case
 */
function generateValidConfig(method: string, category: MethodCategory, configName: string): string {
  const isPagination = category === "pagination";
  const hasAuth = configName.toLowerCase().includes("authenticated") || configName === "full" || configName === "fullWithQuery";
  const hasBody = configName.toLowerCase().includes("validated") || configName === "full" || configName === "fullWithQuery";
  const hasQuery = configName.toLowerCase().includes("withquery");

  const configParts: string[] = [];

  if (hasAuth) {
    configParts.push("authenticator");
  }
  if (hasBody) {
    configParts.push("validator");
  }
  if (hasQuery) {
    configParts.push("queryValidator");
  }

  // Generate handler signature
  const handlerParams = generateHandlerParams(hasQuery, isPagination);
  const handlerArgs = generateHandlerArgs(hasAuth, hasBody);
  const returnType = isPagination ? "paginatedResponse" : "response";

  configParts.push(`handler: async (${handlerParams}${handlerArgs}) => ${returnType}`);

  return `{ ${configParts.join(", ")} }`;
}

/**
 * Generates the params object signature for handler
 */
function generateHandlerParams(hasQuery: boolean, hasPagination: boolean): string {
  const parts = ["url"];
  if (hasQuery) {
    parts.push("query");
  }
  if (hasPagination) {
    parts.push("pagination");
  }
  return `{ ${parts.join(", ")} }`;
}

/**
 * Generates additional handler arguments (auth, body)
 */
function generateHandlerArgs(hasAuth: boolean, hasBody: boolean): string {
  const args: string[] = [];
  if (hasAuth) {
    args.push("auth");
  }
  if (hasBody) {
    args.push("body");
  }
  return args.length > 0 ? ", " + args.join(", ") : "";
}

// ============================================================================
// Test Generators
// ============================================================================

/**
 * Generates valid configuration tests for a method
 */
function generateValidTests(method: string, category: MethodCategory): string {
  const validConfigs = validCombinations[category];
  let output = `// Valid configurations for ${method.toUpperCase()}\n`;

  for (const configName of validConfigs) {
    const config = generateValidConfig(method, category, configName);
    output += `endpoint.${method}(${config});\n`;
  }

  return output + "\n";
}

/**
 * Generates invalid configuration tests for a method
 * (configs from wrong categories)
 */
function generateInvalidCategoryTests(method: string, category: MethodCategory): string {
  const invalidConfigs = getInvalidConfigs(category);
  let output = `// Invalid configurations for ${method.toUpperCase()} (wrong category)\n`;

  // Sample representative configs from other categories
  const sampled = sampleInvalidConfigs(invalidConfigs, category);

  for (const config of sampled) {
    const errorMessage = getInvalidCategoryError(method, category, config);
    output += `// @ts-expect-error - ${errorMessage}\n`;
    output += `endpoint.${method}(${generateConfigFromType(method, config)});\n`;
  }

  return output + "\n";
}

/**
 * Sample a few representative invalid configs to avoid redundant tests
 */
function sampleInvalidConfigs(configs: ConfigType[], category: MethodCategory): ConfigType[] {
  // Get unique combinations based on key characteristics
  const sampled: ConfigType[] = [];

  // For bodyless methods, sample body configs
  if (category === "bodyless") {
    // Get one basic body config and one with auth
    const basicBody = configs.find((c) => c.hasBody && !c.hasAuth);
    const authBody = configs.find((c) => c.hasBody && c.hasAuth);
    if (basicBody) sampled.push(basicBody);
    if (authBody) sampled.push(authBody);
  }

  // For body-required methods, sample bodyless configs
  if (category === "body-required") {
    // Get one basic open config and one authenticated
    const basicOpen = configs.find((c) => !c.hasBody && !c.hasAuth && !c.hasPagination);
    const authOpen = configs.find((c) => !c.hasBody && c.hasAuth && !c.hasPagination);
    if (basicOpen) sampled.push(basicOpen);
    if (authOpen) sampled.push(authOpen);
  }

  // For pagination methods, sample non-pagination configs
  if (category === "pagination") {
    // Get one bodyless and one body config
    const bodyless = configs.find((c) => !c.hasBody && !c.hasPagination);
    const withBody = configs.find((c) => c.hasBody && !c.hasPagination);
    if (bodyless) sampled.push(bodyless);
    if (withBody) sampled.push(withBody);
  }

  return sampled;
}

/**
 * Get error message for invalid category usage
 */
function getInvalidCategoryError(method: string, category: MethodCategory, config: ConfigType): string {
  if (category === "bodyless" && config.hasBody) {
    return `${method.toUpperCase()} cannot have validator (body)`;
  }
  if (category === "body-required" && !config.hasBody) {
    return `${method.toUpperCase()} requires validator`;
  }
  if (category === "pagination" && !config.hasPagination) {
    return `list requires pagination handler signature`;
  }
  if (category !== "pagination" && config.hasPagination) {
    return `${method.toUpperCase()} cannot use pagination config`;
  }
  return `Invalid config for ${method.toUpperCase()}`;
}

/**
 * Generate config string from ConfigType
 */
function generateConfigFromType(method: string, config: ConfigType): string {
  const isPagination = config.hasPagination;
  const parts: string[] = [];

  if (config.hasAuth) {
    parts.push("authenticator");
  }
  if (config.hasBody) {
    parts.push("validator");
  }
  if (config.hasQuery) {
    parts.push("queryValidator");
  }

  const handlerParams = generateHandlerParams(config.hasQuery, isPagination ?? false);
  const handlerArgs = generateHandlerArgs(config.hasAuth, config.hasBody);
  const returnType = isPagination ? "paginatedResponse" : "response";

  parts.push(`handler: async (${handlerParams}${handlerArgs}) => ${returnType}`);

  return `{ ${parts.join(", ")} }`;
}

/**
 * Generates mismatch tests for a method
 */
function generateMismatchTests(method: string, category: MethodCategory): string {
  const applicableMismatches = mismatchScenarios.filter((m) =>
    m.applicableCategories.includes(category)
  );

  if (applicableMismatches.length === 0) {
    return "";
  }

  let output = `// Handler/Config mismatches for ${method.toUpperCase()}\n`;

  for (const mismatch of applicableMismatches) {
    output += generateMismatchTest(method, category, mismatch);
  }

  return output + "\n";
}

/**
 * Generate a single mismatch test
 */
function generateMismatchTest(
  method: string,
  category: MethodCategory,
  mismatch: MismatchScenario
): string {
  const isPagination = category === "pagination";
  const parts: string[] = [];

  // Config parts - what config provides
  if (mismatch.configProvides.authenticator) {
    parts.push("authenticator");
  }
  if (mismatch.configProvides.validator && category === "body-required") {
    parts.push("validator");
  }
  if (mismatch.configProvides.queryValidator) {
    parts.push("queryValidator");
  }

  // For body-required methods, always need validator in config
  if (category === "body-required" && !mismatch.configProvides.validator) {
    // If mismatch doesn't provide validator but body-required needs it,
    // this is testing "no validator but handler expects body" scenario
    // We can't add validator here as that changes the test meaning
  }

  // Handler signature - what handler expects
  const handlerExpectsQuery = mismatch.handlerExpects.query;
  const handlerExpectsAuth = mismatch.handlerExpects.auth;
  const handlerExpectsBody = mismatch.handlerExpects.body;

  const handlerParams = generateHandlerParams(
    handlerExpectsQuery ?? false,
    isPagination
  );
  const handlerArgs = generateHandlerArgs(
    handlerExpectsAuth ?? false,
    handlerExpectsBody ?? false
  );
  const returnType = isPagination ? "paginatedResponse" : "response";

  parts.push(`handler: async (${handlerParams}${handlerArgs}) => ${returnType}`);

  let output = `// @ts-expect-error - ${mismatch.description}\n`;
  output += `endpoint.${method}({ ${parts.join(", ")} });\n`;

  return output;
}

/**
 * Generates return type mismatch tests for LIST method
 */
function generateReturnTypeMismatchTests(): string {
  let output = `// Return type mismatches for LIST\n`;

  // LIST must return PaginatedResponse, not regular response
  output += `// @ts-expect-error - list must return PaginatedResponse, not regular response\n`;
  output += `endpoint.list({ handler: async ({ url, pagination }) => response });\n`;

  // LIST with auth must also return PaginatedResponse
  output += `// @ts-expect-error - authenticated list must return PaginatedResponse\n`;
  output += `endpoint.list({ authenticator, handler: async ({ url, pagination }, auth) => response });\n`;

  return output + "\n";
}

// ============================================================================
// Main Generation
// ============================================================================

/**
 * Generates the header with imports and setup
 */
function generateHeader(): string {
  return `// AUTO-GENERATED FILE - Do not edit manually
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

`;
}

/**
 * Generates all tests for all methods
 */
function generateAllTests(): string {
  let output = generateHeader();

  for (const [method, category] of Object.entries(methodCategories)) {
    output += `// ============================================================================\n`;
    output += `// ${method.toUpperCase()} TESTS\n`;
    output += `// ============================================================================\n\n`;

    output += generateValidTests(method, category);
    output += generateInvalidCategoryTests(method, category);
    output += generateMismatchTests(method, category);

    // Special return type tests for list
    if (method === "list") {
      output += generateReturnTypeMismatchTests();
    }
  }

  return output;
}

/**
 * Main entry point
 */
function main(): void {
  const outputPath = path.join(__dirname, "index.test-d.ts");
  const content = generateAllTests();

  fs.writeFileSync(outputPath, content, "utf-8");

  // Count tests generated
  const expectErrorCount = (content.match(/@ts-expect-error/g) || []).length;
  const validTestCount = content.split("\n").filter(
    (line) => line.startsWith("endpoint.") && !line.includes("@ts-expect-error")
  ).length;

  console.log(`Generated ${outputPath}`);
  console.log(`  Valid tests: ${validTestCount}`);
  console.log(`  Error tests: ${expectErrorCount}`);
  console.log(`  Total tests: ${validTestCount + expectErrorCount}`);
}

main();
