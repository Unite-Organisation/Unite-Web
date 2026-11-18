import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';

import { AuthService } from '../../../auth/services/auth';
import { RolesService } from '../../../auth/services/roles.service';
import { BuildingContextService } from '../../../core/building-context.service';
import { ServerValidationBinder, serverErrorText } from '../../../core/errors';
import { ToastService } from '../../../core/toast/toast.service';
import { endOfDay, startOfDay, toLocalDateTime } from '../../../posts/post-dates';
import { PostService } from '../../../posts/services/post.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import {
  EventMemberRole,
  EventStatus,
  PublicEvent,
  PublicEventCreateRequest,
  PublicEventUpdateRequest,
  SchedulingMode,
  SlotRequest,
} from '../../../models/api-models/public-event.models';
import { PublicEventService } from '../../services/public-event.service';
import { DateTimeField } from '../date-time-field/date-time-field';
import { toInputValue } from '../event-dates';

const MIN_DATES = 2;
const MAX_DATES = 8;
const DEFAULT_DATES = 4;
const DEFAULT_HOUR = 12;
const FEED_DAYS_WITHOUT_DATE = 30;
/** Mirrors the backend: the deadline is frozen this close to passing, and cannot be moved closer than this. */
const DEADLINE_CHANGE_MARGIN_MS = 5 * 60 * 1000;

/** What the host can still change once the event exists - everything else is shown, but disabled. */
const EDITABLE_FIELDS = new Set(['name', 'description', 'location', 'onlineUrl', 'requiresApproval', 'votingDeadline', 'slots']);

/** Inputs inside the collapsed "Place, link, limit" section - it opens when one of them is rejected. */
const DETAIL_FIELDS = new Set(['location', 'onlineUrl', 'maxAttendees', 'waitlistEnabled', 'requiresApproval']);

/**
 * One card for both modes and both kinds of host. A host with an account gets the same screen as
 * someone who has never seen Unite - the only difference is that the account already knows their
 * name, so the field disappears.
 *
 * Opened on `/event/:slug/edit` it comes filled in with the event instead, and only what the
 * backend still lets the host change stays enabled.
 */
@Component({
  selector: 'app-public-event-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, DateTimeField],
  templateUrl: './public-event-create.html',
  styleUrl: './public-event-create.scss',
})
export class PublicEventCreate {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly events = inject(PublicEventService);
  private readonly auth = inject(AuthService);
  private readonly roles = inject(RolesService);
  private readonly posts = inject(PostService);
  private readonly buildingContext = inject(BuildingContextService);
  private readonly serverValidation = inject(ServerValidationBinder);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  /** Set when editing an existing event, `null` when creating one. */
  protected readonly editedSlug = this.route.snapshot.paramMap.get('slug');
  protected readonly isEditing = this.editedSlug !== null;
  protected readonly loadingEvent = signal(this.isEditing);
  /** Why the deadline is disabled while editing a poll - `null` when it can still be moved. */
  protected readonly deadlineLockedReason = signal<string | null>(null);
  /**
   * Rows holding the dates the event already has. They stay as they are - people have voted on
   * them - and only rows after them are new dates the host is adding.
   */
  protected readonly existingDates = signal(0);
  /** Editing a poll that is still open for changes - the same rule as for the deadline. */
  protected readonly canAddDates = signal(false);
  private editedEvent: PublicEvent | null = null;

  protected readonly mode = SchedulingMode;
  protected readonly maxDates = MAX_DATES;
  protected readonly minDates = MIN_DATES;

  protected readonly isGuest = !this.auth.isLoggedIn() && !this.isEditing;
  protected readonly isSubmitting = signal(false);
  protected readonly showDetails = signal(false);
  protected readonly datesError = signal<string | null>(null);
  protected readonly deadlineError = signal<string | null>(null);

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
    requiresApproval: this.fb.nonNullable.control(false),

