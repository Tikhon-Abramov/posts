/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiGlobe,
  FiImage,
  FiInbox,
  FiLoader,
  FiLock,
  FiUser,
  FiVideo,
  FiXCircle,
} from 'react-icons/fi';

import type { AppDispatch, RootState } from '../app/store';
import { openAuthModal } from '../entities/auth/slice/authSlice';
import { PostCard } from '../entities/post/ui/PostCard';
import type { Post } from '../entities/post/model/postTypes';
import { useGetMyPostsQuery } from '../entities/post/api/postApi';
import { useGetMyContentRequestsQuery } from '../entities/content-request/api/contentRequestApi';
import {
  formatMockFileSize,
  type MockContentRequest,
  type RequestStatus,
} from '../shared/lib/mockStorage';
import { getMediaUrl } from '../shared/lib/getMediaUrl';

type TabMode = 'POSTS' | 'REQUESTS';

type RequestWithFileUrl = MockContentRequest & {
  fileUrl?: string | null;
};

const POSTS_LIMIT = 10;
const REQUESTS_LIMIT = 10;

export function MyPostsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const postsLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const requestsLoadMoreRef = useRef<HTMLDivElement | null>(null);

  const { accessToken, user } = useSelector((state: RootState) => state.auth);
  const isAuth = Boolean(accessToken);

  const [activeTab, setActiveTab] = useState<TabMode>('POSTS');

  const [postsCursor, setPostsCursor] = useState<string | null>(null);
  const [loadedPosts, setLoadedPosts] = useState<Post[]>([]);
  const [postsNextCursor, setPostsNextCursor] = useState<string | null>(null);
  const [postsHasMore, setPostsHasMore] = useState(true);

  const [requestsCursor, setRequestsCursor] = useState<string | null>(null);
  const [loadedRequests, setLoadedRequests] = useState<RequestWithFileUrl[]>([]);
  const [requestsNextCursor, setRequestsNextCursor] = useState<string | null>(
    null
  );
  const [requestsHasMore, setRequestsHasMore] = useState(true);

  const {
    data: postsData,
    isLoading: isPostsLoading,
    isFetching: isPostsFetching,
    isError: isPostsError,
    refetch: refetchPosts,
  } = useGetMyPostsQuery(
    {
      cursor: postsCursor || undefined,
      limit: POSTS_LIMIT,
      search: '',
      mediaType: 'ALL',
      sort: 'RECENT',
    },
    {
      skip: !isAuth,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  const {
    data: requestsData,
    isLoading: isRequestsLoading,
    isFetching: isRequestsFetching,
    isError: isRequestsError,
    refetch: refetchRequests,
  } = useGetMyContentRequestsQuery(
    {
      cursor: requestsCursor || undefined,
      limit: REQUESTS_LIMIT,
      search: '',
      status: 'ALL',
      mediaType: 'ALL',
    },
    {
      skip: !isAuth,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  const dataPosts = useMemo(() => {
    return postsData?.items || postsData?.posts || [];
  }, [postsData]);

  const visiblePosts = useMemo(() => {
    if (loadedPosts.length) {
      return loadedPosts;
    }

    return dataPosts;
  }, [dataPosts, loadedPosts]);

  const dataRequests = useMemo(() => {
    return (requestsData?.items ||
      requestsData?.requests ||
      []) as RequestWithFileUrl[];
  }, [requestsData]);

  const visibleRequests = useMemo(() => {
    if (loadedRequests.length) {
      return loadedRequests;
    }

    return dataRequests;
  }, [dataRequests, loadedRequests]);

  const isFirstPostsLoading =
    (isPostsLoading || isPostsFetching) && visiblePosts.length === 0 && !postsData;

  const isFirstRequestsLoading =
    (isRequestsLoading || isRequestsFetching) &&
    visibleRequests.length === 0 &&
    !requestsData;

  useEffect(() => {
    if (!isAuth) {
      return;
    }

    refetchPosts();
    refetchRequests();
  }, [isAuth, refetchPosts, refetchRequests]);

  useEffect(() => {
    if (!postsData) {
      return;
    }

    const items = postsData.items || postsData.posts || [];

    setLoadedPosts((currentPosts) => {
      if (!postsCursor) {
        return items;
      }

      return mergePostsKeepingFirstPriority(currentPosts, items);
    });

    setPostsNextCursor(postsData.nextCursor);
    setPostsHasMore(postsData.hasMore);
  }, [postsCursor, postsData]);

  useEffect(() => {
    if (!requestsData) {
      return;
    }

    const items = (requestsData.items ||
      requestsData.requests ||
      []) as RequestWithFileUrl[];

    setLoadedRequests((currentRequests) => {
      if (!requestsCursor) {
        return items;
      }

      return mergeRequestsKeepingFirstPriority(currentRequests, items);
    });

    setRequestsNextCursor(requestsData.nextCursor);
    setRequestsHasMore(requestsData.hasMore);
  }, [requestsCursor, requestsData]);

  useEffect(() => {
    const target = postsLoadMoreRef.current;

    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }

        if (!postsHasMore || isPostsFetching || !postsNextCursor) {
          return;
        }

        setPostsCursor(postsNextCursor);
      },
      {
        root: null,
        rootMargin: '700px 0px',
        threshold: 0,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [isPostsFetching, postsHasMore, postsNextCursor]);

  useEffect(() => {
    const target = requestsLoadMoreRef.current;

    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }

        if (!requestsHasMore || isRequestsFetching || !requestsNextCursor) {
          return;
        }

        setRequestsCursor(requestsNextCursor);
      },
      {
        root: null,
        rootMargin: '700px 0px',
        threshold: 0,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [isRequestsFetching, requestsHasMore, requestsNextCursor]);

  const handleOpenAuth = () => {
    dispatch(
      openAuthModal({
        mode: 'login',
        reason: 'Чтобы открыть свои публикации, нужно войти в аккаунт.',
      })
    );
  };

  const refreshPosts = () => {
    setPostsCursor(null);
    setLoadedPosts([]);
    setPostsNextCursor(null);
    setPostsHasMore(true);

    refetchPosts();
  };

  const refreshRequests = () => {
    setRequestsCursor(null);
    setLoadedRequests([]);
    setRequestsNextCursor(null);
    setRequestsHasMore(true);

    refetchRequests();
  };

  if (!isAuth || !user) {
    return (
      <StateCard>
        <FiLock />

        <h1>Нужна авторизация</h1>

        <p>
          Войдите в аккаунт, чтобы смотреть свои опубликованные материалы и
          заявки на публикацию.
        </p>

        <PrimaryButton type="button" onClick={handleOpenAuth}>
          Войти в аккаунт
        </PrimaryButton>
      </StateCard>
    );
  }

  return (
    <Page>
      <Tabs>
        <TabButton
          type="button"
          $active={activeTab === 'POSTS'}
          onClick={() => setActiveTab('POSTS')}
        >
          Опубликованные посты
        </TabButton>

        <TabButton
          type="button"
          $active={activeTab === 'REQUESTS'}
          onClick={() => setActiveTab('REQUESTS')}
        >
          Мои заявки
        </TabButton>
      </Tabs>

      {activeTab === 'POSTS' ? (
        <Section>
          {isFirstPostsLoading ? (
            <StateCard>
              <FiLoader />

              <h2>Загружаем публикации</h2>

              <p>Сейчас покажем опубликованные вами посты.</p>
            </StateCard>
          ) : isPostsError && !visiblePosts.length ? (
            <StateCard>
              <FiAlertCircle />

              <h2>Не удалось загрузить публикации</h2>

              <p>Попробуйте повторить загрузку.</p>

              <PrimaryButton type="button" onClick={refreshPosts}>
                Повторить
              </PrimaryButton>
            </StateCard>
          ) : visiblePosts.length ? (
            <>
              <PostsGrid>
                {visiblePosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </PostsGrid>

              <LoadMoreAnchor ref={postsLoadMoreRef}>
                {postsHasMore ? (
                  <LoadingMore>
                    <FiLoader />
                    <span>Листайте ниже — посты подгрузятся автоматически</span>
                  </LoadingMore>
                ) : (
                  <EndMessage>Вы посмотрели все свои публикации</EndMessage>
                )}
              </LoadMoreAnchor>
            </>
          ) : (
            <EmptyCard>
              <FiUser />

              <h2>Публикаций пока нет</h2>

            </EmptyCard>
          )}
        </Section>
      ) : (
        <Section>
          {isFirstRequestsLoading ? (
            <StateCard>
              <FiLoader />

              <h2>Загружаем заявки</h2>

              <p>Сейчас покажем материалы, которые вы отправили админу.</p>
            </StateCard>
          ) : isRequestsError && !visibleRequests.length ? (
            <StateCard>
              <FiAlertCircle />

              <h2>Не удалось загрузить заявки</h2>

              <p>Попробуйте повторить загрузку.</p>

              <PrimaryButton type="button" onClick={refreshRequests}>
                Повторить
              </PrimaryButton>
            </StateCard>
          ) : visibleRequests.length ? (
            <>
              <RequestsList>
                {visibleRequests.map((request) => {
                  const previewUrl = getRequestPreviewUrl(request);

                  return (
                    <RequestCard key={request.id}>
                      <RequestPreview>
                        {request.mediaType === 'IMAGE' ? (
                          previewUrl ? (
                            <img src={previewUrl} alt={request.title} />
                          ) : (
                            <PreviewPlaceholder>
                              <FiImage />
                              <span>Изображение без preview</span>
                            </PreviewPlaceholder>
                          )
                        ) : previewUrl ? (
                          <video src={previewUrl} controls />
                        ) : (
                          <PreviewPlaceholder>
                            <FiVideo />
                            <span>Видео: {request.fileName}</span>
                          </PreviewPlaceholder>
                        )}

                        <RequestStatusBadge $status={request.status}>
                          {getStatusText(request.status)}
                        </RequestStatusBadge>
                      </RequestPreview>

                      <RequestBody>
                        <RequestTitleRow>
                          <h2>{request.title}</h2>

                          <MediaBadge>
                            {request.mediaType === 'IMAGE' ? (
                              <FiImage />
                            ) : (
                              <FiVideo />
                            )}
                            {request.mediaType === 'IMAGE' ? 'Фото' : 'Видео'}
                          </MediaBadge>
                        </RequestTitleRow>

                        {request.description ? (
                          <Description>{request.description}</Description>
                        ) : null}

                        <RequestInfoGrid>
                          <InfoPill>
                            <FiGlobe />
                            Предложено для:{' '}
                            {request.suggestedVisibility === 'PREMIUM'
                              ? 'Premium'
                              : 'Обычной ленты'}
                          </InfoPill>

                          <InfoPill>
                            <FiImage />
                            Файл: {request.fileName}
                          </InfoPill>

                          <InfoPill>
                            <FiFileSizeIcon />
                            Размер: {formatMockFileSize(request.fileSize)}
                          </InfoPill>

                          <InfoPill>
                            <FiClock />
                            Создано:{' '}
                            {new Date(request.createdAt).toLocaleString('ru-RU')}
                          </InfoPill>

                          {request.reviewedAt && (
                            <InfoPill>
                              <FiCheckCircle />
                              Проверено:{' '}
                              {new Date(request.reviewedAt).toLocaleString(
                                'ru-RU'
                              )}
                            </InfoPill>
                          )}

                          {request.publishedPostId && (
                            <InfoPill>
                              <FiCheckCircle />
                              Опубликовано
                            </InfoPill>
                          )}
                        </RequestInfoGrid>
                      </RequestBody>
                    </RequestCard>
                  );
                })}
              </RequestsList>

              <LoadMoreAnchor ref={requestsLoadMoreRef}>
                {requestsHasMore ? (
                  <LoadingMore>
                    <FiLoader />
                    <span>Листайте ниже — заявки подгрузятся автоматически</span>
                  </LoadingMore>
                ) : (
                  <EndMessage>Вы посмотрели все свои заявки</EndMessage>
                )}
              </LoadMoreAnchor>
            </>
          ) : (
            <EmptyCard>
              <FiInbox />

              <h2>Заявок пока нет</h2>

            </EmptyCard>
          )}
        </Section>
      )}
    </Page>
  );
}

function mergePostsKeepingFirstPriority(first: Post[], second: Post[]) {
  const result: Post[] = [];
  const seen = new Set<number>();

  [...first, ...second].forEach((post) => {
    if (seen.has(post.id)) {
      return;
    }

    seen.add(post.id);
    result.push(post);
  });

  return result;
}

function mergeRequestsKeepingFirstPriority(
  first: RequestWithFileUrl[],
  second: RequestWithFileUrl[]
) {
  const result: RequestWithFileUrl[] = [];
  const seen = new Set<number>();

  [...first, ...second].forEach((request) => {
    if (seen.has(request.id)) {
      return;
    }

    seen.add(request.id);
    result.push(request);
  });

  return result;
}

function getRequestPreviewUrl(request: RequestWithFileUrl) {
  return getMediaUrl(request.previewUrl || request.fileUrl || null);
}

function getStatusText(status: RequestStatus) {
  if (status === 'PENDING') {
    return 'На проверке';
  }

  if (status === 'APPROVED') {
    return 'Одобрено';
  }

  return 'Отклонено';
}

const FiFileSizeIcon = FiImage;

const Page = styled.div`
  display: grid;
  gap: 18px;
`;

const Section = styled.section`
  display: grid;
  gap: 18px;
`;

const Tabs = styled.div`
  padding: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 22px;
  background: rgba(21, 25, 43, 0.76);
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const TabButton = styled.button<{ $active?: boolean }>`
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid
    ${({ theme, $active }) =>
      $active ? 'rgba(139, 92, 246, 0.62)' : theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.82), rgba(37, 99, 235, 0.72))'
      : 'rgba(255, 255, 255, 0.045)'};
  color: ${({ theme }) => theme.colors.text};
  font-weight: 900;
`;

const PostsGrid = styled.div`
  display: grid;
  gap: 18px;
`;

const RequestsList = styled.div`
  display: grid;
  gap: 14px;
`;

const RequestCard = styled.article`
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: rgba(21, 25, 43, 0.84);
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);

  @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
  }
