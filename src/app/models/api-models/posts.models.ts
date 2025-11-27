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