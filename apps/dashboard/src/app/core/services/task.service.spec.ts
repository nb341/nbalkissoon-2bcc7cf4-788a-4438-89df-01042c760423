import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TaskService } from './task.service';
import { TaskStatus, TaskCategory } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  const mockTask = {
    id: 'task-123',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    category: TaskCategory.WORK,
    priority: 5,
    createdById: 'user-123',
    organizationId: 'org-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPaginatedResponse = {
    data: [mockTask],
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TaskService],
    });

    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getTasks', () => {
    it('should fetch tasks without filters', () => {
      service.getTasks().subscribe((response) => {
        expect(response).toEqual(mockPaginatedResponse);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/tasks');
      expect(req.request.method).toBe('GET');
      req.flush(mockPaginatedResponse);
    });

    it('should fetch tasks with filters', () => {
      const filters = { status: TaskStatus.TODO, category: TaskCategory.WORK };

      service.getTasks(filters).subscribe((response) => {
        expect(response).toEqual(mockPaginatedResponse);
      });

      const req = httpMock.expectOne((request) => 
        request.url === 'http://localhost:3000/api/tasks' &&
        request.params.get('status') === TaskStatus.TODO &&
        request.params.get('category') === TaskCategory.WORK
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPaginatedResponse);
    });
  });

  describe('getTask', () => {
    it('should fetch a single task', () => {
      service.getTask('task-123').subscribe((response) => {
        expect(response).toEqual(mockTask);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/tasks/task-123');
      expect(req.request.method).toBe('GET');
      req.flush(mockTask);
    });
  });

  describe('createTask', () => {
    it('should create a new task', () => {
      const createDto = {
        title: 'New Task',
        description: 'New Description',
        category: TaskCategory.WORK,
      };

      service.createTask(createDto).subscribe((response) => {
        expect(response).toEqual(mockTask);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/tasks');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDto);
      req.flush(mockTask);
    });
  });

  describe('updateTask', () => {
    it('should update a task', () => {
      const updateDto = { title: 'Updated Task' };

      service.updateTask('task-123', updateDto).subscribe((response) => {
        expect(response).toEqual({ ...mockTask, ...updateDto });
      });

      const req = httpMock.expectOne('http://localhost:3000/api/tasks/task-123');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateDto);
      req.flush({ ...mockTask, ...updateDto });
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', () => {
      service.deleteTask('task-123').subscribe();

      const req = httpMock.expectOne('http://localhost:3000/api/tasks/task-123');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('reorderTask', () => {
    it('should reorder a task', () => {
      service.reorderTask('task-123', 10).subscribe((response) => {
        expect(response).toEqual({ ...mockTask, priority: 10 });
      });

      const req = httpMock.expectOne('http://localhost:3000/api/tasks/task-123/reorder');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ priority: 10 });
      req.flush({ ...mockTask, priority: 10 });
    });
  });
});
