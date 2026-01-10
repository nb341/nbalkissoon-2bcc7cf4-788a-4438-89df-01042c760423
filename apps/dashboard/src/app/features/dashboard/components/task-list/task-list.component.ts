import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ITask, TaskStatus } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';
import { TaskCardComponent } from '../task-card/task-card.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, DragDropModule, TaskCardComponent],
  templateUrl: './task-list.component.html',
})
export class TaskListComponent {
  @Input() tasks: ITask[] = [];
  @Input() loading = false;
  @Output() edit = new EventEmitter<ITask>();
  @Output() delete = new EventEmitter<string>();
  @Output() statusChange = new EventEmitter<{ id: string; status: TaskStatus }>();
  @Output() reorder = new EventEmitter<{ id: string; priority: number }>();

  onDrop(event: CdkDragDrop<ITask[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      const task = this.tasks[event.previousIndex];
      const newPriority = this.tasks.length - event.currentIndex;
      this.reorder.emit({ id: task.id, priority: newPriority });
      moveItemInArray(this.tasks, event.previousIndex, event.currentIndex);
    }
  }

  onEdit(task: ITask): void {
    this.edit.emit(task);
  }

  onDelete(id: string): void {
    this.delete.emit(id);
  }

  onStatusChange(event: { id: string; status: TaskStatus }): void {
    this.statusChange.emit(event);
  }

  trackByTaskId(index: number, task: ITask): string {
    return task.id;
  }
}
