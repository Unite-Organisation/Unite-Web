export type ToastSeverity = 'success' | 'error' | 'warning' | 'info';

export type ErrorSeverity = Exclude<ToastSeverity, 'success'>;

export interface ToastOptions {
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

export interface Toast {
  readonly id: number;
  readonly message: string;
  readonly severity: ToastSeverity;
  readonly duration: number;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  /** Set while the leave animation plays, just before removal. */
  readonly leaving: boolean;
}

export const TOAST_DEFAULT_DURATION: Readonly<Record<ToastSeverity, number>> = {
  success: 3000,
  info: 4000,
  warning: 5000,
  error: 6000,
};

export const MAX_VISIBLE_TOASTS = 4;
export const TOAST_LEAVE_ANIMATION_MS = 180;
