import { useEffect, useRef, useState } from 'react';
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
    FiRefreshCw,
    FiSearch,
    FiStar,
    FiTrash2,
    FiUser,
    FiVideo,
    FiXCircle,
} from 'react-icons/fi';

import type { PostVisibility } from '../../entities/post/model/postTypes';
import {
    useApproveContentRequestMutation,
    useDeleteContentRequestMutation,
    useGetAdminContentRequestsQuery,
    useGetAdminContentRequestsStatsQuery,
    useRejectContentRequestMutation,
} from '../../entities/admin/api/adminContentRequestApi';
import {
    formatMockFileSize,
    type MediaFilter,
    type MockContentRequest,
    type RequestStatus,
    type RequestStatusFilter,
} from '../../shared/lib/mockStorage';
import { getMediaUrl } from '../../shared/lib/getMediaUrl';

type RequestWithFileUrl = MockContentRequest & {
    fileUrl?: string | null;
};

const REQUESTS_LIMIT = 12;

export function AdminRequestsPage() {
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>('ALL');
    const [mediaFilter, setMediaFilter] = useState<MediaFilter>('ALL');

    const [cursor, setCursor] = useState<string | null>(null);
    const [loadedRequests, setLoadedRequests] = useState<MockContentRequest[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const {
        data,
        isLoading,
        isFetching,
        isError,
        refetch: refetchRequests,
    } = useGetAdminContentRequestsQuery({
        cursor,
        limit: REQUESTS_LIMIT,
        search: searchQuery,
        status: statusFilter,
        mediaType: mediaFilter,
    });

    const {
        data: stats,
        isLoading: isStatsLoading,
        refetch: refetchStats,
    } = useGetAdminContentRequestsStatsQuery();

    const [approveContentRequest, { isLoading: isApproving }] =
        useApproveContentRequestMutation();

    const [rejectContentRequest, { isLoading: isRejecting }] =
        useRejectContentRequestMutation();

    const [deleteContentRequest, { isLoading: isDeleting }] =
        useDeleteContentRequestMutation();

    const isActionLoading = isApproving || isRejecting || isDeleting;
    const isFirstLoading = isLoading && loadedRequests.length === 0;
    const isLoadingMore = isFetching && loadedRequests.length > 0;

    useEffect(() => {
        if (!data) {
            return;
        }

        const items = data.items || data.requests || [];

        setLoadedRequests((currentRequests) => {
            if (!cursor) {
                return items;
            }

            return mergeRequestsKeepingOrder(currentRequests, items);
        });

        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
    }, [cursor, data]);

    useEffect(() => {
        setCursor(null);
        setLoadedRequests([]);
        setNextCursor(null);
        setHasMore(true);
    }, [mediaFilter, searchQuery, statusFilter]);

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

    const handleRefresh = () => {
        setCursor(null);
        setLoadedRequests([]);
        setNextCursor(null);
        setHasMore(true);

        refetchRequests();
        refetchStats();
    };

    const resetFilters = () => {
        setSearchQuery('');
        setStatusFilter('ALL');
        setMediaFilter('ALL');
    };

    const handleApprove = async (
        requestId: number,
        visibility: PostVisibility
    ) => {
        try {
            await approveContentRequest({
                requestId,
                visibility,
            }).unwrap();

            handleRefresh();
        } catch (error) {
            window.alert(getErrorMessage(error, 'Не удалось одобрить заявку.'));
        }
    };

    const handleReject = async (requestId: number) => {
        try {
            await rejectContentRequest(requestId).unwrap();

            handleRefresh();
        } catch (error) {
            window.alert(getErrorMessage(error, 'Не удалось отклонить заявку.'));
        }
    };

    const handleDelete = async (requestId: number) => {
        const isConfirmed = window.confirm('Удалить заявку из списка?');

        if (!isConfirmed) {
            return;
        }

        try {
            await deleteContentRequest(requestId).unwrap();

            setLoadedRequests((currentRequests) =>
                currentRequests.filter((request) => request.id !== requestId)
            );

            refetchStats();
            refetchRequests();
        } catch (error) {
            window.alert(getErrorMessage(error, 'Не удалось удалить заявку.'));
        }
    };

    return (
        <Page>
            <Hero>
                <HeroContent>
                    <Eyebrow>Admin</Eyebrow>

                    <Title>Заявки пользователей</Title>

                    <Subtitle>
                        Здесь админ проверяет предложенные фото и видео. Заявки
                        подгружаются частями, а счетчики берутся отдельным запросом.
                        Одобренный пост публикуется от имени пользователя, который отправил
                        материал.
                    </Subtitle>
                </HeroContent>

                <HeroIcon>
                    <FiInbox />
                </HeroIcon>
            </Hero>

            <StatsGrid>
                <StatCard>
                    <FiClock />
                    <div>
                        <strong>{isStatsLoading ? '...' : stats?.pending || 0}</strong>
                        <span>На проверке</span>
                    </div>
                </StatCard>

                <StatCard>
                    <FiCheckCircle />
                    <div>
                        <strong>{isStatsLoading ? '...' : stats?.approved || 0}</strong>
                        <span>Опубликовано</span>
                    </div>
                </StatCard>

                <StatCard>
                    <FiXCircle />
                    <div>
                        <strong>{isStatsLoading ? '...' : stats?.rejected || 0}</strong>
                        <span>Отклонено</span>
                    </div>
                </StatCard>

                <StatCard>
                    <FiInbox />
                    <div>
                        <strong>{isStatsLoading ? '...' : stats?.total || 0}</strong>
                        <span>Всего заявок</span>
                    </div>
                </StatCard>
            </StatsGrid>

            <Toolbar>
                <SearchBox>
                    <FiSearch />

                    <input
                        value={searchQuery}
                        placeholder="Поиск по ID, названию, описанию, файлу или автору..."
                        onChange={(event) => setSearchQuery(event.target.value)}
                    />
                </SearchBox>

                <Filters>
                    <FilterSelect
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(event.target.value as RequestStatusFilter)
                        }
                    >
                        <option value="ALL">Все статусы</option>
                        <option value="PENDING">На проверке</option>
                        <option value="APPROVED">Одобрено</option>
                        <option value="REJECTED">Отклонено</option>
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
                </Filters>

                <ToolbarActions>
                    <ResetButton type="button" onClick={resetFilters}>
                        <FiFilter />
                        Сбросить
                    </ResetButton>

                    <RefreshButton type="button" onClick={handleRefresh}>
                        <FiRefreshCw />
                        Обновить
                    </RefreshButton>
                </ToolbarActions>
            </Toolbar>

            {isFirstLoading ? (
                <StateCard>
                    <FiLoader />

                    <h2>Загружаем заявки</h2>

                    <p>
                        Сейчас покажем материалы, которые пользователи отправили на
                        проверку.
                    </p>
                </StateCard>
            ) : isError && !loadedRequests.length ? (
                <StateCard>
                    <FiAlertCircle />

                    <h2>Не удалось загрузить заявки</h2>

                    <p>Попробуйте повторить загрузку.</p>

                    <PrimaryButton type="button" onClick={handleRefresh}>
                        Повторить
                    </PrimaryButton>
                </StateCard>
            ) : loadedRequests.length ? (
                <>
                    <FeedMeta>
                        <span>Загружено на странице: {loadedRequests.length}</span>

                        {isLoadingMore && (
                            <LoadingInline>
                                <FiLoader />
                                Подгружаем еще...
                            </LoadingInline>
                        )}
                    </FeedMeta>

                    <RequestsGrid>
                        {loadedRequests.map((request) => {
                            const previewUrl = getRequestPreviewUrl(request);

                            return (
                                <RequestCard key={request.id}>
                                    <Preview>
                                        {request.mediaType === 'IMAGE' ? (
                                            previewUrl ? (
                                                <img src={previewUrl} alt={request.title} />
                                            ) : (
                                                <Placeholder>
                                                    <FiImage />
                                                    <span>Изображение без preview</span>
                                                </Placeholder>
                                            )
                                        ) : previewUrl ? (
                                            <MediaVideo src={previewUrl} controls />
                                        ) : (
                                            <Placeholder>
                                                <FiVideo />
                                                <span>Видео: {request.fileName}</span>
                                            </Placeholder>
                                        )}

                                        <StatusBadge $status={request.status}>
                                            {getStatusText(request.status)}
                                        </StatusBadge>
                                    </Preview>

                                    <CardBody>
                                        <CardHeader>
                                            <AuthorBlock>
                                                <AuthorAvatar>
                                                    <FiUser />
                                                </AuthorAvatar>

                                                <div>
                                                    <RequestTitle>{request.title}</RequestTitle>

                                                    <Meta>
                                                        ID {request.id} • @{request.userNickname} •{' '}
                                                        {new Date(request.createdAt).toLocaleString('ru-RU')}
                                                    </Meta>
                                                </div>
                                            </AuthorBlock>

                                            <MediaBadge>
                                                {request.mediaType === 'IMAGE' ? <FiImage /> : <FiVideo />}
                                                {request.mediaType === 'IMAGE' ? 'Фото' : 'Видео'}
                                            </MediaBadge>
                                        </CardHeader>

                                        {request.description ? (
                                            <Description>{request.description}</Description>
                                        ) : (
                                            <DescriptionMuted>Описание не указано</DescriptionMuted>
                                        )}

                                        <InfoList>
                                            <InfoItem>
                                                <strong>Автор публикации:</strong>
                                                <span>@{request.userNickname}</span>
                                            </InfoItem>

                                            <InfoItem>
                                                <strong>Предложено для:</strong>
                                                <span>
                          {request.suggestedVisibility === 'PREMIUM'
                              ? 'Premium'
                              : 'Обычной ленты'}
                        </span>
                                            </InfoItem>

                                            <InfoItem>
                                                <strong>Файл:</strong>
                                                <span>{request.fileName}</span>
                                            </InfoItem>

                                            <InfoItem>
                                                <strong>Размер:</strong>
                                                <span>{formatMockFileSize(request.fileSize)}</span>
                                            </InfoItem>

                                            {request.reviewedAt && (
                                                <InfoItem>
                                                    <strong>Проверено:</strong>
                                                    <span>
                            {new Date(request.reviewedAt).toLocaleString('ru-RU')}
                          </span>
                                                </InfoItem>
                                            )}

                                            {request.publishedPostId && (
                                                <InfoItem>
                                                    <strong>ID поста:</strong>
                                                    <span>{request.publishedPostId}</span>
                                                </InfoItem>
                                            )}
                                        </InfoList>

                                        {request.status === 'PENDING' ? (
                                            <Actions>
                                                <ApproveButton
                                                    type="button"
                                                    disabled={isActionLoading}
                                                    onClick={() => handleApprove(request.id, 'PUBLIC')}
                                                >
                                                    <FiGlobe />
                                                    В обычную ленту
                                                </ApproveButton>

                                                <PremiumButton
                                                    type="button"
                                                    disabled={isActionLoading}
                                                    onClick={() => handleApprove(request.id, 'PREMIUM')}
                                                >
                                                    <FiStar />
                                                    В Premium
                                                </PremiumButton>

                                                <RejectButton
                                                    type="button"
                                                    disabled={isActionLoading}
                                                    onClick={() => handleReject(request.id)}
                                                >
                                                    <FiXCircle />
                                                    Отклонить
                                                </RejectButton>
                                            </Actions>
                                        ) : (
                                            <Actions>
                                                <DeleteButton
                                                    type="button"
                                                    disabled={isActionLoading}
                                                    onClick={() => handleDelete(request.id)}
                                                >
                                                    <FiTrash2 />
                                                    Удалить из списка
                                                </DeleteButton>
                                            </Actions>
                                        )}
                                    </CardBody>
                                </RequestCard>
                            );
                        })}
                    </RequestsGrid>

                    <LoadMoreAnchor ref={loadMoreRef}>
                        {hasMore ? (
                            <LoadingMore>
                                <FiLoader />
                                <span>Листайте ниже — заявки подгрузятся автоматически</span>
                            </LoadingMore>
                        ) : (
                            <EndMessage>
                                Вы посмотрели все заявки по текущим фильтрам
                            </EndMessage>
                        )}
                    </LoadMoreAnchor>
                </>
            ) : (
                <EmptyCard>
                    <FiAlertCircle />

                    <h2>Заявок пока нет</h2>

                    <p>
                        Когда пользователь отправит фото или видео через страницу заявки,
                        материал появится здесь.
                    </p>
                </EmptyCard>
            )}
        </Page>
    );
}

