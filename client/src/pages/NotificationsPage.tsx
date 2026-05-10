/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import {
  FiAlertCircle,
  FiBell,
  FiCheckCircle,
  FiHeart,
  FiLoader,
  FiMessageCircle,
  FiXCircle,
} from 'react-icons/fi';

import {
  useGetNotificationsQuery,
  useMarkAllNotificationsAsReadMutation,
} from '../entities/notification/api/notificationApi';
import type {
  MockNotification,
  NotificationType,
} from '../shared/lib/mockStorage';

const NOTIFICATIONS_LIMIT = 10;
const POLLING_INTERVAL = 8000;

export function NotificationsPage() {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

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
  } = useGetNotificationsQuery(
    {
      cursor: cursor || undefined,
      limit: NOTIFICATIONS_LIMIT,
      filter: 'ALL',
    },
    {
      refetchOnMountOrArgChange: true,
      pollingInterval: POLLING_INTERVAL,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  const [markAllNotificationsAsRead] = useMarkAllNotificationsAsReadMutation();

  const dataNotifications = useMemo(() => {
    return data?.items || data?.notifications || [];
  }, [data]);

  const visibleNotifications = useMemo(() => {
    if (loadedNotifications.length) {
      return loadedNotifications;
    }

    return dataNotifications;
  }, [dataNotifications, loadedNotifications]);

  const isFirstLoading =
    (isLoading || isFetching) && visibleNotifications.length === 0 && !data;

  useEffect(() => {
    refetchNotifications();
  }, [refetchNotifications]);

  useEffect(() => {
    if (!data) {
      return;
    }

    const items = data.items || data.notifications || [];

    setLoadedNotifications((currentNotifications) => {
      if (!cursor) {
        return items;
      }

      return mergeNotificationsKeepingFirstPriority(
        currentNotifications,
        items
      );
    });

    setNextCursor(data.nextCursor);
    setHasMore(data.hasMore);
  }, [cursor, data]);

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

        refetchNotifications();
      } catch {
        // Не ломаем страницу, если временно не удалось отметить прочитанными.
      }
    };

    markAsReadOnOpen();

    return () => {
      isMounted = false;
    };
  }, [markAllNotificationsAsRead, refetchNotifications]);

  const handleRefresh = () => {
    setCursor(null);
    setLoadedNotifications([]);
    setNextCursor(null);
    setHasMore(true);

    refetchNotifications();
  };

  if (isFirstLoading) {
    return (
      <StateCard>
        <FiLoader />

        <h2>Загружаем уведомления</h2>

        <p>Сейчас покажем вашу активность.</p>
      </StateCard>
    );
  }

  if (isError && !visibleNotifications.length) {
    return (
      <StateCard>
        <FiAlertCircle />

        <h2>Не удалось загрузить уведомления</h2>

        <p>Попробуйте обновить страницу или повторить запрос.</p>

        <PrimaryButton type="button" onClick={handleRefresh}>
          Повторить
        </PrimaryButton>
      </StateCard>
    );
  }

  return (
    <Page>
      {visibleNotifications.length ? (
        <>
          <NotificationsList>
            {visibleNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                $unread={!notification.isRead}
              >
                <NotificationIcon $type={notification.type}>
                  {getNotificationIcon(notification.type)}
                </NotificationIcon>

                <NotificationContent>
                  <NotificationTop>
                    <TypeBadge $type={notification.type}>
                      {getNotificationTypeText(notification.type)}
                    </TypeBadge>

                    {!notification.isRead && <UnreadDot />}
                  </NotificationTop>

                  {notification.postId ? (
                    <NotificationLink to={`/posts/${notification.postId}`}>
                      {notification.text}
                    </NotificationLink>
                  ) : notification.requestId ? (
                    <NotificationLink to="/my-posts">
                      {notification.text}
                    </NotificationLink>
                  ) : (
                    <NotificationText>{notification.text}</NotificationText>
                  )}
                </NotificationContent>
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
              <EndMessage>Вы посмотрели все уведомления</EndMessage>
            )}
          </LoadMoreAnchor>
        </>
      ) : (
        <EmptyCard>
          <FiBell />

          <h2>Уведомлений пока нет</h2>

          

          <PrimaryLink to="/content-request">Предложить публикацию</PrimaryLink>
        </EmptyCard>
      )}
    </Page>
  );
}

function mergeNotificationsKeepingFirstPriority(
  first: MockNotification[],
  second: MockNotification[]
) {
  const result: MockNotification[] = [];
  const seen = new Set<number>();

  [...first, ...second].forEach((notification) => {
    if (seen.has(notification.id)) {
      return;
    }

    seen.add(notification.id);
    result.push(notification);
  });

  return result;
}

function getNotificationIcon(type: NotificationType) {
  if (type === 'REQUEST_APPROVED') {
    return <FiCheckCircle />;
  }

  if (type === 'REQUEST_REJECTED') {
    return <FiXCircle />;
  }

  if (type === 'NEW_COMMENT') {
    return <FiMessageCircle />;
  }

  return <FiHeart />;
}

function getNotificationTypeText(type: NotificationType) {
  if (type === 'REQUEST_APPROVED') {
    return 'Заявка одобрена';
  }

  if (type === 'REQUEST_REJECTED') {
    return 'Заявка отклонена';
  }

  if (type === 'NEW_COMMENT') {
    return 'Комментарий';
  }

  return 'Лайк';
}

const Page = styled.div`
  display: grid;
  gap: 14px;
`;

const StateCard = styled.section`
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
`;

const NotificationsList = styled.div`
  display: grid;
  gap: 8px;
`;

const NotificationCard = styled.article<{ $unread?: boolean }>`
  padding: 12px;
  border: 1px solid
    ${({ theme, $unread }) =>
      $unread ? 'rgba(139, 92, 246, 0.42)' : theme.colors.border};
  border-radius: 18px;
  background: ${({ $unread }) =>
    $unread
      ? 'linear-gradient(135deg, rgba(124,58,237,0.11), rgba(37,99,235,0.05)), rgba(21,25,43,0.78)'
      : 'rgba(21, 25, 43, 0.68)'};
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 10px;
  align-items: flex-start;
`;

const NotificationIcon = styled.div<{ $type: NotificationType }>`
  width: 34px;
  height: 34px;
  border-radius: 13px;
  color: white;
  display: grid;
  place-items: center;
  font-size: 16px;
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

const NotificationContent = styled.div`
  min-width: 0;
  display: grid;
  gap: 6px;
`;

const NotificationTop = styled.div`
  min-height: 22px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TypeBadge = styled.div<{ $type: NotificationType }>`
  width: fit-content;
  min-height: 22px;
  padding: 0 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(124, 58, 237, 0.12);
  color: ${({ theme }) => theme.colors.primaryHover};
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 900;
`;

const UnreadDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #8b5cf6;
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.14);
`;

const NotificationText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  line-height: 1.45;
`;

const NotificationLink = styled(Link)`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  line-height: 1.45;

  &:hover {
    color: ${({ theme }) => theme.colors.primaryHover};
  }
`;

const LoadMoreAnchor = styled.div`
  min-height: 74px;
  display: grid;
  place-items: center;
`;

const LoadingMore = styled.div`
  padding: 11px 15px;
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