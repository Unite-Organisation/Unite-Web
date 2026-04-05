import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { HttpErrorResponse } from '@angular/common/http';
import { AreaApiService } from '../../buildings/services/area-api.service';
import { AreaInfoResponse } from '../../models/api-models/area.models';
import { ErrorService } from '../../core/error.sevice';

@Component({
  selector: 'app-admin-area-view',
  standalone: true,
  imports: [CommonModule, MatExpansionModule],
  templateUrl: './admin-area-view.html',
  styleUrl: './admin-area-view.scss'
})
export class AdminAreaView implements OnInit {
  private readonly areaApi = inject(AreaApiService);
  private readonly errorService = inject(ErrorService);

  areas: AreaInfoResponse[] = [];
  isLoading = false;

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading = true;
    this.areaApi.getAdminAreaInfo().subscribe({
      next: (data) => {
        this.areas = data;
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorService.handleServerError(err);
        this.isLoading = false;
      }
    });
  }

  formatDate(iso: string): string {
    if (!iso) {
      return '—';
    }
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString();
  }
}
