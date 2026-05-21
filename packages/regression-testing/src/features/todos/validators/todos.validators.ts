import { z } from "zod";
import { zodValidator } from "@fossyl/zod";

const createTodoSchema = z.object({
  title: z.string().min(1),
});

const updateTodoSchema = z.object({
  title: z.string().min(1).optional(),
  completed: z.boolean().optional(),
});

export const createTodoValidator = zodValidator(createTodoSchema);
export const updateTodoValidator = zodValidator(updateTodoSchema);
