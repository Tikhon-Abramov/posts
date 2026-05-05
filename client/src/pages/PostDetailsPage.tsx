import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import {
    FiAlertCircle,
    FiArrowLeft,
    FiFileText,
    FiLock,
    FiRefreshCw,
    FiStar,
} from 'react-icons/fi';

import type { RootState } from '../app/store';
import type { Post } from '../entities/post/model/postTypes';
import { PostCard } from '../entities/post/ui/PostCard';
import {
    applyMockUserStateToPost,
    getMockPosts,
} from '../shared/lib/mockStorage';

export function PostDetailsPage() {
    const { postId } = useParams();

    const { accessToken, user } = useSelector((state: RootState) => state.auth);

    const [posts, setPosts] = useState<Post[]>([]);

    const loadPosts = () => {
        setPosts(getMockPosts());
    };

    useEffect(() => {
        loadPosts();
    }, []);

    const post = useMemo(() => {
        const id = Number(postId);

        if (Number.isNaN(id)) {
            return null;
        }

        const foundPost = posts.find((item) => item.id === id);

        if (!foundPost) {
            return null;
        }

        return applyMockUserStateToPost(foundPost, accessToken);
    }, [accessToken, postId, posts]);

    const canViewPremiumPost = useMemo(() => {
        if (!post) {
            return false;
        }

        if (post.visibility === 'PUBLIC') {
            return true;
        }

        if (user?.role === 'ADMIN') {
            return true;
        }

        if (user?.id === post.author.id) {
            return true;
        }

        return Boolean(user?.hasPremium);
    }, [post, user]);

    if (!post) {
        return (
            <StateCard>
                <FiAlertCircle />

                <h1>Пост не найден</h1>

                <p>
                    Возможно, публикация была удалена администратором или mock-данные были
                    сброшены.
                </p>

                <PrimaryLink to="/">
                    <FiArrowLeft />
                    Вернуться в ленту
                </PrimaryLink>
            </StateCard>
        );
    }

    if (!canViewPremiumPost) {
        return (
            <StateCard>
                <FiLock />

                <h1>Premium-публикация</h1>

                <p>
                    Этот пост находится в закрытой ленте. Чтобы посмотреть его, оформите
                    подписку или войдите в аккаунт с Premium-доступом.
                </p>

                <Actions>
                    <PrimaryLink to="/subscription">
                        <FiStar />
                        Оформить подписку
                    </PrimaryLink>

                    <SecondaryLink to="/">
                        <FiArrowLeft />
                        В ленту
                    </SecondaryLink>
                </Actions>
            </StateCard>
        );
    }

    return (
        <Page>
            <Hero>
                <HeroContent>
                    <Eyebrow>Публикация</Eyebrow>

                    <Title>{post.title || 'Пост без названия'}</Title>

                    <Subtitle>
                        Отдельная страница поста. Здесь удобно открывать публикацию из
                        уведомлений, комментариев или личного профиля.
                    </Subtitle>
                </HeroContent>

                <HeroActions>
                    <BackLink to="/">
                        <FiArrowLeft />
                        В ленту
                    </BackLink>

                    <RefreshButton type="button" onClick={loadPosts}>
                        <FiRefreshCw />
                        Обновить
                    </RefreshButton>
                </HeroActions>
            </Hero>

            <ContentGrid>
                <MainColumn>
                    <PostCard post={post} />
                </MainColumn>

                <SideColumn>
                    <InfoCard>
                        <FiFileText />

                        <h2>Информация</h2>

                        <InfoList>
                            <InfoItem>
                                <strong>ID поста</strong>
                                <span>{post.id}</span>
                            </InfoItem>

                            <InfoItem>
                                <strong>Автор</strong>
                                <span>@{post.author.nickname}</span>
                            </InfoItem>

                            <InfoItem>
                                <strong>Лента</strong>
                                <span>
                  {post.visibility === 'PREMIUM' ? 'Premium' : 'Обычная'}
                </span>
                            </InfoItem>

                            <InfoItem>
                                <strong>Дата</strong>
                                <span>{new Date(post.createdAt).toLocaleString('ru-RU')}</span>
                            </InfoItem>
                        </InfoList>
                    </InfoCard>

                    {post.visibility === 'PREMIUM' && (
                        <PremiumCard>
                            <FiStar />

                            <h2>Premium</h2>

                            <p>
                                Эта публикация относится к закрытой ленте. Ее видят автор,
                                администратор и пользователи с активной подпиской.
                            </p>
                        </PremiumCard>
                    )}
                </SideColumn>
            </ContentGrid>
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
            radial-gradient(circle at top left, rgba(124, 58, 237, 0.24), transparent 34%),
            radial-gradient(circle at bottom right, rgba(37, 99, 235, 0.16), transparent 34%),
            rgba(21, 25, 43, 0.86);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        align-items: flex-start;
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

const HeroActions = styled.div`
    flex: 0 0 auto;
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
`;

const BackLink = styled(Link)`
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

    &:hover {
        background: rgba(255, 255, 255, 0.1);
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

    &:hover {
        background: rgba(255, 255, 255, 0.1);
    }
`;

const ContentGrid = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 18px;

    @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
        grid-template-columns: 1fr;
    }
`;

const MainColumn = styled.div`
    min-width: 0;
`;

const SideColumn = styled.aside`
    min-width: 0;
    display: grid;
    align-content: start;
    gap: 18px;
`;

const InfoCard = styled.section`
    padding: 20px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.lg};
    background: rgba(21, 25, 43, 0.84);

    > svg {
        margin-bottom: 14px;
        color: ${({ theme }) => theme.colors.primaryHover};
        font-size: 34px;
    }

    h2 {
        margin: 0 0 14px;
        font-size: 24px;
        letter-spacing: -0.05em;
    }
`;

const PremiumCard = styled(InfoCard)`
    border-color: rgba(236, 72, 153, 0.28);
    background:
            radial-gradient(circle at top left, rgba(236, 72, 153, 0.16), transparent 36%),
            rgba(21, 25, 43, 0.84);

    > svg {
        color: #f9a8d4;
    }

    p {
        margin: 0;
        color: ${({ theme }) => theme.colors.textMuted};
        line-height: 1.6;
    }
`;

const InfoList = styled.div`
    display: grid;
    gap: 8px;
`;

const InfoItem = styled.div`
    padding: 10px 12px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.035);
    display: grid;
    gap: 4px;

    strong {
        color: ${({ theme }) => theme.colors.text};
        font-size: 12px;
    }

    span {
        color: ${({ theme }) => theme.colors.textMuted};
        font-size: 13px;
        line-height: 1.35;
        word-break: break-word;
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

const Actions = styled.div`
    margin-top: 24px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
`;

const PrimaryLink = styled(Link)`
    min-height: 48px;
    margin-top: 22px;
    padding: 0 18px;
    border-radius: ${({ theme }) => theme.radius.full};
    background: linear-gradient(135deg, #7c3aed, #2563eb);
    color: white;
    display: inline-flex;
    align-items: center;
    gap: 9px;
    font-weight: 900;

    &:hover {
        filter: brightness(1.08);
    }
`;

const SecondaryLink = styled(Link)`
    min-height: 48px;
    padding: 0 18px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.full};
    background: rgba(255, 255, 255, 0.06);
    color: ${({ theme }) => theme.colors.text};
    display: inline-flex;
    align-items: center;
    gap: 9px;
    font-weight: 900;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
    }
`;