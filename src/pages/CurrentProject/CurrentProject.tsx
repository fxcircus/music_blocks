import React, { FC, useState, useEffect } from "react";
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Container } from '../../components/common/StyledComponents';
import PomodoroTimer from "../../components/pomodoroTimer/pomodoroTimer";
import InspirationGenerator from "../../components/inspirationGenerator/inspirationGenerator";
import NotePad from "../../components/Notepad/Notepad";
import Metronome from "../../components/Metronome/Metronome";
import { TilesState } from "../../utils/types";
import { loadAppState, saveAppState } from "../../utils/storageService";
import { decodeURLToState, hasStateParams } from "../../utils/urlSharing";
import { AppState } from "../../blocks/types";
import { loadBlockState, saveBlockState, updateBlockState as updateBlockStateUtil } from "../../utils/blockStorage";

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
    // NEW: Load block-based state (with automatic migration from old format)
    const [blockState, setBlockState] = useState<AppState>(loadBlockState());
    const [animate, setAnimate] = useState(false);

    // COMPATIBILITY: Extract old TilesState format from block state for existing components
    // This allows us to keep using the old component props while transitioning
    const getBlockState = (instanceId: string): any => {
        const block = blockState.blocks.find(b => b.instanceId === instanceId);
        return block?.state || {};
    };

    const inspirationState = getBlockState('inspirationGenerator');
    const notesState = getBlockState('notes');
    const metronomeState = getBlockState('metronome');

    const state: TilesState = {
        notes: notesState.notes || '',
        rootEl: inspirationState.rootEl || 'C',
        scaleEl: inspirationState.scaleEl || 'Major',
        tonesEl: inspirationState.tonesEl || 'T - T - S - T - T - T - S',
        tonesArrEl: inspirationState.tonesArrEl || ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'],
        bpmEl: inspirationState.bpmEl || '100',
        soundEl: inspirationState.soundEl || 'Guitar',
    };

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

    // Update state and save to localStorage whenever a component of state changes
    // This maintains the old interface but updates the new block-based storage
    const updateState = (newState: Partial<TilesState>) => {
        let updatedBlockState = blockState;

        // Map old state updates to block updates
        if (newState.notes !== undefined) {
            updatedBlockState = updateBlockStateUtil(updatedBlockState, 'notes', {
                notes: newState.notes,
            });
        }

        // Update inspiration generator block
        const inspirationUpdates: any = {};
        if (newState.rootEl !== undefined) inspirationUpdates.rootEl = newState.rootEl;
        if (newState.scaleEl !== undefined) inspirationUpdates.scaleEl = newState.scaleEl;
        if (newState.tonesEl !== undefined) inspirationUpdates.tonesEl = newState.tonesEl;
        if (newState.tonesArrEl !== undefined) inspirationUpdates.tonesArrEl = newState.tonesArrEl;
        if (newState.bpmEl !== undefined) inspirationUpdates.bpmEl = newState.bpmEl;
        if (newState.soundEl !== undefined) inspirationUpdates.soundEl = newState.soundEl;

        if (Object.keys(inspirationUpdates).length > 0) {
            updatedBlockState = updateBlockStateUtil(updatedBlockState, 'inspirationGenerator', inspirationUpdates);
        }

        // Update metronome if BPM changed
        if (newState.bpmEl !== undefined) {
            updatedBlockState = updateBlockStateUtil(updatedBlockState, 'metronome', {
                bpm: parseInt(newState.bpmEl, 10),
            });
        }

        setBlockState(updatedBlockState);
        saveBlockState(updatedBlockState);
    };

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

    return (
        <PageContainer as={motion.div} 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <TwoColumnGrid>
                <GridItem variants={itemVariants} $order={4} $desktopOrder={3}>
                    <PomodoroTimer />
                </GridItem>
                
                <GridItem variants={itemVariants} $order={1}>
                    <InspirationGenerator 
                        animate={animate}
                        setAnimate={setAnimate}
                        rootEl={state.rootEl}
                        setRootEl={(rootEl) => updateState({ rootEl })}
                        scaleEl={state.scaleEl}
                        setScaleEl={(scaleEl) => updateState({ scaleEl })}
                        tonesEl={state.tonesEl}
                        setTonesEl={(tonesEl) => updateState({ tonesEl })}
                        tonesArrEl={state.tonesArrEl}
                        setTonesArrEl={(tonesArrEl) => updateState({ tonesArrEl })}
                        bpmEl={state.bpmEl}
                        setBpmEl={(bpmEl) => updateState({ bpmEl })}
                        soundEl={state.soundEl}
                        setSoundEl={(soundEl) => updateState({ soundEl })}
                    />
                </GridItem>
                
                <GridItem variants={itemVariants} $order={3} $desktopOrder={4}>
                    <NotePad 
                        notes={state.notes} 
                        setNotes={(notes) => updateState({ notes })} 
                    />
                </GridItem>
                
                <GridItem variants={itemVariants} $order={2}>
                    <Metronome bpm={parseInt(state.bpmEl, 10)} />
                </GridItem>
            </TwoColumnGrid>
        </PageContainer>
    );
}

export default CurrentProject;
