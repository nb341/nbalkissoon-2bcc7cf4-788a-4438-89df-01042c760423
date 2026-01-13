import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards';

export const appRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/login/login.component').then(
            (m) => m.LoginComponent
          ),
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/register/register.component').then(
            (m) => m.RegisterComponent
          ),
      },
      {
        path: 'registration-submitted',
        loadComponent: () =>
          import('./features/auth/registration-submitted/registration-submitted.component').then(
            (m) => m.RegistrationSubmittedComponent
          ),
      },
      {
        path: 'pending',
        loadComponent: () =>
          import('./features/auth/pending/pending.component').then(
            (m) => m.PendingComponent
          ),
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    children: [
      {
        path: 'approvals',
        loadComponent: () =>
          import('./features/admin/approvals/approvals.component').then(
            (m) => m.ApprovalsComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
