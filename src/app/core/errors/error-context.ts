import { HttpContext, HttpContextToken } from '@angular/common/http';
import { AnyErrorCode } from './api-error.model';

/** Suppresses the global toast entirely — the caller reports the failure itself. */
export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

/**
 * Codes the caller renders itself (inline form errors, empty states). Any other
 * code in the same response is still toasted.
 */
export const HANDLED_ERROR_CODES = new HttpContextToken<readonly AnyErrorCode[]>(() => []);

/**
 * Set by AuthInterceptor once it has handled an expired session (sign-out,
 * redirect and a single notice), so the failure is not reported twice.
 */
export const AUTH_FAILURE_HANDLED = new HttpContextToken<boolean>(() => false);

export function skipErrorToast(context: HttpContext = new HttpContext()): HttpContext {
  return context.set(SKIP_ERROR_TOAST, true);
}

export function handleErrorCodes(
  codes: readonly AnyErrorCode[],
  context: HttpContext = new HttpContext()
): HttpContext {
  return context.set(HANDLED_ERROR_CODES, codes);
}
