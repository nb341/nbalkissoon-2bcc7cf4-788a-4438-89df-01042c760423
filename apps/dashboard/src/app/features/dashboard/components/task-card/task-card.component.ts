import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ITask, TaskStatus, TaskCategory, Role } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, ConfirmModalComponent],
  templateUrl: './task-card.component.html',
})
export class TaskCardComponent {
  @Input() task!: ITask;
  @Input() userRole: Role | null = null;
  @Input() currentUserId: string | null = null;
  @Output() edit = new EventEmitter<ITask>();
  @Output() delete = new EventEmitter<string>();
  @Output() statusChange = new EventEmitter<{ id: string; status: TaskStatus }>();
  @Output() view = new EventEmitter<ITask>();

  showDeleteModal = false;
  statuses = Object.values(TaskStatus);
  Role = Role;

  getCategoryColor(category: TaskCategory): string {
    const colors: Record<TaskCategory, string> = {
      [TaskCategory.WORK]: 'bg-blue-100 text-blue-800',
      [TaskCategory.PERSONAL]: 'bg-green-100 text-green-800',
      [TaskCategory.URGENT]: 'bg-red-100 text-red-800',
      [TaskCategory.OTHER]: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors[TaskCategory.OTHER];
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

  getPriorityColor(priority: number): string {
    if (priority >= 8) return 'bg-red-500';
    if (priority >= 5) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  getStatusOptions(): TaskStatus[] {
    return this.statuses;
  }

  onStatusChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.statusChange.emit({ id: this.task.id, status: select.value as TaskStatus });
  }

  onEdit(): void {
    this.edit.emit(this.task);
  }

  onDeleteClick(): void {
    this.showDeleteModal = true;
  }

  onDeleteConfirm(): void {
    this.delete.emit(this.task.id);
    this.showDeleteModal = false;
  }

  onDeleteCancel(): void {
    this.showDeleteModal = false;
  }

  canModify(): boolean {
    return this.userRole === Role.OWNER || this.userRole === Role.ADMIN;
  }

  onView(): void {
    this.view.emit(this.task);
  }

  isCreatedByMe(): boolean {
    return this.task.createdById === this.currentUserId;
  }

  isAssignedToMe(): boolean {
    return this.task.assignedToId === this.currentUserId;
  }

  getOwnershipLabel(): string {
    if (this.isCreatedByMe() && this.isAssignedToMe()) {
      return 'Created by you & assigned to you';
    }
    if (this.isCreatedByMe()) {
      return 'Created by you';
    }
    if (this.isAssignedToMe()) {
      return 'Assigned to you';
    }
    return '';
  }
}
