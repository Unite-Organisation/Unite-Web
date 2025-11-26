import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URLS } from '../../core/api.config';
import { PersonalData } from '../../models/api-models/personal-info.models';

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private readonly http = inject(HttpClient);

  getPersonalData(): Observable<PersonalData> {
    return this.http.get<PersonalData>(API_URLS.personal_data);
  }
}
