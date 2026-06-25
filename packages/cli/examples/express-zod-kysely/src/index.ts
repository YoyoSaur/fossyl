import { expressAdapter } from '@fossyl/express';
import { kyselyAdapter } from '@fossyl/kysely';
import { client } from './db';
import { migrations } from './migrations';
import routes from './registry';

const { adapter: database } = kyselyAdapter({
  client,
  migrations,
  autoMigrate: true,
});

const adapter = expressAdapter({
  cors: true,
  database,
});

adapter.register(routes);

const PORT = process.env.PORT ?? 3000;
adapter.listen(Number(PORT)).then(() => {
  console.log(`Server running on http://localhost:${PORT}`);
});
