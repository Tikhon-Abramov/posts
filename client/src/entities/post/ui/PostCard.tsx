import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import {
  FiBookmark,
  FiHeart,
  FiImage,
  FiLock,
  FiMessageCircle,
  FiStar,
  FiThumbsDown,
  FiUser,
  FiVideo,
} from 'react-icons/fi';

import type { AppDispatch, RootState } from '../../../app/store';
import { openAuthModal } from '../../auth/slice/authSlice';
import {
  useDislikePostMutation,
  useGetPostByIdQuery,
  useLikePostMutation,
  useSavePostMutation,
  useUnsavePostMutation,
} from '../api/postApi';
import type { Post } from '../model/postTypes';
import { getMediaUrl } from '../../../shared/lib/getMediaUrl';

interface PostCardProps {
  post: Post;
}

const POST_REALTIME_POLLING_INTERVAL = 15000;

export function PostCard({ post }: PostCardProps) {
  const dispatch = useDispatch<AppDispatch>();
  const cardRef = useRef<HTMLElement | null>(null);

  const { accessToken, user } = useSelector((state: RootState) => state.auth);

  const [isCardVisible, setIsCardVisible] = useState(false);

  const { data: realtimePost } = useGetPostByIdQuery(post.id, {
    skip: !isCardVisible,
    pollingInterval: POST_REALTIME_POLLING_INTERVAL,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const currentPost = realtimePost || post;

  const [likePost, { isLoading: isLikeLoading }] = useLikePostMutation();
  const [dislikePost, { isLoading: isDislikeLoading }] =
    useDislikePostMutation();
  const [savePost, { isLoading: isSaveLoading }] = useSavePostMutation();
  const [unsavePost, { isLoading: isUnsaveLoading }] =
    useUnsavePostMutation();

  const firstMedia = currentPost.media[0];
  const mediaUrl = getMediaUrl(firstMedia?.url);
  const authorAvatarUrl = getMediaUrl(currentPost.author.avatarUrl);

  const isAuth = Boolean(accessToken);

  const isActionLoading =
    isLikeLoading || isDislikeLoading || isSaveLoading || isUnsaveLoading;

  const canViewPremium =
    currentPost.visibility === 'PUBLIC' ||
    user?.role === 'ADMIN' ||
    user?.id === currentPost.author.id ||
    user?.hasPremium;

  const backgroundUrl =
    firstMedia?.type === 'IMAGE' && mediaUrl ? mediaUrl : undefined;

  const description = currentPost.description?.trim() || '';

  useEffect(() => {
    const target = cardRef.current;

    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsCardVisible(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '500px 0px',
        threshold: 0,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleProtectedAction = (event: MouseEvent, reason: string) => {
    if (isAuth) {
      return true;
    }

    event.preventDefault();

    dispatch(
      openAuthModal({
        mode: 'login',
        reason,
      })
    );

    return false;
  };

  const handleLike = async (event: MouseEvent) => {
    const canContinue = handleProtectedAction(
      event,
      'Чтобы поставить лайк, нужно войти в аккаунт.'
    );

    if (!canContinue) {
      return;
    }

    try {
      await likePost(currentPost.id).unwrap();
    } catch (error) {
      window.alert(getErrorMessage(error, 'Не удалось обновить лайк.'));
    }
  };

  const handleDislike = async (event: MouseEvent) => {
    const canContinue = handleProtectedAction(
      event,
      'Чтобы поставить дизлайк, нужно войти в аккаунт.'
    );

    if (!canContinue) {
      return;
    }

    try {
      await dislikePost(currentPost.id).unwrap();
    } catch (error) {
      window.alert(getErrorMessage(error, 'Не удалось обновить дизлайк.'));
    }
  };

  const handleSave = async (event: MouseEvent) => {
    const canContinue = handleProtectedAction(
      event,
      'Чтобы сохранять посты, нужно войти в аккаунт.'
    );

    if (!canContinue) {
      return;
    }

    try {
      if (currentPost.isSavedByMe) {
        await unsavePost(currentPost.id).unwrap();
      } else {
        await savePost(currentPost.id).unwrap();
      }
    } catch (error) {
      window.alert(getErrorMessage(error, 'Не удалось обновить сохранение.'));
    }
  };

  return (
    <Card ref={cardRef}>
      <MediaFrame
        $backgroundUrl={backgroundUrl}
        $hasImage={Boolean(backgroundUrl)}
      >
        {firstMedia?.type === 'IMAGE' && mediaUrl ? (
          <MediaImageLink to={`/posts/${currentPost.id}`}>
            <MediaImage src={mediaUrl} alt={currentPost.title || 'Пост'} />
          </MediaImageLink>
        ) : firstMedia?.type === 'VIDEO' && mediaUrl ? (
          <MediaVideo src={mediaUrl} controls />
        ) : (
          <MediaPlaceholder>
            {firstMedia?.type === 'VIDEO' ? <FiVideo /> : <FiImage />}
            <span>Медиа недоступно</span>
          </MediaPlaceholder>
        )}

        <SaveIconButton
          type="button"
          $active={currentPost.isSavedByMe}
          disabled={isActionLoading}
          aria-label={
            currentPost.isSavedByMe ? 'Убрать из сохраненных' : 'Сохранить'
          }
          title={currentPost.isSavedByMe ? 'Убрать из сохраненных' : 'Сохранить'}
          onClick={handleSave}
        >
          <FiBookmark />
        </SaveIconButton>

        {currentPost.visibility === 'PREMIUM' && !canViewPremium && (
          <LockedOverlay>
            <FiLock />
            <span>Premium</span>
          </LockedOverlay>
        )}
      </MediaFrame>

      <Body>
        <ContentLink to={`/posts/${currentPost.id}`}>
          <Title>{currentPost.title || 'Без названия'}</Title>
        </ContentLink>

        <AuthorRow>
          <Author>
            <AuthorAvatar>
              {authorAvatarUrl ? (
                <img src={authorAvatarUrl} alt={currentPost.author.nickname} />
              ) : (
                <FiUser />
              )}
            </AuthorAvatar>

            <AuthorText>
              <span>@{currentPost.author.nickname}</span>
            </AuthorText>
          </Author>

          {currentPost.visibility === 'PREMIUM' && (
            <PremiumPill>
              <FiStar />
              Premium
            </PremiumPill>
          )}
        </AuthorRow>

        {description && (
          <ContentLink to={`/posts/${currentPost.id}`}>
            <Description>{description}</Description>
          </ContentLink>
        )}

        <Actions>
          <ActionButton
            type="button"
            $active={currentPost.isLikedByMe}
            $variant="like"
            disabled={isActionLoading}
            onClick={handleLike}
          >
            <FiHeart />
            <span>{formatCount(currentPost.likesCount)}</span>
          </ActionButton>

          <ActionButton
            type="button"
            $active={currentPost.isDislikedByMe}
            $variant="dislike"
            disabled={isActionLoading}
            onClick={handleDislike}
          >
            <FiThumbsDown />
            <span>{formatCount(currentPost.dislikesCount)}</span>
          </ActionButton>

          <CommentsLink to={`/posts/${currentPost.id}#comments`}>
            <FiMessageCircle />
            <span>{formatCount(currentPost.commentsCount)}</span>
          </CommentsLink>
        </Actions>
      </Body>
    </Card>
  );
}

function formatCount(value: number) {
  const count = Number(value || 0);

  if (count < 1000) {
    return String(count);
  }

  const thousands = count / 1000;

  if (thousands < 100) {
    return `${trimTrailingZero(thousands.toFixed(1))} тыс.`;
  }

  return `${Math.round(thousands)} тыс.`;
}

function trimTrailingZero(value: string) {
  return value.endsWith('.0') ? value.slice(0, -2) : value;
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

const Card = styled.article`
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: rgba(21, 25, 43, 0.84);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.18);
`;

const MediaFrame = styled.div<{
  $backgroundUrl?: string;
  $hasImage?: boolean;
}>`
  position: relative;
  overflow: hidden;
  height: clamp(320px, 68vw, 620px);
  background:
    radial-gradient(circle at top left, rgba(124, 58, 237, 0.22), transparent 34%),
    radial-gradient(circle at bottom right, rgba(37, 99, 235, 0.16), transparent 34%),
    #05060d;
  display: flex;
  align-items: center;
  justify-content: center;
  isolation: isolate;

  &::before {
    content: '';
    position: absolute;
    inset: -34px;
    z-index: -2;
    background-image: ${({ $backgroundUrl }) =>
      $backgroundUrl ? `url("${$backgroundUrl}")` : 'none'};
    background-size: cover;
    background-position: center;
    filter: blur(28px);
    transform: scale(1.08);
    opacity: ${({ $hasImage }) => ($hasImage ? 0.58 : 0)};
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background:
      linear-gradient(
        90deg,
        rgba(5, 6, 13, 0.52),
        rgba(5, 6, 13, 0.12) 18%,
        rgba(5, 6, 13, 0.08) 50%,
        rgba(5, 6, 13, 0.12) 82%,
        rgba(5, 6, 13, 0.52)
      ),
      linear-gradient(
        180deg,
        rgba(5, 6, 13, 0.42),
        rgba(5, 6, 13, 0.04) 24%,
        rgba(5, 6, 13, 0.04) 76%,
        rgba(5, 6, 13, 0.42)
      );
    pointer-events: none;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    height: clamp(300px, 82vw, 560px);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    height: clamp(280px, 105vw, 520px);
  }
`;

const MediaImageLink = styled(Link)`
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: block;
`;

const MediaImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
  transition:
    transform 0.25s ease,
    filter 0.25s ease;
  filter: drop-shadow(0 20px 44px rgba(0, 0, 0, 0.28));

  ${MediaImageLink}:hover & {
    transform: scale(1.012);
  }
`;

const MediaVideo = styled.video`
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
  background: transparent;
  filter: drop-shadow(0 20px 44px rgba(0, 0, 0, 0.28));
`;

const MediaPlaceholder = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at top left, rgba(124, 58, 237, 0.28), transparent 34%),
    radial-gradient(circle at bottom right, rgba(37, 99, 235, 0.2), transparent 34%),
    #080a12;
  color: ${({ theme }) => theme.colors.primaryHover};
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 10px;
  font-weight: 800;

  svg {
    font-size: 48px;
  }

  span {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const SaveIconButton = styled.button<{ $active?: boolean }>`
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 5;
  width: 42px;
  height: 42px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(5, 6, 13, 0.48);
  backdrop-filter: blur(14px);
  color: ${({ theme, $active }) =>
    $active ? theme.colors.primaryHover : theme.colors.textMuted};
  display: grid;
  place-items: center;
  font-size: 20px;
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.24);

  svg {
    transition:
      color 0.18s ease,
      transform 0.18s ease;
  }

  &:hover:not(:disabled) {
    background: rgba(5, 6, 13, 0.62);
    color: ${({ theme }) => theme.colors.primaryHover};

    svg {
      transform: scale(1.08);
    }
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

const LockedOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 4;
  background:
    radial-gradient(circle at center, rgba(124, 58, 237, 0.18), transparent 42%),
    rgba(5, 6, 13, 0.74);
  backdrop-filter: blur(8px);
  color: white;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 10px;
  font-weight: 800;

  svg {
    color: #f9a8d4;
    font-size: 42px;
  }
`;

const Body = styled.div`
  padding: 15px 16px 14px;
  display: grid;
  gap: 10px;
`;

const ContentLink = styled(Link)`
  color: inherit;
  display: grid;
  gap: 8px;
`;

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 21px;
  line-height: 1.18;
  letter-spacing: -0.045em;
  font-weight: 500;
`;

const AuthorRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const Author = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 9px;
`;

const AuthorAvatar = styled.div`
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  overflow: hidden;
  border-radius: 13px;
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  color: white;
  display: grid;
  place-items: center;
  font-size: 16px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const AuthorText = styled.div`
  min-width: 0;
  display: grid;

  span {
    overflow: hidden;
    color: ${({ theme }) => theme.colors.textMuted};
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    font-weight: 500;
  }
`;

const PremiumPill = styled.div`
  flex: 0 0 auto;
  min-height: 28px;
  padding: 0 9px;
  border: 1px solid rgba(236, 72, 153, 0.22);
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(236, 72, 153, 0.09);
  color: #f9a8d4;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
`;

const Description = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.5;
  white-space: pre-wrap;
  font-size: 14px;
  font-weight: 400;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  padding-top: 2px;
`;

const ActionButton = styled.button<{
  $active?: boolean;
  $variant?: 'like' | 'dislike';
}>`
  min-height: 34px;
  padding: 0 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(255, 255, 255, 0.035);
  color: ${({ theme }) => theme.colors.textMuted};
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;

  svg {
    color: ${({ theme, $active, $variant }) => {
      if (!$active) {
        return theme.colors.textMuted;
      }

      if ($variant === 'like') {
        return '#ef4444';
      }

      if ($variant === 'dislike') {
        return '#60a5fa';
      }

      return theme.colors.primaryHover;
    }};
    transition:
      color 0.18s ease,
      transform 0.18s ease;
  }

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.055);

    svg {
      transform: scale(1.08);
      color: ${({ theme, $variant }) =>
        $variant === 'like'
          ? '#ef4444'
          : $variant === 'dislike'
            ? '#60a5fa'
            : theme.colors.primaryHover};
    }
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

const CommentsLink = styled(Link)`
  min-height: 34px;
  padding: 0 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(255, 255, 255, 0.035);
  color: ${({ theme }) => theme.colors.textMuted};
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;

  svg {
    color: ${({ theme }) => theme.colors.textMuted};
    transition:
      color 0.18s ease,
      transform 0.18s ease;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.055);

    svg {
      color: ${({ theme }) => theme.colors.primaryHover};
      transform: scale(1.08);
    }
  }
`;