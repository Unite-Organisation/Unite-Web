/**
 * Public events live outside buildings and outside accounts: anyone holding the link can open one,
 * and the same screens serve a host with an account and a guest who has never seen Unite.
 */

export enum SchedulingMode {
  /** The host already has a date and is looking for people. */
  FIXED = 'FIXED',
  /** The host proposed dates and the group's answers decide which one it happens on. */
  POLL = 'POLL',
}

export enum EventStatus {
  COLLECTING_VOTES = 'COLLECTING_VOTES',
  ONE_SLOT_LEFT = 'ONE_SLOT_LEFT',
  GROUP_FORMED = 'GROUP_FORMED',
  CONFIRMED = 'CONFIRMED',
}

export enum SlotPreference {
  /** The member can make this one. */
  PREFERRED = 'PREFERRED',
  /** They would rather not, but will if this date is what makes the group happen. */
  IF_NEEDED = 'IF_NEEDED',
}

export enum EventMemberStatus {
  UNDECIDED = 'UNDECIDED',
  GOING = 'GOING',
  WAITLIST = 'WAITLIST',
  NOT_GOING = 'NOT_GOING',
  /** Voted, but not for the date that won - out without ever saying no. */
  NOT_AVAILABLE = 'NOT_AVAILABLE',
}

export enum EventMemberRole {
  HOST = 'HOST',
  MEMBER = 'MEMBER',
}

export enum EventIdentityOrigin {
  UNITE = 'UNITE',
  GUEST = 'GUEST',
}

/** What the browser says about itself - every field is null when the browser keeps it to itself. */
export interface DeviceFingerprint {
  /** Random UUID kept in localStorage. */
  deviceId: string | null;
  screenWidth: number | null;
  screenHeight: number | null;
  pixelRatio: number | null;
  colorDepth: number | null;
  hardwareConcurrency: number | null;
  deviceMemory: number | null;
  maxTouchPoints: number | null;
  timeZone: string | null;
  timeZoneOffset: number | null;
  languages: string | null;
  deviceModel: string | null;
  platformVersion: string | null;
  renderer: string | null;
  canvasHash: string | null;
}

export interface SlotRequest {
  startDate: string;
  endDate: string | null;
}

export interface SlotVote {
  slotId: string;
  preference: SlotPreference;
}

export interface PublicEventCreateRequest {
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  onlineUrl: string | null;
  maxAttendees: number | null;
  waitlistEnabled: boolean;
  /** Required without an account; ignored when a token is sent. */
  displayName: string | null;
  /** Required without an account: where the news about the date are sent. */
  email: string | null;
  schedulingMode: SchedulingMode;
  minAttendees: number | null;
  votingDeadline: string | null;
  slots: SlotRequest[] | null;
  device?: DeviceFingerprint | null;
}

export interface PublicEventCreatedResponse {
  slug: string;
  /** The code a guest needs to come back on another device. Null for an account. */
  returnCode: string | null;
}

export interface EventSlotResponse {
  id: string;
  startDate: string;
  endDate: string | null;
  preferredCount: number;
  ifNeededCount: number;
  /** 0-100, how full this date is against the threshold. */
  chance: number;
  open: boolean;
}

export interface EventMemberView {
  displayName: string;
  role: EventMemberRole;
  status: EventMemberStatus;
  origin: EventIdentityOrigin;
}

export interface PublicEvent {
  slug: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  locationName: string | null;
  onlineUrl: string | null;
  maxAttendees: number | null;
  waitlistEnabled: boolean;
  schedulingMode: SchedulingMode;
  status: EventStatus;
  minAttendees: number | null;
  votingDeadline: string | null;
  selectedSlotId: string | null;
  /** Already ordered: the first one would win right now. Empty for a dated event. */
  slots: EventSlotResponse[];
  goingCount: number;
  createdAt: string;
  /** Null until the viewer has a session on this event. */
  me: EventMemberView | null;
  myVotes: SlotVote[];
}

export interface OpenSessionRequest {
  displayName: string | null;
  /** Required the first time a guest joins; ignored for an account. */
  email: string | null;
  returnCode: string | null;
  votes: SlotVote[] | null;
  device?: DeviceFingerprint | null;
}

export interface EventSessionResponse {
  member: EventMemberView;
  returnCode: string | null;
}

export interface EventMemberRow {
  id: string;
  displayName: string;
  isHost: boolean;
  status: EventMemberStatus;
}
