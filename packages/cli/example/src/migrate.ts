import { client } from '@db';
import { migrations } from './migrations';
import { runMigrations } from '@fossyl/kysely';

const result = await runMigrations(client, migrations);

if (result.error) {
  console.error('Migration failed:', result.error.message);
  process.exit(1);
}

console.log(`Migrations applied: ${result.executed.join(', ')}`);
