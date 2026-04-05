import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthApiService } from '../../auth/services/auth-api.service';
import { PersonalData } from '../../models/api-models/personal-info.models';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorService } from '../../core/error.sevice';
import { HomeService } from '../services/home.service';
import { IssueApiService } from '../../issues/services/issue-api.service';
import { IssueResponse } from '../../models/api-models/issue.models';
import { IssueCard } from '../../issues/issue-card/issue-card';
import { forkJoin } from 'rxjs';
import { RolesService } from '../../auth/services/roles.service';

@Component({
  selector: 'app-home-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, IssueCard],
  templateUrl: './home-dashboard.html',
  styleUrl: './home-dashboard.scss'
  
})
export class HomeDashboard implements OnInit {
  private readonly homeService = inject(HomeService);
  private readonly errorService = inject(ErrorService);
  private readonly router = inject(Router);
  private readonly issueApiService = inject(IssueApiService);
  protected readonly rolesService = inject(RolesService);

  personalData: PersonalData | null = null;
  isLoading = false;
  isLoadingIssues = false;
  buildingIssues: IssueResponse[] = [];
  areaIssues: IssueResponse[] = [];

  ngOnInit(): void {
    if (this.rolesService.isAdmin()) {
      return;
    }
    this.loadPersonalData();
  }

  private loadPersonalData(): void {
    this.isLoading = true;
    this.homeService.getPersonalData().subscribe({
      next: (data) => {
        this.personalData = data;
        this.isLoading = false;
        // Load issues after personal data is loaded
        if (data.buildingId && data.areaId) {
          this.loadIssues(data.buildingId, data.areaId);
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load personal data', error);
        this.errorService.handleServerError(error);
        this.isLoading = false;
      }
    });
  }

  private loadIssues(buildingId: string, areaId: string): void {
    this.isLoadingIssues = true;
    forkJoin({
      buildingIssues: this.issueApiService.getBuildingIssues(buildingId),
      areaIssues: this.issueApiService.getAreaIssues(areaId)
    }).subscribe({
      next: (data) => {
        this.buildingIssues = data.buildingIssues;
        this.areaIssues = data.areaIssues;
        this.isLoadingIssues = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load issues', error);
        this.errorService.handleServerError(error);
        this.isLoadingIssues = false;
      }
    });
  }

  navigateToFacilities(): void {
    this.router.navigate(['/home/facilities']);
  }

  navigateToAdminPanel(): void {
    this.router.navigate(['/home/area']);
  }
}


