import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormFieldComponent } from '../../shared/components/form-field/form-field.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { UserLoginRequest } from '../../models/auth-models/auth.models';
import { AuthApiService } from '../services/auth-api.service';
import { AuthService } from '../services/auth';
import { ToastService } from '../../core/toast/toast.service';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { UserMetaInfo } from '../../models/api-models/chat.models';
import { BuildingContextService } from '../../core/building-context.service';
import { RolesService } from '../services/roles.service';

@Component({
  selector: 'app-login',
  imports: [
    MatIconModule,
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ButtonComponent,
    FormFieldComponent
  ],
  standalone: true,
  templateUrl: './login.html',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly buildingContext = inject(BuildingContextService);
  private readonly  rolesService = inject(RolesService);
  protected isSubmitting = false;

  readonly form: FormGroup = this.fb.group({
    username: this.fb.control('', { validators: [Validators.required], nonNullable: true }),
    password: this.fb.control('', { validators: [Validators.required], nonNullable: true })
  });

  handleSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.value as UserLoginRequest;
    this.isSubmitting = true;

    this.authApi.login(payload)
      .pipe(
        tap((tokenResponse) => {
          this.authService.saveToken(tokenResponse.accessToken);
        }),
        switchMap(() => this.authApi.getUserMetaInfo()
          .pipe(
            catchError((error) => {
              console.error('Failed to load user meta info', error);
              return of(null);
            })
          )
        ),
        finalize(() => (this.isSubmitting = false))
      )
      .subscribe({
        next: (metaInfo) => {
          if (metaInfo) {
            localStorage.setItem('user-meta-info', JSON.stringify(metaInfo));
          }
          this.toast.success('Logged in successfully');
          this.redirectAfterLogin(metaInfo);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Login failed', error);
        }
      });
  }

  private redirectAfterLogin(metaInfo: UserMetaInfo | null): void {
    if (this.rolesService.isManager()) {
      this.buildingContext.clearBuilding();
      this.router.navigateByUrl('/app/select-building');
      return;
    }

    if (metaInfo?.buildingId) {
      this.buildingContext.setBuilding(metaInfo.buildingId);
    }

    this.router.navigateByUrl('/app/home');
  }

  switchToRegister(): void {
    this.router.navigateByUrl('/register')
  }
}
