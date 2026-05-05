import { useState } from 'react';
import type { FormEvent } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Button } from '../../shared/ui/Button/Button';
import { Input } from '../../shared/ui/Input/Input';
import { useRegisterMutation } from '../../entities/auth/api/authApi';
import { setCredentials } from '../../entities/auth/slice/authSlice';

export function RegisterForm() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [registerUser, { isLoading, error }] = useRegisterMutation();
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const response = await registerUser({ nickname, email, password }).unwrap();
    dispatch(setCredentials(response));
    navigate('/');
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Input
        label="Ник"
        placeholder="Твой ник"
        value={nickname}
        onChange={(event) => setNickname(event.target.value)}
        required
      />

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
        placeholder="Минимум 6 символов"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />

      {error && <ErrorText>Не удалось зарегистрироваться.</ErrorText>}

      <Button type="submit" fullWidth disabled={isLoading}>
        {isLoading ? 'Создаем аккаунт...' : 'Зарегистрироваться'}
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
