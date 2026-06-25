import { startServer } from './server';
import routes from './registry';

const PORT = process.env.PORT ?? 3000;
startServer(routes, Number(PORT));
