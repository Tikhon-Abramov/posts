import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import {
    FiBell,
    FiBookmark,
    FiCreditCard,
    FiFilePlus,
    FiGrid,
    FiHome,
    FiShield,
    FiStar,
    FiUser,
} from 'react-icons/fi';

import type { RootState } from '../../app/store';
import { useGetNotificationsStatsQuery } from '../../entities/notification/api/notificationApi';
import { useGetAdminContentRequestsStatsQuery } from '../../entities/admin/api/adminContentRequestApi';
import { getMediaUrl } from '../../shared/lib/getMediaUrl';

const NOTIFICATIONS_STATS_POLLING_INTERVAL = 5000;
const ADMIN_REQUESTS_STATS_POLLING_INTERVAL = 5000;

interface NavigationItem {
    to: string;
    label: string;
    icon: ReactNode;
    end?: boolean;
    badge?: number;
    isAdminOnly?: boolean;
}

export function BottomNavigation() {
    const { accessToken, user } = useSelector((state: RootState) => state.auth);

    const isAuth = Boolean(accessToken);
    const isAdmin = user?.role === 'ADMIN';
    const avatarUrl = getMediaUrl(user?.avatarUrl);

    const { data: notificationsStats } = useGetNotificationsStatsQuery(undefined, {
        skip: !isAuth,
        pollingInterval: NOTIFICATIONS_STATS_POLLING_INTERVAL,
        refetchOnMountOrArgChange: true,
        refetchOnFocus: true,
        refetchOnReconnect: true,
    });

    const { data: adminRequestsStats } = useGetAdminContentRequestsStatsQuery(
        undefined,
        {
            skip: !isAdmin,
            pollingInterval: ADMIN_REQUESTS_STATS_POLLING_INTERVAL,
            refetchOnMountOrArgChange: true,
            refetchOnFocus: true,
            refetchOnReconnect: true,
        }
    );

    const unreadNotificationsCount = notificationsStats?.unread || 0;
    const pendingAdminRequestsCount = adminRequestsStats?.pending || 0;

    const navigationItems: NavigationItem[] = [
        {
            to: '/',
            label: 'Лента',
            icon: <FiHome />,
            end: true,
        },
        /*{
            to: '/premium',
            label: 'Premium',
            icon: <FiStar />,
        },*/
        {
            to: '/saved',
            label: 'Сохр.',
            icon: <FiBookmark />,
        },
        {
            to: '/my-posts',
            label: 'Мои',
            icon: <FiGrid />,
        },
        {
            to: '/content-request',
            label: 'Заявка',
            icon: <FiFilePlus />,
        },
        {
            to: '/notifications',
            label: 'Увед.',
            icon: <FiBell />,
            badge: unreadNotificationsCount,
        },
        /*{
            to: '/subscription',
            label: 'Подп.',
            icon: <FiCreditCard />,
        },*/
        {
            to: '/profile',
            label: 'Профиль',
            icon: avatarUrl ? (
                <ProfileAvatar>
                    <img src={avatarUrl} alt={user?.nickname || 'Пользователь'} />
                </ProfileAvatar>
            ) : (
                <FiUser />
            ),
        },
        {
            to: '/admin',
            label: 'Админка',
            icon: <FiShield />,
            badge: pendingAdminRequestsCount,
            isAdminOnly: true,
        },
    ];

    const visibleNavigationItems = navigationItems.filter((item) => {
        if (item.isAdminOnly) {
            return isAdmin;
        }

        return true;
    });

    return (
        <Wrapper>
            <Scroller>
                {visibleNavigationItems.map((item) => (
                    <NavigationLink key={item.to} to={item.to} end={item.end}>
                        <IconBox>{item.icon}</IconBox>

                        <Label>{item.label}</Label>

                        {Boolean(item.badge) && (
                            <Badge>{item.badge && item.badge > 99 ? '99+' : item.badge}</Badge>
                        )}
                    </NavigationLink>
                ))}
            </Scroller>
        </Wrapper>
    );
}

const Wrapper = styled.nav`
    position: fixed;
    left: 10px;
    right: 10px;
    bottom: 10px;
    z-index: 1000;
    padding: 8px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 26px;
    background:
            radial-gradient(circle at top left, rgba(124, 58, 237, 0.18), transparent 34%),
            rgba(15, 18, 32, 0.92);
    backdrop-filter: blur(18px);
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.34);

    @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
        display: none;
    }
`;

const Scroller = styled.div`
    display: flex;
    gap: 6px;
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }
`;

const NavigationLink = styled(NavLink)`
    position: relative;
    flex: 0 0 auto;
    min-width: 70px;
    min-height: 58px;
    padding: 7px 9px;
    border-radius: 20px;
    color: ${({ theme }) => theme.colors.textMuted};
    display: grid;
    place-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 900;

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
    width: 28px;
    height: 28px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.055);
    display: grid;
    place-items: center;
    font-size: 17px;

    ${NavigationLink}.active & {
        background: rgba(255, 255, 255, 0.16);
    }
`;

const Label = styled.span`
    max-width: 64px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const Badge = styled.span`
    position: absolute;
    right: 7px;
    top: 6px;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border: 2px solid rgba(15, 18, 32, 0.92);
    border-radius: ${({ theme }) => theme.radius.full};
    background: #ef4444;
    color: white;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 950;
    line-height: 1;
`;

const ProfileAvatar = styled.span`
    width: 28px;
    height: 28px;
    overflow: hidden;
    border-radius: 12px;
    display: block;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
`;