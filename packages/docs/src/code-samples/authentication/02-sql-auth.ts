// @code-block-start: sql-auth
// SQL-based authentication — look up user in database
import { authWrapper } from 'fossyl';
import { AuthenticationError, getDb } from '@fossyl/express';

const sqlAuth = async (headers: Record<string, string>) => {
  const apiKey = headers['x-api-key'];
  if (!apiKey) throw new AuthenticationError('API key required');

  const db = getDb().client;
  const user = await db
    .selectFrom('users')
    .where('api_key', '=', apiKey)
    .select(['id', 'role', 'name'])
    .executeTakeFirst();

  if (!user) throw new AuthenticationError('Invalid API key');

  return authWrapper({
    userId: user.id,
    role: user.role,
    name: user.name,
  });
};

const protectedRoute = router.createEndpoint('/dashboard').get({
  authenticator: sqlAuth,
  handler: async ({ url }, auth) => {
    //    auth is typed as: { userId: string; role: string; name: string }
    return {
      typeName: 'Dashboard' as const,
      user: auth.name,
      role: auth.role,
    };
  },
});
// @code-block-end: sql-auth
