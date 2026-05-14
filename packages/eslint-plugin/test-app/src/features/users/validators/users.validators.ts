import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export const createUserValidator = (data: unknown) => createUserSchema.parse(data);

export const updateUserValidator = (data: unknown) => updateUserSchema.parse(data);

export const listUsersQueryValidator = z.object({
  search: z.string().optional(),
});
