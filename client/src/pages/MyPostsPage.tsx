import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import {
    FiAlertCircle,
    FiClock,
    FiExternalLink,
    FiFileText,
    FiFilter,
    FiGlobe,
    FiImage,
    FiRefreshCw,
    FiSearch,
    FiSend,
    FiStar,
    FiVideo,
} from 'react-icons/fi';

import type { RootState } from '../app/store';
import type {
    MediaType,
    Post,
    PostVisibility,
} from '../entities/post/model/postTypes';
import { PostGrid } from '../entities/post/ui/PostGrid';
import {
    getMockContentRequests,
    getMockPosts,
    type MockContentRequest,
    type RequestStatus,
} from '../shared/lib/mockStorage';

type RequestStatusFilter = 'ALL' | RequestStatus;
type MediaFilter = 'ALL' | MediaType;
type SortMode = 'RECENT' | 'POPULAR';

export function MyPostsPage() {
    const user = useSelector((state: RootState) => state.auth.user);

    const [posts, setPosts] = useState<Post[]>([]);
    const [requests, setRequests] = useState<MockContentRequest[]>([]);

    const [postsSearchQuery, setPostsSearchQuery] = useState('');
    const [postsMediaFilter, setPostsMediaFilter] = useState<MediaFilter>('ALL');
    const [postsSortMode, setPostsSortMode] = useState<SortMode>('RECENT');

    const [requestsSearchQuery, setRequestsSearchQuery] = useState('');
    const [requestsStatusFilter, setRequestsStatusFilter] =
        useState<RequestStatusFilter>('ALL');
    const [requestsMediaFilter, setRequestsMediaFilter] =
        useState<MediaFilter>('ALL');

    const loadData = () => {
        setPosts(getMockPosts());
        setRequests(getMockContentRequests());
    };

    useEffect(() => {
        loadData();
    }, []);

    const myPosts = useMemo(() => {
        if (!user) {
            return [];
        }

        return posts.filter((post) => post.author.id === user.id);
    }, [posts, user]);

    const filteredMyPosts = useMemo(() => {
        const normalizedQuery = postsSearchQuery.trim().toLowerCase();

        return myPosts
            .filter((post) => {
                if (
                    postsMediaFilter !== 'ALL' &&
                    post.media[0]?.type !== postsMediaFilter
                ) {
                    return false;
                }

                if (!normalizedQuery) {
                    return true;
                }

                const title = post.title?.toLowerCase() || '';
                const description = post.description?.toLowerCase() || '';
                const author = post.author.nickname.toLowerCase();

                return (
                    title.includes(normalizedQuery) ||
                    description.includes(normalizedQuery) ||
                    author.includes(normalizedQuery)
                );
            })
            .sort((a, b) => {
                if (postsSortMode === 'POPULAR') {
                    const aScore = a.likesCount + a.commentsCount - a.dislikesCount;
                    const bScore = b.likesCount + b.commentsCount - b.dislikesCount;

                    return bScore - aScore;
                }

                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
    }, [myPosts, postsMediaFilter, postsSearchQuery, postsSortMode]);

    const myRequests = useMemo(() => {
        if (!user) {
            return [];
        }

        return requests.filter((request) => request.userId === user.id);
    }, [requests, user]);

    const filteredMyRequests = useMemo(() => {
        const normalizedQuery = requestsSearchQuery.trim().toLowerCase();

        return myRequests
            .filter((request) => {
                if (
                    requestsStatusFilter !== 'ALL' &&
                    request.status !== requestsStatusFilter
                ) {
                    return false;
                }

                if (
                    requestsMediaFilter !== 'ALL' &&
                    request.mediaType !== requestsMediaFilter
                ) {
                    return false;
                }

                if (!normalizedQuery) {
                    return true;
                }

                const title = request.title.toLowerCase();
                const description = request.description.toLowerCase();
                const fileName = request.fileName.toLowerCase();

                return (
                    title.includes(normalizedQuery) ||
                    description.includes(normalizedQuery) ||
                    fileName.includes(normalizedQuery)
                );
            })
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
    }, [
        myRequests,
        requestsMediaFilter,
        requestsSearchQuery,
        requestsStatusFilter,
    ]);

    const stats = useMemo(() => {
        const publicPosts = myPosts.filter(
            (post) => post.visibility === 'PUBLIC'
        ).length;

        const premiumPosts = myPosts.filter(
            (post) => post.visibility === 'PREMIUM'
        ).length;

        const pendingRequests = myRequests.filter(
            (request) => request.status === 'PENDING'
        ).length;

        return {
            publicPosts,
            premiumPosts,
            pendingRequests,
        };
    }, [myPosts, myRequests]);

    const resetPostsFilters = () => {
        setPostsSearchQuery('');
        setPostsMediaFilter('ALL');
        setPostsSortMode('RECENT');
    };

    const resetRequestsFilters = () => {
        setRequestsSearchQuery('');
        setRequestsStatusFilter('ALL');
        setRequestsMediaFilter('ALL');
    };

    return (
        <Page>
            <Hero>
                <HeroContent>
                    <Eyebrow>Мой контент</Eyebrow>

                    <Title>Мои публикации</Title>

                    <Subtitle>
                        Здесь отображаются посты, опубликованные от вашего имени после
                        одобрения админом, а также история ваших заявок на публикацию.
                    </Subtitle>
                </HeroContent>

                <RefreshButton type="button" onClick={loadData}>
                    <FiRefreshCw />
                    Обновить
                </RefreshButton>
            </Hero>

            <StatsGrid>
                <StatCard>
                    <FiGlobe />
                    <div>
                        <strong>{stats.publicPosts}</strong>
                        <span>В обычной ленте</span>
                    </div>
                </StatCard>

                <StatCard>
                    <FiStar />
                    <div>
                        <strong>{stats.premiumPosts}</strong>
                        <span>В Premium</span>
                    </div>
                </StatCard>

                <StatCard>
                    <FiClock />
                    <div>
                        <strong>{stats.pendingRequests}</strong>
                        <span>На проверке</span>
                    </div>
                </StatCard>
            </StatsGrid>

            <Section>
                <SectionHeader>
                    <div>
                        <Eyebrow>Опубликовано</Eyebrow>
                        <h2>Посты от вашего имени</h2>
                    </div>

                    <Badge>{filteredMyPosts.length}</Badge>
                </SectionHeader>

                <Toolbar>
                    <SearchBox>
                        <FiSearch />

                        <input
                            value={postsSearchQuery}
                            placeholder="Поиск по моим постам: название, описание, автор..."
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

                    <ResetButton type="button" onClick={resetPostsFilters}>
                        <FiFilter />
                        Сбросить
                    </ResetButton>
                </Toolbar>

                {filteredMyPosts.length ? (
                    <PostGrid posts={filteredMyPosts} />
                ) : myPosts.length ? (
                    <EmptyCard>
                        <FiSearch />
                        <h3>По фильтрам ничего не найдено</h3>
                        <p>
                            Попробуйте изменить поисковую фразу, тип медиа или сбросить
                            фильтры.
                        </p>

                        <PrimaryButton type="button" onClick={resetPostsFilters}>
                            Сбросить фильтры
                        </PrimaryButton>
                    </EmptyCard>
                ) : (
                    <EmptyCard>
                        <FiFileText />
                        <h3>Публикаций пока нет</h3>
                        <p>
                            Когда админ одобрит вашу заявку, опубликованный пост появится
                            здесь и будет отображаться в ленте от вашего имени.
                        </p>

                        <PrimaryLink to="/submit-content">
                            <FiSend />
                            Предложить пост
                        </PrimaryLink>
                    </EmptyCard>
                )}
            </Section>

            <Section>
                <SectionHeader>
                    <div>
                        <Eyebrow>История</Eyebrow>
                        <h2>Мои заявки</h2>
                    </div>

                    <Badge>{filteredMyRequests.length}</Badge>
                </SectionHeader>

                <Toolbar>
                    <SearchBox>
                        <FiSearch />

                        <input
                            value={requestsSearchQuery}
                            placeholder="Поиск по заявкам: название, описание, файл..."
                            onChange={(event) => setRequestsSearchQuery(event.target.value)}
                        />
                    </SearchBox>

                    <Filters>
                        <FilterSelect
                            value={requestsStatusFilter}
                            onChange={(event) =>
                                setRequestsStatusFilter(event.target.value as RequestStatusFilter)
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

                    <ResetButton type="button" onClick={resetRequestsFilters}>
                        <FiFilter />
                        Сбросить
                    </ResetButton>
                </Toolbar>

                {filteredMyRequests.length ? (
                    <RequestsList>
                        {filteredMyRequests.map((request) => (
                            <RequestCard key={request.id}>
                                <RequestPreview>
                                    {request.mediaType === 'IMAGE' ? (
                                        request.previewUrl ? (
                                            <img src={request.previewUrl} alt={request.title} />
                                        ) : (
                                            <PreviewPlaceholder>
                                                <FiImage />
                                            </PreviewPlaceholder>
                                        )
                                    ) : (
                                        <PreviewPlaceholder>
                                            <FiVideo />
                                        </PreviewPlaceholder>
                                    )}

                                    <StatusBadge $status={request.status}>
                                        {getStatusText(request.status)}
                                    </StatusBadge>
                                </RequestPreview>

                                <RequestBody>
                                    <RequestTop>
                                        <div>
                                            <RequestTitle>{request.title}</RequestTitle>

                                            <RequestMeta>
                                                {new Date(request.createdAt).toLocaleString('ru-RU')}
                                            </RequestMeta>
                                        </div>

                                        <VisibilityBadge $visibility={request.suggestedVisibility}>
                                            {request.suggestedVisibility === 'PREMIUM' ? (
                                                <>
                                                    <FiStar />
                                                    Premium
                                                </>
                                            ) : (
                                                <>
                                                    <FiGlobe />
                                                    Обычная
                                                </>
                                            )}
                                        </VisibilityBadge>
                                    </RequestTop>

                                    <Description>{request.description}</Description>

                                    <InfoGrid>
                                        <InfoItem>
                                            <strong>Файл</strong>
                                            <span>{request.fileName}</span>
                                        </InfoItem>

                                        <InfoItem>
                                            <strong>Тип</strong>
                                            <span>
                        {request.mediaType === 'IMAGE' ? 'Фото' : 'Видео'}
                      </span>
                                        </InfoItem>

                                        {request.reviewedAt && (
                                            <InfoItem>
                                                <strong>Проверено</strong>
                                                <span>
                          {new Date(request.reviewedAt).toLocaleString('ru-RU')}
                        </span>
                                            </InfoItem>
                                        )}

                                        {request.publishedPostId && (
                                            <InfoItem>
                                                <strong>ID поста</strong>
                                                <span>{request.publishedPostId}</span>
                                            </InfoItem>
                                        )}
                                    </InfoGrid>

                                    <RequestActions>
                                        {request.publishedPostId ? (
                                            <OpenPostLink to={`/posts/${request.publishedPostId}`}>
                                                <FiExternalLink />
                                                Открыть опубликованный пост
                                            </OpenPostLink>
                                        ) : request.status === 'PENDING' ? (
                                            <PendingNote>
                                                <FiClock />
                                                Заявка ожидает решения администратора
                                            </PendingNote>
                                        ) : (
                                            <RejectedNote>
                                                <FiAlertCircle />
                                                Пост не был опубликован
                                            </RejectedNote>
                                        )}
                                    </RequestActions>
                                </RequestBody>
                            </RequestCard>
                        ))}
                    </RequestsList>
                ) : myRequests.length ? (
                    <EmptyCard>
                        <FiSearch />
                        <h3>По фильтрам ничего не найдено</h3>
                        <p>
                            Попробуйте изменить поисковую фразу, статус заявки, тип медиа или
                            сбросить фильтры.
                        </p>

                        <PrimaryButton type="button" onClick={resetRequestsFilters}>
                            Сбросить фильтры
                        </PrimaryButton>
                    </EmptyCard>
                ) : (
                    <EmptyCard>
                        <FiAlertCircle />
                        <h3>Заявок пока нет</h3>
                        <p>
                            Вы еще не отправляли материалы на публикацию. Создайте заявку, и
                            она появится в этом списке.
                        </p>

                        <PrimaryLink to="/submit-content">
                            <FiSend />
                            Создать заявку
                        </PrimaryLink>
                    </EmptyCard>
                )}
            </Section>
        </Page>
    );
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

const RefreshButton = styled.button`
    flex: 0 0 auto;
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
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;

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

const Section = styled.section`
    display: grid;
    gap: 14px;
`;

const SectionHeader = styled.div`
    padding: 18px 20px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.lg};
    background: rgba(21, 25, 43, 0.78);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;

    h2 {
        margin: 4px 0 0;
        font-size: 25px;
        letter-spacing: -0.055em;
    }
`;

const Badge = styled.div`
    min-width: 40px;
    height: 40px;
    padding: 0 12px;
    border-radius: ${({ theme }) => theme.radius.full};
    background: rgba(124, 58, 237, 0.14);
    color: ${({ theme }) => theme.colors.primaryHover};
    display: inline-flex;
    align-items: center;
    justify-content: center;
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

const EmptyCard = styled.div`
    min-height: 300px;
    padding: 28px 20px;
    border: 1px dashed rgba(139, 92, 246, 0.34);
    border-radius: ${({ theme }) => theme.radius.lg};
    background:
            radial-gradient(circle at top left, rgba(124, 58, 237, 0.15), transparent 34%),
            rgba(21, 25, 43, 0.72);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;

    > svg {
        margin-bottom: 14px;
        color: ${({ theme }) => theme.colors.primaryHover};
        font-size: 40px;
    }

    h3 {
        margin: 0 0 8px;
        font-size: clamp(24px, 4vw, 34px);
        letter-spacing: -0.06em;
    }

    p {
        max-width: 520px;
        margin: 0;
        color: ${({ theme }) => theme.colors.textMuted};
        line-height: 1.6;
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
    gap: 9px;
    font-weight: 900;

    &:hover {
        filter: brightness(1.08);
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
    min-height: 220px;
    background: #05060d;

    img {
        width: 100%;
        height: 100%;
        min-height: 220px;
        object-fit: cover;
    }
`;

const PreviewPlaceholder = styled.div`
    min-height: 220px;
    background:
            radial-gradient(circle at top left, rgba(124, 58, 237, 0.28), transparent 34%),
            radial-gradient(circle at bottom right, rgba(37, 99, 235, 0.18), transparent 34%),
            #080a12;
    color: ${({ theme }) => theme.colors.primaryHover};
    display: grid;
    place-items: center;
    font-size: 44px;
`;

const StatusBadge = styled.div<{ $status: RequestStatus }>`
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

        return 'rgba(245, 158, 11, 0.9)';
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

const RequestTop = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        flex-direction: column;
    }
`;

const RequestTitle = styled.h3`
    margin: 0;
    font-size: 24px;
    letter-spacing: -0.055em;
`;

const RequestMeta = styled.div`
    margin-top: 5px;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 13px;
    font-weight: 700;
`;

const VisibilityBadge = styled.div<{ $visibility: PostVisibility }>`
    flex: 0 0 auto;
    min-height: 36px;
    padding: 0 12px;
    border-radius: ${({ theme }) => theme.radius.full};
    background: ${({ $visibility }) =>
            $visibility === 'PREMIUM'
                    ? 'rgba(236, 72, 153, 0.14)'
                    : 'rgba(37, 99, 235, 0.14)'};
    color: ${({ $visibility }) =>
            $visibility === 'PREMIUM' ? '#f9a8d4' : '#bfdbfe'};
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
`;

const InfoGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        grid-template-columns: 1fr;
    }
`;

const InfoItem = styled.div`
    padding: 10px 12px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.035);
    display: grid;
    gap: 4px;

    strong {
        color: ${({ theme }) => theme.colors.text};
        font-size: 12px;
    }

    span {
        color: ${({ theme }) => theme.colors.textMuted};
        font-size: 13px;
        line-height: 1.35;
        word-break: break-word;
    }
`;

const RequestActions = styled.div`
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

const PendingNote = styled.div`
    min-height: 42px;
    padding: 0 14px;
    border: 1px solid rgba(245, 158, 11, 0.32);
    border-radius: ${({ theme }) => theme.radius.full};
    background: rgba(245, 158, 11, 0.1);
    color: #fde68a;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 900;
`;

const RejectedNote = styled.div`
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
`;