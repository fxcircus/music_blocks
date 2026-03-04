import { TilesState } from './types';

/**
 * Encode the application state into URL parameters
 */
export const encodeStateToURL = (state: TilesState): string => {
  // Create a URL object with the current location
  const url = new URL(window.location.href);
  
  // Clear any existing state params
  ['root', 'scale', 'bpm', 'sound', 'notes', 'timer', 'template', 'progression'].forEach(param => {
    url.searchParams.delete(param);
  });

  // Add state params
  if (state.rootEl) url.searchParams.set('root', state.rootEl);
  if (state.scaleEl) url.searchParams.set('scale', state.scaleEl);
  if (state.bpmEl) url.searchParams.set('bpm', state.bpmEl);
  if (state.soundEl) url.searchParams.set('sound', state.soundEl);

  // Only include notes if they exist to keep URL cleaner
  if (state.notes && state.notes.trim()) {
    url.searchParams.set('notes', encodeURIComponent(state.notes));
  }

  // Arrangement template
  if (state.template) url.searchParams.set('template', encodeURIComponent(state.template));

  // Chord progression index
  if (state.progression !== undefined && state.progression > 0) {
    url.searchParams.set('progression', String(state.progression));
  }

  return url.toString();
};

/**
 * Decode URL parameters into application state
 */
export const decodeURLToState = (url: string): Partial<TilesState> => {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    const partialState: Partial<TilesState> = {};
    
    // Extract values from URL params
    if (params.has('root')) partialState.rootEl = params.get('root') || '';
    if (params.has('scale')) partialState.scaleEl = params.get('scale') || '';
    if (params.has('bpm')) partialState.bpmEl = params.get('bpm') || '';
    if (params.has('sound')) partialState.soundEl = params.get('sound') || '';
    
    // Decode notes if present
    if (params.has('notes')) {
      partialState.notes = decodeURIComponent(params.get('notes') || '');
    }

    // Arrangement template
    if (params.has('template')) {
      partialState.template = decodeURIComponent(params.get('template') || '');
    }

    // Chord progression index
    if (params.has('progression')) {
      partialState.progression = parseInt(params.get('progression') || '0', 10);
    }

    return partialState;
  } catch (error) {
    console.error('Error decoding URL params:', error);
    return {};
  }
};

/**
 * Check if URL contains state parameters
 */
export const hasStateParams = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const params = ['root', 'scale', 'bpm', 'sound', 'notes', 'template', 'progression'];
    return params.some(param => urlObj.searchParams.has(param));
  } catch (error) {
    return false;
  }
};

/**
 * Copy the current state URL to clipboard and return success status
 */
export const copyStateURLToClipboard = (state: TilesState): Promise<boolean> => {
  try {
    const url = encodeStateToURL(state);
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