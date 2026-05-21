import { createRouter } from "@fossyl/core";
import * as userService from "../services/users.service";
import { authenticator } from "../../../auth";
import { createUserValidator, updateUserValidator } from "../validators/users.validators";

const router = createRouter("/api/users");

export const getUser = router.createEndpoint("/api/users/:id").get(({ url }) => async () => {
  const user = await userService.getUser(url.id);
  return { typeName: "User" as const, ...user };
});

export const createUser = router
  .createEndpoint("/api/users")
  .authenticator(authenticator)
  .validator(createUserValidator)
  .post((auth) => (body) => async () => {
    const user = await userService.createUser(body.name, body.email);
    return { typeName: "User" as const, ...user };
  });

export const updateUser = router
  .createEndpoint("/api/users/:id")
  .authenticator(authenticator)
  .validator(updateUserValidator)
  .put(({ url }) => (auth) => (body) => async () => {
    const user = await userService.updateUser(url.id, body);
    return { typeName: "User" as const, ...user };
  });

export const deleteUser = router
  .createEndpoint("/api/users/:id")
  .authenticator(authenticator)
  .delete(({ url }) => (auth) => async () => {
    await userService.deleteUser(url.id);
    return { typeName: "DeleteResult" as const, id: url.id, deleted: true };
  });

export default [getUser, createUser, updateUser, deleteUser];
