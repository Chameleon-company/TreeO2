import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const booleanFromEnv = (defaultValue: boolean) =>
  z
    .enum(["true", "false"])
    .default(defaultValue ? "true" : "false")
    .transform((value) => value === "true");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string().default("treeo2"),
  DB_USER: z.string().default("treeo2_user"),
  DB_PASSWORD: z.string().default("treeo2_password"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("24h"),
  AUTH_DEV_MODE: booleanFromEnv(false),
  AUTH_DEV_ADMIN_TOKEN: z.string().optional(),
  AUTH_DEV_FARMER_TOKEN: z.string().optional(),
  AUTH_DEV_MANAGER_TOKEN: z.string().optional(),
  AUTH_DEV_INSPECTOR_TOKEN: z.string().optional(),
  AUTH_DEV_DEVELOPER_TOKEN: z.string().optional(),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  LOG_TO_FILE: booleanFromEnv(false),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
