import { Component, EventEmitter, Input, Output } from '@angular/core';

import { EventMemberRow } from '../../../models/api-models/public-event.models';

/** The name tapped on the "who are you?" list, with the way back to it - only the code is left. */
@Component({
  selector: 'app-picked-member',
  standalone: true,
  template: `
    <span class="picked__avatar" aria-hidden="true">{{ initial }}</span>
    <span class="picked__name">{{ member.displayName }}</span>
    <button type="button" class="pe-quiet-link" (click)="notMe.emit()">Not you?</button>
  `,
  styleUrl: './picked-member.scss',
})
export class PickedMember {
  @Input({ required: true }) member!: EventMemberRow;

  @Output() notMe = new EventEmitter<void>();

  get initial(): string {
    return this.member.displayName.trim().charAt(0).toUpperCase() || '?';
  }
}
