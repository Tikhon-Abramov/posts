import { baseApi } from '../../../shared/api/baseApi';
import type { AuthUser } from '../model/authTypes';
import {
  createMockAccessToken,
  createMockError,
  delay,
  getCurrentMockUser,
  getMockUsers,
  saveMockUsers,
  syncMockUserPublicData,
  toPublicUser,
  type MockUser,
} from '../../../shared/lib/mockStorage';

interface LoginDto {
  email: string;
  password: string;
}

interface RegisterDto {
  nickname: string;
  email: string;
  password: string;
}

interface UpdateProfileDto {
  nickname: string;
  email: string;
  avatarUrl?: string | null;
}

interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH !== 'false';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginDto>({
      async queryFn(body, _api, _extraOptions, baseQuery) {
        if (!USE_MOCK_AUTH) {
          const result = await baseQuery({
            url: '/auth/login',
            method: 'POST',
            body,
          });

          if (result.error) {
            return { error: result.error };
          }

          return { data: result.data as AuthResponse };
        }

        await delay();

        const normalizedEmail = body.email.trim().toLowerCase();
        const password = body.password.trim();

        const users = getMockUsers();

        const user = users.find(
            (item) =>
                item.email.toLowerCase() === normalizedEmail &&
                item.password === password
        );

        if (!user) {
          return {
            error: createMockError(401, 'Неверная почта или пароль.'),
          };
        }

        return {
          data: {
            user: toPublicUser(user),
            accessToken: createMockAccessToken(user.id),
          },
        };
      },
    }),

    register: builder.mutation<AuthResponse, RegisterDto>({
      async queryFn(body, _api, _extraOptions, baseQuery) {
        if (!USE_MOCK_AUTH) {
          const result = await baseQuery({
            url: '/auth/register',
            method: 'POST',
            body,
          });

          if (result.error) {
            return { error: result.error };
          }

          return { data: result.data as AuthResponse };
        }

        await delay();

        const normalizedNickname = body.nickname.trim();
        const normalizedEmail = body.email.trim().toLowerCase();
        const password = body.password.trim();

        if (normalizedNickname.length < 3) {
          return {
            error: createMockError(400, 'Ник должен содержать минимум 3 символа.'),
          };
        }

        if (!normalizedEmail.includes('@')) {
          return {
            error: createMockError(400, 'Введите корректную почту.'),
          };
        }

        if (password.length < 6) {
          return {
            error: createMockError(
                400,
                'Пароль должен содержать минимум 6 символов.'
            ),
          };
        }

        const users = getMockUsers();

        const isEmailBusy = users.some(
            (user) => user.email.toLowerCase() === normalizedEmail
        );

        if (isEmailBusy) {
          return {
            error: createMockError(409, 'Пользователь с такой почтой уже есть.'),
          };
        }

        const isNicknameBusy = users.some(
            (user) =>
                user.nickname.toLowerCase() === normalizedNickname.toLowerCase()
        );

        if (isNicknameBusy) {
          return {
            error: createMockError(409, 'Пользователь с таким ником уже есть.'),
          };
        }

        const newUser: MockUser = {
          id: Date.now(),
          nickname: normalizedNickname,
          email: normalizedEmail,
          password,
          avatarUrl: null,
          role: 'USER',
          hasPremium: false,
        };

        saveMockUsers([...users, newUser]);

        return {
          data: {
            user: toPublicUser(newUser),
            accessToken: createMockAccessToken(newUser.id),
          },
        };
      },
    }),

    getMe: builder.query<AuthUser, void>({
      async queryFn(_arg, _api, _extraOptions, baseQuery) {
        if (!USE_MOCK_AUTH) {
          const result = await baseQuery('/auth/me');

          if (result.error) {
            return { error: result.error };
          }

          return { data: result.data as AuthUser };
        }

        await delay(220);

        const user = getCurrentMockUser();

        if (!user) {
          return {
            error: createMockError(401, 'Сессия не найдена.'),
          };
        }

        return {
          data: toPublicUser(user),
        };
      },
      providesTags: ['User'],
    }),

    updateProfile: builder.mutation<AuthUser, UpdateProfileDto>({
      async queryFn(body, _api, _extraOptions, baseQuery) {
        if (!USE_MOCK_AUTH) {
          const result = await baseQuery({
            url: '/users/me',
            method: 'PATCH',
            body,
          });

          if (result.error) {
            return { error: result.error };
          }

          return { data: result.data as AuthUser };
        }

        await delay();

        const currentUser = getCurrentMockUser();

        if (!currentUser) {
          return {
            error: createMockError(401, 'Сессия не найдена. Войдите заново.'),
          };
        }

        const normalizedNickname = body.nickname.trim();
        const normalizedEmail = body.email.trim().toLowerCase();
        const normalizedAvatarUrl = body.avatarUrl || null;

        if (normalizedNickname.length < 3) {
          return {
            error: createMockError(400, 'Ник должен содержать минимум 3 символа.'),
          };
        }

        if (!normalizedEmail.includes('@')) {
          return {
            error: createMockError(400, 'Введите корректную почту.'),
          };
        }

        const users = getMockUsers();

        const isEmailBusy = users.some(
            (user) =>
                user.id !== currentUser.id &&
                user.email.toLowerCase() === normalizedEmail
        );

        if (isEmailBusy) {
          return {
            error: createMockError(409, 'Эта почта уже занята.'),
          };
        }

        const isNicknameBusy = users.some(
            (user) =>
                user.id !== currentUser.id &&
                user.nickname.toLowerCase() === normalizedNickname.toLowerCase()
        );

        if (isNicknameBusy) {
          return {
            error: createMockError(409, 'Этот ник уже занят.'),
          };
        }

        const updatedUsers = users.map((user) =>
            user.id === currentUser.id
                ? {
                  ...user,
                  nickname: normalizedNickname,
                  email: normalizedEmail,
                  avatarUrl: normalizedAvatarUrl,
                }
                : user
        );

        saveMockUsers(updatedUsers);

        const updatedUser = updatedUsers.find((user) => user.id === currentUser.id);

        if (!updatedUser) {
          return {
            error: createMockError(404, 'Пользователь не найден.'),
          };
        }

        syncMockUserPublicData({
          userId: updatedUser.id,
          nickname: updatedUser.nickname,
          avatarUrl: updatedUser.avatarUrl || null,
        });

        return {
          data: toPublicUser(updatedUser),
        };
      },
      invalidatesTags: ['User', 'Post', 'Comment'],
    }),

    changePassword: builder.mutation<{ message: string }, ChangePasswordDto>({
      async queryFn(body, _api, _extraOptions, baseQuery) {
        if (!USE_MOCK_AUTH) {
          const result = await baseQuery({
            url: '/auth/change-password',
            method: 'PATCH',
            body,
          });

          if (result.error) {
            return { error: result.error };
          }

          return { data: result.data as { message: string } };
        }

        await delay();

        const currentUser = getCurrentMockUser();

        if (!currentUser) {
          return {
            error: createMockError(401, 'Сессия не найдена. Войдите заново.'),
          };
        }

        const currentPassword = body.currentPassword.trim();
        const newPassword = body.newPassword.trim();

        if (currentUser.password !== currentPassword) {
          return {
            error: createMockError(400, 'Текущий пароль указан неверно.'),
          };
        }

        if (newPassword.length < 6) {
          return {
            error: createMockError(
                400,
                'Новый пароль должен содержать минимум 6 символов.'
            ),
          };
        }

        if (currentPassword === newPassword) {
          return {
            error: createMockError(
                400,
                'Новый пароль должен отличаться от текущего.'
            ),
          };
        }

        const users = getMockUsers();

        const updatedUsers = users.map((user) =>
            user.id === currentUser.id
                ? {
                  ...user,
                  password: newPassword,
                }
                : user
        );

        saveMockUsers(updatedUsers);

        return {
          data: {
            message: 'Пароль успешно изменен.',
          },
        };
      },
    }),

    logoutUser: builder.mutation<{ message: string }, void>({
      async queryFn(_arg, _api, _extraOptions, baseQuery) {
        if (!USE_MOCK_AUTH) {
          const result = await baseQuery({
            url: '/auth/logout',
            method: 'POST',
          });

          if (result.error) {
            return { error: result.error };
          }

          return { data: result.data as { message: string } };
        }

        await delay(180);

        return {
          data: {
            message: 'Вы вышли из аккаунта.',
          },
        };
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useLogoutUserMutation,
} = authApi;