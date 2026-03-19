import { UserRole } from '../enums/userRole.enum';

export interface JwtPayload {
  sub: string;
  email?: string | null;
  name: string;
  role: UserRole;
  projectIds?: number[];
  type: 'access';
}
