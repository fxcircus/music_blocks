import React, { FC, useState, useEffect } from "react";
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Container } from '../../components/common/StyledComponents';
import { decodeURLToAppState, hasStateParams } from "../../utils/urlSharing";
import { AppState, BlockInstance } from "../../blocks/types";
import { getAllBlockTypes } from "../../blocks/blockRegistry";
import { loadBlockState, saveBlockState, updateBlockState as updateBlockStateUtil, removeBlock, addBlock } from "../../utils/blockStorage";
import BlockRenderer from "../../blocks/BlockRendererDnd";
import BlockPicker from "../../components/BlockPicker/BlockPicker";
import { Button } from '../../components/common/StyledComponents';
import { Icon } from '../../utils/IconHelper';
import { FaPlus } from 'react-icons/fa';

// @dnd-kit imports
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface LoaderProps {
    result?: string;
}

const PageContainer = styled(Container)`
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.md} ${theme.spacing.xxl}`};

  @media (max-width: 768px) {
    padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.sm} ${theme.spacing.xl}`};
  }
`;

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.sm};
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

const AddBlockButton = styled(Button)`
  position: fixed;
  bottom: ${({ theme }) => theme.spacing.xl};
  right: ${({ theme }) => theme.spacing.xl};
  width: 60px;
  height: 60px;
  border-radius: ${({ theme }) => theme.borderRadius.round};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${({ theme }) => theme.shadows.large};
  z-index: 100;

  @media (max-width: 768px) {
    bottom: ${({ theme }) => theme.spacing.md};
    right: ${({ theme }) => theme.spacing.md};
    width: 50px;
    height: 50px;
  }
`;

// Styled component for sortable item wrapper
const SortableItemWrapper = styled(motion.div)<{ $isDragging: boolean; $isOverlay?: boolean }>`
  height: 100%;
  display: flex;
  position: relative;
  opacity: ${({ $isDragging, $isOverlay }) => $isOverlay ? 1 : $isDragging ? 0.5 : 1};
  cursor: ${({ $isDragging }) => $isDragging ? 'grabbing' : 'default'};

  & > * {
    flex: 1;
    width: 100%;
    margin-top: ${({ theme }) => theme.spacing.md};

    @media (max-width: 768px) {
      margin-top: ${({ theme }) => theme.spacing.md};
    }
  }
`;

// Drop indicator line
const DropIndicator = styled.div<{ $isActive: boolean }>`
  position: absolute;
  top: -8px;
  left: 0;
  right: 0;
  height: 3px;
  background: ${({ theme, $isActive }) => $isActive ? theme.colors.primary : 'transparent'};
  border-radius: 2px;
  transition: all 0.2s ease;
  pointer-events: none;
  z-index: 10;

  &::before {
    content: '';
    position: absolute;
    left: 50%;
    top: -6px;
    transform: translateX(-50%);
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${({ theme, $isActive }) => $isActive ? theme.colors.primary : 'transparent'};
    transition: all 0.2s ease;
  }
`;

// Sortable Block Item Component
interface SortableBlockItemProps {
  block: BlockInstance;
  onUpdateState: (instanceId: string, newState: Record<string, any>) => void;
  onRemove?: () => void;
  canRemove: boolean;
  globalBpm: string;
  globalTimeSignature: string;
  generatorRoot: string;
  activeId: string | null;
  isRecentlyDragged: boolean;
}

