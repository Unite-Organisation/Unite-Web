import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { ConversationResponse } from "../models/api-models/chat.models";
import { PaginationParams } from "../models/common/common.models";
import { API_URLS } from "../core/api.config";
import { Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class ConversationService {
    private readonly http = inject(HttpClient);
    
    fetchAllConversations(pagination: PaginationParams): Observable<ConversationResponse[]> {
        let httpParams = new HttpParams();

        httpParams = httpParams.append('pageSize', pagination.pageSize.toString());
        httpParams = httpParams.append('page', pagination.page.toString());

        return this.http.get<ConversationResponse[]>(API_URLS.conversations, { params: httpParams });
    }
}