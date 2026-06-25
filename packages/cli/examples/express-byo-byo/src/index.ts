import { expressAdapter } from '@fossyl/express';
import routes from './registry';

const adapter = expressAdapter({
  cors: true,
});

adapter.register(routes);

const PORT = process.env.PORT ?? 3000;
adapter.listen(Number(PORT)).then(() => {
  console.log(`Server running on http://localhost:${PORT}`);
});
