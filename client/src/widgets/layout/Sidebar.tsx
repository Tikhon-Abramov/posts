import type { ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import {
    FiBell,
    FiBookmark,
    FiCreditCard,
    FiFilePlus,
    FiGrid,
    FiHome,
    FiInbox,
    FiLogOut,
    FiPlusCircle,
    FiShield,
    FiStar,
    FiUser,
} from 'react-icons/fi';

import type { AppDispatch, RootState } from '../../app/store';
import { logout, openAuthModal } from '../../entities/auth/slice/authSlice';
import { useGetNotificationsStatsQuery } from '../../entities/notification/api/notificationApi';
import { getMediaUrl } from '../../shared/lib/getMediaUrl';

interface NavigationItem {
    to: string;
    label: string;
    icon: ReactNode;
    end?: boolean;
    badge?: number;
    isAdminOnly?: boolean;
}

export function Sidebar() {
    const dispatch = useDispatch<AppDispatch>();

    const { accessToken, user } = useSelector((state: RootState) => state.auth);

    const isAuth = Boolean(accessToken);
    const isAdmin = user?.role === 'ADMIN';
    const avatarUrl = getMediaUrl(user?.avatarUrl);

    const { data: notificationsStats } = useGetNotificationsStatsQuery(undefined, {
        skip: !isAuth,
    });

    const unreadNotificationsCount = notificationsStats?.unread || 0;

    const navigationItems: NavigationItem[] = [
        {
            to: '/',
            label: 'Лента',
            icon: <FiHome />,
            end: true,
        },
        {
            to: '/premium',
            label: 'Premium',
            icon: <FiStar />,
        },
        {
            to: '/saved',
            label: 'Сохраненные',
            icon: <FiBookmark />,
        },
        {
            to: '/my-posts',
            label: 'Мои публикации',
            icon: <FiGrid />,
        },
        {
            to: '/content-request',
            label: 'Предложить пост',
            icon: <FiFilePlus />,
        },
        {
            to: '/notifications',
            label: 'Уведомления',
            icon: <FiBell />,
            badge: unreadNotificationsCount,
        },
        {
            to: '/subscription',
            label: 'Подписка',
            icon: <FiCreditCard />,
        },
        {
            to: '/profile',
            label: 'Профиль',
            icon: <FiUser />,
        },
        {
            to: '/admin/requests',
            label: 'Заявки',
            icon: <FiInbox />,
            isAdminOnly: true,
        },
        {
            to: '/admin/posts',
            label: 'Посты',
            icon: <FiShield />,
            isAdminOnly: true,
        },
        {
            to: '/admin/posts/create',
            label: 'Создать пост',
            icon: <FiPlusCircle />,
            isAdminOnly: true,
        },
    ];

    const visibleNavigationItems = navigationItems.filter((item) => {
        if (item.isAdminOnly) {
            return isAdmin;
        }

        return true;
    });

    const handleOpenAuth = () => {
        dispatch(
            openAuthModal({
                mode: 'login',
                reason: 'Войдите в аккаунт, чтобы использовать все возможности сервиса.',
            })
        );
    };

    const handleLogout = () => {
        dispatch(logout());
    };

    return (
        <Aside>
            <LogoLink to="/">
                <LogoMark>PF</LogoMark>

                <LogoText>
                    <strong>PulseFeed</strong>
                    <span>media platform</span>
                </LogoText>
            </LogoLink>

            <Navigation>
                {visibleNavigationItems.map((item) => (
                    <NavigationLink key={item.to} to={item.to} end={item.end}>
                        <IconBox>{item.icon}</IconBox>

                        <span>{item.label}</span>

                        {Boolean(item.badge) && (
                            <Badge>{item.badge && item.badge > 99 ? '99+' : item.badge}</Badge>
                        )}
                    </NavigationLink>
                ))}
            </Navigation>

            <BottomBlock>
                {isAuth && user ? (
                    <UserCard>
                        <AvatarLink to="/profile">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={user.nickname} />
                            ) : (
                                <FiUser />
                            )}
                        </AvatarLink>

                        <UserInfo>
                            <strong>@{user.nickname}</strong>

                            <span>
                {user.role === 'ADMIN'
                    ? 'Администратор'
                    : user.hasPremium
                        ? 'Premium'
                        : 'Пользователь'}
              </span>
                        </UserInfo>

                        <LogoutButton type="button" onClick={handleLogout}>
                            <FiLogOut />
                        </LogoutButton>
                    </UserCard>
                ) : (
                    <AuthCard>
                        <AuthTitle>Войдите в аккаунт</AuthTitle>

                        <AuthText>
                            Лайки, сохранения, заявки, уведомления и Premium доступны после
                            авторизации.
                        </AuthText>

                        <AuthButton type="button" onClick={handleOpenAuth}>
                            Войти
                        </AuthButton>
                    </AuthCard>
                )}
            </BottomBlock>
        </Aside>
    );
}

