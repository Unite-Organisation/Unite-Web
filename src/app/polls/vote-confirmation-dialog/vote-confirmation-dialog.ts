import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { PollOptionResponse } from '../../models/api-models/poll.models';

export interface VoteConfirmationData {
  pollTitle: string;
  selectedOption: PollOptionResponse;
}

@Component({
  selector: 'app-vote-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  templateUrl: './vote-confirmation-dialog.html',
  styleUrl: './vote-confirmation-dialog.scss',
})
export class VoteConfirmationDialog {
  private readonly dialogRef = inject(MatDialogRef<VoteConfirmationDialog>);
  protected readonly data = inject<VoteConfirmationData>(MAT_DIALOG_DATA);

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}

