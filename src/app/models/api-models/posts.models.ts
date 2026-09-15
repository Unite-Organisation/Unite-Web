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

export interface AnnouncementRequest {
  name: string;
  content: string;
  relatedDate: string;
  postType: PostType;
  visibleFrom: string;
  visibleTo: string;
  fileKeys: string[] | null;
}

export interface EventRequest {
  name: string;
  content: string;
  relatedDate: string;
  postType: PostType;
  visibleFrom: string;
  visibleTo: string;
  startDate: string;
  endDate: string;
  location: string;
  onlineUrl: string;
  maxAttendees: number;
  fileKeys: string[] | null;
}