// @code: start user-validators-imports
import { z } from "zod";
import { zodValidator } from "@fossyl/zod";
// @code: end user-validators-imports

// @code: start user-schemas
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});
// @code: end user-schemas

// @code: start user-validators
export const createUserValidator = zodValidator(createUserSchema);
export const updateUserValidator = zodValidator(updateUserSchema);
// @code: end user-validators
