import styled from 'styled-components';
import { FiBookmark, FiHeart, FiThumbsDown } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch, RootState } from '../../../app/store';
import type { Post } from '../model/postTypes';

import {
  useDislikePostMutation,
  useLikePostMutation,
  useSavePostMutation,
  useUnsavePostMutation,
} from '../api/postApi';

import { openAuthModal } from '../../auth/slice/authSlice';

interface PostActionsProps {
  post: Post;
}

export function PostActions({ post }: PostActionsProps) {
  const dispatch = useDispatch<AppDispatch>();

  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const isAuth = Boolean(accessToken);

  const [likePost, { isLoading: isLikeLoading }] = useLikePostMutation();
  const [dislikePost, { isLoading: isDislikeLoading }] = useDislikePostMutation();
  const [savePost, { isLoading: isSaveLoading }] = useSavePostMutation();
  const [unsavePost, { isLoading: isUnsaveLoading }] = useUnsavePostMutation();

  const openLoginModal = (reason: string) => {
    dispatch(
        openAuthModal({
          mode: 'login',
          reason,
        })
    );
  };

  const handleLike = () => {
    if (!isAuth) {
      openLoginModal('Чтобы лайкать посты, нужно войти в аккаунт.');
      return;
    }

    likePost(post.id);
  };

  const handleDislike = () => {
    if (!isAuth) {
      openLoginModal('Чтобы дизлайкать посты, нужно войти в аккаунт.');
      return;
    }

    dislikePost(post.id);
  };

  const handleSave = () => {
    if (!isAuth) {
      openLoginModal('Чтобы сохранять посты в профиль, нужно войти в аккаунт.');
      return;
    }

    if (post.isSavedByMe) {
      unsavePost(post.id);
    } else {
      savePost(post.id);
    }
  };

  return (
      <Actions>
        <LeftActions>
          <ActionButton
              type="button"
              $active={post.isLikedByMe}
              disabled={isLikeLoading}
              onClick={handleLike}
          >
            <FiHeart />
            <span>{post.likesCount}</span>
          </ActionButton>

          <ActionButton
              type="button"
              $active={post.isDislikedByMe}
              disabled={isDislikeLoading}
              onClick={handleDislike}
          >
            <FiThumbsDown />
            <span>{post.dislikesCount}</span>
          </ActionButton>
        </LeftActions>

        <ActionButton
            type="button"
            $active={post.isSavedByMe}
            disabled={isSaveLoading || isUnsaveLoading}
            onClick={handleSave}
        >
          <FiBookmark />
          <span>{post.isSavedByMe ? 'Сохранено' : 'Сохранить'}</span>
        </ActionButton>
      </Actions>
  );
}

const Actions = styled.div`
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 11px 12px;
    gap: 8px;
  }
`;

const LeftActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ActionButton = styled.button<{ $active?: boolean }>`
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $active }) =>
    $active
        ? 'linear-gradient(135deg, rgba(124,58,237,0.32), rgba(37,99,235,0.24))'
        : 'rgba(255,255,255,0.035)'};
  color: ${({ theme }) => theme.colors.text};
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-weight: 800;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    background 0.16s ease;

  svg {
    font-size: 18px;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: rgba(139, 92, 246, 0.65);
    background: rgba(255, 255, 255, 0.07);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    min-height: 38px;
    padding: 0 10px;
    font-size: 13px;
  }
`;