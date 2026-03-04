import { TilesState } from './types';

const PREFIX = 'tiles';

/**
 * Storage keys used in the application
 */
export const STORAGE_KEYS = {
  NOTES: `${PREFIX}Notes`,
  ROOT_EL: `${PREFIX}RootEl`,
  SCALE_EL: `${PREFIX}ScaleEl`,
  TONES_EL: `${PREFIX}TonesEl`,
  TONES_ARR_EL: `${PREFIX}TonesArrEl`,
  BPM_EL: `${PREFIX}BpmEl`,
  SOUND_EL: `${PREFIX}SoundEl`,
  THEME: `${PREFIX}Theme`,
  TEMPLATE: `${PREFIX}Template`,
  PROGRESSION: `${PREFIX}Progression`,
};

/**
 * Default values for application state
 */
export const DEFAULT_STATE: TilesState = {
  notes: '',
  rootEl: 'C',
  scaleEl: 'Major',
  tonesEl: 'T - T - S - T - T - T - S',
  tonesArrEl: ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'],
  bpmEl: '100',
  soundEl: 'Electric Guitar',
};

/**
 * Saves a key-value pair to localStorage
 */
export const saveToStorage = <T>(key: string, value: T): void => {
  try {
    const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error(`Error saving to localStorage [${key}]:`, error);
  }
};

/**
 * Retrieves a value from localStorage with proper type handling
 */
export const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    
    if (item === null) {
      return defaultValue;
    }
    
    // Handle different types appropriately
    if (typeof defaultValue === 'object') {
      return JSON.parse(item) as T;
    }
    
    if (typeof defaultValue === 'number') {
      return Number(item) as unknown as T;
    }
    
    if (typeof defaultValue === 'boolean') {
      return (item === 'true') as unknown as T;
    }
    
    return item as unknown as T;
  } catch (error) {
    console.error(`Error reading from localStorage [${key}]:`, error);
    return defaultValue;
  }
};

/**
 * Loads the entire application state from localStorage
 */
export const loadAppState = (): TilesState => {
  return {
    notes: getFromStorage(STORAGE_KEYS.NOTES, DEFAULT_STATE.notes),
    rootEl: getFromStorage(STORAGE_KEYS.ROOT_EL, DEFAULT_STATE.rootEl),
    scaleEl: getFromStorage(STORAGE_KEYS.SCALE_EL, DEFAULT_STATE.scaleEl),
    tonesEl: getFromStorage(STORAGE_KEYS.TONES_EL, DEFAULT_STATE.tonesEl),
    tonesArrEl: getFromStorage(STORAGE_KEYS.TONES_ARR_EL, DEFAULT_STATE.tonesArrEl),
    bpmEl: getFromStorage(STORAGE_KEYS.BPM_EL, DEFAULT_STATE.bpmEl),
    soundEl: getFromStorage(STORAGE_KEYS.SOUND_EL, DEFAULT_STATE.soundEl),
    template: getFromStorage(STORAGE_KEYS.TEMPLATE, ''),
    progression: getFromStorage(STORAGE_KEYS.PROGRESSION, 0),
  };
};

/**
 * Saves the entire application state to localStorage
 */
export const saveAppState = (state: TilesState): void => {
  saveToStorage(STORAGE_KEYS.NOTES, state.notes);
  saveToStorage(STORAGE_KEYS.ROOT_EL, state.rootEl);
  saveToStorage(STORAGE_KEYS.SCALE_EL, state.scaleEl);
  saveToStorage(STORAGE_KEYS.TONES_EL, state.tonesEl);
  saveToStorage(STORAGE_KEYS.TONES_ARR_EL, state.tonesArrEl);
  saveToStorage(STORAGE_KEYS.BPM_EL, state.bpmEl);
  saveToStorage(STORAGE_KEYS.SOUND_EL, state.soundEl);
  if (state.template !== undefined) saveToStorage(STORAGE_KEYS.TEMPLATE, state.template);
  if (state.progression !== undefined) saveToStorage(STORAGE_KEYS.PROGRESSION, state.progression);
}; 