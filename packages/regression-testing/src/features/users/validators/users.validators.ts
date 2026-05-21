import { z } from "zod";
import { zodValidator } from "@fossyl/zod";

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

export const createUserValidator = zodValidator(createUserSchema);
export const updateUserValidator = zodValidator(updateUserSchema);
