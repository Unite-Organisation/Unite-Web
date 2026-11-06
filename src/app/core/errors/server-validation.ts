import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { AnyErrorCode, NormalizedError } from './api-error.model';
import { parseApiError } from './api-error.parser';

export const SERVER_INVALID = 'serverInvalid';

/** What a control carries under `SERVER_INVALID` - enough to word a message next to it. */
export interface ServerFieldError {
  readonly code: AnyErrorCode;
  readonly constraint?: string;
  readonly params?: Readonly<Record<string, unknown>>;
}

export interface ServerValidationOptions {
  readonly fieldMap?: Readonly<Record<string, string>>;
  readonly focusFirst?: boolean;
}

export interface ServerValidationResult {
  readonly applied: string[];
  readonly unmatched: string[];
}

@Injectable({ providedIn: 'root' })
export class ServerValidationBinder {
  private readonly clearSubscriptions = new WeakMap<AbstractControl, Subscription>();

  apply(
    form: FormGroup,
    error: HttpErrorResponse,
    options: ServerValidationOptions = {}
  ): ServerValidationResult {
    const applied: string[] = [];
    const unmatched: string[] = [];

    for (const rejected of ServerValidationBinder.rejectedFields(error)) {
      const field = rejected.field!;
      const control = this.resolveControl(form, field, options.fieldMap);

      if (!control) {
        unmatched.push(field);
        continue;
      }

      this.markInvalid(control, rejected);
      applied.push(field);
    }

    if (unmatched.length > 0) {
      console.warn(
        `[validation] the backend rejected ${unmatched.map((f) => `"${f}"`).join(', ')}, but the form has no matching control — the user cannot see what to fix`
      );
    }

    if (applied.length > 0 && options.focusFirst !== false) {
      this.focus(applied[0], options.fieldMap);
    }

    return { applied, unmatched };
  }

  /**
   * Drops every server error from the form. A rejected input that has since been hidden (another
   * mode, a collapsed section) would otherwise keep the form invalid with nothing on screen to fix.
   */
  clear(control: AbstractControl): void {
    if (control.hasError(SERVER_INVALID)) {
      this.clearSubscriptions.get(control)?.unsubscribe();
      this.clearSubscriptions.delete(control);
      const { [SERVER_INVALID]: _removed, ...remaining } = control.errors ?? {};
      control.setErrors(Object.keys(remaining).length > 0 ? remaining : null);
    }

    const children = (control as { controls?: Record<string, AbstractControl> | AbstractControl[] }).controls;
    if (children) {
      Object.values(children).forEach((child) => this.clear(child));
    }
  }

  /** Scrolls to and focuses the input of a rejected field, for callers that reveal it first. */
  focus(field: string, fieldMap?: Readonly<Record<string, string>>): void {
    const controlName = fieldMap?.[field] ?? toControlPath(field);
    const element =
      document.querySelector<HTMLElement>(`[formcontrolname="${CSS.escape(controlName)}"]`) ??
      document.getElementById(controlName);

    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element?.focus({ preventScroll: true });
  }

  static hasValidationErrors(error: HttpErrorResponse): boolean {
    return ServerValidationBinder.rejectedFields(error).length > 0;
  }

  /**
   * Every error naming the input it is about - a `VALIDATION_ERROR` as much as an
   * `INVALID_TIME_PERIOD` on an end date. Errors about the request as a whole carry no field.
   */
  static rejectedFields(error: HttpErrorResponse): NormalizedError[] {
    return parseApiError(error).filter((e) => !!e.field);
  }

  private resolveControl(
    form: FormGroup,
    field: string,
    fieldMap?: Readonly<Record<string, string>>
  ): AbstractControl | null {
    const mapped = fieldMap?.[field];
    if (mapped) {
      return form.get(mapped);
    }

    const direct = form.get(toControlPath(field));
    if (direct) {
      return direct;
    }

    const match = Object.keys(form.controls).find(
      (name) => name.toLowerCase() === field.toLowerCase()
    );

    return match ? form.controls[match] : null;
  }

  private markInvalid(control: AbstractControl, rejected: NormalizedError): void {
    if (control.hasError(SERVER_INVALID)) {
      // the first error the backend reported for an input is the one worth reading
      return;
    }

    const detail: ServerFieldError = {
      code: rejected.code,
      ...(rejected.constraint ? { constraint: rejected.constraint } : {}),
      ...(rejected.params ? { params: rejected.params } : {}),
    };

    control.setErrors({ ...(control.errors ?? {}), [SERVER_INVALID]: detail });
    control.markAsTouched();

    this.clearSubscriptions.get(control)?.unsubscribe();

    const subscription = control.valueChanges.pipe(take(1)).subscribe(() => {
      const { [SERVER_INVALID]: _removed, ...remaining } = control.errors ?? {};
      control.setErrors(Object.keys(remaining).length > 0 ? remaining : null);
      this.clearSubscriptions.delete(control);
    });

    this.clearSubscriptions.set(control, subscription);
  }
}

function toControlPath(field: string): string {
  return field.replace(/\[(\d+)\]/g, '.$1');
}

export function hasServerError(form: FormGroup, controlName: string): boolean {
  return form.get(controlName)?.hasError(SERVER_INVALID) ?? false;
}

/**
 * The words shown under an input the backend rejected, or `null` when it did not. Worded from the
 * constraint and its limits, never from the backend's own message.
 */
export function serverErrorText(control: AbstractControl | null | undefined): string | null {
  const error = control?.getError(SERVER_INVALID) as ServerFieldError | true | undefined;
  if (!error) {
    return null;
  }
  if (error === true) {
    return GENERIC_FIELD_ERROR;
  }

  const params = error.params ?? {};
  const max = numberParam(params, 'max');
  const min = numberParam(params, 'min');
  const value = numberParam(params, 'value');

  switch (error.constraint) {
    case 'NotBlank':
    case 'NotNull':
    case 'NotEmpty':
      return 'This field is required';
    case 'Size':
      if (max !== null && min !== null && min > 0) {
        return `Use between ${min} and ${max} characters`;
      }
      return max !== null ? `Use at most ${max} characters` : GENERIC_FIELD_ERROR;
    case 'Max':
      return value !== null ? `Must be at most ${value}` : GENERIC_FIELD_ERROR;
    case 'Min':
      return value !== null ? `Must be at least ${value}` : GENERIC_FIELD_ERROR;
    case 'Positive':
      return 'Must be greater than 0';
    case 'PositiveOrZero':
      return 'Cannot be negative';
    case 'Email':
      return 'Enter a valid email address';
    case 'Pattern':
      return 'The format is not right';
    case 'Future':
    case 'FutureOrPresent':
      return 'Pick a date in the future';
    case 'typeMismatch':
      return 'This value is not valid';
  }

  return error.code === 'INVALID_TIME_PERIOD' ? 'Check this date' : GENERIC_FIELD_ERROR;
}

const GENERIC_FIELD_ERROR = 'Check this field';

function numberParam(params: Readonly<Record<string, unknown>>, name: string): number | null {
  const value = params[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
