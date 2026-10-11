import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { EventSlotResponse, SlotPreference } from '../../../models/api-models/public-event.models';
import { formatDay, formatTime } from '../event-dates';

/**
 * One proposed date. The same tile shows the state of a date on the event page and takes the
 * answer in the join panel, so what a member taps is what they later read back.
 */
@Component({
  selector: 'app-date-tile',
  standalone: true,
  templateUrl: './date-tile.html',
  styleUrl: './date-tile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateTile {
  @Input({ required: true }) slot!: EventSlotResponse;
  @Input() minAttendees: number | null = null;

  /** Set while the member is answering; null means the tile is only being read. */
  @Input() selection: SlotPreference | null = null;
  @Input() selectable = false;
  @Input() disabled = false;
  /** The date that carried the event, marked so it reads as settled rather than merely leading. */
  @Input() chosen = false;
  @Input() showCounts = true;

  @Output() picked = new EventEmitter<void>();

  protected readonly preference = SlotPreference;

  get day(): string {
    return formatDay(this.slot.startDate);
  }

  get time(): string {
    return formatTime(this.slot.startDate);
  }

  get endTime(): string | null {
    return this.slot.endDate ? formatTime(this.slot.endDate) : null;
  }

  get people(): number {
    return this.slot.preferredCount + this.slot.ifNeededCount;
  }

  /** Capped so a date that overshot the threshold does not render past the end of the bar. */
  get fill(): number {
    return Math.min(100, Math.max(0, this.slot.chance));
  }

  get stateClass(): string {
    if (this.chosen) {
      return 'tile--chosen';
    }
    if (this.selection === SlotPreference.PREFERRED) {
      return 'tile--yes';
    }
    if (this.selection === SlotPreference.IF_NEEDED) {
      return 'tile--maybe';
    }
    return '';
  }

  handleClick(): void {
    if (this.selectable && !this.disabled) {
      this.picked.emit();
    }
  }
}
