import { HttpErrorResponse } from '@angular/common/http';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { SERVER_INVALID, ServerValidationBinder, serverErrorText } from './server-validation';

describe('ServerValidationBinder', () => {
  let binder: ServerValidationBinder;
  let form: FormGroup;

  beforeEach(() => {
    binder = new ServerValidationBinder();
    form = new FormGroup({
      location: new FormControl(''),
      endDate: new FormControl(''),
      slots: new FormArray([new FormControl(''), new FormControl(''), new FormControl('')]),
    });
  });

  function badRequest(errors: unknown[]): HttpErrorResponse {
    return new HttpErrorResponse({
      status: 400,
      error: { status: 400, errors, path: '/v1/api/public/event', timestamp: '' },
    });
  }

  it('marks the input named in field, not in message', () => {
    const result = binder.apply(
      form,
      badRequest([
        {
          code: 'VALIDATION_ERROR',
          message: 'size must be between 0 and 256',
          field: 'location',
          constraint: 'Size',
          params: { min: 0, max: 256 },
        },
      ]),
      { focusFirst: false }
    );

    expect(result.applied).toEqual(['location']);
    expect(form.get('location')!.hasError(SERVER_INVALID)).toBeTrue();
    expect(form.get('location')!.touched).toBeTrue();
    expect(serverErrorText(form.get('location'))).toBe('Use at most 256 characters');
  });

  it('marks fields of other codes too, such as a time period', () => {
    binder.apply(
      form,
      badRequest([{ code: 'INVALID_TIME_PERIOD', message: 'x is after y', field: 'endDate' }]),
      { focusFirst: false }
    );

    expect(serverErrorText(form.get('endDate'))).toBe('Check this date');
  });

  it('ignores errors about the request as a whole', () => {
    const result = binder.apply(
      form,
      badRequest([{ code: 'VALIDATION_ERROR', message: 'Request body is not readable' }]),
      { focusFirst: false }
    );

    expect(result.applied).toEqual([]);
    expect(result.unmatched).toEqual([]);
  });

  it('resolves an indexed path through the field map', () => {
    binder.apply(
      form,
      badRequest([{ code: 'INVALID_TIME_PERIOD', message: '', field: 'slots[0].startDate' }]),
      { focusFirst: false, fieldMap: { 'slots[0].startDate': 'slots.2' } }
    );

    expect(form.get('slots.2')!.hasError(SERVER_INVALID)).toBeTrue();
    expect(form.get('slots.0')!.hasError(SERVER_INVALID)).toBeFalse();
  });

  it('forgets the error once the input is edited', () => {
    binder.apply(form, badRequest([{ code: 'VALIDATION_ERROR', message: '', field: 'location' }]), {
      focusFirst: false,
    });

    form.get('location')!.setValue('Beach');

    expect(form.get('location')!.valid).toBeTrue();
  });

  it('clears every server error at once', () => {
    binder.apply(
      form,
      badRequest([
        { code: 'VALIDATION_ERROR', message: '', field: 'location' },
        { code: 'VALIDATION_ERROR', message: '', field: 'slots[1]' },
      ]),
      { focusFirst: false }
    );

    binder.clear(form);

    expect(form.valid).toBeTrue();
  });
});

describe('serverErrorText', () => {
  function rejected(detail: object): FormControl {
    const control = new FormControl('');
    control.setErrors({ [SERVER_INVALID]: detail });
    return control;
  }

  it('words the limit of a number', () => {
    expect(serverErrorText(rejected({ code: 'VALIDATION_ERROR', constraint: 'Max', params: { value: 1000 } })))
      .toBe('Must be at most 1000');
  });

  it('falls back to a generic notice for a business rule', () => {
    expect(serverErrorText(rejected({ code: 'VALIDATION_ERROR' }))).toBe('Check this field');
  });

  it('says nothing about an input the backend accepted', () => {
    expect(serverErrorText(new FormControl(''))).toBeNull();
  });
});
