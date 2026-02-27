import React, { FC, useState, useEffect } from "react";
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Container } from '../../components/common/StyledComponents';
import { decodeURLToState, hasStateParams } from "../../utils/urlSharing";
import { AppState } from "../../blocks/types";
import { getAllBlockTypes } from "../../blocks/blockRegistry";
import { loadBlockState, saveBlockState, updateBlockState as updateBlockStateUtil, removeBlock, moveBlock, addBlock } from "../../utils/blockStorage";
import BlockRenderer from "../../blocks/BlockRenderer";
import BlockPicker from "../../components/BlockPicker/BlockPicker";
import { Button } from '../../components/common/StyledComponents';
import { Icon } from '../../utils/IconHelper';
import { FaPlus } from 'react-icons/fa';

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
    gap: ${({ theme }) => theme.spacing.xs};
  }
`;

const GridItem = styled(motion.div)<{ $order?: number, $desktopOrder?: number }>`
  height: 100%;
  display: flex;
  
  & > * {
    flex: 1;
    width: 100%;
    margin-top: ${({ theme }) => theme.spacing.md};
    
    @media (max-width: 768px) {
      margin-top: ${({ theme }) => theme.spacing.sm};
    }
  }
  
  @media (min-width: 1025px) {
    order: ${({ $desktopOrder }) => $desktopOrder !== undefined ? $desktopOrder : 'initial'};
  }
  
  @media (max-width: 1024px) {
    order: ${({ $order }) => $order || 0};
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

const CurrentProject: FC<LoaderProps> = () => {
    // Load block-based state (with automatic migration from old format)
    const [blockState, setBlockState] = useState<AppState>(loadBlockState());
    const [showBlockPicker, setShowBlockPicker] = useState(false);

    // Helper to get a specific block's state
    const getBlockState = (instanceId: string): any => {
        const block = blockState.blocks.find(b => b.instanceId === instanceId);
        return block?.state || {};
    };

    const inspirationState = getBlockState('inspirationGenerator');

    // Check for URL parameters on mount (keep old URL format support for now)
    useEffect(() => {
        if (hasStateParams(window.location.href)) {
            const urlState = decodeURLToState(window.location.href);

            // If URL has valid state parameters, update state with them
            if (Object.keys(urlState).length > 0) {
                // Convert old URL state to block updates
                setBlockState(prevState => {
                    let updatedBlockState = prevState;

                    // Update inspiration generator state
                    updatedBlockState = updateBlockStateUtil(updatedBlockState, 'inspirationGenerator', {
                        rootEl: urlState.rootEl,
                        scaleEl: urlState.scaleEl,
                        tonesEl: urlState.tonesEl,
                        tonesArrEl: urlState.tonesArrEl,
                        bpmEl: urlState.bpmEl,
                        soundEl: urlState.soundEl,
                    });

                    // Update notes state
                    if (urlState.notes !== undefined) {
                        updatedBlockState = updateBlockStateUtil(updatedBlockState, 'notes', {
                            notes: urlState.notes,
                        });
                    }

                    // Update metronome state
                    if (urlState.bpmEl) {
                        updatedBlockState = updateBlockStateUtil(updatedBlockState, 'metronome', {
                            bpm: parseInt(urlState.bpmEl, 10),
                        });
                    }

                    saveBlockState(updatedBlockState);
                    return updatedBlockState;
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount

    // Component variants for animations
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };
    
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

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

    // Handler for moving a block up
    const handleMoveBlockUp = (instanceId: string) => {
        const updatedBlockState = moveBlock(blockState, instanceId, 'up');
        setBlockState(updatedBlockState);
        saveBlockState(updatedBlockState);
    };

    // Handler for moving a block down
    const handleMoveBlockDown = (instanceId: string) => {
        const updatedBlockState = moveBlock(blockState, instanceId, 'down');
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
    const generatorRoot = inspirationState.rootEl;

    return (
        <>
            <PageContainer as={motion.div}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <TwoColumnGrid>
                    {visibleBlocks.map((block, index) => (
                        <GridItem
                            key={block.instanceId}
                            variants={itemVariants}
                            $order={block.order}
                        >
                            <BlockRenderer
                                block={block}
                                onUpdateState={handleBlockStateUpdate}
                                onRemove={visibleBlocks.length > 1 ? () => handleRemoveBlock(block.instanceId) : undefined}
                                onMoveUp={index > 0 ? () => handleMoveBlockUp(block.instanceId) : undefined}
                                onMoveDown={index < visibleBlocks.length - 1 ? () => handleMoveBlockDown(block.instanceId) : undefined}
                                canRemove={visibleBlocks.length > 1}
                                canMoveUp={index > 0}
                                canMoveDown={index < visibleBlocks.length - 1}
                                globalBpm={globalBpm}
                                generatorRoot={generatorRoot}
                            />
                        </GridItem>
                    ))}
                </TwoColumnGrid>
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
