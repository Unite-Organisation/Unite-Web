import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { AreaCreateRequest, AreaType, BuildingRequest } from '../../models/api-models/area.models';

@Component({
  selector: 'app-create-area-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './create-area-dialog.html',
  styleUrl: './create-area-dialog.scss'
})
export class CreateAreaDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CreateAreaDialog>);

  readonly areaTypes = Object.values(AreaType);
  protected isSubmitting = false;

  readonly form: FormGroup = this.fb.group({
    name: this.fb.control('', { validators: [Validators.required], nonNullable: true }),
    country: this.fb.control('', { validators: [Validators.required], nonNullable: true }),
    city: this.fb.control('', { validators: [Validators.required], nonNullable: true }),
    type: this.fb.control(AreaType.ESTATE, { validators: [Validators.required], nonNullable: true }),
    buildings: this.fb.array<FormGroup>([])
  });

  get buildingsFormArray(): FormArray {
    return this.form.get('buildings') as FormArray;
  }

  addBuilding(): void {
    const buildingGroup = this.fb.group({
      name: this.fb.control('', { validators: [Validators.required], nonNullable: true }),
      street: this.fb.control('', { validators: [Validators.required], nonNullable: true }),
      number: this.fb.control('', { validators: [Validators.required], nonNullable: true })
    });
    this.buildingsFormArray.push(buildingGroup);
  }

  removeBuilding(index: number): void {
    this.buildingsFormArray.removeAt(index);
  }

  getBuildingFormGroup(index: number): FormGroup {
    return this.buildingsFormArray.at(index) as FormGroup;
  }

  cancel(): void {
    this.dialogRef.close();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const payload: AreaCreateRequest = {
      name: formValue.name!,
      country: formValue.country!,
      city: formValue.city!,
      type: formValue.type!,
      buildings: (formValue.buildings || []).map((b: Partial<BuildingRequest>) => ({
        name: b.name!,
        street: b.street!,
        number: b.number!
      }))
    };

    this.dialogRef.close(payload);
  }
}

