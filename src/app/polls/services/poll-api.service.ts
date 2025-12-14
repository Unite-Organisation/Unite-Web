import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URLS } from '../../core/api.config';
import { PollRequest, PollResponse, PollStatus, PollResult } from '../../models/api-models/poll.models';
import { PaginationParams } from '../../models/common/common.models';

export interface PollsQueryParams extends PaginationParams {
  pollStatus?: PollStatus;
}

@Injectable({
  providedIn: 'root'
})
export class PollApiService {
  private readonly http = inject(HttpClient);

  createPoll(payload: PollRequest): Observable<void> {
    return this.http.post<void>(API_URLS.polls, payload);
  }

  getPolls(params: PollsQueryParams): Observable<PollResponse[]> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('pageSize', params.pageSize.toString());
    httpParams = httpParams.append('page', params.page.toString());
    
    if (params.pollStatus) {
      httpParams = httpParams.append('pollStatus', params.pollStatus);
    }

    return this.http.get<PollResponse[]>(API_URLS.polls, { params: httpParams });
  }

  vote(pollId: string, voteId: string): Observable<void> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('poll', pollId);
    httpParams = httpParams.append('vote', voteId);

    return this.http.put<void>(API_URLS.polls + '/vote', null, { params: httpParams });
  }

  getPollResult(pollId: string): Observable<PollResult> {
    const httpParams = new HttpParams().append('pollId', pollId);
    return this.http.get<PollResult>(API_URLS.polls + '/result', { params: httpParams });
  }
}

