import { ITask, TaskFilterDto } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

export interface TasksState {
  tasks: ITask[];
  selectedTask: ITask | null;
  filters: TaskFilterDto;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

export const initialTasksState: TasksState = {
  tasks: [],
  selectedTask: null,
  filters: {},
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  loading: false,
  error: null,
};
