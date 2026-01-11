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
  @Input() canAssign = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CreateTaskDto | UpdateTaskDto>();

  taskForm!: FormGroup;
  statuses = Object.values(TaskStatus);
  categories = Object.values(TaskCategory);
  users: UserOption[] = [];

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadUsers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.initForm();
    }
  }

  loadUsers(): void {
    this.adminService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: () => {
        this.users = [];
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
}
