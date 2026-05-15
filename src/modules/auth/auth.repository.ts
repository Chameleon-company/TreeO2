import { prisma } from "../../lib/prisma";

export class AuthRepository {
  getPrismaClient() {
    return prisma;
  }

  getRoleModelAvailability(): boolean {
    return "role" in prisma;
  }
}
