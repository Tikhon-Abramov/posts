/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { FiAlertCircle, FiFilter, FiLoader, FiSearch } from 'react-icons/fi';

import {
  useGetFeedQuery,
  useGetLatestFeedPostsQuery,
} from '../entities/post/api/postApi';
import type { MediaType, Post } from '../entities/post/model/postTypes';
import { PostGrid } from '../entities/post/ui/PostGrid';

type MediaFilter = 'ALL' | MediaType;
type SortMode = 'RECENT' | 'POPULAR';

const FEED_LIMIT = 10;
const POLLING_INTERVAL = 8000;

export function HomePage() {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isFiltersMountedRef = useRef(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('ALL');
  const [sortMode, setSortMode] = useState<SortMode>('RECENT');

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
  } = useGetFeedQuery(
    {
      type: 'public',
      cursor: cursor || undefined,
      limit: FEED_LIMIT,
      search: searchQuery,
      mediaType: mediaFilter,
      sort: sortMode,
    },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  const dataPosts = useMemo(() => {
    return data?.items || data?.posts || [];
  }, [data]);

  const visiblePosts = useMemo(() => {
    if (loadedPosts.length) {
      return loadedPosts;
    }

    return dataPosts;
  }, [dataPosts, loadedPosts]);

  const latestAfter = visiblePosts[0]?.createdAt || null;

  const { data: latestData } = useGetLatestFeedPostsQuery(
    {
      type: 'public',
      after: latestAfter,
      search: searchQuery,
      mediaType: mediaFilter,
    },
    {
      skip: !latestAfter || sortMode !== 'RECENT',
      pollingInterval: POLLING_INTERVAL,
    }
  );

  const isFirstLoading =
    (isLoading || isFetching) && visiblePosts.length === 0 && !data;

  const isLoadingMore = Boolean(cursor) && isFetching && visiblePosts.length > 0;

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
        return mergePostsKeepingFirstPriority(items, currentPosts);
      }

      return mergePostsKeepingFirstPriority(currentPosts, items);
    });

    setNextCursor(data.nextCursor);
    setHasMore(data.hasMore);
  }, [cursor, data]);

  useEffect(() => {
    const latestItems = latestData?.items || [];

    if (!latestItems.length) {
      return;
    }

    setLoadedPosts((currentPosts) =>
      mergePostsKeepingFirstPriority(latestItems, currentPosts)
    );
  }, [latestData]);

  useEffect(() => {
    if (!isFiltersMountedRef.current) {
      isFiltersMountedRef.current = true;
      return;
    }

    setCursor(null);
    setLoadedPosts([]);
    setNextCursor(null);
    setHasMore(true);
  }, [mediaFilter, searchQuery, sortMode]);

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

  const statsText = useMemo(() => {
    if (!visiblePosts.length) {
      return 'Пока публикаций нет';
    }

  

  }, [visiblePosts]);

  const resetFilters = () => {
    setSearchQuery('');
    setMediaFilter('ALL');
    setSortMode('RECENT');

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

        <h1>Загружаем ленту</h1>

        <p>Сейчас покажем свежие публичные фото и видео.</p>
      </StateCard>
    );
  }

  if (isError && !visiblePosts.length) {
    return (
      <StateCard>
        <FiAlertCircle />

        <h1>Не удалось загрузить ленту</h1>

        <p>Проверьте подключение или попробуйте повторить загрузку.</p>

        <PrimaryButton type="button" onClick={() => refetch()}>
          Повторить
        </PrimaryButton>
      </StateCard>
    );
  }

  return (
    <Page>
      <Toolbar>
        <SearchBox>
          <FiSearch />

          <input
            value={searchQuery}
            placeholder="Поиск по названию, описанию, автору или ID..."
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </SearchBox>

        <Filters>
          <FilterSelect
            value={mediaFilter}
            onChange={(event) => setMediaFilter(event.target.value as MediaFilter)}
          >
            <option value="ALL">Фото и видео</option>
            <option value="IMAGE">Только фото</option>
            <option value="VIDEO">Только видео</option>
          </FilterSelect>

          <FilterSelect
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
          >
            <option value="RECENT">Сначала новые</option>
            <option value="POPULAR">Сначала популярные</option>
          </FilterSelect>
        </Filters>

        <ResetButton type="button" onClick={resetFilters}>
          <FiFilter />
          Сбросить
        </ResetButton>
      </Toolbar>

      {visiblePosts.length ? (
        <>
          <FeedMeta>
            <span>{statsText}</span>

            {isLoadingMore && (
              <LoadingInline>
                <FiLoader />
                Подгружаем еще...
              </LoadingInline>
            )}
          </FeedMeta>

          <PostGrid posts={visiblePosts} />

          <LoadMoreAnchor ref={loadMoreRef}>
            {hasMore ? (
              <LoadingMore>
                <FiLoader />
                <span>Листайте ниже — посты подгрузятся автоматически</span>
              </LoadingMore>
            ) : (
              <EndMessage>
                Вы посмотрели все посты по текущим фильтрам
              </EndMessage>
            )}
          </LoadMoreAnchor>
        </>
      ) : (
        <EmptyCard>
          <FiAlertCircle />

          <h2>Постов не найдено</h2>

          <p>
            Попробуйте изменить поисковую фразу, выбрать другой тип медиа или
            сбросить фильтры.
          </p>

          <EmptyButton type="button" onClick={resetFilters}>
            Сбросить фильтры
          </EmptyButton>
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

const Toolbar = styled.div`
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: rgba(21, 25, 43, 0.76);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 10px;

  @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
  }
`;

const SearchBox = styled.div`
  min-width: 0;
  height: 46px;
  padding: 0 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(255, 255, 255, 0.045);
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  gap: 10px;

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

  &:focus-within {
    border-color: rgba(139, 92, 246, 0.72);
    box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.12);
  }
`;

const Filters = styled.div`
  display: flex;
  gap: 8px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: grid;
    grid-template-columns: 1fr;
  }
`;

const FilterSelect = styled.select`
  min-height: 46px;
  padding: 0 13px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.full};
  outline: none;
  background: rgba(255, 255, 255, 0.055);
  color: ${({ theme }) => theme.colors.text};
  font-weight: 800;

  option {
    background: #101322;
    color: white;
  }

  &:focus {
    border-color: rgba(139, 92, 246, 0.72);
  }
`;

const ResetButton = styled.button`
  min-height: 46px;
  padding: 0 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(255, 255, 255, 0.055);
  color: ${({ theme }) => theme.colors.text};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  font-weight: 900;

  &:hover {
    background: rgba(255, 255, 255, 0.09);
    border-color: rgba(139, 92, 246, 0.45);
  }
`;

const FeedMeta = styled.div`
  min-height: 22px;
  padding: 0 4px;
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  font-weight: 800;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const LoadingInline = styled.div`
  color: ${({ theme }) => theme.colors.primaryHover};
  display: inline-flex;
  align-items: center;
  gap: 8px;

  svg {
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
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

const EmptyButton = styled.button`
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

const PrimaryButton = styled.button`
  min-height: 48px;
  margin-top: 22px;
  padding: 0 18px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.full};
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  color: white;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-weight: 900;
  box-shadow: 0 18px 44px rgba(124, 58, 237, 0.22);

  &:hover {
    filter: brightness(1.08);
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
    max-width: 500px;
    margin: 0;
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.6;
  }
`;