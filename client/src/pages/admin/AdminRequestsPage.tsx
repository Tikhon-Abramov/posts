import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import {
    FiAlertCircle,
    FiCheckCircle,
    FiClock,
    FiGlobe,
    FiImage,
    FiInbox,
    FiRefreshCw,
    FiStar,
    FiTrash2,
    FiUser,
    FiVideo,
    FiXCircle,
} from 'react-icons/fi';

import type { Post, PostVisibility } from '../../entities/post/model/postTypes';
import {
    createMockImageUrl,
    createMockNotification,
    formatMockFileSize,
    getMockContentRequests,
    getMockPosts,
    getMockUsers,
    saveMockContentRequests,
    saveMockPosts,
    type MockContentRequest,
    type RequestStatus,
} from '../../shared/lib/mockStorage';

type RequestFilter = 'ALL' | RequestStatus;

export function AdminRequestsPage() {
    const [requests, setRequests] = useState<MockContentRequest[]>([]);
    const [filter, setFilter] = useState<RequestFilter>('ALL');

    const filteredRequests = useMemo(() => {
        if (filter === 'ALL') {
            return requests;
        }

        return requests.filter((request) => request.status === filter);
    }, [filter, requests]);

    const pendingCount = requests.filter(
        (request) => request.status === 'PENDING'
    ).length;

    const approvedCount = requests.filter(
        (request) => request.status === 'APPROVED'
    ).length;

    const rejectedCount = requests.filter(
        (request) => request.status === 'REJECTED'
    ).length;

    const loadRequests = () => {
        setRequests(getMockContentRequests());
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const updateRequests = (nextRequests: MockContentRequest[]) => {
        setRequests(nextRequests);
        saveMockContentRequests(nextRequests);
    };

    const handleApprove = (requestId: number, visibility: PostVisibility) => {
        const request = requests.find((item) => item.id === requestId);

        if (!request || request.status !== 'PENDING') {
            return;
        }

        const author = getRequestAuthor(request);
        const newPost = createPostFromRequest(request, visibility, author);
        const currentPosts = getMockPosts();

        saveMockPosts([newPost, ...currentPosts]);

        createMockNotification({
            userId: request.userId,
            type: 'REQUEST_APPROVED',
            title: 'Публикация одобрена',
            text:
                visibility === 'PREMIUM'
                    ? `Ваша заявка «${request.title}» опубликована в Premium-ленте.`
                    : `Ваша заявка «${request.title}» опубликована в обычной ленте.`,
            requestId: request.id,
            postId: newPost.id,
        });

        const nextRequests = requests.map((item) =>
            item.id === requestId
                ? {
                    ...item,
                    status: 'APPROVED',
                    suggestedVisibility: visibility,
                    reviewedAt: new Date().toISOString(),
                    publishedPostId: newPost.id,
                }
                : item
        );

        updateRequests(nextRequests);
    };

    const handleReject = (requestId: number) => {
        const request = requests.find((item) => item.id === requestId);

        if (!request || request.status !== 'PENDING') {
            return;
        }

        createMockNotification({
            userId: request.userId,
            type: 'REQUEST_REJECTED',
            title: 'Публикация отклонена',
            text: `Ваша заявка «${request.title}» была отклонена администратором.`,
            requestId: request.id,
            postId: null,
        });

        const nextRequests = requests.map((item) =>
            item.id === requestId
                ? {
                    ...item,
                    status: 'REJECTED',
                    reviewedAt: new Date().toISOString(),
                }
                : item
        );

        updateRequests(nextRequests);
    };

    const handleDelete = (requestId: number) => {
        const nextRequests = requests.filter((item) => item.id !== requestId);
        updateRequests(nextRequests);
    };

    return (
        <Page>
            <Hero>
                <HeroContent>
                    <Eyebrow>Admin</Eyebrow>

                    <Title>Заявки пользователей</Title>

                    <Subtitle>
                        Здесь админ проверяет предложенные фото и видео. Если заявка
                        одобрена, пост публикуется от имени пользователя, который отправил
                        материал.
                    </Subtitle>
                </HeroContent>

                <HeroIcon>
                    <FiInbox />
                </HeroIcon>
            </Hero>

            <StatsGrid>
                <StatCard>
                    <FiClock />
                    <div>
                        <strong>{pendingCount}</strong>
                        <span>На проверке</span>
                    </div>
                </StatCard>

                <StatCard>
                    <FiCheckCircle />
                    <div>
                        <strong>{approvedCount}</strong>
                        <span>Опубликовано</span>
                    </div>
                </StatCard>

                <StatCard>
                    <FiXCircle />
                    <div>
                        <strong>{rejectedCount}</strong>
                        <span>Отклонено</span>
                    </div>
                </StatCard>
            </StatsGrid>

            <Toolbar>
                <FilterGroup>
                    <FilterButton
                        type="button"
                        $active={filter === 'ALL'}
                        onClick={() => setFilter('ALL')}
                    >
                        Все
                    </FilterButton>

                    <FilterButton
                        type="button"
                        $active={filter === 'PENDING'}
                        onClick={() => setFilter('PENDING')}
                    >
                        На проверке
                    </FilterButton>

                    <FilterButton
                        type="button"
                        $active={filter === 'APPROVED'}
                        onClick={() => setFilter('APPROVED')}
                    >
                        Принятые
                    </FilterButton>

                    <FilterButton
                        type="button"
                        $active={filter === 'REJECTED'}
                        onClick={() => setFilter('REJECTED')}
                    >
                        Отклоненные
                    </FilterButton>
                </FilterGroup>

                <RefreshButton type="button" onClick={loadRequests}>
                    <FiRefreshCw />
                    Обновить
                </RefreshButton>
            </Toolbar>

            {filteredRequests.length ? (
                <RequestsGrid>
                    {filteredRequests.map((request) => {
                        const author = getRequestAuthor(request);

                        return (
                            <RequestCard key={request.id}>
                                <Preview>
                                    {request.mediaType === 'IMAGE' ? (
                                        request.previewUrl ? (
                                            <img src={request.previewUrl} alt={request.title} />
                                        ) : (
                                            <Placeholder>
                                                <FiImage />
                                                <span>Изображение без preview</span>
                                            </Placeholder>
                                        )
                                    ) : (
                                        <Placeholder>
                                            <FiVideo />
                                            <span>Видео: {request.fileName}</span>
                                        </Placeholder>
                                    )}

                                    <StatusBadge $status={request.status}>
                                        {getStatusText(request.status)}
                                    </StatusBadge>
                                </Preview>

                                <CardBody>
                                    <CardHeader>
                                        <AuthorBlock>
                                            <AuthorAvatar>
                                                {author.avatarUrl ? (
                                                    <img src={author.avatarUrl} alt={author.nickname} />
                                                ) : (
                                                    <FiUser />
                                                )}
                                            </AuthorAvatar>

                                            <div>
                                                <RequestTitle>{request.title}</RequestTitle>

                                                <Meta>
                                                    @{author.nickname} •{' '}
                                                    {new Date(request.createdAt).toLocaleString('ru-RU')}
                                                </Meta>
                                            </div>
                                        </AuthorBlock>

                                        <MediaBadge>
                                            {request.mediaType === 'IMAGE' ? <FiImage /> : <FiVideo />}
                                            {request.mediaType === 'IMAGE' ? 'Фото' : 'Видео'}
                                        </MediaBadge>
                                    </CardHeader>

                                    <Description>{request.description}</Description>

                                    <InfoList>
                                        <InfoItem>
                                            <strong>Автор публикации:</strong>
                                            <span>@{author.nickname}</span>
                                        </InfoItem>

                                        <InfoItem>
                                            <strong>Предложено для:</strong>
                                            <span>
                        {request.suggestedVisibility === 'PREMIUM'
                            ? 'Premium'
                            : 'Обычной ленты'}
                      </span>
                                        </InfoItem>

                                        <InfoItem>
                                            <strong>Файл:</strong>
                                            <span>{request.fileName}</span>
                                        </InfoItem>

                                        <InfoItem>
                                            <strong>Размер:</strong>
                                            <span>{formatMockFileSize(request.fileSize)}</span>
                                        </InfoItem>

                                        {request.reviewedAt && (
                                            <InfoItem>
                                                <strong>Проверено:</strong>
                                                <span>
                          {new Date(request.reviewedAt).toLocaleString('ru-RU')}
                        </span>
                                            </InfoItem>
                                        )}

                                        {request.publishedPostId && (
                                            <InfoItem>
                                                <strong>ID поста:</strong>
                                                <span>{request.publishedPostId}</span>
                                            </InfoItem>
                                        )}
                                    </InfoList>

                                    {request.status === 'PENDING' ? (
                                        <Actions>
                                            <ApproveButton
                                                type="button"
                                                onClick={() => handleApprove(request.id, 'PUBLIC')}
                                            >
                                                <FiGlobe />
                                                В обычную ленту
                                            </ApproveButton>

                                            <PremiumButton
                                                type="button"
                                                onClick={() => handleApprove(request.id, 'PREMIUM')}
                                            >
                                                <FiStar />
                                                В Premium
                                            </PremiumButton>

                                            <RejectButton
                                                type="button"
                                                onClick={() => handleReject(request.id)}
                                            >
                                                <FiXCircle />
                                                Отклонить
                                            </RejectButton>
                                        </Actions>
                                    ) : (
                                        <Actions>
                                            <DeleteButton
                                                type="button"
                                                onClick={() => handleDelete(request.id)}
                                            >
                                                <FiTrash2 />
                                                Удалить из списка
                                            </DeleteButton>
                                        </Actions>
                                    )}
                                </CardBody>
                            </RequestCard>
                        );
                    })}
                </RequestsGrid>
            ) : (
                <EmptyCard>
                    <FiAlertCircle />

                    <h2>Заявок пока нет</h2>

                    <p>
                        Когда пользователь отправит фото или видео через страницу заявки,
                        материал появится здесь.
                    </p>
                </EmptyCard>
            )}
        </Page>
    );
}

function getRequestAuthor(request: MockContentRequest) {
    const user = getMockUsers().find((item) => item.id === request.userId);

    return {
        id: request.userId,
        nickname: user?.nickname || request.userNickname,
        avatarUrl: user?.avatarUrl || null,
    };
}

function createPostFromRequest(
    request: MockContentRequest,
    visibility: PostVisibility,
    author: {
        id: number;
        nickname: string;
        avatarUrl?: string | null;
    }
): Post {
    const postId = Date.now();

    return {
        id: postId,
        title: request.title,
        description: request.description,
        visibility,
        media: [
            {
                id: postId,
                type: request.mediaType,
                url:
                    request.mediaType === 'IMAGE'
                        ? request.previewUrl || createMockImageUrl(request.title)
                        : 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
            },
        ],
        author: {
            id: author.id,
            nickname: author.nickname,
            avatarUrl: author.avatarUrl || null,
        },
        likesCount: 0,
        dislikesCount: 0,
        commentsCount: 0,
        isLikedByMe: false,
        isDislikedByMe: false,
        isSavedByMe: false,
        createdAt: new Date().toISOString(),
    };
}

function getStatusText(status: RequestStatus) {
    if (status === 'PENDING') {
        return 'На проверке';
    }

    if (status === 'APPROVED') {
        return 'Опубликовано';
    }

    return 'Отклонено';
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
    radial-gradient(circle at bottom right, rgba(239, 68, 68, 0.16), transparent 34%),
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

const HeroIcon = styled.div`
  flex: 0 0 auto;
  width: 76px;
  height: 76px;
  border-radius: 28px;
  background: linear-gradient(135deg, #7c3aed, #ef4444);
  color: white;
  display: grid;
  place-items: center;
  font-size: 36px;
  box-shadow: 0 22px 50px rgba(124, 58, 237, 0.28);
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: rgba(21, 25, 43, 0.82);
  display: flex;
  align-items: center;
  gap: 14px;

  > svg {
    width: 46px;
    height: 46px;
    padding: 12px;
    border-radius: 17px;
    background: rgba(124, 58, 237, 0.14);
    color: ${({ theme }) => theme.colors.primaryHover};
  }

  div {
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const FilterButton = styled.button<{ $active?: boolean }>`
  min-height: 40px;
  padding: 0 13px;
  border: 1px solid
    ${({ theme, $active }) =>
    $active ? 'rgba(139, 92, 246, 0.7)' : theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $active }) =>
    $active
        ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.75), rgba(37, 99, 235, 0.68))'
        : 'rgba(255, 255, 255, 0.04)'};
  color: ${({ theme }) => theme.colors.text};
  font-weight: 900;

  &:hover {
    background: ${({ $active }) =>
    $active
        ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.75), rgba(37, 99, 235, 0.68))'
        : 'rgba(255,255,255,0.075)'};
  }
