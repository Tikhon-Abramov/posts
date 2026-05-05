import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import {
    FiAlertCircle,
    FiBell,
    FiCheckCircle,
    FiHeart,
    FiLoader,
    FiMessageCircle,
    FiRefreshCw,
    FiTrash2,
    FiXCircle,
} from 'react-icons/fi';

import {
    useClearNotificationsMutation,
    useDeleteNotificationMutation,
    useGetNotificationsQuery,
    useGetNotificationsStatsQuery,
    useMarkAllNotificationsAsReadMutation,
} from '../entities/notification/api/notificationApi';
import type {
    MockNotification,
    NotificationFilter,
    NotificationType,
} from '../shared/lib/mockStorage';

const NOTIFICATIONS_LIMIT = 10;
const STATS_POLLING_INTERVAL = 8000;

export function NotificationsPage() {
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const [filter, setFilter] = useState<NotificationFilter>('ALL');
    const [cursor, setCursor] = useState<string | null>(null);
    const [loadedNotifications, setLoadedNotifications] = useState<
        MockNotification[]
    >([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const {
        data,
        isLoading,
        isFetching,
        isError,
        refetch: refetchNotifications,
    } = useGetNotificationsQuery({
        cursor,
        limit: NOTIFICATIONS_LIMIT,
        filter,
    });

    const {
        data: stats,
        isLoading: isStatsLoading,
        refetch: refetchStats,
    } = useGetNotificationsStatsQuery(undefined, {
        pollingInterval: STATS_POLLING_INTERVAL,
    });

    const [markAllNotificationsAsRead] = useMarkAllNotificationsAsReadMutation();
    const [deleteNotification, { isLoading: isDeleting }] =
        useDeleteNotificationMutation();
    const [clearNotifications, { isLoading: isClearing }] =
        useClearNotificationsMutation();

    const isFirstLoading = isLoading && loadedNotifications.length === 0;
    const isLoadingMore = isFetching && loadedNotifications.length > 0;

    useEffect(() => {
        if (!data) {
            return;
        }

        const items = data.items || data.notifications || [];

        setLoadedNotifications((currentNotifications) => {
            if (!cursor) {
                return items;
            }

            return mergeNotificationsKeepingOrder(currentNotifications, items);
        });

        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
    }, [cursor, data]);

    useEffect(() => {
        setCursor(null);
        setLoadedNotifications([]);
        setNextCursor(null);
        setHasMore(true);
    }, [filter]);

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

    useEffect(() => {
        let isMounted = true;

        const markAsReadOnOpen = async () => {
            try {
                await markAllNotificationsAsRead().unwrap();

                if (!isMounted) {
                    return;
                }

                setLoadedNotifications((currentNotifications) =>
                    currentNotifications.map((notification) => ({
                        ...notification,
                        isRead: true,
                    }))
                );

                refetchStats();
                refetchNotifications();
            } catch {
                /*
                  Если mock/backend временно недоступен, страница все равно покажет
                  уведомления. Ошибка отметки прочитанными не должна ломать экран.
                */
            }
        };

        markAsReadOnOpen();

        return () => {
            isMounted = false;
        };
    }, [markAllNotificationsAsRead, refetchNotifications, refetchStats]);

    const handleRefresh = () => {
        setCursor(null);
        setLoadedNotifications([]);
        setNextCursor(null);
        setHasMore(true);

        refetchNotifications();
        refetchStats();
    };

    const handleDelete = async (notificationId: number) => {
        try {
            await deleteNotification(notificationId).unwrap();

            setLoadedNotifications((currentNotifications) =>
                currentNotifications.filter(
                    (notification) => notification.id !== notificationId
                )
            );

            refetchStats();
        } catch {
            window.alert('Не удалось удалить уведомление.');
        }
    };

    const handleClearAll = async () => {
        const isConfirmed = window.confirm('Удалить все ваши уведомления?');

        if (!isConfirmed) {
            return;
        }

        try {
            await clearNotifications().unwrap();

            setCursor(null);
            setLoadedNotifications([]);
            setNextCursor(null);
            setHasMore(false);

            refetchStats();
            refetchNotifications();
        } catch {
            window.alert('Не удалось очистить уведомления.');
        }
    };

    return (
        <Page>
            <Hero>
                <HeroContent>
                    <Eyebrow>Активность</Eyebrow>

                    <Title>Уведомления</Title>

                    <Subtitle>
                        Уведомления о заявках, лайках и комментариях. При открытии этой
                        страницы все новые уведомления автоматически помечаются прочитанными.
                    </Subtitle>
                </HeroContent>

                <HeroActions>
                    <RefreshButton type="button" onClick={handleRefresh}>
                        <FiRefreshCw />
                        Обновить
                    </RefreshButton>

                    {(stats?.total || loadedNotifications.length) > 0 && (
                        <DangerButton
                            type="button"
                            disabled={isClearing}
                            onClick={handleClearAll}
                        >
                            <FiTrash2 />
                            {isClearing ? 'Очищаем...' : 'Очистить'}
                        </DangerButton>
                    )}
                </HeroActions>
            </Hero>

            <StatsGrid>
                <StatCard>
                    <FiBell />
                    <div>
                        <strong>{isStatsLoading ? '...' : stats?.unread || 0}</strong>
                        <span>Новых</span>
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

                <StatCard>
                    <FiHeart />
                    <div>
                        <strong>{isStatsLoading ? '...' : stats?.social || 0}</strong>
                        <span>Лайки / комментарии</span>
                    </div>
                </StatCard>
            </StatsGrid>

            <Toolbar>
                <FilterGroup>
                    <FilterButton
                        type="button"
                        $active={filter === 'ALL'}
                        onClick={() => setFilter('ALL')}
                    >
                        Все
                    </FilterButton>

                    <FilterButton
                        type="button"
                        $active={filter === 'UNREAD'}
                        onClick={() => setFilter('UNREAD')}
                    >
                        Новые
                    </FilterButton>

                    <FilterButton
                        type="button"
                        $active={filter === 'REQUEST_APPROVED'}
                        onClick={() => setFilter('REQUEST_APPROVED')}
                    >
                        Одобрено
                    </FilterButton>

                    <FilterButton
                        type="button"
                        $active={filter === 'REQUEST_REJECTED'}
                        onClick={() => setFilter('REQUEST_REJECTED')}
                    >
                        Отклонено
                    </FilterButton>

                    <FilterButton
                        type="button"
                        $active={filter === 'NEW_LIKE'}
                        onClick={() => setFilter('NEW_LIKE')}
                    >
                        Лайки
                    </FilterButton>

                    <FilterButton
                        type="button"
                        $active={filter === 'NEW_COMMENT'}
                        onClick={() => setFilter('NEW_COMMENT')}
                    >
                        Комментарии
                    </FilterButton>
                </FilterGroup>

                <ToolbarMeta>
                    Всего: {isStatsLoading ? '...' : stats?.total || 0}
                </ToolbarMeta>
            </Toolbar>

            {isFirstLoading ? (
                <LoadingCard>
                    <FiLoader />
                    <h2>Загружаем уведомления</h2>
                    <p>Сейчас покажем вашу активность.</p>
                </LoadingCard>
            ) : isError && !loadedNotifications.length ? (
                <EmptyCard>
                    <FiAlertCircle />

                    <h2>Не удалось загрузить уведомления</h2>

                    <p>Попробуйте обновить страницу или повторить запрос.</p>

                    <PrimaryButton type="button" onClick={handleRefresh}>
                        Повторить
                    </PrimaryButton>
                </EmptyCard>
            ) : loadedNotifications.length ? (
                <>
                    <FeedMeta>
                        <span>Загружено на странице: {loadedNotifications.length}</span>

                        {isLoadingMore && (
                            <LoadingInline>
                                <FiLoader />
                                Подгружаем еще...
                            </LoadingInline>
                        )}
                    </FeedMeta>

                    <NotificationsList>
                        {loadedNotifications.map((notification) => (
                            <NotificationCard
                                key={notification.id}
                                $unread={!notification.isRead}
                            >
                                <NotificationIcon $type={notification.type}>
                                    {getNotificationIcon(notification.type)}
                                </NotificationIcon>

                                <NotificationBody>
                                    <NotificationTop>
                                        <div>
                                            <NotificationTitle>
                                                {notification.title}
                                                {!notification.isRead && <UnreadDot />}
                                            </NotificationTitle>

                                            <NotificationDate>
                                                {new Date(notification.createdAt).toLocaleString('ru-RU')}
                                            </NotificationDate>
                                        </div>

                                        <TypeBadge $type={notification.type}>
                                            {getNotificationTypeText(notification.type)}
                                        </TypeBadge>
                                    </NotificationTop>

                                    <NotificationText>{notification.text}</NotificationText>

                                    <NotificationActions>
                                        {notification.postId ? (
                                            <SmallLink to={`/posts/${notification.postId}`}>
                                                Открыть пост
                                            </SmallLink>
                                        ) : notification.requestId ? (
                                            <SmallLink to="/my-posts">Открыть мои заявки</SmallLink>
                                        ) : null}

                                        <DeleteButton
                                            type="button"
                                            disabled={isDeleting}
                                            onClick={() => handleDelete(notification.id)}
                                        >
                                            <FiTrash2 />
                                            Удалить
                                        </DeleteButton>
                                    </NotificationActions>
                                </NotificationBody>
                            </NotificationCard>
                        ))}
                    </NotificationsList>

                    <LoadMoreAnchor ref={loadMoreRef}>
                        {hasMore ? (
                            <LoadingMore>
                                <FiLoader />
                                <span>Листайте ниже — уведомления подгрузятся автоматически</span>
                            </LoadingMore>
                        ) : (
                            <EndMessage>
                                Вы посмотрели все уведомления по текущему фильтру
                            </EndMessage>
                        )}
                    </LoadMoreAnchor>
                </>
            ) : (
                <EmptyCard>
                    <FiAlertCircle />

                    <h2>Уведомлений пока нет</h2>

                    <p>
                        Когда админ одобрит или отклонит вашу заявку, а также когда появятся
                        новые лайки или комментарии, уведомления будут отображаться здесь.
                    </p>

                    <PrimaryLink to="/submit-content">Предложить публикацию</PrimaryLink>
                </EmptyCard>
            )}
        </Page>
    );
}

function mergeNotificationsKeepingOrder(
    first: MockNotification[],
    second: MockNotification[]
) {
    const map = new Map<number, MockNotification>();

    [...first, ...second].forEach((notification) => {
        map.set(notification.id, notification);
    });

    return Array.from(map.values());
}

function getNotificationIcon(type: NotificationType) {
    if (type === 'REQUEST_APPROVED') {
        return <FiCheckCircle />;
    }

    if (type === 'REQUEST_REJECTED') {
        return <FiXCircle />;
    }

    if (type === 'NEW_LIKE') {
        return <FiHeart />;
    }

    return <FiMessageCircle />;
}

function getNotificationTypeText(type: NotificationType) {
    if (type === 'REQUEST_APPROVED') {
        return 'Заявка одобрена';
    }

    if (type === 'REQUEST_REJECTED') {
        return 'Заявка отклонена';
    }

    if (type === 'NEW_LIKE') {
        return 'Новый лайк';
    }

    return 'Новый комментарий';
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
    radial-gradient(circle at bottom right, rgba(239, 68, 68, 0.14), transparent 34%),
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

const DangerButton = styled.button`
    min-height: 46px;
    padding: 0 16px;
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: ${({ theme }) => theme.radius.full};
    background: rgba(239, 68, 68, 0.1);
    color: #fecaca;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    font-weight: 900;

    &:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.16);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
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
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
        align-items: stretch;
        flex-direction: column;
    }
`;

const FilterGroup = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
`;

const FilterButton = styled.button<{ $active?: boolean }>`
    min-height: 40px;
    padding: 0 13px;
    border: 1px solid
    ${({ theme, $active }) =>
            $active ? 'rgba(139, 92, 246, 0.7)' : theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.full};
    background: ${({ $active }) =>
            $active
                    ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.75), rgba(37, 99, 235, 0.68))'
                    : 'rgba(255, 255, 255, 0.04)'};
    color: ${({ theme }) => theme.colors.text};
    font-weight: 900;

    &:hover {
        background: ${({ $active }) =>
                $active
                        ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.75), rgba(37, 99, 235, 0.68))'
                        : 'rgba(255,255,255,0.075)'};
    }
