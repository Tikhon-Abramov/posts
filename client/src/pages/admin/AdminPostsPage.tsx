import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import {
    FiAlertCircle,
    FiExternalLink,
    FiFileText,
    FiFilter,
    FiGlobe,
    FiHeart,
    FiImage,
    FiLoader,
    FiMessageCircle,
    FiRefreshCw,
    FiSearch,
    FiStar,
    FiTrash2,
    FiUser,
    FiVideo,
} from 'react-icons/fi';

import type {
    Post,
    PostVisibility,
} from '../../entities/post/model/postTypes';
import {
    useDeleteAdminPostMutation,
    useGetAdminPostsQuery,
    useGetAdminPostsStatsQuery,
} from '../../entities/admin/api/adminPostApi';
import type { MediaFilter, SortMode } from '../../shared/lib/mockStorage';
import { getMediaUrl } from '../../shared/lib/getMediaUrl';

type VisibilityFilter = 'ALL' | PostVisibility;

const POSTS_LIMIT = 12;

export function AdminPostsPage() {
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [visibilityFilter, setVisibilityFilter] =
        useState<VisibilityFilter>('ALL');
    const [mediaFilter, setMediaFilter] = useState<MediaFilter>('ALL');
    const [sortMode, setSortMode] = useState<SortMode>('RECENT');

    const [cursor, setCursor] = useState<string | null>(null);
    const [loadedPosts, setLoadedPosts] = useState<Post[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const {
        data,
        isLoading,
        isFetching,
        isError,
        refetch: refetchPosts,
    } = useGetAdminPostsQuery({
        cursor,
        limit: POSTS_LIMIT,
        search: searchQuery,
        visibility: visibilityFilter,
        mediaType: mediaFilter,
        sort: sortMode,
    });

    const {
        data: stats,
        isLoading: isStatsLoading,
        refetch: refetchStats,
    } = useGetAdminPostsStatsQuery();

    const [deleteAdminPost, { isLoading: isDeleting }] =
        useDeleteAdminPostMutation();

    const isFirstLoading = isLoading && loadedPosts.length === 0;
    const isLoadingMore = isFetching && loadedPosts.length > 0;

    useEffect(() => {
        if (!data) {
            return;
        }

        const items = data.items || data.posts || [];

        setLoadedPosts((currentPosts) => {
            if (!cursor) {
                return items;
            }

            return mergePostsKeepingOrder(currentPosts, items);
        });

        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
    }, [cursor, data]);

    useEffect(() => {
        setCursor(null);
        setLoadedPosts([]);
        setNextCursor(null);
        setHasMore(true);
    }, [mediaFilter, searchQuery, sortMode, visibilityFilter]);

    useEffect(() => {
        const target = loadMoreRef.current;

        if (!target) {
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) {
                    return;
                }

                if (!hasMore || isFetching || !nextCursor) {
                    return;
                }

                setCursor(nextCursor);
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
    }, [hasMore, isFetching, nextCursor]);

    const resetFilters = () => {
        setSearchQuery('');
        setVisibilityFilter('ALL');
        setMediaFilter('ALL');
        setSortMode('RECENT');
    };

    const handleRefresh = () => {
        setCursor(null);
        setLoadedPosts([]);
        setNextCursor(null);
        setHasMore(true);

        refetchPosts();
        refetchStats();
    };

    const handleDeletePost = async (post: Post) => {
        const isConfirmed = window.confirm(
            `Удалить пост «${post.title || 'Без названия'}»? Комментарии, реакции, сохранения и уведомления к нему тоже будут очищены.`
        );

        if (!isConfirmed) {
            return;
        }

        try {
            await deleteAdminPost(post.id).unwrap();

            setLoadedPosts((currentPosts) =>
                currentPosts.filter((item) => item.id !== post.id)
            );

            refetchPosts();
            refetchStats();
        } catch (error) {
            window.alert(getErrorMessage(error, 'Не удалось удалить пост.'));
        }
    };

    return (
        <Page>
            <Hero>
                <HeroContent>
                    <Eyebrow>Admin</Eyebrow>

                    <Title>Посты</Title>

                    <Subtitle>
                        Управление опубликованными материалами. Список постов подгружается
                        частями, а статистика берется отдельным запросом, поэтому счетчики
                        не зависят от количества уже загруженных карточек.
                    </Subtitle>
                </HeroContent>

                <HeroActions>
                    <CreateLink to="/admin/posts/create">
                        <FiFileText />
                        Создать пост
                    </CreateLink>

                    <RefreshButton type="button" onClick={handleRefresh}>
                        <FiRefreshCw />
                        Обновить
                    </RefreshButton>
                </HeroActions>
            </Hero>

            <StatsGrid>
                <StatCard>
                    <FiFileText />
                    <div>
                        <strong>{isStatsLoading ? '...' : stats?.total || 0}</strong>
                        <span>Всего постов</span>
                    </div>
                </StatCard>

                <StatCard>
                    <FiGlobe />
                    <div>
                        <strong>{isStatsLoading ? '...' : stats?.publicPosts || 0}</strong>
                        <span>Обычная лента</span>
                    </div>
                </StatCard>

                <StatCard>
                    <FiStar />
                    <div>
                        <strong>{isStatsLoading ? '...' : stats?.premiumPosts || 0}</strong>
                        <span>Premium</span>
                    </div>
                </StatCard>

                <StatCard>
                    <FiVideo />
                    <div>
                        <strong>{isStatsLoading ? '...' : stats?.videosCount || 0}</strong>
                        <span>Видео</span>
                    </div>
                </StatCard>
            </StatsGrid>

            <Toolbar>
                <SearchBox>
                    <FiSearch />

                    <input
                        value={searchQuery}
                        placeholder="Поиск по ID, названию, описанию или автору..."
                        onChange={(event) => setSearchQuery(event.target.value)}
                    />
                </SearchBox>

                <Filters>
                    <FilterSelect
                        value={visibilityFilter}
                        onChange={(event) =>
                            setVisibilityFilter(event.target.value as VisibilityFilter)
                        }
                    >
                        <option value="ALL">Все ленты</option>
                        <option value="PUBLIC">Обычная</option>
                        <option value="PREMIUM">Premium</option>
                    </FilterSelect>

                    <FilterSelect
                        value={mediaFilter}
                        onChange={(event) =>
                            setMediaFilter(event.target.value as MediaFilter)
                        }
                    >
                        <option value="ALL">Фото и видео</option>
                        <option value="IMAGE">Только фото</option>
                        <option value="VIDEO">Только видео</option>
                    </FilterSelect>

                    <FilterSelect
                        value={sortMode}
                        onChange={(event) => setSortMode(event.target.value as SortMode)}
                    >
                        <option value="RECENT">Сначала новые</option>
                        <option value="POPULAR">Сначала популярные</option>
                    </FilterSelect>
                </Filters>

                <ResetButton type="button" onClick={resetFilters}>
                    <FiFilter />
                    Сбросить
                </ResetButton>
            </Toolbar>

            {isFirstLoading ? (
                <StateCard>
                    <FiLoader />

                    <h2>Загружаем посты</h2>

                    <p>Сейчас покажем опубликованные материалы.</p>
                </StateCard>
            ) : isError && !loadedPosts.length ? (
                <StateCard>
                    <FiAlertCircle />

                    <h2>Не удалось загрузить посты</h2>

                    <p>Попробуйте повторить загрузку.</p>

                    <PrimaryButton type="button" onClick={handleRefresh}>
                        Повторить
                    </PrimaryButton>
                </StateCard>
            ) : loadedPosts.length ? (
                <>
                    <FeedMeta>
                        <span>Загружено на странице: {loadedPosts.length}</span>

                        {isLoadingMore && (
                            <LoadingInline>
                                <FiLoader />
                                Подгружаем еще...
                            </LoadingInline>
                        )}
                    </FeedMeta>

                    <PostsList>
                        {loadedPosts.map((post) => {
                            const firstMedia = post.media[0];
                            const mediaUrl = getMediaUrl(firstMedia?.url);
                            const authorAvatarUrl = getMediaUrl(post.author.avatarUrl);

                            return (
                                <PostRow key={post.id}>
                                    <Preview>
                                        {firstMedia?.type === 'IMAGE' && mediaUrl ? (
                                            <img src={mediaUrl} alt={post.title || 'Пост'} />
                                        ) : firstMedia?.type === 'VIDEO' && mediaUrl ? (
                                            <MediaVideo src={mediaUrl} controls />
                                        ) : (
                                            <VideoPreview>
                                                {firstMedia?.type === 'VIDEO' ? <FiVideo /> : <FiImage />}
                                                <span>Медиа недоступно</span>
                                            </VideoPreview>
                                        )}

                                        <VisibilityBadge $visibility={post.visibility}>
                                            {post.visibility === 'PREMIUM' ? (
                                                <>
                                                    <FiStar />
                                                    Premium
                                                </>
                                            ) : (
                                                <>
                                                    <FiGlobe />
                                                    Public
                                                </>
                                            )}
                                        </VisibilityBadge>
                                    </Preview>

                                    <PostBody>
                                        <PostTop>
                                            <PostTitleBlock>
                                                <PostTitle>{post.title || 'Без названия'}</PostTitle>

                                                <PostMeta>
                                                    ID {post.id} •{' '}
                                                    {new Date(post.createdAt).toLocaleString('ru-RU')}
                                                </PostMeta>
                                            </PostTitleBlock>

                                            <MediaBadge>
                                                {firstMedia?.type === 'VIDEO' ? <FiVideo /> : <FiImage />}
                                                {firstMedia?.type === 'VIDEO' ? 'Видео' : 'Фото'}
                                            </MediaBadge>
                                        </PostTop>

                                        {post.description ? (
                                            <Description>{post.description}</Description>
                                        ) : (
                                            <DescriptionMuted>Описание не указано</DescriptionMuted>
                                        )}

                                        <AuthorBlock>
                                            <AuthorAvatar>
                                                {authorAvatarUrl ? (
                                                    <img
                                                        src={authorAvatarUrl}
                                                        alt={post.author.nickname}
                                                    />
                                                ) : (
                                                    <FiUser />
                                                )}
                                            </AuthorAvatar>

                                            <div>
                                                <strong>@{post.author.nickname}</strong>
                                                <span>Автор публикации</span>
                                            </div>
                                        </AuthorBlock>

                                        <InfoGrid>
                                            <InfoItem>
                                                <FiHeart />
                                                <span>{post.likesCount} лайков</span>
                                            </InfoItem>

                                            <InfoItem>
                                                <FiAlertCircle />
                                                <span>{post.dislikesCount} дизлайков</span>
                                            </InfoItem>

                                            <InfoItem>
                                                <FiMessageCircle />
                                                <span>{post.commentsCount} комментариев</span>
                                            </InfoItem>
                                        </InfoGrid>

                                        <Actions>
                                            <OpenPostLink to={`/posts/${post.id}`}>
                                                <FiExternalLink />
                                                Открыть на сайте
                                            </OpenPostLink>

                                            <DeleteButton
                                                type="button"
                                                disabled={isDeleting}
                                                onClick={() => handleDeletePost(post)}
                                            >
                                                <FiTrash2 />
                                                {isDeleting ? 'Удаляем...' : 'Удалить'}
                                            </DeleteButton>
                                        </Actions>
                                    </PostBody>
                                </PostRow>
                            );
                        })}
                    </PostsList>

                    <LoadMoreAnchor ref={loadMoreRef}>
                        {hasMore ? (
                            <LoadingMore>
                                <FiLoader />
                                <span>Листайте ниже — посты подгрузятся автоматически</span>
                            </LoadingMore>
                        ) : (
                            <EndMessage>
                                Вы посмотрели все посты по текущим фильтрам
                            </EndMessage>
                        )}
                    </LoadMoreAnchor>
                </>
            ) : (
                <EmptyCard>
                    <FiFileText />

                    <h2>Постов не найдено</h2>

                    <p>
                        Создайте первый пост, одобрите пользовательскую заявку или измените
                        текущие фильтры.
                    </p>

                    <Actions>
                        <PrimaryLink to="/admin/posts/create">Создать пост</PrimaryLink>

                        <PrimaryButton type="button" onClick={resetFilters}>
                            Сбросить фильтры
                        </PrimaryButton>
                    </Actions>
                </EmptyCard>
            )}
        </Page>
    );
}

function mergePostsKeepingOrder(first: Post[], second: Post[]) {
    const map = new Map<number, Post>();

    [...first, ...second].forEach((post) => {
        map.set(post.id, post);
    });

    return Array.from(map.values());
}

function getErrorMessage(error: unknown, fallback: string) {
    if (
        typeof error === 'object' &&
        error !== null &&
        'data' in error &&
        typeof (error as { data?: { message?: unknown } }).data?.message === 'string'
    ) {
        return (error as { data: { message: string } }).data.message;
    }

    return fallback;
}

const Page = styled.div`
    display: grid;
    gap: 18px;
`;

const Hero = styled.section`
    padding: 22px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.lg};
    background:
            radial-gradient(circle at top left, rgba(124, 58, 237, 0.24), transparent 34%),
            radial-gradient(circle at bottom right, rgba(37, 99, 235, 0.16), transparent 34%),
            rgba(21, 25, 43, 0.86);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        align-items: flex-start;
        flex-direction: column;
        padding: 18px;
    }
`;

const HeroContent = styled.div`
    min-width: 0;
`;

const Eyebrow = styled.div`
    margin-bottom: 8px;
    color: ${({ theme }) => theme.colors.primaryHover};
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.08em;
`;

const Title = styled.h1`
    margin: 0;
    font-size: clamp(30px, 5vw, 52px);
    line-height: 0.96;
    letter-spacing: -0.075em;
`;

const Subtitle = styled.p`
    max-width: 760px;
    margin: 12px 0 0;
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.65;
`;

const HeroActions = styled.div`
    flex: 0 0 auto;
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
`;

const CreateLink = styled(Link)`
    min-height: 46px;
    padding: 0 16px;
    border-radius: ${({ theme }) => theme.radius.full};
    background: linear-gradient(135deg, #7c3aed, #2563eb);
    color: white;
    display: inline-flex;
    align-items: center;
    gap: 9px;
    font-weight: 900;

    &:hover {
        filter: brightness(1.08);
    }
`;

const RefreshButton = styled.button`
    min-height: 46px;
    padding: 0 16px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.full};
    background: rgba(255, 255, 255, 0.06);
    color: ${({ theme }) => theme.colors.text};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    font-weight: 900;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(139, 92, 246, 0.46);
    }
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

    svg {
        flex: 0 0 auto;
        font-size: 18px;
    }

    input {
        width: 100%;
        min-width: 0;
        border: none;
        outline: none;
        background: transparent;
        color: ${({ theme }) => theme.colors.text};
    }

    input::placeholder {
        color: rgba(156, 163, 183, 0.68);
    }

    &:focus-within {
        border-color: rgba(139, 92, 246, 0.72);
        box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.12);
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

    &:focus {
        border-color: rgba(139, 92, 246, 0.72);
    }
`;

const ResetButton = styled.button`
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

    &:hover {
        background: rgba(255, 255, 255, 0.09);
        border-color: rgba(139, 92, 246, 0.45);
    }
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

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        align-items: flex-start;
        flex-direction: column;
    }
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

const PostsList = styled.div`
    display: grid;
    gap: 14px;
`;

const PostRow = styled.article`
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

const Preview = styled.div`
    position: relative;
    min-height: 230px;
    background: #05060d;

    img {
        width: 100%;
        height: 100%;
        min-height: 230px;
        object-fit: cover;
        display: block;
    }
`;

const MediaVideo = styled.video`
    width: 100%;
    height: 100%;
    min-height: 230px;
    object-fit: cover;
    display: block;
    background: #05060d;
`;

const VideoPreview = styled.div`
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
    font-weight: 900;

    svg {
        font-size: 44px;
    }

    span {
        color: ${({ theme }) => theme.colors.textMuted};
    }
`;

const VisibilityBadge = styled.div<{ $visibility: PostVisibility }>`
    position: absolute;
    left: 12px;
    top: 12px;
    min-height: 34px;
    padding: 0 12px;
    border-radius: ${({ theme }) => theme.radius.full};
    background: ${({ $visibility }) =>
            $visibility === 'PREMIUM'
                    ? 'rgba(236, 72, 153, 0.88)'
                    : 'rgba(37, 99, 235, 0.88)'};
    color: white;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 900;
`;

const PostBody = styled.div`
    min-width: 0;
    padding: 18px;
    display: grid;
    align-content: start;
    gap: 14px;
`;

const PostTop = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        flex-direction: column;
    }
