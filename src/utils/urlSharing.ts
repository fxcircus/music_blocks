import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { AppState } from '../blocks/types';
import { TilesState } from './types';

// Max URL length we target (safe across all browsers)
const MAX_URL_LENGTH = 8000;
// Max notes length before truncation (in characters of HTML)
const MAX_NOTES_LENGTH = 4000;

/**
 * Lightweight payload for URL sharing.
 * Only includes state that matters for sharing — excludes transient state
 * like timer running, metronome running, etc.
 */
interface ShareableState {
  v: 2; // version marker
  blocks: Array<{
    t: string;   // type
    o: number;   // order
    s: Record<string, any>; // state
  }>;
  p?: number; // chord progression index
  th?: string; // theme name
}

/**
 * Convert full AppState to a compact shareable payload
 */
function toShareable(appState: AppState, progressionIndex?: number): ShareableState {
  const blocks = appState.blocks
    .filter(b => b.visible)
    .sort((a, b) => a.order - b.order)
    .map(b => {
      // Strip transient state per block type
      let state = { ...b.state };
      switch (b.type) {
        case 'flowTimer':
          // Don't share timer running state
          state = { time: state.time || 1500 };
          break;
        case 'metronome':
          // Don't share running/muted state
          state = { bpm: state.bpm };
          break;
        case 'notes':
          // Truncate notes if too long
          if (state.notes && state.notes.length > MAX_NOTES_LENGTH) {
            state.notes = state.notes.substring(0, MAX_NOTES_LENGTH);
          }
          break;
        case 'inspirationGenerator':
          // Keep all generator state (root, scale, bpm, sound, tones)
          break;
        case 'varispeed':
          // Keep bpm, keyIdx, linkedToGenerator
          break;
        case 'arrangementTool':
          // Keep selectedTemplate
          break;
      }
      return { t: b.type, o: b.order, s: state };
    });

  const payload: ShareableState = { v: 2, blocks };
  if (progressionIndex !== undefined && progressionIndex > 0) {
    payload.p = progressionIndex;
  }
  // Include theme if not the default
  const theme = localStorage.getItem('tilesTheme');
  if (theme && theme !== 'dark') {
    payload.th = theme;
  }
  return payload;
}

/**
 * Convert shareable payload back to AppState updates
 */
function fromShareable(payload: ShareableState): { appState: Partial<AppState>; progression?: number; theme?: string } {
  const blocks = payload.blocks.map((b, index) => ({
    instanceId: b.t,
    type: b.t,
    order: b.o ?? index,
    visible: true,
    state: b.s,
  }));

  return {
    appState: { blocks },
    progression: payload.p,
    theme: payload.th,
  };
}

/**
 * Encode the full block-based AppState into a compressed URL
 */
export const encodeAppStateToURL = (appState: AppState): string => {
  const url = new URL(window.location.href);

  // Clear all old and new params
  ['root', 'scale', 'bpm', 'sound', 'notes', 'timer', 'template', 'progression', 's'].forEach(param => {
    url.searchParams.delete(param);
  });

  // Get chord progression from localStorage
  const progression = parseInt(localStorage.getItem('tilesProgression') || '0', 10);

  const payload = toShareable(appState, progression);
  const json = JSON.stringify(payload);
  const compressed = compressToEncodedURIComponent(json);

  url.searchParams.set('s', compressed);

  // If URL is too long, truncate notes and retry
  if (url.toString().length > MAX_URL_LENGTH) {
    const notesBlock = payload.blocks.find(b => b.t === 'notes');
    if (notesBlock && notesBlock.s.notes) {
      // Progressively truncate notes
      const lengths = [2000, 1000, 500, 0];
      for (const len of lengths) {
        notesBlock.s.notes = len > 0
          ? notesBlock.s.notes.substring(0, len)
          : '';
        const retryJson = JSON.stringify(payload);
        const retryCompressed = compressToEncodedURIComponent(retryJson);
        url.searchParams.set('s', retryCompressed);
        if (url.toString().length <= MAX_URL_LENGTH) break;
      }
    }
  }

  return url.toString();
};

