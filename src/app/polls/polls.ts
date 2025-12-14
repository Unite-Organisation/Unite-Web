import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddButton } from '../shared/add-button/add-button';
import { CreatePollDialog } from './create-poll-dialog/create-poll-dialog';
import { RolesService } from '../auth/services/roles.service';
import { PollApiService } from './services/poll-api.service';
import { PollResponse } from '../models/api-models/poll.models';
import { ErrorService } from '../core/error.sevice';
import { PollCard } from './poll-card/poll-card';
import { PollDetailsDialog } from './poll-details-dialog/poll-details-dialog';

@Component({
  selector: 'app-polls',
  standalone: true,
  imports: [CommonModule, AddButton, MatDialogModule, PollCard],
  templateUrl: './polls.html',
  styleUrl: './polls.scss',
})
export class Polls implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly rolesService = inject(RolesService);
  private readonly pollApiService = inject(PollApiService);
  private readonly errorService = inject(ErrorService);

  isLoading = false;
  polls: PollResponse[] = [];

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
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load polls', error);
        this.errorService.handleServerError(error);
        this.isLoading = false;
      }
    });
  }
}


