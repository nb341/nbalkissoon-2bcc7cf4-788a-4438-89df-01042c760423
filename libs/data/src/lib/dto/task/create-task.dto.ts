import { TaskStatus, TaskCategory } from '../../enums';

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: number;
  dueDate?: Date | string;
  assignedToId?: string;
}
