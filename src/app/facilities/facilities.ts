import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ErrorService } from '../core/error.sevice';
import { AddButton } from '../shared/add-button/add-button';
import { RolesService } from '../auth/services/roles.service';
import { FacilityApiService } from './services/facility-api.service';
import { FacilityResponse } from '../models/api-models/facility.models';
import { CreateFacilityDialog } from './create-facility-dialog/create-facility-dialog';
import { ReserveFacilityDialog } from './reserve-facility-dialog/reserve-facility-dialog';
import { IssueApiService } from '../issues/services/issue-api.service';
import { IssueResponse } from '../models/api-models/issue.models';
import { FacilityIssuesDialog, FacilityIssuesDialogData } from './facility-issues-dialog/facility-issues-dialog';
import { forkJoin } from 'rxjs';
import { ButtonComponent } from '../shared/components/button/button.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { ToastService } from '../core/toast.service';
import { Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { FacilityReservation, ReservationRequest } from '../models/api-models/facility.models';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Router } from '@angular/router';


@Component({
  selector: 'app-facilities',
  standalone: true,
  imports: [CommonModule, AddButton, MatDialogModule, MatButtonModule, MatIconModule, ButtonComponent, ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatProgressSpinnerModule],
  providers: [provideNativeDateAdapter()],
  templateUrl: './facilities.html',
  styleUrl: './facilities.scss',
})
export class Facilities implements OnInit {
  private readonly errorService = inject(ErrorService);
  private readonly facilityApiService = inject(FacilityApiService);
  private readonly issueApiService = inject(IssueApiService);
  private readonly rolesService = inject(RolesService);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  isLoading = false;
  protected isSubmitting = false;
  protected isLoadingAvailability = false;

  protected reservations: FacilityReservation[] = [];
  protected reservedDates: Date[] = [];

  protected readonly timeSlots: string[] = this.generateTimeSlots();

  readonly form: FormGroup = this.fb.group(
  {
    date: this.fb.control<Date | null>(null, {
      validators: [Validators.required]
    }),

    startTime: this.fb.control('', {
      validators: [Validators.required],
      nonNullable: true
    }),

    endTime: this.fb.control('', {
      validators: [Validators.required],
      nonNullable: true
    }),

    purpose: this.fb.control('', {
      validators: [Validators.required],
      nonNullable: true
    })
  },
  {
    validators: [this.timeRangeValidator.bind(this)]
  }
  );

  facilities: FacilityResponse[] = [];
  facilityIssuesMap: Map<string, IssueResponse[]> = new Map();
  selectedFacility: FacilityResponse | null = null;

  selectFacility(facility: FacilityResponse): void {
    if (this.selectedFacility?.id === facility.id) {
        return;
    }

    this.selectedFacility = facility;

    this.resetReservationForm();
    this.reservations = [];
    this.reservedDates = [];

    this.loadAvailability();
  }

  private resetReservationForm(): void {
    this.form.reset({
        date: null,
        startTime: null,
        endTime: null,
        purpose: ''
    });
  }

  get canCreateFacility(): boolean {
    return this.rolesService.isManager() || this.rolesService.isAdmin();
  }

  get canReserveFacility(): boolean {
    return this.rolesService.isResident();
  }

  ngOnInit(): void {
    this.loadFacilities();
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

  createFacility(): void {
    this.router.navigate(['/app/home/facilities/create']);
  }

  openReservationDialog(facility: FacilityResponse): void {
    const dialogRef = this.dialog.open(ReserveFacilityDialog, {
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: facility
    });

    dialogRef.afterClosed().subscribe((result: boolean | undefined) => {
      // Optionally refresh facilities if needed
    });
  }

  private loadFacilities(): void {
    this.isLoading = true;
    this.facilityApiService.getFacilities().subscribe({
      next: (data) => {
        this.facilities = data.facilityResponseList;
        this.isLoading = false;
        // Load issues for all facilities
        if (this.facilities.length > 0) {
          this.selectFacility(this.facilities[0]);
        }
        this.loadFacilityIssues();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load facilities', error);
        this.errorService.handleServerError(error);
        this.isLoading = false;
      }
    });
  }

  private loadFacilityIssues(): void {
    // Load issues for all facilities in parallel
    const issueRequests = this.facilities.map(facility =>
      this.issueApiService.getFacilityIssues(facility.id)
    );

    if (issueRequests.length === 0) {
      return;
    }

    forkJoin(issueRequests).subscribe({
      next: (issuesArrays) => {
        this.facilityIssuesMap.clear();
        this.facilities.forEach((facility, index) => {
          const issues = issuesArrays[index];
          if (issues && issues.length > 0) {
            this.facilityIssuesMap.set(facility.id, issues);
          }
        });
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load facility issues', error);
        // Don't show error to user, just log it
      }
    });
  }

  hasIssues(facilityId: string): boolean {
    return this.facilityIssuesMap.has(facilityId) && 
           (this.facilityIssuesMap.get(facilityId)?.length ?? 0) > 0;
  }

  getIssuesCount(facilityId: string): number {
    return this.facilityIssuesMap.get(facilityId)?.length ?? 0;
  }

  openFacilityIssuesDialog(facility: FacilityResponse): void {
    const issues = this.facilityIssuesMap.get(facility.id) || [];
    
    const dialogData: FacilityIssuesDialogData = {
      facilityName: facility.name,
      issues: issues
    };

    const dialogRef = this.dialog.open(FacilityIssuesDialog, {
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe();
  }

  private loadAvailability(): void {
    if (!this.selectedFacility) {
      return;
    }

    this.isLoadingAvailability = true;

    this.facilityApiService
      .getAvailability(this.selectedFacility.id)
      .pipe(
        finalize(() => {
          console.log('Availability finished');
          this.isLoadingAvailability = false;
        })
      )
      .subscribe({
        next: reservations => {
          this.reservations = reservations;

          this.reservedDates = reservations.map(
            reservation => new Date(reservation.startTime)
          );

          this.form.updateValueAndValidity({
            emitEvent: false
          });
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
    if (this.form.invalid || !this.selectFacility) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const startDateTime = this.combineDateTime(formValue.date, formValue.startTime);
    const endDateTime = this.combineDateTime(formValue.date, formValue.endTime);

    const payload: ReservationRequest = {
      facilityId: this.selectedFacility!.id,
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
            this.resetReservationForm();

            this.loadAvailability();
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
