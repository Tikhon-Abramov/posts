import { baseApi } from '../../../shared/api/baseApi';
import {
    buildMockCursorResponse,
    createMockError,
    delay,
    filterMockContentRequests,
    getCurrentMockUser,
    getMockContentRequests,
    getMockContentRequestsStats,
    saveMockContentRequests,
    type MediaFilter,
    type MockContentRequest,
    type MockContentRequestsStats,
    type RequestStatusFilter,
} from '../../../shared/lib/mockStorage';

interface ContentRequestsParams {
    cursor?: string | null;
    page?: number;
    limit?: number;
    search?: string;
    status?: RequestStatusFilter;
    mediaType?: MediaFilter;
}

interface ContentRequestsResponse {
    items: MockContentRequest[];
    requests: MockContentRequest[];
    nextCursor: string | null;
    hasMore: boolean;
    page: number;
    totalPages: number;
}

interface CreateContentRequestDto {
    title: string;
    description?: string;
    suggestedVisibility: 'PUBLIC' | 'PREMIUM';
    file: File;
}

const USE_MOCK_CONTENT_REQUESTS =
    import.meta.env.VITE_USE_MOCK_CONTENT_REQUESTS !== 'false';

export const contentRequestApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getMyContentRequests: builder.query<
            ContentRequestsResponse,
            ContentRequestsParams
        >({
            async queryFn(
                {
                    cursor = null,
                    page,
                    limit = 10,
                    search = '',
                    status = 'ALL',
                    mediaType = 'ALL',
                },
                _api,
                _extraOptions,
                baseQuery
            ) {
                if (!USE_MOCK_CONTENT_REQUESTS) {
                    const result = await baseQuery({
                        url: '/content-requests/my',
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

                    const data = result.data as ContentRequestsResponse;

                    return {
                        data: {
                            ...data,
                            requests: data.requests || data.items,
                        },
                    };
                }

                await delay(120);

                const user = getCurrentMockUser();

                if (!user) {
                    return {
                        error: createMockError(401, 'Нужно войти в аккаунт.'),
                    };
                }

                const filteredRequests = filterMockContentRequests({
                    userId: user.id,
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

            providesTags: ['ContentRequest'],
        }),

        getMyContentRequestsStats: builder.query<MockContentRequestsStats, void>({
            async queryFn(_arg, _api, _extraOptions, baseQuery) {
                if (!USE_MOCK_CONTENT_REQUESTS) {
                    const result = await baseQuery('/content-requests/my/stats');

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

                const user = getCurrentMockUser();

                if (!user) {
                    return {
                        error: createMockError(401, 'Нужно войти в аккаунт.'),
                    };
                }

                return {
                    data: getMockContentRequestsStats({
                        userId: user.id,
                    }),
                };
            },

            providesTags: ['ContentRequest'],
        }),

        createContentRequest: builder.mutation<
            MockContentRequest,
            CreateContentRequestDto
        >({
            async queryFn(body, _api, _extraOptions, baseQuery) {
                if (!USE_MOCK_CONTENT_REQUESTS) {
                    const formData = new FormData();

                    formData.append('title', body.title);
                    formData.append('description', body.description || '');
                    formData.append('suggestedVisibility', body.suggestedVisibility);
                    formData.append('media', body.file);

                    const result = await baseQuery({
                        url: '/content-requests',
                        method: 'POST',
                        body: formData,
                    });

                    if (result.error) {
                        return {
                            error: result.error,
                        };
                    }

                    return {
                        data: result.data as MockContentRequest,
                    };
                }

                await delay(180);

                const user = getCurrentMockUser();

                if (!user) {
                    return {
                        error: createMockError(401, 'Чтобы отправить заявку, нужно войти.'),
                    };
                }

                const normalizedTitle = body.title.trim();
                const normalizedDescription = body.description?.trim() || '';

                if (normalizedTitle.length < 3) {
                    return {
                        error: createMockError(
                            400,
                            'Название должно содержать минимум 3 символа.'
                        ),
                    };
                }

                const isImage = body.file.type.startsWith('image/');
                const isVideo = body.file.type.startsWith('video/');

                if (!isImage && !isVideo) {
                    return {
                        error: createMockError(
                            400,
                            'Можно отправить только изображение или видео.'
                        ),
                    };
                }

                const mediaType = isImage ? 'IMAGE' : 'VIDEO';
                const previewUrl = isImage ? await readFileAsDataUrl(body.file) : null;

                const newRequest: MockContentRequest = {
                    id: Date.now(),
                    userId: user.id,
                    userNickname: user.nickname,
                    title: normalizedTitle,
                    description: normalizedDescription,
                    suggestedVisibility: body.suggestedVisibility,
                    mediaType,
                    fileName: body.file.name,
                    fileSize: body.file.size,
                    previewUrl,
                    status: 'PENDING',
                    createdAt: new Date().toISOString(),
                    reviewedAt: null,
                    publishedPostId: null,
                };

                const currentRequests = getMockContentRequests();

                saveMockContentRequests([newRequest, ...currentRequests]);

                return {
                    data: newRequest,
                };
            },

            invalidatesTags: ['ContentRequest'],
        }),
    }),
});

function readFileAsDataUrl(file: File) {
    return new Promise<string | null>((resolve) => {
        const reader = new FileReader();

        reader.onload = () => {
            resolve(typeof reader.result === 'string' ? reader.result : null);
        };

        reader.onerror = () => {
            resolve(null);
        };

        reader.readAsDataURL(file);
    });
}

export const {
    useGetMyContentRequestsQuery,
    useGetMyContentRequestsStatsQuery,
    useCreateContentRequestMutation,
} = contentRequestApi;