export enum IssuePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum IssueObject {
  BUILDING = 'BUILDING',
  AREA = 'AREA',
  FACILITY = 'FACILITY',
  POLL = 'POLL'
}

export interface IssueRequest {
  title: string;
  description: string;
  priority: IssuePriority;
  issueObject: IssueObject;
  areaId: string | null;
  buildingId: string | null;
  facilityId: string | null;
  pollId: string | null;
  notifyEveryone: boolean;
}

export enum IssueProcessingStatus {
  SUBMITTED = 'SUBMITTED',
  SEEN_BY_RECIPIENT = 'SEEN_BY_RECIPIENT',
  TAKEN_ACTION = 'TAKEN_ACTION',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export interface IssueRecipientInfo {
  firstName: string;
  lastName: string;
  role: string; // UserRole from backend
}

export interface IssueResponse {
  id: string;
  title: string;
  description: string;
  status: IssueProcessingStatus;
  priority: IssuePriority;
  seenByRecipientAt: string | null;
  recipient: IssueRecipientInfo;
}

