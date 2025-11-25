import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserRegisterRequest } from '../models/auth.models';
import { API_URLS } from './api.config';

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private readonly http = inject(HttpClient);

  register(payload: UserRegisterRequest): Observable<void> {
    return this.http.post<void>(API_URLS.register, payload);
  }
}

