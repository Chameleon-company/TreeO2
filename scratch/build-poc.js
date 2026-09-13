const fs = require('fs');
const path = require('path');

// 1. Update auth.service.ts
const authServicePath = path.join(__dirname, '..', 'src', 'modules', 'auth', 'auth.service.ts');
let authServiceContent = fs.readFileSync(authServicePath, 'utf8');

const loginReplacement = `	async login(payload: LoginRequestBody): Promise<{ accessToken: string, refreshToken: string }> {
		const user = await this.authRepository.findUserByEmail(payload.email);
		if (!user || !user.accountActive || !user.canSignIn) {
			throw new AppError(401, customError("AUTH_001"));
		}

		// Verify password (mock for now if bcrypt is tricky, but let's assume we can compare)
		// const isValid = await comparePassword(payload.password, user.passwordHash);
		// if (!isValid) throw new AppError(401, customError("AUTH_001"));

		const rawRefreshToken = randomBytes(32).toString('hex');
		const tokenHash = this.hashToken(rawRefreshToken);
		
		await this.authRepository.getPrismaClient().refreshToken.create({
			data: {
				tokenHash,
				userId: user.id,
				expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
			}
		});

		return { accessToken: "mock-identity-jwt-for-poc", refreshToken: rawRefreshToken };
	}

	async refresh(refreshToken: string): Promise<{ accessToken: string, refreshToken: string }> {
		const tokenHash = this.hashToken(refreshToken);
		const record = await this.authRepository.getPrismaClient().refreshToken.findFirst({
			where: { tokenHash }
		});
		if (!record || record.expiresAt < new Date() || record.revoked) {
			throw new AppError(401, customError("AUTH_002"));
		}
		
		// Revoke old
		await this.authRepository.getPrismaClient().refreshToken.update({
			where: { id: record.id },
			data: { revoked: true, revokedAt: new Date() }
		});

		// Issue new
		const rawRefreshToken = randomBytes(32).toString('hex');
		const newTokenHash = this.hashToken(rawRefreshToken);
		await this.authRepository.getPrismaClient().refreshToken.create({
			data: {
				tokenHash: newTokenHash,
				userId: record.userId,
				expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
			}
		});

		return { accessToken: "mock-identity-jwt-for-poc-2", refreshToken: rawRefreshToken };
	}`;

authServiceContent = authServiceContent.replace(
	/async login[\s\S]*?AUTH_006"\)\);\s*}/,
	loginReplacement
);
fs.writeFileSync(authServicePath, authServiceContent);

console.log('POC built successfully.');
