import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ErrorService } from '../core/error.sevice';
import { AddButton } from '../shared/add-button/add-button';
import { RolesService } from '../auth/services/roles.service';
import { FacilityApiService } from './services/facility-api.service';
import { FacilityResponse } from '../models/api-models/facility.models';
import { CreateFacilityDialog } from './create-facility-dialog/create-facility-dialog';
import { ReserveFacilityDialog } from './reserve-facility-dialog/reserve-facility-dialog';
import { IssueApiService } from '../issues/services/issue-api.service';
import { IssueResponse } from '../models/api-models/issue.models';
import { FacilityIssuesDialog, FacilityIssuesDialogData } from './facility-issues-dialog/facility-issues-dialog';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-facilities',
  standalone: true,
  imports: [CommonModule, AddButton, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './facilities.html',
  styleUrl: './facilities.scss',
})
export class Facilities implements OnInit {
  private readonly errorService = inject(ErrorService);
  private readonly facilityApiService = inject(FacilityApiService);
  private readonly issueApiService = inject(IssueApiService);
  private readonly rolesService = inject(RolesService);
  private readonly dialog = inject(MatDialog);

  isLoading = false;
  facilities: FacilityResponse[] = [];
  facilityIssuesMap: Map<string, IssueResponse[]> = new Map();

  get canCreateFacility(): boolean {
    return this.rolesService.isManager() || this.rolesService.isAdmin();
  }

  get canReserveFacility(): boolean {
    return this.rolesService.isResident();
  }

  ngOnInit(): void {
    this.loadFacilities();
  }

  openCreateFacilityDialog(): void {
    const dialogRef = this.dialog.open(CreateFacilityDialog, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe((result: boolean | undefined) => {
      if (result) {
        this.loadFacilities();
      }
    });
  }

  openReservationDialog(facility: FacilityResponse): void {
    const dialogRef = this.dialog.open(ReserveFacilityDialog, {
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: facility
    });

    dialogRef.afterClosed().subscribe((result: boolean | undefined) => {
      // Optionally refresh facilities if needed
    });
  }

  private loadFacilities(): void {
    this.isLoading = true;
    this.facilityApiService.getFacilities().subscribe({
      next: (data) => {
        this.facilities = data.facilityResponseList;
        this.isLoading = false;
        // Load issues for all facilities
        this.loadFacilityIssues();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load facilities', error);
        this.errorService.handleServerError(error);
        this.isLoading = false;
      }
    });
  }

  private loadFacilityIssues(): void {
    // Load issues for all facilities in parallel
    const issueRequests = this.facilities.map(facility =>
      this.issueApiService.getFacilityIssues(facility.id)
    );

    if (issueRequests.length === 0) {
      return;
    }

    forkJoin(issueRequests).subscribe({
      next: (issuesArrays) => {
        this.facilityIssuesMap.clear();
        this.facilities.forEach((facility, index) => {
          const issues = issuesArrays[index];
          if (issues && issues.length > 0) {
            this.facilityIssuesMap.set(facility.id, issues);
          }
        });
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load facility issues', error);
        // Don't show error to user, just log it
      }
    });
  }

  hasIssues(facilityId: string): boolean {
    return this.facilityIssuesMap.has(facilityId) && 
           (this.facilityIssuesMap.get(facilityId)?.length ?? 0) > 0;
  }

  getIssuesCount(facilityId: string): number {
    return this.facilityIssuesMap.get(facilityId)?.length ?? 0;
  }

  openFacilityIssuesDialog(facility: FacilityResponse): void {
    const issues = this.facilityIssuesMap.get(facility.id) || [];
    
    const dialogData: FacilityIssuesDialogData = {
      facilityName: facility.name,
      issues: issues
    };

    const dialogRef = this.dialog.open(FacilityIssuesDialog, {
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe();
  }
}
