export interface ConversationResponse {    
    id: string;
    isGroup: boolean;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export interface ConversationMessage {
    id: string;
    authorId: string;
    authorDisplayName: string;
    content: string;
    sentAt: string;
    messageType: string;
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

export interface UserMetaInfo {
    userId: string;
    buildingId: string;
    areaId: string;
}