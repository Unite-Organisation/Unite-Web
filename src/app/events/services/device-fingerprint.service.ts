import { Injectable } from '@angular/core';
import { DeviceFingerprint } from '../../models/api-models/public-event.models';

const DEVICE_ID_KEY = 'unite-device-id';

/** Past this the fingerprint goes without the slow signals - nobody waits on a login for a hash. */
const COLLECT_TIMEOUT_MS = 400;

type UserAgentData = {
  getHighEntropyValues(hints: string[]): Promise<{ model?: string; platformVersion?: string }>;
};

/**
 * What this browser looks like, so the backend can put the person who used it before at the top of
 * the "who are you?" list. Every signal is best effort: a browser that hides one simply sends null,
 * and the whole thing falls back to null rather than ever holding up joining or signing in.
 *
 * The same object goes out when someone joins (stored) and when the list is asked for (compared),
 * so both have to come from here - two ways of measuring would never match.
 */
@Injectable({ providedIn: 'root' })
export class DeviceFingerprintService {
  private pending: Promise<DeviceFingerprint | null> | null = null;

  collect(): Promise<DeviceFingerprint | null> {
    this.pending ??= Promise.race([
      this.measure().catch(() => null),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), COLLECT_TIMEOUT_MS)),
    ]);
    return this.pending;
  }

  private async measure(): Promise<DeviceFingerprint> {
    const [hints, canvasHash] = await Promise.all([this.highEntropyHints(), this.canvasHash()]);
    const nav = navigator as Navigator & { deviceMemory?: number };

    return {
      deviceId: this.deviceId(),
      screenWidth: attempt(() => screen.width),
      screenHeight: attempt(() => screen.height),
      pixelRatio: attempt(() => window.devicePixelRatio),
      colorDepth: attempt(() => screen.colorDepth),
      hardwareConcurrency: attempt(() => nav.hardwareConcurrency),
      deviceMemory: attempt(() => nav.deviceMemory),
      maxTouchPoints: attempt(() => nav.maxTouchPoints),
      timeZone: clip(
        attempt(() => Intl.DateTimeFormat().resolvedOptions().timeZone),
        40
      ),
      timeZoneOffset: attempt(() => new Date().getTimezoneOffset()),
      languages: clip(
        attempt(() => nav.languages.join(',')),
        120
      ),
      deviceModel: clip(hints.model, 60),
      platformVersion: clip(hints.platformVersion, 20),
      renderer: clip(this.renderer(), 120),
      canvasHash,
    };
  }

  /** The strongest signal, but it lives and dies with this browser's storage. */
  private deviceId(): string | null {
    try {
      let id = localStorage.getItem(DEVICE_ID_KEY);
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(DEVICE_ID_KEY, id);
      }
      return id;
    } catch {
      return null;
    }
  }

  /** Chromium only - the phone model is what survives switching browsers on the same phone. */
  private async highEntropyHints(): Promise<{ model?: string; platformVersion?: string }> {
    const data = (navigator as Navigator & { userAgentData?: UserAgentData }).userAgentData;
    if (!data) {
      return {};
    }
    try {
      return await data.getHighEntropyValues(['model', 'platformVersion']);
    } catch {
      return {};
    }
  }

  private renderer(): string | null {
    try {
      const gl = document.createElement('canvas').getContext('webgl');
      if (!gl) {
        return null;
      }
      const debug = gl.getExtension('WEBGL_debug_renderer_info');
      return gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? null;
    } catch {
      return null;
    }
  }

  /** Same drawing, same pixels on the same hardware - Safari adds noise, which the scoring tolerates. */
  private async canvasHash(): Promise<string | null> {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 220;
      canvas.height = 40;
      const context = canvas.getContext('2d');
      if (!context || !crypto.subtle) {
        return null;
      }

      context.textBaseline = 'top';
      context.font = '16px Arial';
      context.fillStyle = '#c0563a';
      context.fillRect(100, 2, 80, 20);
      context.fillStyle = '#2b2622';
      context.fillText('Unite, żółw 🐢', 4, 8);

      const bytes = new TextEncoder().encode(canvas.toDataURL());
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
        ''
      );
    } catch {
      return null;
    }
  }
}

function attempt<T>(read: () => T | undefined): T | null {
  try {
    return read() ?? null;
  } catch {
    return null;
  }
}

/** The backend rejects the whole request over a field that is too long, so they are cut here. */
function clip(value: string | null | undefined, max: number): string | null {
  return value ? value.slice(0, max) : null;
}
