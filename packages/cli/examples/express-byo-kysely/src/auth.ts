import { authWrapper, fossylUnauthorized } from '@fossyl/core';

export const authenticator = async (headers: Record<string, string>) => {
  const userId = headers['x-user-id'];
  if (!userId) {
    throw fossylUnauthorized('Unauthorized');
  }
  return authWrapper({ userId });
};
