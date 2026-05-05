import { baseApi } from '../../../shared/api/baseApi';
import type {
    MediaType,
    Post,
    PostVisibility,
} from '../../post/model/postTypes';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type RequestStatusFilter = 'ALL' | RequestStatus;
export type MediaFilter = 'ALL' | MediaType;

export interface AdminContentRequest {
    id: number;
    userId: number;
    userNickname: string;
    title: string;
    description: string;
    suggestedVisibility: PostVisibility;
    mediaType: MediaType;
    fileName: string;
    fileSize: number;
    fileUrl?: string | null;
    previewUrl?: string | null;
    status: RequestStatus;
    createdAt: string;
    reviewedAt?: string | null;
    publishedPostId?: number | null;
}

export interface AdminContentRequestsParams {
    cursor?: string | null;
    page?: number;
    limit?: number;
    search?: string;
    status?: RequestStatusFilter;
    mediaType?: MediaFilter;
}

export interface AdminContentRequestsResponse {
    items: AdminContentRequest[];
    requests: AdminContentRequest[];
    nextCursor: string | null;
    hasMore: boolean;
    page: number;
    totalPages: number;
}

export interface AdminContentRequestsStats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    imagesCount: number;
    videosCount: number;
}

interface ApproveContentRequestDto {
    requestId: number;
    visibility: PostVisibility;
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

export const adminContentRequestApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAdminContentRequests: builder.query<
            AdminContentRequestsResponse,
            AdminContentRequestsParams
        >({
            query: ({
                        cursor = null,
                        page,
                        limit = 12,
                        search = '',
                        status = 'ALL',
                        mediaType = 'ALL',
                    }) => ({
                url: '/admin/content-requests',
                params: removeEmptyParams({
                    cursor,
                    page,
                    limit,
                    search,
                    status,
                    mediaType,
                }),
            }),

            transformResponse: (response: AdminContentRequestsResponse) => ({
                ...response,
                requests: response.requests || response.items,
            }),

            providesTags: (result) => [
                { type: 'ContentRequest', id: 'ADMIN_LIST' },
                ...(result?.items || []).map((request) => ({
                    type: 'ContentRequest' as const,
                    id: request.id,
                })),
            ],
        }),

        getAdminContentRequestsStats: builder.query<
            AdminContentRequestsStats,
            void
        >({
            query: () => '/admin/content-requests/stats',

            providesTags: [{ type: 'ContentRequest', id: 'ADMIN_STATS' }],
        }),

        approveContentRequest: builder.mutation<
            { message: string; post: Post },
            ApproveContentRequestDto
        >({
            query: ({ requestId, visibility }) => ({
                url: `/admin/content-requests/${requestId}/approve`,
                method: 'POST',
                body: {
                    visibility,
                },
            }),

            invalidatesTags: (_result, _error, arg) => [
                { type: 'ContentRequest', id: arg.requestId },
                { type: 'ContentRequest', id: 'ADMIN_LIST' },
                { type: 'ContentRequest', id: 'ADMIN_STATS' },
                { type: 'Post', id: 'ADMIN_LIST' },
                { type: 'Post', id: 'ADMIN_STATS' },
                { type: 'Post', id: 'LIST' },
                'Notification',
            ],
        }),

        rejectContentRequest: builder.mutation<{ message: string }, number>({
            query: (requestId) => ({
                url: `/admin/content-requests/${requestId}/reject`,
                method: 'POST',
            }),

            invalidatesTags: (_result, _error, requestId) => [
                { type: 'ContentRequest', id: requestId },
                { type: 'ContentRequest', id: 'ADMIN_LIST' },
                { type: 'ContentRequest', id: 'ADMIN_STATS' },
                'Notification',
            ],
        }),

        deleteContentRequest: builder.mutation<{ message: string }, number>({
            query: (requestId) => ({
                url: `/admin/content-requests/${requestId}`,
                method: 'DELETE',
            }),

            invalidatesTags: (_result, _error, requestId) => [
                { type: 'ContentRequest', id: requestId },
                { type: 'ContentRequest', id: 'ADMIN_LIST' },
                { type: 'ContentRequest', id: 'ADMIN_STATS' },
            ],
        }),
    }),
});

export const {
    useGetAdminContentRequestsQuery,
    useGetAdminContentRequestsStatsQuery,
    useApproveContentRequestMutation,
    useRejectContentRequestMutation,
    useDeleteContentRequestMutation,
} = adminContentRequestApi;