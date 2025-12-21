import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { AddButton } from '../shared/add-button/add-button';
import { CreatePollDialog } from './create-poll-dialog/create-poll-dialog';
import { RolesService } from '../auth/services/roles.service';
import { PollApiService } from './services/poll-api.service';
import { PollResponse } from '../models/api-models/poll.models';
import { ErrorService } from '../core/error.sevice';
import { PollCard } from './poll-card/poll-card';
import { PollDetailsDialog } from './poll-details-dialog/poll-details-dialog';
import { IssueApiService } from '../issues/services/issue-api.service';
import { IssueResponse } from '../models/api-models/issue.models';
import { PollIssuesDialog, PollIssuesDialogData } from './poll-issues-dialog/poll-issues-dialog';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-polls',
  standalone: true,
  imports: [CommonModule, AddButton, MatDialogModule, PollCard, MatIconModule],
  templateUrl: './polls.html',
  styleUrl: './polls.scss',
})
export class Polls implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly rolesService = inject(RolesService);
  private readonly pollApiService = inject(PollApiService);
  private readonly issueApiService = inject(IssueApiService);
  private readonly errorService = inject(ErrorService);

  isLoading = false;
  polls: PollResponse[] = [];
  pollIssuesMap: Map<string, IssueResponse[]> = new Map();

  get canCreatePoll(): boolean {
    return this.rolesService.isManager() || this.rolesService.isAdmin();
  }

  ngOnInit(): void {
    this.loadPolls();
  }

  openCreatePollDialog(): void {
    const dialogRef = this.dialog.open(CreatePollDialog, {
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe((result: boolean | undefined) => {
      if (result) {
        this.loadPolls();
      }
    });
  }

  canOpenPollDetails(poll: PollResponse): boolean {
    // Allow opening if poll is finished (to see results) or if user hasn't voted yet
    return poll.finished || poll.userVoted !== true;
  }

  openPollDetails(poll: PollResponse): void {
    // Don't open if user already voted and poll is not finished
    if (!this.canOpenPollDetails(poll)) {
      return;
    }

    const dialogRef = this.dialog.open(PollDetailsDialog, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: poll
    });

    dialogRef.afterClosed().subscribe((result: boolean | undefined) => {
      if (result) {
        this.loadPolls();
      }
    });
  }

  private loadPolls(): void {
    this.isLoading = true;
    this.pollApiService.getPolls({
      pageSize: 20,
      page: 1
    }).subscribe({
      next: (data) => {
        this.polls = data;
        this.isLoading = false;
        // Load issues for all polls
        this.loadPollIssues();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load polls', error);
        this.errorService.handleServerError(error);
        this.isLoading = false;
      }
    });
  }

  private loadPollIssues(): void {
    // Load issues for all polls in parallel
    const issueRequests = this.polls.map(poll =>
      this.issueApiService.getPollIssues(poll.id)
    );

    if (issueRequests.length === 0) {
      return;
    }

    forkJoin(issueRequests).subscribe({
      next: (issuesArrays) => {
        this.pollIssuesMap.clear();
        this.polls.forEach((poll, index) => {
          const issues = issuesArrays[index];
          if (issues && issues.length > 0) {
            this.pollIssuesMap.set(poll.id, issues);
          }
        });
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load poll issues', error);
        // Don't show error to user, just log it
      }
    });
  }

  hasIssues(pollId: string): boolean {
    return this.pollIssuesMap.has(pollId) && 
           (this.pollIssuesMap.get(pollId)?.length ?? 0) > 0;
  }

  getIssuesCount(pollId: string): number {
    return this.pollIssuesMap.get(pollId)?.length ?? 0;
  }

  openPollIssuesDialog(poll: PollResponse, event: Event): void {
    event.stopPropagation(); // Prevent opening poll details
    const issues = this.pollIssuesMap.get(poll.id) || [];
    
    const dialogData: PollIssuesDialogData = {
      pollTitle: poll.title,
      issues: issues
    };

    const dialogRef = this.dialog.open(PollIssuesDialog, {
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe();
  }
}


