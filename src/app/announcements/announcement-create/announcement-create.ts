import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { finalize } from 'rxjs/operators';

import { AreaApiService } from '../../buildings/services/area-api.service';
import { BuildingResponse } from '../../models/api-models/area.models';
import {
  AnnouncementRequest,
  PostType,
} from '../../models/api-models/posts.models';
import { PostService } from '../../posts/services/post.service';

import { ToastService } from '../../core/toast.service';
import { ErrorService } from '../../core/error.sevice';

import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-create-announcement',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,

    ButtonComponent,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './announcement-create.html',
  styleUrl: './announcement-create.scss',
})
export class CreateAnnouncement implements OnInit {
  private readonly fb = inject(FormBuilder);

  private readonly router = inject(Router);

  private readonly areaApiService = inject(AreaApiService);

  private readonly postService = inject(PostService);

  private readonly toast = inject(ToastService);

  private readonly errorService = inject(ErrorService);

  protected isSubmitting = false;

  protected isLoadingBuildings = false;

  protected buildings: BuildingResponse[] = [];

  readonly form: FormGroup = this.fb.group({
    name: this.fb.control('', {
      validators: [Validators.required],
      nonNullable: true,
    }),

    buildingId: this.fb.control('', {
      validators: [Validators.required],
      nonNullable: true,
    }),

    content: this.fb.control('', {
      validators: [Validators.required],
      nonNullable: true,
    }),

    relatedDate: this.fb.control<Date | null>(null, {
      validators: [Validators.required],
    }),
  });

  ngOnInit(): void {
    this.loadBuildings();
  }

  private loadBuildings(): void {
    this.isLoadingBuildings = true;

    this.areaApiService
      .getBuildings()
      .pipe(
        finalize(() => {
          this.isLoadingBuildings = false;
        }),
      )
      .subscribe({
        next: (buildings) => {
          this.buildings = buildings;
        },

        error: (error: HttpErrorResponse) => {
          console.error(
            'Failed to load buildings',
            error,
          );

          this.errorService.handleServerError(
            error,
          );
        },
      });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const formValue = this.form.getRawValue();

    const payload: AnnouncementRequest = {
      name: formValue.name,

      buildingId: formValue.buildingId,

      content: formValue.content,

      relatedDate: this.formatDate(
        formValue.relatedDate,
      ),

      postType: PostType.ANNOUNCEMENT,
    };

    this.isSubmitting = true;

    this.postService
      .createAnnouncement(payload)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
        }),
      )
      .subscribe({
        next: () => {
          this.toast.success(
            'Announcement created successfully',
          );

          this.router.navigate([
            '/app/home/announcements',
          ]);
        },

        error: (
          error: HttpErrorResponse,
        ) => {
          console.error(
            'Failed to create announcement',
            error,
          );

          this.errorService.handleServerError(
            error,
          );
        },
      });
  }

  protected cancel(): void {
    this.router.navigate([
      '/app/home/announcements',
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