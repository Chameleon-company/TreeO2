// User roles matching DB: 1=Farmer, 2=Inspector, 3=Manager, 4=Admin, 5=Developer
export enum UserRole {
  Farmer = 1,
  Inspector = 2,
  Manager = 3,
  Admin = 4,
  Developer = 5,
}

export interface User {
  id: number;
  name: string;
  email: string | null;
  role: UserRole;
  card_id: string | null;
  account_active: boolean;
  can_sign_in: boolean;
  preferred_language: string | null;
  country_id: number | null;
  admin_location_id: number | null;
  created_at: Date;
  updated_at: Date;
}

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

export type ReportStatus = "PENDING" | "PROCESSING" | "COMPLETE" | "FAILED";
