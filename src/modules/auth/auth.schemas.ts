import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    password: z.string().min(8),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email().max(300),
    password: z
      .string()
      .min(8)
      .max(72)
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^a-zA-Z0-9]/, "Must contain at least one special character"),
    role: z.enum(["FARMER", "INSPECTOR", "MANAGER", "ADMIN", "DEVELOPER"]),
  }),
});
