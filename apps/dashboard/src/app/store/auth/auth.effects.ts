import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, tap } from 'rxjs/operators';
import { AuthActions } from './auth.actions';
import { AuthService } from '../../core/services/auth.service';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ credentials }) =>
        this.authService.login(credentials).pipe(
          map((response) => AuthActions.loginSuccess({ response })),
          catchError((error) =>
            of(AuthActions.loginFailure({ error: error.error?.message || 'Login failed' }))
          )
        )
      )
    )
  );

  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(() => this.router.navigate(['/dashboard']))
      ),
    { dispatch: false }
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      exhaustMap(({ data }) =>
        this.authService.register(data).pipe(
          map((response) => AuthActions.registerSuccess({ response })),
          catchError((error) =>
            of(AuthActions.registerFailure({ error: error.error?.message || 'Registration failed' }))
          )
        )
      )
    )
  );

  registerSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.registerSuccess),
        tap(() => this.router.navigate(['/auth/login']))
      ),
    { dispatch: false }
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => {
        this.authService.logout();
        this.router.navigate(['/auth/login']);
      }),
      map(() => AuthActions.logoutComplete())
    )
  );

  loadUserFromStorage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadUserFromStorage),
      map(() => {
        const user = this.authService.getUser();
        const accessToken = this.authService.getAccessToken();

        if (user && accessToken && this.authService.isAuthenticated()) {
          return AuthActions.userLoaded({ user, accessToken });
        }
        return AuthActions.noUserFound();
      })
    )
  );
}
