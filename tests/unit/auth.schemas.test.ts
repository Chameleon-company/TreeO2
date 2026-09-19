import { ResetPasswordReqBody } from "../../src/modules/auth/auth.schemas";

describe("ResetPasswordReqBody", () => {
	it("rejects a password that does not meet complexity requirements", () => {
		const result = ResetPasswordReqBody.safeParse({
			token: "some-token",
			password: "aaaaaaaa",
		});

		expect(result.success).toBe(false);
	});

	it("accepts a password that meets complexity requirements", () => {
		const result = ResetPasswordReqBody.safeParse({
			token: "some-token",
			password: "NewPassword123!",
		});

		expect(result.success).toBe(true);
	});
});
