/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import {
    FiAlertCircle,
    FiCheckCircle,
    FiClock,
    FiFilter,
    FiGlobe,
    FiImage,
    FiInbox,
    FiLoader,
    FiLock,
    FiSearch,
    FiStar,
    FiUser,
    FiVideo,
    FiXCircle,
} from 'react-icons/fi';

import type { AppDispatch, RootState } from '../app/store';
import { openAuthModal } from '../entities/auth/slice/authSlice';
import { PostCard } from '../entities/post/ui/PostCard';
import type { Post } from '../entities/post/model/postTypes';
import {
    useGetMyPostsQuery,
    useGetMyPostsStatsQuery,
} from '../entities/post/api/postApi';
import {
    useGetMyContentRequestsQuery,
    useGetMyContentRequestsStatsQuery,
} from '../entities/content-request/api/contentRequestApi';
import {
    formatMockFileSize,
    type MediaFilter,
    type MockContentRequest,
    type RequestStatus,
    type RequestStatusFilter,
    type SortMode,
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
    const isPostsFiltersMountedRef = useRef(false);
    const isRequestsFiltersMountedRef = useRef(false);

    const { accessToken, user } = useSelector((state: RootState) => state.auth);
    const isAuth = Boolean(accessToken);

    const [activeTab, setActiveTab] = useState<TabMode>('POSTS');

    const [postsSearchQuery, setPostsSearchQuery] = useState('');
    const [postsMediaFilter, setPostsMediaFilter] = useState<MediaFilter>('ALL');
    const [postsSortMode, setPostsSortMode] = useState<SortMode>('RECENT');

    const [requestsSearchQuery, setRequestsSearchQuery] = useState('');
    const [requestsStatusFilter, setRequestsStatusFilter] =
        useState<RequestStatusFilter>('ALL');
    const [requestsMediaFilter, setRequestsMediaFilter] =
        useState<MediaFilter>('ALL');

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
            search: postsSearchQuery,
            mediaType: postsMediaFilter,
            sort: postsSortMode,
        },
        {
            skip: !isAuth,
            refetchOnMountOrArgChange: true,
        }
    );

    const {
        data: postsStats,
        isLoading: isPostsStatsLoading,
        refetch: refetchPostsStats,
    } = useGetMyPostsStatsQuery(undefined, {
        skip: !isAuth,
        refetchOnMountOrArgChange: true,
    });

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
            search: requestsSearchQuery,
            status: requestsStatusFilter,
            mediaType: requestsMediaFilter,
        },
        {
            skip: !isAuth,
            refetchOnMountOrArgChange: true,
        }
    );

    const {
        data: requestsStats,
        isLoading: isRequestsStatsLoading,
        refetch: refetchRequestsStats,
    } = useGetMyContentRequestsStatsQuery(undefined, {
        skip: !isAuth,
        refetchOnMountOrArgChange: true,
    });

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
        return (requestsData?.items || requestsData?.requests || []) as RequestWithFileUrl[];
    }, [requestsData]);

    const visibleRequests = useMemo(() => {
        if (loadedRequests.length) {
            return loadedRequests;
        }

        return dataRequests;
    }, [dataRequests, loadedRequests]);

    const isFirstPostsLoading =
        (isPostsLoading || isPostsFetching) && visiblePosts.length === 0 && !postsData;

    const isPostsLoadingMore = isPostsFetching && visiblePosts.length > 0;

    const isFirstRequestsLoading =
        (isRequestsLoading || isRequestsFetching) &&
        visibleRequests.length === 0 &&
        !requestsData;

    const isRequestsLoadingMore =
        isRequestsFetching && visibleRequests.length > 0;

    useEffect(() => {
        if (!isAuth) {
            return;
        }

        refetchPosts();
        refetchPostsStats();
        refetchRequests();
        refetchRequestsStats();
    }, [
        isAuth,
        refetchPosts,
        refetchPostsStats,
        refetchRequests,
        refetchRequestsStats,
    ]);

    useEffect(() => {
        if (!postsData) {
            return;
        }

        const items = postsData.items || postsData.posts || [];

        setLoadedPosts((currentPosts) => {
            if (!postsCursor) {
                return mergePostsKeepingFirstPriority(items, currentPosts);
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
                return mergeRequestsKeepingFirstPriority(items, currentRequests);
            }

            return mergeRequestsKeepingFirstPriority(currentRequests, items);
        });

        setRequestsNextCursor(requestsData.nextCursor);
        setRequestsHasMore(requestsData.hasMore);
    }, [requestsCursor, requestsData]);

    useEffect(() => {
        if (!isPostsFiltersMountedRef.current) {
            isPostsFiltersMountedRef.current = true;
            return;
        }

        setPostsCursor(null);
        setLoadedPosts([]);
        setPostsNextCursor(null);
        setPostsHasMore(true);
    }, [postsMediaFilter, postsSearchQuery, postsSortMode]);

    useEffect(() => {
        if (!isRequestsFiltersMountedRef.current) {
            isRequestsFiltersMountedRef.current = true;
            return;
        }

        setRequestsCursor(null);
        setLoadedRequests([]);
        setRequestsNextCursor(null);
        setRequestsHasMore(true);
    }, [requestsMediaFilter, requestsSearchQuery, requestsStatusFilter]);

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

    const resetPostsFilters = () => {
        setPostsSearchQuery('');
        setPostsMediaFilter('ALL');
        setPostsSortMode('RECENT');

        setPostsCursor(null);
        setLoadedPosts([]);
        setPostsNextCursor(null);
        setPostsHasMore(true);

        refetchPosts();
        refetchPostsStats();
    };

    const resetRequestsFilters = () => {
        setRequestsSearchQuery('');
        setRequestsStatusFilter('ALL');
        setRequestsMediaFilter('ALL');

        setRequestsCursor(null);
        setLoadedRequests([]);
        setRequestsNextCursor(null);
        setRequestsHasMore(true);

        refetchRequests();
        refetchRequestsStats();
    };

    const refreshPosts = () => {
        setPostsCursor(null);
        setLoadedPosts([]);
        setPostsNextCursor(null);
        setPostsHasMore(true);

        refetchPosts();
        refetchPostsStats();
    };

    const refreshRequests = () => {
        setRequestsCursor(null);
        setLoadedRequests([]);
        setRequestsNextCursor(null);
        setRequestsHasMore(true);

        refetchRequests();
        refetchRequestsStats();
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
            <StatsGrid>
                <StatCard>
                    <FiFileTextIcon />

                    <div>
                        <strong>{isPostsStatsLoading ? '...' : postsStats?.total || 0}</strong>
                        <span>Публикаций</span>
                    </div>
                </StatCard>

                <StatCard>
                    <FiGlobe />

                    <div>
                        <strong>
                            {isPostsStatsLoading ? '...' : postsStats?.publicPosts || 0}
                        </strong>
                        <span>В обычной ленте</span>
                    </div>
                </StatCard>

                <StatCard>
                    <FiStar />

                    <div>
                        <strong>
                            {isPostsStatsLoading ? '...' : postsStats?.premiumPosts || 0}
                        </strong>
                        <span>В Premium</span>
                    </div>
                </StatCard>

                <StatCard>
                    <FiInbox />

                    <div>
                        <strong>
                            {isRequestsStatsLoading ? '...' : requestsStats?.total || 0}
                        </strong>
                        <span>Заявок</span>
                    </div>
                </StatCard>
            </StatsGrid>

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
                    <Toolbar>
                        <SearchBox>
                            <FiSearch />

                            <input
                                value={postsSearchQuery}
                                placeholder="Поиск по опубликованным постам..."
                                onChange={(event) => setPostsSearchQuery(event.target.value)}
                            />
                        </SearchBox>

                        <Filters>
                            <FilterSelect
                                value={postsMediaFilter}
                                onChange={(event) =>
                                    setPostsMediaFilter(event.target.value as MediaFilter)
                                }
                            >
                                <option value="ALL">Фото и видео</option>
                                <option value="IMAGE">Только фото</option>
                                <option value="VIDEO">Только видео</option>
                            </FilterSelect>

                            <FilterSelect
                                value={postsSortMode}
                                onChange={(event) =>
                                    setPostsSortMode(event.target.value as SortMode)
                                }
                            >
                                <option value="RECENT">Сначала новые</option>
                                <option value="POPULAR">Сначала популярные</option>
                            </FilterSelect>
                        </Filters>

                        <ToolbarActions>
                            <ToolbarButton type="button" onClick={resetPostsFilters}>
                                <FiFilter />
                                Сбросить
                            </ToolbarButton>


                        </ToolbarActions>
                    </Toolbar>

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
                            <FeedMeta>
                                <span>Загружено на странице: {visiblePosts.length}</span>

                                {isPostsLoadingMore && (
                                    <LoadingInline>
                                        <FiLoader />
                                        Подгружаем еще...
                                    </LoadingInline>
                                )}
                            </FeedMeta>

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
                                    <EndMessage>
                                        Вы посмотрели все свои публикации по текущим фильтрам
                                    </EndMessage>
                                )}
                            </LoadMoreAnchor>
                        </>
                    ) : (
                        <EmptyCard>
                            <FiUser />

                            <h2>Публикаций пока нет</h2>

                            <p>
                                Когда админ одобрит вашу заявку или вы опубликуете материал,
                                пост появится здесь.
                            </p>
                        </EmptyCard>
                    )}
                </Section>
            ) : (
                <Section>
                    <RequestStatsGrid>
                        <MiniStatCard>
                            <FiClock />
                            <strong>
                                {isRequestsStatsLoading ? '...' : requestsStats?.pending || 0}
                            </strong>
                            <span>На проверке</span>
                        </MiniStatCard>

                        <MiniStatCard>
                            <FiCheckCircle />
                            <strong>
                                {isRequestsStatsLoading ? '...' : requestsStats?.approved || 0}
                            </strong>
                            <span>Одобрено</span>
                        </MiniStatCard>

                        <MiniStatCard>
                            <FiXCircle />
                            <strong>
                                {isRequestsStatsLoading ? '...' : requestsStats?.rejected || 0}
                            </strong>
                            <span>Отклонено</span>
                        </MiniStatCard>
                    </RequestStatsGrid>

                    <Toolbar>
                        <SearchBox>
                            <FiSearch />

                            <input
                                value={requestsSearchQuery}
                                placeholder="Поиск по заявкам..."
                                onChange={(event) => setRequestsSearchQuery(event.target.value)}
                            />
                        </SearchBox>

                        <Filters>
                            <FilterSelect
                                value={requestsStatusFilter}
                                onChange={(event) =>
                                    setRequestsStatusFilter(
                                        event.target.value as RequestStatusFilter
                                    )
                                }
                            >
                                <option value="ALL">Все статусы</option>
                                <option value="PENDING">На проверке</option>
                                <option value="APPROVED">Одобрено</option>
                                <option value="REJECTED">Отклонено</option>
                            </FilterSelect>

                            <FilterSelect
                                value={requestsMediaFilter}
                                onChange={(event) =>
                                    setRequestsMediaFilter(event.target.value as MediaFilter)
                                }
                            >
                                <option value="ALL">Фото и видео</option>
                                <option value="IMAGE">Только фото</option>
                                <option value="VIDEO">Только видео</option>
                            </FilterSelect>
                        </Filters>

                        <ToolbarActions>
                            <ToolbarButton type="button" onClick={resetRequestsFilters}>
                                <FiFilter />
                                Сбросить
                            </ToolbarButton>


                        </ToolbarActions>
                    </Toolbar>

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
                            <FeedMeta>
                                <span>Загружено на странице: {visibleRequests.length}</span>

                                {isRequestsLoadingMore && (
                                    <LoadingInline>
                                        <FiLoader />
                                        Подгружаем еще...
                                    </LoadingInline>
                                )}
                            </FeedMeta>

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
                                                ) : (
                                                    <DescriptionMuted>Описание не указано</DescriptionMuted>
                                                )}

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
                                    <EndMessage>
                                        Вы посмотрели все свои заявки по текущим фильтрам
                                    </EndMessage>
                                )}
                            </LoadMoreAnchor>
                        </>
                    ) : (
                        <EmptyCard>
                            <FiInbox />

                            <h2>Заявок пока нет</h2>

                            <p>
                                Когда вы отправите фото или видео на проверку, заявка появится
                                здесь.
                            </p>
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

const FiFileTextIcon = FiUser;
const FiFileSizeIcon = FiImage;

const Page = styled.div`
    display: grid;
    gap: 18px;
`;

const Section = styled.section`
    display: grid;
    gap: 18px;
`;

const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;

    @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        grid-template-columns: 1fr;
    }
