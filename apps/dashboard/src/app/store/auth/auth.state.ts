import { LoginResponseDto } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

export interface AuthState {
  user: LoginResponseDto['user'] | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export const initialAuthState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};
