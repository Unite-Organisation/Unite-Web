import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { PollResponse, PollTarget, PollResult } from '../../models/api-models/poll.models';
import { PollApiService } from '../services/poll-api.service';
import { ToastService } from '../../core/toast.service';
import { ErrorService } from '../../core/error.sevice';
import { VoteConfirmationDialog, VoteConfirmationData } from '../vote-confirmation-dialog/vote-confirmation-dialog';

@Component({
  selector: 'app-poll-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    FormsModule
  ],
  templateUrl: './poll-details-dialog.html',
  styleUrl: './poll-details-dialog.scss',
})
export class PollDetailsDialog implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<PollDetailsDialog>);
  private readonly dialog = inject(MatDialog);
  private readonly pollApiService = inject(PollApiService);
  private readonly toast = inject(ToastService);
  private readonly errorService = inject(ErrorService);
  protected readonly poll = inject<PollResponse>(MAT_DIALOG_DATA);

  selectedOptionId: string | null = null;
  isSubmitting = false;
  isLoadingResults = false;
  pollResult: PollResult | null = null;

  readonly PollTarget = PollTarget;

  get targetLabel(): string {
    return this.poll.target === PollTarget.AREA ? 'Area-wide' : 'Building';
  }

  get isFinished(): boolean {
    return this.poll.finished === true;
  }

  ngOnInit(): void {
    // If poll is finished, load results
    if (this.isFinished) {
      this.loadPollResults();
    } else if (this.poll.userVoted === true) {
      // Don't allow interaction if user already voted and poll is not finished
      this.dialogRef.close();
    }
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isPollActive(): boolean {
    const now = new Date();
    const startTime = new Date(this.poll.pollStartTime);
    const endTime = new Date(this.poll.pollEndTime);
    return now >= startTime && now <= endTime && !this.isFinished;
  }

  canVote(): boolean {
    return !this.isFinished && !this.poll.userVoted && this.isPollActive() && this.selectedOptionId !== null && !this.isSubmitting;
  }

  private loadPollResults(): void {
    this.isLoadingResults = true;
    this.pollApiService.getPollResult(this.poll.id)
      .pipe(finalize(() => (this.isLoadingResults = false)))
      .subscribe({
        next: (result) => {
          this.pollResult = result;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to load poll results', error);
          this.errorService.handleServerError(error);
        }
      });
  }

  getOptionPercentage(optionId: string): number {
    if (!this.pollResult) return 0;
    const percentage = this.pollResult.sortedPercentageShareOfVotes.find(p => p.optionId === optionId);
    return percentage ? percentage.percentageShare : 0;
  }

  getOptionVoteCount(optionId: string): number {
    if (!this.pollResult) return 0;
    const voteCount = this.pollResult.sortedVotes.find(v => v.optionId === optionId);
    return voteCount ? voteCount.count : 0;
  }

  isWinner(optionId: string): boolean {
    if (!this.pollResult) return false;
    return this.pollResult.winners.some(w => w.optionId === optionId);
  }

  submitVote(): void {
    if (!this.canVote() || !this.selectedOptionId) {
      return;
    }

    // Find selected option
    const selectedOption = this.poll.options.find(opt => opt.id === this.selectedOptionId);
    if (!selectedOption) {
      return;
    }

    // Show confirmation dialog
    const confirmationData: VoteConfirmationData = {
      pollTitle: this.poll.title,
      selectedOption: selectedOption
    };

    const confirmationDialog = this.dialog.open(VoteConfirmationDialog, {
      width: '450px',
      maxWidth: '90vw',
      data: confirmationData
    });

    confirmationDialog.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.performVote();
      }
    });
  }

  private performVote(): void {
    if (!this.selectedOptionId) {
      return;
    }

    this.isSubmitting = true;
    this.pollApiService.vote(this.poll.id, this.selectedOptionId)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.toast.success('Your vote has been submitted successfully');
          this.dialogRef.close(true);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to submit vote', error);
          this.errorService.handleServerError(error);
        }
      });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}

