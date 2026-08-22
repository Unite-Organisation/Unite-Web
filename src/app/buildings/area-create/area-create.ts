import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';

import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { Router } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { finalize } from 'rxjs/operators';

import {
  AreaCreateRequest,
  AreaType,
  BuildingRequest,
} from '../../models/api-models/area.models';

import { AreaApiService } from '../services/area-api.service';
import { ToastService } from '../../core/toast.service';
import { ErrorService } from '../../core/error.sevice';

import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-create-area',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,

    ButtonComponent,
  ],

  templateUrl: './area-create.html',
  styleUrl: './area-create.scss',
})
export class CreateArea {
  private readonly fb = inject(FormBuilder);

  private readonly router = inject(Router);

  private readonly areaApiService = inject(AreaApiService);

  private readonly toast = inject(ToastService);

  private readonly errorService = inject(ErrorService);

  protected readonly areaTypes =
    Object.values(AreaType);

  protected isSubmitting = false;

  readonly form: FormGroup = this.fb.group({
    name: this.fb.control('', {
      validators: [
        Validators.required,
      ],
      nonNullable: true,
    }),

    country: this.fb.control('', {
      validators: [
        Validators.required,
      ],
      nonNullable: true,
    }),

    city: this.fb.control('', {
      validators: [
        Validators.required,
      ],
      nonNullable: true,
    }),

    type: this.fb.control(
      AreaType.ESTATE,
      {
        validators: [
          Validators.required,
        ],
        nonNullable: true,
      },
    ),

    buildings:
      this.fb.array<FormGroup>([]),
  });

  get buildingsFormArray(): FormArray {
    return this.form.get(
      'buildings',
    ) as FormArray;
  }

  protected addBuilding(): void {
    const buildingGroup =
      this.fb.group({
        name: this.fb.control('', {
          validators: [
            Validators.required,
          ],
          nonNullable: true,
        }),

        street: this.fb.control('', {
          validators: [
            Validators.required,
          ],
          nonNullable: true,
        }),

        number: this.fb.control('', {
          validators: [
            Validators.required,
          ],
          nonNullable: true,
        }),
      });

    this.buildingsFormArray.push(
      buildingGroup,
    );
  }

  protected removeBuilding(
    index: number,
  ): void {
    this.buildingsFormArray.removeAt(
      index,
    );
  }

  protected getBuildingFormGroup(
    index: number,
  ): FormGroup {
    return this.buildingsFormArray.at(
      index,
    ) as FormGroup;
  }

  protected cancel(): void {
    this.router.navigate([
      '/home/buildings',
    ]);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const formValue =
      this.form.getRawValue();

    const buildings: BuildingRequest[] =
      (
        formValue.buildings ?? []
      ).map(
        (
          building: Partial<BuildingRequest>,
        ) => ({
          name: building.name ?? '',
          street: building.street ?? '',
          number: building.number ?? '',
        }),
      );

    const payload: AreaCreateRequest = {
      name: formValue.name,
      country: formValue.country,
      city: formValue.city,
      type: formValue.type,
      buildings,
    };

    this.isSubmitting = true;

    this.areaApiService
      .createArea(payload)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
        }),
      )
      .subscribe({
        next: () => {
          this.toast.success(
            'Area created successfully',
          );

          this.router.navigate([
            '/home/buildings',
          ]);
        },

        error: (
          error: HttpErrorResponse,
        ) => {
          console.error(
            'Failed to create area',
            error,
          );

          this.errorService
            .handleServerError(error);
        },
      });
  }
}