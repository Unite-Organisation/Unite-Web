import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { AnnouncementRequest, PostType } from '../../models/api-models/posts.models';
import { PostService } from '../../posts/services/post.service';
import { ToastService } from '../../core/toast/toast.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { ServerValidationBinder } from '../../core/errors/server-validation';
import { endOfDay, startOfDay, toLocalDateTime } from '../announcement-dates';

@Component({
  selector: 'app-create-ann-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    ButtonComponent
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './create-ann-dialog.html',
  styleUrl: './create-ann-dialog.scss',
})
export class CreateAnnDialog {
  private readonly fb = inject(FormBuilder);
  private readonly serverValidation = inject(ServerValidationBinder);
  private readonly dialogRef = inject(MatDialogRef<CreateAnnDialog>);
  private readonly postService = inject(PostService);
  private readonly toast = inject(ToastService);

  protected isSubmitting = false;

  readonly form: FormGroup = this.fb.group({
    name: this.fb.control('', { validators: [Validators.required], nonNullable: true }),
    content: this.fb.control('', { validators: [Validators.required], nonNullable: true }),
    relatedDate: this.fb.control<Date | null>(null, { validators: [Validators.required] }),
    visibleFrom: this.fb.control<Date | null>(null, { validators: [Validators.required] }),
    visibleTo: this.fb.control<Date | null>(null, { validators: [Validators.required] })
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const payload: AnnouncementRequest = {
      name: formValue.name,
      content: formValue.content,
      relatedDate: this.formatDate(formValue.relatedDate),
      postType: PostType.ANNOUNCEMENT,
      visibleFrom: toLocalDateTime(startOfDay(formValue.visibleFrom)),
      visibleTo: toLocalDateTime(endOfDay(formValue.visibleTo)),
      // Attachments are not supported in the form yet.
      fileKeys: null
    };

    this.isSubmitting = true;
    this.postService.createAnnouncement(payload)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.toast.success('Announcement created successfully');
          this.dialogRef.close(true);
        },
        error: (error: HttpErrorResponse) => {
          // VALIDATION_ERROR entries name rejected DTO fields; show them on
          // the form itself. The generic notice comes from the interceptor.
          this.serverValidation.apply(this.form, error);
          console.error('Failed to create announcement', error);
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
