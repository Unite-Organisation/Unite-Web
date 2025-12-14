export interface PollRequest {
  title: string;
  description?: string;
  buildingId: string | null;
  anonymous: boolean;
  startTime: string;
  endTime: string;
  options: string[];
}

export enum PollStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED'
}

export enum PollTarget {
  AREA = 'AREA',
  BUILDING = 'BUILDING'
}

export interface PollOptionResponse {
  id: string;
  content: string;
}

export interface PollResponse {
  id: string;
  title: string;
  description?: string;
  author: string;
  authorRole: string;
  anonymous: boolean;
  target: PollTarget;
  pollStartTime: string;
  pollEndTime: string;
  userVoted: boolean | null;
  finished: boolean;
  options: PollOptionResponse[];
}

export interface PollOptionVoteCount {
  optionId: string;
  count: number;
  content: string;
}

export interface PollOptionPercentageShare {
  optionId: string;
  percentageShare: number;
}

export interface PollResult {
  winners: PollOptionVoteCount[];
  sortedVotes: PollOptionVoteCount[];
  sortedPercentageShareOfVotes: PollOptionPercentageShare[];
  numberOfVotes: number;
  numberOfPeopleEligibleToVote: number;
  votersPercentage: number;
}

