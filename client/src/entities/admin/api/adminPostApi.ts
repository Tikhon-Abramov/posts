import { baseApi } from '../../../shared/api/baseApi';
import type {
    MediaType,
    Post,
    PostVisibility,
} from '../../post/model/postTypes';

type VisibilityFilter = 'ALL' | PostVisibility;
type MediaFilter = 'ALL' | MediaType;
type SortMode = 'RECENT' | 'POPULAR';

export interface AdminPostsParams {
    cursor?: string | null;
    page?: number;
    limit?: number;
    search?: string;
    visibility?: VisibilityFilter;
    mediaType?: MediaFilter;
    sort?: SortMode;
}

export interface AdminPostsResponse {
    items: Post[];
    posts: Post[];
    nextCursor: string | null;
    hasMore: boolean;
    page: number;
    totalPages: number;
}

export interface AdminPostsStats {
    total: number;
    publicPosts: number;
    premiumPosts: number;
    imagesCount: number;
    videosCount: number;
}

export interface CreateAdminPostDto {
    title: string;
    description?: string;
    visibility: PostVisibility;
    file: File;
}

function removeEmptyParams<T extends Record<string, unknown>>(params: T) {
    const result: Record<string, unknown> = {};

    Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
            return;
        }

        result[key] = value;
    });

    return result;
}

export const adminPostApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAdminPosts: builder.query<AdminPostsResponse, AdminPostsParams>({
            query: ({
                        cursor = null,
                        page,
                        limit = 12,
                        search = '',
                        visibility = 'ALL',
                        mediaType = 'ALL',
                        sort = 'RECENT',
                    }) => ({
                url: '/admin/posts',
                params: removeEmptyParams({
                    cursor,
                    page,
                    limit,
                    search,
                    visibility,
                    mediaType,
                    sort,
                }),
            }),

            transformResponse: (response: AdminPostsResponse) => ({
                ...response,
                posts: response.posts || response.items,
            }),

            providesTags: (result) => [
                { type: 'Post', id: 'ADMIN_LIST' },
                ...(result?.items || []).map((post) => ({
                    type: 'Post' as const,
                    id: post.id,
                })),
            ],
        }),

        getAdminPostsStats: builder.query<AdminPostsStats, void>({
            query: () => '/admin/posts/stats',

            providesTags: [{ type: 'Post', id: 'ADMIN_STATS' }],
        }),

        createAdminPost: builder.mutation<Post, CreateAdminPostDto>({
            query: (body) => {
                const formData = new FormData();

                formData.append('title', body.title);
                formData.append('description', body.description || '');
                formData.append('visibility', body.visibility);
                formData.append('media', body.file);

                return {
                    url: '/admin/posts',
                    method: 'POST',
                    body: formData,
                };
            },

            invalidatesTags: [
                { type: 'Post', id: 'ADMIN_LIST' },
                { type: 'Post', id: 'ADMIN_STATS' },
                { type: 'Post', id: 'LIST' },
            ],
        }),

        deleteAdminPost: builder.mutation<{ message: string }, number>({
            query: (postId) => ({
                url: `/admin/posts/${postId}`,
                method: 'DELETE',
            }),

            invalidatesTags: (_result, _error, postId) => [
                { type: 'Post', id: postId },
                { type: 'Post', id: 'ADMIN_LIST' },
                { type: 'Post', id: 'ADMIN_STATS' },
                { type: 'Post', id: 'LIST' },
                'Comment',
                'Notification',
            ],
        }),
    }),
});

export const {
    useGetAdminPostsQuery,
    useGetAdminPostsStatsQuery,
    useCreateAdminPostMutation,
    useDeleteAdminPostMutation,
} = adminPostApi;