`;

const StatCard = styled.article`
    padding: 16px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.lg};
    background: rgba(21, 25, 43, 0.78);
    display: flex;
    align-items: center;
    gap: 13px;

    > svg {
        width: 46px;
        height: 46px;
        padding: 12px;
        border-radius: 17px;
        background: rgba(124, 58, 237, 0.14);
        color: ${({ theme }) => theme.colors.primaryHover};
    }

    div {
        min-width: 0;
        display: grid;
        gap: 2px;
    }

    strong {
        font-size: 28px;
        line-height: 1;
        letter-spacing: -0.05em;
    }

    span {
        color: ${({ theme }) => theme.colors.textMuted};
        font-size: 13px;
        font-weight: 800;
    }
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

const Toolbar = styled.div`
    padding: 12px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.lg};
    background: rgba(21, 25, 43, 0.76);
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 10px;

    @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
        grid-template-columns: 1fr;
    }
`;

const SearchBox = styled.div`
    min-width: 0;
    height: 46px;
    padding: 0 14px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.full};
    background: rgba(255, 255, 255, 0.045);
    color: ${({ theme }) => theme.colors.textMuted};
    display: flex;
    align-items: center;
    gap: 10px;

    input {
        width: 100%;
        min-width: 0;
        border: none;
        outline: none;
        background: transparent;
        color: ${({ theme }) => theme.colors.text};
    }
`;

