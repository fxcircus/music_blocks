/**
 * BlockRenderer Component
 *
 * Dynamically renders a block based on its type.
 * This component is the bridge between the new block-based system
 * and the existing block components.
 */

import React, { useState } from 'react';
import { BlockInstance } from './types';
import { getBlockComponent, getBlockType } from './blockRegistry';
import ToolCard from '../components/common/ToolCard';

interface BlockRendererProps {
  block: BlockInstance;
  onUpdateState: (instanceId: string, newState: Record<string, any>) => void;
  onRemove?: (instanceId: string) => void;
  onMoveUp?: (instanceId: string) => void;
  onMoveDown?: (instanceId: string) => void;
  canRemove?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  globalBpm?: string; // For BPM synchronization
}

/**
 * BlockRenderer - Renders a block instance with the appropriate component
 */
const BlockRenderer: React.FC<BlockRendererProps> = ({
  block,
  onUpdateState,
  onRemove,
  onMoveUp,
  onMoveDown,
  canRemove = true,
  canMoveUp = true,
  canMoveDown = true,
  globalBpm
}) => {
  const [animate, setAnimate] = useState(false);

  // Get the component and type info for this block
  const BlockComponent = getBlockComponent(block.type);
  const blockType = getBlockType(block.type);

  if (!BlockComponent || !blockType) {
    console.error(`[BlockRenderer] No component found for block type: ${block.type}`);
    return (
      <div style={{ padding: '20px', border: '2px dashed red' }}>
        <p>Error: Unknown block type "{block.type}"</p>
      </div>
    );
  }

  // Helper to update block state
  const updateBlockState = (updates: Record<string, any>) => {
    onUpdateState(block.instanceId, updates);
  };

  // Blocks that already use ToolCard internally
  const blocksWithToolCard = ['flowTimer', 'metronome'];
  const hasToolCard = blocksWithToolCard.includes(block.type);

  // Render the block content
  let blockContent: React.ReactNode;

  switch (block.type) {
    case 'flowTimer':
      // PomodoroTimer doesn't need any props (manages its own state internally)
      // It already has ToolCard built in
      blockContent = <BlockComponent />;
      break;

    case 'inspirationGenerator':
      // InspirationGenerator expects individual state setters
      blockContent = (
        <BlockComponent
          animate={animate}
          setAnimate={setAnimate}
          rootEl={block.state.rootEl || 'C'}
          setRootEl={(rootEl: string) => updateBlockState({ rootEl })}
          scaleEl={block.state.scaleEl || 'Major'}
          setScaleEl={(scaleEl: string) => updateBlockState({ scaleEl })}
          tonesEl={block.state.tonesEl || 'T - T - S - T - T - T - S'}
          setTonesEl={(tonesEl: string) => updateBlockState({ tonesEl })}
          tonesArrEl={block.state.tonesArrEl || ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C']}
          setTonesArrEl={(tonesArrEl: string[]) => updateBlockState({ tonesArrEl })}
          bpmEl={block.state.bpmEl || '100'}
          setBpmEl={(bpmEl: string) => updateBlockState({ bpmEl })}
          soundEl={block.state.soundEl || 'Guitar'}
          setSoundEl={(soundEl: string) => updateBlockState({ soundEl })}
        />
      );
      break;

    case 'metronome':
      // Metronome expects BPM as a number prop
      // Use globalBpm if provided (for synchronization), otherwise use block state
      const bpm = globalBpm ? parseInt(globalBpm, 10) : (block.state.bpm || 100);
      // It already has ToolCard built in
      blockContent = <BlockComponent bpm={bpm} />;
      break;

    case 'notes':
      // Notepad expects notes and setNotes
      blockContent = (
        <BlockComponent
          notes={block.state.notes || ''}
          setNotes={(notes: string) => updateBlockState({ notes })}
        />
      );
      break;

    default:
      console.warn(`[BlockRenderer] Unknown block type: ${block.type}`);
      blockContent = (
        <div style={{ padding: '20px', border: '2px dashed orange' }}>
          <p>Warning: Block type "{block.type}" not yet implemented in renderer</p>
        </div>
      );
  }

  // If the block already has ToolCard, just add the control props via a wrapper div
  // Otherwise, wrap it with ToolCard
  if (hasToolCard) {
    // For blocks with built-in ToolCard, we need to clone and pass props
    // This is a bit tricky, so for now we'll just return them as-is
    // TODO: Update PomodoroTimer and Metronome to accept control props
    return <>{blockContent}</>;
  } else {
    // Wrap blocks without ToolCard
    return (
      <ToolCard
        title={blockType.name}
        icon={blockType.icon}
        onRemove={onRemove}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        canRemove={canRemove}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
      >
        {blockContent}
      </ToolCard>
    );
  }
};

export default BlockRenderer;
