import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import {
  FiBookmark,
  FiCheckCircle,
  FiEdit3,
  FiImage,
  FiKey,
  FiLogOut,
  FiMail,
  FiRefreshCw,
  FiSave,
  FiShield,
  FiStar,
  FiTrash2,
  FiUpload,
  FiUploadCloud,
  FiUser,
} from 'react-icons/fi';

import type { AppDispatch, RootState } from '../app/store';
import { logout, setUser } from '../entities/auth/slice/authSlice';
import {
  useChangePasswordMutation,
  useLogoutUserMutation,
  useUpdateProfileMutation,
} from '../entities/auth/api/authApi';

const MAX_AVATAR_SIZE = 900 * 1024;

export function ProfilePage() {
  const dispatch = useDispatch<AppDispatch>();

  const { user, accessToken } = useSelector((state: RootState) => state.auth);

  const [logoutUser, { isLoading: isLogoutLoading }] = useLogoutUserMutation();
  const [updateProfile, updateProfileState] = useUpdateProfileMutation();
  const [changePassword, changePasswordState] = useChangePasswordMutation();

  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [avatarDataUrl, setAvatarDataUrl] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [profileLocalError, setProfileLocalError] = useState<string | null>(null);
  const [passwordLocalError, setPasswordLocalError] = useState<string | null>(
      null
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    setNickname(user.nickname);
    setEmail(user.email);
    setAvatarDataUrl(user.avatarUrl || '');
  }, [user]);

  const profileServerError = useMemo(() => {
    return getApiErrorMessage(updateProfileState.error);
  }, [updateProfileState.error]);

  const passwordServerError = useMemo(() => {
    return getApiErrorMessage(changePasswordState.error);
  }, [changePasswordState.error]);

  const profileError = profileLocalError || profileServerError;
  const passwordError = passwordLocalError || passwordServerError;

  const handleLogout = async () => {
    try {
      await logoutUser().unwrap();
    } catch {
      /*
        Даже если сервер не ответил, локально все равно выходим,
        чтобы пользователь не оставался с битой сессией.
      */
    } finally {
      dispatch(logout());
    }
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    setProfileSuccess(null);
    setProfileLocalError(null);

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setProfileLocalError('Выберите файл изображения.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setProfileLocalError(
          'Для mock-режима выберите изображение до 900 KB. Позже backend позволит загружать файлы больше.'
      );
      event.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setAvatarDataUrl(String(reader.result));
    };

    reader.onerror = () => {
      setProfileLocalError('Не удалось прочитать файл изображения.');
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarDataUrl('');
    setProfileSuccess(null);
    setProfileLocalError(null);
  };

  const handleUpdateProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setProfileLocalError(null);
    setProfileSuccess(null);

    const normalizedNickname = nickname.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedNickname.length < 3) {
      setProfileLocalError('Ник должен содержать минимум 3 символа.');
      return;
    }

    if (!normalizedEmail.includes('@')) {
      setProfileLocalError('Введите корректную почту.');
      return;
    }

    try {
      const updatedUser = await updateProfile({
        nickname: normalizedNickname,
        email: normalizedEmail,
        avatarUrl: avatarDataUrl || null,
      }).unwrap();

      dispatch(setUser(updatedUser));
      setProfileSuccess('Профиль успешно обновлен.');
    } catch {
      /*
        Ошибка уже отображается через profileError.
      */
    }
  };

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setPasswordLocalError(null);
    setPasswordSuccess(null);

    if (!currentPassword.trim()) {
      setPasswordLocalError('Введите текущий пароль.');
      return;
    }

    if (newPassword.trim().length < 6) {
      setPasswordLocalError('Новый пароль должен содержать минимум 6 символов.');
      return;
    }

    if (currentPassword.trim() === newPassword.trim()) {
      setPasswordLocalError('Новый пароль должен отличаться от текущего.');
      return;
    }

    try {
      const response = await changePassword({
        currentPassword,
        newPassword,
      }).unwrap();

      setCurrentPassword('');
      setNewPassword('');
      setPasswordSuccess(response.message || 'Пароль успешно изменен.');
    } catch {
      /*
        Ошибка уже отображается через passwordError.
      */
    }
  };

  if (accessToken && !user) {
    return (
        <StateCard>
          <FiRefreshCw />
          <h1>Проверяем профиль</h1>
          <p>Сейчас подтвердим аккаунт и загрузим данные пользователя.</p>
        </StateCard>
    );
  }

  if (!user) {
    return (
        <StateCard>
          <FiUser />
          <h1>Профиль недоступен</h1>
          <p>Чтобы открыть профиль, нужно войти в аккаунт.</p>
        </StateCard>
    );
  }

  return (
      <Page>
        <ProfileHero>
          <AvatarBlock>
            {avatarDataUrl ? (
                <AvatarImage src={avatarDataUrl} alt={nickname || user.nickname} />
            ) : (
                <AvatarFallback>{user.nickname.slice(0, 1).toUpperCase()}</AvatarFallback>
            )}
          </AvatarBlock>

          <ProfileInfo>
            <RoleBadge $isAdmin={user.role === 'ADMIN'}>
              {user.role === 'ADMIN' ? (
                  <>
                    <FiShield />
                    Администратор
                  </>
              ) : (
                  <>
                    <FiUser />
                    Пользователь
                  </>
              )}
            </RoleBadge>

            <h1>{user.nickname}</h1>

            <p>
              Управление аккаунтом, подпиской, сохраненными постами и заявками на
              публикацию контента.
            </p>
          </ProfileInfo>

          <LogoutButton
              type="button"
              disabled={isLogoutLoading}
              onClick={handleLogout}
          >
            <FiLogOut />
            {isLogoutLoading ? 'Выходим...' : 'Выйти'}
          </LogoutButton>
        </ProfileHero>

        <Grid>
          <MainColumn>
            <Section as="form" onSubmit={handleUpdateProfile}>
              <SectionHeader>
                <div>
                  <Eyebrow>Аккаунт</Eyebrow>
                  <h2>Основная информация</h2>
                </div>

                <IconBox>
                  <FiEdit3 />
                </IconBox>
              </SectionHeader>

              {profileSuccess && (
                  <SuccessBox>
                    <FiCheckCircle />
                    <span>{profileSuccess}</span>
                  </SuccessBox>
              )}

              {profileError && <ErrorBox>{profileError}</ErrorBox>}

              <AvatarUploadGrid>
                <AvatarPreviewBox>
                  {avatarDataUrl ? (
                      <img src={avatarDataUrl} alt="Аватар пользователя" />
                  ) : (
                      <FiImage />
                  )}
                </AvatarPreviewBox>

                <AvatarUploadContent>
                  <Label>Аватар</Label>

                  <AvatarActions>
                    <AvatarUploadButton htmlFor="profile-avatar-file">
                      <FiUploadCloud />
                      Выбрать изображение

                      <input
                          id="profile-avatar-file"
                          type="file"
                          accept="image/*"
                          disabled={updateProfileState.isLoading}
                          onChange={handleAvatarChange}
                      />
                    </AvatarUploadButton>

                    {avatarDataUrl && (
                        <RemoveAvatarButton
                            type="button"
                            disabled={updateProfileState.isLoading}
                            onClick={handleRemoveAvatar}
                        >
                          <FiTrash2 />
                          Удалить
                        </RemoveAvatarButton>
                    )}
                  </AvatarActions>

                  <AvatarHint>
                    Временный mock сохраняет аватар в localStorage, поэтому лучше
                    выбрать изображение до 900 KB. Позже заменим это на загрузку
                    файла на backend.
                  </AvatarHint>
                </AvatarUploadContent>
              </AvatarUploadGrid>

              <FormGrid>
                <Field>
                  <Label htmlFor="profile-nickname">Ник</Label>

                  <InputBox>
                    <FiUser />
                    <input
                        id="profile-nickname"
                        value={nickname}
                        disabled={updateProfileState.isLoading}
                        placeholder="Ваш ник"
                        onChange={(event) => {
                          setNickname(event.target.value);
                          setProfileSuccess(null);
                          setProfileLocalError(null);
                        }}
                    />
                  </InputBox>
                </Field>

                <Field>
                  <Label htmlFor="profile-email">Почта</Label>

                  <InputBox>
                    <FiMail />
                    <input
                        id="profile-email"
                        type="email"
                        value={email}
                        disabled={updateProfileState.isLoading}
                        placeholder="you@example.com"
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setProfileSuccess(null);
                          setProfileLocalError(null);
                        }}
                    />
                  </InputBox>
                </Field>
              </FormGrid>

              <SubmitButton type="submit" disabled={updateProfileState.isLoading}>
                <FiSave />
                {updateProfileState.isLoading ? 'Сохраняем...' : 'Сохранить профиль'}
              </SubmitButton>
            </Section>

            <Section as="form" onSubmit={handleChangePassword}>
              <SectionHeader>
                <div>
                  <Eyebrow>Безопасность</Eyebrow>
                  <h2>Смена пароля</h2>
                </div>

                <IconBox>
                  <FiKey />
                </IconBox>
              </SectionHeader>

              {passwordSuccess && (
                  <SuccessBox>
                    <FiCheckCircle />
                    <span>{passwordSuccess}</span>
                  </SuccessBox>
              )}

              {passwordError && <ErrorBox>{passwordError}</ErrorBox>}

              <FormGrid>
                <Field>
                  <Label htmlFor="current-password">Текущий пароль</Label>

                  <InputBox>
                    <FiKey />
                    <input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        disabled={changePasswordState.isLoading}
                        placeholder="Введите текущий пароль"
                        onChange={(event) => {
                          setCurrentPassword(event.target.value);
                          setPasswordSuccess(null);
                          setPasswordLocalError(null);
                        }}
                    />
                  </InputBox>
                </Field>

                <Field>
                  <Label htmlFor="new-password">Новый пароль</Label>

                  <InputBox>
                    <FiKey />
                    <input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        disabled={changePasswordState.isLoading}
                        placeholder="Минимум 6 символов"
                        onChange={(event) => {
                          setNewPassword(event.target.value);
                          setPasswordSuccess(null);
                          setPasswordLocalError(null);
                        }}
                    />
                  </InputBox>
                </Field>
              </FormGrid>

              <SubmitButton type="submit" disabled={changePasswordState.isLoading}>
                <FiKey />
                {changePasswordState.isLoading ? 'Меняем...' : 'Сменить пароль'}
              </SubmitButton>
            </Section>
          </MainColumn>

          <SideColumn>
            <SubscriptionCard $active={user.hasPremium}>
              <FiStar />

              <h2>{user.hasPremium ? 'Premium активен' : 'Premium не активен'}</h2>

              <p>
                {user.hasPremium
                    ? 'У вас есть доступ к закрытой ленте с премиум-публикациями.'
                    : 'Оформите подписку, чтобы открыть закрытые фото и видео.'}
              </p>

              {user.hasPremium ? (
                  <PremiumStatus>Подписка активна</PremiumStatus>
              ) : (
                  <PrimaryLink to="/subscription">Оформить подписку</PrimaryLink>
              )}
            </SubscriptionCard>

            <QuickActions>
              <h2>Быстрые действия</h2>

              <QuickLink to="/saved">
                <FiBookmark />
                <span>
                <strong>Сохраненные посты</strong>
                <small>Публикации, которые видны только вам</small>
              </span>
              </QuickLink>

              <QuickLink to="/submit-content">
                <FiUpload />
                <span>
                <strong>Предложить контент</strong>
                <small>Отправить заявку админу на публикацию</small>
              </span>
              </QuickLink>

              {user.role === 'ADMIN' && (
                  <QuickLink to="/admin">
                    <FiShield />
                    <span>
                  <strong>Админ-панель</strong>
                  <small>Посты, заявки и премиум-контент</small>
                </span>
                  </QuickLink>
              )}
            </QuickActions>
          </SideColumn>
        </Grid>
      </Page>
  );
}