const Filters = styled.div`
    display: flex;
    gap: 8px;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        display: grid;
        grid-template-columns: 1fr;
    }
`;

const FilterSelect = styled.select`
    min-height: 46px;
    padding: 0 13px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.full};
    outline: none;
    background: rgba(255, 255, 255, 0.055);
    color: ${({ theme }) => theme.colors.text};
    font-weight: 800;

    option {
        background: #101322;
        color: white;
    }
`;

const ToolbarActions = styled.div`
    display: flex;
    gap: 8px;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        display: grid;
        grid-template-columns: 1fr;
    }
`;

const ToolbarButton = styled.button`
    min-height: 46px;
    padding: 0 16px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.full};
    background: rgba(255, 255, 255, 0.055);
    color: ${({ theme }) => theme.colors.text};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    font-weight: 900;
`;

const FeedMeta = styled.div`
    padding: 0 4px;
    color: ${({ theme }) => theme.colors.textMuted};
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 13px;
    font-weight: 800;
`;

const LoadingInline = styled.div`
    color: ${({ theme }) => theme.colors.primaryHover};
    display: inline-flex;
    align-items: center;
    gap: 8px;

    svg {
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
`;

const PostsGrid = styled.div`
    display: grid;
    gap: 18px;
`;

const RequestStatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        grid-template-columns: 1fr;
    }
`;

const MiniStatCard = styled.article`
    min-height: 86px;
    padding: 14px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 18px;
    background: rgba(21, 25, 43, 0.76);
    display: grid;
    gap: 5px;

    svg {
        color: ${({ theme }) => theme.colors.primaryHover};
        font-size: 22px;
    }

    strong {
        font-size: 28px;
        line-height: 1;
    }

    span {
        color: ${({ theme }) => theme.colors.textMuted};
        font-size: 13px;
        font-weight: 800;
    }
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

const DescriptionMuted = styled(Description)`
    opacity: 0.68;
    font-style: italic;
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

    > svg {
        animation: none;
    }
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