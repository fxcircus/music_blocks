/**
 * BlockRendererDnd Component
 *
 * Dynamically renders a block based on its type with drag-and-drop support.
 * This component is the bridge between the new block-based system
 * and the existing block components.
 */

import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { FaDice, FaList } from 'react-icons/fa';
import { BlockInstance } from './types';
import { getBlockComponent, getBlockType } from './blockRegistry';
import ToolCardDnd from '../components/common/ToolCardDnd';
import TipsModal from '../components/common/TipsModal';
import { Icon } from '../utils/IconHelper';

/* Segmented toggle for dice/table mode */
const ModeToggleContainer = styled.div`
  display: flex;
  align-items: center;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  padding: 2px;
  margin-left: 8px;
`;

const ModeToggleBtn = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${({ $active, theme }) => $active ? theme.colors.primary + '22' : 'transparent'};
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.textSecondary};

  &:hover {
    background: ${({ $active, theme }) => $active ? theme.colors.primary + '33' : theme.colors.border};
  }
`;

// Special wrapper for Notes block to override centering from ToolCard
const NotesWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  text-align: left;
  flex: 1;
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
  globalTimeSignature?: string; // For time signature synchronization
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
  globalTimeSignature,
  generatorRoot,
  dragHandleProps,
  isRecentlyDragged = false,
}) => {
  const [animate, setAnimate] = useState(false);
  const [showArrangementHelp, setShowArrangementHelp] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [diceMode, setDiceMode] = useState<boolean>(() => localStorage.getItem('tilesDiceMode') === 'true');

  const handleSetDiceMode = useCallback((val: boolean) => {
    setDiceMode(val);
    localStorage.setItem('tilesDiceMode', String(val));
  }, []);

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
  const blocksWithOwnHeader: string[] = [];
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
          timeSignatureEl={block.state.timeSignatureEl || '4/4'}
          setTimeSignatureEl={(ts: string) => updateBlockState({ timeSignatureEl: ts })}
          soundEl={block.state.soundEl || 'Electric Guitar'}
          setSoundEl={(soundEl: string) => updateBlockState({ soundEl })}
          onBatchUpdate={(updates: Record<string, any>) => updateBlockState(updates)}
          showTips={showTips}
          setShowTips={setShowTips}
          diceMode={diceMode}
          setDiceMode={handleSetDiceMode}
        />
      );
      break;

    case 'metronome':
      // Metronome expects BPM as a number prop
      // Use globalBpm if provided (for synchronization), otherwise use block state
      const bpm = globalBpm ? parseInt(globalBpm, 10) : (block.state.bpm || 100);
      const timeSignature = globalTimeSignature || block.state.timeSignature || '4/4';
      blockContent = (
        <BlockComponent
          bpm={bpm}
          timeSignature={timeSignature}
          onRemove={onRemove}
          canRemove={canRemove}
          dragHandleProps={dragHandleProps}
          isRecentlyDragged={isRecentlyDragged}
        />
      );
      break;

    case 'notes':
      // Notepad expects notes and setNotes, plus tips modal state
      blockContent = (
        <NotesWrapper>
          <BlockComponent
            notes={block.state.notes || ''}
            setNotes={(notes: string) => updateBlockState({ notes })}
            showTips={showTips}
            setShowTips={setShowTips}
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
          linkedToGenerator={block.state.linkedToGenerator !== undefined ? block.state.linkedToGenerator : true}
          setLinkedToGenerator={(linked: boolean) => updateBlockState({ linkedToGenerator: linked })}
          generatorBpm={globalBpm}
          generatorRoot={generatorRoot}
          showTips={showTips}
          setShowTips={setShowTips}
        />
      );
      break;

    case 'arrangementTool':
      // ArrangementTool with help modal support
      blockContent = (
        <>
          <BlockComponent />
          {/* Render the TipsModal here since ToolCardDnd will trigger it */}
          <TipsModal
            isOpen={showArrangementHelp}
            onClose={() => setShowArrangementHelp(false)}
            title="Arrangement Guide"
            content={
              <>
                <p>
                  Break out of the 4-bar loop trap. Each template represents an arrangement approach used by famous artists across genres.
                </p>

                <h3>Reading the visualization</h3>
                <ul>
                  <li><strong>Width</strong> = number of bars (duration)</li>
                  <li><strong>Height</strong> = energy level (intensity)</li>
                  <li>The overall silhouette reads as the song's energy arc</li>
                  <li>Hover any block for full section details</li>
                </ul>

                <h3>Energy levels</h3>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {([
                    { level: 4, label: 'Peak', height: '40px', color: '#D14545' },
                    { level: 3, label: 'High', height: '30px', color: '#E08A3A' },
                    { level: 2, label: 'Medium', height: '20px', color: '#C4B236' },
                    { level: 1, label: 'Low', height: '12px', color: '#3A7BBF' },
                  ] as const).map(({ level, label, height, color }) => (
                    <div key={level} style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
                      <div style={{
                        width: '24px',
                        height,
                        background: color,
                        borderRadius: '3px',
                        opacity: 0.45 + (level / 4) * 0.5,
                      }} />
                      <span style={{ fontSize: '12px', lineHeight: 1 }}>{label}</span>
                    </div>
                  ))}
                </div>

                <h3>Section codes</h3>
                <p>Narrow blocks show abbreviated labels:</p>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid currentColor', opacity: 0.3 }}>Code</th>
                      <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid currentColor', opacity: 0.3 }}>Section type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['V', 'Verse'],
                      ['C', 'Chorus / Refrain'],
                      ['I', 'Intro'],
                      ['O', 'Outro'],
                      ['Br', 'Bridge'],
                      ['S', 'Solo'],
                      ['H', 'Hook'],
                      ['D', 'Drop'],
                      ['Bl', 'Build'],
                      ['Bk', 'Break / Breakdown'],
                      ['P', 'Peak / Climax'],
                    ].map(([code, name]) => (
                      <tr key={code}>
                        <td style={{ padding: '3px 8px', fontWeight: 600 }}><code>{code}</code></td>
                        <td style={{ padding: '3px 8px' }}>{name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ fontSize: '11px', marginTop: '6px' }}>
                  Numbers are appended for repeated sections: <code>V1</code>, <code>V2</code>, <code>C2</code>, etc.
                </p>

                <h3>Tips</h3>
                <ul>
                  <li>Use the <strong>dice button</strong> to quickly explore different arrangement ideas</li>
                  <li>Templates are starting points — modify bar counts and energy to fit your song</li>
                  <li>Notice how energy builds and releases throughout successful arrangements</li>
                  <li>When you have a good loop, use these structures to imagine how it could work as a verse, chorus, or bridge</li>
                </ul>
              </>
            }
          />
        </>
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
        onShowHelp={(block.type === 'inspirationGenerator' || block.type === 'varispeed') ? () => setShowTips(true) : undefined}
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
        onShowHelp={block.type === 'arrangementTool' ? () => setShowArrangementHelp(true) : (block.type === 'notes' || block.type === 'inspirationGenerator' || block.type === 'varispeed') ? () => setShowTips(true) : undefined}
        alignTop={block.type === 'inspirationGenerator'}
        titleExtra={block.type === 'inspirationGenerator' ? (
          <ModeToggleContainer>
            <ModeToggleBtn
              $active={!diceMode}
              onClick={() => handleSetDiceMode(false)}
              title="Table view"
            >
              <Icon icon={FaList} size={11} />
            </ModeToggleBtn>
            <ModeToggleBtn
              $active={diceMode}
              onClick={() => handleSetDiceMode(true)}
              title="Dice view"
            >
              <Icon icon={FaDice} size={12} />
            </ModeToggleBtn>
          </ModeToggleContainer>
        ) : undefined}
      >
        {blockContent}
      </ToolCardDnd>
    );
  }
};

export default BlockRendererDnd;