`;

const ToolbarMeta = styled.div`
    min-height: 40px;
    padding: 0 13px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.full};
    background: rgba(255, 255, 255, 0.04);
    color: ${({ theme }) => theme.colors.textMuted};
    display: inline-flex;
    align-items: center;
    font-size: 13px;
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

const LoadingCard = styled.section`
    min-height: 360px;
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
        animation: spin 0.8s linear infinite;
    }

    h2 {
        margin: 0 0 10px;
        font-size: clamp(24px, 4vw, 34px);
        letter-spacing: -0.06em;
    }

    p {
        max-width: 480px;
        margin: 0;
        color: ${({ theme }) => theme.colors.textMuted};
        line-height: 1.6;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
`;

const NotificationsList = styled.div`
    display: grid;
    gap: 12px;
`;

const NotificationCard = styled.article<{ $unread?: boolean }>`
    padding: 16px;
    border: 1px solid
    ${({ theme, $unread }) =>
            $unread ? 'rgba(139, 92, 246, 0.52)' : theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.lg};
    background: ${({ $unread }) =>
            $unread
                    ? 'linear-gradient(135deg, rgba(124,58,237,0.16), rgba(37,99,235,0.08)), rgba(21,25,43,0.88)'
                    : 'rgba(21, 25, 43, 0.78)'};
    display: grid;
    grid-template-columns: 52px minmax(0, 1fr);
    gap: 14px;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        grid-template-columns: 1fr;
    }
`;

