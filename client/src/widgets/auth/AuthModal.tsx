import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, MouseEvent } from 'react';
import { FiLock, FiMail, FiUser, FiX } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import styled, { keyframes } from 'styled-components';

import type { AppDispatch, RootState } from '../../app/store';
import {
  closeAuthModal,
  setCredentials,
  switchAuthModalMode,
} from '../../entities/auth/slice/authSlice';
import {
  useLoginMutation,
  useRegisterMutation,
} from '../../entities/auth/api/authApi';

export function AuthModal() {
  const dispatch = useDispatch<AppDispatch>();

  const { isOpen, mode, reason } = useSelector(
    (state: RootState) => state.auth.authModal
  );

  const [loginUser, loginState] = useLoginMutation();
  const [registerUser, registerState] = useRegisterMutation();

  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isLogin = mode === 'login';
  const isLoading = loginState.isLoading || registerState.isLoading;

  const title = isLogin ? 'Вход в аккаунт' : 'Создание аккаунта';

  const subtitle = isLogin
    ? 'Войди, чтобы лайкать, комментировать, сохранять посты и открывать личные разделы.'
    : 'Создай аккаунт, чтобы получить доступ ко всем возможностям сайта.';

  const buttonText = isLogin ? 'Войти' : 'Создать аккаунт';

  const errorMessage = useMemo(() => {
    const error = loginState.error || registerState.error;

    if (!error) {
      return null;
    }

    if ('data' in error) {
      const data = error.data as {
        message?: string;
        error?: string;
      };

      return data?.message || data?.error || 'Не удалось выполнить запрос.';
    }

    return 'Ошибка соединения с сервером.';
  }, [loginState.error, registerState.error]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dispatch(closeAuthModal());
      }
    };

    const previousBodyOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatch, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setNickname('');
      setEmail('');
      setPassword('');
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isLoading) {
      return;
    }

    dispatch(closeAuthModal());
  };

  const handleOverlayClick = () => {
    handleClose();
  };

  const handleModalClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const handleModeSwitch = () => {
    if (isLoading) {
      return;
    }

    dispatch(switchAuthModalMode(isLogin ? 'register' : 'login'));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedNickname = nickname.trim();

    if (!normalizedEmail || !password.trim()) {
      return;
    }

    if (!isLogin && !normalizedNickname) {
      return;
    }

    try {
      const response = isLogin
        ? await loginUser({
            email: normalizedEmail,
            password,
          }).unwrap()
        : await registerUser({
            nickname: normalizedNickname,
            email: normalizedEmail,
            password,
          }).unwrap();

      dispatch(setCredentials(response));
    } catch {
      // Ошибка уже отображается через errorMessage.
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Overlay onClick={handleOverlayClick}>
      <Modal onClick={handleModalClick}>
        <CloseButton type="button" disabled={isLoading} onClick={handleClose}>
          <FiX />
        </CloseButton>

        <Visual>
          <Glow />

          <IconCircle>{isLogin ? <FiLock /> : <FiUser />}</IconCircle>
        </Visual>

        <Content>
          <Title>{title}</Title>

          <Subtitle>{subtitle}</Subtitle>

          {reason && <Reason>{reason}</Reason>}

          <Form onSubmit={handleSubmit}>
            {!isLogin && (
              <Field>
                <Label>Ник</Label>

                <InputBox>
                  <FiUser />

                  <Input
                    value={nickname}
                    minLength={3}
                    maxLength={30}
                    placeholder="Введите ник"
                    disabled={isLoading}
                    onChange={(event) => setNickname(event.target.value)}
                  />
                </InputBox>
              </Field>
            )}

            <Field>
              <Label>Почта</Label>

              <InputBox>
                <FiMail />

                <Input
                  value={email}
                  type="email"
                  placeholder="email@example.com"
                  disabled={isLoading}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </InputBox>
            </Field>

            <Field>
              <Label>Пароль</Label>

              <InputBox>
                <FiLock />

                <Input
                  value={password}
                  type="password"
                  minLength={6}
                  placeholder="Минимум 6 символов"
                  disabled={isLoading}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </InputBox>
            </Field>

            {errorMessage && <ErrorText>{errorMessage}</ErrorText>}

            <SubmitButton type="submit" disabled={isLoading}>
              {isLoading ? 'Подождите...' : buttonText}
            </SubmitButton>
          </Form>

          <SwitchText>
            <span>{isLogin ? 'Еще нет аккаунта?' : 'Уже есть аккаунт?'}</span>

            <button type="button" disabled={isLoading} onClick={handleModeSwitch}>
              {isLogin ? 'Создать аккаунт' : 'Войти'}
            </button>
          </SwitchText>
        </Content>
      </Modal>
    </Overlay>
  );
}

const overlayAppear = keyframes`
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
`;

const modalAppear = keyframes`
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.96);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2000;
  padding: 18px;
  background: rgba(4, 6, 14, 0.72);
  backdrop-filter: blur(18px);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  animation: ${overlayAppear} 0.18s ease;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    align-items: flex-start;
    justify-content: center;
    padding: 10px 10px calc(108px + env(safe-area-inset-bottom));
  }
`;

