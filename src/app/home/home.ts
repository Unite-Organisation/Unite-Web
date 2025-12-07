import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../auth/services/auth';
import { RolesService } from '../auth/services/roles.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly rolesService = inject(RolesService);

  logout(): void {
    console.info('User logged out - token removed');
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
