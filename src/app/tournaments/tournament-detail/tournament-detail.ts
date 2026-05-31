import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TournamentApiService } from '../services/tournament-api.service';
import { TournamentDto } from '../../models/api-models/tournament.models';
import { ErrorService } from '../../core/error.sevice';
import { TournamentBracket } from '../tournament-bracket/tournament-bracket';

@Component({
  selector: 'app-tournament-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TournamentBracket
  ],
  templateUrl: './tournament-detail.html',
  styleUrl: './tournament-detail.scss'
})
export class TournamentDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tournamentApiService = inject(TournamentApiService);
  private readonly errorService = inject(ErrorService);

  isLoading = false;
  tournament: TournamentDto | null = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const tournamentId = params.get('id');
      if (tournamentId) {
        this.loadTournament(tournamentId);
      }
    });
  }

  get hasBracket(): boolean {
    return !!this.tournament?.rounds?.length &&
      this.tournament.rounds.some((round) => round.matches.length > 0);
  }

  private loadTournament(tournamentId: string): void {
    this.isLoading = true;
    this.tournament = null;

    this.tournamentApiService.getTournament(tournamentId).subscribe({
      next: (data) => {
        this.tournament = data;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load tournament', error);
        this.errorService.handleServerError(error);
        this.isLoading = false;
      }
    });
  }
}
