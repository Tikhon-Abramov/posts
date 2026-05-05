import { baseApi } from '../../../shared/api/baseApi';
import type { Post, PostVisibility } from '../../post/model/postTypes';
import {
    buildMockCursorResponse,
    createMockError,
    createMockImageUrl,
    createMockNotification,
    delay,
    filterMockContentRequests,
    getCurrentMockUser,
    getMockContentRequests,
    getMockContentRequestsStats,
    getMockPosts,
    getMockUsers,
    saveMockContentRequests,
    saveMockPosts,
    type MediaFilter,
    type MockContentRequest,
    type MockContentRequestsStats,
    type RequestStatusFilter,
} from '../../../shared/lib/mockStorage';

interface AdminContentRequestsParams {
    cursor?: string | null;
    page?: number;
    limit?: number;
    search?: string;
    status?: RequestStatusFilter;
    mediaType?: MediaFilter;
}

interface AdminContentRequestsResponse {
    items: MockContentRequest[];
    requests: MockContentRequest[];
    nextCursor: string | null;
    hasMore: boolean;
    page: number;
    totalPages: number;
}

interface ApproveContentRequestDto {
    requestId: number;
    visibility: PostVisibility;
}

const USE_MOCK_ADMIN_CONTENT_REQUESTS =
    import.meta.env.VITE_USE_MOCK_ADMIN_CONTENT_REQUESTS !== 'false';

const MOCK_VIDEO_URL =
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

