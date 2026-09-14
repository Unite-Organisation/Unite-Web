import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Toast, ToastSeverity } from './toast.model';
import { ToastService } from './toast.service';

const ICONS: Readonly<Record<ToastSeverity, string>> = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

/** Renders the toast stack. Attached once to a CDK overlay by ToastService. */
@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './toast-host.html',
  styleUrl: './toast-host.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastHost {
  private readonly toastService = inject(ToastService);

  readonly toasts = this.toastService.toasts;

  iconFor(severity: ToastSeverity): string {
    return ICONS[severity];
  }

  trackById(_index: number, toast: Toast): number {
    return toast.id;
  }

  dismiss(toast: Toast): void {
    this.toastService.dismiss(toast.id);
  }

  runAction(toast: Toast): void {
    toast.onAction?.();
    this.toastService.dismiss(toast.id);
  }

  pause(toast: Toast): void {
    this.toastService.pauseTimer(toast.id);
  }

  resume(toast: Toast): void {
    this.toastService.resumeTimer(toast.id);
  }
}
