import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../../auth/services/auth';
import { parseApiError } from '../../../core/errors/api-error.parser';
import { ErrorCode } from '../../../core/errors/error-code';
import { ToastService } from '../../../core/toast/toast.service';
import { previewSlot } from '../slot-preview';
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
import { MemberPicker } from '../member-picker/member-picker';
import { PickedMember } from '../member-picker/picked-member';
import { formatDayTime, formatTimeLeft } from '../event-dates';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type JoinStep = 'works' | 'if-needed' | 'pick' | 'name';

const CODE_LENGTH = 4;


/**
 * Everything a member of a public event does, on one screen. Which parts show depends on the mode
 * and where the event has got to, but the screen never changes shape under someone mid-action -
 * joining always ends on the same card they started from.
 */
@Component({
  selector: 'app-public-event',
  standalone: true,
  imports: [CommonModule, ButtonComponent, DateTile, MemberPicker, PickedMember],
  templateUrl: './public-event.html',
  styleUrls: ['./public-event.scss', './slot-members.scss'],
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
  protected readonly email = signal('');
  protected readonly emailError = signal<string | null>(null);
  protected readonly nameError = signal<string | null>(null);

  /** The name belongs to someone already - which is the question "is that you?". */
  protected readonly askingForCode = signal(false);
  protected readonly codeInput = signal('');

  /** Came in through "already joined?" rather than by colliding with a name. */
  protected readonly returningWithCode = signal(false);

  /** Tapped on the "who are you?" list - the name is settled, only the code is left to type. */
  protected readonly pickedMember = signal<EventMemberRow | null>(null);

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

  /** The dates with the member's unsent picks counted in, so the tiles show what a tap changes. */
  protected readonly previewSlots = computed<EventSlotResponse[]>(() => {
    const event = this.event();
    if (!event) {
      return [];
    }
    if (!this.isChoosingDate()) {
      return event.slots;
    }

    const saved: Record<string, SlotPreference> = {};
    event.myVotes.forEach((vote) => (saved[vote.slotId] = vote.preference));
    const picks = this.picks();

    return event.slots.map((slot) =>
      slot.open ? previewSlot(slot, saved[slot.id], picks[slot.id], event.minAttendees) : slot
    );
  });

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
      // If coming from a direct slot link, keep that specific slot picked
      this.picks.set({ [this.directSlotId]: SlotPreference.PREFERRED });
    }
    
    // Always skip straight to the name/code entry step
    this.joinStep.set('name');
    this.joinOpen.set(true);
  }

  closeJoin(): void {
    this.joinOpen.set(false);
    this.pickedMember.set(null);
    this.nameError.set(null);
    this.emailError.set(null);
    this.askingForCode.set(false);
    this.returningWithCode.set(false);
    this.codeInput.set('');
  }

  /**
   * For someone who joined before and has their code rather than the session. They pick themselves
   * off the list - this phone's previous user comes first - so the code is all there is to type.
   */
  openReturn(): void {
    this.picks.set({});
    this.displayName.set('');
    this.codeInput.set('');
    this.nameError.set(null);
    this.emailError.set(null);
    this.returningWithCode.set(true);
    this.askingForCode.set(true);
    this.pickedMember.set(null);
    this.joinStep.set('pick');
    this.joinOpen.set(true);
  }

  pickMember(member: EventMemberRow): void {
    this.pickedMember.set(member);
    this.displayName.set(member.displayName);
    this.codeInput.set('');
    this.nameError.set(null);
    this.joinStep.set('name');
    // once the field is rendered - on Android this brings the number pad up straight away
    setTimeout(() => document.getElementById('joinCode')?.focus());
  }

  /** Back to the list from the code step. */
  notMe(): void {
    this.pickedMember.set(null);
    this.displayName.set('');
    this.codeInput.set('');
    this.nameError.set(null);
    this.joinStep.set('pick');
  }

  /** The list does not have them, or they would rather type - the plain name and code form. */
  typeNameInstead(): void {
    this.pickedMember.set(null);
    this.displayName.set('');
    this.nameError.set(null);
    this.joinStep.set('name');
  }

  /** Four digits are the whole answer, so the fourth one signs in without another tap. */
  typeCode(value: string): void {
    const code = value.replace(/\D/g, '').slice(0, CODE_LENGTH);
    this.codeInput.set(code);
    if (this.pickedMember() && code.length === CODE_LENGTH && !this.working()) {
      this.confirmJoin();
    }
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


  backAStep(): void {
    // Since 'name' is now the first and only step in the dialog, 
    // going back just closes the join dialog or resets the view.
    this.closeJoin();
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

    // someone coming back with a code is already a member, and has given their address
    const email = this.email().trim();
    const needsEmail = this.isGuest && !this.askingForCode();
    if (needsEmail && !EMAIL_PATTERN.test(email)) {
      this.emailError.set(email ? 'That does not look like an email address' : 'We need an email to tell you which date won');
      return;
    }
    this.emailError.set(null);

    const choosing = event.schedulingMode === SchedulingMode.POLL;
    this.working.set(true);

    this.events
      .join(this.slug, {
        displayName: this.isGuest ? name : null,
        email: this.isGuest && email ? email : null,
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
      this.codeInput.set('');
      this.nameError.set(
        this.pickedMember()
          ? "That code doesn't match. Try again?"
          : "That code doesn't match. Try another name instead?"
      );
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

  /** Toggles picks directly from the main event page when logged in */
  toggleMainPagePick(slot: EventSlotResponse): void {
    if (!this.isChoosingDate()) return;
    
    // Default to preferred if not picked yet, or cycle/remove
    this.picks.update((current) => {
      const next = { ...current };
      if (next[slot.id] === SlotPreference.PREFERRED) {
        next[slot.id] = SlotPreference.IF_NEEDED;
      } else if(next[slot.id] === SlotPreference.IF_NEEDED) {
        delete next[slot.id];
      } else {
        next[slot.id] = SlotPreference.PREFERRED;
      }
      return next;
    });
  }

  /** Checks if current local picks differ from what was loaded from the server */
  protected readonly hasUnsavedChanges = computed(() => {
    const event = this.event();
    if (!event) return false;
    
    const serverVotes: Record<string, SlotPreference> = {};
    event.myVotes.forEach((vote) => (serverVotes[vote.slotId] = vote.preference));
    
    const currentPicks = this.picks();
    const serverKeys = Object.keys(serverVotes);
    const currentKeys = Object.keys(currentPicks);

    if (serverKeys.length !== currentKeys.length) return true;

    for (const key of currentKeys) {
      if (serverVotes[key] !== currentPicks[key]) {
        return true;
      }
    }
    return false;
  });

  // Add these properties inside PublicEventPage class:
  protected readonly expandedSlotId = signal<string | null>(null);
  protected readonly slotMembersMap = signal<Record<string, EventMemberRow[]>>({});
  protected readonly slotMembersLoading = signal<Record<string, boolean>>({});

  // Add this method to handle toggling and fetching:
  toggleSlotMembers(slotId: string): void {
    const current = this.expandedSlotId();
    if (current === slotId) {
      this.expandedSlotId.set(null);
      return;
    }
    this.expandedSlotId.set(slotId);

    // Fetch members if not already cached
    if (!this.slotMembersMap()[slotId]) {
      this.slotMembersLoading.update((map) => ({ ...map, [slotId]: true }));
      this.events
        .slotMembers(this.slug, slotId)
        .pipe(
          finalize(() =>
            this.slotMembersLoading.update((map) => ({ ...map, [slotId]: false }))
          )
        )
        .subscribe({
          next: (members) => {
            this.slotMembersMap.update((map) => ({ ...map, [slotId]: members }));
          },
        });
    }
  }
}
