import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-facilities',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Facilities</h2>
    <p>Manage and view shared facilities in your building.</p>
  `
})
export class Facilities {}


