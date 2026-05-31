import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { ConversationService } from '../../chats/chats.service';
import { PotentialContactResponse } from '../../models/api-models/chat.models';
import { TournamentResponse } from '../../models/api-models/tournament.models';
import { PaginationParams } from '../../models/common/common.models';
import { TournamentApiService } from '../services/tournament-api.service';
import { ToastService } from '../../core/toast.service';
import { ErrorService } from '../../core/error.sevice';

export interface AddParticipantsDialogData {
  tournament: TournamentResponse;
}

@Component({
  selector: 'app-add-participants-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './add-participants-dialog.html',
  styleUrl: './add-participants-dialog.scss'
})
export class AddParticipantsDialog implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<AddParticipantsDialog>);
  private readonly conversationService = inject(ConversationService);
  private readonly tournamentApiService = inject(TournamentApiService);
  private readonly toast = inject(ToastService);
  private readonly errorService = inject(ErrorService);
  protected readonly data = inject<AddParticipantsDialogData>(MAT_DIALOG_DATA);

  protected users: PotentialContactResponse[] = [];
  protected isLoadingUsers = false;
  protected isSubmitting = false;
  protected selectedUserIds = new Set<string>();
  protected totalUsers = 0;

  protected pagination: PaginationParams = {
    page: 1,
    pageSize: 10
  };

  get selectedCount(): number {
    return this.selectedUserIds.size;
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
          this.users = users.filter((user) => !this.isAlreadyParticipant(user));
          if (users.length === this.pagination.pageSize) {
            this.totalUsers = Math.max(this.totalUsers, this.pagination.page * this.pagination.pageSize + 1);
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

  private isAlreadyParticipant(user: PotentialContactResponse): boolean {
    const displayName = this.getFullName(user);
    return this.data.tournament.participants.some(
      (participant) => participant.displayName === displayName
    );
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

  getFullName(user: PotentialContactResponse): string {
    return `${user.basicUserData.firstName} ${user.basicUserData.lastName}`;
  }

  submit(): void {
    if (this.selectedCount === 0) {
      this.toast.error('Select at least one user');
      return;
    }

    this.isSubmitting = true;
    this.tournamentApiService.addParticipants(
      this.data.tournament.id,
      Array.from(this.selectedUserIds)
    )
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.toast.success('Participants added successfully');
          this.dialogRef.close(true);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to add participants', error);
          this.errorService.handleServerError(error);
        }
      });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
