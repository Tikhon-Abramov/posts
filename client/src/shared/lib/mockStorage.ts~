import type { AuthUser } from '../../entities/auth/model/authTypes';
import type { Post, MediaType, PostVisibility } from '../../entities/post/model/postTypes';
import type { PostComment } from '../../entities/post/model/commentTypes';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type NotificationType =
    | 'REQUEST_APPROVED'
    | 'REQUEST_REJECTED'
    | 'NEW_LIKE'
    | 'NEW_COMMENT';

export type MockReaction = 'like' | 'dislike' | null;

export interface MockUser extends AuthUser {
    password: string;
}

export interface MockPostInteraction {
    reaction: MockReaction;
    saved: boolean;
}

export type MockPostInteractions = Record<
    string,
    Record<string, MockPostInteraction>
>;

export interface MockContentRequest {
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

export interface MockNotification {
    id: number;
    userId: number;
    type: NotificationType;
    title: string;
    text: string;
    isRead: boolean;
    postId?: number | null;
    requestId?: number | null;
    createdAt: string;
}

export const MOCK_STORAGE_KEYS = {
    users: 'pulsefeed_mock_users',
    posts: 'pulsefeed_mock_posts',
    interactions: 'pulsefeed_mock_post_interactions',
    comments: 'pulsefeed_mock_comments',
    contentRequests: 'pulsefeed_mock_content_requests',
    notifications: 'pulsefeed_mock_notifications',
    accessToken: 'accessToken',
} as const;

export const DEFAULT_MOCK_USERS: MockUser[] = [
    {
        id: 1,
        nickname: 'admin',
        email: 'admin@pulsefeed.test',
        password: 'admin123',
        avatarUrl: null,
        role: 'ADMIN',
        hasPremium: true,
    },
    {
        id: 2,
        nickname: 'user',
        email: 'user@pulsefeed.test',
        password: 'user123',
        avatarUrl: null,
        role: 'USER',
        hasPremium: false,
    },
    {
        id: 3,
        nickname: 'premium_user',
        email: 'premium@pulsefeed.test',
        password: 'premium123',
        avatarUrl: null,
        role: 'USER',
        hasPremium: true,
    },
];

export function readMockStorage<T>(key: string, fallback: T): T {
    const value = localStorage.getItem(key);

    if (!value) {
        return fallback;
    }

    try {
        return JSON.parse(value) as T;
    } catch {
        localStorage.removeItem(key);
        return fallback;
    }
}

export function writeMockStorage<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
}

export function removeMockStorage(key: string) {
    localStorage.removeItem(key);
}

export function clearMockStorage() {
    Object.values(MOCK_STORAGE_KEYS).forEach((key) => {
        if (key !== MOCK_STORAGE_KEYS.accessToken) {
            localStorage.removeItem(key);
        }
    });
}

export function createMockError(status: number, message: string) {
    return {
        status,
        data: {
            message,
        },
    };
}

export function delay(ms = 300) {
    return new Promise((resolve) => {
        window.setTimeout(resolve, ms);
    });
}

export function createMockAccessToken(userId: number) {
    return `mock-access-token-${userId}`;
}

export function getUserIdFromMockToken(token: string | null) {
    if (!token?.startsWith('mock-access-token-')) {
        return null;
    }

    const rawId = token.replace('mock-access-token-', '');
    const userId = Number(rawId);

    return Number.isNaN(userId) ? null : userId;
}

export function getCurrentMockUserId() {
    const token = localStorage.getItem(MOCK_STORAGE_KEYS.accessToken);
    return getUserIdFromMockToken(token);
}

export function toPublicUser(user: MockUser): AuthUser {
    return {
        id: user.id,
        nickname: user.nickname,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
        hasPremium: user.hasPremium,
    };
}

export function getMockUsers() {
    const users = readMockStorage<MockUser[]>(
        MOCK_STORAGE_KEYS.users,
        DEFAULT_MOCK_USERS
    );

    if (!localStorage.getItem(MOCK_STORAGE_KEYS.users)) {
        saveMockUsers(users);
    }

    return users;
}

export function saveMockUsers(users: MockUser[]) {
    writeMockStorage(MOCK_STORAGE_KEYS.users, users);
}

export function getCurrentMockUser() {
    const userId = getCurrentMockUserId();

    if (!userId) {
        return null;
    }

    return getMockUsers().find((user) => user.id === userId) || null;
}

