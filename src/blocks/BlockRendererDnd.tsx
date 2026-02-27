/**
 * BlockRendererDnd Component
 *
 * Dynamically renders a block based on its type with drag-and-drop support.
 * This component is the bridge between the new block-based system
 * and the existing block components.
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import { BlockInstance } from './types';
import { getBlockComponent, getBlockType } from './blockRegistry';
import ToolCardDnd from '../components/common/ToolCardDnd';

// Special wrapper for Notes block to override centering from ToolCard
const NotesWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  text-align: left;
`;

// Special ToolCard for Notes that doesn't center its content
const NotesToolCard = styled(ToolCardDnd)`
  align-items: stretch;
  text-align: left;

  & > * {
    width: 100%;
  }
`;

interface BlockRendererDndProps {
  block: BlockInstance;
  onUpdateState: (instanceId: string, newState: Record<string, any>) => void;
  onRemove?: () => void;
  canRemove?: boolean;
  globalBpm?: string; // For BPM synchronization
  generatorRoot?: string; // For Varispeed linking
  dragHandleProps?: any; // Props for the drag handle
  isRecentlyDragged?: boolean; // Show controls after drag
}

/**
 * BlockRendererDnd - Renders a block instance with the appropriate component
 */
const BlockRendererDnd: React.FC<BlockRendererDndProps> = ({
  block,
  onUpdateState,
  onRemove,
  canRemove = true,
  globalBpm,
  generatorRoot,
  dragHandleProps,
  isRecentlyDragged = false,
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
    console.log('[BlockRenderer] Updating state for', block.type, ':', updates);
    onUpdateState(block.instanceId, updates);
  };

  // Blocks that already have their own ToolCard built in
  const blocksWithOwnToolCard = ['flowTimer', 'metronome'];
  const hasOwnToolCard = blocksWithOwnToolCard.includes(block.type);

  // Blocks that have their own header styling (don't need ToolCard wrapper)
  const blocksWithOwnHeader = ['inspirationGenerator', 'varispeed'];
  const hasOwnHeader = blocksWithOwnHeader.includes(block.type);

  // Render the block content
  let blockContent: React.ReactNode;

  switch (block.type) {
    case 'flowTimer':
      // PomodoroTimer has ToolCard built in, needs to be modified for drag handle
      blockContent = (
        <BlockComponent
          onRemove={onRemove}
          canRemove={canRemove}
          dragHandleProps={dragHandleProps}
          isRecentlyDragged={isRecentlyDragged}
        />
      );
      break;

    case 'inspirationGenerator':
      // InspirationGenerator expects individual state setters
      console.log('[BlockRenderer] Rendering InspirationGenerator with state:', block.state);
      blockContent = (
        <BlockComponent
          animate={animate}
          setAnimate={setAnimate}
          rootEl={block.state.rootEl || 'C'}
          setRootEl={(rootEl: string) => {
            console.log('[BlockRenderer] setRootEl called with:', rootEl);
            updateBlockState({ rootEl });
          }}
          scaleEl={block.state.scaleEl || 'Major'}
          setScaleEl={(scaleEl: string) => {
            console.log('[BlockRenderer] setScaleEl called with:', scaleEl);
            updateBlockState({ scaleEl });
          }}
          tonesEl={block.state.tonesEl || 'T - T - S - T - T - T - S'}
          setTonesEl={(tonesEl: string) => updateBlockState({ tonesEl })}
          tonesArrEl={block.state.tonesArrEl || ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C']}
          setTonesArrEl={(tonesArrEl: string[]) => updateBlockState({ tonesArrEl })}
          bpmEl={block.state.bpmEl || '100'}
          setBpmEl={(bpmEl: string) => updateBlockState({ bpmEl })}
          soundEl={block.state.soundEl || 'Electric Guitar'}
          setSoundEl={(soundEl: string) => updateBlockState({ soundEl })}
          onBatchUpdate={(updates: Record<string, any>) => updateBlockState(updates)}
          dragHandleProps={dragHandleProps}
          isRecentlyDragged={isRecentlyDragged}
        />
      );
      break;

    case 'metronome':
      // Metronome expects BPM as a number prop
      // Use globalBpm if provided (for synchronization), otherwise use block state
      const bpm = globalBpm ? parseInt(globalBpm, 10) : (block.state.bpm || 100);
      blockContent = (
        <BlockComponent
          bpm={bpm}
          onRemove={onRemove}
          canRemove={canRemove}
          dragHandleProps={dragHandleProps}
          isRecentlyDragged={isRecentlyDragged}
        />
      );
      break;

    case 'notes':
      // Notepad expects notes and setNotes
      blockContent = (
        <NotesWrapper>
          <BlockComponent
            notes={block.state.notes || ''}
            setNotes={(notes: string) => updateBlockState({ notes })}
          />
        </NotesWrapper>
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
          dragHandleProps={dragHandleProps}
          isRecentlyDragged={isRecentlyDragged}
        />
      );
      break;

    case 'arrangementTool':
      // ArrangementTool is self-contained, doesn't need state management
      blockContent = <BlockComponent />;
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
    // These need to be modified to support drag handles
    return <>{blockContent}</>;
  } else if (hasOwnHeader) {
    // Blocks with their own header styling (inspirationGenerator, notes)
    // Wrap with ToolCard but hide the header to avoid duplication
    // Use special NotesToolCard for Notes block to avoid centering
    const CardComponent = block.type === 'notes' ? NotesToolCard : ToolCardDnd;
    return (
      <CardComponent
        title=""
        icon={blockType.icon}
        onRemove={onRemove}
        canRemove={canRemove}
        hideHeader={true}
        showControlsOnly={false}
        dragHandleProps={dragHandleProps}
        isRecentlyDragged={isRecentlyDragged}
      >
        {blockContent}
      </CardComponent>
    );
  } else {
    // Standard blocks without any built-in styling
    // Wrap with ToolCard and add controls
    return (
      <ToolCardDnd
        title={blockType.name}
        icon={blockType.icon}
        onRemove={onRemove}
        canRemove={canRemove}
        dragHandleProps={dragHandleProps}
        isRecentlyDragged={isRecentlyDragged}
      >
        {blockContent}
      </ToolCardDnd>
    );
  }
};

export default BlockRendererDnd;