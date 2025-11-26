import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-issues',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Issues</h2>
    <p>Report and track issues in your building or community.</p>
  `
})
export class Issues {}


