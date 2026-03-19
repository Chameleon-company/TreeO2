import rateLimit from 'express-rate-limit';
import { env } from './env';

export const apiRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});
