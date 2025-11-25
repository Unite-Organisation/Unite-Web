import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string, config: MatSnackBarConfig = {}): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['toast-success'],
      ...config
    });
  }

  error(message: string, config: MatSnackBarConfig = {}): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      panelClass: ['toast-error'],
      ...config
    });
  }
}

