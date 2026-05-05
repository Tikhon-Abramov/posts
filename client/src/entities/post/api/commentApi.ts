import { baseApi } from '../../../shared/api/baseApi';
import type {
    CommentsResponse,
    CreateCommentDto,
    PostComment,
} from '../model/commentTypes';
import {
    createMockError,
    createMockNotification,
    delay,
    decrementMockPostCommentsCount,
    getCurrentMockUser,
    getMockComments,
    getMockPosts,
    incrementMockPostCommentsCount,
    saveMockComments,
} from '../../../shared/lib/mockStorage';

const USE_MOCK_COMMENTS = import.meta.env.VITE_USE_MOCK_COMMENTS !== 'false';

export const commentApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getPostComments: builder.query<CommentsResponse, number>({
            async queryFn(postId, _api, _extraOptions, baseQuery) {
                if (!USE_MOCK_COMMENTS) {
                    const result = await baseQuery(`/posts/${postId}/comments`);

                    if (result.error) {
                        return {
                            error: result.error,
                        };
                    }

                    return {
                        data: result.data as CommentsResponse,
                    };
                }

                await delay();

                const comments = getMockComments()
                    .filter((comment) => comment.postId === postId)
                    .sort(
                        (a, b) =>
                            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    );

                return {
                    data: {
                        comments,
                        total: comments.length,
                    },
                };
            },
            providesTags: (_result, _error, postId) => [
                {
                    type: 'Comment',
                    id: postId,
                },
            ],
        }),

        createComment: builder.mutation<PostComment, CreateCommentDto>({
            async queryFn(body, _api, _extraOptions, baseQuery) {
                if (!USE_MOCK_COMMENTS) {
                    const result = await baseQuery({
                        url: `/posts/${body.postId}/comments`,
                        method: 'POST',
                        body: {
                            text: body.text,
                        },
                    });

                    if (result.error) {
                        return {
                            error: result.error,
                        };
                    }

                    return {
                        data: result.data as PostComment,
                    };
                }

                await delay();

                const user = getCurrentMockUser();

                if (!user) {
                    return {
                        error: createMockError(401, 'Чтобы написать комментарий, нужно войти.'),
                    };
                }

                const normalizedText = body.text.trim();

                if (normalizedText.length < 2) {
                    return {
                        error: createMockError(
                            400,
                            'Комментарий должен содержать минимум 2 символа.'
                        ),
                    };
                }

                if (normalizedText.length > 600) {
                    return {
                        error: createMockError(
                            400,
                            'Комментарий не должен быть длиннее 600 символов.'
                        ),
                    };
                }

                const targetPost = getMockPosts().find((post) => post.id === body.postId);

                if (!targetPost) {
                    return {
                        error: createMockError(404, 'Пост не найден.'),
                    };
                }

                const newComment: PostComment = {
                    id: Date.now(),
                    postId: body.postId,
                    author: {
                        id: user.id,
                        nickname: user.nickname,
                        avatarUrl: user.avatarUrl,
                    },
                    text: normalizedText,
                    createdAt: new Date().toISOString(),
                    updatedAt: null,
                };

                const currentComments = getMockComments();

                saveMockComments([...currentComments, newComment]);
                incrementMockPostCommentsCount(body.postId);

                if (targetPost.author.id !== user.id) {
                    createMockNotification({
                        userId: targetPost.author.id,
                        type: 'NEW_COMMENT',
                        title: 'Новый комментарий',
                        text: `@${user.nickname} оставил комментарий к вашей публикации «${
                            targetPost.title || 'Без названия'
                        }».`,
                        postId: targetPost.id,
                        requestId: null,
                    });
                }

                return {
                    data: newComment,
                };
            },
            invalidatesTags: (_result, _error, body) => [
                {
                    type: 'Comment',
                    id: body.postId,
                },
                'Post',
            ],
        }),

        deleteComment: builder.mutation<
            { message: string },
            { postId: number; commentId: number }
        >({
            async queryFn({ postId, commentId }, _api, _extraOptions, baseQuery) {
                if (!USE_MOCK_COMMENTS) {
                    const result = await baseQuery({
                        url: `/posts/${postId}/comments/${commentId}`,
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

                await delay();

                const user = getCurrentMockUser();

                if (!user) {
                    return {
                        error: createMockError(401, 'Чтобы удалить комментарий, нужно войти.'),
                    };
                }

                const comments = getMockComments();

                const targetComment = comments.find(
                    (comment) => comment.id === commentId && comment.postId === postId
                );

                if (!targetComment) {
                    return {
                        error: createMockError(404, 'Комментарий не найден.'),
                    };
                }

                const canDelete =
                    targetComment.author.id === user.id || user.role === 'ADMIN';

                if (!canDelete) {
                    return {
                        error: createMockError(
                            403,
                            'Можно удалить только свой комментарий или комментарий как админ.'
                        ),
                    };
                }

                const updatedComments = comments.filter(
                    (comment) => comment.id !== commentId
                );

                saveMockComments(updatedComments);
                decrementMockPostCommentsCount(postId);

                return {
                    data: {
                        message: 'Комментарий удален.',
                    },
                };
            },
            invalidatesTags: (_result, _error, arg) => [
                {
                    type: 'Comment',
                    id: arg.postId,
                },
                'Post',
            ],
        }),
    }),
});

export const {
    useGetPostCommentsQuery,
    useCreateCommentMutation,
    useDeleteCommentMutation,
} = commentApi;