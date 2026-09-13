import {
	generateOtp,
	hashOtp,
	verifyOtp,
	getOtpExpiry,
} from "../../src/lib/otp";

describe("OTP utility", () => {
	describe("generateOtp", () => {
		it("generates a 6-digit numeric OTP", () => {
			const otp = generateOtp();

			expect(otp).toHaveLength(6);
			expect(otp).toMatch(/^\d{6}$/);
		});

		it("generates different OTPs over multiple calls", () => {
			const otps = new Set(Array.from({ length: 100 }, () => generateOtp()));

			expect(otps.size).toBeGreaterThan(1);
		});
	});
});

describe("hashOtp", () => {
	it("hashes the OTP", async () => {
		const otp = generateOtp();
		const hash = await hashOtp(otp);

		expect(hash).not.toBe(otp);
		expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
	});

	it("generates a different hash for the same OTP", async () => {
		const otp = "123456";

		const hash1 = await hashOtp(otp);
		const hash2 = await hashOtp(otp);

		expect(hash1).not.toBe(hash2);
	});
});

describe("verifyOtp", () => {
	it("returns true when the OTP matches the hash", async () => {
		const otp = "123456";
		const hash = await hashOtp(otp);

		await expect(verifyOtp(otp, hash)).resolves.toBe(true);
	});

	it("returns false when the OTP does not match the hash", async () => {
		const hash = await hashOtp("123456");

		await expect(verifyOtp("654321", hash)).resolves.toBe(false);
	});
});

describe("getOtpExpiry", () => {
	it("returns an expiry time 15 minutes in the future", () => {
		const before = Date.now();
		const expiry = getOtpExpiry();
		const after = Date.now();

		const fifteenMinutes = 15 * 60 * 1000;

		expect(expiry.getTime()).toBeGreaterThanOrEqual(before + fifteenMinutes);
		expect(expiry.getTime()).toBeLessThanOrEqual(after + fifteenMinutes);
	});
});
