import { useEffect, useMemo, useState } from 'react';
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
    FiMessageCircle,
    FiRefreshCw,
    FiSearch,
    FiStar,
    FiTrash2,
    FiUser,
    FiVideo,
} from 'react-icons/fi';

import type {
    MediaType,
    Post,
    PostVisibility,
} from '../../entities/post/model/postTypes';
import {
    getMockComments,
    getMockPosts,
    saveMockComments,
    saveMockPosts,
} from '../../shared/lib/mockStorage';

type VisibilityFilter = 'ALL' | PostVisibility;
type MediaFilter = 'ALL' | MediaType;
type SortMode = 'RECENT' | 'POPULAR';

export function AdminPostsPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [visibilityFilter, setVisibilityFilter] =
        useState<VisibilityFilter>('ALL');
    const [mediaFilter, setMediaFilter] = useState<MediaFilter>('ALL');
    const [sortMode, setSortMode] = useState<SortMode>('RECENT');

    const loadPosts = () => {
        setPosts(getMockPosts());
    };

    useEffect(() => {
        loadPosts();
    }, []);

    const filteredPosts = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();

        return posts
            .filter((post) => {
                if (
                    visibilityFilter !== 'ALL' &&
                    post.visibility !== visibilityFilter
                ) {
                    return false;
                }

                if (mediaFilter !== 'ALL' && post.media[0]?.type !== mediaFilter) {
                    return false;
                }

                if (!normalizedQuery) {
                    return true;
                }

                const title = post.title?.toLowerCase() || '';
                const description = post.description?.toLowerCase() || '';
                const author = post.author.nickname.toLowerCase();
                const id = String(post.id);

                return (
                    title.includes(normalizedQuery) ||
                    description.includes(normalizedQuery) ||
                    author.includes(normalizedQuery) ||
                    id.includes(normalizedQuery)
                );
            })
            .sort((a, b) => {
                if (sortMode === 'POPULAR') {
                    const aScore = a.likesCount + a.commentsCount - a.dislikesCount;
                    const bScore = b.likesCount + b.commentsCount - b.dislikesCount;

                    return bScore - aScore;
                }

                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
    }, [mediaFilter, posts, searchQuery, sortMode, visibilityFilter]);

    const stats = useMemo(() => {
        const publicPosts = posts.filter(
            (post) => post.visibility === 'PUBLIC'
        ).length;

        const premiumPosts = posts.filter(
            (post) => post.visibility === 'PREMIUM'
        ).length;

        const imagePosts = posts.filter(
            (post) => post.media[0]?.type === 'IMAGE'
        ).length;

        const videoPosts = posts.filter(
            (post) => post.media[0]?.type === 'VIDEO'
        ).length;

        return {
            publicPosts,
            premiumPosts,
            imagePosts,
            videoPosts,
            total: posts.length,
        };
    }, [posts]);

    const resetFilters = () => {
        setSearchQuery('');
        setVisibilityFilter('ALL');
        setMediaFilter('ALL');
        setSortMode('RECENT');
    };

    const handleDeletePost = (postId: number) => {
        const targetPost = posts.find((post) => post.id === postId);

        if (!targetPost) {
            return;
        }

        const isConfirmed = window.confirm(
            `Удалить пост «${targetPost.title || 'Без названия'}»? Комментарии к нему тоже будут удалены.`
        );

        if (!isConfirmed) {
            return;
        }

        const nextPosts = posts.filter((post) => post.id !== postId);
        const nextComments = getMockComments().filter(
            (comment) => comment.postId !== postId
        );

        saveMockPosts(nextPosts);
        saveMockComments(nextComments);
        setPosts(nextPosts);
    };

    return (
        <Page>
            <Hero>
                <HeroContent>
                    <Eyebrow>Admin</Eyebrow>

                    <Title>Посты</Title>

                    <Subtitle>
                        Управление опубликованными материалами. Здесь можно искать посты,
                        фильтровать обычную и Premium-ленту, смотреть статистику и удалять
                        публикации.
                    </Subtitle>
                </HeroContent>

                <HeroActions>
                    <CreateLink to="/admin/posts/create">
                        <FiFileText />
                        Создать пост
                    </CreateLink>

                    <RefreshButton type="button" onClick={loadPosts}>
                        <FiRefreshCw />
                        Обновить
                    </RefreshButton>
                </HeroActions>
            </Hero>

            <StatsGrid>
                <StatCard>
                    <FiFileText />
                    <div>
                        <strong>{stats.total}</strong>
                        <span>Всего постов</span>
                    </div>
                </StatCard>

                <StatCard>
                    <FiGlobe />
                    <div>
                        <strong>{stats.publicPosts}</strong>
                        <span>Обычная лента</span>
                    </div>
                </StatCard>

                <StatCard>
                    <FiStar />
                    <div>
                        <strong>{stats.premiumPosts}</strong>
                        <span>Premium</span>
                    </div>
                </StatCard>

                <StatCard>
                    <FiVideo />
                    <div>
                        <strong>{stats.videoPosts}</strong>
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

            {filteredPosts.length ? (
                <PostsList>
                    {filteredPosts.map((post) => {
                        const firstMedia = post.media[0];

                        return (
                            <PostRow key={post.id}>
                                <Preview>
                                    {firstMedia?.type === 'IMAGE' ? (
                                        <img src={firstMedia.url} alt={post.title || 'Пост'} />
                                    ) : firstMedia?.type === 'VIDEO' ? (
                                        <VideoPreview>
                                            <FiVideo />
                                            <span>Видео</span>
                                        </VideoPreview>
                                    ) : (
                                        <VideoPreview>
                                            <FiImage />
                                            <span>Без медиа</span>
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

                                    <Description>{post.description}</Description>

                                    <AuthorBlock>
                                        <AuthorAvatar>
                                            {post.author.avatarUrl ? (
                                                <img src={post.author.avatarUrl} alt={post.author.nickname} />
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
                                            onClick={() => handleDeletePost(post.id)}
                                        >
                                            <FiTrash2 />
                                            Удалить
                                        </DeleteButton>
                                    </Actions>
                                </PostBody>
                            </PostRow>
                        );
                    })}
                </PostsList>
            ) : posts.length ? (
                <EmptyCard>
                    <FiSearch />

                    <h2>По фильтрам ничего не найдено</h2>

                    <p>
                        Попробуйте изменить поисковую фразу, ленту, тип медиа или сбросить
                        фильтры.
                    </p>

                    <PrimaryButton type="button" onClick={resetFilters}>
                        Сбросить фильтры
                    </PrimaryButton>
                </EmptyCard>
            ) : (
                <EmptyCard>
                    <FiFileText />

                    <h2>Постов пока нет</h2>

                    <p>
                        Создайте первый пост в админке или одобрите пользовательскую заявку.
                    </p>

                    <PrimaryLink to="/admin/posts/create">Создать пост</PrimaryLink>
                </EmptyCard>
            )}
        </Page>
    );
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
    max-width: 720px;
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

    &:hover {
        background: rgba(239, 68, 68, 0.16);
    }
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