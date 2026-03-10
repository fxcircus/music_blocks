import { ThemeName } from '../theme/ThemeProvider';

// ─── Instrument sound profiles per theme ────────────────────────────────
// Each profile defines how to set up an oscillator + gain for a given
// instrument type. All nodes are created by the caller — the profile only
// configures them. This keeps the API simple and avoids touching the
// audio graph structure.

export interface InstrumentProfile {
  /** Configure oscillator type, filters, etc. Returns extra nodes to connect between osc→gain if needed. */
  setup: (
    ctx: AudioContext,
    oscillator: OscillatorNode,
    gain: GainNode,
    frequency: number,
  ) => { extraNodes?: AudioNode[] };
  /** Apply the gain envelope for a sustained note (press & hold). */
  envelope: (gain: GainNode, time: number) => void;
  /** Apply the release envelope when key is released. */
  release: (gain: GainNode, time: number) => void;
}

export interface SequenceProfile {
  /** Configure oscillator for sequence playback (scale tones, chords). */
  setup: (
    ctx: AudioContext,
    oscillator: OscillatorNode,
    gain: GainNode,
    frequency: number,
  ) => { extraNodes?: AudioNode[] };
  /** Apply the full envelope for a fixed-duration note. */
  envelope: (gain: GainNode, time: number, durationSec: number) => void;
}

// ─── Piano profiles ─────────────────────────────────────────────────────

const pianoProfiles: Record<ThemeName, InstrumentProfile> = {
  // Dark — triangle (original)
  dark: {
    setup(_ctx, osc, _gain, freq) {
      osc.type = 'triangle';
      osc.frequency.value = freq;
      return {};
    },
    envelope(gain, time) {
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.2, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.15, time + 0.1);
    },
    release(gain, time) {
      gain.gain.cancelScheduledValues(time);
      gain.gain.setValueAtTime(gain.gain.value, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    },
  },

  // Light — same as dark
  light: {
    setup(_ctx, osc, _gain, freq) {
      osc.type = 'triangle';
      osc.frequency.value = freq;
      return {};
    },
    envelope(gain, time) {
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.2, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.15, time + 0.1);
    },
    release(gain, time) {
      gain.gain.cancelScheduledValues(time);
      gain.gain.setValueAtTime(gain.gain.value, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    },
  },

  // Vintage — warm sine with slow attack
  vintage: {
    setup(_ctx, osc, _gain, freq) {
      osc.type = 'sine';
      osc.frequency.value = freq;
      return {};
    },
    envelope(gain, time) {
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.22, time + 0.04); // slower attack
      gain.gain.exponentialRampToValueAtTime(0.18, time + 0.15);
    },
    release(gain, time) {
      gain.gain.cancelScheduledValues(time);
      gain.gain.setValueAtTime(gain.gain.value, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2); // longer release
    },
  },

  // Indie — square wave, low volume (lo-fi cassette)
  indie: {
    setup(_ctx, osc, _gain, freq) {
      osc.type = 'square';
      osc.frequency.value = freq;
      return {};
    },
    envelope(gain, time) {
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.08, time + 0.005); // fast attack, low vol
      gain.gain.exponentialRampToValueAtTime(0.06, time + 0.08);
    },
    release(gain, time) {
      gain.gain.cancelScheduledValues(time);
      gain.gain.setValueAtTime(gain.gain.value, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.06);
    },
  },

  // Disco — bright sawtooth with fast decay (funky keys)
  disco: {
    setup(_ctx, osc, _gain, freq) {
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      return {};
    },
    envelope(gain, time) {
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.12, time + 0.005); // snappy attack
      gain.gain.exponentialRampToValueAtTime(0.07, time + 0.06); // quick decay
    },
    release(gain, time) {
      gain.gain.cancelScheduledValues(time);
      gain.gain.setValueAtTime(gain.gain.value, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
    },
  },

  // Hip Hop — soft sine, punchy attack (sampler feel)
  hiphop: {
    setup(_ctx, osc, _gain, freq) {
      osc.type = 'sine';
      osc.frequency.value = freq;
      return {};
    },
    envelope(gain, time) {
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.25, time + 0.005); // punchy
      gain.gain.exponentialRampToValueAtTime(0.12, time + 0.08);
    },
    release(gain, time) {
      gain.gain.cancelScheduledValues(time);
      gain.gain.setValueAtTime(gain.gain.value, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
    },
  },
};

// ─── Guitar profiles ────────────────────────────────────────────────────

