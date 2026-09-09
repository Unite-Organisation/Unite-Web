import {
  Component,
  inject,
  OnInit,
} from '@angular/core';

import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { finalize } from 'rxjs/operators';

import { AreaApiService } from '../buildings/services/area-api.service';

import {
  BuildingResponse,
} from '../models/api-models/area.models';

import {
  BuildingContextService,
} from '../core/building-context.service';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../auth/services/auth';
import { ChatSocketService } from '../chats/chat-socket.service';
import { AuthApiService } from '../auth/services/auth-api.service';


@Component({
  selector: 'app-select-building',

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl: './select-building.html',
  styleUrl: './select-building.scss',
})
export class SelectBuildingComponent
  implements OnInit {

  protected readonly authService = inject(AuthService);
  private readonly chatSocketService = inject(ChatSocketService);
  private readonly authApiService = inject(AuthApiService);

  private readonly areaApiService =
    inject(AreaApiService);

  private readonly buildingContext =
    inject(BuildingContextService);

  private readonly router =
    inject(Router);


  protected buildings:
    BuildingResponse[] = [];

  protected isLoading = false;


  ngOnInit(): void {
    this.loadBuildings();
  }


  private loadBuildings(): void {

    this.isLoading = true;

    this.areaApiService
      .getBuildings()
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: buildings => {
          this.buildings = buildings;
        },
      });
  }


  protected selectBuilding(
    building: BuildingResponse,
  ): void {

    this.buildingContext.setBuilding(
      building.id,
    );

    this.router.navigate([
      '/app/home/announcements',
    ]);
  }

  logout(): void {
    console.info('User logged out - token removed');
    this.chatSocketService.disconnect();
    this.authApiService
      .logout()
      .pipe(
        finalize(() => {
          this.authService.logout();
          this.buildingContext.clearBuilding();
          this.router.navigateByUrl('/login');
        })
      )
      .subscribe({
        error: (err: HttpErrorResponse) => {
          console.error('Logout request failed', err);
        },
      });
  }
}