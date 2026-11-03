import { EventSlotResponse, SlotPreference } from '../../models/api-models/public-event.models';

/** Mirrors SlotRanking on the backend - an "if needed" counts as half a person towards the goal. */
const IF_NEEDED_WEIGHT = 0.5;

/**
 * The slot as it will read once the member's picks are sent: their saved answer comes out of the
 * counts and the one they are holding goes in, so tapping a tile moves the bar straight away.
 */
export function previewSlot(
  slot: EventSlotResponse,
  saved: SlotPreference | undefined,
  pick: SlotPreference | undefined,
  minAttendees: number | null
): EventSlotResponse {
  if (saved === pick) {
    return slot;
  }

  let preferredCount = slot.preferredCount;
  let ifNeededCount = slot.ifNeededCount;

  if (saved === SlotPreference.PREFERRED) preferredCount--;
  if (saved === SlotPreference.IF_NEEDED) ifNeededCount--;
  if (pick === SlotPreference.PREFERRED) preferredCount++;
  if (pick === SlotPreference.IF_NEEDED) ifNeededCount++;

  preferredCount = Math.max(0, preferredCount);
  ifNeededCount = Math.max(0, ifNeededCount);

  return { ...slot, preferredCount, ifNeededCount, chance: chance(preferredCount, ifNeededCount, minAttendees) };
}

function chance(preferred: number, ifNeeded: number, minAttendees: number | null): number {
  if (!minAttendees || minAttendees <= 0) {
    return 100;
  }
  const weighted = preferred + IF_NEEDED_WEIGHT * ifNeeded;
  return Math.min(100, Math.round((100 * weighted) / minAttendees));
}