`;

const RefreshButton = styled.button`
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(255, 255, 255, 0.05);
  color: ${({ theme }) => theme.colors.text};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 900;

  &:hover {
    background: rgba(255, 255, 255, 0.09);
  }
`;

const RequestsGrid = styled.div`
  display: grid;
  gap: 18px;
`;

const RequestCard = styled.article`
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: rgba(21, 25, 43, 0.86);
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);

  @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
  }
`;

const Preview = styled.div`
  position: relative;
  min-height: 260px;
  background: #05060d;

  img,
  video {
    width: 100%;
    height: 100%;
    min-height: 260px;
    object-fit: cover;
  }
`;

const Placeholder = styled.div`
  min-height: 260px;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(124, 58, 237, 0.24), transparent 34%),
    radial-gradient(circle at bottom right, rgba(37, 99, 235, 0.16), transparent 34%),
    #080a12;
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;

  svg {
    color: ${({ theme }) => theme.colors.primaryHover};
    font-size: 46px;
  }

  span {
    max-width: 220px;
    line-height: 1.45;
    font-weight: 800;
  }
`;

const StatusBadge = styled.div<{ $status: RequestStatus }>`
  position: absolute;
  left: 14px;
  top: 14px;
  min-height: 34px;
  padding: 0 12px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $status }) => {
    if ($status === 'APPROVED') {
        return 'rgba(34, 197, 94, 0.86)';
    }

    if ($status === 'REJECTED') {
        return 'rgba(239, 68, 68, 0.86)';
    }

    return 'rgba(245, 158, 11, 0.9)';
}};
  color: white;
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  font-weight: 900;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.28);
`;

const CardBody = styled.div`
  min-width: 0;
  padding: 18px;
  display: grid;
  align-content: start;
  gap: 14px;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`;

const AuthorBlock = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 11px;
`;

