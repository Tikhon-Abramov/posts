/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { FiAlertCircle, FiBookmark, FiLoader } from 'react-icons/fi';

import { useGetSavedPostsQuery } from '../entities/post/api/postApi';
import type { Post } from '../entities/post/model/postTypes';
import { PostGrid } from '../entities/post/ui/PostGrid';

const FEED_LIMIT = 10;

export function SavedPostsPage() {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const [cursor, setCursor] = useState<string | null>(null);
  const [loadedPosts, setLoadedPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetSavedPostsQuery(
    {
      cursor: cursor || undefined,
      limit: FEED_LIMIT,
      search: '',
      mediaType: 'ALL',
      sort: 'RECENT',
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  const dataPosts = useMemo(() => data?.items || data?.posts || [], [data]);

  const visiblePosts = useMemo(() => {
    if (loadedPosts.length) {
      return loadedPosts;
    }

    return dataPosts;
  }, [dataPosts, loadedPosts]);

  const isFirstLoading =
    (isLoading || isFetching) && visiblePosts.length === 0 && !data;

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!data) {
      return;
    }

    const items = data.items || data.posts || [];

    setLoadedPosts((currentPosts) => {
      if (!cursor) {
        return items;
      }

      return mergePostsKeepingFirstPriority(currentPosts, items);
    });

    setNextCursor(data.nextCursor);
    setHasMore(data.hasMore);
  }, [cursor, data]);

  useEffect(() => {
    const target = loadMoreRef.current;

    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }

        if (!hasMore || isFetching || !nextCursor) {
          return;
        }

        setCursor(nextCursor);
      },
      {
        root: null,
        rootMargin: '700px 0px',
        threshold: 0,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isFetching, nextCursor]);

  const handleRefetch = () => {
    setCursor(null);
    setLoadedPosts([]);
    setNextCursor(null);
    setHasMore(true);

    refetch();
  };

  if (isFirstLoading) {
    return (
      <StateCard>
        <FiLoader />

        <h1>Загружаем сохраненные</h1>

        <p>Сейчас покажем публикации, которые вы сохранили в профиль.</p>
      </StateCard>
    );
  }

  if (isError && !visiblePosts.length) {
    return (
      <StateCard>
        <FiAlertCircle />

        <h1>Не удалось загрузить сохраненные</h1>

        <p>Попробуйте обновить список сохраненных публикаций.</p>

        <PrimaryButton type="button" onClick={handleRefetch}>
          Повторить
        </PrimaryButton>
      </StateCard>
    );
  }

  return (
    <Page>
      {visiblePosts.length ? (
        <>
          <PostGrid posts={visiblePosts} />

          <LoadMoreAnchor ref={loadMoreRef}>
            {hasMore ? (
              <LoadingMore>
                <FiLoader />
                <span>Листайте ниже — сохраненные посты подгрузятся автоматически</span>
              </LoadingMore>
            ) : (
              <EndMessage>Вы посмотрели все сохраненные посты</EndMessage>
            )}
          </LoadMoreAnchor>
        </>
      ) : (
        <EmptyCard>
          <FiBookmark />

          <h2>Сохраненных постов пока нет</h2>

          <p>
            Когда вы сохраните публикацию, она появится здесь.
          </p>
        </EmptyCard>
      )}
    </Page>
  );
}

function mergePostsKeepingFirstPriority(first: Post[], second: Post[]) {
  const result: Post[] = [];
  const seen = new Set<number>();

  [...first, ...second].forEach((post) => {
    if (seen.has(post.id)) {
      return;
    }

    seen.add(post.id);
    result.push(post);
  });

  return result;
}

const Page = styled.div`
  display: grid;
  gap: 18px;
`;

const LoadMoreAnchor = styled.div`
  min-height: 80px;
  display: grid;
  place-items: center;
`;

const LoadingMore = styled.div`
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(255, 255, 255, 0.045);
  color: ${({ theme }) => theme.colors.textMuted};
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-size: 13px;
  font-weight: 900;

  svg {
    color: ${({ theme }) => theme.colors.primaryHover};
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const EndMessage = styled.div`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 13px;
  font-weight: 800;
`;

const EmptyCard = styled.section`
  min-height: 440px;
  padding: 30px 22px;
  border: 1px dashed rgba(139, 92, 246, 0.34);
  border-radius: ${({ theme }) => theme.radius.lg};
  background:
    radial-gradient(circle at top left, rgba(124, 58, 237, 0.18), transparent 34%),
    rgba(21, 25, 43, 0.74);
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

  h2 {
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

const StateCard = styled(EmptyCard)`
  border-style: solid;
`;

const PrimaryButton = styled.button`
  min-height: 46px;
  margin-top: 22px;
  padding: 0 16px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.full};
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  color: white;
  font-weight: 900;

  &:hover {
    filter: brightness(1.08);
  }
`;