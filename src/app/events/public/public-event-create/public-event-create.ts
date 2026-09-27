import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../../auth/services/auth';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import {
  PublicEventCreateRequest,
  SchedulingMode,
  SlotRequest,
} from '../../../models/api-models/public-event.models';
import { PublicEventService } from '../../services/public-event.service';
import { toInputValue } from '../event-dates';

const MIN_DATES = 2;
const MAX_DATES = 6;
const DEFAULT_DATES = 4;

/**
 * One card for both modes and both kinds of host. A host with an account gets the same screen as
 * someone who has never seen Unite - the only difference is that the account already knows their
 * name, so the field disappears.
 */
@Component({
  selector: 'app-public-event-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
  templateUrl: './public-event-create.html',
  styleUrl: './public-event-create.scss',
})
export class PublicEventCreate {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly events = inject(PublicEventService);
  private readonly auth = inject(AuthService);

  protected readonly mode = SchedulingMode;
  protected readonly maxDates = MAX_DATES;
  protected readonly minDates = MIN_DATES;

  protected readonly isGuest = !this.auth.isLoggedIn();
  protected readonly isSubmitting = signal(false);
  protected readonly showDetails = signal(false);
  protected readonly datesError = signal<string | null>(null);

  readonly form: FormGroup = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(256)]),
    description: this.fb.nonNullable.control(''),
    schedulingMode: this.fb.nonNullable.control<SchedulingMode>(SchedulingMode.FIXED),

    // a date the host already has
    startDate: this.fb.nonNullable.control(''),
    endDate: this.fb.nonNullable.control(''),

    // a date the group has yet to pick
    minAttendees: this.fb.nonNullable.control(4, [Validators.min(1)]),
    votingDeadline: this.fb.nonNullable.control(''),
    slots: this.fb.array(
      Array.from({ length: DEFAULT_DATES }, () => this.fb.nonNullable.control(''))
    ),

    location: this.fb.nonNullable.control(''),
    onlineUrl: this.fb.nonNullable.control(''),
    maxAttendees: this.fb.control<number | null>(null),
    waitlistEnabled: this.fb.nonNullable.control(false),

    displayName: this.fb.nonNullable.control(''),
  });

  constructor() {
    const now = new Date();
    this.form.controls['startDate'].setValue(toInputValue(atHour(addDays(now, 7), 18)));
    this.form.controls['votingDeadline'].setValue(toInputValue(atHour(addDays(now, 3), 20)));
  }

  get slots(): FormArray<FormControl<string>> {
    return this.form.get('slots') as FormArray<FormControl<string>>;
  }

  get letsTheGroupPick(): boolean {
    return this.form.controls['schedulingMode'].value === SchedulingMode.POLL;
  }

  /** Dates the host actually filled in - empty rows are simply rows they did not use. */
  private get filledDates(): string[] {
    return this.slots.controls.map((control) => control.value).filter((value) => !!value);
  }

  chooseMode(schedulingMode: SchedulingMode): void {
    this.form.controls['schedulingMode'].setValue(schedulingMode);
    this.datesError.set(null);
  }

  addDate(): void {
    if (this.slots.length < MAX_DATES) {
      this.slots.push(this.fb.nonNullable.control(''));
    }
  }

  removeDate(index: number): void {
    if (this.slots.length > MIN_DATES) {
      this.slots.removeAt(index);
    }
  }

  toggleDetails(): void {
    this.showDetails.update((open) => !open);
  }

  cancel(): void {
    this.router.navigateByUrl(this.auth.isLoggedIn() ? '/app/home/events' : '/login');
  }

  submit(): void {
    this.datesError.set(null);

    if (this.isGuest) {
      this.form.controls['displayName'].addValidators(Validators.required);
      this.form.controls['displayName'].updateValueAndValidity();
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.letsTheGroupPick && !this.validateDates()) {
      return;
    }

    this.isSubmitting.set(true);

    this.events
      .create(this.buildRequest())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (created) => {
          this.router.navigate(['/e', created.slug], {
            // shown once, on arrival - it is the guest's only way back on another device
            state: { returnCode: created.returnCode, justCreated: true },
          });
        },
        error: () => {
          // the interceptor has already said what went wrong
        },
      });
  }

  /**
   * The rules the backend enforces, checked here so the host reads them next to the fields rather
   * than as a toast after a round trip.
   */
  private validateDates(): boolean {
    const dates = this.filledDates;

    if (dates.length < MIN_DATES) {
      this.datesError.set(`Propose at least ${MIN_DATES} dates for the group to choose from`);
      return false;
    }

    if (new Set(dates).size !== dates.length) {
      this.datesError.set('The same date is proposed twice');
      return false;
    }

    const deadline = this.form.controls['votingDeadline'].value;
    if (!deadline) {
      this.datesError.set('Say when the date has to be settled by');
      return false;
    }

    if (new Date(deadline) <= new Date()) {
      this.datesError.set('The deadline has already passed');
      return false;
    }

    if (dates.some((date) => new Date(date) <= new Date(deadline))) {
      this.datesError.set('Every proposed date has to fall after the deadline for choosing it');
      return false;
    }

    const max = this.form.controls['maxAttendees'].value;
    const min = this.form.controls['minAttendees'].value;
    if (max && min > max) {
      this.datesError.set('More people are needed to start than the event has room for');
      return false;
    }

    return true;
  }

  private buildRequest(): PublicEventCreateRequest {
    const raw = this.form.getRawValue();
    const choosing = this.letsTheGroupPick;

    const slots: SlotRequest[] | null = choosing
      ? this.filledDates.map((startDate) => ({ startDate: withSeconds(startDate), endDate: null }))
      : null;

    return {
      name: raw.name.trim(),
      description: blankToNull(raw.description),
      startDate: choosing ? null : withSeconds(raw.startDate),
      endDate: choosing || !raw.endDate ? null : withSeconds(raw.endDate),
      location: blankToNull(raw.location),
      onlineUrl: blankToNull(raw.onlineUrl),
      maxAttendees: raw.maxAttendees || null,
      waitlistEnabled: raw.waitlistEnabled,
      displayName: this.isGuest ? raw.displayName.trim() : null,
      schedulingMode: raw.schedulingMode,
      minAttendees: choosing ? raw.minAttendees : null,
      votingDeadline: choosing ? withSeconds(raw.votingDeadline) : null,
      slots,
    };
  }
}

/** `datetime-local` gives `YYYY-MM-DDTHH:mm`; LocalDateTime wants the seconds too. */
function withSeconds(value: string): string {
  return value.length === 16 ? `${value}:00` : value;
}

function blankToNull(value: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function atHour(date: Date, hour: number): Date {
  const copy = new Date(date);
  copy.setHours(hour, 0, 0, 0);
  return copy;
}
