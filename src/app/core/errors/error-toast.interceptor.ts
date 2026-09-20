import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { parseApiError } from './api-error.parser';
import { AUTH_FAILURE_HANDLED, HANDLED_ERROR_CODES, SKIP_ERROR_TOAST } from './error-context';
import { ErrorNotifier } from './error-notifier.service';


export const errorToastInterceptor: HttpInterceptorFn = (req, next) => {
  const notifier = inject(ErrorNotifier);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      const context = req.context;
      if (context.get(SKIP_ERROR_TOAST) || context.get(AUTH_FAILURE_HANDLED)) {
        return throwError(() => error);
      }

      notifier.notify(parseApiError(error), context.get(HANDLED_ERROR_CODES));

      return throwError(() => error);
    })
  );
};
