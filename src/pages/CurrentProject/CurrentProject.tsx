import React, { FC, useState, useEffect } from "react";
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Container } from '../../components/common/StyledComponents';
import { TilesState } from "../../utils/types";
import { decodeURLToState, hasStateParams } from "../../utils/urlSharing";
import { AppState } from "../../blocks/types";
import { loadBlockState, saveBlockState, updateBlockState as updateBlockStateUtil } from "../../utils/blockStorage";
import BlockRenderer from "../../blocks/BlockRenderer";

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

const CurrentProject: FC<LoaderProps> = () => {
    // Load block-based state (with automatic migration from old format)
    const [blockState, setBlockState] = useState<AppState>(loadBlockState());

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
        const updatedBlockState = updateBlockStateUtil(blockState, instanceId, newState);
        setBlockState(updatedBlockState);
        saveBlockState(updatedBlockState);
    };

    // Get visible blocks sorted by order
    const visibleBlocks = blockState.blocks
        .filter(block => block.visible)
        .sort((a, b) => a.order - b.order);

    // Get global BPM for metronome synchronization
    const globalBpm = inspirationState.bpmEl;

    return (
        <PageContainer as={motion.div}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <TwoColumnGrid>
                {visibleBlocks.map((block) => (
                    <GridItem
                        key={block.instanceId}
                        variants={itemVariants}
                        $order={block.order}
                    >
                        <BlockRenderer
                            block={block}
                            onUpdateState={handleBlockStateUpdate}
                            globalBpm={globalBpm}
                        />
                    </GridItem>
                ))}
            </TwoColumnGrid>
        </PageContainer>
    );
}

export default CurrentProject;
