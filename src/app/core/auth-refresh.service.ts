import { HttpBackend, HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/services/auth';
import { API_URLS } from './api.config';
import { TokenResponse } from '../models/integration-models/integration.models';

/**
 * Calls POST /auth/refresh with credentials so the httpOnly refresh cookie is sent.
 * Uses HttpBackend-backed HttpClient so this request does not pass through interceptors.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthRefreshService {
  private readonly authService = inject(AuthService);
  private readonly http = new HttpClient(inject(HttpBackend));

  private refreshInFlight: Promise<string> | null = null;

  refreshAccessToken(): Promise<string> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    this.refreshInFlight = firstValueFrom(
      this.http.post<TokenResponse>(API_URLS.refresh, {}, { withCredentials: true })
    )
      .then((res) => {
        if (!res?.accessToken) {
          throw new Error('Refresh response missing accessToken');
        }
        this.authService.saveToken(res.accessToken);
        return res.accessToken;
      })
      .finally(() => {
        this.refreshInFlight = null;
      });

    return this.refreshInFlight;
  }
}
