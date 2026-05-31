import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  MatchDto,
  MatchStatus,
  RoundDto,
  TeamDto,
  TournamentDto
} from '../../models/api-models/tournament.models';

@Component({
  selector: 'tournament-bracket',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './tournament-bracket.html',
  styleUrl: './tournament-bracket.scss'
})
export class TournamentBracket {
  @Input({ required: true }) tournament!: TournamentDto;

  readonly MatchStatus = MatchStatus;
  private readonly matchUnitHeight = 88;

  get rounds(): RoundDto[] {
    return [...this.tournament.rounds].sort((a, b) => a.roundNumber - b.roundNumber);
  }

  get bracketHeight(): number {
    const firstRoundMatches = this.rounds[0]?.matches.length ?? 1;
    return firstRoundMatches * 2 * this.matchUnitHeight;
  }

  getMatchTop(roundIndex: number, matchIndex: number): number {
    const power = Math.pow(2, roundIndex);
    return matchIndex * power * 2 * this.matchUnitHeight + power * this.matchUnitHeight - this.matchUnitHeight;
  }

  getTeamLabel(team: TeamDto | null): string {
    if (!team) {
      return 'TBD';
    }

    return team.name || 'Unnamed team';
  }

  getMemberNames(team: TeamDto | null): string {
    if (!team?.members?.length) {
      return '';
    }

    return team.members.map((member) => member.username).join(', ');
  }

  isWinner(match: MatchDto, team: TeamDto | null): boolean {
    return !!team && !!match.winnerTeamId && match.winnerTeamId === team.id;
  }

  isLive(match: MatchDto): boolean {
    return match.status === MatchStatus.IN_PROGRESS;
  }

  getStatusLabel(status: MatchStatus | string): string {
    const labels: Record<string, string> = {
      [MatchStatus.PENDING]: 'Pending',
      [MatchStatus.SCHEDULED]: 'Scheduled',
      [MatchStatus.IN_PROGRESS]: 'Live',
      [MatchStatus.FINISHED]: 'Finished'
    };

    return labels[status] ?? status;
  }

  trackRound(_index: number, round: RoundDto): number {
    return round.roundNumber;
  }

  trackMatch(_index: number, match: MatchDto): string {
    return match.id;
  }
}
