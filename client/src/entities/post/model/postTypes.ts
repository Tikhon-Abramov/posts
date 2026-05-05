export type PostVisibility = 'PUBLIC' | 'PREMIUM';
export type MediaType = 'IMAGE' | 'VIDEO';

export interface PostMedia {
  id: number;
  url: string;
  type: MediaType;
}

export interface PostAuthor {
  id: number;
  nickname: string;
  avatarUrl?: string | null;
}

export interface Post {
  id: number;
  title?: string;
  description?: string;
  visibility: PostVisibility;
  media: PostMedia[];
  author: PostAuthor;
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  isLikedByMe: boolean;
  isDislikedByMe: boolean;
  isSavedByMe: boolean;
  createdAt: string;
}