    displayName: this.fb.nonNullable.control(''),
    email: this.fb.nonNullable.control('', [Validators.email, Validators.maxLength(254)]),
  });

  constructor() {
    if (this.editedSlug) {
      this.loadForEditing(this.editedSlug);
      return;
    }

    const now = new Date();
    this.form.controls['startDate'].setValue(toInputValue(atHour(addDays(now, 7), 18)));
    this.form.controls['votingDeadline'].setValue(toInputValue(atHour(addDays(now, 3), 20)));
  }

  /**
   * Only the host gets the form - anyone else who lands here is sent back to the event, where the
   * page explains what they can do.
   */
  private loadForEditing(slug: string): void {
    this.events
      .get(slug)
      .pipe(finalize(() => this.loadingEvent.set(false)))
      .subscribe({
        next: (event) => {
          if (event.me?.role !== EventMemberRole.HOST) {
            this.router.navigate(['/event', slug], { replaceUrl: true });
            return;
          }
          this.fillFrom(event);
        },
        error: () => this.router.navigate(['/event', slug], { replaceUrl: true }),
      });
  }

  private fillFrom(event: PublicEvent): void {
    this.editedEvent = event;

    const dates = [...event.slots]
      .map((slot) => slot.startDate)
      .sort()
      .map((date) => this.fb.nonNullable.control({ value: toFieldValue(date), disabled: true }));
    this.slots.clear();
    dates.forEach((control) => this.slots.push(control));
    this.existingDates.set(dates.length);

    this.form.patchValue({
      name: event.name,
      description: event.description ?? '',
      schedulingMode: event.schedulingMode,
      startDate: toFieldValue(event.startDate),
      endDate: toFieldValue(event.endDate),
      minAttendees: event.minAttendees ?? 1,
      votingDeadline: toFieldValue(event.votingDeadline),
      location: event.locationName ?? '',
      onlineUrl: event.onlineUrl ?? '',
      maxAttendees: event.maxAttendees,
      waitlistEnabled: event.waitlistEnabled,
      requiresApproval: event.requiresApproval,
    });

    Object.entries(this.form.controls)
      .filter(([field]) => !EDITABLE_FIELDS.has(field))
      .forEach(([, control]) => control.disable());

    if (event.requiresApproval) {
      this.form.controls['requiresApproval'].disable();
    }

    const locked = deadlineLockedReason(event);
    this.deadlineLockedReason.set(locked);
    if (locked) {
      this.form.controls['votingDeadline'].disable();
    }
    this.canAddDates.set(event.schedulingMode === SchedulingMode.POLL && !locked);

    this.showDetails.set(!!(event.locationName || event.onlineUrl || event.maxAttendees || event.requiresApproval));
  }

  get slots(): FormArray<FormControl<string>> {
    return this.form.get('slots') as FormArray<FormControl<string>>;
  }

  /**
   * Hosts usually propose several days at the same hour, so a new date starts from the last one.
   * The very first starts the day after the deadline, because proposed dates have to fall after it.
   */
  get nextSlotDate(): string {
    const last = this.filledDates.at(-1);
    if (last) {
      return last;
    }

    const now = new Date();
    const deadline = new Date(this.form.controls['votingDeadline'].value);
    const from = deadline > now ? deadline : now;
    return toInputValue(atHour(addDays(from, 1), DEFAULT_HOUR));
  }

  get letsTheGroupPick(): boolean {
    return this.form.controls['schedulingMode'].value === SchedulingMode.POLL;
  }

  /** Form rows of the dates actually sent - the request skips empty rows, so its indexes differ. */
  private get filledSlotIndexes(): number[] {
    return this.slots.controls.flatMap((control, index) => (control.value ? [index] : []));
  }

  /** Dates the host actually filled in - empty rows are simply rows they did not use. */
  private get filledDates(): string[] {
    return this.slots.controls.map((control) => control.value).filter((value) => !!value);
  }

  chooseMode(schedulingMode: SchedulingMode): void {
    if (this.isEditing) {
      return;
    }
    this.form.controls['schedulingMode'].setValue(schedulingMode);
    this.datesError.set(null);
  }

  /** Creating, or editing while the vote still takes new dates - up to the limit either way. */
  protected get showAddDate(): boolean {
    return (!this.isEditing || this.canAddDates()) && this.slots.length < MAX_DATES;
  }

  /** Creating: any row above the minimum. Editing: only a row the host has just added. */
  protected canRemoveDate(index: number): boolean {
    return this.isEditing ? index >= this.existingDates() : this.slots.length > MIN_DATES;
  }

  addDate(): void {
    if (this.showAddDate) {
      this.slots.push(this.fb.nonNullable.control(''));
    }
  }

  removeDate(index: number): void {
    if (this.canRemoveDate(index)) {
      this.slots.removeAt(index);
    }
  }

  toggleDetails(): void {
    this.showDetails.update((open) => !open);
  }

  cancel(): void {
    if (this.editedSlug) {
      this.router.navigate(['/event', this.editedSlug]);
      return;
    }
    this.router.navigateByUrl(this.auth.isLoggedIn() ? '/app/home/events' : '/login');
  }

  /** What the backend said about an input, worded for the host - `null` when it had no complaint. */
  protected serverError(path: string): string | null {
    return serverErrorText(this.form.get(path));
  }

  submit(): void {
    this.datesError.set(null);
    this.deadlineError.set(null);
    this.serverValidation.clear(this.form);

    if (this.isGuest) {
      this.form.controls['displayName'].addValidators(Validators.required);
      this.form.controls['displayName'].updateValueAndValidity();
      this.form.controls['email'].addValidators(Validators.required);
      this.form.controls['email'].updateValueAndValidity();
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.editedSlug) {
      this.saveChanges(this.editedSlug);
      return;
    }

    if (this.letsTheGroupPick && !this.validateDates()) {
      return;
    }

    this.isSubmitting.set(true);

    const request = this.buildRequest();
    const sentSlots = this.filledSlotIndexes;

    this.events
      .create(request)
      .pipe(
        switchMap((created) =>
          this.publishInBuilding(created.slug, request).pipe(map(() => created))
        ),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: (created) => {
          this.router.navigate(['/event', created.slug], {
            // shown once, on arrival - it is the guest's only way back on another device
            state: { returnCode: created.returnCode, justCreated: true },
          });
        },
        error: (error: unknown) => {
          // the interceptor has already raised the toast - this marks the inputs it was about
          if (error instanceof HttpErrorResponse) {
            this.showServerErrors(error, sentSlots);
          }
        },
      });
  }

  private saveChanges(slug: string): void {
    const request = this.buildUpdateRequest();
    if (request.votingDeadline && !this.validateNewDeadline(request.votingDeadline)) {
      return;
    }
    if (request.addSlots && !this.validateAddedDates(request.votingDeadline ?? this.editedEvent!.votingDeadline!)) {
      return;
    }
    const sentRows = this.addedRows;

    this.isSubmitting.set(true);
    this.events
      .updateEvent(slug, request)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Changes saved');
          this.router.navigate(['/event', slug]);
        },
        error: (error: unknown) => {
          if (error instanceof HttpErrorResponse) {
            this.showServerErrors(error, sentRows, 'addSlots');
          }
        },
      });
  }

  /**
   * Sends only what the host actually changed, so a field the backend no longer lets them touch -
   * a deadline that is about to pass - does not get the whole save rejected.
   */
  private buildUpdateRequest(): PublicEventUpdateRequest {
    const event = this.editedEvent!;
    const raw = this.form.getRawValue();
    const request: PublicEventUpdateRequest = {};

    const name = raw.name.trim();
    if (name !== event.name) {
      request.name = name;
    }
    if (raw.description.trim() !== (event.description ?? '')) {
      request.description = raw.description.trim();
    }
    if (raw.location.trim() !== (event.locationName ?? '')) {
      request.location = raw.location.trim();
    }
    if (raw.onlineUrl.trim() !== (event.onlineUrl ?? '')) {
      request.onlineUrl = raw.onlineUrl.trim();
    }
    if (raw.requiresApproval && !event.requiresApproval) {
      request.requiresApproval = true;
    }
    if (
      this.form.controls['votingDeadline'].enabled &&
      raw.votingDeadline &&
      raw.votingDeadline !== toFieldValue(event.votingDeadline)
    ) {
      request.votingDeadline = withSeconds(raw.votingDeadline);
    }

    const added = this.addedRows.map((row) => this.slots.at(row).value);
    if (added.length > 0) {
      request.addSlots = added.map((startDate) => ({ startDate: withSeconds(startDate), endDate: null }));
    }

    return request;
  }

  /** Form rows of the new dates that are filled in - empty rows are not sent. */
  private get addedRows(): number[] {
    return this.filledSlotIndexes.filter((row) => row >= this.existingDates());
  }

  /** The rules the backend applies to new dates, against the deadline as it is about to be. */
  private validateAddedDates(deadline: string): boolean {
    const dates = this.filledDates;
    if (new Set(dates).size !== dates.length) {
      this.datesError.set('The same date is proposed twice');
      return false;
    }

    const added = this.addedRows.map((row) => this.slots.at(row).value);
    if (added.some((date) => new Date(date) <= new Date(deadline))) {
      this.datesError.set('Every proposed date has to fall after the deadline for choosing it');
      return false;
    }
    return true;
  }

  /** The same rules the backend applies, so the host reads them under the field. */
  private validateNewDeadline(deadline: string): boolean {
    const fail = (message: string) => {
      this.deadlineError.set(message);
      return false;
    };

    if (new Date(deadline).getTime() < Date.now() + DEADLINE_CHANGE_MARGIN_MS) {
      return fail('The new deadline has to be at least 5 minutes from now');
    }
    if (this.filledDates.some((date) => new Date(date) <= new Date(deadline))) {
      return fail('Every proposed date has to fall after the deadline for choosing it');
    }
    return true;
  }

  /**
   * Turns the inputs the backend rejected red, revealing them first when they sit in the collapsed
   * section. `slots[1]` in the request is not necessarily the second row of the form, since empty
   * rows are not sent.
   */
  private showServerErrors(error: HttpErrorResponse, sentSlots: number[], slotsField = 'slots'): void {
    const fieldMap: Record<string, string> = { [slotsField]: 'slots' };
    sentSlots.forEach((row, sent) => {
      fieldMap[`${slotsField}[${sent}].startDate`] = `slots.${row}`;
      fieldMap[`${slotsField}[${sent}].endDate`] = `slots.${row}`;
    });

    const { applied } = this.serverValidation.apply(this.form, error, { fieldMap, focusFirst: false });
    if (applied.length === 0) {
      return;
    }

    if (applied.some((field) => field === slotsField)) {
      this.datesError.set(
        this.isEditing
          ? `An event proposes at most ${MAX_DATES} dates`
          : `Propose between ${MIN_DATES} and ${MAX_DATES} dates`
      );
    } else if (applied.some((field) => field.startsWith(`${slotsField}[`))) {
      this.datesError.set('Check the highlighted dates');
    }

    if (applied.some((field) => DETAIL_FIELDS.has(field))) {
      this.showDetails.set(true);
    }

    // after the section has rendered, or there is nothing to scroll to yet
    setTimeout(() => this.serverValidation.focus(applied[0], fieldMap));
  }

  /**
   * A host with an account and a building also gets the event into that building's feed. By now the
   * event exists and its link works, so a failed publish must not keep them from it - the
   * interceptor has already said what went wrong.
   */
  private publishInBuilding(slug: string, request: PublicEventCreateRequest): Observable<unknown> {
    const canPublish = this.roles.isResident() || this.roles.isManager();
    if (!canPublish || !this.buildingContext.getBuildingId()) {
      return of(null);
    }

    return this.posts
      .publishEvent({ slug, ...feedWindow(request), fileKeys: null })
      .pipe(catchError(() => of(null)));
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
      email: this.isGuest ? raw.email.trim() : null,
      schedulingMode: raw.schedulingMode,
      minAttendees: choosing ? raw.minAttendees : null,
      votingDeadline: choosing ? withSeconds(raw.votingDeadline) : null,
      slots,
      requiresApproval: raw.requiresApproval
    };
  }
}