`;

const RequestPreview = styled.div`
  position: relative;
  min-height: 230px;
  background: #05060d;

  img,
  video {
    width: 100%;
    height: 100%;
    min-height: 230px;
    object-fit: cover;
    display: block;
  }
`;

const PreviewPlaceholder = styled.div`
  min-height: 230px;
  background:
    radial-gradient(circle at top left, rgba(124, 58, 237, 0.28), transparent 34%),
    radial-gradient(circle at bottom right, rgba(37, 99, 235, 0.18), transparent 34%),
    #080a12;
  color: ${({ theme }) => theme.colors.primaryHover};
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 10px;
  text-align: center;
  font-weight: 900;

  svg {
    font-size: 44px;
  }

  span {
    max-width: 210px;
    color: ${({ theme }) => theme.colors.textMuted};
    word-break: break-word;
  }
`;

const RequestStatusBadge = styled.div<{ $status: RequestStatus }>`
  position: absolute;
  left: 12px;
  top: 12px;
  min-height: 34px;
  padding: 0 12px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $status }) => {
    if ($status === 'APPROVED') {
      return 'rgba(34, 197, 94, 0.88)';
    }

    if ($status === 'REJECTED') {
      return 'rgba(239, 68, 68, 0.88)';
    }

    return 'rgba(245, 158, 11, 0.92)';
  }};
  color: white;
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  font-weight: 900;
`;

const RequestBody = styled.div`
  min-width: 0;
  padding: 18px;
  display: grid;
  align-content: start;
  gap: 14px;
