import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { parseApiError } from './api-error.parser';
import { ErrorCode } from './error-code';

export const SERVER_INVALID = 'serverInvalid';

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
    const fields = this.rejectedFields(error);
    const applied: string[] = [];
    const unmatched: string[] = [];

    for (const field of fields) {
      const control = this.resolveControl(form, field, options.fieldMap);

      if (!control) {
        unmatched.push(field);
        continue;
      }

      this.markInvalid(control);
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

  static hasValidationErrors(error: HttpErrorResponse): boolean {
    return parseApiError(error).some((e) => e.code === ErrorCode.VALIDATION_ERROR);
  }

  private rejectedFields(error: HttpErrorResponse): string[] {
    return parseApiError(error)
      .filter((e) => e.code === ErrorCode.VALIDATION_ERROR)
      .map((e) => e.detail)
      .filter((field): field is string => !!field);
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

  private markInvalid(control: AbstractControl): void {
    control.setErrors({ ...(control.errors ?? {}), [SERVER_INVALID]: true });
    control.markAsTouched();

    this.clearSubscriptions.get(control)?.unsubscribe();

    const subscription = control.valueChanges.pipe(take(1)).subscribe(() => {
      const { [SERVER_INVALID]: _removed, ...remaining } = control.errors ?? {};
      control.setErrors(Object.keys(remaining).length > 0 ? remaining : null);
      this.clearSubscriptions.delete(control);
    });

    this.clearSubscriptions.set(control, subscription);
  }

  private focus(field: string, fieldMap?: Readonly<Record<string, string>>): void {
    const controlName = fieldMap?.[field] ?? toControlPath(field);
    const element = document.querySelector<HTMLElement>(
      `[formcontrolname="${CSS.escape(controlName)}"]`
    );

    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element?.focus({ preventScroll: true });
  }
}

function toControlPath(field: string): string {
  return field.replace(/\[(\d+)\]/g, '.$1');
}

export function hasServerError(form: FormGroup, controlName: string): boolean {
  return form.get(controlName)?.hasError(SERVER_INVALID) ?? false;
}