/**
 * Decode URL — handles both new compressed format (?s=...) and legacy format (?root=...&scale=...)
 */
export const decodeURLToAppState = (url: string): { appState?: Partial<AppState>; legacyState?: Partial<TilesState>; progression?: number; theme?: string } => {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    // New format: compressed state in ?s= param
    if (params.has('s')) {
      const compressed = params.get('s')!;
      const json = decompressFromEncodedURIComponent(compressed);
      if (json) {
        const payload = JSON.parse(json) as ShareableState;
        if (payload.v === 2) {
          const result = fromShareable(payload);
          return { appState: result.appState, progression: result.progression, theme: result.theme };
        }
      }
    }

    // Legacy format: individual params
    const legacyState: Partial<TilesState> = {};
    if (params.has('root')) legacyState.rootEl = params.get('root') || '';
    if (params.has('scale')) legacyState.scaleEl = params.get('scale') || '';
    if (params.has('bpm')) legacyState.bpmEl = params.get('bpm') || '';
    if (params.has('sound')) legacyState.soundEl = params.get('sound') || '';
    if (params.has('notes')) legacyState.notes = decodeURIComponent(params.get('notes') || '');
    if (params.has('template')) legacyState.template = decodeURIComponent(params.get('template') || '');
    let progression: number | undefined;
    if (params.has('progression')) {
      progression = parseInt(params.get('progression') || '0', 10);
    }

    if (Object.keys(legacyState).length > 0) {
      return { legacyState, progression };
    }

    return {};
  } catch (error) {
    console.error('Error decoding URL params:', error);
    return {};
  }
};

/**
 * Check if URL contains state parameters (new or legacy format)
 */
export const hasStateParams = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const params = ['s', 'root', 'scale', 'bpm', 'sound', 'notes', 'template', 'progression'];
    return params.some(param => urlObj.searchParams.has(param));
  } catch (error) {
    return false;
  }
};

/**
 * Copy the current state URL to clipboard
 */
export const copyAppStateURLToClipboard = (appState: AppState): Promise<boolean> => {
  try {
    const url = encodeAppStateToURL(appState);
    return navigator.clipboard.writeText(url)
      .then(() => true)
      .catch(err => {
        console.error('Error copying to clipboard:', err);
        return false;
      });
  } catch (error) {
    console.error('Error generating URL:', error);
    return Promise.resolve(false);
  }
};

// ─── Legacy exports (kept for backward compat during transition) ─────

/** @deprecated Use decodeURLToAppState instead */
export const decodeURLToState = (url: string): Partial<TilesState> => {
  const result = decodeURLToAppState(url);
  return result.legacyState || {};
};

/** @deprecated Use copyAppStateURLToClipboard instead */
export const copyStateURLToClipboard = (state: TilesState): Promise<boolean> => {
  // This path shouldn't be called anymore, but keep it working
  try {
    const url = new URL(window.location.href);
    if (state.rootEl) url.searchParams.set('root', state.rootEl);
    if (state.scaleEl) url.searchParams.set('scale', state.scaleEl);
    if (state.bpmEl) url.searchParams.set('bpm', state.bpmEl);
    if (state.soundEl) url.searchParams.set('sound', state.soundEl);
    if (state.notes?.trim()) url.searchParams.set('notes', encodeURIComponent(state.notes));
    if (state.template) url.searchParams.set('template', encodeURIComponent(state.template));
    if (state.progression !== undefined && state.progression > 0) {
      url.searchParams.set('progression', String(state.progression));
    }
    return navigator.clipboard.writeText(url.toString())
      .then(() => true)
      .catch(() => false);
  } catch {
    return Promise.resolve(false);
  }
};
