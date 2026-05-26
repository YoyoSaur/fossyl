// @code: start todo-validators-imports
import { z } from "zod";
import { zodValidator } from "@fossyl/zod";
// @code: end todo-validators-imports

// @code: start todo-schemas
const createTodoSchema = z.object({
  title: z.string().min(1),
});

const updateTodoSchema = z.object({
  title: z.string().min(1).optional(),
  completed: z.boolean().optional(),
});
// @code: end todo-schemas

// @code: start todo-validators
export const createTodoValidator = zodValidator(createTodoSchema);
export const updateTodoValidator = zodValidator(updateTodoSchema);
// @code: end todo-validators