const SortableBlockItem: FC<SortableBlockItemProps> = ({
  block,
  onUpdateState,
  onRemove,
  canRemove,
  globalBpm,
  globalTimeSignature,
  generatorRoot,
  activeId,
  isRecentlyDragged,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.instanceId,
    disabled: false,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isActive = activeId === block.instanceId;

  return (
    <SortableItemWrapper
      ref={setNodeRef}
      style={style}
      $isDragging={isDragging}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <DropIndicator $isActive={isActive} />
      <BlockRenderer
        block={block}
        onUpdateState={onUpdateState}
        onRemove={onRemove}
        canRemove={canRemove}
        globalBpm={globalBpm}
        globalTimeSignature={globalTimeSignature}
        generatorRoot={generatorRoot}
        dragHandleProps={{
          ref: setActivatorNodeRef,
          ...attributes,
          ...listeners,
        }}
        isRecentlyDragged={isRecentlyDragged}
      />
    </SortableItemWrapper>
  );
};

const CurrentProject: FC<LoaderProps> = () => {
    // Load block-based state (with automatic migration from old format)
    const [blockState, setBlockState] = useState<AppState>(() => {
        console.log('[CurrentProject] Component mounting, loading initial state');
        return loadBlockState();
    });
    const [showBlockPicker, setShowBlockPicker] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [recentlyDraggedIds, setRecentlyDraggedIds] = useState<Set<string>>(new Set());

    // Configure sensors for drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Helper to get a specific block's state
    const getBlockState = (instanceId: string): any => {
        const block = blockState.blocks.find(b => b.instanceId === instanceId);
        return block?.state || {};
    };

    const inspirationState = getBlockState('inspirationGenerator');

    // Check for URL parameters on mount — supports new compressed format and legacy format
    useEffect(() => {
        if (!hasStateParams(window.location.href)) return;

        const decoded = decodeURLToAppState(window.location.href);

        if (decoded.appState?.blocks) {
            // New format: full block state from compressed URL
            setBlockState(prevState => {
                let updatedBlockState = { ...prevState };

                // Merge each shared block into the current state
                for (const sharedBlock of decoded.appState!.blocks!) {
                    const existing = updatedBlockState.blocks.find(b => b.type === sharedBlock.type);
                    if (existing) {
                        // Update existing block's state and order
                        updatedBlockState = updateBlockStateUtil(updatedBlockState, existing.instanceId, sharedBlock.state);
                        updatedBlockState = {
                            ...updatedBlockState,
                            blocks: updatedBlockState.blocks.map(b =>
                                b.instanceId === existing.instanceId
                                    ? { ...b, order: sharedBlock.order, visible: true }
                                    : b
                            ),
                        };
                    }
                }

                // Update chord progression
                if (decoded.progression !== undefined) {
                    localStorage.setItem('tilesProgression', String(decoded.progression));
                }

                // Sync arrangement template to localStorage for legacy readers
                const arrangementBlock = decoded.appState!.blocks!.find(b => b.type === 'arrangementTool');
                if (arrangementBlock?.state?.selectedTemplate) {
                    localStorage.setItem('tilesTemplate', arrangementBlock.state.selectedTemplate);
                }

                saveBlockState(updatedBlockState);
                window.dispatchEvent(new Event('urlStateApplied'));
                return updatedBlockState;
            });
        } else if (decoded.legacyState && Object.keys(decoded.legacyState).length > 0) {
            // Legacy format: individual params (backward compat)
            const urlState = decoded.legacyState;
            setBlockState(prevState => {
                let updatedBlockState = prevState;

                updatedBlockState = updateBlockStateUtil(updatedBlockState, 'inspirationGenerator', {
                    rootEl: urlState.rootEl,
                    scaleEl: urlState.scaleEl,
                    tonesEl: urlState.tonesEl,
                    tonesArrEl: urlState.tonesArrEl,
                    bpmEl: urlState.bpmEl,
                    soundEl: urlState.soundEl,
                });

                if (urlState.notes !== undefined) {
                    updatedBlockState = updateBlockStateUtil(updatedBlockState, 'notes', {
                        notes: urlState.notes,
                    });
                }

                if (urlState.bpmEl) {
                    updatedBlockState = updateBlockStateUtil(updatedBlockState, 'metronome', {
                        bpm: parseInt(urlState.bpmEl, 10),
                    });
                }

                if (urlState.template) {
                    updatedBlockState = updateBlockStateUtil(updatedBlockState, 'arrangementTool', {
                        selectedTemplate: urlState.template,
                    });
                    localStorage.setItem('tilesTemplate', urlState.template);
                }

                if (decoded.progression !== undefined) {
                    localStorage.setItem('tilesProgression', String(decoded.progression));
                }

                saveBlockState(updatedBlockState);
                window.dispatchEvent(new Event('urlStateApplied'));
                return updatedBlockState;
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount

    // Handler for block state updates from BlockRenderer
    const handleBlockStateUpdate = (instanceId: string, newState: Record<string, any>) => {
        console.log('[CurrentProject] Received state update for', instanceId, ':', newState);
        const updatedBlockState = updateBlockStateUtil(blockState, instanceId, newState);
        console.log('[CurrentProject] Updated block state:', updatedBlockState);
        setBlockState(updatedBlockState);
        saveBlockState(updatedBlockState);
    };

    // Handler for removing a block
    const handleRemoveBlock = (instanceId: string) => {
        const updatedBlockState = removeBlock(blockState, instanceId);
        setBlockState(updatedBlockState);
        saveBlockState(updatedBlockState);
    };

    // Handler for adding a new block
    const handleAddBlock = (blockTypeId: string) => {
        const updatedBlockState = addBlock(blockState, blockTypeId);
        setBlockState(updatedBlockState);
        saveBlockState(updatedBlockState);
    };

    // Get visible blocks sorted by order
    const visibleBlocks = blockState.blocks
        .filter(block => block.visible)
        .sort((a, b) => a.order - b.order);

    // Get list of active block types (for BlockPicker)
    const activeBlockTypes = visibleBlocks.map(block => block.type);

    // Get global values for synchronization
    const globalBpm = inspirationState.bpmEl;
    const globalTimeSignature = inspirationState.timeSignatureEl || '4/4';
    const generatorRoot = inspirationState.rootEl;

    // Drag and drop handlers
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = visibleBlocks.findIndex(block => block.instanceId === active.id);
            const newIndex = visibleBlocks.findIndex(block => block.instanceId === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const reorderedBlocks = arrayMove(visibleBlocks, oldIndex, newIndex);

                // Update order values
                const updatedBlocks = blockState.blocks.map(block => {
                    const reorderedBlock = reorderedBlocks.find(b => b.instanceId === block.instanceId);
                    if (reorderedBlock) {
                        const newOrder = reorderedBlocks.indexOf(reorderedBlock);
                        return { ...block, order: newOrder };
                    }
                    return block;
                });

                const updatedBlockState = {
                    ...blockState,
                    blocks: updatedBlocks,
                };

                setBlockState(updatedBlockState);
                saveBlockState(updatedBlockState);

                // Mark the block as recently dragged
                setRecentlyDraggedIds(prev => new Set(prev).add(active.id as string));

                // Clear the recently dragged state after a delay
                setTimeout(() => {
                    setRecentlyDraggedIds(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(active.id as string);
                        return newSet;
                    });
                }, 2000);
            }
        }

        setActiveId(null);
    };

    // Find the active block for overlay
    const activeBlock = activeId ? visibleBlocks.find(b => b.instanceId === activeId) : null;

    return (
        <>
            <PageContainer>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={visibleBlocks.map(block => block.instanceId)}
                        strategy={verticalListSortingStrategy}
                    >
                        <TwoColumnGrid>
                            {visibleBlocks.map((block) => (
                                <SortableBlockItem
                                    key={block.instanceId}
                                    block={block}
                                    onUpdateState={handleBlockStateUpdate}
                                    onRemove={visibleBlocks.length > 1 ? () => handleRemoveBlock(block.instanceId) : undefined}
                                    canRemove={visibleBlocks.length > 1}
                                    globalBpm={globalBpm}
                                    globalTimeSignature={globalTimeSignature}
                                    generatorRoot={generatorRoot}
                                    activeId={activeId}
                                    isRecentlyDragged={recentlyDraggedIds.has(block.instanceId)}
                                />
                            ))}
                        </TwoColumnGrid>
                    </SortableContext>

                    <DragOverlay>
                        {activeBlock && (
                            <SortableItemWrapper $isDragging={false} $isOverlay={true}>
                                <BlockRenderer
                                    block={activeBlock}
                                    onUpdateState={() => {}}
                                    canRemove={false}
                                    globalBpm={globalBpm}
                                    globalTimeSignature={globalTimeSignature}
                                    generatorRoot={generatorRoot}
                                />
                            </SortableItemWrapper>
                        )}
                    </DragOverlay>
                </DndContext>
            </PageContainer>

            {/* Add Block Button - Only show if there are blocks available to add */}
            {activeBlockTypes.length < getAllBlockTypes().length && (
                <AddBlockButton
                    onClick={() => setShowBlockPicker(true)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Add block"
                >
                    <Icon icon={FaPlus} size={24} />
                </AddBlockButton>
            )}

            {/* Block Picker Modal */}
            <BlockPicker
                isOpen={showBlockPicker}
                onClose={() => setShowBlockPicker(false)}
                onSelectBlock={handleAddBlock}
                activeBlockTypes={activeBlockTypes}
            />
        </>
    );
}

export default CurrentProject;