function getApiErrorMessage(error: unknown) {
  if (!error) {
    return null;
  }

  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string; error?: string } }).data;

    return data?.message || data?.error || 'Не удалось выполнить запрос.';
  }

  return 'Ошибка соединения с сервером.';
}

const Page = styled.div`
  display: grid;
  gap: 18px;
`;

const ProfileHero = styled.section`
  padding: 22px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background:
      radial-gradient(circle at top left, rgba(124, 58, 237, 0.24), transparent 34%),
      radial-gradient(circle at bottom right, rgba(37, 99, 235, 0.16), transparent 34%),
      rgba(21, 25, 43, 0.86);
  display: flex;
  align-items: center;
  gap: 18px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const AvatarBlock = styled.div`
  flex: 0 0 auto;
`;

const AvatarImage = styled.img`
  width: 92px;
  height: 92px;
  border-radius: 32px;
  object-fit: cover;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const AvatarFallback = styled.div`
  width: 92px;
  height: 92px;
  border-radius: 32px;
  background: linear-gradient(135deg, #7c3aed, #2563eb, #ef4444);
  color: white;
  display: grid;
  place-items: center;
  font-size: 38px;
  font-weight: 900;
  box-shadow: 0 22px 50px rgba(124, 58, 237, 0.28);
`;

