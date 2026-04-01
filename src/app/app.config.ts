import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthInterceptor } from './core/auth-interceptor';
import { AuthService } from './auth/services/auth';
import { AuthRefreshService } from './core/auth-refresh.service';

function tryRestoreSessionFromRefreshCookie(): Promise<void> {
  const auth = inject(AuthService);
  const refreshService = inject(AuthRefreshService);
  if (auth.isLoggedIn()) {
    return Promise.resolve();
  }
  return refreshService
    .refreshAccessToken()
    .then(() => {})
    .catch(() => {});
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
              AuthInterceptor
      ])
    ),
    provideAnimations(),
    provideAppInitializer(tryRestoreSessionFromRefreshCookie),
  ]
};
