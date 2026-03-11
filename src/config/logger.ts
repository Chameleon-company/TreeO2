import winston from 'winston';
import { env } from './env';

const fileTransports =
  env.LOG_TO_FILE || env.NODE_ENV === 'production'
    ? [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
      ]
    : [];

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const ts = typeof timestamp === 'string' ? timestamp : String(timestamp);
            const msg = typeof message === 'string' ? message : String(message);
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${ts} [${level}]: ${msg}${metaStr}`;
          }),
        ),
  ),
  transports: [new winston.transports.Console(), ...fileTransports],
});