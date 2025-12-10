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
}

export enum PostType {
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  EVENT = 'EVENT',
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