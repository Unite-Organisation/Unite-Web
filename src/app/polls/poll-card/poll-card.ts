import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PollResponse, PollTarget } from '../../models/api-models/poll.models';

@Component({
  selector: 'poll-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './poll-card.html',
  styleUrl: './poll-card.scss'
})
export class PollCard {
  @Input({ required: true }) poll!: PollResponse;
  @Input() hasIssues: boolean = false;
  @Input() issuesCount: number = 0;
  @Output() issueClick = new EventEmitter<Event>();
  
  readonly PollTarget = PollTarget;
  
  get isVoted(): boolean {
    return this.poll.userVoted === true;
  }

  get isFinished(): boolean {
    return this.poll.finished === true;
  }

  get targetLabel(): string {
    return this.poll.target === PollTarget.AREA ? 'Area-wide' : 'Building';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

