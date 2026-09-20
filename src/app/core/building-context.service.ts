import { Injectable, computed, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BuildingContextService {

  private readonly idStorageKey = 'selectedBuildingId';
  private readonly nameStorageKey = 'selectedBuildingName';

  private readonly selectedBuildingIdSignal = signal<string | null>(
    localStorage.getItem(this.idStorageKey),
  );

  private readonly selectedBuildingNameSignal = signal<string | null>(
    localStorage.getItem(this.nameStorageKey),
  );

  readonly selectedBuildingId = this.selectedBuildingIdSignal.asReadonly();

  readonly selectedBuildingName = this.selectedBuildingNameSignal.asReadonly();

  readonly hasSelectedBuilding = computed(
    () => this.selectedBuildingIdSignal() !== null,
  );

  setBuilding(buildingId: string, buildingName: string | null = null): void {
    this.selectedBuildingIdSignal.set(buildingId);
    this.selectedBuildingNameSignal.set(buildingName);

    localStorage.setItem(
      this.idStorageKey,
      buildingId,
    );

    if (buildingName) {
      localStorage.setItem(
        this.nameStorageKey,
        buildingName,
      );
    } else {
      localStorage.removeItem(
        this.nameStorageKey,
      );
    }
  }

  clearBuilding(): void {
    this.selectedBuildingIdSignal.set(null);
    this.selectedBuildingNameSignal.set(null);

    localStorage.removeItem(
      this.idStorageKey,
    );

    localStorage.removeItem(
      this.nameStorageKey,
    );
  }

  getBuildingId(): string | null {
    return this.selectedBuildingIdSignal();
  }

  getBuildingName(): string | null {
    return this.selectedBuildingNameSignal();
  }
}
