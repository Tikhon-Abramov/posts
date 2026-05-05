import { baseApi } from '../../../shared/api/baseApi';
import type {
    MediaType,
    Post,
    PostVisibility,
} from '../../post/model/postTypes';
import {
    buildMockCursorResponse,
    createMockError,
    createMockImageUrl,
    delay,
    getCurrentMockUser,
    getMockComments,
    getMockInteractions,
    getMockNotifications,
    getMockPosts,
    normalizeMockSearch,
    saveMockComments,
    saveMockInteractions,
    saveMockNotifications,
    saveMockPosts,
    type MediaFilter,
    type SortMode,
} from '../../../shared/lib/mockStorage';

type VisibilityFilter = 'ALL' | PostVisibility;

interface AdminPostsParams {
    cursor?: string | null;
    page?: number;
    limit?: number;
    search?: string;
    visibility?: VisibilityFilter;
    mediaType?: MediaFilter;
    sort?: SortMode;
}

interface AdminPostsResponse {
    items: Post[];
    posts: Post[];
    nextCursor: string | null;
    hasMore: boolean;
    page: number;
    totalPages: number;
}

interface AdminPostsStats {
    total: number;
    publicPosts: number;
    premiumPosts: number;
    imagesCount: number;
    videosCount: number;
}

interface CreateAdminPostDto {
    title: string;
    description?: string;
    visibility: PostVisibility;
    file: File;
}

const USE_MOCK_ADMIN_POSTS =
    import.meta.env.VITE_USE_MOCK_ADMIN_POSTS !== 'false';

const MOCK_VIDEO_URL =
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

