import { expressAdapter } from '@fossyl/express';
import pingRoutes from './features/ping/routes/ping.route';

const adapter = expressAdapter({
  cors: true,
});

const routes = [...pingRoutes];
adapter.register(routes);

const PORT = process.env.PORT ?? 3000;
adapter.listen(Number(PORT)).then(() => {
  console.log(`Server running on http://localhost:${PORT}`);
});
