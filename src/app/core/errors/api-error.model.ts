import { ErrorCode } from './error-code';

export interface ApiErrorResponse {
  status: number;
  errors: AppError[];
  path: string;
  timestamp: string;
}

export interface AppError {
  code: string;
  message: string | null;
}

export enum ClientErrorCode {
  NETWORK_UNAVAILABLE = 'NETWORK_UNAVAILABLE',
  SERVER_UNAVAILABLE = 'SERVER_UNAVAILABLE',
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  MALFORMED_ERROR_RESPONSE = 'MALFORMED_ERROR_RESPONSE',
}

export type AnyErrorCode = ErrorCode | ClientErrorCode;

export interface NormalizedError {
  code: AnyErrorCode;
  detail: string | null;
  httpStatus: number;
  unknownCode?: string;
  path: string | null;
}
