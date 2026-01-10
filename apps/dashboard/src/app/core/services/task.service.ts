import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  ITask, 
  CreateTaskDto, 
  UpdateTaskDto, 
  TaskFilterDto,
  PaginatedResponseDto 
} from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly apiUrl = 'http://localhost:3000/api/tasks';

  constructor(private http: HttpClient) {}

  getTasks(filters?: TaskFilterDto): Observable<PaginatedResponseDto<ITask>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaginatedResponseDto<ITask>>(this.apiUrl, { params });
  }

  getTask(id: string): Observable<ITask> {
    return this.http.get<ITask>(`${this.apiUrl}/${id}`);
  }

  createTask(task: CreateTaskDto): Observable<ITask> {
    return this.http.post<ITask>(this.apiUrl, task);
  }

  updateTask(id: string, task: UpdateTaskDto): Observable<ITask> {
    return this.http.put<ITask>(`${this.apiUrl}/${id}`, task);
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  reorderTask(id: string, priority: number): Observable<ITask> {
    return this.http.put<ITask>(`${this.apiUrl}/${id}/reorder`, { priority });
  }
}
