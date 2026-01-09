import { TaskStatus, TaskCategory } from '../../enums';

export interface TaskFilterDto {
  status?: TaskStatus;
  category?: TaskCategory;
  assignedToId?: string;
  createdById?: string;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface PaginatedResponseDto<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
