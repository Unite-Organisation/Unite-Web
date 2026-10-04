
export interface Post {
  id: string;
  name: string;
  areaId: string;
  buildingId: string;
  createdBy: string;
  content: string;
  relatedDate: string;
  createdAt: string;
  postType: PostType;
  startDate: string;
  endDate: string;
  locationName: string;
  onlineUrl: string;
  maxAttendees: number;
  photoPresent: boolean;
}

export enum PostType {
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  EVENT = 'EVENT',
}

export enum PostVisibilityModifier {
  LESS_OR_EQUAL_THAN = 'LESS_OR_EQUAL_THAN',
  GREATER_OR_EQUAL_THAN = 'GREATER_OR_EQUAL_THAN',
  EQUAL = 'EQUAL'
}

export interface PostFilter {
  visibleFrom?: string;
  visibleFromModifier?: PostVisibilityModifier;

  visibleTo?: string;
  visibleToModifier?: PostVisibilityModifier;

  createdBy?: string;
}

export interface DateFilterOption {
  label: string;
  modifier: PostVisibilityModifier | null;
}

export interface AnnouncementRequest {
  name: string;
  buildingId: string;
  content: string;
  relatedDate: string;
  postType: PostType;
}

export interface EventRequest {
  name: string;
  buildingId: string | null;
  content: string;
  relatedDate: string;
  postType: PostType;
  startDate: string;
  endDate: string;
  location: string;
  onlineUrl: string;
  maxAttendees: number;
}