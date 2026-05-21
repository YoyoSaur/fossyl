import { createRouter } from "@fossyl/core";
import * as todosService from "./features/todos/services/todos.service";
import * as usersService from "./features/users/services/users.service";

const rootRouter = createRouter("/api");

export const hello = rootRouter
  .createEndpoint("/api/hello")
  .get(async () => ({ typeName: "Hello" as const, message: "world" }));

export const health = rootRouter
  .createEndpoint("/api/health")
  .get(async () => ({ typeName: "Health" as const, status: "ok" }));

export default [hello, health, todosService, usersService];
