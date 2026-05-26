import { createRouter } from "@fossyl/core";
import * as userService from "../services/users.service";
import { authenticator } from "../../../auth";
import { createUserValidator, updateUserValidator } from "../validators/users.validators";

const router = createRouter("/api/users");

// @code: start open-get-user
export const getUser = router.createEndpoint("/api/users/:id").get((params) => async () => {
  const user = await userService.getUser(Number(params.url.id));
  return { typeName: "User" as const, ...user };
});
// @code: end open-get-user

// @code: start auth-validator-post-user
export const createUser = router
  .createEndpoint("/api/users")
  .authenticator(authenticator)
  .validator(createUserValidator)
  .post((auth) => (body) => async () => {
    const user = await userService.createUser(body.name, body.email);
    return { typeName: "User" as const, ...user };
  });
// @code: end auth-validator-post-user

// @code: start auth-validator-put-user
export const updateUser = router
  .createEndpoint("/api/users/:id")
  .authenticator(authenticator)
  .validator(updateUserValidator)
  .put((params) => (auth) => (body) => async () => {
    const user = await userService.updateUser(Number(params.url.id), body);
    return { typeName: "User" as const, ...user };
  });
// @code: end auth-validator-put-user

// @code: start auth-delete-user
export const deleteUser = router
  .createEndpoint("/api/users/:id")
  .authenticator(authenticator)
  .delete((params) => (auth) => async () => {
    await userService.deleteUser(Number(params.url.id));
    return { typeName: "DeleteResult" as const, id: params.url.id, deleted: true };
  });
// @code: end auth-delete-user

export default [getUser, createUser, updateUser, deleteUser];
