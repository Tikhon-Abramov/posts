import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import {
    FiAlertCircle,
    FiMessageCircle,
    FiRefreshCw,
    FiTrash2,
    FiUser,
} from 'react-icons/fi';

import type { RootState } from '../../app/store';
import {
    useDeleteCommentMutation,
    useGetPostCommentsQuery,
} from '../../entities/post/api/commentApi';
import type { PostComment } from '../../entities/post/model/commentTypes';

interface CommentsListProps {
    postId: number;
}

export function CommentsList({ postId }: CommentsListProps) {
    const { user } = useSelector((state: RootState) => state.auth);

    const {
        data,
        isLoading,
        isFetching,
        isError,
        refetch,
    } = useGetPostCommentsQuery(postId);

    const [deleteComment, deleteState] = useDeleteCommentMutation();

    const comments = data?.comments || [];

    const deleteError = useMemo(() => {
        const error = deleteState.error;

        if (!error) {
            return null;
        }

        if ('data' in error) {
            const data = error.data as {
                message?: string;
                error?: string;
            };

            return data?.message || data?.error || 'Не удалось удалить комментарий.';
        }

        return 'Ошибка соединения с сервером.';
    }, [deleteState.error]);

    const handleDelete = async (comment: PostComment) => {
        const isConfirmed = window.confirm('Удалить комментарий?');

        if (!isConfirmed) {
            return;
        }

        try {
            await deleteComment({
                postId,
                commentId: comment.id,
            }).unwrap();
        } catch {
            /*
              Ошибка уже отображается через deleteError.
            */
        }
    };

    if (isLoading) {
        return (
            <StateBox>
                <FiMessageCircle />
                <span>Загружаем комментарии...</span>
            </StateBox>
        );
    }

    if (isError) {
        return (
            <StateBox>
                <FiAlertCircle />
                <span>Не удалось загрузить комментарии.</span>

                <RetryButton type="button" onClick={() => refetch()}>
                    <FiRefreshCw />
                    Повторить
                </RetryButton>
            </StateBox>
        );
    }

    return (
        <Root>
            <Header>
                <Title>
                    <FiMessageCircle />
                    Комментарии
                </Title>

                <Counter>{comments.length}</Counter>
            </Header>

            {deleteError && (
                <ErrorBox>
                    <FiAlertCircle />
                    <span>{deleteError}</span>
                </ErrorBox>
            )}

            {comments.length ? (
                <List>
                    {comments.map((comment) => {
                        const canDelete =
                            user?.id === comment.author.id || user?.role === 'ADMIN';

                        return (
                            <CommentItem key={comment.id}>
                                <Avatar>
                                    {comment.author.avatarUrl ? (
                                        <img
                                            src={comment.author.avatarUrl}
                                            alt={comment.author.nickname}
                                        />
                                    ) : (
                                        <FiUser />
                                    )}
                                </Avatar>

                                <CommentBody>
                                    <CommentBubble>
                                        <CommentTop>
                                            <AuthorName>@{comment.author.nickname}</AuthorName>

                                            <DateText>
                                                {new Date(comment.createdAt).toLocaleString('ru-RU')}
                                            </DateText>
                                        </CommentTop>

                                        <CommentText>{comment.text}</CommentText>
                                    </CommentBubble>

                                    {canDelete && (
                                        <DeleteButton
                                            type="button"
                                            disabled={deleteState.isLoading}
                                            onClick={() => handleDelete(comment)}
                                        >
                                            <FiTrash2 />
                                            Удалить
                                        </DeleteButton>
                                    )}
                                </CommentBody>
                            </CommentItem>
                        );
                    })}
                </List>
            ) : (
                <EmptyBox>
                    <FiMessageCircle />
                    <h3>Комментариев пока нет</h3>
                    <p>Станьте первым, кто напишет комментарий к этому посту.</p>
                </EmptyBox>
            )}

            {isFetching && !isLoading && <FetchingText>Обновляем...</FetchingText>}
        </Root>
    );
}

const Root = styled.section`
  display: grid;
  gap: 12px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const Title = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
  letter-spacing: -0.03em;

  svg {
    color: ${({ theme }) => theme.colors.primaryHover};
  }
`;

const Counter = styled.span`
  min-width: 30px;
  height: 30px;
  padding: 0 9px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(124, 58, 237, 0.14);
  color: ${({ theme }) => theme.colors.primaryHover};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 900;
`;

const List = styled.div`
  display: grid;
  gap: 12px;
`;

const CommentItem = styled.article`
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 10px;
`;

const Avatar = styled.div`
  width: 38px;
  height: 38px;
  overflow: hidden;
  border-radius: 14px;
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  color: white;
  display: grid;
  place-items: center;
  font-size: 18px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const CommentBody = styled.div`
  min-width: 0;
  display: grid;
  gap: 7px;
`;

const CommentBubble = styled.div`
  min-width: 0;
  padding: 11px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.045);
`;

const CommentTop = styled.div`
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    align-items: flex-start;
    flex-direction: column;
    gap: 3px;
  }
`;

const AuthorName = styled.strong`
  min-width: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
`;

const DateText = styled.span`
  flex: 0 0 auto;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 12px;
  font-weight: 700;
`;

const CommentText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
`;

const DeleteButton = styled.button`
  width: fit-content;
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid rgba(239, 68, 68, 0.28);
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(239, 68, 68, 0.09);
  color: #fecaca;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 900;

  &:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.15);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const EmptyBox = styled.div`
  min-height: 160px;
  padding: 22px 16px;
  border: 1px dashed rgba(139, 92, 246, 0.32);
  border-radius: 20px;
  background: rgba(124, 58, 237, 0.055);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;

  > svg {
    margin-bottom: 10px;
    color: ${({ theme }) => theme.colors.primaryHover};
    font-size: 30px;
  }

  h3 {
    margin: 0 0 6px;
    font-size: 18px;
    letter-spacing: -0.04em;
  }

  p {
    max-width: 360px;
    margin: 0;
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.5;
    font-size: 14px;
  }
`;

const StateBox = styled.div`
  min-height: 120px;
  padding: 18px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 9px;
  text-align: center;
  font-weight: 800;

  > svg {
    color: ${({ theme }) => theme.colors.primaryHover};
    font-size: 28px;
  }
`;

const RetryButton = styled.button`
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(255, 255, 255, 0.06);
  color: ${({ theme }) => theme.colors.text};
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 900;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
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

const FetchingText = styled.div`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 12px;
  font-weight: 800;
  text-align: center;
`;