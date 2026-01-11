import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PendingUser {
  id: string;
  email: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  parentId?: string;
}

export interface ApproveUserDto {
  organizationId: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly apiUrl = environment.apiUrl + '/admin';

  constructor(private http: HttpClient) {}

  getPendingRegistrations(): Observable<PendingUser[]> {
    return this.http.get<PendingUser[]>(this.apiUrl + '/registrations');
  }

  approveUser(userId: string, data: ApproveUserDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.apiUrl + '/registrations/' + userId + '/approve', data);
  }

  rejectUser(userId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.apiUrl + '/registrations/' + userId + '/reject', {});
  }

  getOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(this.apiUrl + '/organizations');
  }

  getUsers(organizationId?: string): Observable<any[]> {
    const url = organizationId 
      ? this.apiUrl + '/users?organizationId=' + organizationId
      : this.apiUrl + '/users';
    return this.http.get<any[]>(url);
  }
}
