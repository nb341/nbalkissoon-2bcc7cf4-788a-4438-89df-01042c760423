import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TasksState } from './tasks.state';
import { TaskStatus, TaskCategory } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

export const selectTasksState = createFeatureSelector<TasksState>('tasks');

export const selectAllTasks = createSelector(
  selectTasksState,
  (state) => state.tasks
);

export const selectSelectedTask = createSelector(
  selectTasksState,
  (state) => state.selectedTask
);

export const selectTasksLoading = createSelector(
  selectTasksState,
  (state) => state.loading
);

export const selectTasksError = createSelector(
  selectTasksState,
  (state) => state.error
);

export const selectTasksFilters = createSelector(
  selectTasksState,
  (state) => state.filters
);

export const selectTasksPagination = createSelector(
  selectTasksState,
  (state) => ({
    total: state.total,
    page: state.page,
    limit: state.limit,
    totalPages: state.totalPages,
  })
);

export const selectTasksByStatus = (status: TaskStatus) =>
  createSelector(selectAllTasks, (tasks) =>
    tasks.filter((task) => task.status === status)
  );

export const selectTasksByCategory = (category: TaskCategory) =>
  createSelector(selectAllTasks, (tasks) =>
    tasks.filter((task) => task.category === category)
  );

export const selectTodoTasks = createSelector(selectAllTasks, (tasks) =>
  tasks.filter((task) => task.status === TaskStatus.TODO)
);

export const selectInProgressTasks = createSelector(selectAllTasks, (tasks) =>
  tasks.filter((task) => task.status === TaskStatus.IN_PROGRESS)
);

export const selectCompletedTasks = createSelector(selectAllTasks, (tasks) =>
  tasks.filter((task) => task.status === TaskStatus.COMPLETED)
);

export const selectTaskStats = createSelector(selectAllTasks, (tasks) => ({
  total: tasks.length,
  todo: tasks.filter((t) => t.status === TaskStatus.TODO).length,
  inProgress: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
  completed: tasks.filter((t) => t.status === TaskStatus.COMPLETED).length,
}));
