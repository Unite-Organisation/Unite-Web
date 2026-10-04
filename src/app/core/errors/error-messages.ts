import { AnyErrorCode, ClientErrorCode } from './api-error.model';
import { ErrorCode } from './error-code';
import { ErrorSeverity } from '../toast/toast.model';

export interface ErrorPresentation {
  readonly text: string;
  readonly severity: ErrorSeverity;
  readonly silent?: boolean;
}

export const ERROR_PRESENTATION = {
  // --- Missing resources -------------------------------------------------
  [ErrorCode.CONVERSATION_NOT_FOUND]: {
    text: 'This conversation is no longer available.',
    severity: 'warning',
  },
  [ErrorCode.POST_NOT_FOUND]: {
    text: 'This post is no longer available.',
    severity: 'warning',
  },
  [ErrorCode.AREA_NOT_FOUND]: {
    text: 'This area could not be found.',
    severity: 'warning',
  },
  [ErrorCode.FACILITY_NOT_FOUND]: {
    text: 'This facility could not be found.',
    severity: 'warning',
  },
  [ErrorCode.NOTIFICATION_NOT_FOUND]: {
    text: 'This notification is no longer available.',
    severity: 'warning',
    silent: true,
  },
  [ErrorCode.BUILDING_NOT_FOUND]: {
    text: 'This building could not be found.',
    severity: 'warning',
  },
  [ErrorCode.POLL_NOT_FOUND]: {
    text: 'This poll is no longer available.',
    severity: 'warning',
  },
  [ErrorCode.REQUEST_NOT_FOUND]: {
    text: 'This request could not be found.',
    severity: 'warning',
  },
  [ErrorCode.OFFERING_NOT_FOUND]: {
    text: 'This offering is no longer available.',
    severity: 'warning',
  },
  [ErrorCode.ISSUE_NOT_FOUND]: {
    text: 'This issue could not be found.',
    severity: 'warning',
  },
  [ErrorCode.USER_NOT_FOUND]: {
    text: 'We could not find this user.',
    severity: 'warning',
  },
  [ErrorCode.USER_ROLE_NOT_FOUND]: {
    text: 'This account has no role assigned. Please contact your building manager.',
    severity: 'error',
  },

  // --- Business rules ----------------------------------------------------
  [ErrorCode.OFFERING_ALREADY_CLOSED]: {
    text: 'This offering has already been closed.',
    severity: 'warning',
  },
  [ErrorCode.POLL_NOT_FINISHED]: {
    text: 'Results will be available once the poll has ended.',
    severity: 'info',
  },
  [ErrorCode.MANAGER_CANNOT_VOTE]: {
    text: 'Managers cannot vote in resident polls.',
    severity: 'info',
  },
  [ErrorCode.MANAGER_NO_ACCESS]: {
    text: 'This section is not available to managers.',
    severity: 'warning',
  },
  [ErrorCode.INVALID_TIME_PERIOD]: {
    text: 'The selected time period is not valid. Check that the end is after the start.',
    severity: 'warning',
  },
  [ErrorCode.FACILITY_ALREADY_RESERVED]: {
    text: 'That slot is already booked. Please pick another time.',
    severity: 'warning',
  },
  [ErrorCode.ISSUE_STRATEGY_NOT_CHOSEN]: {
    text: 'Select how this issue should be handled before continuing.',
    severity: 'warning',
  },
  [ErrorCode.ISSUE_STATUS_ERROR]: {
    text: 'This issue cannot be moved to that status.',
    severity: 'warning',
  },
  [ErrorCode.REQUEST_ALREADY_HANDLED]: {
    text: 'Someone has already handled this request.',
    severity: 'info',
  },
  [ErrorCode.REQUEST_DONOR]: {
    text: 'Only the person who offered this item can perform that action.',
    severity: 'warning',
  },
  [ErrorCode.INTERACTION_NOT_SUPPORTED]: {
    text: 'That action is not available for this item.',
    severity: 'warning',
  },
  [ErrorCode.EVENT_MAX_ATTENDEES]: {
    text: 'This event is full — the attendee limit has been reached.',
    severity: 'warning',
  },
  [ErrorCode.PRIVATE_CONVERSATION_EXISTS]: {
    text: 'You already have a conversation with this person.',
    severity: 'info',
  },

  // --- Account & access --------------------------------------------------
  [ErrorCode.BAD_CREDENTIALS]: {
    text: 'Incorrect email or password.',
    severity: 'error',
  },
  [ErrorCode.USERNAME_TAKEN]: {
    text: 'That username is already taken.',
    severity: 'warning',
  },
  [ErrorCode.EMAIL_TAKEN]: {
    text: 'An account with this email address already exists.',
    severity: 'warning',
  },
  [ErrorCode.JWT_TOKEN_EXPIRED]: {
    text: 'Your session has expired. Please sign in again.',
    severity: 'info',
    silent: true,
  },
  [ErrorCode.REFRESH_TOKEN_ERROR]: {
    text: 'Your session has expired. Please sign in again.',
    severity: 'info',
    silent: true,
  },
  [ErrorCode.ACCESS_DENIED]: {
    text: 'You do not have permission to do that.',
    severity: 'error',
  },
  [ErrorCode.BUILDING_ACCESS_DENIED]: {
    text: 'You do not have access to this building.',
    severity: 'error',
  },
  [ErrorCode.USER_WITHOUT_BUILDING]: {
    text: 'Your account is not assigned to a building yet. Please contact your manager.',
    severity: 'warning',
  },
  [ErrorCode.USER_WITH_BUILDING]: {
    text: 'This user already belongs to the building.',
    severity: 'info',
  },
  [ErrorCode.ACTIVATION_TOKEN_INVALID]: {
    text: 'This activation link is not valid.',
    severity: 'error',
  },
  [ErrorCode.ACTIVATION_TOKEN_EXPIRED]: {
    text: 'This activation link has expired. Request a new one.',
    severity: 'error',
  },
  [ErrorCode.ACTIVATION_TOKEN_USED]: {
    text: 'This activation link has already been used.',
    severity: 'info',
  },

  // --- Request shape -----------------------------------------------------
  // Field-level rejections are shown on the form itself, by ServerValidationBinder.
  // This is the single accompanying notice, raised once no matter how many
  // fields the backend rejected.
  [ErrorCode.VALIDATION_ERROR]: {
    text: 'Some of the details you entered are not valid. Please check the highlighted fields.',
    severity: 'warning',
  },
  [ErrorCode.CONFLICTING_FILTERS]: {
    text: 'The selected filters cannot be combined.',
    severity: 'warning',
  },
  [ErrorCode.MANDATORY_FILTER_MISSING]: {
    text: 'A required filter is missing.',
    severity: 'warning',
  },
  [ErrorCode.BUILDING_ID_REQUIRED]: {
    text: 'Select a building first.',
    severity: 'warning',
  },

  // --- Files -------------------------------------------------------------
  [ErrorCode.EMPTY_FILE]: {
    text: 'The selected file is empty.',
    severity: 'warning',
  },
  [ErrorCode.FILE_NOT_FOUND]: {
    text: 'This file is no longer available.',
    severity: 'error',
  },
  [ErrorCode.INVALID_FILE_EXTENSION]: {
    text: 'That file type is not allowed.',
    severity: 'warning',
  },
  [ErrorCode.UNSUPPORTED_FILE_TYPE]: {
    text: 'That file type is not supported.',
    severity: 'warning',
  },
  [ErrorCode.FILE_TOO_LARGE]: {
    text: 'That file is too large to upload.',
    severity: 'warning',
  },
  [ErrorCode.TOO_MANY_FILES]: {
    text: 'You have attached too many files.',
    severity: 'warning',
  },
  [ErrorCode.INVALID_FILE_KEY]: {
    text: 'This file reference is not valid.',
    severity: 'error',
  },

  // --- Server-side faults ------------------------------------------------
  // Nothing the user can act on: one honest, non-technical line.
  [ErrorCode.UNKNOWN_ERROR]: {
    text: 'Something went wrong on our side. Please try again.',
    severity: 'error',
  },
  [ErrorCode.EVENT_HANDLER_NOT_FOUND]: {
    text: 'Something went wrong on our side. Please try again.',
    severity: 'error',
  },
  [ErrorCode.EVENT_HANDLER_DUPLICATED]: {
    text: 'Something went wrong on our side. Please try again.',
    severity: 'error',
  },
  [ErrorCode.JSON_SERIALIZATION_ERROR]: {
    text: 'Something went wrong on our side. Please try again.',
    severity: 'error',
  },
  [ErrorCode.INTERNAL_CONNECTION_ERROR]: {
    text: 'A required service is unavailable right now. Please try again shortly.',
    severity: 'error',
  },
  [ErrorCode.MAIL_SENDING_FAILED]: {
    text: 'We could not send the email. Please try again shortly.',
    severity: 'error',
  },
  [ErrorCode.APP_PROFILE_NOT_FOUND]: {
    text: 'Something went wrong on our side. Please try again.',
    severity: 'error',
  },

  // --- Transport (never reached the backend contract) --------------------
  [ClientErrorCode.NETWORK_UNAVAILABLE]: {
    text: 'No connection to the server. Check your internet and try again.',
    severity: 'error',
  },
  [ClientErrorCode.SERVER_UNAVAILABLE]: {
    text: 'The service is temporarily unavailable. Please try again shortly.',
    severity: 'error',
  },
  [ClientErrorCode.REQUEST_TIMEOUT]: {
    text: 'The request took too long. Please try again.',
    severity: 'error',
  },
  [ClientErrorCode.MALFORMED_ERROR_RESPONSE]: {
    text: 'Something went wrong on our side. Please try again.',
    severity: 'error',
  },
} satisfies Record<AnyErrorCode, ErrorPresentation>;

export function presentationFor(code: AnyErrorCode): ErrorPresentation {
  return ERROR_PRESENTATION[code];
}
