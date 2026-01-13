import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthActions, selectUser } from '../../store/auth';
import { 
  TasksActions, 
  selectAllTasks, 
  selectTasksLoading, 
  selectTasksError,
  selectTaskStats,
  selectTasksPagination
} from '../../store/tasks';
import { ITask, TaskFilterDto, CreateTaskDto, UpdateTaskDto, TaskStatus, Role } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';
import { AuthUser } from '../../store/auth/auth.state';
import { TaskListComponent } from './components/task-list/task-list.component';
import { TaskFiltersComponent } from './components/task-filters/task-filters.component';
import { TaskModalComponent } from './components/task-modal/task-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TaskListComponent, TaskFiltersComponent, TaskModalComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  user$: Observable<AuthUser | null>;
  userRole$: Observable<Role | null>;
  userId$: Observable<string | null>;
  tasks$: Observable<ITask[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  stats$: Observable<{ total: number; todo: number; inProgress: number; completed: number }>;
  pagination$: Observable<{ total: number; page: number; limit: number; totalPages: number }>;

  isModalOpen = false;
  isModalReadOnly = false;
  selectedTask: ITask | null = null;

  Role = Role;

  constructor(private store: Store) {
    this.user$ = this.store.select(selectUser);
    this.userRole$ = this.user$.pipe(map(user => user?.role as Role | null));
    this.userId$ = this.user$.pipe(map(user => user?.id || null));
    this.tasks$ = this.store.select(selectAllTasks);
    this.loading$ = this.store.select(selectTasksLoading);
    this.error$ = this.store.select(selectTasksError);
    this.stats$ = this.store.select(selectTaskStats);
    this.pagination$ = this.store.select(selectTasksPagination);
  }

  ngOnInit(): void {
    this.store.dispatch(AuthActions.loadUserFromStorage());
    this.store.dispatch(TasksActions.loadTasks({ filters: { limit: 50 } }));
  }

  onFilterChange(filters: TaskFilterDto): void {
    this.store.dispatch(TasksActions.loadTasks({ filters: { ...filters, limit: 50 } }));
  }

  onCreateTask(): void {
    this.selectedTask = null;
    this.isModalReadOnly = false;
    this.isModalOpen = true;
  }

  onEditTask(task: ITask): void {
    this.selectedTask = task;
    this.isModalReadOnly = false;
    this.isModalOpen = true;
  }

  onViewTask(task: ITask): void {
    this.selectedTask = task;
    this.isModalReadOnly = true;
    this.isModalOpen = true;
  }

  onDeleteTask(id: string): void {
    this.store.dispatch(TasksActions.deleteTask({ id }));
  }

  onStatusChange(event: { id: string; status: TaskStatus }): void {
    this.store.dispatch(TasksActions.updateTask({ id: event.id, task: { status: event.status } }));
  }

  onReorderTask(event: { id: string; priority: number }): void {
    this.store.dispatch(TasksActions.reorderTask({ id: event.id, priority: event.priority }));
  }

  onModalClose(): void {
    this.isModalOpen = false;
    this.isModalReadOnly = false;
    this.selectedTask = null;
  }

  onSaveTask(taskData: CreateTaskDto | UpdateTaskDto): void {
    if (this.selectedTask) {
      this.store.dispatch(TasksActions.updateTask({ id: this.selectedTask.id, task: taskData }));
    } else {
      this.store.dispatch(TasksActions.createTask({ task: taskData as CreateTaskDto }));
    }
    this.onModalClose();
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }

  isManagement(user: AuthUser | null): boolean {
    return user?.role === Role.OWNER || user?.role === Role.ADMIN;
  }

  isViewer(user: AuthUser | null): boolean {
    return user?.role === Role.VIEWER;
  }
}
