import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import {
  FiArrowRight,
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiGlobe,
  FiImage,
  FiInbox,
  FiPlusCircle,
  FiRefreshCw,
  FiStar,
  FiUsers,
  FiVideo,
  FiXCircle,
} from 'react-icons/fi';

import type {
  MediaType,
  Post,
  PostVisibility,
} from '../../entities/post/model/postTypes';

type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface MockContentRequest {
  id: number;
  userId: number;
  userNickname: string;
  title: string;
  description: string;
  suggestedVisibility: PostVisibility;
  mediaType: MediaType;
  fileName: string;
  fileSize: number;
  previewUrl?: string | null;
  status: RequestStatus;
  createdAt: string;
  reviewedAt?: string | null;
  publishedPostId?: number | null;
}

interface MockUser {
  id: number;
  nickname: string;
  email: string;
  avatarUrl?: string | null;
  role: 'USER' | 'ADMIN';
  hasPremium: boolean;
}

const MOCK_CONTENT_REQUESTS_KEY = 'pulsefeed_mock_content_requests';
const MOCK_POSTS_KEY = 'pulsefeed_mock_posts';
const MOCK_USERS_KEY = 'pulsefeed_mock_users';

export function AdminDashboardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [requests, setRequests] = useState<MockContentRequest[]>([]);
  const [users, setUsers] = useState<MockUser[]>([]);

  const loadDashboardData = () => {
    setPosts(getSavedPosts());
    setRequests(getSavedRequests());
    setUsers(getSavedUsers());
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const stats = useMemo(() => {
    const publicPostsCount = posts.filter(
        (post) => post.visibility === 'PUBLIC'
    ).length;

    const premiumPostsCount = posts.filter(
        (post) => post.visibility === 'PREMIUM'
    ).length;

    const pendingRequestsCount = requests.filter(
        (request) => request.status === 'PENDING'
    ).length;

    const approvedRequestsCount = requests.filter(
        (request) => request.status === 'APPROVED'
    ).length;

    const rejectedRequestsCount = requests.filter(
        (request) => request.status === 'REJECTED'
    ).length;

    const premiumUsersCount = users.filter((user) => user.hasPremium).length;

    return {
      publicPostsCount,
      premiumPostsCount,
      pendingRequestsCount,
      approvedRequestsCount,
      rejectedRequestsCount,
      premiumUsersCount,
    };
  }, [posts, requests, users]);

  const latestRequests = requests.slice(0, 4);
  const latestPosts = posts.slice(0, 4);

  return (
      <Page>
        <Hero>
          <HeroContent>
            <Eyebrow>Обзор</Eyebrow>

            <Title>Панель администратора</Title>

            <Subtitle>
              Быстрый обзор постов, пользовательских заявок и состояния mock-данных.
              Сейчас все временно хранится во фронтовом localStorage.
            </Subtitle>
          </HeroContent>

          <RefreshButton type="button" onClick={loadDashboardData}>
            <FiRefreshCw />
            Обновить
          </RefreshButton>
        </Hero>

        <StatsGrid>
          <StatCard>
            <StatIcon $variant="blue">
              <FiGlobe />
            </StatIcon>

            <StatInfo>
              <strong>{stats.publicPostsCount}</strong>
              <span>Обычных постов</span>
            </StatInfo>
          </StatCard>

          <StatCard>
            <StatIcon $variant="pink">
              <FiStar />
            </StatIcon>

            <StatInfo>
              <strong>{stats.premiumPostsCount}</strong>
              <span>Premium постов</span>
            </StatInfo>
          </StatCard>

          <StatCard>
            <StatIcon $variant="purple">
              <FiInbox />
            </StatIcon>

            <StatInfo>
              <strong>{stats.pendingRequestsCount}</strong>
              <span>Заявок на проверке</span>
            </StatInfo>
          </StatCard>

          <StatCard>
            <StatIcon $variant="green">
              <FiUsers />
            </StatIcon>

            <StatInfo>
              <strong>{stats.premiumUsersCount}</strong>
              <span>Premium пользователей</span>
            </StatInfo>
          </StatCard>
        </StatsGrid>

        <Grid>
          <MainColumn>
            <Panel>
              <PanelHeader>
                <div>
                  <Eyebrow>Заявки</Eyebrow>
                  <h2>Последние заявки</h2>
                </div>

                <PanelLink to="/admin/requests">
                  Все заявки
                  <FiArrowRight />
                </PanelLink>
              </PanelHeader>

              {latestRequests.length ? (
                  <List>
                    {latestRequests.map((request) => (
                        <RequestItem key={request.id}>
                          <MiniPreview>
                            {request.mediaType === 'IMAGE' ? (
                                request.previewUrl ? (
                                    <img src={request.previewUrl} alt={request.title} />
                                ) : (
                                    <FiImage />
                                )
                            ) : (
                                <FiVideo />
                            )}
                          </MiniPreview>

                          <ItemBody>
                            <strong>{request.title}</strong>
                            <span>
                        @{request.userNickname} •{' '}
                              {new Date(request.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                          </ItemBody>

                          <StatusBadge $status={request.status}>
                            {getStatusIcon(request.status)}
                            {getStatusText(request.status)}
                          </StatusBadge>
                        </RequestItem>
                    ))}
                  </List>
              ) : (
                  <EmptyBlock>
                    <FiInbox />
                    <h3>Заявок пока нет</h3>
                    <p>
                      Когда пользователь предложит фото или видео, заявка появится
                      здесь.
                    </p>
                  </EmptyBlock>
              )}
            </Panel>

            <Panel>
              <PanelHeader>
                <div>
                  <Eyebrow>Контент</Eyebrow>
                  <h2>Последние посты</h2>
                </div>

                <PanelLink to="/admin/posts">
                  Все посты
                  <FiArrowRight />
                </PanelLink>
              </PanelHeader>

              {latestPosts.length ? (
                  <PostList>
                    {latestPosts.map((post) => (
                        <PostItem key={post.id}>
                          <PostPreview>
                            {post.media[0]?.type === 'IMAGE' ? (
                                <img src={post.media[0].url} alt={post.title || 'Пост'} />
                            ) : (
                                <VideoPlaceholder>
                                  <FiVideo />
                                </VideoPlaceholder>
                            )}
                          </PostPreview>

                          <PostInfo>
                            <strong>{post.title || 'Без названия'}</strong>

                            <span>
                        {post.visibility === 'PREMIUM'
                            ? 'Premium'
                            : 'Обычная лента'}{' '}
                              • {new Date(post.createdAt).toLocaleDateString('ru-RU')}
                      </span>

                            <PostMeta>
                              <small>{post.likesCount} лайков</small>
                              <small>{post.commentsCount} комментариев</small>
                            </PostMeta>
                          </PostInfo>
                        </PostItem>
                    ))}
                  </PostList>
              ) : (
                  <EmptyBlock>
                    <FiFileText />
                    <h3>Постов пока нет</h3>
                    <p>
                      Создайте первый пост вручную или примите пользовательскую
                      заявку.
                    </p>
                  </EmptyBlock>
              )}
            </Panel>
          </MainColumn>

          <SideColumn>
            <QuickActions>
              <h2>Быстрые действия</h2>

              <QuickLink to="/admin/posts/create">
                <IconBox>
                  <FiPlusCircle />
                </IconBox>

                <span>
                <strong>Создать пост</strong>
                <small>Добавить фото или видео от имени админа</small>
              </span>

                <FiArrowRight />
              </QuickLink>

              <QuickLink to="/admin/requests">
                <IconBox>
                  <FiInbox />
                </IconBox>

                <span>
                <strong>Проверить заявки</strong>
                <small>Принять, отклонить или отправить в Premium</small>
              </span>

                <FiArrowRight />
              </QuickLink>

              <QuickLink to="/admin/posts">
                <IconBox>
                  <FiFileText />
                </IconBox>

                <span>
                <strong>Управлять постами</strong>
                <small>Просмотр опубликованных материалов</small>
              </span>

                <FiArrowRight />
              </QuickLink>
            </QuickActions>

            <Panel>
              <PanelHeader>
                <div>
                  <Eyebrow>Статус заявок</Eyebrow>
                  <h2>Модерация</h2>
                </div>

                <SmallIcon>
                  <FiBarChart2 />
                </SmallIcon>
              </PanelHeader>

              <ModerationList>
                <ModerationItem>
                  <FiClock />
                  <span>На проверке</span>
                  <strong>{stats.pendingRequestsCount}</strong>
                </ModerationItem>

                <ModerationItem>
                  <FiCheckCircle />
                  <span>Опубликовано</span>
                  <strong>{stats.approvedRequestsCount}</strong>
                </ModerationItem>

                <ModerationItem>
                  <FiXCircle />
                  <span>Отклонено</span>
                  <strong>{stats.rejectedRequestsCount}</strong>
                </ModerationItem>
              </ModerationList>
            </Panel>
          </SideColumn>
        </Grid>
      </Page>
  );
}

function getSavedPosts(): Post[] {
  const savedPosts = localStorage.getItem(MOCK_POSTS_KEY);

  if (!savedPosts) {
    return [];
  }

  try {
    return JSON.parse(savedPosts) as Post[];
  } catch {
    localStorage.removeItem(MOCK_POSTS_KEY);
    return [];
  }
}

function getSavedRequests(): MockContentRequest[] {
  const savedRequests = localStorage.getItem(MOCK_CONTENT_REQUESTS_KEY);

  if (!savedRequests) {
    return [];
  }

  try {
    return JSON.parse(savedRequests) as MockContentRequest[];
  } catch {
    localStorage.removeItem(MOCK_CONTENT_REQUESTS_KEY);
    return [];
  }
}

function getSavedUsers(): MockUser[] {
  const savedUsers = localStorage.getItem(MOCK_USERS_KEY);

  if (!savedUsers) {
    return [];
  }

  try {
    return JSON.parse(savedUsers) as MockUser[];
  } catch {
    localStorage.removeItem(MOCK_USERS_KEY);
    return [];
  }
}

function getStatusText(status: RequestStatus) {
  if (status === 'PENDING') {
    return 'На проверке';
  }

  if (status === 'APPROVED') {
    return 'Принята';
  }

  return 'Отклонена';
}

function getStatusIcon(status: RequestStatus) {
  if (status === 'PENDING') {
    return <FiClock />;
  }

  if (status === 'APPROVED') {
    return <FiCheckCircle />;
  }

  return <FiXCircle />;
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
    radial-gradient(circle at bottom right, rgba(37, 99, 235, 0.14), transparent 34%),
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

const RefreshButton = styled.button`
  flex: 0 0 auto;
  min-height: 46px;
  padding: 0 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(255, 255, 255, 0.06);
  color: ${({ theme }) => theme.colors.text};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  font-weight: 900;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(139, 92, 246, 0.46);
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.article`
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: rgba(21, 25, 43, 0.84);
  display: flex;
  align-items: center;
  gap: 14px;
`;

const StatIcon = styled.div<{
  $variant: 'blue' | 'pink' | 'purple' | 'green';
}>`
  flex: 0 0 auto;
  width: 52px;
  height: 52px;
  border-radius: 19px;
  color: white;
  display: grid;
  place-items: center;
  font-size: 24px;
  background: ${({ $variant }) => {
  if ($variant === 'blue') {
    return 'linear-gradient(135deg, #2563eb, #7c3aed)';
  }

  if ($variant === 'pink') {
    return 'linear-gradient(135deg, #7c3aed, #ec4899)';
  }

  if ($variant === 'green') {
    return 'linear-gradient(135deg, #16a34a, #2563eb)';
  }

  return 'linear-gradient(135deg, #7c3aed, #ef4444)';
}};
`;

const StatInfo = styled.div`
  min-width: 0;
  display: grid;
  gap: 3px;

  strong {
    font-size: 30px;
    line-height: 1;
    letter-spacing: -0.06em;
  }

  span {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 13px;
    font-weight: 800;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 18px;

  @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
  }
`;

const MainColumn = styled.div`
  min-width: 0;
  display: grid;
  gap: 18px;
`;

const SideColumn = styled.aside`
  min-width: 0;
  display: grid;
  align-content: start;
  gap: 18px;
`;

const Panel = styled.section`
  padding: 18px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: rgba(21, 25, 43, 0.84);
`;

const PanelHeader = styled.div`
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;

  h2 {
    margin: 4px 0 0;
    font-size: 25px;
    letter-spacing: -0.055em;
  }
`;

const PanelLink = styled(Link)`
  flex: 0 0 auto;
  min-height: 38px;
  padding: 0 13px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(255, 255, 255, 0.045);
  color: ${({ theme }) => theme.colors.text};
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 900;

  &:hover {
    background: rgba(255, 255, 255, 0.085);
    border-color: rgba(139, 92, 246, 0.45);
  }
`;

const List = styled.div`
  display: grid;
  gap: 10px;
`;

const RequestItem = styled.article`
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.035);
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 52px minmax(0, 1fr);
  }
`;

const MiniPreview = styled.div`
  width: 58px;
  height: 58px;
  overflow: hidden;
  border-radius: 18px;
  background:
    radial-gradient(circle at top left, rgba(124, 58, 237, 0.34), transparent 34%),
    #080a12;
  color: ${({ theme }) => theme.colors.primaryHover};
  display: grid;
  place-items: center;
  font-size: 24px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 52px;
    height: 52px;
  }
