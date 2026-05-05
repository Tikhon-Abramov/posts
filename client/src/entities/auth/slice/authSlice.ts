import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { AuthResponse, AuthUser } from '../model/authTypes';

type AuthModalMode = 'login' | 'register';

interface OpenAuthModalPayload {
  mode?: AuthModalMode;
  reason?: string | null;
}

interface AuthModalState {
  isOpen: boolean;
  mode: AuthModalMode;
  reason: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;

  /**
   * Новый формат, который используем дальше.
   */
  isAuthModalOpen: boolean;
  authModalMode: AuthModalMode;
  authModalReason: string | null;

  /**
   * Совместимость со старыми компонентами,
   * где еще может быть state.auth.authModal.isOpen.
   */
  authModal: AuthModalState;
}

const initialAuthModal: AuthModalState = {
  isOpen: false,
  mode: 'login',
  reason: null,
};

const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem('accessToken'),

  isAuthModalOpen: initialAuthModal.isOpen,
  authModalMode: initialAuthModal.mode,
  authModalReason: initialAuthModal.reason,

  authModal: initialAuthModal,
};

export const authSlice = createSlice({
  name: 'auth',

  initialState,

  reducers: {
    setCredentials(state, action: PayloadAction<AuthResponse>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;

      localStorage.setItem('accessToken', action.payload.accessToken);
    },

    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
    },

    clearCredentials(state) {
      state.user = null;
      state.accessToken = null;

      localStorage.removeItem('accessToken');
    },

    logout(state) {
      state.user = null;
      state.accessToken = null;

      localStorage.removeItem('accessToken');
    },

    openAuthModal(state, action: PayloadAction<OpenAuthModalPayload | undefined>) {
      const mode = action.payload?.mode || 'login';
      const reason = action.payload?.reason || null;

      state.isAuthModalOpen = true;
      state.authModalMode = mode;
      state.authModalReason = reason;

      state.authModal = {
        isOpen: true,
        mode,
        reason,
      };
    },

    closeAuthModal(state) {
      state.isAuthModalOpen = false;
      state.authModalReason = null;

      state.authModal = {
        ...state.authModal,
        isOpen: false,
        reason: null,
      };
    },

    switchAuthModalMode(state, action: PayloadAction<AuthModalMode>) {
      state.authModalMode = action.payload;

      state.authModal = {
        ...state.authModal,
        mode: action.payload,
      };
    },
  },
});

export const {
  setCredentials,
  setUser,
  clearCredentials,
  logout,
  openAuthModal,
  closeAuthModal,
  switchAuthModalMode,
} = authSlice.actions;

export const authReducer = authSlice.reducer;