const guitarProfiles: Record<ThemeName, InstrumentProfile> = {
  // Dark — triangle (original)
  dark: {
    setup(_ctx, osc, _gain, freq) {
      osc.type = 'triangle';
      osc.frequency.value = freq;
      return {};
    },
    envelope(gain, time) {
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.2, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.15, time + 0.1);
    },
    release(gain, time) {
      gain.gain.cancelScheduledValues(time);
      gain.gain.setValueAtTime(gain.gain.value, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    },
  },

  // Light — same as dark
  light: {
    setup(_ctx, osc, _gain, freq) {
      osc.type = 'triangle';
      osc.frequency.value = freq;
      return {};
    },
    envelope(gain, time) {
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.2, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.15, time + 0.1);
    },
    release(gain, time) {
      gain.gain.cancelScheduledValues(time);
      gain.gain.setValueAtTime(gain.gain.value, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    },
  },

  // Vintage — sawtooth with low-pass filter (tube amp feel)
  vintage: {
    setup(ctx, osc, _gain, freq) {
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      filter.Q.value = 1;
      return { extraNodes: [filter] };
    },
    envelope(gain, time) {
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.18, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.12, time + 0.15);
    },
    release(gain, time) {
      gain.gain.cancelScheduledValues(time);
      gain.gain.setValueAtTime(gain.gain.value, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
    },
  },

  // Indie — square wave with slight detune (warbled tape)
  indie: {
    setup(_ctx, osc, _gain, freq) {
      osc.type = 'square';
      osc.frequency.value = freq * 1.002; // slight detune
      return {};
    },
    envelope(gain, time) {
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.07, time + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.05, time + 0.08);
    },
    release(gain, time) {
      gain.gain.cancelScheduledValues(time);
      gain.gain.setValueAtTime(gain.gain.value, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.06);
    },
  },

  // Disco — clean sine (disco guitar is clean)
  disco: {
    setup(_ctx, osc, _gain, freq) {
      osc.type = 'sine';
      osc.frequency.value = freq;
      return {};
    },
    envelope(gain, time) {
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.2, time + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.14, time + 0.08);
    },
    release(gain, time) {
      gain.gain.cancelScheduledValues(time);
      gain.gain.setValueAtTime(gain.gain.value, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
    },
  },

  // Hip Hop — muted triangle with fast decay
  hiphop: {
    setup(_ctx, osc, _gain, freq) {
      osc.type = 'triangle';
      osc.frequency.value = freq;
      return {};
    },
    envelope(gain, time) {
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.2, time + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.08, time + 0.05); // fast muted decay
    },
    release(gain, time) {
      gain.gain.cancelScheduledValues(time);
      gain.gain.setValueAtTime(gain.gain.value, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.04);
    },
  },
};

// ─── Sequence profiles (scale tones / chord arpeggios) ──────────────────

const sequenceProfiles: Record<ThemeName, SequenceProfile> = {
  // Dark — sine (original)
  dark: {
    setup(_ctx, osc, _gain, freq) {
      osc.type = 'sine';
      osc.frequency.value = freq;
      return {};
    },
    envelope(gain, time, dur) {
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.3, time + 0.01);
      gain.gain.linearRampToValueAtTime(0.2, time + 0.05);
      gain.gain.linearRampToValueAtTime(0.15, time + dur - 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, time + dur);
    },
  },

  // Light — same as dark
  light: {
    setup(_ctx, osc, _gain, freq) {
      osc.type = 'sine';
      osc.frequency.value = freq;
      return {};
    },
    envelope(gain, time, dur) {
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.3, time + 0.01);
      gain.gain.linearRampToValueAtTime(0.2, time + 0.05);
      gain.gain.linearRampToValueAtTime(0.15, time + dur - 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, time + dur);
    },
  },

  // Vintage — triangle with soft envelope
  vintage: {
    setup(_ctx, osc, _gain, freq) {
      osc.type = 'triangle';
      osc.frequency.value = freq;
      return {};
    },
    envelope(gain, time, dur) {
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.25, time + 0.03); // softer attack
      gain.gain.linearRampToValueAtTime(0.2, time + dur * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.01, time + dur);
    },
  },

  // Indie — square wave, clipped short
  indie: {
    setup(_ctx, osc, _gain, freq) {
      osc.type = 'square';
      osc.frequency.value = freq;
      return {};
    },
    envelope(gain, time, dur) {
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.1, time + 0.003);
      gain.gain.linearRampToValueAtTime(0.08, time + dur * 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, time + dur * 0.7); // cuts short
    },
  },

  // Disco — sawtooth with chorus-like detune
  disco: {
    setup(_ctx, osc, _gain, freq) {
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      return {};
    },
    envelope(gain, time, dur) {
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.12, time + 0.005);
      gain.gain.linearRampToValueAtTime(0.1, time + dur * 0.5);
      gain.gain.exponentialRampToValueAtTime(0.01, time + dur);
    },
  },

  // Hip Hop — sine with pitch bend on attack (808 style)
  hiphop: {
    setup(_ctx, osc, _gain, freq) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 1.05, _ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq, _ctx.currentTime + 0.03);
      return {};
    },
    envelope(gain, time, dur) {
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.3, time + 0.005);
      gain.gain.linearRampToValueAtTime(0.18, time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, time + dur);
    },
  },
};

export function getPianoProfile(theme: ThemeName): InstrumentProfile {
  return pianoProfiles[theme];
}

export function getGuitarProfile(theme: ThemeName): InstrumentProfile {
  return guitarProfiles[theme];
}

export function getSequenceProfile(theme: ThemeName): SequenceProfile {
  return sequenceProfiles[theme];
}