const ProfileInfo = styled.div`
  min-width: 0;
  flex: 1;

  h1 {
    margin: 10px 0 6px;
    font-size: clamp(30px, 5vw, 48px);
    line-height: 1;
    letter-spacing: -0.075em;
  }

  p {
    max-width: 640px;
    margin: 0;
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.6;
  }
`;

const RoleBadge = styled.div<{ $isAdmin?: boolean }>`
  width: fit-content;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid
  ${({ $isAdmin }) =>
      $isAdmin ? 'rgba(239, 68, 68, 0.34)' : 'rgba(124, 58, 237, 0.34)'};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $isAdmin }) =>
      $isAdmin ? 'rgba(239, 68, 68, 0.12)' : 'rgba(124, 58, 237, 0.12)'};
  color: ${({ $isAdmin }) => ($isAdmin ? '#fecaca' : '#ddd6fe')};
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 900;
`;

const LogoutButton = styled.button`
  flex: 0 0 auto;
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(239, 68, 68, 0.1);
  color: #fecaca;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 900;

  &:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.16);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 18px;

  @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
  }
`;

const MainColumn = styled.div`
  display: grid;
  gap: 18px;
`;

const SideColumn = styled.aside`
  display: grid;
  align-content: start;
  gap: 18px;
`;

const Section = styled.section`
  padding: 20px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: rgba(21, 25, 43, 0.84);
  display: grid;
  gap: 16px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;

  h2 {
    margin: 4px 0 0;
    font-size: 24px;
    letter-spacing: -0.05em;
  }
`;

