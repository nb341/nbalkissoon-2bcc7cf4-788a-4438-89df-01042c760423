import { TaskStatus, TaskCategory } from '../enums';
import { IUserResponse } from './user.interface';

export interface ITask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  category: TaskCategory;
  priority: number;
  dueDate?: Date;
  createdById: string;
  createdBy?: IUserResponse;
  assignedToId?: string;
  assignedTo?: IUserResponse;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITaskWithRelations extends ITask {
  createdBy: IUserResponse;
  assignedTo?: IUserResponse;
}
