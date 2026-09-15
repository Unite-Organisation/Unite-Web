import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URLS } from '../../core/api.config';
import { AnnouncementRequest, EventRequest, Post, PostType } from '../../models/api-models/posts.models';

export interface PostsQueryParams {
  pageSize: number;
  page: number;
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

    return this.http.get<Post[]>(API_URLS.posts, { params: httpParams });
  }

  createAnnouncement(payload: AnnouncementRequest): Observable<void> {
    return this.http.post<void>(API_URLS.announcements, payload);
  }

  createEvent(payload: EventRequest): Observable<void> {
    return this.http.post<void>(API_URLS.events, payload);
  }
}
