import winston from 'winston';
import { LOG_DIR } from './constants';
import { env } from './env';

const fileTransports =
  env.LOG_TO_FILE || env.NODE_ENV === 'production'
    ? [
        new winston.transports.File({
          filename: `${LOG_DIR}/error.log`,
          level: 'error',
        }),
        new winston.transports.File({
          filename: `${LOG_DIR}/combined.log`,
        }),
      ]
    : [];

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  defaultMeta: {
    service: 'treeo2-backend',
    environment: env.NODE_ENV,
  },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} [${level}]: ${String(message)}${metaStr}`;
          }),
        ),
  ),
  transports: [new winston.transports.Console(), ...fileTransports],
});