`;

const ItemBody = styled.div`
  min-width: 0;
  display: grid;
  gap: 4px;

  strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    overflow: hidden;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 13px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const StatusBadge = styled.div<{ $status: RequestStatus }>`
  min-height: 34px;
  padding: 0 11px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $status }) => {
  if ($status === 'APPROVED') {
    return 'rgba(34, 197, 94, 0.12)';
  }

  if ($status === 'REJECTED') {
    return 'rgba(239, 68, 68, 0.12)';
  }

  return 'rgba(245, 158, 11, 0.12)';
}};
  color: ${({ $status }) => {
  if ($status === 'APPROVED') {
    return '#86efac';
  }

  if ($status === 'REJECTED') {
    return '#fecaca';
  }

  return '#fde68a';
}};
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 900;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-column: 1 / -1;
    justify-content: center;
  }
`;

const PostList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const PostItem = styled.article`
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.035);
`;

const PostPreview = styled.div`
  height: 170px;
  background: #05060d;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const VideoPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at top left, rgba(124, 58, 237, 0.32), transparent 34%),
    radial-gradient(circle at bottom right, rgba(239, 68, 68, 0.18), transparent 34%),
    #080a12;
  color: ${({ theme }) => theme.colors.primaryHover};
  display: grid;
  place-items: center;
  font-size: 42px;
`;

