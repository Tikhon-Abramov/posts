import { FormEvent, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { FiAlertCircle, FiMessageCircle, FiSend } from 'react-icons/fi';

import type { AppDispatch, RootState } from '../../app/store';
import { openAuthModal } from '../../entities/auth/slice/authSlice';
import { useCreateCommentMutation } from '../../entities/post/api/commentApi';

interface CommentFormProps {
    postId: number;
}

export function CommentForm({ postId }: CommentFormProps) {
    const dispatch = useDispatch<AppDispatch>();

    const { accessToken, user } = useSelector((state: RootState) => state.auth);

    const [text, setText] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);

    const [createComment, { isLoading, error }] = useCreateCommentMutation();

    const isAuth = Boolean(accessToken);
    const normalizedText = text.trim();

    const serverError = useMemo(() => {
        if (!error) {
            return null;
        }

        if ('data' in error) {
            const data = error.data as {
                message?: string;
                error?: string;
            };

            return data?.message || data?.error || 'Не удалось отправить комментарий.';
        }

        return 'Ошибка соединения с сервером.';
    }, [error]);

    const errorMessage = localError || serverError;

    const handleFocus = () => {
        if (isAuth) {
            return;
        }

        dispatch(
            openAuthModal({
                mode: 'login',
                reason: 'Чтобы писать комментарии, нужно войти в аккаунт.',
            })
        );
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setLocalError(null);

        if (!isAuth) {
            dispatch(
                openAuthModal({
                    mode: 'login',
                    reason: 'Чтобы писать комментарии, нужно войти в аккаунт.',
                })
            );

            return;
        }

        if (normalizedText.length < 2) {
            setLocalError('Комментарий должен содержать минимум 2 символа.');
            return;
        }

        if (normalizedText.length > 600) {
            setLocalError('Комментарий не должен быть длиннее 600 символов.');
            return;
        }

        try {
            await createComment({
                postId,
                text: normalizedText,
            }).unwrap();

            setText('');
        } catch {
            /*
              Ошибка уже отображается через serverError.
            */
        }
    };

    return (
        <Form onSubmit={handleSubmit}>
            <Avatar>
                {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.nickname} />
                ) : (
                    <FiMessageCircle />
                )}
            </Avatar>

            <FormBody>
                <InputRow>
                    <Textarea
                        value={text}
                        disabled={isLoading}
                        placeholder={
                            isAuth
                                ? 'Напишите комментарий...'
                                : 'Войдите, чтобы написать комментарий'
                        }
                        maxLength={600}
                        onFocus={handleFocus}
                        onChange={(event) => {
                            setText(event.target.value);
                            setLocalError(null);
                        }}
                    />

                    <SendButton
                        type="submit"
                        disabled={isLoading || !normalizedText}
                        aria-label="Отправить комментарий"
                    >
                        <FiSend />
                    </SendButton>
                </InputRow>

                <FooterRow>
                    <Counter $warning={text.length > 540}>{text.length}/600</Counter>

                    {isLoading && <StatusText>Отправляем...</StatusText>}
                </FooterRow>

                {errorMessage && (
                    <ErrorBox>
                        <FiAlertCircle />
                        <span>{errorMessage}</span>
                    </ErrorBox>
                )}
            </FormBody>
        </Form>
    );
}

const Form = styled.form`
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 10px;
`;

const Avatar = styled.div`
  width: 42px;
  height: 42px;
  overflow: hidden;
  border-radius: 16px;
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  color: white;
  display: grid;
  place-items: center;
  font-size: 20px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const FormBody = styled.div`
  min-width: 0;
  display: grid;
  gap: 8px;
`;

const InputRow = styled.div`
  min-width: 0;
  padding: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.045);
  display: grid;
  grid-template-columns: minmax(0, 1fr) 42px;
  gap: 8px;

  &:focus-within {
    border-color: rgba(139, 92, 246, 0.72);
    box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.12);
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 42px;
  max-height: 160px;
  resize: vertical;
  padding: 10px 8px;
  border: none;
  outline: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.45;

  &::placeholder {
    color: rgba(156, 163, 183, 0.72);
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const SendButton = styled.button`
  width: 42px;
  height: 42px;
  align-self: end;
  border: none;
  border-radius: 15px;
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  color: white;
  display: grid;
  place-items: center;
  font-size: 19px;

  &:hover:not(:disabled) {
    filter: brightness(1.08);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FooterRow = styled.div`
  min-height: 18px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
`;

const Counter = styled.span<{ $warning?: boolean }>`
  color: ${({ $warning }) => ($warning ? '#fbbf24' : 'rgba(156, 163, 183, 0.8)')};
  font-size: 12px;
  font-weight: 800;
`;

const StatusText = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 12px;
  font-weight: 800;
`;

const ErrorBox = styled.div`
  padding: 10px 12px;
  border: 1px solid rgba(239, 68, 68, 0.32);
  border-radius: 15px;
  background: rgba(239, 68, 68, 0.1);
  color: #fecaca;
  display: flex;
  gap: 8px;
  line-height: 1.4;
  font-size: 13px;
  font-weight: 800;

  svg {
    flex: 0 0 auto;
    margin-top: 2px;
  }
`;