import { z } from "zod";

export const loginSchema = z.object({
	body: z.object({
		email: z.string().email(),
		password: z.string().min(8),
	}),
});

export const ForgotPasswordReqBody = z.object({
	email: z.string().email(),
});
export type ForgotPasswordReqBody = z.infer<typeof ForgotPasswordReqBody>;

export const ForgotPasswordReq = z.object({
	body: ForgotPasswordReqBody,
});
export type ForgotPasswordReq = z.infer<typeof ForgotPasswordReq>;

export const ResetPasswordReqBody = z.object({
	token: z.string().min(1),
	password: z
		.string()
		.min(8)
		.max(72)
		.regex(/[A-Z]/, "Password must contain an uppercase letter")
		.regex(/[0-9]/, "Password must contain a number")
		.regex(/[^a-zA-Z0-9]/, "Password must contain a special character"),
});
export type ResetPasswordReqBody = z.infer<typeof ResetPasswordReqBody>;

export const ResetPasswordReq = z.object({
	body: ResetPasswordReqBody,
});
export type ResetPasswordReq = z.infer<typeof ResetPasswordReq>;
