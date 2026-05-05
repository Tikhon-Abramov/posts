import { useMemo, useState } from 'react';
import styled from 'styled-components';
import {
    FiAlertCircle,
    FiBookmark,
    FiFilter,
    FiImage,
    FiRefreshCw,
    FiSearch,
    FiVideo,
} from 'react-icons/fi';

import { useGetSavedPostsQuery } from '../entities/post/api/postApi';
import { PostGrid } from '../entities/post/ui/PostGrid';

type MediaFilter = 'ALL' | 'IMAGE' | 'VIDEO';
type SortMode = 'RECENT' | 'POPULAR';

export function SavedPostsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [mediaFilter, setMediaFilter] = useState<MediaFilter>('ALL');
    const [sortMode, setSortMode] = useState<SortMode>('RECENT');

    const {
        data,
        isLoading,
        isFetching,
        isError,
        refetch,
    } = useGetSavedPostsQuery({
        page: 1,
        limit: 50,
    });

    const posts = data?.posts || [];

    const filteredPosts = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();

        return posts
            .filter((post) => {
                if (mediaFilter !== 'ALL' && post.media[0]?.type !== mediaFilter) {
                    return false;
                }

                if (!normalizedQuery) {
                    return true;
                }

                const title = post.title?.toLowerCase() || '';
                const description = post.description?.toLowerCase() || '';
                const author = post.author.nickname.toLowerCase();

                return (
                    title.includes(normalizedQuery) ||
                    description.includes(normalizedQuery) ||
                    author.includes(normalizedQuery)
                );
            })
            .sort((a, b) => {
                if (sortMode === 'POPULAR') {
                    const aScore = a.likesCount + a.commentsCount - a.dislikesCount;
                    const bScore = b.likesCount + b.commentsCount - b.dislikesCount;

                    return bScore - aScore;
                }

                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
    }, [mediaFilter, posts, searchQuery, sortMode]);

    const resetFilters = () => {
        setSearchQuery('');
        setMediaFilter('ALL');
        setSortMode('RECENT');
    };

    if (isLoading) {
        return (
            <StateCard>
                <FiBookmark />
                <h1>Загружаем сохраненные</h1>
                <p>Сейчас покажем публикации, которые вы сохранили в профиль.</p>
            </StateCard>
        );
    }

    if (isError) {
        return (
            <StateCard>
                <FiAlertCircle />
                <h1>Не удалось загрузить сохраненные</h1>
                <p>Попробуйте обновить список сохраненных публикаций.</p>

                <PrimaryButton type="button" onClick={() => refetch()}>
                    <FiRefreshCw />
                    Повторить
                </PrimaryButton>
            </StateCard>
        );
    }

    return (
        <Page>
            <Hero>
                <HeroContent>
                    <Eyebrow>Личный раздел</Eyebrow>

                    <Title>Сохраненные посты</Title>

                    <Subtitle>
                        Здесь находятся публикации, которые вы сохранили. Другие пользователи
                        не видят, что именно вы добавили в сохраненные.
                    </Subtitle>
                </HeroContent>

                <HeroBadge>
                    <FiBookmark />
                    Private
                </HeroBadge>
            </Hero>

            <StatsGrid>
                <StatCard>
                    <FiImage />
                    <div>
                        <strong>
                            {filteredPosts.filter((post) => post.media[0]?.type === 'IMAGE').length}
                        </strong>
                        <span>Фото</span>
                    </div>
                </StatCard>

                <StatCard>
                    <FiVideo />
                    <div>
                        <strong>
                            {filteredPosts.filter((post) => post.media[0]?.type === 'VIDEO').length}
                        </strong>
                        <span>Видео</span>
                    </div>
                </StatCard>

                <StatCard>
                    <FiBookmark />
                    <div>
                        <strong>{filteredPosts.length}</strong>
                        <span>Найдено</span>
                    </div>
                </StatCard>
            </StatsGrid>

            <Toolbar>
                <SearchBox>
                    <FiSearch />

                    <input
                        type="text"
                        value={searchQuery}
                        placeholder="Поиск по сохраненным: название, описание, автор..."
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

                <ToolbarActions>
                    <ResetButton type="button" onClick={resetFilters}>
                        <FiFilter />
                        Сбросить
                    </ResetButton>

                    <RefreshButton
                        type="button"
                        disabled={isFetching}
                        onClick={() => refetch()}
                    >
                        <FiRefreshCw />
                        {isFetching ? 'Обновляем...' : 'Обновить'}
                    </RefreshButton>
                </ToolbarActions>
            </Toolbar>

            {filteredPosts.length ? (
                <PostGrid posts={filteredPosts} />
            ) : posts.length ? (
                <EmptyCard>
                    <FiSearch />

                    <h2>По фильтрам ничего не найдено</h2>

                    <p>
                        Попробуйте изменить поисковую фразу, выбрать другой тип медиа или
                        сбросить фильтры.
                    </p>

                    <EmptyButton type="button" onClick={resetFilters}>
                        Сбросить фильтры
                    </EmptyButton>
                </EmptyCard>
            ) : (
                <EmptyCard>
                    <FiBookmark />

                    <h2>Сохраненных постов пока нет</h2>

                    <p>
                        Нажмите кнопку сохранения под любым постом, и публикация появится в
                        этом разделе.
                    </p>
                </EmptyCard>
            )}
        </Page>
    );
}

const Page = styled.div`
  display: grid;
  gap: 18px;
`;

const Hero = styled.section`
  padding: 22px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background:
    radial-gradient(circle at top left, rgba(124, 58, 237, 0.22), transparent 34%),
    radial-gradient(circle at bottom right, rgba(37, 99, 235, 0.16), transparent 34%),
    rgba(21, 25, 43, 0.86);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    padding: 18px;
  }
`;

const HeroContent = styled.div`
  min-width: 0;
`;

const Eyebrow = styled.div`
  margin-bottom: 8px;
  color: ${({ theme }) => theme.colors.primaryHover};
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(30px, 5vw, 52px);
  line-height: 0.96;
  letter-spacing: -0.075em;
`;

const Subtitle = styled.p`
    max-width: 720px;
    margin: 12px 0 0;
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.65;
`;

const HeroBadge = styled.div`
    flex: 0 0 auto;
    min-height: 42px;
    padding: 0 14px;
    border: 1px solid rgba(124, 58, 237, 0.36);
    border-radius: ${({ theme }) => theme.radius.full};
    background: rgba(124, 58, 237, 0.12);
    color: #ddd6fe;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 900;
`;

const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        grid-template-columns: 1fr;
    }
`;

const StatCard = styled.article`
    padding: 16px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.lg};
    background: rgba(21, 25, 43, 0.78);
    display: flex;
    align-items: center;
    gap: 13px;

    > svg {
        width: 46px;
        height: 46px;
        padding: 12px;
        border-radius: 17px;
        background: rgba(124, 58, 237, 0.14);
        color: ${({ theme }) => theme.colors.primaryHover};
    }

    div {
        min-width: 0;
        display: grid;
        gap: 2px;
    }

    strong {
        font-size: 28px;
        line-height: 1;
        letter-spacing: -0.05em;
    }

    span {
        color: ${({ theme }) => theme.colors.textMuted};
        font-size: 13px;
        font-weight: 800;
    }
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

const ToolbarActions = styled.div`
    display: flex;
    gap: 8px;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        display: grid;
        grid-template-columns: 1fr;
    }
`;

const RefreshButton = styled.button`
    flex: 0 0 auto;
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

    &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.09);
        border-color: rgba(139, 92, 246, 0.45);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
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