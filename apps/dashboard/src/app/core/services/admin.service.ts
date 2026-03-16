import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Permission, Role } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

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
  role: Role;
  roleTemplateId?: string;
}

export interface RoleTemplate {
  id: string;
  name: string;
  description?: string | null;
  baseRole: Role;
  permissions: Permission[];
  organizationId: string;
  createdAt: string;
  updatedAt: string;
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

  updateUserRole(userId: string, data: { role: Role; roleTemplateId?: string }): Observable<any> {
    return this.http.put<any>(this.apiUrl + '/users/' + userId + '/role', data);
  }

  getRoleTemplates(organizationId?: string): Observable<RoleTemplate[]> {
    const url = organizationId
      ? this.apiUrl + '/role-templates?organizationId=' + organizationId
      : this.apiUrl + '/role-templates';
    return this.http.get<RoleTemplate[]>(url);
  }

  createRoleTemplate(data: {
    organizationId: string;
    name: string;
    description?: string;
    baseRole: Role;
    permissions: Permission[];
  }): Observable<RoleTemplate> {
    return this.http.post<RoleTemplate>(this.apiUrl + '/role-templates', data);
  }

  updateRoleTemplate(
    templateId: string,
    data: { name?: string; description?: string; baseRole?: Role; permissions?: Permission[] },
  ): Observable<RoleTemplate> {
    return this.http.put<RoleTemplate>(this.apiUrl + '/role-templates/' + templateId, data);
  }

  deleteRoleTemplate(templateId: string): Observable<void> {
    return this.http.delete<void>(this.apiUrl + '/role-templates/' + templateId);
  }
}
