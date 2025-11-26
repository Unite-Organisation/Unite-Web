import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-offerings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Offerings</h2>
    <p>Services and offers shared within your community.</p>
  `
})
export class Offerings {}


