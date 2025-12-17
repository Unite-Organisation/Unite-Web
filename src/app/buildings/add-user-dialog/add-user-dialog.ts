import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { AreaApiService } from '../services/area-api.service';
import { BuildingResponse, ResidentToAdd } from '../../models/api-models/area.models';
import { ToastService } from '../../core/toast.service';
import { ErrorService } from '../../core/error.sevice';

export interface AddUserDialogData {
  building: BuildingResponse;
}

@Component({
  selector: 'app-add-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule
  ],
  templateUrl: './add-user-dialog.html',
  styleUrl: './add-user-dialog.scss'
})
export class AddUserDialog implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<AddUserDialog>);
  private readonly areaApiService = inject(AreaApiService);
  private readonly toast = inject(ToastService);
  private readonly errorService = inject(ErrorService);
  protected readonly data = inject<AddUserDialogData>(MAT_DIALOG_DATA);

  protected users: ResidentToAdd[] = [];
  protected isLoading = false;
  protected isSubmitting = false;
  protected selectedUserId: string | null = null;

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.isLoading = true;
    this.areaApiService.getUsersToAdd()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (users) => {
          this.users = users;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to load users', error);
          this.errorService.handleServerError(error);
        }
      });
  }

  selectUser(userId: string): void {
    this.selectedUserId = userId;
  }

  isSelected(userId: string): boolean {
    return this.selectedUserId === userId;
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  submit(): void {
    if (!this.selectedUserId) {
      this.toast.error('Please select a user');
      return;
    }

    this.isSubmitting = true;
    this.areaApiService.addUserToBuilding(this.data.building.id, this.selectedUserId)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.toast.success('User added to building successfully');
          this.dialogRef.close(true);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to add user to building', error);
          this.errorService.handleServerError(error);
        }
      });
  }
}








