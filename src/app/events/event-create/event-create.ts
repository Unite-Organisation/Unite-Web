import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { Router } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';

import { finalize } from 'rxjs/operators';

import {
  EventRequest,
  PostType,
} from '../../models/api-models/posts.models';

import { PostService } from '../../posts/services/post.service';

import { ToastService } from '../../core/toast/toast.service';

import { ButtonComponent } from '../../shared/components/button/button.component';
import { ServerValidationBinder } from '../../core/errors/server-validation';

import {
  endOfDay,
  startOfDay,
  toLocalDateTime,
} from '../../posts/post-dates';

@Component({
  selector: 'app-create-event',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,

    ButtonComponent,
  ],

  providers: [
    provideNativeDateAdapter(),
  ],

  templateUrl: './event-create.html',
  styleUrl: './event-create.scss',
})
export class CreateEvent {

  private readonly fb = inject(FormBuilder);
  private readonly serverValidation = inject(ServerValidationBinder);

  private readonly router = inject(Router);

  private readonly postService = inject(PostService);

  private readonly toast = inject(ToastService);

  protected isSubmitting = false;


  readonly form: FormGroup = this.fb.group({

    name: this.fb.control('', {
      validators: [Validators.required],
      nonNullable: true,
    }),

    content: this.fb.control('', {
      validators: [Validators.required],
      nonNullable: true,
    }),

    relatedDate: this.fb.control<Date | null>(
      null,
      {
        validators: [Validators.required],
      },
    ),

    visibleFrom: this.fb.control<Date | null>(
      null,
      {
        validators: [Validators.required],
      },
    ),

    visibleTo: this.fb.control<Date | null>(
      null,
      {
        validators: [Validators.required],
      },
    ),

    startDate: this.fb.control<Date | null>(
      null,
      {
        validators: [Validators.required],
      },
    ),

    endDate: this.fb.control<Date | null>(
      null,
      {
        validators: [Validators.required],
      },
    ),

    location: this.fb.control('', {
      nonNullable: true,
    }),

    onlineUrl: this.fb.control('', {
      nonNullable: true,
    }),

    maxAttendees: this.fb.control<number | null>(
      null,
      {
        validators: [Validators.required, Validators.min(1)],
      },
    ),

  });


  protected submit(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;
    }


    const formValue =
      this.form.getRawValue();


    const payload: EventRequest = {

      name: formValue.name,

      content: formValue.content,

      relatedDate: this.formatDate(
        formValue.relatedDate,
      ),

      postType: PostType.EVENT,

      visibleFrom: toLocalDateTime(
        startOfDay(formValue.visibleFrom),
      ),

      visibleTo: toLocalDateTime(
        endOfDay(formValue.visibleTo),
      ),

      startDate: this.formatDate(
        formValue.startDate,
      ),

      endDate: this.formatDate(
        formValue.endDate,
      ),

      location:
        formValue.location ?? '',

      onlineUrl:
        formValue.onlineUrl ?? '',

      maxAttendees: formValue.maxAttendees,

      // Attachments are not supported in the form yet.
      fileKeys: null,
    };


    this.isSubmitting = true;


    this.postService
      .createEvent(payload)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
        }),
      )
      .subscribe({

        next: () => {

          this.toast.success(
            'Event created successfully',
          );

          this.router.navigate([
            '/app/home/events',
          ]);
        },

        error: (
          error: HttpErrorResponse,
        ) => {
          // VALIDATION_ERROR entries name rejected DTO fields; show them on
          // the form itself. The generic notice comes from the interceptor.
          this.serverValidation.apply(this.form, error);

          console.error(
            'Failed to create event',
            error,
          );
        },

      });
  }

  protected cancel(): void {

    this.router.navigate([
      '/app/home/events',
    ]);
  }

  private formatDate(
    date: Date | null,
  ): string {

    if (!date) {
      return '';
    }

    return date.toISOString();
  }
}