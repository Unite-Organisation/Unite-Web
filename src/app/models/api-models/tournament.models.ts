export interface ParticipantResponse {
  displayName: string;
  username: string;
}

export interface TournamentResponse {
  id: string;
  authorDisplayName: string;
  name: string;
  description: string;
  teamSize: number;
  participants: ParticipantResponse[];
  status: TournamentStatus;
  type: TournamentType;
}

export interface CreateTournamentRequest {
  name: string;
  description: string;
  teamSize: number;
  type: TournamentType;
}

export enum TournamentStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  FINISHED = 'FINISHED'
}

export enum TournamentType {
  TABLE_FOOTBALL = 'TABLE_FOOTBALL',
  TABLE_TENNIS = 'TABLE_TENNIS',
  CHESS = 'CHESS'
}

export enum MatchStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  SCHEDULED = 'SCHEDULED'
}

export interface ParticipantDto {
  id: string;
  username: string;
}

export interface TeamDto {
  id: string;
  name: string;
  members: ParticipantDto[];
}

export interface MatchDto {
  id: string;
  nextMatchId: string | null;
  status: MatchStatus | string;
  teamA: TeamDto | null;
  teamB: TeamDto | null;
  winnerTeamId: string | null;
}

export interface RoundDto {
  roundNumber: number;
  roundName: string;
  matches: MatchDto[];
}

export interface TournamentDto {
  id: string;
  name: string;
  rounds: RoundDto[];
}
