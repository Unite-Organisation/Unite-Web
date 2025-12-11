export interface ConversationResponse {    
    id: string;
    isGroup: boolean;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export interface ConversationMessage {
    author: string;
    sendAt: string;
    content: string;
}

export interface ConversationContentResponse {
    conversationMessages: ConversationMessage[];
}

export interface CreateMessageRequest {
    conversationId: string;
    content: string;
}