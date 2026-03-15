/**
 * Block Registry
 *
 * Central registry of all available block types.
 * This is the single source of truth for which blocks exist in the application.
 */

import { BlockType } from './types';

// Import block components
import PomodoroTimer from '../components/pomodoroTimer/pomodoroTimer';
import InspirationGenerator from '../components/inspirationGenerator/inspirationGenerator';
import Metronome from '../components/Metronome/Metronome';
import Notepad from '../components/Notepad/Notepad';
import Varispeed from '../components/Varispeed';
import ArrangementTool from '../components/ArrangementTool/ArrangementTool';

// Import icons
import { GiTomato, GiMetronome } from 'react-icons/gi';
import { FaWaveSquare, FaChartBar } from 'react-icons/fa';
import { IoMdDocument } from 'react-icons/io';
import { MdAutoAwesome } from 'react-icons/md';

/**
 * Block Registry - Array of all available block types
 *
 * Each entry defines:
 * - id: Unique identifier (camelCase)
 * - name: Display name for users
 * - icon: React icon component
 * - component: The React component to render
 * - defaultState: Initial state for new instances
 * - category: Grouping category
 * - description: Optional help text
 */
export const BLOCK_REGISTRY: BlockType[] = [
  {
    id: 'flowTimer',
    name: 'Flow',
    icon: GiTomato,
    component: PomodoroTimer,
    defaultState: {
      time: 1500, // 25 minutes in seconds
      isCounting: false,
    },
    category: 'productivity',
    description: 'Pomodoro-style timer to help you stay focused',
  },
  {
    id: 'inspirationGenerator',
    name: 'Generator',
    icon: MdAutoAwesome,
    component: InspirationGenerator,
    defaultState: {
      rootEl: 'C',
      scaleEl: 'Major',
      tonesEl: 'T - T - S - T - T - T - S',
      tonesArrEl: ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'],
      bpmEl: '100',
      timeSignatureEl: '4/4',
      soundEl: 'Electric Guitar',
    },
    category: 'music',
    description: 'Generate random musical ideas and parameters',
  },
  {
    id: 'metronome',
    name: 'Metronome',
    icon: GiMetronome,
    component: Metronome,
    defaultState: {
      bpm: 100,
      isRunning: false,
      isMuted: false,
      timeSignature: '4/4',
    },
    category: 'music',
    description: 'Audio-visual metronome synced with BPM',
  },
  {
    id: 'notes',
    name: 'Notes',
    icon: IoMdDocument,
    component: Notepad,
    defaultState: {
      notes: '',
    },
    category: 'utility',
    description: 'Write down lyrics, ideas, and thoughts',
  },
  {
    id: 'varispeed',
    name: 'Varispeed',
    icon: FaWaveSquare,
    component: Varispeed,
    defaultState: {
      bpm: 120,
      keyIdx: 0,
      linkedToGenerator: true, // Default to linked
    },
    category: 'music',
    description: 'Calculate pitch and tempo changes for varispeed effects',
  },
  {
    id: 'arrangementTool',
    name: 'Arrangement',
    icon: FaChartBar,
    component: ArrangementTool,
    defaultState: {
      selectedTemplate: 'Two Peaks',
    },
    category: 'music',
    description: 'Song structure templates and arrangement patterns',
  },
];

/**
 * Get a block type definition by its ID
 * @param blockTypeId - The unique ID of the block type (e.g., 'flowTimer')
 * @returns The BlockType definition, or undefined if not found
 */
export function getBlockType(blockTypeId: string): BlockType | undefined {
  return BLOCK_REGISTRY.find((blockType) => blockType.id === blockTypeId);
}

/**
 * Get all registered block types
 * @returns Array of all BlockType definitions
 */
export function getAllBlockTypes(): BlockType[] {
  return [...BLOCK_REGISTRY];
}

/**
 * Get block types by category
 * @param category - The category to filter by
 * @returns Array of BlockType definitions in that category
 */
export function getBlockTypesByCategory(category: string): BlockType[] {
  return BLOCK_REGISTRY.filter((blockType) => blockType.category === category);
}

/**
 * Get the React component for a given block type ID
 * @param blockTypeId - The unique ID of the block type
 * @returns The React component, or undefined if not found
 */
export function getBlockComponent(blockTypeId: string): React.ComponentType<any> | undefined {
  const blockType = getBlockType(blockTypeId);
  return blockType?.component;
}

/**
 * Get the default state for a given block type ID
 * @param blockTypeId - The unique ID of the block type
 * @returns The default state object, or empty object if not found
 */
export function getDefaultBlockState(blockTypeId: string): Record<string, any> {
  const blockType = getBlockType(blockTypeId);
  return blockType?.defaultState || {};
}

/**
 * Check if a block type exists in the registry
 * @param blockTypeId - The unique ID to check
 * @returns True if the block type exists, false otherwise
 */
export function blockTypeExists(blockTypeId: string): boolean {
  return BLOCK_REGISTRY.some((blockType) => blockType.id === blockTypeId);
}

/**
 * Get all block type IDs
 * @returns Array of all block type IDs
 */
export function getAllBlockTypeIds(): string[] {
  return BLOCK_REGISTRY.map((blockType) => blockType.id);
}
