import type { z } from "zod";
import { fossylValidationError } from "@fossyl/core";

/**
 * Create a type-safe validator from a Zod schema.
 *
 * Uses T["parse"] to preserve full type inference when passed
 * inline to @fossyl/core's createRouter endpoints.
 *
 * @example
 * ```typescript
 * import { createRouter } from '@fossyl/core';
 * import { zodValidator } from '@fossyl/zod';
 * import { z } from 'zod';
 *
 * const router = createRouter('/api');
 *
 * const userSchema = z.object({
 *   name: z.string(),
 *   email: z.string().email(),
 * });
 *
 * // Works inline with full inference!
 * export const createUser = router.createEndpoint('/api/users').post({
 *   validator: zodValidator(userSchema),
 *   handler: async ({ url }, body) => {
 *     // body is { name: string, email: string }
 *     return { typeName: 'User' as const, ...body };
 *   },
 * });
 * ```
 */
export function zodValidator<T extends z.ZodTypeAny>(schema: T): T["parse"] {
  return ((data: unknown) => {
    try {
      return schema.parse(data);
    } catch (err) {
      throw fossylValidationError("Request body failed validation", { originalError: err });
    }
  }) as T["parse"];
}

/**
 * Create a type-safe query validator from a Zod schema.
 *
 * Same as zodValidator - the distinction is semantic for code clarity.
 *
 * @example
 * ```typescript
 * const querySchema = z.object({
 *   page: z.coerce.number().default(1),
 *   limit: z.coerce.number().default(10),
 * });
 *
 * export const listUsers = router.createEndpoint('/api/users').get({
 *   queryValidator: zodQueryValidator(querySchema),
 *   handler: async ({ url, query }) => {
 *     // query is { page: number, limit: number }
 *     return { typeName: 'UserList' as const, results: [] };
 *   },
 * });
 * ```
 */
export function zodQueryValidator<T extends z.ZodTypeAny>(schema: T): T["parse"] {
  return ((data: unknown) => {
    try {
      return schema.parse(data);
    } catch (err) {
      throw fossylValidationError("Query parameters failed validation", { originalError: err });
    }
  }) as T["parse"];
}
