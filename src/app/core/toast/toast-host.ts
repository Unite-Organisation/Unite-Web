import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Toast, ToastSeverity } from './toast.model';
import { ToastService } from './toast.service';

const GLYPHS: Readonly<Record<ToastSeverity, string>> = {
  success: '✓',
  info: 'i',
  warning: '!',
  error: '×',
};

const LABELS: Readonly<Record<ToastSeverity, string>> = {
  success: 'Done',
  info: 'Notice',
  warning: 'Attention',
  error: 'Error',
};

@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './toast-host.html',
  styleUrl: './toast-host.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastHost {
  private readonly toastService = inject(ToastService);

  readonly toasts = this.toastService.toasts;

  glyphFor(severity: ToastSeverity): string {
    return GLYPHS[severity];
  }

  labelFor(severity: ToastSeverity): string {
    return LABELS[severity];
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
