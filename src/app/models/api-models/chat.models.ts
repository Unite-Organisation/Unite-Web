export interface ConversationResponse {    
    id: string;
    isGroup: boolean;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export interface ConversationMessage {
    author: string;
    authorName: string;
    authorLastName: string;
    sendAt: string;
    content: string;
}

export interface CreateMessageRequest {
    conversationId: string;
    content: string;
}