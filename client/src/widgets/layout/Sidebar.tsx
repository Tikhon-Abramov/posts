import { MouseEvent, useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import {
    FiBell,
    FiBookmark,
    FiFileText,
    FiHome,
    FiPlusCircle,
    FiSettings,
    FiShield,
    FiStar,
    FiUser,
} from 'react-icons/fi';

import type { AppDispatch, RootState } from '../../app/store';
import { openAuthModal } from '../../entities/auth/slice/authSlice';
import {
    getMockNotifications,
    MOCK_STORAGE_KEYS,
    type MockNotification,
} from '../../shared/lib/mockStorage';

export function Sidebar() {
    const dispatch = useDispatch<AppDispatch>();

    const { accessToken, user } = useSelector((state: RootState) => state.auth);

    const [notifications, setNotifications] = useState<MockNotification[]>([]);

    const isAuth = Boolean(accessToken);
    const isAdmin = user?.role === 'ADMIN';

    const unreadNotificationsCount = useMemo(() => {
        if (!user) {
            return 0;
        }

        return notifications.filter(
            (notification) => notification.userId === user.id && !notification.isRead
        ).length;
    }, [notifications, user]);

    useEffect(() => {
        const loadNotifications = () => {
            setNotifications(getMockNotifications());
        };

        loadNotifications();

        const intervalId = window.setInterval(loadNotifications, 1200);

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === MOCK_STORAGE_KEYS.notifications) {
                loadNotifications();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const handleProtectedClick = (
        event: MouseEvent<HTMLAnchorElement>,
        reason: string
    ) => {
        if (isAuth) {
            return;
        }

        event.preventDefault();

        dispatch(
            openAuthModal({
                mode: 'login',
                reason,
            })
        );
    };

    return (
        <Aside>
            <ProfileCard>
                <ProfileAvatar>
                    {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.nickname} />
                    ) : (
                        <FiUser />
                    )}
                </ProfileAvatar>

                <ProfileText>
                    <strong>{user?.nickname || 'Гость'}</strong>
                    <span>
            {user
                ? user.hasPremium
                    ? 'Premium аккаунт'
                    : 'Обычный аккаунт'
                : 'Войдите в аккаунт'}
          </span>
                </ProfileText>
            </ProfileCard>

            <NavGroup>
                <GroupTitle>Лента</GroupTitle>

                <NavItem to="/">
                    <FiHome />
                    Обычная лента
                </NavItem>

                <NavItem to="/premium">
                    <FiStar />
                    Премиум лента
                </NavItem>
            </NavGroup>

            <NavGroup>
                <GroupTitle>Мой аккаунт</GroupTitle>

                <NavItem
                    to="/my-posts"
                    onClick={(event) =>
                        handleProtectedClick(
                            event,
                            'Чтобы смотреть свои публикации, нужно войти в аккаунт.'
                        )
                    }
                >
                    <FiFileText />
                    Мои публикации
                </NavItem>

                <NavItem
                    to="/notifications"
                    onClick={(event) =>
                        handleProtectedClick(
                            event,
                            'Чтобы смотреть уведомления, нужно войти в аккаунт.'
                        )
                    }
                >
                    <FiBell />
                    <NavItemText>Уведомления</NavItemText>

                    {unreadNotificationsCount > 0 && (
                        <UnreadBadge>
                            {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                        </UnreadBadge>
                    )}
                </NavItem>

                <NavItem
                    to="/saved"
                    onClick={(event) =>
                        handleProtectedClick(
                            event,
                            'Чтобы смотреть сохраненные посты, нужно войти в аккаунт.'
                        )
                    }
                >
                    <FiBookmark />
                    Сохраненные
                </NavItem>

                <NavItem
                    to="/submit-content"
                    onClick={(event) =>
                        handleProtectedClick(
                            event,
                            'Чтобы предложить публикацию админу, нужно войти в аккаунт.'
                        )
                    }
                >
                    <FiPlusCircle />
                    Предложить пост
                </NavItem>

                <NavItem
                    to="/profile"
                    onClick={(event) =>
                        handleProtectedClick(
                            event,
                            'Чтобы открыть профиль, нужно войти в аккаунт.'
                        )
                    }
                >
                    <FiSettings />
                    Профиль
                </NavItem>
            </NavGroup>

            {isAdmin && (
                <AdminBlock>
                    <GroupTitle>Админ</GroupTitle>

                    <AdminNavItem to="/admin">
                        <FiShield />
                        Админ-панель
                    </AdminNavItem>
                </AdminBlock>
            )}
        </Aside>
    );
}

const Aside = styled.aside`
    position: sticky;
    top: 88px;
    height: calc(100vh - 110px);
    padding: 12px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.lg};
    background: rgba(16, 19, 34, 0.72);
    display: flex;
    flex-direction: column;
    gap: 14px;

    @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
        display: none;
    }
`;

const ProfileCard = styled.div`
    padding: 13px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 20px;
    background:
            radial-gradient(circle at top left, rgba(124, 58, 237, 0.18), transparent 36%),
            rgba(255, 255, 255, 0.035);
    display: flex;
    align-items: center;
    gap: 11px;
`;

const ProfileAvatar = styled.div`
    flex: 0 0 auto;
    width: 46px;
    height: 46px;
    overflow: hidden;
    border-radius: 17px;
    background: linear-gradient(135deg, #7c3aed, #2563eb);
    color: white;
    display: grid;
    place-items: center;
    font-size: 22px;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
`;

const ProfileText = styled.div`
    min-width: 0;
    display: grid;
    gap: 3px;

    strong {
        overflow: hidden;
        color: ${({ theme }) => theme.colors.text};
        font-size: 15px;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    span {
        overflow: hidden;
        color: ${({ theme }) => theme.colors.textMuted};
        font-size: 12px;
        font-weight: 800;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
`;

const NavGroup = styled.nav`
    display: grid;
    gap: 6px;
`;

const GroupTitle = styled.div`
    padding: 0 8px;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.09em;
`;

const NavItem = styled(NavLink)`
    min-height: 46px;
    padding: 0 13px;
    border-radius: 16px;
    color: ${({ theme }) => theme.colors.textMuted};
    display: flex;
    align-items: center;
    gap: 11px;
    font-weight: 800;

    svg {
        flex: 0 0 auto;
        font-size: 20px;
    }

    &.active {
        color: white;
        background: linear-gradient(
                135deg,
                rgba(124, 58, 237, 0.88),
                rgba(37, 99, 235, 0.76)
        );
    }

    &:hover {
        color: white;
        background: ${({ theme }) => theme.colors.bgCard};
    }
`;

const NavItemText = styled.span`
    min-width: 0;
    flex: 1;
`;

const UnreadBadge = styled.span`
    flex: 0 0 auto;
    min-width: 24px;
    height: 24px;
    padding: 0 7px;
    border-radius: ${({ theme }) => theme.radius.full};
    background: linear-gradient(135deg, #ef4444, #ec4899);
    color: white;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 900;
    box-shadow: 0 8px 22px rgba(239, 68, 68, 0.28);
`;

const AdminBlock = styled.div`
    margin-top: auto;
    display: grid;
    gap: 6px;
`;

const AdminNavItem = styled(NavItem)`
    color: #c4b5fd;
    background: rgba(124, 58, 237, 0.1);
    border: 1px solid rgba(124, 58, 237, 0.18);

    &.active {
        color: white;
        background: linear-gradient(
                135deg,
                rgba(124, 58, 237, 0.95),
                rgba(239, 68, 68, 0.72)
        );
    }
`;