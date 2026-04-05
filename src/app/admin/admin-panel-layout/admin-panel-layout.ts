import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-panel-layout',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-panel-layout.html',
  styleUrl: './admin-panel-layout.scss'
})
export class AdminPanelLayout {}
