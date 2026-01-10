import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { LoginDto, LoginResponseDto, RegisterDto, RegisterResponseDto } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Login': props<{ credentials: LoginDto }>(),
    'Login Success': props<{ response: LoginResponseDto }>(),
    'Login Failure': props<{ error: string }>(),

    'Register': props<{ data: RegisterDto }>(),
    'Register Success': props<{ response: RegisterResponseDto }>(),
    'Register Failure': props<{ error: string }>(),

    'Logout': emptyProps(),
    'Logout Complete': emptyProps(),

    'Load User From Storage': emptyProps(),
    'User Loaded': props<{ user: LoginResponseDto['user']; accessToken: string }>(),
    'No User Found': emptyProps(),

    'Clear Error': emptyProps(),
  },
});
