import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PollResponse, PollTarget } from '../../models/api-models/poll.models';

@Component({
  selector: 'poll-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './poll-card.html',
  styleUrl: './poll-card.scss'
})
export class PollCard {
  @Input({ required: true }) poll!: PollResponse;
  
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

