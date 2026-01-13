import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-registration-submitted',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './registration-submitted.component.html',
})
export class RegistrationSubmittedComponent {}
