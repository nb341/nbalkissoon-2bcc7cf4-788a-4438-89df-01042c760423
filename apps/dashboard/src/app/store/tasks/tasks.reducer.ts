import { createReducer, on } from '@ngrx/store';
import { TasksActions } from './tasks.actions';
import { TasksState, initialTasksState } from './tasks.state';

export const tasksReducer = createReducer(
  initialTasksState,

  on(TasksActions.loadTasks, (state, { filters }) => ({
    ...state,
    filters: filters || state.filters,
    loading: true,
    error: null,
  })),

  on(TasksActions.loadTasksSuccess, (state, { tasks, total, page, limit, totalPages }) => ({
    ...state,
    tasks,
    total,
    page,
    limit,
    totalPages,
    loading: false,
  })),

  on(TasksActions.loadTasksFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(TasksActions.loadTask, (state) => ({
    ...state,
    loading: true,
  })),

  on(TasksActions.loadTaskSuccess, (state, { task }) => ({
    ...state,
    selectedTask: task,
    loading: false,
  })),

  on(TasksActions.loadTaskFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(TasksActions.createTask, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(TasksActions.createTaskSuccess, (state, { task }) => ({
    ...state,
    tasks: [task, ...state.tasks],
    total: state.total + 1,
    loading: false,
  })),

  on(TasksActions.createTaskFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(TasksActions.updateTask, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(TasksActions.updateTaskSuccess, (state, { task }) => ({
    ...state,
    tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
    selectedTask: state.selectedTask?.id === task.id ? task : state.selectedTask,
    loading: false,
  })),

  on(TasksActions.updateTaskFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(TasksActions.deleteTask, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(TasksActions.deleteTaskSuccess, (state, { id }) => ({
    ...state,
    tasks: state.tasks.filter((t) => t.id !== id),
    total: state.total - 1,
    selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
    loading: false,
  })),

  on(TasksActions.deleteTaskFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(TasksActions.reorderTaskSuccess, (state, { task }) => ({
    ...state,
    tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
  })),

  on(TasksActions.setFilters, (state, { filters }) => ({
    ...state,
    filters: { ...state.filters, ...filters },
  })),

  on(TasksActions.clearFilters, (state) => ({
    ...state,
    filters: {},
  })),

  on(TasksActions.selectTask, (state, { task }) => ({
    ...state,
    selectedTask: task,
  })),

  on(TasksActions.clearError, (state) => ({
    ...state,
    error: null,
  })),
);
