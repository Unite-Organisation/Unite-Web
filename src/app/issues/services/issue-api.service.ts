import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URLS } from '../../core/api.config';
import { IssueRequest, IssueResponse } from '../../models/api-models/issue.models';

@Injectable({
  providedIn: 'root'
})
export class IssueApiService {
  private readonly http = inject(HttpClient);

  createIssue(payload: IssueRequest): Observable<void> {
    return this.http.post<void>(API_URLS.issue, payload);
  }

  getBuildingIssues(buildingId: string): Observable<IssueResponse[]> {
    const params = new HttpParams().set('buildingId', buildingId);
    return this.http.get<IssueResponse[]>(API_URLS.building_issues, { params });
  }

  getAreaIssues(areaId: string): Observable<IssueResponse[]> {
    const params = new HttpParams().set('areaId', areaId);
    return this.http.get<IssueResponse[]>(API_URLS.area_issues, { params });
  }

  getFacilityIssues(facilityId: string): Observable<IssueResponse[]> {
    const params = new HttpParams().set('facilityId', facilityId);
    return this.http.get<IssueResponse[]>(API_URLS.facility_issues, { params });
  }

  getPollIssues(pollId: string): Observable<IssueResponse[]> {
    const params = new HttpParams().set('pollId', pollId);
    return this.http.get<IssueResponse[]>(API_URLS.poll_issues, { params });
  }
}

