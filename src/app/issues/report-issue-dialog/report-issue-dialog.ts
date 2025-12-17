import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { IssueRequest, IssueObject, IssuePriority } from '../../models/api-models/issue.models';
import { IssueApiService } from '../services/issue-api.service';
import { ToastService } from '../../core/toast.service';
import { ErrorService } from '../../core/error.sevice';
import { BuildingResponse } from '../../models/api-models/area.models';
import { FacilityResponse } from '../../models/api-models/facility.models';
import { PollResponse } from '../../models/api-models/poll.models';

export interface ReportIssueDialogData {
  issueObject?: IssueObject; // Pre-selected issue object type
  availableIssueObjects?: IssueObject[]; // Available issue object types (for home dashboard)
  buildings?: BuildingResponse[];
  facilities?: FacilityResponse[];
  polls?: PollResponse[];
  areaId?: string; // User's area ID
  buildingId?: string; // User's building ID
  preSelectedBuildingId?: string;
  preSelectedFacilityId?: string;
  preSelectedPollId?: string;
}

@Component({
  selector: 'app-report-issue-dialog',
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
  templateUrl: './report-issue-dialog.html',
  styleUrl: './report-issue-dialog.scss',
})
export class ReportIssueDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ReportIssueDialog>);
  protected readonly data = inject<ReportIssueDialogData>(MAT_DIALOG_DATA);
  private readonly issueApiService = inject(IssueApiService);
  private readonly toast = inject(ToastService);
  private readonly errorService = inject(ErrorService);

  protected isSubmitting = false;
  protected readonly priorities = Object.values(IssuePriority);
  protected readonly issueObjects = Object.values(IssueObject);
  
  protected selectedIssueObject: IssueObject | null = null;
  protected availableIssueObjects: IssueObject[] = [];

  readonly form: FormGroup = this.fb.group({
    title: this.fb.control('', { validators: [Validators.required], nonNullable: true }),
    description: this.fb.control('', { validators: [Validators.required], nonNullable: true }),
    priority: this.fb.control<IssuePriority>(IssuePriority.MEDIUM, { validators: [Validators.required], nonNullable: true }),
    issueObject: this.fb.control<IssueObject | null>(null),
    buildingId: this.fb.control<string | null>(null),
    facilityId: this.fb.control<string | null>(null),
    pollId: this.fb.control<string | null>(null),
    notifyEveryone: this.fb.control(false, { nonNullable: true })
  });

  ngOnInit(): void {
    // Determine available issue objects
    if (this.data.availableIssueObjects && this.data.availableIssueObjects.length > 0) {
      this.availableIssueObjects = this.data.availableIssueObjects;
    } else if (this.data.issueObject) {
      this.availableIssueObjects = [this.data.issueObject];
      this.selectedIssueObject = this.data.issueObject;
      this.form.patchValue({ issueObject: this.data.issueObject });
    }

    // Set pre-selected values
    if (this.data.preSelectedBuildingId) {
      this.form.patchValue({ buildingId: this.data.preSelectedBuildingId });
    }
    if (this.data.preSelectedFacilityId) {
      this.form.patchValue({ facilityId: this.data.preSelectedFacilityId });
    }
    if (this.data.preSelectedPollId) {
      this.form.patchValue({ pollId: this.data.preSelectedPollId });
    }

    // If only one issue object type is available, set it and make it required
    if (this.availableIssueObjects.length === 1) {
      this.selectedIssueObject = this.availableIssueObjects[0];
      this.form.patchValue({ issueObject: this.availableIssueObjects[0] });
      this.updateFormValidators();
    } else if (this.availableIssueObjects.length > 1) {
      // Multiple types available, require selection
      this.form.get('issueObject')?.setValidators([Validators.required]);
    }

    // Watch for issue object changes
    this.form.get('issueObject')?.valueChanges.subscribe((value: IssueObject | null) => {
      this.selectedIssueObject = value;
      this.updateFormValidators();
    });
  }

  private updateFormValidators(): void {
    const buildingIdControl = this.form.get('buildingId');
    const facilityIdControl = this.form.get('facilityId');
    const pollIdControl = this.form.get('pollId');

    // Clear all validators first
    buildingIdControl?.clearValidators();
    facilityIdControl?.clearValidators();
    pollIdControl?.clearValidators();

    // Set validators based on selected issue object
    if (this.selectedIssueObject === IssueObject.BUILDING) {
      buildingIdControl?.setValidators([Validators.required]);
    } else if (this.selectedIssueObject === IssueObject.FACILITY) {
      facilityIdControl?.setValidators([Validators.required]);
    } else if (this.selectedIssueObject === IssueObject.POLL) {
      pollIdControl?.setValidators([Validators.required]);
    }
    // AREA doesn't need an ID selection (uses user's areaId)

    buildingIdControl?.updateValueAndValidity();
    facilityIdControl?.updateValueAndValidity();
    pollIdControl?.updateValueAndValidity();
  }

  get buildings(): BuildingResponse[] {
    return this.data.buildings || [];
  }

  get facilities(): FacilityResponse[] {
    return this.data.facilities || [];
  }

  get polls(): PollResponse[] {
    return this.data.polls || [];
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const issueObject = formValue.issueObject as IssueObject;

    const payload: IssueRequest = {
      title: formValue.title,
      description: formValue.description,
      priority: formValue.priority,
      issueObject: issueObject,
      areaId: issueObject === IssueObject.AREA ? (this.data.areaId || null) : null,
      buildingId: issueObject === IssueObject.BUILDING ? (formValue.buildingId || null) : null,
      facilityId: issueObject === IssueObject.FACILITY ? (formValue.facilityId || null) : null,
      pollId: issueObject === IssueObject.POLL ? (formValue.pollId || null) : null,
      notifyEveryone: formValue.notifyEveryone || false
    };

    this.isSubmitting = true;
    this.issueApiService.createIssue(payload)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.toast.success('Issue reported successfully');
          this.dialogRef.close(true);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to create issue', error);
          this.errorService.handleServerError(error);
        }
      });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}

