import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserLoginRequest, UserRegisterRequest } from '../../models/auth-models/auth.models';
import { API_URLS } from '../../core/api.config';
import { TokenResponse } from '../../models/integration-models/integration.models';
import { PersonalData } from '../../models/api-models/personal-info.models';

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private readonly http = inject(HttpClient);

  register(payload: UserRegisterRequest): Observable<void> {
    return this.http.post<void>(API_URLS.register, payload);
  }

  login(payload: UserLoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(API_URLS.login, payload);
  }
}

