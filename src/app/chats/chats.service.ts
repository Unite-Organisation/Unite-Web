import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { ConversationMessage, ConversationResponse, CreateMessageRequest, GroupConversationRequest, PotentialContactResponse } from "../models/api-models/chat.models";
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

    fetchConversationContent(conversationId: string, lastMessageId: string | null, pageSize: number): Observable<ConversationMessage[]> {
        let httpParams = new HttpParams();

        httpParams = httpParams.append('pageSize', pageSize.toString());
        if (lastMessageId) {
            httpParams = httpParams.set('lastMessageId', lastMessageId);
        }

        return this.http.get<ConversationMessage[]>(`${API_URLS.messages}/${conversationId}`, { params: httpParams });
    }

    sendMessage(request: CreateMessageRequest): Observable<void> {
        return this.http.post<void>(API_URLS.messages, request);
    }

    fetchUsersInArea(pagination: PaginationParams): Observable<PotentialContactResponse[]> {
        let httpParams = new HttpParams();

        httpParams = httpParams.append('pageSize', pagination.pageSize.toString());
        httpParams = httpParams.append('page', pagination.page.toString());

        return this.http.get<PotentialContactResponse[]>(API_URLS.users_in_area, { params: httpParams });
    }

    createGroupConversation(request: GroupConversationRequest): Observable<void> {
        return this.http.post<void>(API_URLS.group_conversation, request);
    }
}