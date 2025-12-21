export interface OfferingRequest {
  title: string;
  description: string;
  category: string;
  isActive: boolean;
  price: number;
  endDate: string | null;
}

export interface OfferingResponse {
  id: string;
  title: string;
  description: string;
  category: string;
  isActive: boolean;
  price: number;
  endDate: string | null;
  createdAt: string;
  createdByUser: boolean;
  providerData: BasicUserData;
}

export interface BasicUserData {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

export enum OfferingCategory {
  BABYSITTING = 'BABYSITTING',
  PET_SITTING = 'PET_SITTING',
  CLEANING = 'CLEANING',
  GROCERY_HELP = 'GROCERY_HELP',
  DELIVERY = 'DELIVERY',
  TUTORING = 'TUTORING',
  TECH_SUPPORT = 'TECH_SUPPORT',
  HANDYMAN = 'HANDYMAN',
  GARDENING = 'GARDENING',
  OTHER = 'OTHER'
}

export enum PriceModifier {
  LOWER = 'LOWER',
  HIGHER = 'HIGHER',
  EQUAL = 'EQUAL'
}

export interface OfferingFilter {
  category?: OfferingCategory;
  price: number;
  modifier: PriceModifier;
}

