import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { EventMemberRow } from '../../../models/api-models/public-event.models';
import { PublicEventService } from '../../services/public-event.service';

/** Asks again once typing pauses, not on every key. */
const SEARCH_DELAY_MS = 300;

/**
 * "Who are you?" - the guests of an event as tiles, the one most likely using this phone first, so
 * someone coming back only taps their name and types their code. Account holders are left out: they
 * sign in with their account, there is no code to pick them for.
 */
@Component({
  selector: 'app-member-picker',
  standalone: true,
  templateUrl: './member-picker.html',
  styleUrl: './member-picker.scss',
})
export class MemberPicker implements OnInit, OnDestroy {
  private readonly events = inject(PublicEventService);

  @Input({ required: true }) slug!: string;

  @Output() picked = new EventEmitter<EventMemberRow>();
  /** Nobody to pick from, or the list could not be had - the caller falls back to typing the name. */
  @Output() notListed = new EventEmitter<void>();

  /** null until loaded, most likely person first. */
  protected readonly members = signal<EventMemberRow[] | null>(null);
  protected readonly loading = signal(false);
  protected readonly search = signal('');

  private request: Subscription | null = null;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  /** What the list on screen was asked for - a space typed at the end is not worth a request. */
  private searchedFor: string | null = null;

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.request?.unsubscribe();
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  }

  searchFor(value: string): void {
    this.search.set(value);
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => {
      if (this.search().trim() !== this.searchedFor) {
        this.load();
      }
    }, SEARCH_DELAY_MS);
  }

  initial(name: string): string {
    return name.trim().charAt(0).toUpperCase() || '?';
  }

  private load(): void {
    this.request?.unsubscribe();
    this.loading.set(true);

    const search = this.search().trim();
    this.searchedFor = search;
    this.request = this.events
      .whoCouldThisBe(this.slug, search || undefined)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (rows) => {
          if (!search && rows.length === 0) {
            this.notListed.emit();
            return;
          }
          this.members.set(rows);
        },
        error: () => this.notListed.emit(),
      });
  }
}
