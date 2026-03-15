/**
 * Block System Type Definitions
 *
 * This file contains all TypeScript interfaces and types for the modular block system.
 */

import { IconType } from 'react-icons';

/**
 * Block Category - Used to organize blocks in the UI
 */
export type BlockCategory = 'productivity' | 'music' | 'utility';

/**
 * BlockType - Definition of a block type in the registry
 * This represents the "blueprint" for a block, not an instance of it.
 */
export interface BlockType {
  /** Unique identifier for this block type (e.g., 'flowTimer') */
  id: string;

  /** Display name shown to users (e.g., 'Flow Timer') */
  name: string;

  /** Icon component from react-icons */
  icon: IconType;

  /** React component that renders this block */
  component: React.ComponentType<any>;

  /** Default state when creating a new instance of this block */
  defaultState: Record<string, any>;

  /** Category for organizing blocks */
  category: BlockCategory;

  /** Optional description shown in block picker */
  description?: string;
}

/**
 * BlockInstance - An active instance of a block in the user's workspace
 * This represents an actual block that the user has added and configured.
 */
export interface BlockInstance {
  /** Unique identifier for this specific instance (e.g., 'flow-timer') */
  instanceId: string;

  /** References the BlockType.id (e.g., 'flowTimer') */
  type: string;

  /** Display order in the grid (0 = first, 1 = second, etc.) */
  order: number;

  /** Whether this block is currently visible */
  visible: boolean;

  /** Instance-specific state (varies by block type) */
  state: Record<string, any>;
}

/**
 * AppState - Root application state
 * This is the top-level state that gets saved to localStorage and URL params.
 */
export interface AppState {
  /** Name of the current project */
  projectName: string;

  /** Array of active block instances */
  blocks: BlockInstance[];

  /** Current theme ('light' or 'dark') */
  theme: 'light' | 'dark';
}

/**
 * BlockProps - Standard props interface that all block components should accept
 * This ensures consistency across all blocks.
 */
export interface BlockProps<T = Record<string, any>> {
  /** Unique instance ID of this block */
  instanceId: string;

  /** Current state of this block instance */
  state: T;

  /** Callback to update this block's state */
  onStateChange: (newState: Partial<T>) => void;

  /** Optional callback when user wants to remove this block */
  onRemove?: () => void;

  /** Optional callback to move block up in order */
  onMoveUp?: () => void;

  /** Optional callback to move block down in order */
  onMoveDown?: () => void;

  /** Whether this is the first block (affects arrow buttons) */
  isFirst?: boolean;

  /** Whether this is the last block (affects arrow buttons) */
  isLast?: boolean;
}

/**
 * Block-specific state interfaces
 * These define the expected state structure for each block type.
 */

export interface FlowTimerState {
  time: number;
  isCounting: boolean;
}

export interface InspirationGeneratorState {
  rootEl: string;
  scaleEl: string;
  tonesEl: string;
  tonesArrEl: string[];
  bpmEl: string;
  soundEl: string;
}

export interface MetronomeState {
  bpm: number;
  isRunning: boolean;
  isMuted: boolean;
  timeSignature: string;
}

export interface NotesState {
  notes: string;
}

// Placeholder types for future blocks
export interface MusicStructureState {
  // To be defined when integrating from Claude Desktop artifact
  [key: string]: any;
}

export interface VarispeedState {
  bpm: number;
  keyIdx: number;
  linkedToGenerator?: boolean;
}

export interface ArrangementToolState {
  selectedTemplate: string;
}

export interface TunerState {
  isListening: boolean;
}