const AuthorAvatar = styled.div`
  flex: 0 0 auto;
  width: 46px;
  height: 46px;
  overflow: hidden;
  border-radius: 17px;
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  color: white;
  display: grid;
  place-items: center;
  font-size: 21px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const RequestTitle = styled.h2`
  margin: 0;
  font-size: 25px;
  letter-spacing: -0.055em;
`;

const Meta = styled.div`
  margin-top: 5px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 13px;
  font-weight: 700;
`;

const MediaBadge = styled.div`
  flex: 0 0 auto;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid rgba(124, 58, 237, 0.32);
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(124, 58, 237, 0.1);
  color: #ddd6fe;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 900;
`;

const Description = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.6;
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
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;

  strong {
    color: ${({ theme }) => theme.colors.text};
    font-size: 13px;
  }

  span {
    min-width: 0;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 13px;
    text-align: right;
    word-break: break-word;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    gap: 4px;

    span {
      text-align: left;
    }
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
`;

const ActionButton = styled.button`
  min-height: 42px;
  padding: 0 13px;
  border-radius: ${({ theme }) => theme.radius.full};
  color: white;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 900;

  &:hover {
    filter: brightness(1.08);
  }
`;

const ApproveButton = styled(ActionButton)`
  border: 1px solid rgba(37, 99, 235, 0.36);
  background: linear-gradient(135deg, #2563eb, #7c3aed);
`;

const PremiumButton = styled(ActionButton)`
  border: 1px solid rgba(236, 72, 153, 0.36);
  background: linear-gradient(135deg, #7c3aed, #ec4899);
`;

const RejectButton = styled(ActionButton)`
  border: 1px solid rgba(239, 68, 68, 0.34);
  background: rgba(239, 68, 68, 0.18);
  color: #fecaca;
`;

const DeleteButton = styled(ActionButton)`
  border: 1px solid rgba(239, 68, 68, 0.28);
  background: rgba(239, 68, 68, 0.12);
  color: #fecaca;
`;

const EmptyCard = styled.section`
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

  svg {
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
    max-width: 500px;
    margin: 0;
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.6;
  }
`;