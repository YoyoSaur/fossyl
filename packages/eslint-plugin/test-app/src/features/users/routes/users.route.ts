import { createRouter } from '@fossyl/core';
import * as userService from '../services/users.service';
import { authenticator } from '../../../auth';
import {
  createUserValidator,
  updateUserValidator,
} from '../validators/users.validators';

const router = createRouter('/api/users');

export const getUser = router.createEndpoint('/api/users/:id').get({
  handler: async ({ url }) => {
    const user = await userService.getUser(url.id);
    return { typeName: 'User' as const, ...user };
  },
});

export const createUser = router.createEndpoint('/api/users').post({
  authenticator,
  validator: createUserValidator,
  handler: async ({ url }, auth, body) => {
    const user = await userService.createUser(body.name, body.email);
    return { typeName: 'User' as const, ...user };
  },
});

export const updateUser = router.createEndpoint('/api/users/:id').put({
  authenticator,
  validator: updateUserValidator,
  handler: async ({ url }, auth, body) => {
    const user = await userService.updateUser(url.id, body);
    return { typeName: 'User' as const, ...user };
  },
});

export const deleteUser = router.createEndpoint('/api/users/:id').delete({
  authenticator,
  handler: async ({ url }, auth) => {
    await userService.deleteUser(url.id);
    return { typeName: 'DeleteResult' as const, id: url.id, deleted: true };
  },
});

export default [getUser, createUser, updateUser, deleteUser];
