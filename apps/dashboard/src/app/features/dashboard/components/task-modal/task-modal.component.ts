import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ITask, CreateTaskDto, UpdateTaskDto, TaskStatus, TaskCategory } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';
import { AdminService } from '../../../../core/services/admin.service';

interface UserOption {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-modal.component.html',
})
export class TaskModalComponent implements OnInit, OnChanges {
  @Input() task: ITask | null = null;
  @Input() isOpen = false;
  @Input() readOnly = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CreateTaskDto | UpdateTaskDto>();

  taskForm!: FormGroup;
  statuses = Object.values(TaskStatus);
  categories = Object.values(TaskCategory);
  users: UserOption[] = [];
  loadingUsers = false;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.initForm();
      this.loadUsers();
    }
  }

  loadUsers(): void {
    this.loadingUsers = true;
    this.adminService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loadingUsers = false;
      },
      error: (err) => {
        console.error('Failed to load users:', err);
        this.users = [];
        this.loadingUsers = false;
      },
    });
  }

  initForm(): void {
    this.taskForm = this.fb.group({
      title: [this.task?.title || '', [Validators.required, Validators.minLength(3)]],
      description: [this.task?.description || ''],
      status: [this.task?.status || TaskStatus.TODO],
      category: [this.task?.category || TaskCategory.OTHER],
      priority: [this.task?.priority || 0, [Validators.min(0), Validators.max(10)]],
      dueDate: [this.task?.dueDate ? this.formatDateForInput(this.task.dueDate) : ''],
      assignedToId: [this.task?.assignedToId || ''],
    });
  }

  formatDateForInput(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  getUserDisplayName(user: UserOption): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName} (${user.email})`;
    }
    return user.email;
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      const formValue = this.taskForm.value;
      const taskData: CreateTaskDto | UpdateTaskDto = {
        title: formValue.title,
        description: formValue.description || undefined,
        status: formValue.status,
        category: formValue.category,
        priority: formValue.priority,
        dueDate: formValue.dueDate || undefined,
        assignedToId: formValue.assignedToId || undefined,
      };
      this.save.emit(taskData);
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }

  get isEditMode(): boolean {
    return !!this.task;
  }

  getStatusColor(status: TaskStatus): string {
    const colors: Record<TaskStatus, string> = {
      [TaskStatus.TODO]: 'bg-yellow-100 text-yellow-800',
      [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
      [TaskStatus.COMPLETED]: 'bg-green-100 text-green-800',
      [TaskStatus.ARCHIVED]: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors[TaskStatus.TODO];
  }

  getCategoryColor(category: TaskCategory): string {
    const colors: Record<TaskCategory, string> = {
      [TaskCategory.WORK]: 'bg-blue-100 text-blue-800',
      [TaskCategory.PERSONAL]: 'bg-green-100 text-green-800',
      [TaskCategory.URGENT]: 'bg-red-100 text-red-800',
      [TaskCategory.OTHER]: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors[TaskCategory.OTHER];
  }

  getPriorityColor(priority: number): string {
    if (priority >= 8) return 'bg-red-500';
    if (priority >= 5) return 'bg-yellow-500';
    return 'bg-green-500';
  }
}
