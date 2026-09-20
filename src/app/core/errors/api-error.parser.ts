import { HttpErrorResponse } from '@angular/common/http';
import { ErrorCode, isErrorCode } from './error-code';
import {
  AnyErrorCode,
  ApiErrorResponse,
  AppError,
  ClientErrorCode,
  NormalizedError,
} from './api-error.model';

export function parseApiError(error: HttpErrorResponse): NormalizedError[] {
  const body = error.error;

  if (error.status === 0) {
    return [synthetic(ClientErrorCode.NETWORK_UNAVAILABLE, error)];
  }

  if (error.status === 504 || error.status === 408) {
    return [synthetic(ClientErrorCode.REQUEST_TIMEOUT, error)];
  }

  if (error.status === 502 || error.status === 503) {
    return [synthetic(ClientErrorCode.SERVER_UNAVAILABLE, error)];
  }

  const apiError = asApiErrorResponse(body);
  if (apiError) {
    return apiError.errors.map((appError) => normalize(appError, error, apiError.path));
  }

  return [synthetic(ClientErrorCode.MALFORMED_ERROR_RESPONSE, error)];
}


function asApiErrorResponse(body: unknown): ApiErrorResponse | null {
  if (body === null || typeof body !== 'object') {
    return null;
  }

  const candidate = body as Partial<ApiErrorResponse>;
  if (!Array.isArray(candidate.errors) || candidate.errors.length === 0) {
    return null;
  }

  const errors = candidate.errors.filter(
    (entry): entry is AppError =>
      entry !== null && typeof entry === 'object' && typeof entry.code === 'string'
  );

  if (errors.length === 0) {
    return null;
  }

  return {
    status: typeof candidate.status === 'number' ? candidate.status : 0,
    errors,
    path: typeof candidate.path === 'string' ? candidate.path : '',
    timestamp: typeof candidate.timestamp === 'string' ? candidate.timestamp : '',
  };
}

function normalize(
  appError: AppError,
  response: HttpErrorResponse,
  path: string
): NormalizedError {
  const raw = appError.code.toUpperCase();
  const known = isErrorCode(raw);

  return {
    code: known ? (raw as ErrorCode) : ErrorCode.UNKNOWN_ERROR,
    detail: appError.message ?? null,
    httpStatus: response.status,
    ...(known ? {} : { unknownCode: appError.code }),
    path: path || urlPath(response.url),
  };
}

function synthetic(code: AnyErrorCode, response: HttpErrorResponse): NormalizedError {
  return {
    code,
    detail: response.message ?? null,
    httpStatus: response.status,
    path: urlPath(response.url),
  };
}

function urlPath(url: string | null): string | null {
  if (!url) {
    return null;
  }
  try {
    return new URL(url, window.location.origin).pathname;
  } catch {
    return url;
  }
}
