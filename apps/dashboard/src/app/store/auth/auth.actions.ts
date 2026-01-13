import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { AuthUser } from './auth.state';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Login': props<{ credentials: LoginCredentials }>(),
    'Login Success': props<{ response: LoginResponse }>(),
    'Login Failure': props<{ error: string }>(),

    'Register': props<{ data: RegisterData }>(),
    'Register Success': props<{ message: string }>(),
    'Register Failure': props<{ error: string }>(),

    'Logout': emptyProps(),
    'Logout Complete': emptyProps(),

    'Load User From Storage': emptyProps(),
    'User Loaded': props<{ user: AuthUser; accessToken: string }>(),
    'No User Found': emptyProps(),

    'Clear Error': emptyProps(),
  },
});
