import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { OfferingApiService } from '../services/offering-api.service';
import { OfferingRequest, OfferingCategory } from '../../models/api-models/offering.models';
import { ToastService } from '../../core/toast.service';
import { ErrorService } from '../../core/error.sevice';

@Component({
  selector: 'app-create-offering-dialog',
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
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './create-offering-dialog.html',
  styleUrl: './create-offering-dialog.scss',
})
export class CreateOfferingDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CreateOfferingDialog>);
  private readonly offeringApiService = inject(OfferingApiService);
  private readonly toast = inject(ToastService);
  private readonly errorService = inject(ErrorService);

  protected isSubmitting = false;
  protected readonly categories = Object.values(OfferingCategory);
  protected minDate = new Date();

  readonly form: FormGroup = this.fb.group({
    title: this.fb.control('', { validators: [Validators.required, Validators.minLength(3)], nonNullable: true }),
    description: this.fb.control('', { validators: [Validators.required, Validators.minLength(10)], nonNullable: true }),
    category: this.fb.control('', { validators: [Validators.required], nonNullable: true }),
    price: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(0)] }),
    endDate: this.fb.control<Date | null>(null)
  });

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'BABYSITTING': 'Babysitting',
      'PET_SITTING': 'Pet Sitting',
      'CLEANING': 'Cleaning',
      'GROCERY_HELP': 'Grocery Help',
      'DELIVERY': 'Delivery',
      'TUTORING': 'Tutoring',
      'TECH_SUPPORT': 'Tech Support',
      'HANDYMAN': 'Handyman',
      'GARDENING': 'Gardening',
      'OTHER': 'Other'
    };
    return labels[category] || category;
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'BABYSITTING': 'child_care',
      'PET_SITTING': 'pets',
      'CLEANING': 'cleaning_services',
      'GROCERY_HELP': 'shopping_cart',
      'DELIVERY': 'local_shipping',
      'TUTORING': 'school',
      'TECH_SUPPORT': 'computer',
      'HANDYMAN': 'build',
      'GARDENING': 'yard',
      'OTHER': 'more_horiz'
    };
    return icons[category] || 'work';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const payload: OfferingRequest = {
      title: formValue.title,
      description: formValue.description,
      category: formValue.category,
      isActive: true,
      price: formValue.price,
      endDate: formValue.endDate ? new Date(formValue.endDate).toISOString() : null
    };

    this.isSubmitting = true;
    this.offeringApiService.createOffering(payload)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.toast.success('Offering created successfully');
          this.dialogRef.close(true);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to create offering', error);
          this.errorService.handleServerError(error);
        }
      });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}

