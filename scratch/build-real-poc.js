const fs = require('fs');

const repoPath = 'src/modules/auth/auth.repository.ts';
let repo = fs.readFileSync(repoPath, 'utf8');
const method = `	async findUserWithRolesByEmail(email: string) {
		return prisma.user.findUnique({
			where: { email },
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
repo = repo.replace('async findUserByEmail', method + '	async findUserByEmail');
fs.writeFileSync(repoPath, repo);

const servicePath = 'src/modules/auth/auth.service.ts';
let service = fs.readFileSync(servicePath, 'utf8');

// replace imports at top
service = service.replace(
	'import type { JwtPayload, LoginRequestBody } from "./auth.types";',
	`import type { JwtPayload, LoginRequestBody, IdentityJwtInfo, SystemRoleName, RoleName } from "./auth.types";
import { signIdentityJwt } from "../../lib/jwt";
import bcrypt from "bcryptjs";`
);

// replace login and getMe
const loginReplacement = `	async login(payload: LoginRequestBody): Promise<{ accessToken: string, refreshToken: string }> {
		const user = await this.authRepository.findUserWithRolesByEmail(payload.email);
		if (!user || !user.accountActive || !user.canSignIn) {
			throw new AppError(401, customError("AUTH_001"));
		}

		// Verify password using bcrypt
		const isValid = await bcrypt.compare(payload.password, user.passwordHash);
		if (!isValid) throw new AppError(401, customError("AUTH_001"));

		// Map organisation roles
		const organisations = user.userOrganisations.map((org) => {
			return {
				organisationId: org.organisationId,
				organisationRole: org.roles[0]?.role?.name ?? "Member",
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
		const user = await this.authRepository.findUserWithRolesByEmail(
            (await this.authRepository.getPrismaClient().user.findUnique({where: {id: record.userId}}))!.email
        );
		if (!user || !user.accountActive || !user.canSignIn) {
			throw new AppError(401, customError("AUTH_001"));
		}

		// Re-map roles
		const organisations = user.userOrganisations.map((org) => ({
			organisationId: org.organisationId,
			organisationRole: org.roles[0]?.role?.name ?? "Member",
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

console.log('POC real implementation applied.');
