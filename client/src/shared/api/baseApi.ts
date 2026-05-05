import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import type { RootState } from '../../app/store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005/api';

export const baseApi = createApi({
  reducerPath: 'baseApi',

  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,

    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const accessToken =
          state.auth.accessToken || localStorage.getItem('accessToken');

      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }

      return headers;
    },
  }),

  tagTypes: [
    'Auth',
    'User',
    'Post',
    'Comment',
    'ContentRequest',
    'Notification',
    'Subscription',
  ],

  endpoints: () => ({}),
});