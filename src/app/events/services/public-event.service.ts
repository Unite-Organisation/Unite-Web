import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { from, Observable, switchMap } from 'rxjs';
import { API_URLS } from '../../core/api.config';
import { handleErrorCodes } from '../../core/errors/error-context';
import { ErrorCode } from '../../core/errors/error-code';
import {
  DeviceFingerprint,
  EventIdentityOrigin,
  EventMemberRow,
  EventMemberStatus,
  EventSessionResponse,
  OpenSessionRequest,
  PublicEvent,
  PublicEventCreateRequest,
  PublicEventCreatedResponse,
  SlotVote,
} from '../../models/api-models/public-event.models';
import { DeviceFingerprintService } from './device-fingerprint.service';

/**
 * Every call carries the session cookie the backend sets, which is what identifies a guest with no
 * account. AuthInterceptor already adds withCredentials for the Unite api, and adds the bearer token
 * when there is one - which is exactly how the same screens serve both kinds of caller.
 */
@Injectable({ providedIn: 'root' })
export class PublicEventService {
  private readonly http = inject(HttpClient);
  private readonly fingerprint = inject(DeviceFingerprintService);

  /** The device goes along so the host's tile can be found first the next time they sign in. */
  create(payload: PublicEventCreateRequest): Observable<PublicEventCreatedResponse> {
    return this.withDevice((device) =>
      this.http.post<PublicEventCreatedResponse>(API_URLS.public_event, { ...payload, device })
    );
  }

  get(slug: string): Observable<PublicEvent> {
    return this.http.get<PublicEvent>(`${API_URLS.public_event}/${slug}`);
  }

  /**
   * Joining and saying which dates work are one action - a member who existed for a moment without
   * an answer would count towards nothing.
   */
  join(slug: string, payload: OpenSessionRequest): Observable<EventSessionResponse> {
    return this.withDevice((device) =>
      this.http.post<EventSessionResponse>(
        `${API_URLS.public_event}/${slug}/session`,
        { ...payload, device },
        // a taken name and a wrong code are answers, not failures - the form shows them itself
        {
          context: handleErrorCodes([
            ErrorCode.EVENT_MEMBER_NAME_TAKEN,
            ErrorCode.EVENT_RETURN_CODE_INVALID,
            ErrorCode.EVENT_MEMBER_LOCKED,
          ]),
        }
      )
    );
  }

  /** Ends the session only - the membership, the answers and the seat stay put. */
  signOut(slug: string): Observable<void> {
    return this.http.delete<void>(`${API_URLS.public_event}/${slug}/session`);
  }

  changeVotes(slug: string, votes: SlotVote[]): Observable<PublicEvent> {
    return this.http.put<PublicEvent>(`${API_URLS.public_event}/${slug}/votes`, { votes });
  }

  startNow(slug: string): Observable<PublicEvent> {
    return this.http.post<PublicEvent>(`${API_URLS.public_event}/${slug}/confirm`, {});
  }

  changeAttendance(
    slug: string,
    status: EventMemberStatus
  ): Observable<{ status: EventMemberStatus }> {
    return this.http.put<{ status: EventMemberStatus }>(
      `${API_URLS.public_event}/${slug}/attendance`,
      { status }
    );
  }

  members(slug: string, status?: EventMemberStatus): Observable<EventMemberRow[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<EventMemberRow[]>(`${API_URLS.public_event}/${slug}/members`, { params });
  }

  /**
   * The "who are you?" list on the sign-in sheet: guests only, since an account holder signs in with
   * their account, and the one most likely using this phone first.
   */
  whoCouldThisBe(slug: string, search?: string): Observable<EventMemberRow[]> {
    return this.withDevice((device) => {
      let params = new HttpParams()
        .set('origin', EventIdentityOrigin.GUEST)
        .set('sortedByCallerMembershipProbability', true);
      if (search) {
        params = params.set('search', search);
      }
      // Spring binds a nested @ModelAttribute through dotted names
      Object.entries(device ?? {})
        .filter(([, value]) => value !== null && value !== undefined)
        .forEach(([key, value]) => (params = params.set(`device.${key}`, value)));

      return this.http.get<EventMemberRow[]>(`${API_URLS.public_event}/${slug}/members`, {
        params,
      });
    });
  }

  slotMembers(slug: string, slotId: string): Observable<EventMemberRow[]> {
    return this.http.get<EventMemberRow[]>(
      `${API_URLS.public_event}/${slug}/slots/${slotId}/members`
    );
  }

  private withDevice<T>(
    request: (device: DeviceFingerprint | null) => Observable<T>
  ): Observable<T> {
    return from(this.fingerprint.collect()).pipe(switchMap(request));
  }
}
