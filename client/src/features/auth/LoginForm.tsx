import { useState } from 'react';
import type { FormEvent } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Button } from '../../shared/ui/Button/Button';
import { Input } from '../../shared/ui/Input/Input';
import { useLoginMutation } from '../../entities/auth/api/authApi';
import { setCredentials } from '../../entities/auth/slice/authSlice';

export function LoginForm() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading, error }] = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const response = await login({ email, password }).unwrap();
    dispatch(setCredentials(response));
    navigate('/');
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Input
        label="Почта"
        type="email"
        placeholder="example@mail.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />

      <Input
        label="Пароль"
        type="password"
        placeholder="Введите пароль"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />

      {error && <ErrorText>Не удалось войти. Проверь почту и пароль.</ErrorText>}

      <Button type="submit" fullWidth disabled={isLoading}>
        {isLoading ? 'Входим...' : 'Войти'}
      </Button>
    </Form>
  );
}

const Form = styled.form`
  display: grid;
  gap: 16px;
`;

const ErrorText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.danger};
`;
