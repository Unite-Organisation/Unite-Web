import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-polls',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Polls</h2>
    <p>Here you will see polls from your community.</p>
  `
})
export class Polls {}