function mergeRequestsKeepingOrder(
    first: MockContentRequest[],
    second: MockContentRequest[]
) {
    const map = new Map<number, MockContentRequest>();

    [...first, ...second].forEach((request) => {
        map.set(request.id, request);
    });

    return Array.from(map.values());
}

function getStatusText(status: RequestStatus) {
    if (status === 'PENDING') {
        return 'На проверке';
    }

    if (status === 'APPROVED') {
        return 'Опубликовано';
    }

    return 'Отклонено';
}

function getRequestPreviewUrl(request: MockContentRequest) {
    const requestWithFileUrl = request as RequestWithFileUrl;

    return getMediaUrl(request.previewUrl || requestWithFileUrl.fileUrl || null);
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
            radial-gradient(circle at bottom right, rgba(239, 68, 68, 0.16), transparent 34%),
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

const HeroIcon = styled.div`
    flex: 0 0 auto;
    width: 76px;
    height: 76px;
    border-radius: 28px;
    background: linear-gradient(135deg, #7c3aed, #ef4444);
    color: white;
    display: grid;
    place-items: center;
    font-size: 36px;
    box-shadow: 0 22px 50px rgba(124, 58, 237, 0.28);
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

const StatCard = styled.div`
    padding: 16px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.lg};
    background: rgba(21, 25, 43, 0.82);
    display: flex;
    align-items: center;
    gap: 14px;

    > svg {
        width: 46px;
        height: 46px;
        padding: 12px;
        border-radius: 17px;
        background: rgba(124, 58, 237, 0.14);
        color: ${({ theme }) => theme.colors.primaryHover};
    }

    div {
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

const ToolbarActions = styled.div`
    display: flex;
    gap: 8px;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        display: grid;
        grid-template-columns: 1fr;
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
    }
`;

const RefreshButton = styled(ResetButton)``;

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

const RequestsGrid = styled.div`
    display: grid;
    gap: 18px;
`;

const RequestCard = styled.article`
    overflow: hidden;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.lg};
    background: rgba(21, 25, 43, 0.86);
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);

    @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
        grid-template-columns: 1fr;
    }
`;

const Preview = styled.div`
    position: relative;
    min-height: 260px;
    background: #05060d;

    img,
    video {
        width: 100%;
        height: 100%;
        min-height: 260px;
        object-fit: cover;
    }
`;

const MediaVideo = styled.video`
    display: block;
    background: #05060d;
`;

const Placeholder = styled.div`
    min-height: 260px;
    padding: 24px;
    background:
            radial-gradient(circle at top left, rgba(124, 58, 237, 0.24), transparent 34%),
            radial-gradient(circle at bottom right, rgba(37, 99, 235, 0.16), transparent 34%),
            #080a12;
    color: ${({ theme }) => theme.colors.textMuted};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    text-align: center;

    svg {
        color: ${({ theme }) => theme.colors.primaryHover};
        font-size: 46px;
    }

    span {
        max-width: 220px;
        line-height: 1.45;
        font-weight: 800;
    }
`;

const StatusBadge = styled.div<{ $status: RequestStatus }>`
    position: absolute;
    left: 14px;
    top: 14px;
    min-height: 34px;
    padding: 0 12px;
    border-radius: ${({ theme }) => theme.radius.full};
    background: ${({ $status }) => {
        if ($status === 'APPROVED') {
            return 'rgba(34, 197, 94, 0.86)';
        }

        if ($status === 'REJECTED') {
            return 'rgba(239, 68, 68, 0.86)';
        }

        return 'rgba(245, 158, 11, 0.9)';
    }};
    color: white;
    display: inline-flex;
    align-items: center;
    font-size: 13px;
    font-weight: 900;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.28);
`;

const CardBody = styled.div`
    min-width: 0;
    padding: 18px;
    display: grid;
    align-content: start;
    gap: 14px;
`;

const CardHeader = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        flex-direction: column;
    }
