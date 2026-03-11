import { Pool, PoolConfig } from "pg";
import { env } from "./env";

const config: PoolConfig = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(config);

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export const query = <T = unknown>(text: string, params?: unknown[]) =>
  pool.query<T & Record<string, unknown>>(text, params);
