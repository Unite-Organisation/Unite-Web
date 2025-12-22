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

export interface BasicUserData {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
}

export interface PotentialContactResponse {
    basicUserData: BasicUserData;
    buildingId: string;
    buildingName: string;
}

export interface GroupConversationRequest {
    name: string;
    members: string[];
}