const Eyebrow = styled.div`
  color: ${({ theme }) => theme.colors.primaryHover};
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const IconBox = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background: rgba(124, 58, 237, 0.14);
  color: ${({ theme }) => theme.colors.primaryHover};
  display: grid;
  place-items: center;
  font-size: 21px;
`;

const AvatarUploadGrid = styled.div`
  padding: 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.035);
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 16px;
  align-items: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const AvatarPreviewBox = styled.div`
  width: 96px;
  height: 96px;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 32px;
  background:
      radial-gradient(circle at top left, rgba(124, 58, 237, 0.3), transparent 40%),
      rgba(255, 255, 255, 0.05);
  color: ${({ theme }) => theme.colors.primaryHover};
  display: grid;
  place-items: center;
  font-size: 34px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const AvatarUploadContent = styled.div`
  min-width: 0;
  display: grid;
  gap: 10px;
`;

const AvatarActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
`;

const AvatarUploadButton = styled.label`
  min-height: 42px;
  padding: 0 14px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  color: white;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 900;
  cursor: pointer;

  input {
    display: none;
  }

  &:hover {
    filter: brightness(1.08);
  }
`;

const RemoveAvatarButton = styled.button`
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(239, 68, 68, 0.1);
  color: #fecaca;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 900;

  &:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.16);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const AvatarHint = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 13px;
  line-height: 1.5;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
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
    border-color: rgba(139, 92, 246, 0.75);
    box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.13);
  }

  svg {
    flex: 0 0 auto;
    font-size: 18px;
  }

  input {
    width: 100%;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    color: ${({ theme }) => theme.colors.text};
  }

  input::placeholder {
    color: rgba(156, 163, 183, 0.68);
  }

  input:disabled {
    cursor: not-allowed;
  }
