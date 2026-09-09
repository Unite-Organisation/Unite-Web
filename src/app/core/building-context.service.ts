import { Injectable, computed, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BuildingContextService {

  private readonly storageKey = 'selectedBuildingId';

  private readonly selectedBuildingIdSignal = signal<string | null>(
    localStorage.getItem(this.storageKey),
  );

  readonly selectedBuildingId = this.selectedBuildingIdSignal.asReadonly();

  readonly hasSelectedBuilding = computed(
    () => this.selectedBuildingIdSignal() !== null,
  );

  setBuilding(buildingId: string): void {
    this.selectedBuildingIdSignal.set(buildingId);

    localStorage.setItem(
      this.storageKey,
      buildingId,
    );
  }

  clearBuilding(): void {
    this.selectedBuildingIdSignal.set(null);

    localStorage.removeItem(
      this.storageKey,
    );
  }

  getBuildingId(): string | null {
    return this.selectedBuildingIdSignal();
  }
}