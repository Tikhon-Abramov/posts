import { NavLink } from 'react-router-dom';
import styled from 'styled-components';

export function FeedTabs() {
  return (
    <Tabs>
      <Tab to="/">Обычная</Tab>
      <Tab to="/premium">Премиум</Tab>
    </Tabs>
  );
}

const Tabs = styled.div`
  display: inline-flex;
  padding: 5px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.bgSoft};
`;

const Tab = styled(NavLink)`
  padding: 9px 14px;
  border-radius: ${({ theme }) => theme.radius.full};
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: 800;

  &.active {
    color: white;
    background: linear-gradient(135deg, #7c3aed, #2563eb);
  }
`;
