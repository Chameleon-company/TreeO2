import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const isTest = process.env.NODE_ENV === "test";

const booleanFromEnv = (defaultValue: boolean) =>
	z
		.enum(["true", "false"])
		.default(defaultValue ? "true" : "false")
		.transform((value) => value === "true");

const envSchema = z.object({
	// allow test env also
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),

	PORT: z.coerce.number().default(3000),

	// relax in test
	CORS_ORIGIN: (isTest ? z.string().default("") : z.string()).transform(
		(value) => {
			const origins = value
				.split(",")
				.map((origin) => origin.trim())
				.filter(Boolean);

			return origins.length === 1 && origins[0] === "*" ? "*" : origins;
		},
	),

	JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
	JWT_EXPIRES_IN: z.string().default("24h"),

	AUTH_DEV_MODE: booleanFromEnv(false),
	AUTH_DEV_ADMIN_TOKEN: z.string().optional(),
	AUTH_DEV_FARMER_TOKEN: z.string().optional(),
	AUTH_DEV_MANAGER_TOKEN: z.string().optional(),
	AUTH_DEV_INSPECTOR_TOKEN: z.string().optional(),
	AUTH_DEV_DEVELOPER_TOKEN: z.string().optional(),
	AUTH_DEV_ORG_ADMIN_TOKEN: z.string().optional(),
	AUTH_DEV_SUPPORT_ADMIN_TOKEN: z.string().optional(),

	RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
	RATE_LIMIT_MAX: z.coerce.number().default(100),

	RESET_TOKEN_EXPIRY_MINUTES: z.coerce.number().default(30),

	// 15 minutes
	AUTH_LOGIN_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
	AUTH_LOGIN_RATE_LIMIT_MAX: z.coerce.number().default(5),

	// 1 hour
	AUTH_FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(3600000),
	AUTH_FORGOT_PASSWORD_RATE_LIMIT_MAX: z.coerce.number().default(3),

	// 1 hour
	AUTH_RESET_PASSWORD_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(3600000),
	AUTH_RESET_PASSWORD_RATE_LIMIT_MAX: z.coerce.number().default(3),

	LOG_TO_FILE: booleanFromEnv(false),
});

// these are to validate inputs from dotenv, but are not used by this file's exported `const env`
const envValidation = z.object({
	// used by docker compose, not required to run the application
	DB_PORT: z.coerce.number().optional(),
	DB_NAME: z.string().optional(),
	DB_USER: z.string().optional(),
	DB_PASSWORD: z.string().optional(),

	// required for prisma
	DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
});

const parsed = envSchema.safeParse(process.env);
const validated = envValidation.safeParse(process.env);

if (!(parsed.success && validated.success)) {
	console.error("Invalid environment variables:");

	if (!parsed.success) {
		console.error(parsed.error.flatten().fieldErrors);
	}

	if (!validated.success) {
		console.error(validated.error.flatten().fieldErrors);
	}

	// DO NOT EXIT DURING TESTS
	if (!isTest) {
		process.exit(1);
	}

	// throw instead so Jest can handle it
	throw new Error("Invalid environment configuration");
}

export const env = parsed.data;
