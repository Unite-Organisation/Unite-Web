import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { AddButton } from '../shared/add-button/add-button';
import { RolesService } from '../auth/services/roles.service';
import { AuthService } from '../auth/services/auth';
import { ErrorService } from '../core/error.sevice';
import { ToastService } from '../core/toast.service';
import { HomeService } from '../home/services/home.service';
import { ConversationService } from '../chats/chats.service';
import { TournamentApiService } from './services/tournament-api.service';
import { TournamentResponse, TournamentStatus } from '../models/api-models/tournament.models';
import { CreateTournamentDialog } from './create-tournament-dialog/create-tournament-dialog';
import { AddParticipantsDialog } from './add-participants-dialog/add-participants-dialog';
import { TournamentCard } from './tournament-card/tournament-card';

@Component({
  selector: 'app-tournaments',
  standalone: true,
  imports: [CommonModule, AddButton, MatDialogModule, MatIconModule, TournamentCard],
  templateUrl: './tournaments.html',
  styleUrl: './tournaments.scss'
})
export class Tournaments implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly rolesService = inject(RolesService);
  private readonly authService = inject(AuthService);
  private readonly homeService = inject(HomeService);
  private readonly conversationService = inject(ConversationService);
  private readonly tournamentApiService = inject(TournamentApiService);
  private readonly errorService = inject(ErrorService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  isLoading = false;
  tournaments: TournamentResponse[] = [];
  currentUserId: string | null = null;
  currentUsername: string | null = null;
  currentUserDisplayName: string | null = null;
  joiningTournamentIds = new Set<string>();

  get canCreateTournament(): boolean {
    return this.rolesService.isResident();
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadTournaments();
  }

  openCreateTournamentDialog(): void {
    const dialogRef = this.dialog.open(CreateTournamentDialog, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe((result: boolean | undefined) => {
      if (result) {
        this.loadTournaments();
      }
    });
  }

  openAddParticipantsDialog(tournament: TournamentResponse): void {
    if (!this.canAddParticipants(tournament)) {
      return;
    }

    const dialogRef = this.dialog.open(AddParticipantsDialog, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: { tournament }
    });

    dialogRef.afterClosed().subscribe((result: boolean | undefined) => {
      if (result) {
        this.loadTournaments();
      }
    });
  }

  joinTournament(tournament: TournamentResponse, event?: Event): void {
    event?.stopPropagation();

    if (!this.canJoin(tournament) || !this.currentUserId || this.joiningTournamentIds.has(tournament.id)) {
      return;
    }

    this.joiningTournamentIds.add(tournament.id);
    this.tournamentApiService.addParticipants(tournament.id, [this.currentUserId])
      .pipe(finalize(() => this.joiningTournamentIds.delete(tournament.id)))
      .subscribe({
        next: () => {
          this.toast.success('You have joined the tournament');
          this.loadTournaments();
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to join tournament', error);
          this.errorService.handleServerError(error);
        }
      });
  }

  isAuthor(tournament: TournamentResponse): boolean {
    return !!this.currentUserDisplayName &&
      tournament.authorDisplayName === this.currentUserDisplayName;
  }

  isParticipant(tournament: TournamentResponse): boolean {
    return !!this.currentUsername &&
      tournament.participants.some((participant) => participant.username === this.currentUsername);
  }

  canJoin(tournament: TournamentResponse): boolean {
    return tournament.status === TournamentStatus.OPEN && !this.isParticipant(tournament);
  }

  canAddParticipants(tournament: TournamentResponse): boolean {
    return tournament.status === TournamentStatus.OPEN && this.isAuthor(tournament);
  }

  openTournamentDetail(tournament: TournamentResponse): void {
    this.router.navigate(['/home/tournaments', tournament.id]);
  }

  isJoining(tournamentId: string): boolean {
    return this.joiningTournamentIds.has(tournamentId);
  }

  private loadCurrentUser(): void {
    this.currentUserId = this.authService.getStoredUserId();

    forkJoin({
      personalData: this.homeService.getPersonalData(),
      users: this.conversationService.fetchUsersInArea({ page: 1, pageSize: 100 })
    }).subscribe({
      next: ({ personalData, users }) => {
        this.currentUserId = personalData.userId || this.authService.getStoredUserId();
        this.currentUsername = personalData.username;

        const currentUser = users.find((user) => user.basicUserData.id === this.currentUserId);
        if (currentUser) {
          this.currentUserDisplayName =
            `${currentUser.basicUserData.firstName} ${currentUser.basicUserData.lastName}`;
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load current user data', error);
      }
    });
  }

  private loadTournaments(): void {
    this.isLoading = true;

    this.tournamentApiService.getTournaments().subscribe({
      next: (data) => {
        this.tournaments = data;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load tournaments', error);
        this.errorService.handleServerError(error);
        this.isLoading = false;
      }
    });
  }
}
