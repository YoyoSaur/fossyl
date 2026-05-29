import { z } from 'zod';
import { zodValidator, zodQueryValidator } from '@fossyl/zod';

export const createPingSchema = z.object({
  message: z.string().min(1).max(255),
});

export const createPingValidator = zodValidator(createPingSchema);
export type CreatePingBody = z.infer<typeof createPingSchema>;

export const updatePingSchema = z.object({
  message: z.string().min(1).max(255).optional(),
});

export const updatePingValidator = zodValidator(updatePingSchema);
export type UpdatePingBody = z.infer<typeof updatePingSchema>;

export const listPingQuerySchema = z.object({
  search: z.string().optional(),
});

export const listPingQueryValidator = zodQueryValidator(listPingQuerySchema);
export type ListPingQuery = z.infer<typeof listPingQuerySchema>;