/**
 * In the feed from today until the end of the day the event ends - for an event still choosing its
 * date, the last date on the table. Starting at midnight keeps a browser clock running ahead of the
 * server from hiding the post it has just published.
 */
function feedWindow(request: PublicEventCreateRequest): { visibleFrom: string; visibleTo: string } {
  const now = new Date();
  const lastDate =
    request.endDate ||
    request.startDate ||
    request.slots?.map((slot) => slot.startDate).sort().at(-1);

  const until = lastDate ? new Date(lastDate) : addDays(now, FEED_DAYS_WITHOUT_DATE);

  return {
    visibleFrom: toLocalDateTime(startOfDay(now)),
    visibleTo: toLocalDateTime(endOfDay(until > now ? until : now)),
  };
}

/** The date fields give `YYYY-MM-DDTHH:mm`; LocalDateTime wants the seconds too. */
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

/** Values from the api carry seconds, the date fields do not. */
function toFieldValue(value: string | null): string {
  return value ? value.slice(0, 16) : '';
}

/** Mirrors EventLifecycleService#moveVotingDeadline - `null` when the deadline may still be moved. */
function deadlineLockedReason(event: PublicEvent): string | null {
  if (event.schedulingMode !== SchedulingMode.POLL || !event.votingDeadline) {
    return null;
  }
  if (event.status !== EventStatus.COLLECTING_VOTES) {
    return 'The group is no longer voting, so the deadline stays as it is.';
  }
  if (new Date(event.votingDeadline).getTime() < Date.now() + DEADLINE_CHANGE_MARGIN_MS) {
    return 'The deadline is less than 5 minutes away and can no longer be moved.';
  }
  return null;
}
