import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { filter, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../auth/services/auth';
import { RolesService } from '../auth/services/roles.service';
import { HomeService } from './services/home.service';
import { AreaApiService } from '../buildings/services/area-api.service';
import { FacilityApiService } from '../facilities/services/facility-api.service';
import { PollApiService } from '../polls/services/poll-api.service';
import { ReportIssueDialog, ReportIssueDialogData } from '../issues/report-issue-dialog/report-issue-dialog';
import { IssueObject } from '../models/api-models/issue.models';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorService } from '../core/error.sevice';
import { forkJoin } from 'rxjs';
import { ChatSocketService } from '../chats/chat-socket.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  protected readonly authService = inject(AuthService);
  private readonly chatSocketService = inject(ChatSocketService);
  private readonly router = inject(Router);
  protected readonly rolesService = inject(RolesService);
  private readonly dialog = inject(MatDialog);
  private readonly homeService = inject(HomeService);
  private readonly areaApiService = inject(AreaApiService);
  private readonly facilityApiService = inject(FacilityApiService);
  private readonly pollApiService = inject(PollApiService);
  private readonly errorService = inject(ErrorService);
  private readonly destroy$ = new Subject<void>();

  protected canReportIssue = false;
  private currentRoute = '';

  ngOnInit(): void {
    // Track route changes
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: any) => {
        this.currentRoute = event.url;
        this.updateReportButtonState();
      });

    // Check initial route
    this.currentRoute = this.router.url;
    this.updateReportButtonState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateReportButtonState(): void {
    // Enable button on: /home (dashboard), /home/facilities, /home/polls
    this.canReportIssue = 
      this.currentRoute === '/home' || 
      this.currentRoute.startsWith('/home/facilities') ||
      this.currentRoute.startsWith('/home/polls');
  }

  openReportIssueDialog(): void {
    // Prevent opening dialog if button is disabled
    if (!this.canReportIssue || !this.rolesService.isResident()) {
      return;
    }

    // Determine dialog data based on current route
    if (this.currentRoute === '/home') {
      // Home dashboard: can report AREA or BUILDING issues
      this.openHomeDashboardDialog();
    } else if (this.currentRoute.startsWith('/home/facilities')) {
      // Facilities: can report FACILITY issues
      this.openFacilityDialog();
    } else if (this.currentRoute.startsWith('/home/polls')) {
      // Polls: can report POLL issues
      this.openPollDialog();
    }
  }

  private openHomeDashboardDialog(): void {
    // Load personal data and buildings
    forkJoin({
      personalData: this.homeService.getPersonalData(),
      buildings: this.areaApiService.getBuildings()
    }).subscribe({
      next: (data) => {
        const dialogData: ReportIssueDialogData = {
          availableIssueObjects: [IssueObject.AREA, IssueObject.BUILDING],
          buildings: data.buildings,
          areaId: data.personalData.areaId,
          buildingId: data.personalData.buildingId
        };

        const dialogRef = this.dialog.open(ReportIssueDialog, {
          width: '600px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          data: dialogData
        });

        dialogRef.afterClosed().subscribe();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load data for issue dialog', error);
        this.errorService.handleServerError(error);
      }
    });
  }

  private openFacilityDialog(): void {
    // Load facilities
    this.facilityApiService.getFacilities().subscribe({
      next: (data) => {
        const dialogData: ReportIssueDialogData = {
          issueObject: IssueObject.FACILITY,
          facilities: data.facilityResponseList
        };

        const dialogRef = this.dialog.open(ReportIssueDialog, {
          width: '600px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          data: dialogData
        });

        dialogRef.afterClosed().subscribe();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load facilities for issue dialog', error);
        this.errorService.handleServerError(error);
      }
    });
  }

  private openPollDialog(): void {
    // Load polls
    this.pollApiService.getPolls({
      pageSize: 100,
      page: 1
    }).subscribe({
      next: (polls) => {
        const dialogData: ReportIssueDialogData = {
          issueObject: IssueObject.POLL,
          polls: polls
        };

        const dialogRef = this.dialog.open(ReportIssueDialog, {
          width: '600px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          data: dialogData
        });

        dialogRef.afterClosed().subscribe();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load polls for issue dialog', error);
        this.errorService.handleServerError(error);
      }
    });
  }

  logout(): void {
    console.info('User logged out - token removed');
    this.chatSocketService.disconnect();
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
