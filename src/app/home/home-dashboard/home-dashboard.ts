import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthApiService } from '../../auth/services/auth-api.service';
import { PersonalData } from '../../models/api-models/personal-info.models';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorService } from '../../core/error.sevice';
import { HomeService } from '../services/home.service';

@Component({
  selector: 'app-home-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-dashboard.html',
  styleUrl: './home-dashboard.scss'
  
})
export class HomeDashboard implements OnInit {
  private readonly homeService = inject(HomeService);
  private readonly errorService = inject(ErrorService);
  private readonly router = inject(Router);

  personalData: PersonalData | null = null;
  isLoading = false;

  ngOnInit(): void {
    this.loadPersonalData();
  }

  private loadPersonalData(): void {
    this.isLoading = true;
    this.homeService.getPersonalData().subscribe({
      next: (data) => {
        this.personalData = data;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load personal data', error);
        this.errorService.handleServerError(error);
        this.isLoading = false;
      }
    });
  }

  navigateToFacilities(): void {
    this.router.navigate(['/home/facilities']);
  }
}


