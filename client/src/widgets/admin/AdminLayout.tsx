import { Outlet, Link, NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import {
    FiBarChart2,
    FiFileText,
    FiHome,
    FiInbox,
    FiLogOut,
    FiPlusCircle,
    FiRefreshCw,
    FiShield,
    FiStar,
    FiTrash2,
    FiUser,
} from 'react-icons/fi';

import type { AppDispatch, RootState } from '../../app/store';
import { logout } from '../../entities/auth/slice/authSlice';
import { useLogoutUserMutation } from '../../entities/auth/api/authApi';
import { clearMockStorage } from '../../shared/lib/mockStorage';

export function AdminLayout() {
    const dispatch = useDispatch<AppDispatch>();

    const user = useSelector((state: RootState) => state.auth.user);

    const [logoutUser, { isLoading: isLogoutLoading }] = useLogoutUserMutation();

    const handleLogout = async () => {
        try {
            await logoutUser().unwrap();
        } catch {
            /*
              Даже если сервер не ответил, локально выходим,
              чтобы не держать пользователя с битой сессией.
            */
        } finally {
            dispatch(logout());
        }
    };

    const handleResetMockData = () => {
        const isConfirmed = window.confirm(
            'Сбросить все mock-данные? Будут очищены тестовые пользователи, посты, лайки, сохранения, комментарии, заявки и уведомления. Текущий вход сохранится.'
        );

        if (!isConfirmed) {
            return;
        }

        clearMockStorage();

        window.location.reload();
    };

    return (
        <Page>
            <Sidebar>
                <Brand to="/admin">
                    <BrandIcon>
                        <FiShield />
                    </BrandIcon>

                    <BrandText>
                        <strong>PulseAdmin</strong>
                        <span>Панель управления</span>
                    </BrandText>
                </Brand>

                <AdminProfile>
                    <Avatar>
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.nickname} />
                        ) : (
                            <FiUser />
                        )}
                    </Avatar>

                    <ProfileText>
                        <strong>{user?.nickname || 'Admin'}</strong>
                        <span>{user?.email || 'admin account'}</span>
                    </ProfileText>
                </AdminProfile>

                <Nav>
                    <NavItem to="/admin" end>
                        <FiBarChart2 />
                        Обзор
                    </NavItem>

                    <NavItem to="/admin/posts">
                        <FiFileText />
                        Посты
                    </NavItem>

                    <NavItem to="/admin/posts/create">
                        <FiPlusCircle />
                        Создать пост
                    </NavItem>

                    <NavItem to="/admin/requests">
                        <FiInbox />
                        Заявки
                    </NavItem>
                </Nav>

                <BottomActions>
                    <BackLink to="/">
                        <FiHome />
                        На сайт
                    </BackLink>

                    {user?.role === 'ADMIN' && (
                        <ResetMockButton type="button" onClick={handleResetMockData}>
                            <FiTrash2 />
                            Сбросить mock
                        </ResetMockButton>
                    )}

                    <LogoutButton
                        type="button"
                        disabled={isLogoutLoading}
                        onClick={handleLogout}
                    >
                        <FiLogOut />
                        {isLogoutLoading ? 'Выходим...' : 'Выйти'}
                    </LogoutButton>
                </BottomActions>
            </Sidebar>

            <MainArea>
                <Topbar>
                    <TopbarInfo>
                        <Eyebrow>Admin dashboard</Eyebrow>
                        <h1>Управление контентом</h1>
                    </TopbarInfo>

                    <TopbarBadge>
                        <FiStar />
                        Admin
                    </TopbarBadge>
                </Topbar>

                <MockNotice>
                    <FiRefreshCw />
                    <span>
            Сейчас проект работает в mock-режиме. Данные хранятся в localStorage,
            а кнопка сброса доступна только администратору.
          </span>
                </MockNotice>

                <Content>
                    <Outlet />
                </Content>
            </MainArea>
        </Page>
    );
}

const Page = styled.div`
    min-height: 100vh;
    background:
            radial-gradient(circle at top left, rgba(124, 58, 237, 0.2), transparent 32%),
            radial-gradient(circle at top right, rgba(37, 99, 235, 0.12), transparent 34%),
            radial-gradient(circle at bottom right, rgba(239, 68, 68, 0.12), transparent 34%),
            ${({ theme }) => theme.colors.bg};
    color: ${({ theme }) => theme.colors.text};
    display: grid;
    grid-template-columns: 290px minmax(0, 1fr);

    @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
        grid-template-columns: 1fr;
    }
`;

const Sidebar = styled.aside`
    position: sticky;
    top: 0;
    min-height: 100vh;
    padding: 18px;
    border-right: 1px solid ${({ theme }) => theme.colors.border};
    background: rgba(8, 10, 18, 0.82);
    backdrop-filter: blur(18px);
    display: flex;
    flex-direction: column;
    gap: 18px;

    @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
        position: static;
        min-height: auto;
        border-right: none;
        border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    }
`;

