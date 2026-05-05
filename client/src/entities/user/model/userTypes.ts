export interface UserProfile {
  id: number;
  nickname: string;
  email: string;
  avatarUrl?: string | null;
  hasPremium: boolean;
  createdAt: string;
}
