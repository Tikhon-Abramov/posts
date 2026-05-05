import { baseApi } from '../../../shared/api/baseApi';

export interface Subscription {
    id: number;
    userId: number;
    plan: string;
    status: 'ACTIVE' | 'CANCELED' | string;
    startedAt: string | null;
    expiresAt: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface SubscriptionResponse {
    hasPremium: boolean;
    subscription: Subscription | null;
}

export interface ActivateSubscriptionResponse extends SubscriptionResponse {
    message: string;
}

export const subscriptionApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getMySubscription: builder.query<SubscriptionResponse, void>({
            query: () => '/subscriptions/me',

            providesTags: [{ type: 'Subscription', id: 'ME' }],
        }),

        activateTestSubscription: builder.mutation<
            ActivateSubscriptionResponse,
            void
        >({
            query: () => ({
                url: '/subscriptions/test-activate',
                method: 'POST',
            }),

            invalidatesTags: [
                { type: 'Subscription', id: 'ME' },
                'Auth',
                'User',
                { type: 'Post', id: 'LIST' },
            ],
        }),

        cancelSubscription: builder.mutation<ActivateSubscriptionResponse, void>({
            query: () => ({
                url: '/subscriptions/cancel',
                method: 'POST',
            }),

            invalidatesTags: [
                { type: 'Subscription', id: 'ME' },
                'Auth',
                'User',
                { type: 'Post', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetMySubscriptionQuery,
    useActivateTestSubscriptionMutation,
    useCancelSubscriptionMutation,
} = subscriptionApi;