import { authWrapper } from '@fossyl/core';

export const authenticator = async (headers: Record<string, string>) => {
  const userId = headers['x-user-id'];
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return authWrapper({ userId });
};
