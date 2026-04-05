import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { JobApiService } from '../services/job-api.service';
import { JobResponse, JobStatus } from '../../models/api-models/job.models';
import { ErrorService } from '../../core/error.sevice';
import { ToastService } from '../../core/toast.service';

type StatusFilter = 'ALL' | JobStatus;

@Component({
  selector: 'app-admin-jobs-view',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './admin-jobs-view.html',
  styleUrl: './admin-jobs-view.scss'
})
export class AdminJobsView implements OnInit {
  private readonly jobApi = inject(JobApiService);
  private readonly errorService = inject(ErrorService);
  private readonly toast = inject(ToastService);

  protected readonly JobStatus = JobStatus;
  protected readonly statusLegend: { status: JobStatus; label: string }[] = [
    { status: JobStatus.FAILED, label: 'Failed' },
    { status: JobStatus.SUCCESS, label: 'Success' },
    { status: JobStatus.NEEDS_MANUAL_FIX, label: 'Needs manual fix' }
  ];

  jobs: JobResponse[] = [];
  isLoading = false;
  statusFilter: StatusFilter = 'ALL';
  rerunningId: string | null = null;
  runAllInProgress = false;

  ngOnInit(): void {
    this.load();
  }

  protected onFilterChange(value: StatusFilter): void {
    this.statusFilter = value;
    this.load();
  }

  load(): void {
    this.isLoading = true;
    const status = this.statusFilter === 'ALL' ? undefined : this.statusFilter;
    this.jobApi.getJobs(status).subscribe({
      next: (data) => {
        this.jobs = data;
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorService.handleServerError(err);
        this.isLoading = false;
      }
    });
  }

  rerunOne(job: JobResponse): void {
    this.rerunningId = job.id;
    this.jobApi
      .rerunJob(job.id)
      .pipe(finalize(() => (this.rerunningId = null)))
      .subscribe({
        next: (newStatus) => {
          this.toast.success(`Job rerun finished: ${newStatus}`);
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.errorService.handleServerError(err);
        }
      });
  }

  rerunAll(): void {
    this.runAllInProgress = true;
    this.jobApi
      .rerunAllFailedJobs()
      .pipe(finalize(() => (this.runAllInProgress = false)))
      .subscribe({
        next: () => {
          this.toast.success('Rerun all failed jobs started');
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.errorService.handleServerError(err);
        }
      });
  }

  formatDate(iso: string | null): string {
    if (!iso) {
      return '—';
    }
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString();
  }

  statusClass(status: JobStatus): string {
    switch (status) {
      case JobStatus.FAILED:
        return 'job-status job-status-failed';
      case JobStatus.SUCCESS:
        return 'job-status job-status-success';
      case JobStatus.NEEDS_MANUAL_FIX:
        return 'job-status job-status-manual';
      default:
        return 'job-status';
    }
  }
}