`;

const PostTitleBlock = styled.div`
    min-width: 0;
`;

const PostTitle = styled.h2`
    margin: 0;
    font-size: 25px;
    letter-spacing: -0.055em;
`;

const PostMeta = styled.div`
    margin-top: 5px;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 13px;
    font-weight: 700;
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

const AuthorBlock = styled.div`
    padding: 10px 12px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.035);
    display: flex;
    align-items: center;
    gap: 10px;

    div {
        min-width: 0;
        display: grid;
        gap: 2px;
    }

    strong {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    span {
        color: ${({ theme }) => theme.colors.textMuted};
        font-size: 12px;
        font-weight: 800;
    }
`;

const AuthorAvatar = styled.div`
    flex: 0 0 auto;
    width: 42px;
    height: 42px;
    overflow: hidden;
    border-radius: 15px;
    background: linear-gradient(135deg, #7c3aed, #2563eb);
    color: white;
    display: grid;
    place-items: center;
    font-size: 20px;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
`;

const InfoGrid = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
`;

const InfoItem = styled.div`
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
        color: ${({ theme }) => theme.colors.primaryHover};
    }
`;

const Actions = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
`;

const OpenPostLink = styled(Link)`
    min-height: 42px;
    padding: 0 14px;
    border-radius: ${({ theme }) => theme.radius.full};
    background: linear-gradient(135deg, #7c3aed, #2563eb);
    color: white;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 900;

    &:hover {
        filter: brightness(1.08);
    }
`;

const DeleteButton = styled.button`
    min-height: 42px;
    padding: 0 14px;
    border: 1px solid rgba(239, 68, 68, 0.32);
    border-radius: ${({ theme }) => theme.radius.full};
    background: rgba(239, 68, 68, 0.1);
    color: #fecaca;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 900;

    &:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.16);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
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
    background:
            radial-gradient(circle at top left, rgba(124, 58, 237, 0.18), transparent 34%),
            rgba(21, 25, 43, 0.74);
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
    > svg {
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
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

const PrimaryLink = styled(Link)`
  min-height: 46px;
  margin-top: 22px;
  padding: 0 16px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  color: white;
  display: inline-flex;
  align-items: center;
  font-weight: 900;

  &:hover {
    filter: brightness(1.08);
  }
`;