const Aside = styled.aside`
    position: sticky;
    top: 16px;
    flex: 0 0 280px;
    width: 280px;
    min-width: 280px;
    max-width: 280px;
    height: calc(100vh - 32px);
    box-sizing: border-box;
    padding: 16px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.lg};
    background:
            radial-gradient(circle at top left, rgba(124, 58, 237, 0.16), transparent 34%),
            rgba(15, 18, 32, 0.88);
    backdrop-filter: blur(18px);
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-self: flex-start;
    z-index: 1;

    @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
        display: none;
    }
`;

const LogoLink = styled(Link)`
    padding: 8px;
    border-radius: 20px;
    color: ${({ theme }) => theme.colors.text};
    display: flex;
    align-items: center;
    gap: 12px;

    &:hover {
        background: rgba(255, 255, 255, 0.045);
    }
`;

const LogoMark = styled.div`
    flex: 0 0 auto;
    width: 48px;
    height: 48px;
    border-radius: 18px;
    background: linear-gradient(135deg, #7c3aed, #2563eb);
    color: white;
    display: grid;
    place-items: center;
    font-size: 16px;
    font-weight: 950;
    letter-spacing: -0.04em;
    box-shadow: 0 18px 38px rgba(124, 58, 237, 0.24);
`;

const LogoText = styled.div`
    min-width: 0;
    display: grid;
    gap: 2px;

    strong {
        font-size: 18px;
        letter-spacing: -0.05em;
    }

    span {
        color: ${({ theme }) => theme.colors.textMuted};
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
    }
`;

const Navigation = styled.nav`
    min-height: 0;
    padding: 6px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.035);
    display: grid;
    gap: 4px;
    overflow-y: auto;
`;

const NavigationLink = styled(NavLink)`
    min-height: 46px;
    padding: 0 10px;
    border-radius: 18px;
    color: ${({ theme }) => theme.colors.textMuted};
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 900;
    position: relative;

    &.active {
        background: linear-gradient(
                135deg,
                rgba(124, 58, 237, 0.82),
                rgba(37, 99, 235, 0.72)
        );
        color: white;
        box-shadow: 0 14px 34px rgba(37, 99, 235, 0.18);
    }

    &:hover:not(.active) {
        background: rgba(255, 255, 255, 0.06);
        color: ${({ theme }) => theme.colors.text};
    }
`;

const IconBox = styled.span`
    flex: 0 0 auto;
    width: 30px;
    height: 30px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.055);
    display: grid;
    place-items: center;
    font-size: 16px;

    ${NavigationLink}.active & {
        background: rgba(255, 255, 255, 0.16);
    }
`;

const Badge = styled.span`
    min-width: 22px;
    height: 22px;
    margin-left: auto;
    padding: 0 7px;
    border-radius: ${({ theme }) => theme.radius.full};
    background: #ef4444;
    color: white;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 950;
    line-height: 1;
`;

const BottomBlock = styled.div`
    margin-top: auto;
    display: grid;
    gap: 10px;
`;

const UserCard = styled.div`
    padding: 10px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 22px;
    background:
            radial-gradient(circle at top left, rgba(124, 58, 237, 0.16), transparent 36%),
            rgba(255, 255, 255, 0.045);
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
`;

const AvatarLink = styled(Link)`
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

const UserInfo = styled.div`
    min-width: 0;
    display: grid;
    gap: 3px;

    strong {
        overflow: hidden;
        color: ${({ theme }) => theme.colors.text};
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 14px;
    }

    span {
        color: ${({ theme }) => theme.colors.textMuted};
        font-size: 12px;
        font-weight: 800;
    }
`;

const LogoutButton = styled.button`
    flex: 0 0 auto;
    width: 38px;
    height: 38px;
    border: 1px solid rgba(239, 68, 68, 0.28);
    border-radius: 15px;
    background: rgba(239, 68, 68, 0.1);
    color: #fecaca;
    display: grid;
    place-items: center;
    font-size: 18px;

    &:hover {
        background: rgba(239, 68, 68, 0.16);
    }
`;

const AuthCard = styled.div`
    padding: 14px;
    border: 1px solid rgba(139, 92, 246, 0.28);
    border-radius: 22px;
    background:
            radial-gradient(circle at top left, rgba(124, 58, 237, 0.18), transparent 38%),
            rgba(255, 255, 255, 0.045);
    display: grid;
    gap: 10px;
`;

const AuthTitle = styled.strong`
    color: ${({ theme }) => theme.colors.text};
    font-size: 16px;
    letter-spacing: -0.04em;
`;

const AuthText = styled.p`
    margin: 0;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 13px;
    line-height: 1.45;
`;

const AuthButton = styled.button`
    min-height: 42px;
    border: none;
    border-radius: ${({ theme }) => theme.radius.full};
    background: linear-gradient(135deg, #7c3aed, #2563eb);
    color: white;
    font-weight: 900;

    &:hover {
        filter: brightness(1.08);
    }
`;