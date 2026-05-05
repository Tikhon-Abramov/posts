import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import {
    FiAlertCircle,
    FiFilter,
    FiImage,
    FiLock,
    FiLogIn,
    FiRefreshCw,
    FiSearch,
    FiStar,
    FiVideo,
    FiZap,
} from 'react-icons/fi';

import type { AppDispatch, RootState } from '../app/store';
import { openAuthModal } from '../entities/auth/slice/authSlice';
import { useGetFeedQuery } from '../entities/post/api/postApi';
import { PostGrid } from '../entities/post/ui/PostGrid';

type MediaFilter = 'ALL' | 'IMAGE' | 'VIDEO';
type SortMode = 'RECENT' | 'POPULAR';

export function PremiumFeedPage() {
    const dispatch = useDispatch<AppDispatch>();

    const { accessToken, user } = useSelector((state: RootState) => state.auth);

    const [searchQuery, setSearchQuery] = useState('');
    const [mediaFilter, setMediaFilter] = useState<MediaFilter>('ALL');
    const [sortMode, setSortMode] = useState<SortMode>('RECENT');

    const isAuth = Boolean(accessToken);
    const isSessionChecking = isAuth && !user;
    const hasPremium = Boolean(user?.hasPremium);

    const {
        data,
        isLoading,
        isFetching,
        isError,
        refetch,
    } = useGetFeedQuery(
        {
            type: 'premium',
            page: 1,
            limit: 50,
        },
        {
            skip: !hasPremium,
        }
    );

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

    const handleOpenLogin = () => {
        dispatch(
            openAuthModal({
                mode: 'login',
                reason:
                    'Войдите в аккаунт, чтобы оформить подписку и получить доступ к премиум-ленте.',
            })
        );
    };

    const handleOpenRegister = () => {
        dispatch(
            openAuthModal({
                mode: 'register',
                reason:
                    'Создайте аккаунт, чтобы оформить подписку и смотреть закрытые фото и видео.',
            })
        );
    };

    if (!isAuth) {
        return (
            <Page>
                <Paywall>
                    <IconBox>
                        <FiLock />
                    </IconBox>

                    <Eyebrow>Premium Feed</Eyebrow>

                    <Title>Закрытая лента</Title>

                    <Subtitle>
                        Премиум-посты доступны только авторизованным пользователям с активной
                        подпиской. Войдите или создайте аккаунт, чтобы продолжить.
                    </Subtitle>

                    <Benefits>
                        <Benefit>
                            <FiStar />
                            <span>Эксклюзивные фото и видео</span>
                        </Benefit>

                        <Benefit>
                            <FiZap />
                            <span>Доступ к закрытым публикациям</span>
                        </Benefit>

                        <Benefit>
                            <FiLock />
                            <span>Контент только для подписчиков</span>
                        </Benefit>
                    </Benefits>

                    <Actions>
                        <PrimaryButton type="button" onClick={handleOpenLogin}>
                            <FiLogIn />
                            Войти
                        </PrimaryButton>

                        <SecondaryButton type="button" onClick={handleOpenRegister}>
                            Создать аккаунт
                        </SecondaryButton>
                    </Actions>
                </Paywall>
            </Page>
        );
    }

    if (isSessionChecking) {
        return (
            <StateCard>
                <FiRefreshCw />
                <h1>Проверяем сессию</h1>
                <p>Сейчас подтвердим аккаунт и доступ к премиум-разделу.</p>
            </StateCard>
        );
    }

    if (!hasPremium) {
        return (
            <Page>
                <Paywall>
                    <IconBox>
                        <FiStar />
                    </IconBox>

                    <Eyebrow>Нужна подписка</Eyebrow>

                    <Title>Открой премиум-ленту</Title>

                    <Subtitle>
                        Ваш аккаунт авторизован, но активной подписки пока нет. Оформите
                        подписку, чтобы смотреть закрытые публикации.
                    </Subtitle>

                    <Benefits>
                        <Benefit>
                            <FiStar />
                            <span>Премиум фото и видео</span>
                        </Benefit>

                        <Benefit>
                            <FiZap />
                            <span>Отдельная закрытая лента</span>
                        </Benefit>

                        <Benefit>
                            <FiLock />
                            <span>Доступ только для подписчиков</span>
                        </Benefit>
                    </Benefits>

                    <Actions>
                        <SubscribeLink to="/subscription">Оформить подписку</SubscribeLink>
                    </Actions>
                </Paywall>
            </Page>
        );
    }

    if (isLoading) {
        return (
            <StateCard>
                <FiStar />
                <h1>Загружаем Premium</h1>
                <p>Подготавливаем закрытые публикации.</p>
            </StateCard>
        );
    }

    if (isError) {
        return (
            <StateCard>
                <FiAlertCircle />
                <h1>Не удалось загрузить Premium</h1>
                <p>Проверьте подключение или попробуйте обновить закрытую ленту.</p>

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
                    <Eyebrow>Premium</Eyebrow>

                    <Title>Закрытая лента</Title>

                    <Subtitle>
                        Эксклюзивные фото и видео доступны только пользователям с активной
                        подпиской. Используйте поиск, чтобы быстро найти нужный Premium-пост.
                    </Subtitle>
                </HeroContent>

                <HeroBadge>
                    <FiStar />
                    Active
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
                    <FiStar />
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
                        placeholder="Поиск по Premium: название, описание, автор..."
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
                    <FiStar />

                    <h2>Premium-постов пока нет</h2>

                    <p>
                        Создайте Premium-пост в админке или примите пользовательскую заявку
                        в закрытую ленту, и публикации появятся здесь.
                    </p>

                    <AdminHintLink to="/admin/posts/create">
                        Создать Premium-пост
                    </AdminHintLink>
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
    radial-gradient(circle at top left, rgba(236, 72, 153, 0.22), transparent 34%),
    radial-gradient(circle at bottom right, rgba(124, 58, 237, 0.22), transparent 34%),
    rgba(21, 25, 43, 0.84);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 18px;
    flex-direction: column;
  }
`;

const HeroContent = styled.div`
  min-width: 0;
`;

const Eyebrow = styled.div`
  margin-bottom: 8px;
  color: #ec4899;
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
    max-width: 680px;
    margin: 12px 0 0;
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.65;
`;

const HeroBadge = styled.div`
    flex: 0 0 auto;
    height: 42px;
    padding: 0 14px;
    border: 1px solid rgba(236, 72, 153, 0.36);
    border-radius: ${({ theme }) => theme.radius.full};
    background: rgba(236, 72, 153, 0.12);
    color: #fbcfe8;
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
        background: rgba(236, 72, 153, 0.13);
        color: #f9a8d4;
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
        border-color: rgba(236, 72, 153, 0.72);
        box-shadow: 0 0 0 4px rgba(236, 72, 153, 0.11);
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
        border-color: rgba(236, 72, 153, 0.72);
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
        border-color: rgba(236, 72, 153, 0.45);
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
        border-color: rgba(236, 72, 153, 0.45);
    }
`;

const Paywall = styled.section`
    min-height: 560px;
    padding: 34px 24px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.lg};
    background:
            radial-gradient(circle at top left, rgba(124, 58, 237, 0.26), transparent 34%),
            radial-gradient(circle at bottom right, rgba(239, 68, 68, 0.16), transparent 34%),
            rgba(21, 25, 43, 0.88);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;

    ${Subtitle} {
        max-width: 560px;
    }

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        min-height: 500px;
        padding: 28px 18px;
    }
