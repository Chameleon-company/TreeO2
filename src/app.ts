import compression from 'compression';
import express from 'express';
import helmet from 'helmet';
import { corsMiddleware } from './config/cors';
import { env } from './config/env';
import { apiRateLimit } from './config/rateLimit';
import { swaggerMiddleware } from './config/swagger';
import { requestLoggerMiddleware } from './middlewares/requestLogger.middleware';
import { securityAuditMiddleware } from './middlewares/securityAudit.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import { notFoundMiddleware } from './middlewares/notFound.middleware';
import routes from './routes';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(corsMiddleware);
app.use(requestLoggerMiddleware);
app.use(securityAuditMiddleware);
app.use(apiRateLimit);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(env.API_PREFIX, routes);

if (env.SWAGGER_ENABLED) {
  app.use('/docs', ...swaggerMiddleware);
}

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
