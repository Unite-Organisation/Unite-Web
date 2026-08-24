import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
  } from '@angular/core';
  
  export type ButtonVariant =
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'danger';
  
  export type ButtonSize = 'sm' | 'md' | 'lg';
  
  @Component({
    selector: 'app-button',
    standalone: true,
    templateUrl: './button.component.html',
    styleUrl: './button.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
  })
  export class ButtonComponent {
    @Input() variant: ButtonVariant = 'primary';
    @Input() size: ButtonSize = 'md';
    @Input() disabled = false;
    @Input() type: 'button' | 'submit' | 'reset' = 'button';
  
    @Output() clicked = new EventEmitter<MouseEvent>();
  
    get classes(): string[] {
      return [
        `button--${this.variant}`,
        `button--${this.size}`,
      ];
    }
  
    onClick(event: MouseEvent): void {
      if (!this.disabled) {
        this.clicked.emit(event);
      }
    }
  }