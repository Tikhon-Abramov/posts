import type { AuthModalMode } from '../slice/authSlice';

export type UserRole = 'USER' | 'ADMIN';

export interface AuthUser {
  id: number;
  nickname: string;
  email: string;
  avatarUrl?: string | null;
  role: UserRole;
  hasPremium: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;

  authModal: {
    isOpen: boolean;
    mode: AuthModalMode;
    reason: string | null;
  };
}