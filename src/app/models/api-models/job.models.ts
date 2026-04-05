export enum JobStatus {
  FAILED = 'FAILED',
  SUCCESS = 'SUCCESS',
  NEEDS_MANUAL_FIX = 'NEEDS_MANUAL_FIX'
}

export interface JobResponse {
  id: string;
  jobName: string;
  status: JobStatus;
  errorMessage: string | null;
  createdAt: string;
  rerunAt: string | null;
}
