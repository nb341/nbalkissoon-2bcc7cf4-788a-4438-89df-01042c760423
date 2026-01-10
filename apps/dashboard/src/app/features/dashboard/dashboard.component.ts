import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AuthActions, selectUser } from '../../store/auth';
import { LoginResponseDto } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  user$: Observable<LoginResponseDto['user'] | null>;

  constructor(private store: Store) {
    this.user$ = this.store.select(selectUser);
  }

  ngOnInit(): void {
    this.store.dispatch(AuthActions.loadUserFromStorage());
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
