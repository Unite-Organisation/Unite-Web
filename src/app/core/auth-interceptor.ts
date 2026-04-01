import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpStatusCode,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, from, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/services/auth';
import { AuthRefreshService } from './auth-refresh.service';
import { API_URLS } from './api.config';

/** Prevents infinite retry when the retried request still returns 401. */
const AUTH_RETRY_HEADER = 'X-Auth-Retry';

function normalizeUrl(url: string): string {
  const withoutQuery = url.split('?')[0];
  return withoutQuery.endsWith('/') && withoutQuery.length > 1
    ? withoutQuery.slice(0, -1)
    : withoutQuery;
}

function shouldSkip401Refresh(url: string): boolean {
  const n = normalizeUrl(url);
  const skip = new Set([
    normalizeUrl(API_URLS.login),
    normalizeUrl(API_URLS.register),
    normalizeUrl(API_URLS.logout),
    normalizeUrl(API_URLS.refresh),
  ]);
  return skip.has(n);
}

export const AuthInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const refreshService = inject(AuthRefreshService);
  const router = inject(Router);

  let outgoing: HttpRequest<unknown> = req;
  if (req.url.startsWith(environment.apiUrl) && !req.withCredentials) {
    outgoing = req.clone({ withCredentials: true });
  }

  const token = authService.getToken();
  let authReq = outgoing;
  if (token != null) {
    authReq = outgoing.clone({
      headers: outgoing.headers.set('Authorization', `Bearer ${token}`),
    });
  }

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }
      if (error.status !== HttpStatusCode.Unauthorized) {
        return throwError(() => error);
      }
      if (authReq.headers.has(AUTH_RETRY_HEADER)) {
        return throwError(() => error);
      }
      if (shouldSkip401Refresh(req.url)) {
        return throwError(() => error);
      }

      return from(refreshService.refreshAccessToken()).pipe(
        switchMap((newToken) =>
          next(
            authReq.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
                [AUTH_RETRY_HEADER]: '1',
              },
            })
          )
        ),
        catchError((refreshError) => {
          authService.logout();
          router.navigateByUrl('/login');
          return throwError(() => refreshError);
        })
      );
    })
  );
};
