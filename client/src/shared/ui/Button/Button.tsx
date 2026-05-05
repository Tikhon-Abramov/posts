import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styled, { css } from 'styled-components';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export function Button({ children, variant = 'primary', fullWidth = false, ...props }: ButtonProps) {
  return (
    <ButtonRoot $variant={variant} $fullWidth={fullWidth} {...props}>
      {children}
    </ButtonRoot>
  );
}

const ButtonRoot = styled.button<{ $variant: ButtonVariant; $fullWidth: boolean }>`
  min-height: 46px;
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};
  padding: 0 18px;
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radius.full};
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 800;
  transition: 0.18s ease;

  ${({ $variant, theme }) => {
    if ($variant === 'primary') {
      return css`
        background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.blue});
      `;
    }

    if ($variant === 'danger') {
      return css`
        background: linear-gradient(135deg, ${theme.colors.red}, ${theme.colors.pink});
      `;
    }

    if ($variant === 'ghost') {
      return css`
        border-color: ${theme.colors.border};
        background: transparent;
      `;
    }

    return css`
      border-color: ${theme.colors.border};
      background: ${theme.colors.bgCard};
    `;
  }}

  &:hover {
    transform: translateY(-1px);
    filter: brightness(1.08);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;
