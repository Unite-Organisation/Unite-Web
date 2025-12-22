import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IssueResponse, IssuePriority, IssueProcessingStatus } from '../../models/api-models/issue.models';

@Component({
  selector: 'issue-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './issue-card.html',
  styleUrl: './issue-card.scss'
})
export class IssueCard {
  @Input({ required: true }) issue!: IssueResponse;
  @Input() issueType: 'BUILDING' | 'AREA' | 'FACILITY' = 'BUILDING';

  getPriorityColor(): string {
    switch (this.issue.priority) {
      case IssuePriority.URGENT:
        return '#ef4444'; // red
      case IssuePriority.HIGH:
        return '#f59e0b'; // orange
      case IssuePriority.MEDIUM:
        return '#3b82f6'; // blue
      case IssuePriority.LOW:
        return '#10b981'; // green
      default:
        return '#6b7280'; // gray
    }
  }

  getStatusColor(): string {
    switch (this.issue.status) {
      case IssueProcessingStatus.SUBMITTED:
        return '#6b7280'; // gray
      case IssueProcessingStatus.SEEN_BY_RECIPIENT:
        return '#3b82f6'; // blue
      case IssueProcessingStatus.TAKEN_ACTION:
        return '#f59e0b'; // orange
      case IssueProcessingStatus.RESOLVED:
        return '#10b981'; // green
      case IssueProcessingStatus.CLOSED:
        return '#374151'; // dark gray
      default:
        return '#6b7280';
    }
  }

  getStatusLabel(): string {
    switch (this.issue.status) {
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
        return this.issue.status;
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

  getRecipientName(): string {
    if (this.issue.recipient) {
      return `${this.issue.recipient.firstName} ${this.issue.recipient.lastName}`;
    }
    return 'Unknown';
  }

  getIssuerName(): string {
    if (this.issue.issuer) {
      return `${this.issue.issuer.firstName} ${this.issue.issuer.lastName}`;
    }
    return 'Unknown';
  }
}

