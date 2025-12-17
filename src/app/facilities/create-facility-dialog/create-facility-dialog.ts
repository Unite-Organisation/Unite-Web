import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { AreaApiService } from '../../buildings/services/area-api.service';
import { BuildingResponse } from '../../models/api-models/area.models';
import { FacilityRequest, FacilityType } from '../../models/api-models/facility.models';
import { FacilityApiService } from '../services/facility-api.service';
import { ToastService } from '../../core/toast.service';
import { ErrorService } from '../../core/error.sevice';

@Component({
  selector: 'app-create-facility-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatIconModule
  ],
  templateUrl: './create-facility-dialog.html',
  styleUrl: './create-facility-dialog.scss',
})
export class CreateFacilityDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CreateFacilityDialog>);
  private readonly areaApiService = inject(AreaApiService);
  private readonly facilityApiService = inject(FacilityApiService);
  private readonly toast = inject(ToastService);
  private readonly errorService = inject(ErrorService);

  protected isSubmitting = false;
  protected isLoadingBuildings = false;
  protected buildings: BuildingResponse[] = [];
  protected readonly facilityTypes = Object.values(FacilityType);

  readonly form: FormGroup = this.fb.group({
    buildingId: this.fb.control('', { validators: [Validators.required], nonNullable: true }),
    facilities: this.fb.array([this.createFacilityFormGroup()])
  });

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

  get facilitiesFormArray(): FormArray {
    return this.form.get('facilities') as FormArray;
  }

  createFacilityFormGroup(): FormGroup {
    return this.fb.group({
      name: this.fb.control('', { validators: [Validators.required], nonNullable: true }),
      type: this.fb.control('', { validators: [Validators.required], nonNullable: true }),
      capacity: this.fb.control<number | null>(null),
      location: this.fb.control('', { nonNullable: true }),
      requiresApproval: this.fb.control(false, { nonNullable: true })
    });
  }

  addFacility(): void {
    this.facilitiesFormArray.push(this.createFacilityFormGroup());
  }

  removeFacility(index: number): void {
    if (this.facilitiesFormArray.length > 1) {
      this.facilitiesFormArray.removeAt(index);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const facilities = this.facilitiesFormArray.value.map((facility: any) => ({
      name: facility.name,
      type: facility.type,
      capacity: facility.capacity || null,
      location: facility.location || '',
      requiresApproval: facility.requiresApproval || false
    }));

    const payload: FacilityRequest = {
      facilities: facilities,
      buildingId: formValue.buildingId
    };

    this.isSubmitting = true;
    this.facilityApiService.createFacilities(payload)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.toast.success('Facilities created successfully');
          this.dialogRef.close(true);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to create facilities', error);
          this.errorService.handleServerError(error);
        }
      });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}

