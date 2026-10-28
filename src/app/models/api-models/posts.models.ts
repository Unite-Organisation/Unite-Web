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

/**
 * An event is its own thing now, created through the public endpoints. Putting it in a building
 * feed is a post pointing at it, so all this carries is which event and for how long.
 */
export interface EventPublishRequest {
  slug: string;
  visibleFrom: string;
  visibleTo: string;
  fileKeys: string[] | null;
}