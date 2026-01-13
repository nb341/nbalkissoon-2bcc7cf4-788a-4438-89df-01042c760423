import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../../store/auth';

@Component({
  selector: 'app-pending',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pending.component.html',
})
export class PendingComponent {
  constructor(private store: Store) {}

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
