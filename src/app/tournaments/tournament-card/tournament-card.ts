import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  TournamentResponse,
  TournamentStatus,
  TournamentType
} from '../../models/api-models/tournament.models';

@Component({
  selector: 'tournament-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './tournament-card.html',
  styleUrl: './tournament-card.scss'
})
export class TournamentCard {
  @Input({ required: true }) tournament!: TournamentResponse;
  @Input() canJoin = false;
  @Input() canAddParticipants = false;
  @Input() isParticipant = false;
  @Input() isJoining = false;

  @Output() joinClick = new EventEmitter<void>();
  @Output() addParticipantsClick = new EventEmitter<void>();
  @Output() cardClick = new EventEmitter<void>();

  readonly TournamentStatus = TournamentStatus;

  get typeLabel(): string {
    const labels: Record<TournamentType, string> = {
      [TournamentType.TABLE_FOOTBALL]: 'Table Football',
      [TournamentType.TABLE_TENNIS]: 'Table Tennis',
      [TournamentType.CHESS]: 'Chess'
    };
    return labels[this.tournament.type] ?? this.tournament.type;
  }

  get typeIcon(): string {
    const icons: Record<TournamentType, string> = {
      [TournamentType.TABLE_FOOTBALL]: 'sports_soccer',
      [TournamentType.TABLE_TENNIS]: 'sports_tennis',
      [TournamentType.CHESS]: 'chess'
    };
    return icons[this.tournament.type] ?? 'emoji_events';
  }

  get statusLabel(): string {
    const labels: Record<TournamentStatus, string> = {
      [TournamentStatus.OPEN]: 'Open',
      [TournamentStatus.CLOSED]: 'In Progress',
      [TournamentStatus.FINISHED]: 'Finished'
    };
    return labels[this.tournament.status] ?? this.tournament.status;
  }

  get participantsLabel(): string {
    const count = this.tournament.participants.length;
    return `${count} participant${count === 1 ? '' : 's'}`;
  }

  get teamSizeLabel(): string {
    return `Team size: ${this.tournament.teamSize}`;
  }
}
