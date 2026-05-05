import { baseApi } from '../../../shared/api/baseApi';
import {
    buildMockCursorResponse,
    createMockError,
    delay,
    deleteMockNotification,
    deleteMockUserNotifications,
    filterMockNotifications,
    getCurrentMockUser,
    getMockNotificationsStats,
    markAllMockNotificationsAsRead,
    type MockNotification,
    type MockNotificationsStats,
    type NotificationFilter,
} from '../../../shared/lib/mockStorage';

interface NotificationsParams {
    cursor?: string | null;
    page?: number;
    limit?: number;
    filter?: NotificationFilter;
}

interface NotificationsResponse {
    items: MockNotification[];
    notifications: MockNotification[];
    nextCursor: string | null;
    hasMore: boolean;
    page: number;
    totalPages: number;
}

interface LatestNotificationsParams {
    after?: string | null;
}

interface LatestNotificationsResponse {
    items: MockNotification[];
    hasNew: boolean;
    unread: number;
}

const USE_MOCK_NOTIFICATIONS =
    import.meta.env.VITE_USE_MOCK_NOTIFICATIONS !== 'false';

export const notificationApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getNotifications: builder.query<NotificationsResponse, NotificationsParams>({
            async queryFn(
                {
                    cursor = null,
                    page,
                    limit = 10,
                    filter = 'ALL',
                },
                _api,
                _extraOptions,
                baseQuery
            ) {
                if (!USE_MOCK_NOTIFICATIONS) {
                    const result = await baseQuery({
                        url: '/notifications',
                        params: {
                            cursor,
                            page,
                            limit,
                            filter,
                        },
                    });

                    if (result.error) {
                        return {
                            error: result.error,
                        };
                    }

                    const data = result.data as NotificationsResponse;

                    return {
                        data: {
                            ...data,
                            notifications: data.notifications || data.items,
                        },
                    };
                }

                await delay(100);

                const user = getCurrentMockUser();

                if (!user) {
                    return {
                        error: createMockError(401, 'Нужно войти в аккаунт.'),
                    };
                }

                const notifications = filterMockNotifications({
                    userId: user.id,
                    filter,
                });

                const response = buildMockCursorResponse({
                    items: notifications,
                    cursor,
                    page,
                    limit,
                });

                return {
                    data: {
                        ...response,
                        notifications: response.items,
                    },
                };
            },
        }),

        getNotificationsStats: builder.query<MockNotificationsStats, void>({
            async queryFn(_arg, _api, _extraOptions, baseQuery) {
                if (!USE_MOCK_NOTIFICATIONS) {
                    const result = await baseQuery('/notifications/stats');

                    if (result.error) {
                        return {
                            error: result.error,
                        };
                    }

                    return {
                        data: result.data as MockNotificationsStats,
                    };
                }

                await delay(70);

                const user = getCurrentMockUser();

                if (!user) {
                    return {
                        error: createMockError(401, 'Нужно войти в аккаунт.'),
                    };
                }

                return {
                    data: getMockNotificationsStats(user.id),
                };
            },
        }),

        getLatestNotifications: builder.query<
            LatestNotificationsResponse,
            LatestNotificationsParams
        >({
            async queryFn({ after = null }, _api, _extraOptions, baseQuery) {
                if (!USE_MOCK_NOTIFICATIONS) {
                    const result = await baseQuery({
                        url: '/notifications/latest',
                        params: {
                            after,
                        },
                    });

                    if (result.error) {
                        return {
                            error: result.error,
                        };
                    }

                    return {
                        data: result.data as LatestNotificationsResponse,
                    };
                }

                await delay(70);

                const user = getCurrentMockUser();

                if (!user) {
                    return {
                        error: createMockError(401, 'Нужно войти в аккаунт.'),
                    };
                }

                const afterTime = after ? new Date(after).getTime() : 0;

                const items = filterMockNotifications({
                    userId: user.id,
                    filter: 'ALL',
                }).filter(
                    (notification) =>
                        new Date(notification.createdAt).getTime() > afterTime
                );

                const stats = getMockNotificationsStats(user.id);

                return {
                    data: {
                        items,
                        hasNew: items.length > 0,
                        unread: stats.unread,
                    },
                };
            },
        }),

        markAllNotificationsAsRead: builder.mutation<{ message: string }, void>({
            async queryFn(_arg, _api, _extraOptions, baseQuery) {
                if (!USE_MOCK_NOTIFICATIONS) {
                    const result = await baseQuery({
                        url: '/notifications/read-all',
                        method: 'PATCH',
                    });

                    if (result.error) {
                        return {
                            error: result.error,
                        };
                    }

                    return {
                        data: result.data as { message: string },
                    };
                }

                await delay(80);

                const user = getCurrentMockUser();

                if (!user) {
                    return {
                        error: createMockError(401, 'Нужно войти в аккаунт.'),
                    };
                }

                markAllMockNotificationsAsRead(user.id);

                return {
                    data: {
                        message: 'Уведомления прочитаны.',
                    },
                };
            },
        }),

        deleteNotification: builder.mutation<{ message: string }, number>({
            async queryFn(notificationId, _api, _extraOptions, baseQuery) {
                if (!USE_MOCK_NOTIFICATIONS) {
                    const result = await baseQuery({
                        url: `/notifications/${notificationId}`,
                        method: 'DELETE',
                    });

                    if (result.error) {
                        return {
                            error: result.error,
                        };
                    }

                    return {
                        data: result.data as { message: string },
                    };
                }

                await delay(80);

                const user = getCurrentMockUser();

                if (!user) {
                    return {
                        error: createMockError(401, 'Нужно войти в аккаунт.'),
                    };
                }

                deleteMockNotification(notificationId);

                return {
                    data: {
                        message: 'Уведомление удалено.',
                    },
                };
            },
        }),

        clearNotifications: builder.mutation<{ message: string }, void>({
            async queryFn(_arg, _api, _extraOptions, baseQuery) {
                if (!USE_MOCK_NOTIFICATIONS) {
                    const result = await baseQuery({
                        url: '/notifications',
                        method: 'DELETE',
                    });

                    if (result.error) {
                        return {
                            error: result.error,
                        };
                    }

                    return {
                        data: result.data as { message: string },
                    };
                }

                await delay(100);

                const user = getCurrentMockUser();

                if (!user) {
                    return {
                        error: createMockError(401, 'Нужно войти в аккаунт.'),
                    };
                }

                deleteMockUserNotifications(user.id);

                return {
                    data: {
                        message: 'Уведомления очищены.',
                    },
                };
            },
        }),
    }),
});

export const {
    useGetNotificationsQuery,
    useGetNotificationsStatsQuery,
    useGetLatestNotificationsQuery,
    useMarkAllNotificationsAsReadMutation,
    useDeleteNotificationMutation,
    useClearNotificationsMutation,
} = notificationApi;