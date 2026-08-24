import {
    ChangeDetectionStrategy,
    Component,
    Input,
  } from '@angular/core';
  
  export type BadgeVariant =
    | 'published'
    | 'draft'
    | 'review'
    | 'archived'
    | 'urgent'
    | 'featured';
  
  @Component({
    selector: 'app-badge',
    standalone: true,
    templateUrl: './badge.component.html',
    styleUrl: './badge.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
  })
  export class BadgeComponent {
    @Input({ required: true }) variant!: BadgeVariant;
  }