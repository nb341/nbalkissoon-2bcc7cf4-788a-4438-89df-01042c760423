import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskFilterDto, TaskStatus, TaskCategory } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

@Component({
  selector: 'app-task-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-filters.component.html',
})
export class TaskFiltersComponent {
  @Output() filterChange = new EventEmitter<TaskFilterDto>();
  @Output() createTask = new EventEmitter<void>();

  filters: TaskFilterDto = {};
  statuses = ['', ...Object.values(TaskStatus)];
  categories = ['', ...Object.values(TaskCategory)];
  sortOptions = [
    { value: 'createdAt', label: 'Created Date' },
    { value: 'updatedAt', label: 'Updated Date' },
    { value: 'dueDate', label: 'Due Date' },
    { value: 'priority', label: 'Priority' },
    { value: 'title', label: 'Title' },
  ];

  onFilterChange(): void {
    const cleanFilters: TaskFilterDto = {};
    
    if (this.filters.status) cleanFilters.status = this.filters.status;
    if (this.filters.category) cleanFilters.category = this.filters.category;
    if (this.filters.search) cleanFilters.search = this.filters.search;
    if (this.filters.sortBy) cleanFilters.sortBy = this.filters.sortBy;
    if (this.filters.sortOrder) cleanFilters.sortOrder = this.filters.sortOrder;

    this.filterChange.emit(cleanFilters);
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filters.search = input.value;
    this.onFilterChange();
  }

  clearFilters(): void {
    this.filters = {};
    this.filterChange.emit({});
  }

  onCreate(): void {
    this.createTask.emit();
  }
}
