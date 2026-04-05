import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/services/auth';
import { AppRoles } from '../auth/commons/app.roles';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.hasRole(AppRoles.ADMIN)) {
    return true;
  }

  return router.createUrlTree(['/home']);
};
