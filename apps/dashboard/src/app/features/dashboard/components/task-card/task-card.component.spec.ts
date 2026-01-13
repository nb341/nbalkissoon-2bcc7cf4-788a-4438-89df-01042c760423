import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskCardComponent } from './task-card.component';
import { TaskStatus, TaskCategory } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

describe('TaskCardComponent', () => {
  let component: TaskCardComponent;
  let fixture: ComponentFixture<TaskCardComponent>;

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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskCardComponent);
    component = fixture.componentInstance;
    component.task = mockTask as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display task title', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Test Task');
  });

  it('should emit edit event when edit is clicked', () => {
    const editSpy = jest.spyOn(component.edit, 'emit');
    component.onEdit();
    expect(editSpy).toHaveBeenCalledWith(mockTask);
  });

  it('should open delete modal when delete is clicked', () => {
    expect(component.showDeleteModal).toBe(false);
    component.onDeleteClick();
    expect(component.showDeleteModal).toBe(true);
  });

  it('should emit delete event when confirmed', () => {
    const deleteSpy = jest.spyOn(component.delete, 'emit');
    component.showDeleteModal = true;
    component.onDeleteConfirm();
    expect(deleteSpy).toHaveBeenCalledWith('task-123');
    expect(component.showDeleteModal).toBe(false);
  });

  it('should close modal when cancelled', () => {
    component.showDeleteModal = true;
    component.onDeleteCancel();
    expect(component.showDeleteModal).toBe(false);
  });

  it('should return correct category color', () => {
    expect(component.getCategoryColor(TaskCategory.WORK)).toContain('blue');
    expect(component.getCategoryColor(TaskCategory.PERSONAL)).toContain('green');
    expect(component.getCategoryColor(TaskCategory.URGENT)).toContain('red');
  });

  it('should return correct priority color', () => {
    expect(component.getPriorityColor(9)).toContain('red');
    expect(component.getPriorityColor(6)).toContain('yellow');
    expect(component.getPriorityColor(3)).toContain('green');
  });
});
