import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Injectable, Injector, signal, inject } from '@angular/core';
import {
  MAX_VISIBLE_TOASTS,
  Toast,
  ToastOptions,
  ToastSeverity,
  TOAST_DEFAULT_DURATION,
  TOAST_LEAVE_ANIMATION_MS,
} from './toast.model';
import { ToastHost } from './toast-host';


@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly overlay = inject(Overlay);
  private readonly injector = inject(Injector);

  private readonly visibleToasts = signal<Toast[]>([]);
  private readonly queue: Toast[] = [];

  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  private overlayRef: OverlayRef | null = null;
  private nextId = 0;

  readonly toasts = this.visibleToasts.asReadonly();

  success(message: string, options: ToastOptions = {}): number {
    return this.show(message, 'success', options);
  }

  error(message: string, options: ToastOptions = {}): number {
    return this.show(message, 'error', options);
  }

  warning(message: string, options: ToastOptions = {}): number {
    return this.show(message, 'warning', options);
  }

  info(message: string, options: ToastOptions = {}): number {
    return this.show(message, 'info', options);
  }

  show(message: string, severity: ToastSeverity, options: ToastOptions = {}): number {
    this.ensureOverlay();

    const toast: Toast = {
      id: this.nextId++,
      message,
      severity,
      duration: options.duration ?? TOAST_DEFAULT_DURATION[severity],
      actionLabel: options.actionLabel,
      onAction: options.onAction,
      leaving: false,
    };

    if (this.visibleToasts().length >= MAX_VISIBLE_TOASTS) {
      this.queue.push(toast);
      return toast.id;
    }

    this.mount(toast);
    return toast.id;
  }

  dismiss(id: number): void {
    this.clearTimer(id);

    const queuedIndex = this.queue.findIndex((toast) => toast.id === id);
    if (queuedIndex !== -1) {
      this.queue.splice(queuedIndex, 1);
      return;
    }

    const current = this.visibleToasts().find((toast) => toast.id === id);
    if (!current || current.leaving) {
      return;
    }

    this.visibleToasts.update((toasts) =>
      toasts.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast))
    );

    setTimeout(() => this.remove(id), TOAST_LEAVE_ANIMATION_MS);
  }

  dismissAll(): void {
    this.queue.length = 0;
    this.visibleToasts().forEach((toast) => this.dismiss(toast.id));
  }

  pauseTimer(id: number): void {
    this.clearTimer(id);
  }

  resumeTimer(id: number): void {
    const toast = this.visibleToasts().find((candidate) => candidate.id === id);
    if (toast && !toast.leaving) {
      this.startTimer(toast);
    }
  }

  private mount(toast: Toast): void {
    this.visibleToasts.update((toasts) => [...toasts, toast]);
    this.startTimer(toast);
  }

  private remove(id: number): void {
    this.visibleToasts.update((toasts) => toasts.filter((toast) => toast.id !== id));

    const next = this.queue.shift();
    if (next) {
      this.mount(next);
    }
  }

  private startTimer(toast: Toast): void {
    if (toast.duration <= 0) {
      return;
    }
    this.clearTimer(toast.id);
    this.timers.set(
      toast.id,
      setTimeout(() => this.dismiss(toast.id), toast.duration)
    );
  }

  private clearTimer(id: number): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  private ensureOverlay(): void {
    if (this.overlayRef) {
      return;
    }

    this.overlayRef = this.overlay.create({
      positionStrategy: this.overlay.position().global().bottom().centerHorizontally(),
      scrollStrategy: this.overlay.scrollStrategies.noop(),
      hasBackdrop: false,
      panelClass: 'toast-overlay-panel',
    });

    this.overlayRef.attach(new ComponentPortal(ToastHost, null, this.injector));
  }
}
