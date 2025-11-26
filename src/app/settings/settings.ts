import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Settings</h2>
    <p>Manage your Unite profile and preferences.</p>
  `
})
export class Settings {}


