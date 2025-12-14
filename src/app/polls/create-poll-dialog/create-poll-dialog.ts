import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { AreaApiService } from '../../buildings/services/area-api.service';
import { BuildingResponse } from '../../models/api-models/area.models';
import { PollRequest } from '../../models/api-models/poll.models';
import { PollApiService } from '../services/poll-api.service';
import { ToastService } from '../../core/toast.service';
import { ErrorService } from '../../core/error.sevice';

@Component({
  selector: 'app-create-poll-dialog',
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
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatIconModule,
    MatTooltipModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './create-poll-dialog.html',
  styleUrl: './create-poll-dialog.scss',
})
export class CreatePollDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CreatePollDialog>);
  private readonly areaApiService = inject(AreaApiService);
  private readonly pollApiService = inject(PollApiService);
  private readonly toast = inject(ToastService);
  private readonly errorService = inject(ErrorService);

  protected isSubmitting = false;
  protected isLoadingBuildings = false;
  protected buildings: BuildingResponse[] = [];
  protected isAreaWide = false;

  readonly form: FormGroup = this.fb.group({
    title: this.fb.control('', { validators: [Validators.required], nonNullable: true }),
    description: this.fb.control('', { nonNullable: true }),
    buildingId: this.fb.control('', { validators: [Validators.required], nonNullable: true }),
    anonymous: this.fb.control(false, { validators: [Validators.required], nonNullable: true }),
    startTime: this.fb.control<Date | null>(null, { validators: [Validators.required] }),
    endTime: this.fb.control<Date | null>(null, { validators: [Validators.required] }),
    options: this.fb.array([
      this.fb.control('', { validators: [Validators.required], nonNullable: true }),
      this.fb.control('', { validators: [Validators.required], nonNullable: true })
    ], { validators: [Validators.required, Validators.minLength(2), Validators.maxLength(10)] })
  });

  get optionsArray(): FormArray {
    return this.form.get('options') as FormArray;
  }

  ngOnInit(): void {
    this.loadBuildings();
  }

  private loadBuildings(): void {
    this.isLoadingBuildings = true;
    this.areaApiService.getBuildings()
      .pipe(finalize(() => (this.isLoadingBuildings = false)))
      .subscribe({
        next: (buildings) => {
          this.buildings = buildings;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to load buildings', error);
          this.errorService.handleServerError(error);
        }
      });
  }

  onAreaWideToggle(checked: boolean): void {
    this.isAreaWide = checked;
    const buildingIdControl = this.form.get('buildingId');
    
    if (checked) {
      buildingIdControl?.clearValidators();
      buildingIdControl?.setValue('');
    } else {
      buildingIdControl?.setValidators([Validators.required]);
    }
    buildingIdControl?.updateValueAndValidity();
  }

  addOption(): void {
    if (this.optionsArray.length < 10) {
      this.optionsArray.push(this.fb.control('', { validators: [Validators.required], nonNullable: true }));
    }
  }

  removeOption(index: number): void {
    if (this.optionsArray.length > 2) {
      this.optionsArray.removeAt(index);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const options = this.optionsArray.value.filter((opt: string) => opt && opt.trim() !== '');
    
    if (options.length < 2) {
      this.toast.error('At least 2 options are required');
      return;
    }

    if (options.length > 10) {
      this.toast.error('Maximum 10 options allowed');
      return;
    }

    const payload: PollRequest = {
      title: formValue.title,
      description: formValue.description || undefined,
      buildingId: this.isAreaWide ? null : formValue.buildingId,
      anonymous: formValue.anonymous,
      startTime: this.formatDate(formValue.startTime),
      endTime: this.formatDate(formValue.endTime),
      options: options
    };

    this.isSubmitting = true;
    this.pollApiService.createPoll(payload)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.toast.success('Poll created successfully');
          this.dialogRef.close(true);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to create poll', error);
          this.errorService.handleServerError(error);
        }
      });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  private formatDate(date: Date): string {
    return date.toISOString();
  }
}

