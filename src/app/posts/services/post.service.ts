import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URLS } from '../../core/api.config';
import { Post } from '../../models/api-models/posts.models';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private readonly http = inject(HttpClient);

  getPosts(params: PaginationParams): Observable<Post[]> {
    let httpParams = new HttpParams();

    httpParams = httpParams.append('pageSize', params.pageSize.toString());
    httpParams = httpParams.append('page', params.page.toString());

    return this.http.get<Post[]>(API_URLS.posts, { params: httpParams });
  }
}
