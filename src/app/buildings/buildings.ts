import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { AreaApiService } from './services/area-api.service';
import { CreateAreaDialog } from './create-area-dialog/create-area-dialog';
import { ToastService } from '../core/toast.service';
import { ErrorService } from '../core/error.sevice';
import { AreaCreateRequest, BuildingResponse } from '../models/api-models/area.models';
import { PlainCard } from '../shared/plain-card/plain-card';

@Component({
  selector: 'app-buildings',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule, PlainCard],
  templateUrl: './buildings.html',
  styleUrl: './buildings.scss'
})
export class Buildings implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly areaApiService = inject(AreaApiService);
  private readonly toast = inject(ToastService);
  private readonly errorService = inject(ErrorService);
  protected buildings: BuildingResponse[] = [];
  protected isLoading = false;

  ngOnInit(): void {
    this.getBuildings();
  }

  openCreateAreaDialog(): void {
    const dialogRef = this.dialog.open(CreateAreaDialog, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe((result: AreaCreateRequest | undefined) => {
      if (result) {
        this.createArea(result);
      }
    });
  }

  private createArea(payload: AreaCreateRequest): void {
    this.areaApiService.createArea(payload)
      .pipe(finalize(() => {}))
      .subscribe({
        next: () => {
          this.toast.success('Area created successfully');
          // TODO: Refresh areas list
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to create area', error);
          this.errorService.handleServerError(error);
        }
      });
  }

  private getBuildings(): void {
    this.isLoading = true;
    this.areaApiService.getBuildings()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (buildings) => {
          this.buildings = buildings;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to load buildings', error);
          this.errorService.handleServerError(error);
        }
      });
  }

  onAddUsers(building: BuildingResponse): void {
    // TODO: Open dialog to add users to building
    console.log('Add users to building:', building);
  }
}