const PostInfo = styled.div`
  padding: 13px;
  display: grid;
  gap: 6px;

  strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 13px;
    font-weight: 700;
  }
`;

const PostMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;

  small {
    padding: 5px 8px;
    border-radius: ${({ theme }) => theme.radius.full};
    background: rgba(255, 255, 255, 0.055);
    color: ${({ theme }) => theme.colors.textMuted};
    font-weight: 800;
  }
`;

const EmptyBlock = styled.div`
  min-height: 230px;
  padding: 28px 18px;
  border: 1px dashed rgba(139, 92, 246, 0.32);
  border-radius: 22px;
  background: rgba(124, 58, 237, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;

  > svg {
    margin-bottom: 12px;
    color: ${({ theme }) => theme.colors.primaryHover};
    font-size: 38px;
  }

  h3 {
    margin: 0 0 8px;
    font-size: 22px;
    letter-spacing: -0.05em;
  }

  p {
    max-width: 420px;
    margin: 0;
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.55;
  }
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
    font-size: 25px;
    letter-spacing: -0.055em;
  }
`;

const QuickLink = styled(Link)`
  padding: 13px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  color: ${({ theme }) => theme.colors.text};
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;

  > svg {
    color: ${({ theme }) => theme.colors.textMuted};
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
    border-color: rgba(139, 92, 246, 0.45);
    background: rgba(255, 255, 255, 0.075);
  }
`;

const IconBox = styled.div`
  width: 46px;
  height: 46px;
  border-radius: 17px;
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  color: white;
  display: grid;
  place-items: center;
  font-size: 21px;
`;

const SmallIcon = styled.div`
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  border-radius: 16px;
  background: rgba(124, 58, 237, 0.14);
  color: ${({ theme }) => theme.colors.primaryHover};
  display: grid;
  place-items: center;
  font-size: 20px;
`;

const ModerationList = styled.div`
  display: grid;
  gap: 10px;
`;

const ModerationItem = styled.div`
  min-height: 48px;
  padding: 0 13px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.035);
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;

  svg {
    color: ${({ theme }) => theme.colors.primaryHover};
    font-size: 19px;
  }

  span {
    color: ${({ theme }) => theme.colors.textMuted};
    font-weight: 800;
  }

  strong {
    font-size: 20px;
  }
`;