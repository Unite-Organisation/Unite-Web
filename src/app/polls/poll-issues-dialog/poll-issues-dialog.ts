import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IssueResponse, IssuePriority, IssueProcessingStatus } from '../../models/api-models/issue.models';

export interface PollIssuesDialogData {
  pollTitle: string;
  issues: IssueResponse[];
}

@Component({
  selector: 'app-poll-issues-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './poll-issues-dialog.html',
  styleUrl: './poll-issues-dialog.scss',
})
export class PollIssuesDialog {
  private readonly dialogRef = inject(MatDialogRef<PollIssuesDialog>);
  protected readonly data = inject<PollIssuesDialogData>(MAT_DIALOG_DATA);

  getPriorityColor(priority: IssuePriority): string {
    switch (priority) {
      case IssuePriority.URGENT:
        return '#ef4444';
      case IssuePriority.HIGH:
        return '#f59e0b';
      case IssuePriority.MEDIUM:
        return '#3b82f6';
      case IssuePriority.LOW:
        return '#10b981';
      default:
        return '#6b7280';
    }
  }

  getStatusColor(status: IssueProcessingStatus): string {
    switch (status) {
      case IssueProcessingStatus.SUBMITTED:
        return '#6b7280';
      case IssueProcessingStatus.SEEN_BY_RECIPIENT:
        return '#3b82f6';
      case IssueProcessingStatus.TAKEN_ACTION:
        return '#f59e0b';
      case IssueProcessingStatus.RESOLVED:
        return '#10b981';
      case IssueProcessingStatus.CLOSED:
        return '#374151';
      default:
        return '#6b7280';
    }
  }

  getStatusLabel(status: IssueProcessingStatus): string {
    switch (status) {
      case IssueProcessingStatus.SUBMITTED:
        return 'Submitted';
      case IssueProcessingStatus.SEEN_BY_RECIPIENT:
        return 'Seen';
      case IssueProcessingStatus.TAKEN_ACTION:
        return 'In Progress';
      case IssueProcessingStatus.RESOLVED:
        return 'Resolved';
      case IssueProcessingStatus.CLOSED:
        return 'Closed';
      default:
        return status;
    }
  }

  formatDate(dateString: string | null): string {
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

  getRecipientName(issue: IssueResponse): string {
    if (issue.recipient) {
      return `${issue.recipient.firstName} ${issue.recipient.lastName}`;
    }
    return 'Unknown';
  }

  close(): void {
    this.dialogRef.close();
  }
}

