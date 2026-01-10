import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, mergeMap } from 'rxjs/operators';
import { TasksActions } from './tasks.actions';
import { TaskService } from '../../core/services/task.service';

@Injectable()
export class TasksEffects {
  private actions$ = inject(Actions);
  private taskService = inject(TaskService);

  loadTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.loadTasks),
      exhaustMap(({ filters }) =>
        this.taskService.getTasks(filters).pipe(
          map((response) =>
            TasksActions.loadTasksSuccess({
              tasks: response.data,
              total: response.meta.total,
              page: response.meta.page,
              limit: response.meta.limit,
              totalPages: response.meta.totalPages,
            })
          ),
          catchError((error) =>
            of(TasksActions.loadTasksFailure({ error: error.error?.message || 'Failed to load tasks' }))
          )
        )
      )
    )
  );

  loadTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.loadTask),
      exhaustMap(({ id }) =>
        this.taskService.getTask(id).pipe(
          map((task) => TasksActions.loadTaskSuccess({ task })),
          catchError((error) =>
            of(TasksActions.loadTaskFailure({ error: error.error?.message || 'Failed to load task' }))
          )
        )
      )
    )
  );

  createTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.createTask),
      exhaustMap(({ task }) =>
        this.taskService.createTask(task).pipe(
          map((createdTask) => TasksActions.createTaskSuccess({ task: createdTask })),
          catchError((error) =>
            of(TasksActions.createTaskFailure({ error: error.error?.message || 'Failed to create task' }))
          )
        )
      )
    )
  );

  updateTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.updateTask),
      exhaustMap(({ id, task }) =>
        this.taskService.updateTask(id, task).pipe(
          map((updatedTask) => TasksActions.updateTaskSuccess({ task: updatedTask })),
          catchError((error) =>
            of(TasksActions.updateTaskFailure({ error: error.error?.message || 'Failed to update task' }))
          )
        )
      )
    )
  );

  deleteTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.deleteTask),
      mergeMap(({ id }) =>
        this.taskService.deleteTask(id).pipe(
          map(() => TasksActions.deleteTaskSuccess({ id })),
          catchError((error) =>
            of(TasksActions.deleteTaskFailure({ error: error.error?.message || 'Failed to delete task' }))
          )
        )
      )
    )
  );

  reorderTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.reorderTask),
      mergeMap(({ id, priority }) =>
        this.taskService.reorderTask(id, priority).pipe(
          map((task) => TasksActions.reorderTaskSuccess({ task })),
          catchError((error) =>
            of(TasksActions.reorderTaskFailure({ error: error.error?.message || 'Failed to reorder task' }))
          )
        )
      )
    )
  );
}
