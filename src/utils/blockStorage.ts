/**
 * Block Storage Service
 *
 * Handles loading, saving, and migrating block-based application state.
 * This replaces the old flat state structure with a modular block system.
 */

import { AppState, BlockInstance } from '../blocks/types';
import { getAllBlockTypes, getDefaultBlockState } from '../blocks/blockRegistry';
import { TilesState } from './types';
import { STORAGE_KEYS, DEFAULT_STATE } from './storageService';

// New storage keys for block-based system
const BLOCK_STORAGE_KEY = 'tilesAppState';
const STORAGE_VERSION_KEY = 'tilesStorageVersion';
const CURRENT_STORAGE_VERSION = 2; // Version 1 = old flat state, Version 2 = block-based state

/**
 * Default AppState with all blocks visible
 * This is used for new users or after clearing data
 */
export const getDefaultAppState = (): AppState => {
  const allBlockTypes = getAllBlockTypes();

  const blocks: BlockInstance[] = allBlockTypes.map((blockType, index) => ({
    instanceId: blockType.id, // Use block type ID as instance ID (e.g., 'flowTimer')
    type: blockType.id,
    order: index,
    visible: true,
    state: { ...getDefaultBlockState(blockType.id) },
  }));

  return {
    projectName: 'Untitled Project',
    blocks,
    theme: 'dark', // Default theme
  };
};

/**
 * Migrate old TilesState format to new AppState with blocks
 *
 * Old format:
 * {
 *   notes: "...",
 *   rootEl: "C",
 *   scaleEl: "Major",
 *   tonesEl: "...",
 *   tonesArrEl: [...],
 *   bpmEl: "100",
 *   soundEl: "Guitar"
 * }
 *
 * New format:
 * {
 *   projectName: "Untitled Project",
 *   blocks: [
 *     { instanceId: "flowTimer", type: "flowTimer", order: 0, visible: true, state: {...} },
 *     { instanceId: "inspirationGenerator", type: "inspirationGenerator", order: 1, visible: true, state: {...} },
 *     ...
 *   ],
 *   theme: "dark"
 * }
 */
export const migrateOldStateToBlocks = (oldState: TilesState): AppState => {
  console.log('[Migration] Converting old state to block-based format:', oldState);

  // Create block instances with migrated state
  const blocks: BlockInstance[] = [
    {
      instanceId: 'flowTimer',
      type: 'flowTimer',
      order: 0,
      visible: true,
      state: {
        time: 1500, // Default 25 minutes
        isCounting: false,
      },
    },
    {
      instanceId: 'inspirationGenerator',
      type: 'inspirationGenerator',
      order: 1,
      visible: true,
      state: {
        rootEl: oldState.rootEl || DEFAULT_STATE.rootEl,
        scaleEl: oldState.scaleEl || DEFAULT_STATE.scaleEl,
        tonesEl: oldState.tonesEl || DEFAULT_STATE.tonesEl,
        tonesArrEl: oldState.tonesArrEl || DEFAULT_STATE.tonesArrEl,
        bpmEl: oldState.bpmEl || DEFAULT_STATE.bpmEl,
        soundEl: oldState.soundEl || DEFAULT_STATE.soundEl,
      },
    },
    {
      instanceId: 'metronome',
      type: 'metronome',
      order: 2,
      visible: true,
      state: {
        bpm: parseInt(oldState.bpmEl || DEFAULT_STATE.bpmEl, 10),
        isRunning: false,
        isMuted: false,
      },
    },
    {
      instanceId: 'notes',
      type: 'notes',
      order: 3,
      visible: true,
      state: {
        notes: oldState.notes || DEFAULT_STATE.notes,
      },
    },
    {
      instanceId: 'varispeed',
      type: 'varispeed',
      order: 4,
      visible: true,
      state: {
        bpm: 120,
        keyIdx: 0,
      },
    },
  ];

  const migratedState: AppState = {
    projectName: 'Untitled Project',
    blocks,
    theme: 'dark',
  };

  console.log('[Migration] Migrated to new format:', migratedState);
  return migratedState;
};

/**
 * Check if old storage format exists
 */
const hasOldStorageFormat = (): boolean => {
  return localStorage.getItem(STORAGE_KEYS.ROOT_EL) !== null ||
         localStorage.getItem(STORAGE_KEYS.SCALE_EL) !== null ||
         localStorage.getItem(STORAGE_KEYS.BPM_EL) !== null;
};

/**
 * Load old TilesState from individual localStorage keys
 */
