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
  FiStar,
  FiVideo,
  FiXCircle,
} from 'react-icons/fi';

import { getMediaUrl } from '../../shared/lib/getMediaUrl';
import {
  useGetAdminPostsQuery,
  useGetAdminPostsStatsQuery,
} from '../../entities/admin/api/adminPostApi';
import {
  type AdminContentRequest,
  type RequestStatus,
  useGetAdminContentRequestsQuery,
  useGetAdminContentRequestsStatsQuery,
} from '../../entities/admin/api/adminContentRequestApi';

export function AdminDashboardPage() {
  const {
    data: postsData,
    isLoading: isPostsLoading,
    isError: isPostsError,
  } = useGetAdminPostsQuery(
      {
        limit: 4,
        sort: 'RECENT',
      },
      {
        refetchOnMountOrArgChange: true,
      }
  );

  const {
    data: postsStats,
    isLoading: isPostsStatsLoading,
  } = useGetAdminPostsStatsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const {
    data: requestsData,
    isLoading: isRequestsLoading,
    isError: isRequestsError,
  } = useGetAdminContentRequestsQuery(
      {
        limit: 4,
        status: 'ALL',
        mediaType: 'ALL',
      },
      {
        refetchOnMountOrArgChange: true,
      }
  );

  const {
    data: requestsStats,
    isLoading: isRequestsStatsLoading,
  } = useGetAdminContentRequestsStatsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const latestPosts = postsData?.items || postsData?.posts || [];
  const latestRequests = requestsData?.items || requestsData?.requests || [];


  const isStatsLoading = isPostsStatsLoading || isRequestsStatsLoading;

  return (
      <Page>
        <StatsGrid>
          <StatCard>
            <StatIcon $variant="blue">
              <FiGlobe />
            </StatIcon>

            <StatInfo>
              <strong>
                {isStatsLoading ? '...' : postsStats?.publicPosts || 0}
              </strong>
              <span>Обычных постов</span>
            </StatInfo>
          </StatCard>

          <StatCard>
            <StatIcon $variant="pink">
              <FiStar />
            </StatIcon>

            <StatInfo>
              <strong>
                {isStatsLoading ? '...' : postsStats?.premiumPosts || 0}
              </strong>
              <span>Premium постов</span>
            </StatInfo>
          </StatCard>

          <StatCard>
            <StatIcon $variant="green">
              <FiInbox />
            </StatIcon>

            <StatInfo>
              <strong>
                {isStatsLoading ? '...' : requestsStats?.pending || 0}
              </strong>
              <span>Заявок на проверке</span>
            </StatInfo>
          </StatCard>

          <StatCard>
            <StatIcon $variant="purple">
              <FiBarChart2 />
            </StatIcon>

            <StatInfo>
              <strong>
                {isStatsLoading ? '...' : requestsStats?.total || 0}
              </strong>
              <span>Всего заявок</span>
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

              {isRequestsLoading ? (
                  <EmptyBlock>
                    <FiClock />
                    <h3>Загружаем заявки</h3>
                    <p>Сейчас покажем последние материалы пользователей.</p>
                  </EmptyBlock>
              ) : isRequestsError ? (
                  <EmptyBlock>
                    <FiXCircle />
                    <h3>Не удалось загрузить заявки</h3>
                    <p>Проверьте backend или повторите загрузку.</p>
                  </EmptyBlock>
              ) : latestRequests.length ? (
                  <List>
                    {latestRequests.map((request) => (
                        <RequestItem key={request.id}>
                          <MiniPreview>
                            {request.mediaType === 'IMAGE' ? (
                                getRequestPreviewUrl(request) ? (
                                    <img
                                        src={getRequestPreviewUrl(request) || ''}
                                        alt={request.title}
                                    />
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
                              {new Date(request.createdAt).toLocaleDateString(
                                  'ru-RU'
                              )}
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

              {isPostsLoading ? (
                  <EmptyBlock>
                    <FiClock />
                    <h3>Загружаем посты</h3>
                    <p>Сейчас покажем последние опубликованные материалы.</p>
                  </EmptyBlock>
              ) : isPostsError ? (
                  <EmptyBlock>
                    <FiXCircle />
                    <h3>Не удалось загрузить посты</h3>
                    <p>Проверьте backend или повторите загрузку.</p>
                  </EmptyBlock>
              ) : latestPosts.length ? (
                  <PostList>
                    {latestPosts.map((post) => (
                        <PostItem key={post.id}>
                          <PostPreview>
                            {post.media[0]?.type === 'IMAGE' &&
                            getMediaUrl(post.media[0]?.url) ? (
                                <img
                                    src={getMediaUrl(post.media[0]?.url) || ''}
                                    alt={post.title || 'Пост'}
                                />
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
                <small>Добавить фото или видео от имени администратора</small>
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
              </PanelHeader>

              <ModerationList>
                <ModerationItem>
                  <FiClock />
                  <span>На проверке</span>
                  <strong>{requestsStats?.pending || 0}</strong>
                </ModerationItem>

                <ModerationItem>
                  <FiCheckCircle />
                  <span>Опубликовано</span>
                  <strong>{requestsStats?.approved || 0}</strong>
                </ModerationItem>

                <ModerationItem>
                  <FiXCircle />
                  <span>Отклонено</span>
                  <strong>{requestsStats?.rejected || 0}</strong>
                </ModerationItem>
              </ModerationList>
            </Panel>
          </SideColumn>
        </Grid>
      </Page>
  );
}

function getRequestPreviewUrl(request: AdminContentRequest) {
  return getMediaUrl(request.previewUrl || request.fileUrl || null);
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

const Eyebrow = styled.div`
  margin-bottom: 8px;
  color: ${({ theme }) => theme.colors.primaryHover};
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
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