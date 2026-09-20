# API error handling

Every non-2XX response from the backend carries the same contract:

```json
{
  "status": 400,
  "errors": [{ "code": "VALIDATION_ERROR", "message": "visibleFrom" }],
  "path": "/v1/api/post/announcement",
  "timestamp": "2026-09-11T09:24:11.174089333Z"
}
```

`code` is the **name** of a constant in the backend's `Code` enum (Jackson default
enum serialization), and `message` is technical detail — never shown to the user.
All user-facing copy lives on the frontend, in `error-messages.ts`.

## Flow

`errorToastInterceptor` (registered first in `app.config.ts`, so it wraps
`AuthInterceptor` and only sees the final outcome of a request)
→ `parseApiError` normalizes the body
→ `ErrorNotifier` decides what to show
→ `ToastService` stacks the toasts.

The error is always re-thrown, so callers keep control of their own state.

One toast per error, in the order the backend sent them, capped at three.

## Adding a backend code

Add the constant to `error-code.ts` by hand — it mirrors `Code.java`.
`ERROR_PRESENTATION` is declared with `satisfies Record<AnyErrorCode, …>`, so the
build fails until the new code has copy. A code that arrives before the frontend
knows it falls back to `UNKNOWN_ERROR` and is logged with its real name.

## VALIDATION_ERROR

A 400 with `VALIDATION_ERROR` carries one entry per rejected field, with the DTO
field name in `message`:

```json
{"errors": [{"code": "VALIDATION_ERROR", "message": "visibleFrom"},
            {"code": "VALIDATION_ERROR", "message": "visibleTo"}]}
```

Those names are an API detail — they are never shown as text. The user gets one
generic notice from the interceptor, and the fields themselves turn red:

```ts
private readonly serverValidation = inject(ServerValidationBinder);

error: (error: HttpErrorResponse) => {
  this.serverValidation.apply(this.form, error);
}
```

`apply` resolves each field to a control (as-is, through `fieldMap` when the
names differ, case-insensitively as a last resort), sets the `serverInvalid`
error on it, marks it touched so Material renders it in the error colour, and
clears it again on the next edit. Pass `{ fieldMap: { visibleFrom: 'publishFrom' } }`
when a control is named differently, and `{ focusFirst: false }` to skip
scrolling to the first rejected field.

Fields with no matching control are returned in `result.unmatched` and logged —
that is a real drift between the request DTO and the form, and the user would
otherwise see a red-flag toast with nothing highlighted.

## Opting out

Some failures should not produce a toast — background loads, decorative badges,
or errors a component renders inline.

```ts
import { skipErrorToast, handleErrorCodes } from '../core/errors';

// nothing at all
this.http.get<Foo[]>(url, { context: skipErrorToast() });

// this one code is rendered inline; everything else still toasts
this.http.post<Foo>(url, body, {
  context: handleErrorCodes([ErrorCode.FACILITY_ALREADY_RESERVED]),
});
```

Codes marked `silent` in `error-messages.ts` are suppressed everywhere — an
expired session, for instance, is announced once by `AuthInterceptor` alongside
the redirect instead.