const loadOldState = (): TilesState => {
  return {
    notes: localStorage.getItem(STORAGE_KEYS.NOTES) || DEFAULT_STATE.notes,
    rootEl: localStorage.getItem(STORAGE_KEYS.ROOT_EL) || DEFAULT_STATE.rootEl,
    scaleEl: localStorage.getItem(STORAGE_KEYS.SCALE_EL) || DEFAULT_STATE.scaleEl,
    tonesEl: localStorage.getItem(STORAGE_KEYS.TONES_EL) || DEFAULT_STATE.tonesEl,
    tonesArrEl: JSON.parse(localStorage.getItem(STORAGE_KEYS.TONES_ARR_EL) || JSON.stringify(DEFAULT_STATE.tonesArrEl)),
    bpmEl: localStorage.getItem(STORAGE_KEYS.BPM_EL) || DEFAULT_STATE.bpmEl,
    soundEl: localStorage.getItem(STORAGE_KEYS.SOUND_EL) || DEFAULT_STATE.soundEl,
  };
};

/**
 * Clear old localStorage keys after migration
 */
const clearOldStorage = (): void => {
  console.log('[Migration] Clearing old storage keys');
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

/**
 * Load application state from localStorage
 * Handles migration from old format if needed
 */
export const loadBlockState = (): AppState => {
  try {
    // Check storage version
    const storageVersion = parseInt(localStorage.getItem(STORAGE_VERSION_KEY) || '1', 10);

    // If we have new format (version 2), load it
    if (storageVersion === CURRENT_STORAGE_VERSION) {
      const storedState = localStorage.getItem(BLOCK_STORAGE_KEY);

      if (storedState) {
        const parsedState = JSON.parse(storedState) as AppState;
        console.log('[Storage] Loaded block-based state from localStorage');
        return parsedState;
      }
    }

    // Check if old format exists
    if (hasOldStorageFormat()) {
      console.log('[Storage] Old format detected, migrating...');
      const oldState = loadOldState();
      const migratedState = migrateOldStateToBlocks(oldState);

      // Save migrated state in new format
      saveBlockState(migratedState);

      // Clear old storage keys
      clearOldStorage();

      return migratedState;
    }

    // No existing state, return defaults
    console.log('[Storage] No existing state, using defaults');
    const defaultState = getDefaultAppState();
    saveBlockState(defaultState);
    return defaultState;

  } catch (error) {
    console.error('[Storage] Error loading state:', error);
    // On error, return default state
    return getDefaultAppState();
  }
};

/**
 * Save application state to localStorage
 */
export const saveBlockState = (state: AppState): void => {
  try {
    localStorage.setItem(BLOCK_STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_STORAGE_VERSION));
    console.log('[Storage] Saved block-based state to localStorage');
  } catch (error) {
    console.error('[Storage] Error saving state:', error);
  }
};

/**
 * Update a specific block's state
 */
export const updateBlockState = (
  appState: AppState,
  instanceId: string,
  newBlockState: Record<string, any>
): AppState => {
  const updatedBlocks = appState.blocks.map(block =>
    block.instanceId === instanceId
      ? { ...block, state: { ...block.state, ...newBlockState } }
      : block
  );

  return {
    ...appState,
    blocks: updatedBlocks,
  };
};

/**
 * Add a new block instance
 */
export const addBlock = (appState: AppState, blockTypeId: string): AppState => {
  // Check if block already exists
  const exists = appState.blocks.some(b => b.type === blockTypeId);
  if (exists) {
    console.warn(`[Storage] Block type '${blockTypeId}' already exists`);
    return appState;
  }

  const newOrder = Math.max(...appState.blocks.map(b => b.order), -1) + 1;

  const newBlock: BlockInstance = {
    instanceId: blockTypeId,
    type: blockTypeId,
    order: newOrder,
    visible: true,
    state: { ...getDefaultBlockState(blockTypeId) },
  };

  return {
    ...appState,
    blocks: [...appState.blocks, newBlock],
  };
};

/**
 * Remove a block instance
 */
export const removeBlock = (appState: AppState, instanceId: string): AppState => {
  const updatedBlocks = appState.blocks.filter(b => b.instanceId !== instanceId);

  // Ensure at least one block remains
  if (updatedBlocks.length === 0) {
    console.warn('[Storage] Cannot remove last block');
    return appState;
  }

  return {
    ...appState,
    blocks: updatedBlocks,
  };
};

/**
 * Reorder blocks (move up or down)
 */
export const moveBlock = (
  appState: AppState,
  instanceId: string,
  direction: 'up' | 'down'
): AppState => {
  const blocks = [...appState.blocks].sort((a, b) => a.order - b.order);
  const currentIndex = blocks.findIndex(b => b.instanceId === instanceId);

  if (currentIndex === -1) return appState;

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (targetIndex < 0 || targetIndex >= blocks.length) {
    return appState; // Can't move beyond bounds
  }

  // Swap order values
  const temp = blocks[currentIndex].order;
  blocks[currentIndex].order = blocks[targetIndex].order;
  blocks[targetIndex].order = temp;

  return {
    ...appState,
    blocks,
  };
};
