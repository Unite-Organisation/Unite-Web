import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { FacilityResponse, FacilityReservation, ReservationRequest } from '../../models/api-models/facility.models';
import { FacilityApiService } from '../services/facility-api.service';
import { ToastService } from '../../core/toast.service';
import { ErrorService } from '../../core/error.sevice';

@Component({
  selector: 'app-reserve-facility-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatProgressSpinnerModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './reserve-facility-dialog.html',
  styleUrl: './reserve-facility-dialog.scss',
})
export class ReserveFacilityDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ReserveFacilityDialog>);
  private readonly facilityApiService = inject(FacilityApiService);
  private readonly toast = inject(ToastService);
  private readonly errorService = inject(ErrorService);
  protected readonly facility = inject<FacilityResponse>(MAT_DIALOG_DATA);

  protected isSubmitting = false;
  protected isLoadingAvailability = false;
  protected reservations: FacilityReservation[] = [];
  protected reservedDates: Date[] = [];
  protected readonly timeSlots: string[] = this.generateTimeSlots();

  readonly form: FormGroup = this.fb.group({
    date: this.fb.control<Date | null>(null, { validators: [Validators.required] }),
    startTime: this.fb.control('', { validators: [Validators.required], nonNullable: true }),
    endTime: this.fb.control('', { validators: [Validators.required], nonNullable: true }),
    purpose: this.fb.control('', { validators: [Validators.required], nonNullable: true })
  }, { validators: [this.timeRangeValidator.bind(this)] });

  ngOnInit(): void {
    this.loadAvailability();
    
    // Re-validate when form values change
    this.form.valueChanges.subscribe(() => {
      this.form.updateValueAndValidity();
    });

    // Reset endTime when startTime changes
    this.form.get('startTime')?.valueChanges.subscribe(() => {
      const endTimeControl = this.form.get('endTime');
      if (endTimeControl) {
        const currentEndTime = endTimeControl.value;
        const availableEndTimes = this.getAvailableEndTimes();
        // If current end time is not in available times, reset it
        if (currentEndTime && !availableEndTimes.includes(currentEndTime)) {
          endTimeControl.setValue('');
        }
      }
    });
  }

  private loadAvailability(): void {
    this.isLoadingAvailability = true;
    this.facilityApiService.getAvailability(this.facility.id)
      .pipe(finalize(() => (this.isLoadingAvailability = false)))
      .subscribe({
        next: (reservations) => {
          this.reservations = reservations;
          this.reservedDates = reservations.map(r => new Date(r.startTime));
          // Re-validate form after loading reservations
          this.form.updateValueAndValidity();
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to load availability', error);
          this.errorService.handleServerError(error);
        }
      });
  }

  timeRangeValidator(form: FormGroup): { [key: string]: any } | null {
    const date = form.get('date')?.value;
    const startTime = form.get('startTime')?.value;
    const endTime = form.get('endTime')?.value;

    if (!date || !startTime || !endTime) {
      return null;
    }

    const start = this.combineDateTime(date, startTime);
    const end = this.combineDateTime(date, endTime);

    if (start >= end) {
      return { timeRangeInvalid: true };
    }

    const hoursDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (hoursDiff > 12) {
      return { maxDurationExceeded: true };
    }

    // Check if overlaps with existing reservations
    for (const reservation of this.reservations) {
      const resStart = new Date(reservation.startTime);
      const resEnd = new Date(reservation.endTime);
      
      if ((start >= resStart && start < resEnd) || 
          (end > resStart && end <= resEnd) ||
          (start <= resStart && end >= resEnd)) {
        return { overlapsWithReservation: true };
      }
    }

    return null;
  }

  private combineDateTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  }

  dateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const startDateTime = this.combineDateTime(formValue.date, formValue.startTime);
    const endDateTime = this.combineDateTime(formValue.date, formValue.endTime);

    const payload: ReservationRequest = {
      facilityId: this.facility.id,
      startTime: this.formatDateTimeForBackend(startDateTime),
      endTime: this.formatDateTimeForBackend(endDateTime),
      purpose: formValue.purpose
    };

    this.isSubmitting = true;
    this.facilityApiService.reserveFacility(payload)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toast.success('Facility reserved successfully');
            this.dialogRef.close(true);
          } else {
            this.toast.error('Failed to reserve facility. Please check for conflicts.');
            this.errorService.handleServerError({ error: 'Reservation failed', status: 400 } as HttpErrorResponse);
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to reserve facility', error);
          // If backend returns reservations in error response, update the list
          if (error.error && error.error.reservations) {
            this.reservations = error.error.reservations;
            this.reservedDates = this.reservations.map(r => new Date(r.startTime));
            this.form.updateValueAndValidity();
          }
          this.errorService.handleServerError(error);
        }
      });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  formatDateTime(dateTimeString: string): string {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private generateTimeSlots(): string[] {
    const slots: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  }

  getAvailableEndTimes(): string[] {
    const startTime = this.form.get('startTime')?.value;
    if (!startTime) {
      return this.timeSlots;
    }

    const startIndex = this.timeSlots.indexOf(startTime);
    if (startIndex === -1) {
      return this.timeSlots;
    }

    // Return times after start time, but limit to 12 hours (24 slots = 12 hours)
    const maxSlots = 24; // 12 hours * 2 slots per hour
    return this.timeSlots.slice(startIndex + 1, startIndex + maxSlots + 1);
  }

  formatTimeDisplay(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  private formatDateTimeForBackend(date: Date): string {
    // Format: YYYY-MM-DDTHH:mm:ss (24-hour format, local time)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }
}

