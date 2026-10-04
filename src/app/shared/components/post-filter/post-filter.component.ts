import {
  Component,
  EventEmitter,
  Output,
  Input
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';

import { CommonModule } from '@angular/common';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';

import {
  PostVisibilityModifier,
  PostFilter
} from '../../../models/api-models/posts.models';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';


@Component({
  selector: 'app-post-filter',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
  ],

  providers: [
    provideNativeDateAdapter(),
  ],

  templateUrl: './post-filter.component.html',
  styleUrl: './post-filter.component.scss',
})
export class PostFilterComponent {
  private readonly fb = new FormBuilder();

    @Input()
    showCreatedBy = false;

  @Output()
  readonly filterChange =
    new EventEmitter<PostFilter>();

  @Output()
  readonly reset =
    new EventEmitter<void>();

  readonly modifiers = [
    {
      label: 'Less than or equal',
      value: PostVisibilityModifier.LESS_OR_EQUAL_THAN,
    },
    {
      label: 'Greater than or equal',
      value: PostVisibilityModifier.GREATER_OR_EQUAL_THAN,
    },
    {
      label: 'Equal',
      value: PostVisibilityModifier.EQUAL,
    },
  ];

  readonly form = this.fb.group({
    visibleFrom: this.fb.control<Date | null>(null),

    visibleFromModifier:
      this.fb.control<PostVisibilityModifier | null>(null),

    visibleTo: this.fb.control<Date | null>(null),

    visibleToModifier:
      this.fb.control<PostVisibilityModifier | null>(null),

    createdBy: this.fb.control<'ALL' | 'MINE'>('ALL'),
  });

  isExpanded = false;

    toggleFilters(): void {
        this.isExpanded = !this.isExpanded;
    }

  protected applyFilters(): void {
    const value = this.form.getRawValue();

    const filter: PostFilter = {};

    if (
      value.visibleFrom &&
      value.visibleFromModifier
    ) {
      filter.visibleFrom =
        this.formatDate(value.visibleFrom);

      filter.visibleFromModifier =
        value.visibleFromModifier;
    }

    if (
      value.visibleTo &&
      value.visibleToModifier
    ) {
      filter.visibleTo =
        this.formatDate(value.visibleTo);

      filter.visibleToModifier =
        value.visibleToModifier;
    }

    if (value.createdBy === 'MINE') {
      filter.createdBy = 'MINE';
    }

    this.filterChange.emit(filter);
  }

  protected resetFilters(): void {
    this.form.reset({
      visibleFrom: null,
      visibleFromModifier: null,

      visibleTo: null,
      visibleToModifier: null,

      createdBy: 'ALL',
    });

    this.reset.emit();
    this.filterChange.emit({});
  }

  private formatDate(date: Date): string {
    return date.toISOString();
  }
}