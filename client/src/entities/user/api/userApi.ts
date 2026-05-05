import { baseApi } from '../../../shared/api/baseApi';
import type { RootState } from '../../../app/store';
import type { AuthUser } from '../../auth/model/authTypes';
import { setUser } from '../../auth/slice/authSlice';

interface UpdateMeDto {
    nickname: string;
    email: string;
}

interface UploadAvatarResponse {
    avatarUrl: string;
}

export const userApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        updateMe: builder.mutation<AuthUser, UpdateMeDto>({
            query: (body) => ({
                url: '/users/me',
                method: 'PATCH',
                body,
            }),

            async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
                const { data } = await queryFulfilled;

                dispatch(setUser(data));
            },

            invalidatesTags: ['Auth', 'User', 'Post', 'Comment'],
        }),

        uploadAvatar: builder.mutation<UploadAvatarResponse, File>({
            query: (file) => {
                const formData = new FormData();

                formData.append('avatar', file);

                return {
                    url: '/users/me/avatar',
                    method: 'POST',
                    body: formData,
                };
            },

            async onQueryStarted(_arg, { dispatch, getState, queryFulfilled }) {
                const { data } = await queryFulfilled;
                const state = getState() as RootState;
                const currentUser = state.auth.user;

                if (currentUser) {
                    dispatch(
                        setUser({
                            ...currentUser,
                            avatarUrl: data.avatarUrl,
                        })
                    );
                }
            },

            invalidatesTags: ['Auth', 'User', 'Post', 'Comment'],
        }),
    }),
});

export const {
    useUpdateMeMutation,
    useUploadAvatarMutation,
} = userApi;