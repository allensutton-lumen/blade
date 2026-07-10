import 'dotenv/config';
import app from './app';
import { logger } from './utils/logger';
import { initializeSecrets } from './utils/secrets';

const port = Number(process.env.PORT || 3001);
void initializeSecrets().finally(() => {
  app.listen(port, () => { logger.info('BLADE backend listening', { port }); });
});
