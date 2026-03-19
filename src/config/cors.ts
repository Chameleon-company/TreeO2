import cors from 'cors';
import { env } from './env';

export const corsMiddleware = cors({
  origin: env.NODE_ENV === 'production' ? false : '*',
});
