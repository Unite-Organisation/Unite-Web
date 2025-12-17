import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URLS } from '../../core/api.config';
import { BuildingFacilitiesResponse, FacilityRequest, FacilityReservation, ReservationRequest, ReserveResponse } from '../../models/api-models/facility.models';

@Injectable({
  providedIn: 'root'
})
export class FacilityApiService {
  private readonly http = inject(HttpClient);

  getFacilities(): Observable<BuildingFacilitiesResponse> {
    return this.http.get<BuildingFacilitiesResponse>(API_URLS.facility);
  }

  createFacilities(payload: FacilityRequest): Observable<void> {
    return this.http.post<void>(API_URLS.create_facilities, payload);
  }

  getAvailability(facilityId: string): Observable<FacilityReservation[]> {
    return this.http.get<FacilityReservation[]>(`${API_URLS.facility}/${facilityId}`);
  }

  reserveFacility(payload: ReservationRequest): Observable<ReserveResponse> {
    return this.http.post<ReserveResponse>(API_URLS.facility_reserve, payload);
  }
}

