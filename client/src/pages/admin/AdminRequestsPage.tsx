import { useEffect, useMemo, useRef, useState } from 'react';
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
    FiSearch,
    FiStar,
    FiTrash2,
    FiVideo,
    FiXCircle,
} from 'react-icons/fi';

import { getMediaUrl } from '../../shared/lib/getMediaUrl';
import type { PostVisibility } from '../../entities/post/model/postTypes';
import {
    type AdminContentRequest,
    type MediaFilter,
    type RequestStatus,
    type RequestStatusFilter,
    useApproveContentRequestMutation,
    useDeleteContentRequestMutation,
    useGetAdminContentRequestsQuery,
    useGetAdminContentRequestsStatsQuery,
    useRejectContentRequestMutation,
} from '../../entities/admin/api/adminContentRequestApi';

const REQUESTS_LIMIT = 12;

export function AdminRequestsPage() {
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const isFiltersMountedRef = useRef(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>('ALL');
    const [mediaFilter, setMediaFilter] = useState<MediaFilter>('ALL');

    const [cursor, setCursor] = useState<string | null>(null);
    const [loadedRequests, setLoadedRequests] = useState<AdminContentRequest[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const {
        data,
        isLoading,
        isFetching,
        isError,
        refetch: refetchRequests,
    } = useGetAdminContentRequestsQuery(
        {
            cursor: cursor || undefined,
            limit: REQUESTS_LIMIT,
            search: searchQuery,
            status: statusFilter,
            mediaType: mediaFilter,
        },
        {
            refetchOnMountOrArgChange: true,
        }
    );

    const {
        data: stats,
        isLoading: isStatsLoading,
        refetch: refetchStats,
    } = useGetAdminContentRequestsStatsQuery(undefined, {
        refetchOnMountOrArgChange: true,
    });

    const [approveContentRequest, { isLoading: isApproving }] =
        useApproveContentRequestMutation();

    const [rejectContentRequest, { isLoading: isRejecting }] =
        useRejectContentRequestMutation();

    const [deleteContentRequest, { isLoading: isDeleting }] =
        useDeleteContentRequestMutation();

    const dataRequests = useMemo(() => {
        return data?.items || data?.requests || [];
    }, [data]);

    const visibleRequests = useMemo(() => {
        if (loadedRequests.length) {
            return loadedRequests;
        }

        return dataRequests;
    }, [dataRequests, loadedRequests]);

    const isFirstLoading =
        (isLoading || isFetching) && visibleRequests.length === 0 && !data;

    const isLoadingMore = isFetching && visibleRequests.length > 0;

    const isActionLoading = isApproving || isRejecting || isDeleting;

    useEffect(() => {
        refetchRequests();
        refetchStats();
    }, [refetchRequests, refetchStats]);

    useEffect(() => {
        if (!data) {
            return;
        }

        const items = data.items || data.requests || [];

        setLoadedRequests((currentRequests) => {
            if (!cursor) {
                return mergeRequestsKeepingFirstPriority(items, currentRequests);
            }

            return mergeRequestsKeepingFirstPriority(currentRequests, items);
        });

        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
    }, [cursor, data]);

    useEffect(() => {
        if (!isFiltersMountedRef.current) {
            isFiltersMountedRef.current = true;
            return;
        }

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

    const resetFilters = () => {
        setSearchQuery('');
        setStatusFilter('ALL');
        setMediaFilter('ALL');

        setCursor(null);
        setLoadedRequests([]);
        setNextCursor(null);
        setHasMore(true);

        refetchRequests();
        refetchStats();
    };

    const handleRefresh = () => {
        setCursor(null);
        setLoadedRequests([]);
        setNextCursor(null);
        setHasMore(true);

        refetchRequests();
        refetchStats();
    };

    const handleApprove = async (
        request: AdminContentRequest,
        visibility: PostVisibility
    ) => {
        try {
            await approveContentRequest({
                requestId: request.id,
                visibility,
            }).unwrap();

            setLoadedRequests((currentRequests) =>
                currentRequests.map((item) =>
                    item.id === request.id
                        ? {
                            ...item,
                            status: 'APPROVED',
                            suggestedVisibility: visibility,
                            reviewedAt: new Date().toISOString(),
                        }
                        : item
                )
            );

            refetchRequests();
            refetchStats();
        } catch (error) {
            window.alert(getErrorMessage(error, 'Не удалось одобрить заявку.'));
        }
    };

    const handleReject = async (request: AdminContentRequest) => {
        const isConfirmed = window.confirm(`Отклонить заявку «${request.title}»?`);

        if (!isConfirmed) {
            return;
        }

        try {
            await rejectContentRequest(request.id).unwrap();

            setLoadedRequests((currentRequests) =>
                currentRequests.map((item) =>
                    item.id === request.id
                        ? {
                            ...item,
                            status: 'REJECTED',
                            reviewedAt: new Date().toISOString(),
                        }
                        : item
                )
            );

            refetchRequests();
            refetchStats();
        } catch (error) {
            window.alert(getErrorMessage(error, 'Не удалось отклонить заявку.'));
        }
    };

    const handleDelete = async (request: AdminContentRequest) => {
        const isConfirmed = window.confirm(`Удалить заявку «${request.title}»?`);

        if (!isConfirmed) {
            return;
        }

        try {
            await deleteContentRequest(request.id).unwrap();

            setLoadedRequests((currentRequests) =>
                currentRequests.filter((item) => item.id !== request.id)
            );

            refetchRequests();
            refetchStats();
        } catch (error) {
            window.alert(getErrorMessage(error, 'Не удалось удалить заявку.'));
        }
    };

    return (
        <Page>
            <StatsGrid>
                <StatCard>
                    <FiInbox />

                    <div>
                        <strong>{isStatsLoading ? '...' : stats?.total || 0}</strong>
                        <span>Всего заявок</span>
                    </div>
                </StatCard>

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
                        <span>Одобрено</span>
                    </div>
                </StatCard>

                <StatCard>
                    <FiXCircle />

                    <div>
                        <strong>{isStatsLoading ? '...' : stats?.rejected || 0}</strong>
                        <span>Отклонено</span>
                    </div>
                </StatCard>
            </StatsGrid>

            <Toolbar>
                <SearchBox>
                    <FiSearch />

                    <input
                        value={searchQuery}
                        placeholder="Поиск по названию, описанию, пользователю или ID..."
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
                        onChange={(event) => setMediaFilter(event.target.value as MediaFilter)}
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


                </ToolbarActions>
            </Toolbar>

            {isFirstLoading ? (
                <StateCard>
                    <FiLoader />

                    <h2>Загружаем заявки</h2>

                    <p>Сейчас покажем материалы пользователей.</p>
                </StateCard>
            ) : isError && !visibleRequests.length ? (
                <StateCard>
                    <FiAlertCircle />

                    <h2>Не удалось загрузить заявки</h2>

                    <p>Попробуйте повторить загрузку.</p>

                    <PrimaryButton type="button" onClick={handleRefresh}>
                        Повторить
                    </PrimaryButton>
                </StateCard>
            ) : visibleRequests.length ? (
                <>
                    <FeedMeta>
                        <span>Загружено на странице: {visibleRequests.length}</span>

                        {isLoadingMore && (
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
                                <RequestRow key={request.id}>
                                    <Preview>
                                        {request.mediaType === 'IMAGE' && previewUrl ? (
                                            <img src={previewUrl} alt={request.title} />
                                        ) : request.mediaType === 'VIDEO' && previewUrl ? (
                                            <MediaVideo src={previewUrl} controls />
                                        ) : (
                                            <VideoPreview>
                                                {request.mediaType === 'VIDEO' ? <FiVideo /> : <FiImage />}
                                                <span>Медиа недоступно</span>
                                            </VideoPreview>
                                        )}

                                        <StatusBadge $status={request.status}>
                                            {getStatusIcon(request.status)}
                                            {getStatusText(request.status)}
                                        </StatusBadge>
                                    </Preview>

                                    <RequestBody>
                                        <RequestTop>
                                            <RequestTitleBlock>
                                                <RequestTitle>{request.title}</RequestTitle>

                                                <RequestMeta>
                                                    ID {request.id} • @{request.userNickname} •{' '}
                                                    {new Date(request.createdAt).toLocaleString('ru-RU')}
                                                </RequestMeta>
                                            </RequestTitleBlock>

                                            <MediaBadge>
                                                {request.mediaType === 'VIDEO' ? <FiVideo /> : <FiImage />}
                                                {request.mediaType === 'VIDEO' ? 'Видео' : 'Фото'}
                                            </MediaBadge>
                                        </RequestTop>

                                        {request.description ? (
                                            <Description>{request.description}</Description>
                                        ) : (
                                            <DescriptionMuted>Описание не указано</DescriptionMuted>
                                        )}

                                        <InfoGrid>
                                            <InfoItem>
                                                <FiGlobe />
                                                Предложено:{' '}
                                                {request.suggestedVisibility === 'PREMIUM'
                                                    ? 'Premium'
                                                    : 'Обычная'}
                                            </InfoItem>

                                            <InfoItem>
                                                <FiImage />
                                                {request.fileName}
                                            </InfoItem>

                                            <InfoItem>
                                                <FiClock />
                                                {request.reviewedAt
                                                    ? `Проверено: ${new Date(
                                                        request.reviewedAt
                                                    ).toLocaleString('ru-RU')}`
                                                    : 'Еще не проверено'}
                                            </InfoItem>

                                            {request.publishedPostId && (
                                                <InfoItem>
                                                    <FiCheckCircle />
                                                    Пост ID {request.publishedPostId}
                                                </InfoItem>
                                            )}
                                        </InfoGrid>

                                        <Actions>
                                            {request.status === 'PENDING' && (
                                                <>
                                                    <ApproveButton
                                                        type="button"
                                                        disabled={isActionLoading}
                                                        onClick={() => handleApprove(request, 'PUBLIC')}
                                                    >
                                                        <FiGlobe />
                                                        В обычную
                                                    </ApproveButton>

                                                    <PremiumButton
                                                        type="button"
                                                        disabled={isActionLoading}
                                                        onClick={() => handleApprove(request, 'PREMIUM')}
                                                    >
                                                        <FiStar />
                                                        В Premium
                                                    </PremiumButton>

                                                    <RejectButton
                                                        type="button"
                                                        disabled={isActionLoading}
                                                        onClick={() => handleReject(request)}
                                                    >
                                                        <FiXCircle />
                                                        Отклонить
                                                    </RejectButton>
                                                </>
                                            )}

                                            <DeleteButton
                                                type="button"
                                                disabled={isActionLoading}
                                                onClick={() => handleDelete(request)}
                                            >
                                                <FiTrash2 />
                                                Удалить
                                            </DeleteButton>
                                        </Actions>
                                    </RequestBody>
                                </RequestRow>
                            );
                        })}
                    </RequestsList>

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
                    <FiInbox />

                    <h2>Заявок пока нет</h2>

                    <p>
                        Когда пользователь отправит фото или видео через страницу заявки,
                        материал появится здесь.
                    </p>

                    <PrimaryButton type="button" onClick={resetFilters}>
                        Сбросить фильтры
                    </PrimaryButton>
                </EmptyCard>
            )}
        </Page>
    );
}

function mergeRequestsKeepingFirstPriority(
    first: AdminContentRequest[],
    second: AdminContentRequest[]
) {
    const result: AdminContentRequest[] = [];
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

function getRequestPreviewUrl(request: AdminContentRequest) {
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

function getStatusIcon(status: RequestStatus) {
    if (status === 'PENDING') {
        return <FiClock />;
    }

    if (status === 'APPROVED') {
        return <FiCheckCircle />;
    }

    return <FiXCircle />;
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

const ToolbarActions = styled.div`
    display: flex;
    gap: 8px;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        display: grid;
        grid-template-columns: 1fr;
    }
`;

const RefreshButton = styled.button`
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

const ResetButton = styled(RefreshButton)``;

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

const RequestsList = styled.div`
    display: grid;
    gap: 14px;
`;

const RequestRow = styled.article`
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

        return 'rgba(245, 158, 11, 0.92)';
    }};
    color: white;
    display: inline-flex;
    align-items: center;
    gap: 7px;
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

const RequestTitleBlock = styled.div`
    min-width: 0;
`;

const RequestTitle = styled.h2`
    margin: 0;
    font-size: 25px;
    letter-spacing: -0.055em;
`;

const RequestMeta = styled.div`
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

const ApproveButton = styled.button`
    min-height: 42px;
    padding: 0 14px;
    border: none;
    border-radius: ${({ theme }) => theme.radius.full};
    background: linear-gradient(135deg, #16a34a, #2563eb);
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

const PremiumButton = styled(ApproveButton)`
    background: linear-gradient(135deg, #7c3aed, #ec4899);
`;

const RejectButton = styled.button`
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

    &:hover:not(:disabled) {
        background: rgba(245, 158, 11, 0.16);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
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