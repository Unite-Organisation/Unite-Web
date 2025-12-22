import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { ConversationService } from '../chats.service';
import { GroupConversationRequest, PotentialContactResponse } from '../../models/api-models/chat.models';
import { ToastService } from '../../core/toast.service';
import { ErrorService } from '../../core/error.sevice';
import { PaginationParams } from '../../models/common/common.models';

@Component({
  selector: 'app-create-group-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCheckboxModule,
    MatPaginatorModule
  ],
  templateUrl: './create-group-dialog.html',
  styleUrl: './create-group-dialog.scss',
})
export class CreateGroupDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CreateGroupDialog>);
  private readonly conversationService = inject(ConversationService);
  private readonly toast = inject(ToastService);
  private readonly errorService = inject(ErrorService);

  protected isSubmitting = false;
  protected isLoadingUsers = false;
  protected users: PotentialContactResponse[] = [];
  protected selectedUserIds = new Set<string>();
  protected totalUsers = 0;

  protected pagination: PaginationParams = {
    page: 1,
    pageSize: 10,
  };

  readonly form: FormGroup = this.fb.group({
    name: this.fb.control('', { validators: [Validators.required, Validators.minLength(3)], nonNullable: true }),
  });

  get selectedCount(): number {
    return this.selectedUserIds.size;
  }

  get canCreateGroup(): boolean {
    return this.form.valid && this.selectedCount >= 2;
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.isLoadingUsers = true;
    this.conversationService.fetchUsersInArea(this.pagination)
      .pipe(finalize(() => (this.isLoadingUsers = false)))
      .subscribe({
        next: (users) => {
          this.users = users;
          // Note: If the API returns total count, update totalUsers accordingly
          // For now, we'll estimate based on results
          if (users.length === this.pagination.pageSize) {
            this.totalUsers = Math.max(this.totalUsers, (this.pagination.page) * this.pagination.pageSize + 1);
          } else {
            this.totalUsers = (this.pagination.page - 1) * this.pagination.pageSize + users.length;
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to load users', error);
          this.errorService.handleServerError(error);
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.pagination.page = event.pageIndex + 1;
    this.pagination.pageSize = event.pageSize;
    this.loadUsers();
  }

  isSelected(userId: string): boolean {
    return this.selectedUserIds.has(userId);
  }

  toggleSelection(userId: string): void {
    if (this.selectedUserIds.has(userId)) {
      this.selectedUserIds.delete(userId);
    } else {
      this.selectedUserIds.add(userId);
    }
  }

  submit(): void {
    if (!this.canCreateGroup) {
      if (!this.form.valid) {
        this.form.markAllAsTouched();
      }
      if (this.selectedCount < 2) {
        this.toast.error('You must select at least 2 people');
      }
      return;
    }

    const payload: GroupConversationRequest = {
      name: this.form.value.name,
      members: Array.from(this.selectedUserIds)
    };

    this.isSubmitting = true;
    this.conversationService.createGroupConversation(payload)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.toast.success('Group created successfully');
          this.dialogRef.close(true);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to create group', error);
          this.errorService.handleServerError(error);
        }
      });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  getFullName(user: PotentialContactResponse): string {
    return `${user.basicUserData.firstName} ${user.basicUserData.lastName}`;
  }

  getRoleLabel(role: string): string {
    const roleLabels: Record<string, string> = {
      'RESIDENT': 'Resident',
      'MANAGER': 'Manager',
      'ADMIN': 'Administrator'
    };
    return roleLabels[role] || role;
  }
}