`;

const IconBox = styled.div`
    width: 82px;
    height: 82px;
    margin-bottom: 18px;
    border-radius: 30px;
    background: linear-gradient(135deg, #7c3aed, #2563eb, #ef4444);
    color: white;
    display: grid;
    place-items: center;
    font-size: 38px;
    box-shadow: 0 24px 60px rgba(124, 58, 237, 0.32);
`;

const Benefits = styled.div`
    width: min(560px, 100%);
    margin-top: 26px;
    display: grid;
    gap: 10px;
`;

const Benefit = styled.div`
    padding: 13px 14px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.045);
    color: ${({ theme }) => theme.colors.text};
    display: flex;
    align-items: center;
    gap: 10px;
    text-align: left;
    font-weight: 700;

    svg {
        flex: 0 0 auto;
        color: #c4b5fd;
        font-size: 19px;
    }
`;

const Actions = styled.div`
    margin-top: 28px;
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
`;

const PrimaryButton = styled.button`
    min-height: 48px;
    padding: 0 18px;
    border: none;
    border-radius: ${({ theme }) => theme.radius.full};
    background: linear-gradient(135deg, #7c3aed, #2563eb);
    color: white;
    display: inline-flex;
    align-items: center;
    gap: 9px;
    font-weight: 900;
    box-shadow: 0 18px 44px rgba(124, 58, 237, 0.24);

    &:hover {
        filter: brightness(1.08);
    }
`;

const SecondaryButton = styled.button`
    min-height: 48px;
    padding: 0 18px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.full};
    background: rgba(255, 255, 255, 0.06);
    color: ${({ theme }) => theme.colors.text};
    font-weight: 900;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
    }
`;

const SubscribeLink = styled(Link)`
    min-height: 50px;
    padding: 0 20px;
    border-radius: ${({ theme }) => theme.radius.full};
    background: linear-gradient(135deg, #7c3aed, #ec4899);
    color: white;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    box-shadow: 0 18px 44px rgba(236, 72, 153, 0.22);

    &:hover {
        filter: brightness(1.08);
    }
`;

const EmptyCard = styled.section`
    min-height: 440px;
    padding: 30px 22px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.lg};
    background:
            radial-gradient(circle at top left, rgba(236, 72, 153, 0.18), transparent 34%),
            radial-gradient(circle at bottom right, rgba(124, 58, 237, 0.18), transparent 34%),
            rgba(21, 25, 43, 0.86);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;

    > svg {
        margin-bottom: 16px;
        color: #f9a8d4;
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
    background: linear-gradient(135deg, #7c3aed, #ec4899);
    color: white;
    font-weight: 900;

    &:hover {
        filter: brightness(1.08);
    }
`;

const AdminHintLink = styled(Link)`
    min-height: 48px;
    margin-top: 22px;
    padding: 0 18px;
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