export enum AreaType {
  ESTATE = 'ESTATE',
  NEIGHBORHOOD = 'NEIGHBORHOOD',
  BUILDING = 'BUILDING'
}

export interface BuildingRequest {
  name: string;
  street: string;
  number: string;
}

export interface AreaCreateRequest {
  name: string;
  country: string;
  city: string;
  type: AreaType;
  buildings: BuildingRequest[];
}

export interface BuildingResponse {
  id: string;
  name: string;
  country: string;
  city: string;
  street: string;
  number: string;
  areaId: string;
}

export interface ResidentToAdd {
  firstName: string;
  lastName: string;
  userId: string;
}