`;

const SubmitButton = styled.button`
  width: fit-content;
  min-height: 46px;
  padding: 0 16px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.full};
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  color: white;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-weight: 900;
  box-shadow: 0 16px 38px rgba(124, 58, 237, 0.22);

  &:hover:not(:disabled) {
    filter: brightness(1.08);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;
    justify-content: center;
  }
`;

const SuccessBox = styled.div`
  padding: 13px 14px;
  border: 1px solid rgba(34, 197, 94, 0.32);
  border-radius: 18px;
  background: rgba(34, 197, 94, 0.1);
  color: #bbf7d0;
  display: flex;
  gap: 10px;
  line-height: 1.45;
  font-weight: 800;

  svg {
    flex: 0 0 auto;
    margin-top: 2px;
  }
`;

const ErrorBox = styled.div`
  padding: 13px 14px;
  border: 1px solid rgba(239, 68, 68, 0.32);
  border-radius: 18px;
  background: rgba(239, 68, 68, 0.1);
  color: #fecaca;
  line-height: 1.45;
  font-weight: 800;
`;

const SubscriptionCard = styled.section<{ $active?: boolean }>`
  padding: 22px;
  border: 1px solid
    ${({ $active }) =>
    $active ? 'rgba(34, 197, 94, 0.34)' : 'rgba(236, 72, 153, 0.3)'};
  border-radius: ${({ theme }) => theme.radius.lg};
  background:
    radial-gradient(circle at top left, rgba(236, 72, 153, 0.18), transparent 36%),
    rgba(21, 25, 43, 0.86);

  > svg {
    margin-bottom: 14px;
    color: ${({ $active }) => ($active ? '#86efac' : '#f9a8d4')};
    font-size: 38px;
  }

  h2 {
    margin: 0 0 8px;
    font-size: 25px;
    letter-spacing: -0.05em;
  }

  p {
    margin: 0 0 18px;
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.55;
  }
`;

const PrimaryLink = styled(Link)`
  min-height: 46px;
  padding: 0 16px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: linear-gradient(135deg, #7c3aed, #ec4899);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;

  &:hover {
    filter: brightness(1.08);
  }
`;

const PremiumStatus = styled.div`
  min-height: 42px;
  padding: 0 14px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(34, 197, 94, 0.12);
  color: #86efac;
  display: inline-flex;
  align-items: center;
  font-weight: 900;
`;

const QuickActions = styled.section`
  padding: 18px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: rgba(21, 25, 43, 0.84);
  display: grid;
  gap: 10px;

  h2 {
    margin: 0 0 6px;
    font-size: 22px;
    letter-spacing: -0.05em;
  }
`;

const QuickLink = styled(Link)`
  padding: 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  gap: 12px;

  > svg {
    flex: 0 0 auto;
    color: ${({ theme }) => theme.colors.primaryHover};
    font-size: 22px;
  }

  span {
    min-width: 0;
    display: grid;
    gap: 3px;
  }

  strong {
    font-size: 14px;
  }

  small {
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.35;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.075);
    border-color: rgba(139, 92, 246, 0.42);
  }
`;

const StateCard = styled.section`
  min-height: 420px;
  padding: 30px 22px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background:
    radial-gradient(circle at top left, rgba(124, 58, 237, 0.2), transparent 34%),
    rgba(21, 25, 43, 0.86);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;

  svg {
    margin-bottom: 16px;
    color: ${({ theme }) => theme.colors.primaryHover};
    font-size: 44px;
  }

  h1 {
    margin: 0 0 10px;
    font-size: clamp(26px, 4vw, 40px);
    letter-spacing: -0.06em;
  }

  p {
    max-width: 480px;
    margin: 0;
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.6;
  }
`;