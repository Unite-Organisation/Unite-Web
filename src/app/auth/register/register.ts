import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { UserLoginRequest, UserRegisterRequest } from '../../models/auth-models/auth.models';
import { AuthApiService } from '../services/auth-api.service';
import { finalize, switchMap } from 'rxjs/operators';
import { ToastService } from '../../core/toast.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorService } from '../../core/error.sevice';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  standalone: true, 
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly errorService = inject(ErrorService)
  private readonly authService = inject(AuthService);

  protected isSubmitting = false;
  readonly roles = ['RESIDENT', 'MANAGER', 'ADMIN'];

  readonly form: FormGroup = this.fb.group({
    firstName: this.fb.control('', { validators: [Validators.required, Validators.minLength(2)], nonNullable: true }),
    lastName: this.fb.control('', { validators: [Validators.required, Validators.minLength(2)], nonNullable: true }),
    username: this.fb.control('', { validators: [Validators.required, Validators.minLength(4)], nonNullable: true }),
    email: this.fb.control('', { validators: [Validators.required, Validators.email], nonNullable: true }),
    password: this.fb.control('', { validators: [Validators.required, Validators.minLength(8)], nonNullable: true }),
    role: this.fb.control('RESIDENT', { validators: [Validators.required], nonNullable: true })
  });

  readonly formValue = computed<UserRegisterRequest | null>(() =>
    this.form.valid ? (this.form.value as UserRegisterRequest) : null
  );

  handleSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.value as UserRegisterRequest;
    this.isSubmitting = true;

    this.authApi.register(payload)
      .pipe(
        switchMap(() => {
          const loginPayload: UserLoginRequest = {
            username: payload.username,
            password: payload.password
          };
          return this.authApi.login(loginPayload);
        }),
        finalize(() => (this.isSubmitting = false))
      )
      .subscribe({
        next: (tokenResponse) => {
          this.authService.saveToken(tokenResponse.accessToken);
          this.toast.success('Account created successfully');
          this.router.navigateByUrl('/home/announcements');
        },
        error: (error: HttpErrorResponse) => {
          console.error('Registration or login failed', error);
          this.errorService.handleServerError(error);
        }
      });
    }

    switchToLogin(): void {
      this.router.navigateByUrl('/login')
    }
}
