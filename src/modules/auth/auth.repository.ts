import type { User } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export class AuthRepository {
	getPrismaClient() {
		return prisma;
	}

	getRoleModelAvailability(): boolean {
		return "role" in prisma;
	}

	async findUserByEmail(email: string): Promise<User | null> {
		return prisma.user.findUnique({ where: { email } });
	}

	async setResetToken(
		userId: number,
		tokenHash: string,
		expiresAt: Date,
	): Promise<void> {
		await prisma.user.update({
			where: { id: userId },
			data: { resetToken: tokenHash, resetTokenExpires: expiresAt },
		});
	}

	async findUserByResetTokenHash(tokenHash: string): Promise<User | null> {
		return prisma.user.findFirst({
			where: { resetToken: tokenHash },
		});
	}

	async updatePasswordAndClearResetToken(
		userId: number,
		passwordHash: string,
	): Promise<void> {
		await prisma.user.update({
			where: { id: userId },
			data: {
				passwordHash,
				resetToken: null,
				resetTokenExpires: null,
			},
		});
	}
}
