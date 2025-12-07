import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URLS } from '../../core/api.config';
import { AreaCreateRequest, BuildingResponse } from '../../models/api-models/area.models';

@Injectable({
  providedIn: 'root'
})
export class AreaApiService {
  private readonly http = inject(HttpClient);

  createArea(payload: AreaCreateRequest): Observable<void> {
    return this.http.post<void>(API_URLS.area, payload);
  }

  getBuildings(): Observable<BuildingResponse[]> {
    return this.http.get<BuildingResponse[]>(API_URLS.buildings);
  }
}


