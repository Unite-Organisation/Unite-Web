import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './form-field.component.html',
  styleUrl: './form-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldComponent {
  @Input({ required: true }) label!: string;
  @Input() placeholder = '';
  @Input() type = 'text';
  @Input() hint?: string;
  @Input() error?: string;
  @Input() required = false;
  @Input() disabled = false;

  @Input() value = '';

  onValueChange(value: string): void {
    this.value = value;
  }
}