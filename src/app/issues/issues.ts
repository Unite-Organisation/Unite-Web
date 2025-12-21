import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IssueApiService } from './services/issue-api.service';
import { NotificationResponse, IssueProcessingStatus, IssuePriority, IssueObject, IssueSimpleResponse } from '../models/api-models/issue.models';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorService } from '../core/error.sevice';
import { ToastService } from '../core/toast.service';
import { RolesService } from '../auth/services/roles.service';

@Component({
  selector: 'app-issues',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './issues.html',
  styleUrl: './issues.scss'
})
export class Issues implements OnInit {
  private readonly issueApiService = inject(IssueApiService);
  private readonly errorService = inject(ErrorService);
  private readonly toastService = inject(ToastService);
  protected readonly rolesService = inject(RolesService);

  // Manager data
  notifications: NotificationResponse[] = [];
  processingIds = new Set<string>();

  // Resident data
  userIssues: IssueSimpleResponse[] = [];

  isLoading = true;

  ngOnInit(): void {
    if (this.rolesService.isManager()) {
      this.loadNotifications();
    } else {
      this.loadUserIssues();
    }
  }

  // ============ MANAGER METHODS ============

  loadNotifications(): void {
    this.isLoading = true;
    this.issueApiService.getManagerNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load notifications', error);
        this.errorService.handleServerError(error);
        this.isLoading = false;
      }
    });
  }

  markAsSeen(notification: NotificationResponse): void {
    this.processingIds.add(notification.notificationId);
    
    this.issueApiService.markNotificationAsSeen(notification.notificationId).subscribe({
      next: () => {
        notification.issueStatus = IssueProcessingStatus.SEEN_BY_RECIPIENT;
        this.processingIds.delete(notification.notificationId);
        this.toastService.success('Issue marked as seen');
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to mark notification as seen', error);
        this.errorService.handleServerError(error);
        this.processingIds.delete(notification.notificationId);
      }
    });
  }

  updateStatus(notification: NotificationResponse, status: 'TAKEN_ACTION' | 'RESOLVED'): void {
    this.processingIds.add(notification.notificationId);
    
    const statusEnum = status === 'TAKEN_ACTION' 
      ? IssueProcessingStatus.TAKEN_ACTION 
      : IssueProcessingStatus.RESOLVED;

    this.issueApiService.updateIssueStatus(notification.issueId, statusEnum).subscribe({
      next: () => {
        notification.issueStatus = statusEnum;
        this.processingIds.delete(notification.notificationId);
        const statusLabel = status === 'TAKEN_ACTION' ? 'Taken Action' : 'Resolved';
        this.toastService.success(`Issue status updated to ${statusLabel}`);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to update issue status', error);
        this.errorService.handleServerError(error);
        this.processingIds.delete(notification.notificationId);
      }
    });
  }

  // ============ RESIDENT METHODS ============

  loadUserIssues(): void {
    this.isLoading = true;
    this.issueApiService.getUserIssues().subscribe({
      next: (data) => {
        this.userIssues = data;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load user issues', error);
        this.errorService.handleServerError(error);
        this.isLoading = false;
      }
    });
  }

  // ============ DISPLAY HELPERS ============

  getObjectIcon(issueObject: IssueObject): string {
    switch (issueObject) {
      case IssueObject.BUILDING: return 'business';
      case IssueObject.AREA: return 'location_city';
      case IssueObject.FACILITY: return 'apartment';
      case IssueObject.POLL: return 'how_to_vote';
      default: return 'report_problem';
    }
  }

  getObjectClass(issueObject: IssueObject): string {
    return issueObject.toLowerCase();
  }

  getPriorityClass(priority: IssuePriority): string {
    return priority.toLowerCase();
  }

  getStatusClass(status: IssueProcessingStatus): string {
    switch (status) {
      case IssueProcessingStatus.SUBMITTED: return 'submitted';
      case IssueProcessingStatus.SEEN_BY_RECIPIENT: return 'seen';
      case IssueProcessingStatus.TAKEN_ACTION: return 'taken-action';
      case IssueProcessingStatus.RESOLVED: return 'resolved';
      case IssueProcessingStatus.CLOSED: return 'closed';
      default: return '';
    }
  }

  getStatusLabel(status: IssueProcessingStatus): string {
    switch (status) {
      case IssueProcessingStatus.SUBMITTED: return 'Submitted';
      case IssueProcessingStatus.SEEN_BY_RECIPIENT: return 'Seen by Manager';
      case IssueProcessingStatus.TAKEN_ACTION: return 'In Progress';
      case IssueProcessingStatus.RESOLVED: return 'Resolved';
      case IssueProcessingStatus.CLOSED: return 'Closed';
      default: return status;
    }
  }

  getPriorityLabel(priority: IssuePriority): string {
    switch (priority) {
      case IssuePriority.LOW: return 'Low';
      case IssuePriority.MEDIUM: return 'Medium';
      case IssuePriority.HIGH: return 'High';
      case IssuePriority.URGENT: return 'Urgent';
      default: return priority;
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
}