const Brand = styled(Link)`
    padding: 14px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 22px;
    background:
            linear-gradient(135deg, rgba(124, 58, 237, 0.16), rgba(37, 99, 235, 0.1)),
            rgba(255, 255, 255, 0.035);
    display: flex;
    align-items: center;
    gap: 12px;
`;

const BrandIcon = styled.div`
    width: 48px;
    height: 48px;
    border-radius: 18px;
    background: linear-gradient(135deg, #7c3aed, #2563eb);
    color: white;
    display: grid;
    place-items: center;
    font-size: 24px;
    box-shadow: 0 18px 42px rgba(124, 58, 237, 0.28);
`;

const BrandText = styled.div`
    min-width: 0;
    display: grid;
    gap: 3px;

    strong {
        font-size: 20px;
        letter-spacing: -0.05em;
    }

    span {
        color: ${({ theme }) => theme.colors.textMuted};
        font-size: 13px;
        font-weight: 700;
    }
`;

const AdminProfile = styled.div`
    padding: 14px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 22px;
    background: rgba(21, 25, 43, 0.76);
    display: flex;
    align-items: center;
    gap: 12px;
`;

const Avatar = styled.div`
    flex: 0 0 auto;
    width: 46px;
    height: 46px;
    overflow: hidden;
    border-radius: 17px;
    background: linear-gradient(135deg, #7c3aed, #ef4444);
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
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    span {
        overflow: hidden;
        color: ${({ theme }) => theme.colors.textMuted};
        font-size: 13px;
        font-weight: 700;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
`;

const Nav = styled.nav`
    display: grid;
    gap: 8px;

    @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        grid-template-columns: 1fr 1fr;
    }
`;

const NavItem = styled(NavLink)`
    min-height: 48px;
    padding: 0 14px;
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
                rgba(124, 58, 237, 0.9),
                rgba(37, 99, 235, 0.78)
        );
        box-shadow: 0 14px 36px rgba(124, 58, 237, 0.22);
    }

    &:hover {
        color: white;
        background: rgba(255, 255, 255, 0.065);
    }

    @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
        justify-content: center;
    }

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        justify-content: flex-start;
    }
`;

const BottomActions = styled.div`
    margin-top: auto;
    display: grid;
    gap: 8px;

    @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
        margin-top: 0;
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        grid-template-columns: 1fr;
    }
`;

const BackLink = styled(Link)`
    min-height: 46px;
    padding: 0 14px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.045);
    color: ${({ theme }) => theme.colors.text};
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    font-weight: 900;

    &:hover {
        background: rgba(255, 255, 255, 0.08);
    }
`;

const ResetMockButton = styled.button`
    min-height: 46px;
    padding: 0 14px;
    border: 1px solid rgba(245, 158, 11, 0.34);
    border-radius: 16px;
    background: rgba(245, 158, 11, 0.1);
    color: #fde68a;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    font-weight: 900;

    &:hover {
        background: rgba(245, 158, 11, 0.16);
    }
`;

const LogoutButton = styled.button`
    min-height: 46px;
    padding: 0 14px;
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 16px;
    background: rgba(239, 68, 68, 0.1);
    color: #fecaca;
    display: flex;
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

const MainArea = styled.main`
    min-width: 0;
    padding: 18px;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        padding: 12px;
    }
`;

const Topbar = styled.header`
    margin-bottom: 12px;
    padding: 18px 20px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.lg};
    background: rgba(21, 25, 43, 0.76);
    backdrop-filter: blur(18px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        align-items: flex-start;
        flex-direction: column;
    }
`;

const TopbarInfo = styled.div`
    min-width: 0;

    h1 {
        margin: 4px 0 0;
        font-size: clamp(26px, 4vw, 42px);
        line-height: 1;
        letter-spacing: -0.07em;
    }
`;

const Eyebrow = styled.div`
    color: ${({ theme }) => theme.colors.primaryHover};
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.08em;
`;

const TopbarBadge = styled.div`
    flex: 0 0 auto;
    min-height: 40px;
    padding: 0 14px;
    border: 1px solid rgba(236, 72, 153, 0.3);
    border-radius: ${({ theme }) => theme.radius.full};
    background: rgba(236, 72, 153, 0.1);
    color: #fbcfe8;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 900;
`;

const MockNotice = styled.div`
    margin-bottom: 18px;
    padding: 13px 15px;
    border: 1px solid rgba(245, 158, 11, 0.26);
    border-radius: 18px;
    background: rgba(245, 158, 11, 0.08);
    color: #fde68a;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    line-height: 1.45;
    font-size: 14px;
    font-weight: 800;

    svg {
        flex: 0 0 auto;
        margin-top: 2px;
    }
`;

const Content = styled.div`
    min-width: 0;
`;