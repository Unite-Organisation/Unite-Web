import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BuildingResponse } from '../../models/api-models/area.models';

@Component({
  selector: 'plain-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './plain-card.html',
  styleUrl: './plain-card.scss'
})
export class PlainCard {
  @Input({ required: true }) building!: BuildingResponse;
  @Output() addUsers = new EventEmitter<BuildingResponse>();

  onAddUsers(): void {
    this.addUsers.emit(this.building);
  }
}

