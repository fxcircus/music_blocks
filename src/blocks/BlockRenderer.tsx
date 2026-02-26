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
  generatorRoot?: string; // For Varispeed linking
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
  globalBpm,
  generatorRoot
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

  // Blocks that already have their own ToolCard built in
  const blocksWithOwnToolCard = ['flowTimer', 'metronome'];
  const hasOwnToolCard = blocksWithOwnToolCard.includes(block.type);

  // Blocks that have their own header styling (don't need ToolCard wrapper)
  const blocksWithOwnHeader = ['inspirationGenerator', 'notes', 'varispeed'];
  const hasOwnHeader = blocksWithOwnHeader.includes(block.type);

  // Render the block content
  let blockContent: React.ReactNode;

  switch (block.type) {
    case 'flowTimer':
      // PomodoroTimer has ToolCard built in, pass control props
      blockContent = (
        <BlockComponent
          onRemove={onRemove ? () => onRemove(block.instanceId) : undefined}
          onMoveUp={onMoveUp ? () => onMoveUp(block.instanceId) : undefined}
          onMoveDown={onMoveDown ? () => onMoveDown(block.instanceId) : undefined}
          canRemove={canRemove}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
        />
      );
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
          soundEl={block.state.soundEl || 'Electric Guitar'}
          setSoundEl={(soundEl: string) => updateBlockState({ soundEl })}
          onBatchUpdate={(updates: Record<string, any>) => updateBlockState(updates)}
        />
      );
      break;

    case 'metronome':
      // Metronome expects BPM as a number prop
      // Use globalBpm if provided (for synchronization), otherwise use block state
      const bpm = globalBpm ? parseInt(globalBpm, 10) : (block.state.bpm || 100);
      // It already has ToolCard built in, pass control props
      blockContent = (
        <BlockComponent
          bpm={bpm}
          onRemove={onRemove ? () => onRemove(block.instanceId) : undefined}
          onMoveUp={onMoveUp ? () => onMoveUp(block.instanceId) : undefined}
          onMoveDown={onMoveDown ? () => onMoveDown(block.instanceId) : undefined}
          canRemove={canRemove}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
        />
      );
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

    case 'varispeed':
      // Varispeed expects bpm and keyIdx with setters, plus linking props
      blockContent = (
        <BlockComponent
          bpm={block.state.bpm || 120}
          setBpm={(bpm: number) => updateBlockState({ bpm })}
          keyIdx={block.state.keyIdx || 0}
          setKeyIdx={(keyIdx: number) => updateBlockState({ keyIdx })}
          linkedToGenerator={block.state.linkedToGenerator || false}
          setLinkedToGenerator={(linked: boolean) => updateBlockState({ linkedToGenerator: linked })}
          generatorBpm={globalBpm}
          generatorRoot={generatorRoot}
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

  // Determine how to render the block based on its styling
  if (hasOwnToolCard) {
    // Blocks with built-in ToolCard (flowTimer, metronome)
    // Control props are passed directly to the component
    return <>{blockContent}</>;
  } else if (hasOwnHeader) {
    // Blocks with their own header styling (inspirationGenerator, notes)
    // Wrap with ToolCard but hide the header to avoid duplication
    return (
      <ToolCard
        title=""
        icon={blockType.icon}
        onRemove={onRemove ? () => onRemove(block.instanceId) : undefined}
        onMoveUp={onMoveUp ? () => onMoveUp(block.instanceId) : undefined}
        onMoveDown={onMoveDown ? () => onMoveDown(block.instanceId) : undefined}
        canRemove={canRemove}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        hideHeader={true}
      >
        {blockContent}
      </ToolCard>
    );
  } else {
    // Standard blocks without any built-in styling
    // Wrap with ToolCard and add controls
    return (
      <ToolCard
        title={blockType.name}
        icon={blockType.icon}
        onRemove={onRemove ? () => onRemove(block.instanceId) : undefined}
        onMoveUp={onMoveUp ? () => onMoveUp(block.instanceId) : undefined}
        onMoveDown={onMoveDown ? () => onMoveDown(block.instanceId) : undefined}
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
