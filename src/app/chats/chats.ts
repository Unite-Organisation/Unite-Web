import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-chats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Chats</h2>
    <p>Conversations with your neighbors and community managers.</p>
  `
})
export class Chats {}


