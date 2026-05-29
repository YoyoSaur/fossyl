import { createMigrationProvider } from '@fossyl/kysely';
import { migration as m001 } from './001_create_ping';

export const migrations = createMigrationProvider({
  '001_create_ping': m001,
});