export const adminPostApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAdminPosts: builder.query<AdminPostsResponse, AdminPostsParams>({
            async queryFn(
                {
                    cursor = null,
                    page,
                    limit = 12,
                    search = '',
                    visibility = 'ALL',
                    mediaType = 'ALL',
                    sort = 'RECENT',
                },
                _api,
                _extraOptions,
                baseQuery
            ) {
                if (!USE_MOCK_ADMIN_POSTS) {
                    const result = await baseQuery({
                        url: '/admin/posts',
                        params: {
                            cursor,
                            page,
                            limit,
                            search,
                            visibility,
                            mediaType,
                            sort,
                        },
                    });

                    if (result.error) {
                        return {
                            error: result.error,
                        };
                    }

                    const data = result.data as AdminPostsResponse;

                    return {
                        data: {
                            ...data,
                            posts: data.posts || data.items,
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

                const filteredPosts = filterAdminPosts({
                    search,
                    visibility,
                    mediaType,
                    sort,
                });

                const response = buildMockCursorResponse({
                    items: filteredPosts,
                    cursor,
                    page,
                    limit,
                });

                return {
                    data: {
                        ...response,
                        posts: response.items,
                    },
                };
            },

            providesTags: ['Post'],
        }),

        getAdminPostsStats: builder.query<AdminPostsStats, void>({
            async queryFn(_arg, _api, _extraOptions, baseQuery) {
                if (!USE_MOCK_ADMIN_POSTS) {
                    const result = await baseQuery('/admin/posts/stats');

                    if (result.error) {
                        return {
                            error: result.error,
                        };
                    }

                    return {
                        data: result.data as AdminPostsStats,
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

                const posts = getMockPosts();

                return {
                    data: buildAdminPostsStats(posts),
                };
            },

            providesTags: ['Post'],
        }),

        createAdminPost: builder.mutation<Post, CreateAdminPostDto>({
            async queryFn(body, _api, _extraOptions, baseQuery) {
                if (!USE_MOCK_ADMIN_POSTS) {
                    const formData = new FormData();

                    formData.append('title', body.title);
                    formData.append('description', body.description || '');
                    formData.append('visibility', body.visibility);
                    formData.append('media', body.file);

                    const result = await baseQuery({
                        url: '/admin/posts',
                        method: 'POST',
                        body: formData,
                    });

                    if (result.error) {
                        return {
                            error: result.error,
                        };
                    }

                    return {
                        data: result.data as Post,
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
                        error: createMockError(403, 'Создавать посты может только админ.'),
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
                            'Можно загрузить только изображение или видео.'
                        ),
                    };
                }

                const mediaType: MediaType = isImage ? 'IMAGE' : 'VIDEO';
                const previewUrl = isImage ? await readFileAsDataUrl(body.file) : null;
                const postId = Date.now();

                const newPost: Post = {
                    id: postId,
                    title: normalizedTitle,
                    description: normalizedDescription,
                    visibility: body.visibility,
                    media: [
                        {
                            id: postId,
                            type: mediaType,
                            url:
                                mediaType === 'IMAGE'
                                    ? previewUrl || createMockImageUrl(normalizedTitle)
                                    : MOCK_VIDEO_URL,
                        },
                    ],
                    author: {
                        id: admin.id,
                        nickname: admin.nickname,
                        avatarUrl: admin.avatarUrl || null,
                    },
                    likesCount: 0,
                    dislikesCount: 0,
                    commentsCount: 0,
                    isLikedByMe: false,
                    isDislikedByMe: false,
                    isSavedByMe: false,
                    createdAt: new Date().toISOString(),
                };

                saveMockPosts([newPost, ...getMockPosts()]);

                return {
                    data: newPost,
                };
            },

            invalidatesTags: ['Post'],
        }),

        deleteAdminPost: builder.mutation<{ message: string }, number>({
            async queryFn(postId, _api, _extraOptions, baseQuery) {
                if (!USE_MOCK_ADMIN_POSTS) {
                    const result = await baseQuery({
                        url: `/admin/posts/${postId}`,
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

                await delay(140);

                const admin = getCurrentMockUser();

                if (!admin) {
                    return {
                        error: createMockError(401, 'Нужно войти в аккаунт.'),
                    };
                }

                if (admin.role !== 'ADMIN') {
                    return {
                        error: createMockError(403, 'Удалять посты может только админ.'),
                    };
                }

                const posts = getMockPosts();
                const targetPost = posts.find((post) => post.id === postId);

                if (!targetPost) {
                    return {
                        error: createMockError(404, 'Пост не найден.'),
                    };
                }

                saveMockPosts(posts.filter((post) => post.id !== postId));

                saveMockComments(
                    getMockComments().filter((comment) => comment.postId !== postId)
                );

                const interactions = getMockInteractions();
                const postKey = String(postId);

                const updatedInteractions = Object.fromEntries(
                    Object.entries(interactions).map(([userId, userInteractions]) => {
                        const nextUserInteractions = { ...userInteractions };
                        delete nextUserInteractions[postKey];

                        return [userId, nextUserInteractions];
                    })
                );

                saveMockInteractions(updatedInteractions);

                saveMockNotifications(
                    getMockNotifications().filter(
                        (notification) => notification.postId !== postId
                    )
                );

                return {
                    data: {
                        message: 'Пост удален.',
                    },
                };
            },

            invalidatesTags: ['Post', 'Comment'],
        }),
    }),
});

function filterAdminPosts({
                              search = '',
                              visibility = 'ALL',
                              mediaType = 'ALL',
                              sort = 'RECENT',
                          }: {
    search?: string;
    visibility?: VisibilityFilter;
    mediaType?: MediaFilter;
    sort?: SortMode;
}) {
    const normalizedSearch = normalizeMockSearch(search);

    return getMockPosts()
        .filter((post) => {
            if (visibility !== 'ALL' && post.visibility !== visibility) {
                return false;
            }

            if (mediaType !== 'ALL' && post.media[0]?.type !== mediaType) {
                return false;
            }

            if (!normalizedSearch) {
                return true;
            }

            const title = post.title?.toLowerCase() || '';
            const description = post.description?.toLowerCase() || '';
            const author = post.author.nickname.toLowerCase();
            const id = String(post.id);

            return (
                title.includes(normalizedSearch) ||
                description.includes(normalizedSearch) ||
                author.includes(normalizedSearch) ||
                id.includes(normalizedSearch)
            );
        })
        .sort((a, b) => {
            if (sort === 'POPULAR') {
                const aScore = a.likesCount + a.commentsCount - a.dislikesCount;
                const bScore = b.likesCount + b.commentsCount - b.dislikesCount;

                return bScore - aScore;
            }

            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
}

function buildAdminPostsStats(posts: Post[]): AdminPostsStats {
    return {
        total: posts.length,
        publicPosts: posts.filter((post) => post.visibility === 'PUBLIC').length,
        premiumPosts: posts.filter((post) => post.visibility === 'PREMIUM').length,
        imagesCount: posts.filter((post) => post.media[0]?.type === 'IMAGE').length,
        videosCount: posts.filter((post) => post.media[0]?.type === 'VIDEO').length,
    };
}

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
    useGetAdminPostsQuery,
    useGetAdminPostsStatsQuery,
    useCreateAdminPostMutation,
    useDeleteAdminPostMutation,
} = adminPostApi;