`;

const AuthorBlock = styled.div`
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 11px;
`;

const AuthorAvatar = styled.div`
    flex: 0 0 auto;
    width: 46px;
    height: 46px;
    overflow: hidden;
    border-radius: 17px;
    background: linear-gradient(135deg, #7c3aed, #2563eb);
    color: white;
    display: grid;
    place-items: center;
    font-size: 21px;
`;

const RequestTitle = styled.h2`
    margin: 0;
    font-size: 25px;
    letter-spacing: -0.055em;
`;

const Meta = styled.div`
    margin-top: 5px;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 13px;
    font-weight: 700;
`;

const MediaBadge = styled.div`
    flex: 0 0 auto;
    min-height: 36px;
    padding: 0 12px;
    border: 1px solid rgba(124, 58, 237, 0.32);
    border-radius: ${({ theme }) => theme.radius.full};
    background: rgba(124, 58, 237, 0.1);
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
`;

const DescriptionMuted = styled(Description)`
    opacity: 0.68;
    font-style: italic;
`;

const InfoList = styled.div`
    display: grid;
    gap: 8px;
`;

const InfoItem = styled.div`
    padding: 10px 12px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.035);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;

    strong {
        color: ${({ theme }) => theme.colors.text};
        font-size: 13px;
    }

    span {
        min-width: 0;
        color: ${({ theme }) => theme.colors.textMuted};
        font-size: 13px;
        text-align: right;
        word-break: break-word;
    }

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        flex-direction: column;
        gap: 4px;

        span {
            text-align: left;
        }
    }
`;

const Actions = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
`;

const ActionButton = styled.button`
    min-height: 42px;
    padding: 0 13px;
    border-radius: ${({ theme }) => theme.radius.full};
    color: white;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 900;

    &:hover:not(:disabled) {
        filter: brightness(1.08);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const ApproveButton = styled(ActionButton)`
    border: 1px solid rgba(37, 99, 235, 0.36);
    background: linear-gradient(135deg, #2563eb, #7c3aed);
`;

const PremiumButton = styled(ActionButton)`
    border: 1px solid rgba(236, 72, 153, 0.36);
    background: linear-gradient(135deg, #7c3aed, #ec4899);
`;

const RejectButton = styled(ActionButton)`
    border: 1px solid rgba(239, 68, 68, 0.34);
    background: rgba(239, 68, 68, 0.18);
    color: #fecaca;
`;

const DeleteButton = styled(ActionButton)`
    border: 1px solid rgba(239, 68, 68, 0.28);
    background: rgba(239, 68, 68, 0.12);
    color: #fecaca;
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
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.lg};
    background:
            radial-gradient(circle at top left, rgba(124, 58, 237, 0.2), transparent 34%),
            rgba(21, 25, 43, 0.86);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;

    svg {
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
        max-width: 500px;
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