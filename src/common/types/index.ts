import { UserRole } from '../enums/userRole.enum';

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string | null;
  role: UserRole;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export type ReportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETE' | 'FAILED';
