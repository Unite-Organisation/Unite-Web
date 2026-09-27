import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../../auth/services/auth';
import { parseApiError } from '../../../core/errors/api-error.parser';
import { ErrorCode } from '../../../core/errors/error-code';
import { ToastService } from '../../../core/toast/toast.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import {
  EventMemberRow,
  EventMemberRole,
  EventMemberStatus,
  EventSlotResponse,
  EventStatus,
  PublicEvent,
  SchedulingMode,
  SlotPreference,
  SlotVote,
} from '../../../models/api-models/public-event.models';
import { PublicEventService } from '../../services/public-event.service';
import { DateTile } from '../date-tile/date-tile';
import { formatDayTime, formatTimeLeft } from '../event-dates';

type JoinStep = 'works' | 'if-needed' | 'name';

/**
 * Everything a member of a public event does, on one screen. Which parts show depends on the mode
 * and where the event has got to, but the screen never changes shape under someone mid-action -
 * joining always ends on the same card they started from.
 */
@Component({
  selector: 'app-public-event',
  standalone: true,
  imports: [CommonModule, ButtonComponent, DateTile],
  templateUrl: './public-event.html',
  styleUrl: './public-event.scss',
})
export class PublicEventPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly events = inject(PublicEventService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  protected readonly status = EventStatus;
  protected readonly preference = SlotPreference;

  protected readonly event = signal<PublicEvent | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly working = signal(false);

  /** Shown once after creating or joining as a guest - it is the only way back on another device. */
  protected readonly returnCode = signal<string | null>(null);

  protected readonly joinOpen = signal(false);
  protected readonly joinStep = signal<JoinStep>('works');
  protected readonly picks = signal<Record<string, SlotPreference>>({});
  protected readonly displayName = signal('');
  protected readonly nameError = signal<string | null>(null);

  /** The name belongs to someone already - which is the question "is that you?". */
  protected readonly askingForCode = signal(false);
  protected readonly codeInput = signal('');

  /** Came in through "already joined?" rather than by colliding with a name. */
  protected readonly returningWithCode = signal(false);

  protected readonly membersOpen = signal(false);
  /** null until someone asks - the names are a detail most people never open. */
  protected readonly members = signal<EventMemberRow[] | null>(null);
  protected readonly membersLoading = signal(false);

  protected readonly going = computed(() =>
    (this.members() ?? []).filter((member) => member.status === EventMemberStatus.GOING)
  );
  protected readonly waiting = computed(() =>
    (this.members() ?? []).filter((member) => member.status === EventMemberStatus.WAITLIST)
  );
  /** People whose dates lost. Counted, not named - nobody needs a list of who missed out. */
  protected readonly unavailableCount = computed(
    () =>
      (this.members() ?? []).filter((member) => member.status === EventMemberStatus.NOT_AVAILABLE)
        .length
  );

  /** Arrived through the one-date link the host shares after the deadline. */
  private directSlotId: string | null = null;
  protected slug = '';

  protected readonly isGuest = !this.auth.isLoggedIn();

  protected readonly me = computed(() => this.event()?.me ?? null);
  protected readonly isMember = computed(() => this.me() !== null);
  protected readonly isHost = computed(() => this.me()?.role === EventMemberRole.HOST);

  protected readonly isChoosingDate = computed(() => {
    const event = this.event();
    if (!event || event.schedulingMode !== SchedulingMode.POLL) {
      return false;
    }
    return (
      event.status === EventStatus.COLLECTING_VOTES || event.status === EventStatus.ONE_SLOT_LEFT
    );
  });

  protected readonly chosenSlot = computed<EventSlotResponse | null>(() => {
    const event = this.event();
    if (!event?.selectedSlotId) {
      return null;
    }
    return event.slots.find((slot) => slot.id === event.selectedSlotId) ?? null;
  });

  protected readonly openSlots = computed(() => this.event()?.slots.filter((s) => s.open) ?? []);

  /** Dates nobody has put in the first bucket yet - the only ones the second step asks about. */
  protected readonly undecidedSlots = computed(() =>
    this.openSlots().filter((slot) => this.picks()[slot.id] === undefined)
  );

  protected readonly pickedCount = computed(() => Object.keys(this.picks()).length);

  /** In the event as far as it is concerned - not dropped out, not left behind by the date. */
  private readonly isActiveMember = computed(() => {
    const status = this.me()?.status;
    return status === EventMemberStatus.GOING || status === EventMemberStatus.WAITLIST;
  });

  protected readonly canChangeDates = computed(() => this.isChoosingDate() && this.isActiveMember());
  protected readonly canRejoin = computed(() => this.me()?.status === EventMemberStatus.NOT_GOING);
  protected readonly canStartNow = computed(
    () => this.isHost() && this.event()?.status === EventStatus.GROUP_FORMED
  );

  /**
   * The host is left out on purpose: dropping out of your own event only takes it below its own
   * threshold, and there is no sensible screen for what happens next.
   */
  protected readonly canLeave = computed(() => this.isActiveMember() && !this.isHost());

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.directSlotId = this.route.snapshot.paramMap.get('slotId');

    const navigation = this.router.getCurrentNavigation()?.extras.state ?? history.state;
    if (navigation?.['returnCode']) {
      this.returnCode.set(navigation['returnCode']);
    }

    this.load();
  }

  // ───────────────────────────────────────── reading

  private load(afterAction = false): void {
    this.events
      .get(this.slug)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (event) => {
          this.event.set(event);
          this.seedPicksFromMyVotes(event);
          if (!afterAction && this.directSlotId && !event.me) {
            // the one-date link goes straight to the question worth asking
            this.openJoin();
          }
        },
        error: () => this.notFound.set(true),
      });
  }

  private seedPicksFromMyVotes(event: PublicEvent): void {
    if (!event.myVotes.length) {
      return;
    }
    const picks: Record<string, SlotPreference> = {};
    event.myVotes.forEach((vote) => (picks[vote.slotId] = vote.preference));
    this.picks.set(picks);
  }

  // ───────────────────────────────────────── labels

  whenLabel(value: string): string {
    return formatDayTime(value);
  }

  deadlineLabel(): string {
    const deadline = this.event()?.votingDeadline;
    return deadline ? formatTimeLeft(deadline) : '';
  }

  statusLabel(): string {
    switch (this.me()?.status) {
      case EventMemberStatus.GOING:
        return "You're in";
      case EventMemberStatus.WAITLIST:
        return "You're on the waitlist";
      case EventMemberStatus.NOT_GOING:
        return 'You dropped out';
      case EventMemberStatus.NOT_AVAILABLE:
        return "The date picked doesn't work for you";
      default:
        return '';
    }
  }

  // ───────────────────────────────────────── joining

  openJoin(): void {
    const event = this.event();
    if (!event) {
      return;
    }

    if (this.directSlotId) {
      // the link already answered the only question there was
      this.picks.set({ [this.directSlotId]: SlotPreference.PREFERRED });
      this.joinStep.set('name');
    } else if (event.schedulingMode === SchedulingMode.FIXED) {
      this.joinStep.set('name');
    } else {
      this.joinStep.set('works');
    }

    this.joinOpen.set(true);
  }

  closeJoin(): void {
    this.joinOpen.set(false);
    this.nameError.set(null);
    this.askingForCode.set(false);
    this.returningWithCode.set(false);
    this.codeInput.set('');
  }

  /** For someone who joined from another phone and has their code rather than the session. */
  openReturn(): void {
    this.picks.set({});
    this.displayName.set('');
    this.codeInput.set('');
    this.nameError.set(null);
    this.returningWithCode.set(true);
    this.askingForCode.set(true);
    this.joinStep.set('name');
    this.joinOpen.set(true);
  }

  signOut(): void {
    this.working.set(true);

    this.events
      .signOut(this.slug)
      .pipe(finalize(() => this.working.set(false)))
      .subscribe({
        next: () => {
          // whoever picks the phone up next is not this person
          this.picks.set({});
          this.displayName.set('');
          this.toast.success('Signed out of this event');
          this.afterAction();
        },
      });
  }

  togglePick(slot: EventSlotResponse): void {
    const wanted =
      this.joinStep() === 'if-needed' ? SlotPreference.IF_NEEDED : SlotPreference.PREFERRED;

    this.picks.update((current) => {
      const next = { ...current };
      if (next[slot.id] === wanted) {
        delete next[slot.id];
      } else {
        next[slot.id] = wanted;
      }
      return next;
    });
  }

  /** The second step is skipped when there is nothing left to ask about. */
  goToSecondStep(): void {
    this.nameError.set(null);
    this.joinStep.set(this.undecidedSlots().length > 0 ? 'if-needed' : 'name');
  }

  goToName(): void {
    this.joinStep.set('name');
  }

  backAStep(): void {
    if (this.joinStep() === 'name') {
      this.joinStep.set(this.undecidedSlots().length > 0 ? 'if-needed' : 'works');
      return;
    }
    this.joinStep.set('works');
  }

  private votes(): SlotVote[] | null {
    const entries = Object.entries(this.picks());
    if (!entries.length) {
      // null leaves the answers alone; an empty list would read as "I picked nothing"
      return null;
    }
    return entries.map(([slotId, preference]) => ({ slotId, preference }));
  }

  confirmJoin(): void {
    const event = this.event();
    if (!event) {
      return;
    }

    const name = this.displayName().trim();
    if (this.isGuest && !name) {
      this.nameError.set('Tell people who you are');
      return;
    }

    const choosing = event.schedulingMode === SchedulingMode.POLL;
    this.working.set(true);

    this.events
      .join(this.slug, {
        displayName: this.isGuest ? name : null,
        returnCode: this.askingForCode() ? this.codeInput().trim() : null,
        votes: choosing ? this.votes() : null,
      })
      .pipe(finalize(() => this.working.set(false)))
      .subscribe({
        next: (session) => {
          if (session.returnCode) {
            this.returnCode.set(session.returnCode);
          }
          this.closeJoin();

          if (this.isChoosingDate()) {
            this.toast.success('Your dates are in');
            this.afterAction();
            return;
          }

          // an event that already has a date takes an ordinary yes, the same as it always did
          this.events.changeAttendance(this.slug, EventMemberStatus.GOING).subscribe({
            next: () => {
              this.toast.success("You're in");
              this.afterAction();
            },
            error: () => this.afterAction(),
          });
        },
        error: (error) => this.reportJoinFailure(error),
      });
  }

  /**
   * Codes come back upper case, so they are read through the shared parser rather than compared by
   * hand. A taken name is not a failure - it is the event asking whether this is the same person
   * coming back, which is what the code answers.
   */
  private reportJoinFailure(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.nameError.set(null);
      return;
    }

    const codes = parseApiError(error).map((entry) => entry.code);

    if (codes.includes(ErrorCode.EVENT_MEMBER_NAME_TAKEN)) {
      this.askingForCode.set(true);
      this.nameError.set('Someone here already goes by that name. Is it you?');
      return;
    }

    if (codes.includes(ErrorCode.EVENT_RETURN_CODE_INVALID)) {
      this.nameError.set("That code doesn't match. Try another name instead?");
      return;
    }

    if (codes.includes(ErrorCode.EVENT_MEMBER_LOCKED)) {
      this.nameError.set('Too many tries. Give it a few minutes.');
      return;
    }

    this.nameError.set(null);
  }

  useAnotherName(): void {
    this.askingForCode.set(false);
    this.returningWithCode.set(false);
    this.codeInput.set('');
    this.nameError.set(null);
  }

  // ───────────────────────────────────────── changing your mind

  saveDates(): void {
    this.working.set(true);

    this.events
      .changeVotes(this.slug, this.votes() ?? [])
      .pipe(finalize(() => this.working.set(false)))
      .subscribe({
        next: (event) => {
          this.event.set(event);
          this.closeJoin();
          this.toast.success('Updated');
        },
      });
  }

  leave(): void {
    this.setAttendance(EventMemberStatus.NOT_GOING, 'You dropped out');
  }

  comeBack(): void {
    this.setAttendance(EventMemberStatus.GOING, "You're back in");
  }

  private setAttendance(status: EventMemberStatus, message: string): void {
    this.working.set(true);

    this.events
      .changeAttendance(this.slug, status)
      .pipe(finalize(() => this.working.set(false)))
      .subscribe({
        next: () => {
          this.toast.success(message);
          this.afterAction();
        },
      });
  }

  startNow(): void {
    this.working.set(true);

    this.events
      .startNow(this.slug)
      .pipe(finalize(() => this.working.set(false)))
      .subscribe({
        next: (event) => {
          this.event.set(event);
          this.toast.success("It's on");
        },
      });
  }

  toggleMembers(): void {
    const opening = !this.membersOpen();
    this.membersOpen.set(opening);

    if (opening && this.members() === null) {
      this.loadMembers();
    }
  }

  isYou(name: string): boolean {
    return this.me()?.displayName === name;
  }

  private loadMembers(): void {
    this.membersLoading.set(true);

    this.events
      .members(this.slug)
      .pipe(finalize(() => this.membersLoading.set(false)))
      .subscribe({
        next: (rows) => this.members.set(rows),
      });
  }

  private afterAction(): void {
    this.load(true);

    // anything worth reloading the event for moves the list too
    if (this.members() !== null) {
      this.loadMembers();
    }
  }

  // ───────────────────────────────────────── sharing

  get shareUrl(): string {
    return `${window.location.origin}/e/${this.slug}`;
  }

  get directUrl(): string {
    const event = this.event();
    return event?.selectedSlotId
      ? `${window.location.origin}/e/${this.slug}/d/${event.selectedSlotId}`
      : this.shareUrl;
  }

  /** The phone's own share sheet where there is one - that is how this link actually travels. */
  share(url: string): void {
    const event = this.event();
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };

    if (nav.share) {
      nav.share({ title: event?.name ?? 'Event', url }).catch(() => {});
      return;
    }

    navigator.clipboard
      .writeText(url)
      .then(() => this.toast.success('Link copied'))
      .catch(() => this.toast.error('Could not copy the link'));
  }

  dismissReturnCode(): void {
    this.returnCode.set(null);
  }

  createYourOwn(): void {
    this.router.navigateByUrl('/e/new');
  }
}
