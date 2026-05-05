export interface CommentAuthor {
    id: number;
    nickname: string;
    avatarUrl?: string | null;
}

export interface PostComment {
    id: number;
    postId: number;
    author: CommentAuthor;
    text: string;
    createdAt: string;
    updatedAt?: string | null;
}

export interface CommentsResponse {
    comments: PostComment[];
    total: number;
}

export interface CreateCommentDto {
    postId: number;
    text: string;
}