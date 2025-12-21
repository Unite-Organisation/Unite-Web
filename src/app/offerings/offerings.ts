import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs/operators';
import { OfferingApiService } from './services/offering-api.service';
import { OfferingResponse, OfferingCategory, PriceModifier } from '../models/api-models/offering.models';
import { ErrorService } from '../core/error.sevice';
import { ToastService } from '../core/toast.service';
import { RolesService } from '../auth/services/roles.service';
import { AddButton } from '../shared/add-button/add-button';
import { CreateOfferingDialog } from './create-offering-dialog/create-offering-dialog';
import { AuthService } from '../auth/services/auth';

@Component({
  selector: 'app-offerings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    AddButton
  ],
  templateUrl: './offerings.html',
  styleUrl: './offerings.scss'
})
export class Offerings implements OnInit {
  private readonly offeringApiService = inject(OfferingApiService);
  private readonly errorService = inject(ErrorService);
  private readonly toastService = inject(ToastService);
  protected readonly rolesService = inject(RolesService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  offerings: OfferingResponse[] = [];
  isLoading = false;
  cancellingIds = new Set<string>();

  // Filter values
  selectedCategory: OfferingCategory | null = null;
  priceValue: number = 1000;
  selectedModifier: PriceModifier = PriceModifier.LOWER;

  readonly categories = Object.values(OfferingCategory);
  readonly modifiers = Object.values(PriceModifier);

  get canCreateOffering(): boolean {
    return this.rolesService.isResident();
  }

  get currentUserId(): string {
    return this.authService.getCurrentUserId() || '';
  }

  ngOnInit(): void {
    this.loadOfferings();
  }

  loadOfferings(): void {
    this.isLoading = true;
    this.offeringApiService.getOfferings(this.selectedCategory, this.priceValue, this.selectedModifier)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (data) => {
          this.offerings = data;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to load offerings', error);
          this.errorService.handleServerError(error);
        }
      });
  }

  applyFilters(): void {
    this.loadOfferings();
  }

  clearFilters(): void {
    this.selectedCategory = null;
    this.priceValue = 1000;
    this.selectedModifier = PriceModifier.LOWER;
    this.loadOfferings();
  }

  openCreateOfferingDialog(): void {
    const dialogRef = this.dialog.open(CreateOfferingDialog, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe((result: boolean | undefined) => {
      if (result) {
        this.loadOfferings();
      }
    });
  }

  cancelOffering(offering: OfferingResponse): void {
    if (this.cancellingIds.has(offering.id)) return;

    this.cancellingIds.add(offering.id);
    this.offeringApiService.cancelOffering(offering.id)
      .pipe(finalize(() => this.cancellingIds.delete(offering.id)))
      .subscribe({
        next: () => {
          this.toastService.success('Offering cancelled successfully');
          this.offerings = this.offerings.filter(o => o.id !== offering.id);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to cancel offering', error);
          this.errorService.handleServerError(error);
        }
      });
  }

  contactProvider(offering: OfferingResponse): void {
    // Navigate to chats - the user can start a conversation with the provider
    this.router.navigate(['/home/chats']);
    this.toastService.info(`Start a chat with ${offering.providerData.firstName} to discuss the offering`);
  }

  isOwnOffering(offering: OfferingResponse): boolean {
    return offering.providerData.id === this.currentUserId;
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'BABYSITTING': 'Babysitting',
      'PET_SITTING': 'Pet Sitting',
      'CLEANING': 'Cleaning',
      'GROCERY_HELP': 'Grocery Help',
      'DELIVERY': 'Delivery',
      'TUTORING': 'Tutoring',
      'TECH_SUPPORT': 'Tech Support',
      'HANDYMAN': 'Handyman',
      'GARDENING': 'Gardening',
      'OTHER': 'Other'
    };
    return labels[category] || category;
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'BABYSITTING': 'child_care',
      'PET_SITTING': 'pets',
      'CLEANING': 'cleaning_services',
      'GROCERY_HELP': 'shopping_cart',
      'DELIVERY': 'local_shipping',
      'TUTORING': 'school',
      'TECH_SUPPORT': 'computer',
      'HANDYMAN': 'build',
      'GARDENING': 'yard',
      'OTHER': 'more_horiz'
    };
    return icons[category] || 'work';
  }

  getModifierLabel(modifier: PriceModifier): string {
    const labels: Record<string, string> = {
      'LOWER': 'Less than',
      'HIGHER': 'More than',
      'EQUAL': 'Equal to'
    };
    return labels[modifier] || modifier;
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'No expiration';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  formatCreatedDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short'
    });
  }

  formatPrice(price: number): string {
    return price.toFixed(2) + ' PLN';
  }
}
