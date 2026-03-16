import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService, PendingUser, Organization, RoleTemplate } from '../../../core/services/admin.service';
import { Permission, Role, RolePermissions } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './approvals.component.html',
})
export class ApprovalsComponent implements OnInit {
  pendingUsers: PendingUser[] = [];
  organizations: Organization[] = [];
  roleTemplates: RoleTemplate[] = [];
  roles = [Role.VIEWER, Role.ADMIN, Role.OWNER];
  permissions = Object.values(Permission);
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  roleTemplateLoading = false;
  roleTemplateError: string | null = null;
  roleTemplateSuccess: string | null = null;

  // Modal state
  showApproveModal = false;
  showRejectModal = false;
  selectedUser: PendingUser | null = null;
  selectedOrganizationId = '';
  selectedRole: Role = Role.VIEWER;
  selectedRoleTemplateId = '';
  roleTemplateForm = {
    id: '',
    name: '',
    description: '',
    baseRole: Role.VIEWER,
    permissions: [] as Permission[],
  };

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
          this.loadRoleTemplates();
        }
      },
      error: (err) => {
        console.error('Failed to load organizations', err);
      },
    });
  }

  loadRoleTemplates(): void {
    if (!this.selectedOrganizationId) {
      this.roleTemplates = [];
      return;
    }
    this.adminService.getRoleTemplates(this.selectedOrganizationId).subscribe({
      next: (templates) => {
        this.roleTemplates = templates;
        this.resetRoleTemplateSelection();
      },
      error: (err) => {
        console.error('Failed to load role templates', err);
        this.roleTemplates = [];
      },
    });
  }

  openApproveModal(user: PendingUser): void {
    this.selectedUser = user;
    this.selectedRole = Role.VIEWER;
    this.selectedRoleTemplateId = '';
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
      roleTemplateId: this.selectedRoleTemplateId || undefined,
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

  getTemplatesForRole(role: Role): RoleTemplate[] {
    return this.roleTemplates.filter((template) => template.baseRole === role);
  }

  onOrganizationChange(): void {
    this.loadRoleTemplates();
  }

  onRoleChange(): void {
    this.resetRoleTemplateSelection();
  }

  startCreateRoleTemplate(): void {
    this.roleTemplateForm = {
      id: '',
      name: '',
      description: '',
      baseRole: Role.VIEWER,
      permissions: [],
    };
    this.roleTemplateError = null;
  }

  startEditRoleTemplate(template: RoleTemplate): void {
    this.roleTemplateForm = {
      id: template.id,
      name: template.name,
      description: template.description || '',
      baseRole: template.baseRole,
      permissions: [...template.permissions],
    };
    this.roleTemplateError = null;
  }

  saveRoleTemplate(): void {
    if (!this.selectedOrganizationId) {
      this.roleTemplateError = 'Select an organization first.';
      return;
    }

    const name = this.roleTemplateForm.name.trim();
    if (!name) {
      this.roleTemplateError = 'Template name is required.';
      return;
    }

    if (this.roleTemplateForm.permissions.length === 0) {
      this.roleTemplateError = 'Select at least one permission.';
      return;
    }

    this.roleTemplateLoading = true;
    this.roleTemplateError = null;

    const descriptionValue = this.roleTemplateForm.description.trim();
    const isEditing = Boolean(this.roleTemplateForm.id);

    if (isEditing) {
      this.adminService.updateRoleTemplate(this.roleTemplateForm.id, {
        name,
        description: descriptionValue,
        baseRole: this.roleTemplateForm.baseRole,
        permissions: this.roleTemplateForm.permissions,
      }).subscribe({
        next: () => {
          this.roleTemplateSuccess = 'Role template updated.';
          this.roleTemplateLoading = false;
          this.loadRoleTemplates();
          setTimeout(() => this.roleTemplateSuccess = null, 3000);
        },
        error: (err) => {
          this.roleTemplateError = err.error?.message || 'Failed to update role template.';
          this.roleTemplateLoading = false;
        },
      });
      return;
    }

    this.adminService.createRoleTemplate({
      organizationId: this.selectedOrganizationId,
      name,
      description: descriptionValue || undefined,
      baseRole: this.roleTemplateForm.baseRole,
      permissions: this.roleTemplateForm.permissions,
    }).subscribe({
      next: () => {
        this.roleTemplateSuccess = 'Role template created.';
        this.roleTemplateLoading = false;
        this.startCreateRoleTemplate();
        this.loadRoleTemplates();
        setTimeout(() => this.roleTemplateSuccess = null, 3000);
      },
      error: (err) => {
        this.roleTemplateError = err.error?.message || 'Failed to create role template.';
        this.roleTemplateLoading = false;
      },
    });
  }

  deleteRoleTemplate(template: RoleTemplate): void {
    if (!confirm(`Delete the "${template.name}" role template?`)) {
      return;
    }

    this.roleTemplateLoading = true;
    this.adminService.deleteRoleTemplate(template.id).subscribe({
      next: () => {
        this.roleTemplateSuccess = 'Role template deleted.';
        this.roleTemplateLoading = false;
        if (this.roleTemplateForm.id === template.id) {
          this.startCreateRoleTemplate();
        }
        this.loadRoleTemplates();
        setTimeout(() => this.roleTemplateSuccess = null, 3000);
      },
      error: (err) => {
        this.roleTemplateError = err.error?.message || 'Failed to delete role template.';
        this.roleTemplateLoading = false;
      },
    });
  }

  togglePermission(permission: Permission): void {
    const permissions = this.roleTemplateForm.permissions;
    const index = permissions.indexOf(permission);
    if (index >= 0) {
      permissions.splice(index, 1);
    } else {
      permissions.push(permission);
    }
  }

  loadDefaultPermissions(): void {
    this.roleTemplateForm.permissions = [
      ...(RolePermissions[this.roleTemplateForm.baseRole] || []),
    ];
  }

  formatPermission(permission: Permission): string {
    const [resource, action] = permission.split(':');
    const resourceLabel = resource.charAt(0).toUpperCase() + resource.slice(1);
    const actionLabel = action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return `${resourceLabel} ${actionLabel}`;
  }

  isPermissionSelected(permission: Permission): boolean {
    return this.roleTemplateForm.permissions.includes(permission);
  }

  private resetRoleTemplateSelection(): void {
    const matching = this.getTemplatesForRole(this.selectedRole);
    if (!matching.find((template) => template.id === this.selectedRoleTemplateId)) {
      this.selectedRoleTemplateId = '';
    }
  }
}
