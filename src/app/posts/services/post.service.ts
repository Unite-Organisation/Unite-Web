import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URLS } from '../../core/api.config';
import { AnnouncementRequest, EventRequest, Post, PostType, PostVisibilityModifier } from '../../models/api-models/posts.models';

export interface PostsQueryParams {
  pageSize: number;
  page: number;
  postType: PostType;
  visibleFrom?: string;
  visibleFromModifier?: PostVisibilityModifier;
  visibleTo?: string;
  visibleToModifier?: PostVisibilityModifier;
  createdBy?: string;
}

export interface CreateEventPayload {
  name: string;
  areaId: string;
  buildingId: string;
  content: string;
  relatedDate: string;
  postType: PostType;
  startDate: string;
  endDate: string;
  location: string;
  onlineUrl: string;
  maxAttendees: number;
}

export interface CreateAnnouncementPayload {
  name: string;
  areaId: string;
  buildingId: string;
  content: string;
  relatedDate: string;
  postType: PostType;
}

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private readonly http = inject(HttpClient);

  getPosts(params: PostsQueryParams): Observable<Post[]> {
    let httpParams = new HttpParams();

    httpParams = httpParams.append('pageSize', params.pageSize.toString());
    httpParams = httpParams.append('page', params.page.toString());
    httpParams = httpParams.append('postType', params.postType);
    if (params.visibleFrom) {
      httpParams = httpParams.append('visibleFrom', params.visibleFrom);
    }

    if (params.visibleFromModifier) {
      httpParams = httpParams.append('visibleFromModifier', params.visibleFromModifier);
    }

    if (params.visibleTo) {
      httpParams = httpParams.append('visibleTo', params.visibleTo);
    }

    if (params.visibleToModifier) {
      httpParams = httpParams.append('visibleToModifier', params.visibleToModifier);
    }

    if (params.createdBy) {
      httpParams = httpParams.append('createdBy', params.createdBy);
    }

    return this.http.get<Post[]>(API_URLS.posts, { params: httpParams });
  }

  createAnnouncement(payload: AnnouncementRequest): Observable<void> {
    return this.http.post<void>(API_URLS.announcements, payload);
  }

  createEvent(payload: EventRequest): Observable<void> {
    return this.http.post<void>(API_URLS.events, payload);
  }
}
