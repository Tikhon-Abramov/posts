import styled, { keyframes } from 'styled-components';

export function Loader() {
  return <LoaderRoot aria-label="Загрузка" />;
}

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const LoaderRoot = styled.div`
  width: 28px;
  height: 28px;
  border: 3px solid rgba(255, 255, 255, 0.16);
  border-top-color: ${({ theme }) => theme.colors.primaryHover};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;
