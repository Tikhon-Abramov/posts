import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import {
  FiAlertCircle,
  FiCamera,
  FiCheckCircle,
  FiLock,
  FiLogOut,
  FiMail,
  FiSave,
  FiStar,
  FiUploadCloud,
  FiUser,
} from 'react-icons/fi';

import type { AppDispatch, RootState } from '../app/store';
import { logout } from '../entities/auth/slice/authSlice';
import {
  useChangePasswordMutation,
  useGetMeQuery,
} from '../entities/auth/api/authApi';
import {
  useUpdateMeMutation,
  useUploadAvatarMutation,
} from '../entities/user/api/userApi';
import { getMediaUrl } from '../shared/lib/getMediaUrl';

type MessageStatus = 'idle' | 'success' | 'error';

export function ProfilePage() {
  const dispatch = useDispatch<AppDispatch>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { accessToken, user } = useSelector((state: RootState) => state.auth);

  const [updateMe, { isLoading: isUpdatingProfile }] = useUpdateMeMutation();
  const [uploadAvatar, { isLoading: isUploadingAvatar }] =
      useUploadAvatarMutation();
  const [changePassword, { isLoading: isChangingPassword }] =
      useChangePasswordMutation();



  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [profileStatus, setProfileStatus] = useState<MessageStatus>('idle');
  const [profileMessage, setProfileMessage] = useState('');

  const [passwordStatus, setPasswordStatus] = useState<MessageStatus>('idle');
  const [passwordMessage, setPasswordMessage] = useState('');

  const [avatarStatus, setAvatarStatus] = useState<MessageStatus>('idle');
  const [avatarMessage, setAvatarMessage] = useState('');

  const avatarUrl = useMemo(() => {
    return getMediaUrl(user?.avatarUrl);
  }, [user?.avatarUrl]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setNickname(user.nickname);
    setEmail(user.email);
  }, [user]);

  const canSaveProfile = useMemo(() => {
    return (
        Boolean(user) &&
        nickname.trim().length >= 3 &&
        email.trim().includes('@') &&
        !isUpdatingProfile
    );
  }, [email, isUpdatingProfile, nickname, user]);

  const canChangePassword = useMemo(() => {
    return (
        currentPassword.length > 0 &&
        newPassword.length >= 6 &&
        !isChangingPassword
    );
  }, [currentPassword, isChangingPassword, newPassword]);

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setProfileStatus('idle');
    setProfileMessage('');

    try {
      await updateMe({
        nickname: nickname.trim(),
        email: email.trim(),
      }).unwrap();

      setProfileStatus('success');
      setProfileMessage('Профиль обновлен.');
    } catch (error) {
      setProfileStatus('error');
      setProfileMessage(getErrorMessage(error, 'Failed to update profile.'));
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setPasswordStatus('idle');
    setPasswordMessage('');

    try {
      await changePassword({
        currentPassword,
        newPassword,
      }).unwrap();

      setCurrentPassword('');
      setNewPassword('');
      setPasswordStatus('success');
      setPasswordMessage('Пароль изменен.');
    } catch (error) {
      setPasswordStatus('error');
      setPasswordMessage(getErrorMessage(error, 'Failed to change password.'));
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    setAvatarStatus('idle');
    setAvatarMessage('');

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setAvatarStatus('error');
      setAvatarMessage('The avatar must be an image.');
      return;
    }

    const maxSizeBytes = 8 * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      setAvatarStatus('error');
      setAvatarMessage('The image must not be larger than 8 MB.');
      return;
    }

    try {
      await uploadAvatar(file).unwrap();

      setAvatarStatus('success');
      setAvatarMessage('Аватар обновлен.');
    } catch (error) {
      setAvatarStatus('error');
      setAvatarMessage(getErrorMessage(error, 'Failed to load avatar.'));
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };


  const handleLogout = () => {
    dispatch(logout());
  };

  if (!user) {
    return (
        <StateCard>
          <FiLock />

          <h1>Authorization required</h1>

          <p>Log in to your account to open your profile.</p>
        </StateCard>
    );
  }

  return (
      <Page>
        <Grid>
          <AccountCard>
            <AvatarButton type="button" onClick={handleAvatarClick}>
              {avatarUrl ? <img src={avatarUrl} alt={user.nickname} /> : <FiUser />}

              <AvatarOverlay>
                <FiCamera />
              </AvatarOverlay>
            </AvatarButton>

            <HiddenFileInput
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
            />

            <AccountInfo>
              <Nickname>@{user.nickname}</Nickname>
              <Email>{user.email}</Email>

              <Badges>

                <Badge>
                  <FiStar />
                  {user.hasPremium ? 'Premium' : 'Viewer'}
                </Badge>
              </Badges>
            </AccountInfo>

            <AccountActions>
             

              <LogoutButton type="button" onClick={handleLogout}>
                <FiLogOut />
                Logout
              </LogoutButton>
            </AccountActions>

            {avatarMessage && (
                <StatusMessage $status={avatarStatus}>
                  {avatarStatus === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                  {avatarMessage}
                </StatusMessage>
            )}
          </AccountCard>

          <Card>
            <CardHeader>
              <FiUser />

              <div>
                <h2>Данные профиля</h2>
              </div>
            </CardHeader>

            <Form onSubmit={handleProfileSubmit}>
              <Field>
                <Label>Name</Label>

                <InputWrap>
                  <FiUser />

                  <input
                      value={nickname}
                      minLength={3}
                      maxLength={30}
                      placeholder="nickname"
                      onChange={(event) => setNickname(event.target.value)}
                  />
                </InputWrap>
              </Field>

              <Field>
                <Label>Email</Label>

                <InputWrap>
                  <FiMail />

                  <input
                      value={email}
                      type="email"
                      placeholder="email@example.com"
                      onChange={(event) => setEmail(event.target.value)}
                  />
                </InputWrap>
              </Field>

              {profileMessage && (
                  <StatusMessage $status={profileStatus}>
                    {profileStatus === 'success' ? (
                        <FiCheckCircle />
                    ) : (
                        <FiAlertCircle />
                    )}
                    {profileMessage}
                  </StatusMessage>
              )}

              <SubmitButton type="submit" disabled={!canSaveProfile}>
                <FiSave />
                {isUpdatingProfile ? 'Saving...' : 'Save'}
              </SubmitButton>
            </Form>
          </Card>

          <Card>
            <CardHeader>
              <FiLock />

              <div>
                <h2>Password</h2>
              </div>
            </CardHeader>

            <Form onSubmit={handlePasswordSubmit}>
              <Field>
                <Label>Current password</Label>

                <InputWrap>
                  <FiLock />

                  <input
                      value={currentPassword}
                      type="password"
                      placeholder="Enter your current password"
                      onChange={(event) => setCurrentPassword(event.target.value)}
                  />
                </InputWrap>
              </Field>

              <Field>
                <Label>New password</Label>

                <InputWrap>
                  <FiLock />

                  <input
                      value={newPassword}
                      type="password"
                      minLength={6}
                      placeholder="Minimum 6 characters"
                      onChange={(event) => setNewPassword(event.target.value)}
                  />
                </InputWrap>
              </Field>

              {passwordMessage && (
                  <StatusMessage $status={passwordStatus}>
                    {passwordStatus === 'success' ? (
                        <FiCheckCircle />
                    ) : (
                        <FiAlertCircle />
                    )}
                    {passwordMessage}
                  </StatusMessage>
              )}

              <SubmitButton type="submit" disabled={!canChangePassword}>
                <FiSave />
                {isChangingPassword ? 'Changing...' : 'Change password'}
              </SubmitButton>
            </Form>
          </Card>

          <Card>
            <CardHeader>
              <FiCamera />

              <div>
                <h2>Avatar</h2>
              </div>
            </CardHeader>

            <AvatarUploadBox
                type="button"
                disabled={isUploadingAvatar}
                onClick={handleAvatarClick}
            >
              <FiUploadCloud />

              <strong>{isUploadingAvatar ? 'Loading...' : 'Select file'}</strong>

              <span>JPG, PNG or WEBP up to 8 MB.</span>
            </AvatarUploadBox>
          </Card>
        </Grid>
      </Page>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  if (
      typeof error === 'object' &&
      error !== null &&
      'data' in error &&
      typeof (error as { data?: { message?: unknown } }).data?.message === 'string'
  ) {
    return (error as { data: { message: string } }).data.message;
  }

  return fallback;
}

const Page = styled.div`
  display: grid;
  gap: 18px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;

  > article:first-child {
    grid-column: 1 / -1;
  }

  > article:last-child {
    grid-column: 1 / -1;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
  }
`;

const AccountCard = styled.article`
  min-width: 0;
  padding: 18px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background:
    radial-gradient(circle at top left, rgba(124, 58, 237, 0.18), transparent 34%),
    rgba(21, 25, 43, 0.84);
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;

  ${/* sc-selector */ ''} > div:last-child {
    grid-column: 1 / -1;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
    grid-template-columns: auto minmax(0, 1fr);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const AvatarButton = styled.button`
  position: relative;
  flex: 0 0 auto;
  width: 104px;
  height: 104px;
  overflow: hidden;
  border: 1px solid rgba(139, 92, 246, 0.4);
  border-radius: 34px;
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  color: white;
  display: grid;
  place-items: center;
  font-size: 44px;
  box-shadow: 0 22px 52px rgba(124, 58, 237, 0.26);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &:hover div {
    opacity: 1;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 96px;
    height: 96px;
  }
`;

const AvatarOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.48);
  display: grid;
  place-items: center;
  opacity: 0;
  transition: 0.2s ease;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const AccountInfo = styled.div`
  min-width: 0;
  display: grid;
  gap: 8px;
`;

const Nickname = styled.h2`
  margin: 0;
  font-size: clamp(28px, 4vw, 42px);
  line-height: 1;
  letter-spacing: -0.07em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Email = styled.div`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 14px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Badges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Badge = styled.div`
  min-height: 34px;
  padding: 0 11px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(255, 255, 255, 0.055);
  color: ${({ theme }) => theme.colors.text};
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 900;

  svg {
    color: ${({ theme }) => theme.colors.primaryHover};
  }
`;

const AccountActions = styled.div`
  flex: 0 0 auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 9px;

  @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
`;

const RefreshButton = styled.button`
  min-height: 46px;
  padding: 0 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(255, 255, 255, 0.06);
  color: ${({ theme }) => theme.colors.text};
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-weight: 900;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LogoutButton = styled(RefreshButton)`
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.1);
  color: #fecaca;

  &:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.16);
  }
`;

const Card = styled.article`
  min-width: 0;
  padding: 18px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: rgba(21, 25, 43, 0.84);
  display: grid;
  gap: 18px;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 13px;

  > svg {
    flex: 0 0 auto;
    width: 44px;
    height: 44px;
    padding: 11px;
    border-radius: 16px;
    background: rgba(124, 58, 237, 0.14);
    color: ${({ theme }) => theme.colors.primaryHover};
  }

  h2 {
    margin: 0 0 5px;
    font-size: 24px;
    letter-spacing: -0.05em;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.45;
  }
`;

const Form = styled.form`
  display: grid;
  gap: 14px;
`;

const Field = styled.div`
  display: grid;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 900;
`;

const InputWrap = styled.div`
  min-height: 48px;
  padding: 0 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.045);
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    flex: 0 0 auto;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  input {
    width: 100%;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: ${({ theme }) => theme.colors.text};
  }

  &:focus-within {
    border-color: rgba(139, 92, 246, 0.72);
    box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.12);
  }
`;

const StatusMessage = styled.div<{ $status: MessageStatus }>`
  padding: 13px 14px;
  border: 1px solid
    ${({ $status }) =>
    $status === 'success'
        ? 'rgba(34, 197, 94, 0.34)'
        : 'rgba(239, 68, 68, 0.34)'};
  border-radius: 18px;
  background: ${({ $status }) =>
    $status === 'success'
        ? 'rgba(34, 197, 94, 0.1)'
        : 'rgba(239, 68, 68, 0.1)'};
  color: ${({ $status }) => ($status === 'success' ? '#bbf7d0' : '#fecaca')};
  display: flex;
  align-items: flex-start;
  gap: 9px;
  line-height: 1.45;
  font-weight: 800;

  svg {
    flex: 0 0 auto;
    margin-top: 2px;
  }
`;

const SubmitButton = styled.button`
  min-height: 50px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.full};
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  font-weight: 900;

  &:hover:not(:disabled) {
    filter: brightness(1.08);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const AvatarUploadBox = styled.button`
  min-height: 180px;
  padding: 24px;
  border: 1px dashed rgba(139, 92, 246, 0.46);
  border-radius: ${({ theme }) => theme.radius.lg};
  background:
    radial-gradient(circle at top left, rgba(124, 58, 237, 0.18), transparent 34%),
    rgba(255, 255, 255, 0.035);
  color: ${({ theme }) => theme.colors.text};
  display: grid;
  place-items: center;
  gap: 8px;
  text-align: center;

  svg {
    color: ${({ theme }) => theme.colors.primaryHover};
    font-size: 42px;
  }

  strong {
    font-size: 20px;
    letter-spacing: -0.04em;
  }

  span {
    color: ${({ theme }) => theme.colors.textMuted};
    font-weight: 700;
  }

  &:hover:not(:disabled) {
    border-color: rgba(139, 92, 246, 0.72);
    background:
      radial-gradient(circle at top left, rgba(124, 58, 237, 0.22), transparent 34%),
      rgba(255, 255, 255, 0.055);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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

  > svg {
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
    max-width: 520px;
    margin: 0;
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.6;
  }
`;