`;

const RequestTitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;

  h2 {
    margin: 0;
    font-size: 25px;
    letter-spacing: -0.055em;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`;

const MediaBadge = styled.div`
  flex: 0 0 auto;
  min-height: 36px;
  padding: 0 12px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(124, 58, 237, 0.14);
  color: #ddd6fe;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 900;
`;

const Description = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.6;
  white-space: pre-wrap;
`;

const RequestInfoGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const InfoPill = styled.div`
  min-height: 36px;
  padding: 0 11px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(255, 255, 255, 0.04);
  color: ${({ theme }) => theme.colors.textMuted};
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 800;

  svg {
    flex: 0 0 auto;
    color: ${({ theme }) => theme.colors.primaryHover};
  }
`;

const LoadMoreAnchor = styled.div`
  min-height: 80px;
  display: grid;
  place-items: center;
`;

const LoadingMore = styled.div`
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(255, 255, 255, 0.045);
  color: ${({ theme }) => theme.colors.textMuted};
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-size: 13px;
  font-weight: 900;

  svg {
    color: ${({ theme }) => theme.colors.primaryHover};
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const EndMessage = styled.div`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 13px;
  font-weight: 800;
`;

const EmptyCard = styled.section`
  min-height: 420px;
  padding: 30px 22px;
  border: 1px dashed rgba(139, 92, 246, 0.34);
  border-radius: ${({ theme }) => theme.radius.lg};
  background: rgba(21, 25, 43, 0.74);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;

  > svg {
    margin-bottom: 16px;
    color: ${({ theme }) => theme.colors.primaryHover};
    font-size: 44px;
  }

  h2 {
    margin: 0 0 10px;
    font-size: clamp(26px, 4vw, 40px);
    letter-spacing: -0.06em;
  }

  p {
    max-width: 520px;
    margin: 0;
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.6;
  }
`;

const StateCard = styled(EmptyCard)`
  border-style: solid;
`;

const PrimaryButton = styled.button`
  min-height: 46px;
  margin-top: 22px;
  padding: 0 16px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.full};
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  color: white;
  font-weight: 900;

  &:hover {
    filter: brightness(1.08);
  }
`;