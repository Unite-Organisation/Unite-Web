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
  private readonly rolesService = inject(RolesService);
  private readonly dialog = inject(MatDialog);

  isLoading = false;
  facilities: FacilityResponse[] = [];

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
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load facilities', error);
        this.errorService.handleServerError(error);
        this.isLoading = false;
      }
    });
  }
}
