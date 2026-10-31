import { booleanAttribute, Component, forwardRef, input, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepicker, MatDatepickerInput, MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker';

import { formatDayTime, parseLocal, toInputValue } from '../event-dates';


@Component({
  selector: 'app-date-time-field',
  standalone: true,
  imports: [MatDatepickerModule, MatTimepickerModule, ReactiveFormsModule],
  templateUrl: './date-time-field.html',
  styleUrl: './date-time-field.scss',
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useFactory: () => navigator.language },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateTimeField),
      multi: true,
    },
  ],
})
export class DateTimeField implements ControlValueAccessor {
  readonly fieldId = input<string | null>(null);
  readonly label = input.required<string>();
  readonly startFrom = input('');
  readonly clearable = input(false, { transform: booleanAttribute });

  private readonly picker = viewChild.required<MatDatepicker<Date>>(MatDatepicker);
  private readonly dateInput = viewChild.required<MatDatepickerInput<Date>>(MatDatepickerInput);

  protected readonly today = new Date();
  protected readonly heldInHand = matchMedia('(max-width: 600px), (pointer: coarse)').matches;

  protected readonly value = signal('');
  protected readonly time = signal<Date | null>(null);

  private confirmed = false;
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  protected get text(): string {
    return this.value() ? formatDayTime(this.value()) : 'Pick a date';
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(onChange: (value: string) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  protected open(): void {
    const start = this.startingPoint();

    this.confirmed = false;
    this.dateInput().value = start;
    this.time.set(start);
    this.picker().open();
  }

  protected confirm(): void {
    this.confirmed = true;
  }

  /** Runs after the picker has applied its pending day, which is why OK only leaves a note. */
  protected onClosed(): void {
    const day = this.dateInput().value;
    const time = this.time();

    if (this.confirmed && day && time) {
      const chosen = new Date(day);
      chosen.setHours(time.getHours(), time.getMinutes(), 0, 0);
      this.update(toInputValue(chosen));
    }

    this.onTouched();
  }

  protected clear(): void {
    this.update('');
  }

  private update(value: string): void {
    this.value.set(value);
    this.onChange(value);
  }

  private startingPoint(): Date {
    const known = this.value() || this.startFrom();
    if (known) {
      return parseLocal(known);
    }

    const tomorrowAtNoon = new Date();
    tomorrowAtNoon.setDate(tomorrowAtNoon.getDate() + 1);
    tomorrowAtNoon.setHours(12, 0, 0, 0);
    return tomorrowAtNoon;
  }
}
