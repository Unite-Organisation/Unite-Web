import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URLS } from '../../core/api.config';
import {
  CreateTournamentRequest,
  TournamentDto,
  TournamentResponse,
  TournamentStatus
} from '../../models/api-models/tournament.models';

@Injectable({
  providedIn: 'root'
})
export class TournamentApiService {
  private readonly http = inject(HttpClient);

  getTournaments(status?: TournamentStatus): Observable<TournamentResponse[]> {
    const options = status
      ? { params: new HttpParams().set('status', status) }
      : {};

    return this.http.get<TournamentResponse[]>(API_URLS.tournament, options);
  }

  getTournament(tournamentId: string): Observable<TournamentDto> {
    return this.http.get<TournamentDto>(`${API_URLS.tournament}/${tournamentId}`);
  }

  createTournament(request: CreateTournamentRequest): Observable<void> {
    const params = new HttpParams()
      .set('name', request.name)
      .set('description', request.description)
      .set('teamSize', request.teamSize.toString())
      .set('type', request.type);

    return this.http.post<void>(API_URLS.tournament, null, { params });
  }

  addParticipants(tournamentId: string, userIds: string[]): Observable<void> {
    let params = new HttpParams().set('tournamentId', tournamentId);
    userIds.forEach((userId) => {
      params = params.append('userIds', userId);
    });

    return this.http.put<void>(API_URLS.tournament_add_participant, null, { params });
  }
}
