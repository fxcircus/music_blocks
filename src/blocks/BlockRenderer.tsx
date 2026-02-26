/**
 * BlockRenderer Component
 *
 * Dynamically renders a block based on its type.
 * This component is the bridge between the new block-based system
 * and the existing block components.
 */

import React, { useState } from 'react';
import { BlockInstance } from './types';
import { getBlockComponent } from './blockRegistry';

interface BlockRendererProps {
  block: BlockInstance;
  onUpdateState: (instanceId: string, newState: Record<string, any>) => void;
  globalBpm?: string; // For BPM synchronization
}

/**
 * BlockRenderer - Renders a block instance with the appropriate component
 */
const BlockRenderer: React.FC<BlockRendererProps> = ({ block, onUpdateState, globalBpm }) => {
  const [animate, setAnimate] = useState(false);

  // Get the component for this block type
  const BlockComponent = getBlockComponent(block.type);

  if (!BlockComponent) {
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

  // Render the appropriate block component with mapped props
  switch (block.type) {
    case 'flowTimer':
      // PomodoroTimer doesn't need any props (manages its own state internally)
      return <BlockComponent />;

    case 'inspirationGenerator':
      // InspirationGenerator expects individual state setters
      return (
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

    case 'metronome':
      // Metronome expects BPM as a number prop
      // Use globalBpm if provided (for synchronization), otherwise use block state
      const bpm = globalBpm ? parseInt(globalBpm, 10) : (block.state.bpm || 100);
      return <BlockComponent bpm={bpm} />;

    case 'notes':
      // Notepad expects notes and setNotes
      return (
        <BlockComponent
          notes={block.state.notes || ''}
          setNotes={(notes: string) => updateBlockState({ notes })}
        />
      );

    default:
      console.warn(`[BlockRenderer] Unknown block type: ${block.type}`);
      return (
        <div style={{ padding: '20px', border: '2px dashed orange' }}>
          <p>Warning: Block type "{block.type}" not yet implemented in renderer</p>
        </div>
      );
  }
};

export default BlockRenderer;
