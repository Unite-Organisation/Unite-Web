import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'add-button',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './add-button.html',
  styleUrl: './add-button.scss'
})
export class AddButton {

  @Input() disabled: boolean = false;
  @Output() buttonClick = new EventEmitter<void>();

  handleClick(): void {
    if (!this.disabled) {
      this.buttonClick.emit();
    }
  }

}
