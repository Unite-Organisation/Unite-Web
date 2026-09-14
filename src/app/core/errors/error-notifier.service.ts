import { Injectable, inject } from '@angular/core';
import { ToastService } from '../toast/toast.service';
import { AnyErrorCode, NormalizedError } from './api-error.model';
import { ErrorCode } from './error-code';
import { presentationFor } from './error-messages';

const DEDUPE_WINDOW_MS = 4000;
const MAX_TOASTS_PER_RESPONSE = 3;


@Injectable({ providedIn: 'root' })
export class ErrorNotifier {
  private readonly toast = inject(ToastService);

  private readonly recentlyShown = new Map<string, number>();

  notify(errors: readonly NormalizedError[], handledCodes: readonly AnyErrorCode[] = []): void {
    this.log(errors);

    const reportable = errors.filter(
      (error) => !presentationFor(error.code).silent && !handledCodes.includes(error.code)
    );

    for (const code of this.codesToReport(reportable)) {
      const presentation = presentationFor(code);

      if (this.isDuplicate(presentation.text)) {
        continue;
      }

      this.toast.show(presentation.text, presentation.severity);
    }
  }

  notifySessionExpired(): void {
    const presentation = presentationFor(ErrorCode.JWT_TOKEN_EXPIRED);

    if (!this.isDuplicate(presentation.text)) {
      this.toast.show(presentation.text, presentation.severity);
    }
  }

  private codesToReport(errors: readonly NormalizedError[]): AnyErrorCode[] {
    const codes: AnyErrorCode[] = [];
    let validationReported = false;

    for (const error of errors) {
      if (error.code === ErrorCode.VALIDATION_ERROR) {
        if (validationReported) {
          continue;
        }
        validationReported = true;
      }

      codes.push(error.code);

      if (codes.length === MAX_TOASTS_PER_RESPONSE) {
        break;
      }
    }

    return codes;
  }

  private isDuplicate(message: string): boolean {
    const now = Date.now();

    for (const [key, shownAt] of this.recentlyShown) {
      if (now - shownAt > DEDUPE_WINDOW_MS) {
        this.recentlyShown.delete(key);
      }
    }

    if (this.recentlyShown.has(message)) {
      return true;
    }

    this.recentlyShown.set(message, now);
    return false;
  }

  private log(errors: readonly NormalizedError[]): void {
    for (const error of errors) {
      if (error.unknownCode) {
        console.warn(
          `[api] unknown error code "${error.unknownCode}" at ${error.path ?? 'unknown path'} — add it to src/app/core/errors/error-code.ts`
        );
        continue;
      }
      console.error(
        `[api] ${error.httpStatus} ${error.code} at ${error.path ?? 'unknown path'}`,
        error.detail ?? ''
      );
    }
  }
}