export const adminContentRequestApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAdminContentRequests: builder.query<
            AdminContentRequestsResponse,
            AdminContentRequestsParams
        >({
            async queryFn(
                {
                    cursor = null,
                    page,
                    limit = 12,
                    search = '',
                    status = 'ALL',
                    mediaType = 'ALL',
                },
                _api,
                _extraOptions,
                baseQuery
            ) {
                if (!USE_MOCK_ADMIN_CONTENT_REQUESTS) {
                    const result = await baseQuery({
                        url: '/admin/content-requests',
                        params: {
                            cursor,
                            page,
                            limit,
                            search,
                            status,
                            mediaType,
                        },
                    });

                    if (result.error) {
                        return {
                            error: result.error,
                        };
                    }

                    const data = result.data as AdminContentRequestsResponse;

                    return {
                        data: {
                            ...data,
                            requests: data.requests || data.items,
                        },
                    };
                }

                await delay(120);

                const admin = getCurrentMockUser();

                if (!admin) {
                    return {
                        error: createMockError(401, 'Нужно войти в аккаунт.'),
                    };
                }

                if (admin.role !== 'ADMIN') {
                    return {
                        error: createMockError(403, 'Доступ только для администратора.'),
                    };
                }

                const filteredRequests = filterMockContentRequests({
                    status,
                    mediaType,
                    search,
                });

                const response = buildMockCursorResponse({
                    items: filteredRequests,
                    cursor,
                    page,
                    limit,
                });

                return {
                    data: {
                        ...response,
                        requests: response.items,
                    },
                };
            },
        }),

        getAdminContentRequestsStats: builder.query<
            MockContentRequestsStats,
            void
        >({
            async queryFn(_arg, _api, _extraOptions, baseQuery) {
                if (!USE_MOCK_ADMIN_CONTENT_REQUESTS) {
                    const result = await baseQuery('/admin/content-requests/stats');

                    if (result.error) {
                        return {
                            error: result.error,
                        };
                    }

                    return {
                        data: result.data as MockContentRequestsStats,
                    };
                }

                await delay(80);

                const admin = getCurrentMockUser();

                if (!admin) {
                    return {
                        error: createMockError(401, 'Нужно войти в аккаунт.'),
                    };
                }

                if (admin.role !== 'ADMIN') {
                    return {
                        error: createMockError(403, 'Доступ только для администратора.'),
                    };
                }

                return {
                    data: getMockContentRequestsStats(),
                };
            },
        }),

        approveContentRequest: builder.mutation<
            { message: string; post: Post },
            ApproveContentRequestDto
        >({
            async queryFn(
                { requestId, visibility },
                _api,
                _extraOptions,
                baseQuery
            ) {
                if (!USE_MOCK_ADMIN_CONTENT_REQUESTS) {
                    const result = await baseQuery({
                        url: `/admin/content-requests/${requestId}/approve`,
                        method: 'POST',
                        body: {
                            visibility,
                        },
                    });

                    if (result.error) {
                        return {
                            error: result.error,
                        };
                    }

                    return {
                        data: result.data as { message: string; post: Post },
                    };
                }

                await delay(180);

                const admin = getCurrentMockUser();

                if (!admin) {
                    return {
                        error: createMockError(401, 'Нужно войти в аккаунт.'),
                    };
                }

                if (admin.role !== 'ADMIN') {
                    return {
                        error: createMockError(403, 'Доступ только для администратора.'),
                    };
                }

                const requests = getMockContentRequests();
                const request = requests.find((item) => item.id === requestId);

                if (!request) {
                    return {
                        error: createMockError(404, 'Заявка не найдена.'),
                    };
                }

                if (request.status !== 'PENDING') {
                    return {
                        error: createMockError(
                            400,
                            'Можно одобрить только заявку со статусом “На проверке”.'
                        ),
                    };
                }

                const author = getRequestAuthor(request);
                const newPost = createPostFromRequest(request, visibility, author);

                saveMockPosts([newPost, ...getMockPosts()]);

                const updatedRequests: MockContentRequest[] = requests.map(
                    (item): MockContentRequest =>
                        item.id === requestId
                            ? {
                                ...item,
                                status: 'APPROVED',
                                suggestedVisibility: visibility,
                                reviewedAt: new Date().toISOString(),
                                publishedPostId: newPost.id,
                            }
                            : item
                );

                saveMockContentRequests(updatedRequests);

                createMockNotification({
                    userId: request.userId,
                    type: 'REQUEST_APPROVED',
                    title: 'Публикация одобрена',
                    text:
                        visibility === 'PREMIUM'
                            ? `Ваша заявка «${request.title}» опубликована в Premium-ленте.`
                            : `Ваша заявка «${request.title}» опубликована в обычной ленте.`,
                    requestId: request.id,
                    postId: newPost.id,
                });

                return {
                    data: {
                        message: 'Заявка одобрена.',
                        post: newPost,
                    },
                };
            },
        }),

        rejectContentRequest: builder.mutation<
            { message: string },
            number
        >({
            async queryFn(requestId, _api, _extraOptions, baseQuery) {
                if (!USE_MOCK_ADMIN_CONTENT_REQUESTS) {
                    const result = await baseQuery({
                        url: `/admin/content-requests/${requestId}/reject`,
                        method: 'POST',
                    });

                    if (result.error) {
                        return {
                            error: result.error,
                        };
                    }

                    return {
                        data: result.data as { message: string },
                    };
                }

                await delay(160);

                const admin = getCurrentMockUser();

                if (!admin) {
                    return {
                        error: createMockError(401, 'Нужно войти в аккаунт.'),
                    };
                }

                if (admin.role !== 'ADMIN') {
                    return {
                        error: createMockError(403, 'Доступ только для администратора.'),
                    };
                }

                const requests = getMockContentRequests();
                const request = requests.find((item) => item.id === requestId);

                if (!request) {
                    return {
                        error: createMockError(404, 'Заявка не найдена.'),
                    };
                }

                if (request.status !== 'PENDING') {
                    return {
                        error: createMockError(
                            400,
                            'Можно отклонить только заявку со статусом “На проверке”.'
                        ),
                    };
                }

                const updatedRequests: MockContentRequest[] = requests.map(
                    (item): MockContentRequest =>
                        item.id === requestId
                            ? {
                                ...item,
                                status: 'REJECTED',
                                reviewedAt: new Date().toISOString(),
                            }
                            : item
                );

                saveMockContentRequests(updatedRequests);

                createMockNotification({
                    userId: request.userId,
                    type: 'REQUEST_REJECTED',
                    title: 'Публикация отклонена',
                    text: `Ваша заявка «${request.title}» была отклонена администратором.`,
                    requestId: request.id,
                    postId: null,
                });

                return {
                    data: {
                        message: 'Заявка отклонена.',
                    },
                };
            },
        }),

        deleteContentRequest: builder.mutation<{ message: string }, number>({
            async queryFn(requestId, _api, _extraOptions, baseQuery) {
                if (!USE_MOCK_ADMIN_CONTENT_REQUESTS) {
                    const result = await baseQuery({
                        url: `/admin/content-requests/${requestId}`,
                        method: 'DELETE',
                    });

                    if (result.error) {
                        return {
                            error: result.error,
                        };
                    }

                    return {
                        data: result.data as { message: string },
                    };
                }

                await delay(120);

                const admin = getCurrentMockUser();

                if (!admin) {
                    return {
                        error: createMockError(401, 'Нужно войти в аккаунт.'),
                    };
                }

                if (admin.role !== 'ADMIN') {
                    return {
                        error: createMockError(403, 'Доступ только для администратора.'),
                    };
                }

                const requests = getMockContentRequests();
                const hasRequest = requests.some((request) => request.id === requestId);

                if (!hasRequest) {
                    return {
                        error: createMockError(404, 'Заявка не найдена.'),
                    };
                }

                saveMockContentRequests(
                    requests.filter((request) => request.id !== requestId)
                );

                return {
                    data: {
                        message: 'Заявка удалена.',
                    },
                };
            },
        }),
    }),
});

function getRequestAuthor(request: MockContentRequest) {
    const user = getMockUsers().find((item) => item.id === request.userId);

    return {
        id: request.userId,
        nickname: user?.nickname || request.userNickname,
        avatarUrl: user?.avatarUrl || null,
    };
}

function createPostFromRequest(
    request: MockContentRequest,
    visibility: PostVisibility,
    author: {
        id: number;
        nickname: string;
        avatarUrl?: string | null;
    }
): Post {
    const postId = Date.now();

    return {
        id: postId,
        title: request.title,
        description: request.description || '',
        visibility,
        media: [
            {
                id: postId,
                type: request.mediaType,
                url:
                    request.mediaType === 'IMAGE'
                        ? request.previewUrl || createMockImageUrl(request.title)
                        : MOCK_VIDEO_URL,
            },
        ],
        author: {
            id: author.id,
            nickname: author.nickname,
            avatarUrl: author.avatarUrl || null,
        },
        likesCount: 0,
        dislikesCount: 0,
        commentsCount: 0,
        isLikedByMe: false,
        isDislikedByMe: false,
        isSavedByMe: false,
        createdAt: new Date().toISOString(),
    };
}

export const {
    useGetAdminContentRequestsQuery,
    useGetAdminContentRequestsStatsQuery,
    useApproveContentRequestMutation,
    useRejectContentRequestMutation,
    useDeleteContentRequestMutation,
} = adminContentRequestApi;