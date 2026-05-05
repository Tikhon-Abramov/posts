export type UserRole = 'USER' | 'ADMIN';

export interface AuthUser {
  id: number;
  nickname: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
  hasPremium: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  nickname: string;
  email: string;
  password: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}