import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ITask, TaskStatus, TaskCategory } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-card.component.html',
})
export class TaskCardComponent {
  @Input() task!: ITask;
  @Output() edit = new EventEmitter<ITask>();
  @Output() delete = new EventEmitter<string>();
  @Output() statusChange = new EventEmitter<{ id: string; status: TaskStatus }>();

  TaskStatus = TaskStatus;

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

  getStatusOptions(): TaskStatus[] {
    return [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED];
  }

  onStatusChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.statusChange.emit({ id: this.task.id, status: select.value as TaskStatus });
  }

  onEdit(): void {
    this.edit.emit(this.task);
  }

  onDelete(): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.delete.emit(this.task.id);
    }
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }
}