const NotificationIcon = styled.div<{ $type: NotificationType }>`
    width: 52px;
    height: 52px;
    border-radius: 19px;
    color: white;
    display: grid;
    place-items: center;
    font-size: 24px;
    background: ${({ $type }) => {
        if ($type === 'REQUEST_APPROVED') {
            return 'linear-gradient(135deg, #16a34a, #2563eb)';
        }

        if ($type === 'REQUEST_REJECTED') {
            return 'linear-gradient(135deg, #ef4444, #7c3aed)';
        }

        if ($type === 'NEW_LIKE') {
            return 'linear-gradient(135deg, #ec4899, #7c3aed)';
        }

        return 'linear-gradient(135deg, #2563eb, #7c3aed)';
    }};
`;

const NotificationBody = styled.div`
    min-width: 0;
    display: grid;
    gap: 10px;
`;

const NotificationTop = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        flex-direction: column;
    }
`;

const NotificationTitle = styled.h2`
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 22px;
    letter-spacing: -0.055em;
`;

const UnreadDot = styled.span`
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #8b5cf6;
    box-shadow: 0 0 0 5px rgba(139, 92, 246, 0.18);
`;

const NotificationDate = styled.div`
    margin-top: 5px;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 13px;
    font-weight: 700;
`;

const TypeBadge = styled.div<{ $type: NotificationType }>`
    flex: 0 0 auto;
    min-height: 34px;
    padding: 0 11px;
    border-radius: ${({ theme }) => theme.radius.full};
    background: rgba(124, 58, 237, 0.12);
    color: ${({ theme }) => theme.colors.primaryHover};
    display: inline-flex;
    align-items: center;
    font-size: 12px;
    font-weight: 900;
`;

const NotificationText = styled.p`
    margin: 0;
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.6;
`;

const NotificationActions = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
`;

const SmallLink = styled(Link)`
    min-height: 34px;
    padding: 0 11px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.full};
    background: rgba(255, 255, 255, 0.05);
    color: ${({ theme }) => theme.colors.text};
    display: inline-flex;
    align-items: center;
    font-size: 12px;
    font-weight: 900;

    &:hover {
        background: rgba(255, 255, 255, 0.09);
    }
`;

const DeleteButton = styled.button`
    min-height: 34px;
    padding: 0 11px;
    border: 1px solid rgba(239, 68, 68, 0.26);
    border-radius: ${({ theme }) => theme.radius.full};
    background: rgba(239, 68, 68, 0.09);
    color: #fecaca;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 12px;
    font-weight: 900;

    &:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.15);
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