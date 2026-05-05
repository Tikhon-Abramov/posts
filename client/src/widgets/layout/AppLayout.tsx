import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import styled from 'styled-components';

import { Sidebar } from './Sidebar';
import { BottomNavigation } from './BottomNavigation';

interface AppLayoutProps {
    children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
    return (
        <PageShell>
            <ContentShell>
                <Sidebar />

                <MainContent>
                    {children || <Outlet />}
                </MainContent>
            </ContentShell>

            <BottomNavigation />
        </PageShell>
    );
}

const PageShell = styled.div`
    min-height: 100vh;
    width: 100%;
    box-sizing: border-box;
    padding: 16px;

    @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
        padding: 12px 12px 96px;
    }
`;

const ContentShell = styled.div`
    width: min(100%, 1480px);
    margin: 0 auto;
    display: flex;
    align-items: flex-start;
    gap: 18px;

    @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
        display: block;
    }
`;

const MainContent = styled.main`
    min-width: 0;
    width: 100%;
    flex: 1 1 auto;
    box-sizing: border-box;
    display: grid;
    gap: 18px;
`;