import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_URLS } from '../../core/api.config';
import { JobResponse, JobStatus } from '../../models/api-models/job.models';

@Injectable({
  providedIn: 'root'
})
export class JobApiService {
  private readonly http = inject(HttpClient);

  getJobs(status?: JobStatus | null): Observable<JobResponse[]> {
    let params = new HttpParams();
    if (status != null) {
      params = params.set('status', status);
    }
    return this.http.get<JobResponse[]>(API_URLS.jobs, { params });
  }

  rerunJob(id: string): Observable<JobStatus> {
    return this.http.post<JobStatus>(`${API_URLS.jobs}/${id}/rerun`, {});
  }

  rerunAllFailedJobs(): Observable<void> {
    return this.http
      .post(API_URLS.jobs_rerun_all, {}, { responseType: 'text' })
      .pipe(map(() => undefined));
  }
}
