import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService, PendingUser, Organization } from '../../../core/services/admin.service';
import { Role } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './approvals.component.html',
})
export class ApprovalsComponent implements OnInit {
  pendingUsers: PendingUser[] = [];
  organizations: Organization[] = [];
  roles = [Role.VIEWER, Role.ADMIN, Role.OWNER];
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Modal state
  showApproveModal = false;
  showRejectModal = false;
  selectedUser: PendingUser | null = null;
  selectedOrganizationId = '';
  selectedRole: Role = Role.VIEWER;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadPendingUsers();
    this.loadOrganizations();
  }

  loadPendingUsers(): void {
    this.loading = true;
    this.adminService.getPendingRegistrations().subscribe({
      next: (users) => {
        this.pendingUsers = users;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load pending registrations';
        this.loading = false;
      },
    });
  }

  loadOrganizations(): void {
    this.adminService.getOrganizations().subscribe({
      next: (orgs) => {
        this.organizations = orgs;
        if (orgs.length > 0) {
          this.selectedOrganizationId = orgs[0].id;
        }
      },
      error: (err) => {
        console.error('Failed to load organizations', err);
      },
    });
  }

  openApproveModal(user: PendingUser): void {
    this.selectedUser = user;
    this.selectedRole = Role.VIEWER;
    this.showApproveModal = true;
    this.error = null;
  }

  openRejectModal(user: PendingUser): void {
    this.selectedUser = user;
    this.showRejectModal = true;
    this.error = null;
  }

  closeModals(): void {
    this.showApproveModal = false;
    this.showRejectModal = false;
    this.selectedUser = null;
  }

  approveUser(): void {
    if (!this.selectedUser || !this.selectedOrganizationId) return;

    this.loading = true;
    this.adminService.approveUser(this.selectedUser.id, {
      organizationId: this.selectedOrganizationId,
      role: this.selectedRole,
    }).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.closeModals();
        this.loadPendingUsers();
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to approve user';
        this.loading = false;
      },
    });
  }

  rejectUser(): void {
    if (!this.selectedUser) return;

    this.loading = true;
    this.adminService.rejectUser(this.selectedUser.id).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.closeModals();
        this.loadPendingUsers();
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to reject user';
        this.loading = false;
      },
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }
}
