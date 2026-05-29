import { startServer } from './server';
import { db } from './db';
import pingRoutes from './features/ping/routes/ping.route';

const routes = [...pingRoutes];
const PORT = process.env.PORT ?? 3000;
startServer(routes, Number(PORT));
