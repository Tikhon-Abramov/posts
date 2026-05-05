import type { InputHTMLAttributes } from 'react';
import styled from 'styled-components';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, ...props }: InputProps) {
  return (
    <Field>
      {label && <Label>{label}</Label>}
      <InputRoot {...props} />
      {error && <ErrorText>{error}</ErrorText>}
    </Field>
  );
}

const Field = styled.label`
  display: grid;
  gap: 8px;
`;

const Label = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 14px;
  font-weight: 700;
`;

const InputRoot = styled.input`
  width: 100%;
  height: 48px;
  padding: 0 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  outline: none;
  background: rgba(255, 255, 255, 0.045);
  color: ${({ theme }) => theme.colors.text};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.primaryHover};
    box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.16);
  }
`;

const ErrorText = styled.span`
  color: ${({ theme }) => theme.colors.danger};
  font-size: 13px;
`;
