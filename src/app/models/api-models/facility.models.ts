export enum FacilityType {
  RECREATION = 'RECREATION',
  WELLNESS = 'WELLNESS',
  STORAGE = 'STORAGE'
}

export interface FacilityResponse {
  id: string;
  name: string;
  type: string;
  capacity: number;
  location: string;
  requiresApproval: boolean;
}

export interface BuildingFacilitiesResponse {
  facilityResponseList: FacilityResponse[];
}

export interface Facility {
  name: string;
  type: string;
  capacity: number | null;
  location: string;
  requiresApproval: boolean;
}

export interface FacilityRequest {
  facilities: Facility[];
  buildingId: string;
}

export interface FacilityReservation {
  reservationId: string;
  userFirstName: string;
  userLastName: string;
  startTime: string;
  endTime: string;
}

export interface ReservationRequest {
  facilityId: string;
  startTime: string;
  endTime: string;
  purpose: string;
}

export interface ReservationResponse {
  id: string;
  facilityId: string;
  userId: string;
  startTime: string;
  endTime: string;
  status: string;
  purpose: string;
  createdAt: string;
}

export interface ReserveResponse {
  success: boolean;
  reservations: ReservationResponse[];
}

