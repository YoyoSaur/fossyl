export function generateZodValidators(): string {
  return `import { z } from 'zod';
import { zodValidator, zodQueryValidator } from '@fossyl/zod';

// Create ping body schema
export const createPingSchema = z.object({
  message: z.string().min(1).max(255),
});

export const createPingValidator = zodValidator(createPingSchema);
export type CreatePingBody = z.infer<typeof createPingSchema>;

// Update ping body schema
export const updatePingSchema = z.object({
  message: z.string().min(1).max(255).optional(),
});

export const updatePingValidator = zodValidator(updatePingSchema);
export type UpdatePingBody = z.infer<typeof updatePingSchema>;

// List ping filter schema (pagination is handled automatically by .list())
export const listPingQuerySchema = z.object({
  search: z.string().optional(),
});

export const listPingQueryValidator = zodQueryValidator(listPingQuerySchema);
export type ListPingQuery = z.infer<typeof listPingQuerySchema>;
`;
}
