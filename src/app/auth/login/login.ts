import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { UserLoginRequest } from '../../models/auth-models/auth.models';
import { AuthApiService } from '../services/auth-api.service';
import { AuthService } from '../services/auth';
import { ToastService } from '../../core/toast.service';
import { ErrorService } from '../../core/error.sevice';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  standalone: true, 
  templateUrl: './login.html',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly errorService = inject(ErrorService);
  private readonly router = inject(Router);

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
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (tokenResponse) => {
          this.authService.saveToken(tokenResponse.accessToken);
          this.toast.success('Logged in successfully');
          this.router.navigateByUrl('/home/announcements');
        },
        error: (error: HttpErrorResponse) => {
          console.error('Login failed', error);
          this.errorService.handleServerError(error);
        }
      });
  }

  switchToRegister(): void {
    this.router.navigateByUrl('/register')
  }
}
