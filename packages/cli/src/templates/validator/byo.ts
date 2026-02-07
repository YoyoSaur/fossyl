export function generateByoValidatorPlaceholder(): string {
  return `/**
 * TODO: Implement your validators
 *
 * Validators should:
 * 1. Accept unknown data
 * 2. Validate and parse the data
 * 3. Return the typed result or throw an error
 *
 * Reference implementation: https://github.com/YoyoSaur/fossyl/tree/main/packages/zod
 *
 * Example with Yup:
 *
 * import * as yup from 'yup';
 *
 * const createPingSchema = yup.object({
 *   message: yup.string().required().max(255),
 * });
 *
 * export const createPingValidator = (data: unknown) => {
 *   return createPingSchema.validateSync(data);
 * };
 *
 * Example with manual validation:
 *
 * export const createPingValidator = (data: unknown): CreatePingBody => {
 *   if (typeof data !== 'object' || data === null) {
 *     throw new Error('Invalid request body');
 *   }
 *   const { message } = data as Record<string, unknown>;
 *   if (typeof message !== 'string' || message.length === 0 || message.length > 255) {
 *     throw new Error('Invalid message');
 *   }
 *   return { message };
 * };
 */

// Type definitions
export interface CreatePingBody {
  message: string;
}

export interface UpdatePingBody {
  message?: string;
}

// List filters (pagination is handled automatically by .list() routes)
export interface ListPingQuery {
  search?: string;
}

// Validators - TODO: Implement actual validation
export const createPingValidator = (data: unknown): CreatePingBody => {
  // TODO: Add validation logic
  return data as CreatePingBody;
};

export const updatePingValidator = (data: unknown): UpdatePingBody => {
  // TODO: Add validation logic
  return data as UpdatePingBody;
};

export const listPingQueryValidator = (data: unknown): ListPingQuery => {
  // TODO: Add validation logic
  // Note: pagination (page, pageSize) is handled automatically by the framework
  const parsed = data as Record<string, unknown>;
  return {
    search: typeof parsed.search === 'string' ? parsed.search : undefined,
  };
};
`;
}
