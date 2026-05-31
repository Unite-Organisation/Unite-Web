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
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { TournamentApiService } from '../services/tournament-api.service';
import {
  CreateTournamentRequest,
  TournamentType
} from '../../models/api-models/tournament.models';
import { ToastService } from '../../core/toast.service';
import { ErrorService } from '../../core/error.sevice';

@Component({
  selector: 'app-create-tournament-dialog',
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
    MatIconModule
  ],
  templateUrl: './create-tournament-dialog.html',
  styleUrl: './create-tournament-dialog.scss'
})
export class CreateTournamentDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CreateTournamentDialog>);
  private readonly tournamentApiService = inject(TournamentApiService);
  private readonly toast = inject(ToastService);
  private readonly errorService = inject(ErrorService);

  protected isSubmitting = false;
  protected readonly types = Object.values(TournamentType);

  readonly form: FormGroup = this.fb.group({
    name: this.fb.control('', { validators: [Validators.required, Validators.minLength(3)], nonNullable: true }),
    description: this.fb.control('', { validators: [Validators.required, Validators.minLength(5)], nonNullable: true }),
    teamSize: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
    type: this.fb.control('', { validators: [Validators.required], nonNullable: true })
  });

  getTypeLabel(type: TournamentType): string {
    const labels: Record<TournamentType, string> = {
      [TournamentType.TABLE_FOOTBALL]: 'Table Football',
      [TournamentType.TABLE_TENNIS]: 'Table Tennis',
      [TournamentType.CHESS]: 'Chess'
    };
    return labels[type] ?? type;
  }

  getTypeIcon(type: TournamentType): string {
    const icons: Record<TournamentType, string> = {
      [TournamentType.TABLE_FOOTBALL]: 'sports_soccer',
      [TournamentType.TABLE_TENNIS]: 'sports_tennis',
      [TournamentType.CHESS]: 'chess'
    };
    return icons[type] ?? 'emoji_events';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    const payload: CreateTournamentRequest = {
      name: formValue.name,
      description: formValue.description,
      teamSize: formValue.teamSize!,
      type: formValue.type as TournamentType
    };

    this.isSubmitting = true;
    this.tournamentApiService.createTournament(payload)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.toast.success('Tournament created successfully');
          this.dialogRef.close(true);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to create tournament', error);
          this.errorService.handleServerError(error);
        }
      });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
