const fs = require('fs');

// 1. Fix auth.repository.ts
const repoPath = 'src/modules/auth/auth.repository.ts';
let repo = fs.readFileSync(repoPath, 'utf8');

const idMethod = `	async findUserWithRolesById(id: number) {
		return prisma.user.findUnique({
			where: { id },
			include: {
				primaryRole: true,
				systemRole: true,
				userOrganisations: {
					include: {
						roles: {
							include: {
								role: true
							}
						}
					}
				}
			}
		});
	}

`;
if (!repo.includes('findUserWithRolesById')) {
	repo = repo.replace('async findUserWithRolesByEmail', idMethod + '	async findUserWithRolesByEmail');
	fs.writeFileSync(repoPath, repo);
}

// 2. Fix auth.service.ts
const servicePath = 'src/modules/auth/auth.service.ts';
let service = fs.readFileSync(servicePath, 'utf8');

// Replace imports to include OrganisationRoleName
service = service.replace(
    'IdentityJwtInfo, SystemRoleName, RoleName }',
    'IdentityJwtInfo, SystemRoleName, RoleName, OrganisationRoleName }'
);

const loginReplacement = `	async login(payload: LoginRequestBody): Promise<{ accessToken: string, refreshToken: string }> {
		const user = await this.authRepository.findUserWithRolesByEmail(payload.email);
		if (!user || !user.accountActive || !user.canSignIn || !user.passwordHash) {
			throw new AppError(401, customError("AUTH_001"));
		}

		// Verify password using bcrypt
		const isValid = await bcrypt.compare(payload.password, user.passwordHash);
		if (!isValid) throw new AppError(401, customError("AUTH_001"));

		// Map organisation roles
		const organisations = user.userOrganisations.map((org) => {
			return {
				organisationId: org.organisationId,
				organisationRole: (org.roles[0]?.role?.name as OrganisationRoleName) ?? "Member",
			};
		});

		// Build Identity Payload (v1.3 Spec)
		const jwtInfo: IdentityJwtInfo = {
			scope: "identity",
			sub: user.id.toString(),
			userId: user.id,
			systemRole: (user.systemRole?.name as SystemRoleName) || null,
			role: (user.primaryRole?.name as RoleName) || "FARMER", // fallback legacy role
			organisations,
		};

		const accessToken = signIdentityJwt(jwtInfo);

		// Issue Refresh Token
		const rawRefreshToken = randomBytes(32).toString("hex");
		const tokenHash = this.hashToken(rawRefreshToken);
		
		await this.authRepository.getPrismaClient().refreshToken.create({
			data: {
				tokenHash,
				userId: user.id,
				// deviceId: "from-headers", // Ideally extracted from request
				expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
			}
		});

		return { accessToken, refreshToken: rawRefreshToken };
	}

	async refresh(refreshToken: string): Promise<{ accessToken: string, refreshToken: string }> {
		const tokenHash = this.hashToken(refreshToken);
		const record = await this.authRepository.getPrismaClient().refreshToken.findFirst({
			where: { tokenHash }
		});
		
		if (!record || record.expiresAt < new Date() || record.revoked) {
			throw new AppError(401, customError("AUTH_002"));
		}
		
		// Revoke old token
		await this.authRepository.getPrismaClient().refreshToken.update({
			where: { id: record.id },
			data: { revoked: true, revokedAt: new Date() }
		});

		// Re-fetch user to get latest roles
		const user = await this.authRepository.findUserWithRolesById(record.userId);
		if (!user || !user.accountActive || !user.canSignIn) {
			throw new AppError(401, customError("AUTH_001"));
		}

		// Re-map roles
		const organisations = user.userOrganisations.map((org) => ({
			organisationId: org.organisationId,
			organisationRole: (org.roles[0]?.role?.name as OrganisationRoleName) ?? "Member",
		}));
		const jwtInfo: IdentityJwtInfo = {
			scope: "identity",
			sub: user.id.toString(),
			userId: user.id,
			systemRole: (user.systemRole?.name as SystemRoleName) || null,
			role: (user.primaryRole?.name as RoleName) || "FARMER",
			organisations,
		};
		const accessToken = signIdentityJwt(jwtInfo);

		// Issue new refresh token
		const rawRefreshToken = randomBytes(32).toString("hex");
		const newTokenHash = this.hashToken(rawRefreshToken);
		await this.authRepository.getPrismaClient().refreshToken.create({
			data: {
				tokenHash: newTokenHash,
				userId: record.userId,
				deviceId: record.deviceId,
				expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
			}
		});

		return { accessToken, refreshToken: rawRefreshToken };
	}`;

service = service.replace(
	/async login[\s\S]*?async refresh[\s\S]*?refreshToken: rawRefreshToken };\s*}/,
	loginReplacement
);
fs.writeFileSync(servicePath, service);

console.log('Fixed TypeScript errors.');
