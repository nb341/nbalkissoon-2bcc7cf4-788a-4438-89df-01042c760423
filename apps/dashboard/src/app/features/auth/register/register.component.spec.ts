import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { RegisterComponent } from './register.component';
import { authReducer } from '../../../store/auth';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        provideStore({ auth: authReducer }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a register form with email, password, and confirmPassword fields', () => {
    expect(component.registerForm.contains('email')).toBeTruthy();
    expect(component.registerForm.contains('password')).toBeTruthy();
    expect(component.registerForm.contains('confirmPassword')).toBeTruthy();
  });

  it('should require valid email', () => {
    const control = component.registerForm.get('email');
    control?.setValue('invalid');
    expect(control?.valid).toBeFalsy();
    
    control?.setValue('valid@email.com');
    expect(control?.valid).toBeTruthy();
  });

  it('should require password with min length 6', () => {
    const control = component.registerForm.get('password');
    control?.setValue('12345');
    expect(control?.valid).toBeFalsy();
    
    control?.setValue('123456');
    expect(control?.valid).toBeTruthy();
  });

  it('should validate passwords match', () => {
    component.registerForm.get('password')?.setValue('password123');
    component.registerForm.get('confirmPassword')?.setValue('password456');
    expect(component.passwordsMatch()).toBeFalsy();

    component.registerForm.get('confirmPassword')?.setValue('password123');
    expect(component.passwordsMatch()).toBeTruthy();
  });
});
