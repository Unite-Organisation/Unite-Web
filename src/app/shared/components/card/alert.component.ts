import {
    ChangeDetectionStrategy,
    Component,
    Input,
  } from '@angular/core';
  
  export type AlertVariant =
    | 'info'
    | 'success'
    | 'warning'
    | 'error';
  
  @Component({
    selector: 'app-alert',
    standalone: true,
    templateUrl: './alert.component.html',
    styleUrl: './alert.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
  })
  export class AlertComponent {
    @Input() variant: AlertVariant = 'info';
    @Input() title?: string;
  }