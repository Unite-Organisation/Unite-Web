import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URLS } from '../../core/api.config';
import { AreaCreateRequest, BuildingResponse, ResidentToAdd } from '../../models/api-models/area.models';

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

  getUsersToAdd(): Observable<ResidentToAdd[]> {
    return this.http.get<ResidentToAdd[]>(API_URLS.users_to_add);
  }

  addUserToBuilding(buildingId: string, userId: string): Observable<void> {
    const params = new HttpParams()
      .set('buildingId', buildingId)
      .set('userId', userId);
    return this.http.put<void>(API_URLS.add_user_to_building, null, { params });
  }
}