export function requireCurrentMockUser() {
    const user = getCurrentMockUser();

    if (!user) {
        return {
            user: null,
            error: createMockError(401, 'Нужно войти в аккаунт.'),
        };
    }

    return {
        user,
        error: null,
    };
}

export function getMockPosts() {
    return readMockStorage<Post[]>(MOCK_STORAGE_KEYS.posts, []);
}

export function saveMockPosts(posts: Post[]) {
    writeMockStorage(MOCK_STORAGE_KEYS.posts, posts);
}

export function getMockComments() {
    return readMockStorage<PostComment[]>(MOCK_STORAGE_KEYS.comments, []);
}

export function saveMockComments(comments: PostComment[]) {
    writeMockStorage(MOCK_STORAGE_KEYS.comments, comments);
}

export function getMockContentRequests() {
    return readMockStorage<MockContentRequest[]>(
        MOCK_STORAGE_KEYS.contentRequests,
        []
    );
}

export function saveMockContentRequests(requests: MockContentRequest[]) {
    writeMockStorage(MOCK_STORAGE_KEYS.contentRequests, requests);
}

export function getMockNotifications() {
    return readMockStorage<MockNotification[]>(
        MOCK_STORAGE_KEYS.notifications,
        []
    );
}

export function saveMockNotifications(notifications: MockNotification[]) {
    writeMockStorage(MOCK_STORAGE_KEYS.notifications, notifications);
}

export function createMockNotification({
                                           userId,
                                           type,
                                           title,
                                           text,
                                           postId = null,
                                           requestId = null,
                                       }: {
    userId: number;
    type: NotificationType;
    title: string;
    text: string;
    postId?: number | null;
    requestId?: number | null;
}) {
    const notifications = getMockNotifications();

    const newNotification: MockNotification = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        userId,
        type,
        title,
        text,
        isRead: false,
        postId,
        requestId,
        createdAt: new Date().toISOString(),
    };

    saveMockNotifications([newNotification, ...notifications]);

    return newNotification;
}

export function markMockNotificationAsRead(notificationId: number) {
    const notifications = getMockNotifications();

    const updatedNotifications = notifications.map((notification) =>
        notification.id === notificationId
            ? {
                ...notification,
                isRead: true,
            }
            : notification
    );

    saveMockNotifications(updatedNotifications);

    return updatedNotifications;
}

export function markAllMockNotificationsAsRead(userId: number) {
    const notifications = getMockNotifications();

    const updatedNotifications = notifications.map((notification) =>
        notification.userId === userId
            ? {
                ...notification,
                isRead: true,
            }
            : notification
    );

    saveMockNotifications(updatedNotifications);

    return updatedNotifications;
}

export function deleteMockNotification(notificationId: number) {
    const notifications = getMockNotifications();

    const updatedNotifications = notifications.filter(
        (notification) => notification.id !== notificationId
    );

    saveMockNotifications(updatedNotifications);

    return updatedNotifications;
}

export function deleteMockUserNotifications(userId: number) {
    const notifications = getMockNotifications();

    const updatedNotifications = notifications.filter(
        (notification) => notification.userId !== userId
    );

    saveMockNotifications(updatedNotifications);

    return updatedNotifications;
}

export function getMockInteractions() {
    return readMockStorage<MockPostInteractions>(
        MOCK_STORAGE_KEYS.interactions,
        {}
    );
}

export function saveMockInteractions(interactions: MockPostInteractions) {
    writeMockStorage(MOCK_STORAGE_KEYS.interactions, interactions);
}

export function getMockPostInteraction(userId: number, postId: number) {
    const interactions = getMockInteractions();

    return (
        interactions[String(userId)]?.[String(postId)] || {
            reaction: null,
            saved: false,
        }
    );
}

export function setMockPostInteraction({
                                           userId,
                                           postId,
                                           interaction,
                                       }: {
    userId: number;
    postId: number;
    interaction: MockPostInteraction;
}) {
    const interactions = getMockInteractions();
    const userKey = String(userId);
    const postKey = String(postId);

    const updatedInteractions: MockPostInteractions = {
        ...interactions,
        [userKey]: {
            ...(interactions[userKey] || {}),
            [postKey]: interaction,
        },
    };

    saveMockInteractions(updatedInteractions);

    return updatedInteractions;
}

