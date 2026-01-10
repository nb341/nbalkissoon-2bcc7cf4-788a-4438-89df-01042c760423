import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { ITask, CreateTaskDto, UpdateTaskDto, TaskFilterDto } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

export const TasksActions = createActionGroup({
  source: 'Tasks',
  events: {
    'Load Tasks': props<{ filters?: TaskFilterDto }>(),
    'Load Tasks Success': props<{ tasks: ITask[]; total: number; page: number; limit: number; totalPages: number }>(),
    'Load Tasks Failure': props<{ error: string }>(),

    'Load Task': props<{ id: string }>(),
    'Load Task Success': props<{ task: ITask }>(),
    'Load Task Failure': props<{ error: string }>(),

    'Create Task': props<{ task: CreateTaskDto }>(),
    'Create Task Success': props<{ task: ITask }>(),
    'Create Task Failure': props<{ error: string }>(),

    'Update Task': props<{ id: string; task: UpdateTaskDto }>(),
    'Update Task Success': props<{ task: ITask }>(),
    'Update Task Failure': props<{ error: string }>(),

    'Delete Task': props<{ id: string }>(),
    'Delete Task Success': props<{ id: string }>(),
    'Delete Task Failure': props<{ error: string }>(),

    'Reorder Task': props<{ id: string; priority: number }>(),
    'Reorder Task Success': props<{ task: ITask }>(),
    'Reorder Task Failure': props<{ error: string }>(),

    'Set Filters': props<{ filters: TaskFilterDto }>(),
    'Clear Filters': emptyProps(),

    'Select Task': props<{ task: ITask | null }>(),
    'Clear Error': emptyProps(),
  },
});
