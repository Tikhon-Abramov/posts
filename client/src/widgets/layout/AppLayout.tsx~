import { Outlet } from 'react-router-dom';
import styled from 'styled-components';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  return (
    <Page>
      <Header />

      <Content>
        <Sidebar />

        <Main>
          <Outlet />
        </Main>
      </Content>

      <BottomNavigation />
    </Page>
  );
}

const Page = styled.div`
  min-height: 100vh;
`;

const Content = styled.div`
  width: min(1180px, 100%);
  margin: 0 auto;
  padding: 18px 16px 90px;
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 24px;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    display: block;
    padding: 14px 12px 86px;
  }
`;

const Main = styled.main`
  min-width: 0;
`;
