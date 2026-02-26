/**
 * Blocks Module - Public API
 *
 * This file exports all public interfaces and functions from the blocks module.
 * Use this for imports: import { BlockType, getBlockType } from '@/blocks';
 */

// Export all types
export * from './types';

// Export registry and functions
export {
  BLOCK_REGISTRY,
  getBlockType,
  getAllBlockTypes,
  getBlockTypesByCategory,
  getBlockComponent,
  getDefaultBlockState,
  blockTypeExists,
  getAllBlockTypeIds,
} from './blockRegistry';
