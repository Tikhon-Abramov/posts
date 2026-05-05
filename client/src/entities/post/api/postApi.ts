import { baseApi } from '../../../shared/api/baseApi';
import type { Post } from '../model/postTypes';
import {
  applyMockUserStateToPosts,
  createMockError,
  createMockImageUrl,
  createMockNotification,
  delay,
  getCurrentMockUser,
  getMockPostInteraction,
  getMockPosts,
  MOCK_STORAGE_KEYS,
  saveMockPosts,
  setMockPostInteraction,
  type MockReaction,
} from '../../../shared/lib/mockStorage';

interface FeedParams {
  type?: 'public' | 'premium';
  page?: number;
  limit?: number;
}

interface FeedResponse {
  posts: Post[];
  page: number;
  totalPages: number;
}

const USE_MOCK_POSTS = import.meta.env.VITE_USE_MOCK_POSTS !== 'false';

const DEFAULT_MOCK_POSTS: Post[] = [
  {
    id: 1,
    title: 'Неоновый вечер',
    description:
        'Обычный публичный пост. Его видят все пользователи, даже без авторизации.',
    visibility: 'PUBLIC',
    media: [
      {
        id: 1,
        type: 'IMAGE',
        url: createMockImageUrl('Неоновый вечер', '#7c3aed', '#2563eb'),
      },
    ],
    author: {
      id: 1,
      nickname: 'admin',
      avatarUrl: null,
    },
    likesCount: 34,
    dislikesCount: 2,
    commentsCount: 8,
    isLikedByMe: false,
    isDislikedByMe: false,
    isSavedByMe: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
  },
  {
    id: 2,
    title: 'Город после дождя',
    description:
        'Пост с фото в ленте. Позже backend будет отдавать настоящие загруженные файлы.',
    visibility: 'PUBLIC',
    media: [
      {
        id: 2,
        type: 'IMAGE',
        url: createMockImageUrl('Город после дождя', '#1d4ed8', '#ef4444'),
      },
    ],
    author: {
      id: 1,
      nickname: 'admin',
      avatarUrl: null,
    },
    likesCount: 58,
    dislikesCount: 4,
    commentsCount: 14,
    isLikedByMe: false,
    isDislikedByMe: false,
    isSavedByMe: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: 3,
    title: 'Premium: закрытый фотосет',
    description:
        'Этот пост должен быть виден только пользователям с активной подпиской.',
    visibility: 'PREMIUM',
    media: [
      {
        id: 3,
        type: 'IMAGE',
        url: createMockImageUrl('Premium фотосет', '#ec4899', '#7c3aed'),
      },
    ],
    author: {
      id: 1,
      nickname: 'admin',
      avatarUrl: null,
    },
    likesCount: 112,
    dislikesCount: 3,
    commentsCount: 27,
    isLikedByMe: false,
    isDislikedByMe: false,
    isSavedByMe: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
  },
  {
    id: 4,
    title: 'Premium: видео-превью',
    description:
        'Временный видео-пост для проверки отображения video-контента на фронте.',
    visibility: 'PREMIUM',
    media: [
      {
        id: 4,
        type: 'VIDEO',
        url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      },
    ],
    author: {
      id: 1,
      nickname: 'admin',
      avatarUrl: null,
    },
    likesCount: 86,
    dislikesCount: 1,
    commentsCount: 19,
    isLikedByMe: false,
    isDislikedByMe: false,
    isSavedByMe: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString(),
  },
  {
    id: 5,
    title: 'Красный акцент',
    description:
        'Еще один публичный пост для проверки ленты, лайков, дизлайков и сохранений.',
    visibility: 'PUBLIC',
    media: [
      {
        id: 5,
        type: 'IMAGE',
        url: createMockImageUrl('Красный акцент', '#ef4444', '#111827'),
      },
    ],
    author: {
      id: 1,
      nickname: 'admin',
      avatarUrl: null,
    },
    likesCount: 21,
    dislikesCount: 0,
    commentsCount: 3,
    isLikedByMe: false,
    isDislikedByMe: false,
    isSavedByMe: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

function getMockPostsWithDefaults() {
  const hasSavedPosts = Boolean(localStorage.getItem(MOCK_STORAGE_KEYS.posts));

  if (!hasSavedPosts) {
    saveMockPosts(DEFAULT_MOCK_POSTS);
    return DEFAULT_MOCK_POSTS;
  }

  return getMockPosts();
}

function paginatePosts(posts: Post[], page = 1, limit = 10): FeedResponse {
  const normalizedPage = Math.max(page, 1);
  const normalizedLimit = Math.max(limit, 1);
  const start = (normalizedPage - 1) * normalizedLimit;
  const end = start + normalizedLimit;

  return {
    posts: posts.slice(start, end),
    page: normalizedPage,
    totalPages: Math.max(Math.ceil(posts.length / normalizedLimit), 1),
  };
}

function updatePostReaction(
    postId: number,
    nextReaction: Exclude<MockReaction, null>
) {
  const user = getCurrentMockUser();

  if (!user) {
    return {
      error: createMockError(401, 'Нужно войти в аккаунт.'),
    };
  }

  const posts = getMockPostsWithDefaults();
  const targetPost = posts.find((post) => post.id === postId);

  if (!targetPost) {
    return {
      error: createMockError(404, 'Пост не найден.'),
    };
  }

  const currentInteraction = getMockPostInteraction(user.id, postId);
  const currentReaction = currentInteraction.reaction;

  const updatedPosts = posts.map((post) => {
    if (post.id !== postId) {
      return post;
    }

    let likesCount = post.likesCount;
    let dislikesCount = post.dislikesCount;

    if (currentReaction === nextReaction) {
      if (nextReaction === 'like') {
        likesCount = Math.max(likesCount - 1, 0);
      } else {
        dislikesCount = Math.max(dislikesCount - 1, 0);
      }
    } else {
      if (currentReaction === 'like') {
        likesCount = Math.max(likesCount - 1, 0);
      }

      if (currentReaction === 'dislike') {
        dislikesCount = Math.max(dislikesCount - 1, 0);
      }

      if (nextReaction === 'like') {
        likesCount += 1;
      } else {
        dislikesCount += 1;
      }
    }

    return {
      ...post,
      likesCount,
      dislikesCount,
    };
  });

  const isNewLike = nextReaction === 'like' && currentReaction !== 'like';

  setMockPostInteraction({
    userId: user.id,
    postId,
    interaction: {
      ...currentInteraction,
      reaction: currentReaction === nextReaction ? null : nextReaction,
    },
  });

  saveMockPosts(updatedPosts);

  if (isNewLike && targetPost.author.id !== user.id) {
    createMockNotification({
      userId: targetPost.author.id,
      type: 'NEW_LIKE',
      title: 'Новый лайк',
      text: `@${user.nickname} поставил лайк вашей публикации «${
          targetPost.title || 'Без названия'
      }».`,
      postId: targetPost.id,
      requestId: null,
    });
  }

  return {
    data: {
      message: nextReaction === 'like' ? 'Лайк обновлен.' : 'Дизлайк обновлен.',
    },
  };
}

function updatePostSaved(postId: number, saved: boolean) {
  const user = getCurrentMockUser();

  if (!user) {
    return {
      error: createMockError(401, 'Нужно войти в аккаунт.'),
    };
  }

  const targetPost = getMockPostsWithDefaults().find((post) => post.id === postId);

  if (!targetPost) {
    return {
      error: createMockError(404, 'Пост не найден.'),
    };
  }

  const currentInteraction = getMockPostInteraction(user.id, postId);

  setMockPostInteraction({
    userId: user.id,
    postId,
    interaction: {
      ...currentInteraction,
      saved,
    },
  });

  return {
    data: {
      message: saved ? 'Пост сохранен.' : 'Пост удален из сохраненных.',
    },
  };
}

export const postApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFeed: builder.query<FeedResponse, FeedParams>({
      async queryFn(
          { type = 'public', page = 1, limit = 10 },
          _api,
          _extraOptions,
          baseQuery
      ) {
        if (!USE_MOCK_POSTS) {
          const result = await baseQuery({
            url: '/posts/feed',
            params: { type, page, limit },
          });

          if (result.error) {
            return { error: result.error };
          }

          return { data: result.data as FeedResponse };
        }

        await delay();

        const posts = getMockPostsWithDefaults();
        const postsWithUserState = applyMockUserStateToPosts(posts);

        const filteredPosts = postsWithUserState
            .filter((post) =>
                type === 'premium'
                    ? post.visibility === 'PREMIUM'
                    : post.visibility === 'PUBLIC'
            )
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

        return {
          data: paginatePosts(filteredPosts, page, limit),
        };
      },
      providesTags: ['Post'],
    }),

    getSavedPosts: builder.query<FeedResponse, { page?: number; limit?: number }>({
      async queryFn({ page = 1, limit = 10 }, _api, _extraOptions, baseQuery) {
        if (!USE_MOCK_POSTS) {
          const result = await baseQuery({
            url: '/posts/saved',
            params: { page, limit },
          });

          if (result.error) {
            return { error: result.error };
          }

          return { data: result.data as FeedResponse };
        }

        await delay();

        const user = getCurrentMockUser();

        if (!user) {
          return {
            error: createMockError(401, 'Нужно войти в аккаунт.'),
          };
        }

        const posts = getMockPostsWithDefaults();
        const postsWithUserState = applyMockUserStateToPosts(posts);

        const savedPosts = postsWithUserState
            .filter((post) => post.isSavedByMe)
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

        return {
          data: paginatePosts(savedPosts, page, limit),
        };
      },
      providesTags: ['Post'],
    }),

    likePost: builder.mutation<{ message: string }, number>({
      async queryFn(postId, _api, _extraOptions, baseQuery) {
        if (!USE_MOCK_POSTS) {
          const result = await baseQuery({
            url: `/posts/${postId}/like`,
            method: 'POST',
          });

          if (result.error) {
            return { error: result.error };
          }

          return { data: result.data as { message: string } };
        }

        await delay(180);

        return updatePostReaction(postId, 'like');
      },
      invalidatesTags: ['Post'],
    }),

    dislikePost: builder.mutation<{ message: string }, number>({
      async queryFn(postId, _api, _extraOptions, baseQuery) {
        if (!USE_MOCK_POSTS) {
          const result = await baseQuery({
            url: `/posts/${postId}/dislike`,
            method: 'POST',
          });

          if (result.error) {
            return { error: result.error };
          }

          return { data: result.data as { message: string } };
        }

        await delay(180);

        return updatePostReaction(postId, 'dislike');
      },
      invalidatesTags: ['Post'],
    }),

    savePost: builder.mutation<{ message: string }, number>({
      async queryFn(postId, _api, _extraOptions, baseQuery) {
        if (!USE_MOCK_POSTS) {
          const result = await baseQuery({
            url: `/posts/${postId}/save`,
            method: 'POST',
          });

          if (result.error) {
            return { error: result.error };
          }

          return { data: result.data as { message: string } };
        }

        await delay(180);

        return updatePostSaved(postId, true);
      },
      invalidatesTags: ['Post'],
    }),

    unsavePost: builder.mutation<{ message: string }, number>({
      async queryFn(postId, _api, _extraOptions, baseQuery) {
        if (!USE_MOCK_POSTS) {
          const result = await baseQuery({
            url: `/posts/${postId}/save`,
            method: 'DELETE',
          });

          if (result.error) {
            return { error: result.error };
          }

          return { data: result.data as { message: string } };
        }

        await delay(180);

        return updatePostSaved(postId, false);
      },
      invalidatesTags: ['Post'],
    }),
  }),
});

export const {
  useGetFeedQuery,
  useGetSavedPostsQuery,
  useLikePostMutation,
  useDislikePostMutation,
  useSavePostMutation,
  useUnsavePostMutation,
} = postApi;