const Modal = styled.div`
  position: relative;
  width: min(940px, 100%);
  max-height: calc(100dvh - 36px);
  overflow: hidden auto;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 34px;
  background:
    radial-gradient(circle at top left, rgba(124, 58, 237, 0.26), transparent 34%),
    radial-gradient(circle at bottom right, rgba(239, 68, 68, 0.16), transparent 34%),
    ${({ theme }) => theme.colors.bgCard};
  box-shadow: 0 34px 90px rgba(0, 0, 0, 0.52);
  display: grid;
  grid-template-columns: 0.92fr 1.08fr;
  animation: ${modalAppear} 0.22s ease;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
    max-height: calc(100dvh - 28px);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;
    max-height: none;
    min-height: auto;
    overflow: visible;
    border-radius: 28px;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 3;
  width: 42px;
  height: 42px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(255, 255, 255, 0.06);
  color: ${({ theme }) => theme.colors.text};
  display: grid;
  place-items: center;
  font-size: 22px;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    top: 12px;
    right: 12px;
  }
`;

const Visual = styled.div`
  position: relative;
  min-height: 560px;
  padding: 34px;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  background:
    linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(37, 99, 235, 0.14)),
    rgba(255, 255, 255, 0.025);
  display: flex;
  align-items: center;
  justify-content: center;

  &::before {
    content: 'PulseFeed';
    position: absolute;
    left: 28px;
    top: 28px;
    font-size: 24px;
    font-weight: 900;
    letter-spacing: -0.05em;
    background: linear-gradient(135deg, #8b5cf6, #2563eb, #ef4444);
    -webkit-background-clip: text;
    color: transparent;
  }

  &::after {
    content: 'Фото • Видео • Premium';
    position: absolute;
    left: 28px;
    bottom: 28px;
    color: ${({ theme }) => theme.colors.textMuted};
    font-weight: 700;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    min-height: 150px;
    border-right: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};

    &::after {
      display: none;
    }
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    min-height: 96px;
    padding: 22px;

    &::before {
      left: 18px;
      top: 16px;
      font-size: 20px;
    }
  }
`;

const Glow = styled.div`
  position: absolute;
  width: 240px;
  height: 240px;
  border-radius: 999px;
  background: linear-gradient(135deg, #7c3aed, #2563eb, #ef4444);
  filter: blur(34px);
  opacity: 0.46;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 140px;
    height: 140px;
    filter: blur(28px);
  }
`;

const IconCircle = styled.div`
  position: relative;
  width: 152px;
  height: 152px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 54px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.03)),
    rgba(8, 10, 18, 0.48);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
  color: white;
  display: grid;
  place-items: center;
  font-size: 64px;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: 88px;
    height: 88px;
    border-radius: 30px;
    font-size: 38px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`;

const Content = styled.div`
  min-width: 0;
  padding: 72px 42px 38px;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 30px 22px 26px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 54px 16px 18px;
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: clamp(30px, 4vw, 46px);
  line-height: 1;
  letter-spacing: -0.07em;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 30px;
  }
`;

const Subtitle = styled.p`
  margin: 14px 0 0;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.6;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 14px;
    line-height: 1.45;
  }
`;

const Reason = styled.div`
  margin-top: 18px;
  padding: 13px 14px;
  border: 1px solid rgba(124, 58, 237, 0.34);
  border-radius: 18px;
  background: rgba(124, 58, 237, 0.12);
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.45;
  font-weight: 600;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-top: 12px;
    padding: 11px 12px;
    font-size: 13px;
  }
`;

const Form = styled.form`
  margin-top: 24px;
  display: grid;
  gap: 15px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-top: 16px;
    gap: 12px;
  }
`;

const Field = styled.div`
  display: grid;
  gap: 8px;
`;

const Label = styled.label`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 13px;
  font-weight: 800;
`;

const InputBox = styled.div`
  height: 52px;
  padding: 0 15px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.045);
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  gap: 10px;

  &:focus-within {
    border-color: rgba(139, 92, 246, 0.8);
    box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.14);
  }

  svg {
    flex: 0 0 auto;
    font-size: 18px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    height: 48px;
    border-radius: 16px;
  }
`;

const Input = styled.input`
  width: 100%;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};

  &::placeholder {
    color: rgba(156, 163, 183, 0.68);
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const ErrorText = styled.div`
  padding: 12px 14px;
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 16px;
  background: rgba(239, 68, 68, 0.1);
  color: #fecaca;
  font-weight: 700;
`;

const SubmitButton = styled.button`
  height: 54px;
  border: none;
  border-radius: 19px;
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  color: white;
  font-weight: 900;
  box-shadow: 0 18px 44px rgba(124, 58, 237, 0.25);

  &:hover:not(:disabled) {
    filter: brightness(1.08);
  }

  &:disabled {
    opacity: 0.62;
    cursor: not-allowed;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    height: 50px;
    border-radius: 17px;
  }
`;

const SwitchText = styled.div`
  margin-top: 20px;
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  justify-content: center;

  button {
    border: none;
    padding: 0;
    background: transparent;
    color: ${({ theme }) => theme.colors.primaryHover};
    font-weight: 900;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-top: 16px;
    padding-bottom: 2px;
    font-size: 14px;
  }
`;