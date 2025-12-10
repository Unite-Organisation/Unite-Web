import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { AreaApiService } from '../../buildings/services/area-api.service';
import { BuildingResponse } from '../../models/api-models/area.models';
import { EventRequest, PostType } from '../../models/api-models/posts.models';
import { PostService } from '../../posts/services/post.service';
import { ToastService } from '../../core/toast.service';
import { ErrorService } from '../../core/error.sevice';

@Component({
  selector: 'app-create-event-dialog',
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
    MatSlideToggleModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './create-event-dialog.html',
  styleUrl: './create-event-dialog.scss',
})
export class CreateEventDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CreateEventDialog>);
  private readonly areaApiService = inject(AreaApiService);
  private readonly postService = inject(PostService);
  private readonly toast = inject(ToastService);
  private readonly errorService = inject(ErrorService);

  protected isSubmitting = false;
  protected isLoadingBuildings = false;
  protected buildings: BuildingResponse[] = [];
  protected isAreaWide = false;

  readonly form: FormGroup = this.fb.group({
    name: this.fb.control('', { validators: [Validators.required], nonNullable: true }),
    buildingId: this.fb.control('', { validators: [Validators.required], nonNullable: true }),
    content: this.fb.control('', { validators: [Validators.required], nonNullable: true }),
    relatedDate: this.fb.control<Date | null>(null, { validators: [Validators.required] }),
    startDate: this.fb.control<Date | null>(null, { validators: [Validators.required] }),
    endDate: this.fb.control<Date | null>(null, { validators: [Validators.required] }),
    location: this.fb.control('', { nonNullable: true }),
    onlineUrl: this.fb.control('', { nonNullable: true }),
    maxAttendees: this.fb.control<number | null>(null)
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

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const payload: EventRequest = {
      name: formValue.name,
      buildingId: this.isAreaWide ? null : formValue.buildingId,
      content: formValue.content,
      relatedDate: this.formatDate(formValue.relatedDate),
      postType: PostType.EVENT,
      startDate: this.formatDate(formValue.startDate),
      endDate: this.formatDate(formValue.endDate),
      location: formValue.location || '',
      onlineUrl: formValue.onlineUrl || '',
      maxAttendees: formValue.maxAttendees || 0
    };

    this.isSubmitting = true;
    this.postService.createEvent(payload)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.toast.success('Event created successfully');
          this.dialogRef.close(true);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to create event', error);
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