export function applyMockUserStateToPost(
    post: Post,
    accessToken = localStorage.getItem(MOCK_STORAGE_KEYS.accessToken)
): Post {
    const userId = getUserIdFromMockToken(accessToken);

    if (!userId) {
        return {
            ...post,
            isLikedByMe: false,
            isDislikedByMe: false,
            isSavedByMe: false,
        };
    }

    const interaction = getMockPostInteraction(userId, post.id);

    return {
        ...post,
        isLikedByMe: interaction.reaction === 'like',
        isDislikedByMe: interaction.reaction === 'dislike',
        isSavedByMe: interaction.saved,
    };
}

export function applyMockUserStateToPosts(posts: Post[]) {
    return posts.map((post) => applyMockUserStateToPost(post));
}

export function incrementMockPostCommentsCount(postId: number) {
    const posts = getMockPosts();

    const updatedPosts = posts.map((post) =>
        post.id === postId
            ? {
                ...post,
                commentsCount: post.commentsCount + 1,
            }
            : post
    );

    saveMockPosts(updatedPosts);

    return updatedPosts;
}

export function decrementMockPostCommentsCount(postId: number) {
    const posts = getMockPosts();

    const updatedPosts = posts.map((post) =>
        post.id === postId
            ? {
                ...post,
                commentsCount: Math.max(post.commentsCount - 1, 0),
            }
            : post
    );

    saveMockPosts(updatedPosts);

    return updatedPosts;
}

export function syncMockUserPublicData({
                                           userId,
                                           nickname,
                                           avatarUrl,
                                       }: {
    userId: number;
    nickname: string;
    avatarUrl: string | null;
}) {
    syncMockPostsAuthor({
        userId,
        nickname,
        avatarUrl,
    });

    syncMockCommentsAuthor({
        userId,
        nickname,
        avatarUrl,
    });

    syncMockContentRequestsAuthor({
        userId,
        nickname,
    });
}

export function syncMockPostsAuthor({
                                        userId,
                                        nickname,
                                        avatarUrl,
                                    }: {
    userId: number;
    nickname: string;
    avatarUrl: string | null;
}) {
    const posts = getMockPosts();

    if (!posts.length) {
        return posts;
    }

    const updatedPosts = posts.map((post) => {
        if (post.author.id !== userId) {
            return post;
        }

        return {
            ...post,
            author: {
                ...post.author,
                nickname,
                avatarUrl,
            },
        };
    });

    saveMockPosts(updatedPosts);

    return updatedPosts;
}

export function syncMockCommentsAuthor({
                                           userId,
                                           nickname,
                                           avatarUrl,
                                       }: {
    userId: number;
    nickname: string;
    avatarUrl: string | null;
}) {
    const comments = getMockComments();

    if (!comments.length) {
        return comments;
    }

    const updatedComments = comments.map((comment) => {
        if (comment.author.id !== userId) {
            return comment;
        }

        return {
            ...comment,
            author: {
                ...comment.author,
                nickname,
                avatarUrl,
            },
        };
    });

    saveMockComments(updatedComments);

    return updatedComments;
}

export function syncMockContentRequestsAuthor({
                                                  userId,
                                                  nickname,
                                              }: {
    userId: number;
    nickname: string;
}) {
    const requests = getMockContentRequests();

    if (!requests.length) {
        return requests;
    }

    const updatedRequests = requests.map((request) => {
        if (request.userId !== userId) {
            return request;
        }

        return {
            ...request,
            userNickname: nickname,
        };
    });

    saveMockContentRequests(updatedRequests);

    return updatedRequests;
}

export function createMockImageUrl(title: string, colorA = '#7c3aed', colorB = '#2563eb') {
    const svg = `
    <svg width="1200" height="900" viewBox="0 0 1200 900" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="900" fill="#080A12"/>
      <circle cx="220" cy="160" r="360" fill="${colorA}" opacity="0.55"/>
      <circle cx="980" cy="720" r="420" fill="${colorB}" opacity="0.5"/>
      <circle cx="860" cy="180" r="220" fill="#7c3aed" opacity="0.28"/>
      <rect x="90" y="90" width="1020" height="720" rx="52" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>
      <text x="120" y="445" fill="white" font-family="Inter, Arial, sans-serif" font-size="76" font-weight="900" letter-spacing="-4">${escapeSvgText(title)}</text>
      <text x="124" y="510" fill="rgba(255,255,255,0.72)" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="700">PulseFeed mock content</text>
    </svg>
  `;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function escapeSvgText(text: string) {
    return text
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}

export function formatMockFileSize(size: number) {
    if (size < 1024) {
        return `${size} B`;
    }

    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / 1024 / 1024).toFixed(1)} MB`;
}