import "dotenv/config";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";
import app from "../../src/app";

const prisma = new PrismaClient();

describe("Auth Password Reset Integration Tests", () => {
	let roleId: number;
	let userId: number;
	const userEmail = "reset-test@example.com";

	beforeEach(async () => {
		await prisma.user.deleteMany();
		await prisma.role.deleteMany();

		const role = await prisma.role.create({ data: { name: "FARMER" } });
		roleId = role.id;

		const user = await prisma.user.create({
			data: { name: "Reset Test User", email: userEmail, roleId },
		});
		userId = user.id;
	});

	afterAll(async () => {
		await prisma.user.deleteMany();
		await prisma.role.deleteMany();
		await prisma.$disconnect();
	});

	describe("POST /auth/forgot-password", () => {
		it("returns 200 and stores a hashed reset token for a known email", async () => {
			const res = await request(app)
				.post("/auth/forgot-password")
				.send({ email: userEmail });

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);

			const updated = await prisma.user.findUnique({ where: { id: userId } });
			expect(updated?.resetToken).not.toBeNull();
			expect(updated?.resetTokenExpires?.getTime()).toBeGreaterThan(Date.now());
		});

		it("returns 200 without creating a token for an unknown email (no account enumeration)", async () => {
			const res = await request(app)
				.post("/auth/forgot-password")
				.send({ email: "nobody@example.com" });

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
		});

		it("returns 400 for an invalid email format", async () => {
			const res = await request(app)
				.post("/auth/forgot-password")
				.send({ email: "not-an-email" });

			expect(res.status).toBe(400);
		});
	});

	describe("POST /auth/reset-password", () => {
		it("returns 400 AUTH_005 for an unknown token", async () => {
			const res = await request(app)
				.post("/auth/reset-password")
				.send({ token: "not-a-real-token", password: "newpassword123" });

			expect(res.status).toBe(400);
			expect(res.body.code).toBe("AUTH_005");
		});

		it("returns 400 for an expired token", async () => {
			const rawToken = "expired-test-raw-token";
			const tokenHash = createHash("sha256").update(rawToken).digest("hex");

			await prisma.user.update({
				where: { id: userId },
				data: {
					resetToken: tokenHash,
					resetTokenExpires: new Date(Date.now() - 60 * 1000),
				},
			});

			const res = await request(app)
				.post("/auth/reset-password")
				.send({ token: rawToken, password: "newpassword123" });

			expect(res.status).toBe(400);
		});

		it("resets the password and clears the token for a valid token", async () => {
			const rawToken = "integration-test-raw-token";
			const tokenHash = createHash("sha256").update(rawToken).digest("hex");

			await prisma.user.update({
				where: { id: userId },
				data: {
					resetToken: tokenHash,
					resetTokenExpires: new Date(Date.now() + 10 * 60 * 1000),
				},
			});

			const res = await request(app)
				.post("/auth/reset-password")
				.send({ token: rawToken, password: "newpassword123" });

			expect(res.status).toBe(200);

			const updated = await prisma.user.findUnique({ where: { id: userId } });
			expect(updated?.resetToken).toBeNull();
			expect(updated?.resetTokenExpires).toBeNull();
			expect(updated?.passwordHash).not.toBeNull();
		});
	});
});
