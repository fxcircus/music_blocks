// src/components/Generator/Generator.tsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import styled, { useTheme, keyframes, css } from 'styled-components';
import { motion } from 'framer-motion';
import { FaDice, FaLock, FaUnlock, FaMusic, FaVolumeUp, FaVolumeDown, FaVolumeOff, FaVolumeMute, FaStop, FaGuitar, FaDownload, FaMinus, FaPlus } from 'react-icons/fa';
import { GiPianoKeys } from 'react-icons/gi';
import { MdQueueMusic, MdAutoAwesome } from 'react-icons/md';
import { Card } from '../common/StyledComponents';
import { Icon } from '../../utils/IconHelper';
import {
  generateDiatonicScale,
  getChromaticIndex,
  getCorrectNoteSpelling
} from '../../utils/musicTheory';
import NotesVisualizer from '../NotesVisualizer';
import TipsModal from '../common/TipsModal';
import { useSoundSettings } from '../../context/SoundSettingsContext';
import { getSequenceProfile } from '../../utils/audioProfiles';
import SoundDropdownPanel from '../common/SoundDropdownPanel';


// Chord quality mapping for different modes
const chordQualities: Record<string, (string | null)[]> = {
  Major: ['', 'm', 'm', '', '', 'm', 'dim'],
  Minor: ['m', 'dim', '', 'm', 'm', '', ''],
  Dorian: ['m', 'm', '', '', 'm', 'dim', ''],
  Phrygian: ['m', '', '', 'm', 'dim', '', 'm'],
  Lydian: ['', '', 'm', 'dim', '', 'm', 'm'],
  Mixolydian: ['', 'm', 'dim', '', 'm', 'm', ''],
  Locrian: ['dim', '', 'm', 'm', '', 'm', ''],
  "Harmonic Minor": ['m', 'dim', 'aug', 'm', '', '', 'dim'],
  "Melodic Minor": ['m', 'm', 'aug', '', '', 'dim', 'dim'],
  "Hungarian Minor": ['m', '', 'aug', '', 'dim', '', 'dim'],
  "Double Harmonic": ['', '', 'aug', 'm', '', '', 'dim'],
  "Phrygian Dominant": ['', '', 'aug', 'm', 'dim', '', ''],
  "Pentatonic Major": ['', 'm', null, '', 'm', null, null],
  "Pentatonic Minor": ['m', null, '', 'm', null, '', null],
  "Blues": ['', null, '', 'm', '+5', null, ''],
};

// Roman numeral for chord degrees
const romanNumerals = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii'];

// Scale note count mapping
const scaleNoteCounts: Record<string, number> = {
  "Pentatonic Major": 5,
  "Pentatonic Minor": 5,
  "Blues": 6,
  "Major": 7,
  "Minor": 7,
  "Dorian": 7,
  "Phrygian": 7,
  "Lydian": 7,
  "Mixolydian": 7,
  "Locrian": 7,
  "Harmonic Minor": 7,
  "Melodic Minor": 7,
  "Hungarian Minor": 7,
  "Double Harmonic": 7,
  "Phrygian Dominant": 7,
};

const TIME_SIGNATURE_OPTIONS = ['2/4', '3/4', '4/4', '5/4', '6/8', '7/4'];

type LockedState = {
  root: boolean;
  scale: boolean;
  bpm: boolean;
  sound: boolean;
  timeSignature: boolean;
};

interface componentProps {
  animate: boolean;
  setAnimate: (animate: boolean) => void;
  rootEl: string;
  setRootEl: (rootEl: string) => void;
  scaleEl: string;
  setScaleEl: (scaleEl: string) => void;
  tonesEl: string;
  setTonesEl: (tonesEl: string) => void;
  tonesArrEl: string[];
  setTonesArrEl: (tonesArrEl: string[]) => void;
  bpmEl: string;
  setBpmEl: (bpmEl: string) => void;
  timeSignatureEl: string;
  setTimeSignatureEl: (ts: string) => void;
  soundEl: string;
  setSoundEl: (soundEl: string) => void;
  dragHandleProps?: any;
  isRecentlyDragged?: boolean;
  showTips?: boolean;
  setShowTips?: (show: boolean) => void;
  diceMode?: boolean;
  setDiceMode?: (diceMode: boolean) => void;
}

// Styled components
const InspirationCard = styled(Card)`
  max-width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  min-height: 400px;
  overflow: visible;
  
  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing.xs};
    min-height: 380px;
  }
`;

const DiceButton = styled(motion.button)`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.fontSizes.xxxl};
  margin: ${({ theme }) => theme.spacing.xs} auto;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.secondary};
  }
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: ${({ theme }) => theme.spacing.xs} 0;
  table-layout: fixed;
  overflow: visible;
`;

const TableRow = styled.tr`
  transition: all ${({ theme }) => theme.transitions.fast};
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  height: 36px;
  
  &:hover {
    background-color: ${({ theme }) => `${theme.colors.primary}11`};
  }
  
  &.chord-scale-row {
    height: auto;
    padding: ${({ theme }) => theme.spacing.sm} 0;
    border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  }
  
  @media (max-width: 768px) {
    height: 32px; // Smaller height on mobile
  }
`;

const SpacerCell = styled.td`
  width: 30px;
  padding: 0;
  
  @media (max-width: 768px) {
    width: 20px;
  }
`;

const TableHeader = styled.td`
  padding: ${({ theme }) => `${theme.spacing.xs} 0`};
  width: 35px;
  text-align: center;
  vertical-align: middle;
  height: 100%;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
  
  @media (max-width: 768px) {
    width: 30px; // Smaller width on mobile
    padding: ${({ theme }) => `${theme.spacing.xs} 0`}; // Smaller padding
  }
`;

const LabelCell = styled.td`
  padding: ${({ theme }) => `${theme.spacing.xs} 0`};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
  width: 120px;
  vertical-align: middle;
  height: 100%;
  text-align: left;
  white-space: nowrap;
  padding-left: ${({ theme }) => theme.spacing.md};
  
  @media (max-width: 768px) {
    width: 100px;
    padding: ${({ theme }) => `${theme.spacing.xs} 0`};
    padding-left: ${({ theme }) => theme.spacing.sm};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
`;

const ValueCell = styled.td`
  padding: ${({ theme }) => `${theme.spacing.xs} 0`};
  color: ${({ theme }) => theme.colors.text};
  font-weight: 600;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  vertical-align: middle;
  height: 100%;
  padding-right: 0;

  // Dynamically adjust font size for long content
  &.long-content {
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }

  &.very-long-content {
    font-size: ${({ theme }) => theme.fontSizes.xs};
  }
  
  @media (max-width: 768px) {
    padding: ${({ theme }) => `${theme.spacing.xs} 0`};
    padding-right: 0;
    font-size: ${({ theme }) => theme.fontSizes.sm};

    &.long-content, &.very-long-content {
      font-size: ${({ theme }) => theme.fontSizes.xs};
    }
  }
`;

const BpmInputCell = styled.td`
  padding: ${({ theme }) => `${theme.spacing.xs} 0`};
  vertical-align: middle;
  height: 100%;
  padding-right: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
`;

const BpmAdjustBtn = styled.button`
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  transition: all 0.15s;

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
    transform: scale(1.1);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const BpmInput = styled.input`
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  color: ${({ theme }) => theme.colors.text};
  font-weight: 600;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-family: inherit;
  width: 52px;
  text-align: center;
  padding: 2px 4px;
  outline: none;
  transition: border-color 0.15s;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const ClickableValueCell = styled(ValueCell)<{ $isLocked?: boolean }>`
  position: relative;
  cursor: ${({ $isLocked }) => $isLocked ? 'not-allowed' : 'pointer'};
  transition: all 0.15s;
  overflow: visible;
`;

const ClickableValueInner = styled.span<{ $isLocked?: boolean }>`
  display: inline-block;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  padding: 2px 8px;
  min-width: 52px;
  text-align: center;
  opacity: ${({ $isLocked }) => $isLocked ? 0.4 : 1};
  transition: all 0.15s;

  &:hover {
    color: ${({ theme, $isLocked }) =>
      $isLocked ? theme.colors.text : theme.colors.primary};
    border-color: ${({ theme, $isLocked }) =>
      $isLocked ? theme.colors.border : theme.colors.primary};
  }
`;

const ValueDropdown = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: 6px;
  display: grid;
  gap: 4px;
  z-index: 1000;
  box-shadow: none;
  min-width: 200px;
  max-height: 320px;
  overflow-y: auto;
`;

const RootDropdown = styled(ValueDropdown)<{ $viewMode?: 'grid' | 'circle' }>`
  grid-template-columns: ${({ $viewMode }) =>
    $viewMode === 'circle' ? '1fr' : 'repeat(3, 1fr)'};
  width: ${({ $viewMode }) =>
    $viewMode === 'circle' ? '300px' : '280px'};
`;

const ViewToggle = styled.div`
  display: flex;
  gap: 2px;
  padding: 4px;
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  margin-bottom: 6px;
  grid-column: 1 / -1;
`;

const ViewToggleOption = styled.button<{ $isActive: boolean }>`
  flex: 1;
  padding: 4px 8px;
  font-size: 11px;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background: ${({ theme, $isActive }) =>
    $isActive ? theme.colors.primary + '30' : 'transparent'};
  color: ${({ theme, $isActive }) =>
    $isActive ? theme.colors.primary : theme.colors.textSecondary};
  cursor: pointer;
  transition: all 0.12s;
  white-space: nowrap;
`;

const ScaleDropdown = styled(ValueDropdown)`
  grid-template-columns: repeat(2, 1fr);
  width: 320px;
`;

const TimeSignatureDropdown = styled(ValueDropdown)`
  grid-template-columns: repeat(3, 1fr);
  width: 200px;
  min-width: 200px;
`;

const DropdownOption = styled.button<{ $isSelected: boolean }>`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.xs}`};
  background: ${({ theme, $isSelected }) =>
    $isSelected ? theme.colors.primary + '30' : theme.colors.background};
  border: 1px solid ${({ theme, $isSelected }) =>
    $isSelected ? theme.colors.primary : theme.colors.border};
  color: ${({ theme, $isSelected }) =>
    $isSelected ? theme.colors.primary : theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ $isSelected }) => ($isSelected ? 600 : 400)};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  cursor: pointer;
  transition: all 0.12s;
  white-space: nowrap;
  text-align: center;

  &:hover {
    background: ${({ theme }) => theme.colors.primary}20;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ExtendedInfoCell = styled.td`
  padding: ${({ theme }) => `${theme.spacing.xs} 0`};
  color: ${({ theme }) => theme.colors.text};
  vertical-align: middle;
  height: 100%;
  text-align: right;
  width: auto;
  overflow: visible;
  min-width: 0;
  
  @media (max-width: 768px) {
    padding: ${({ theme }) => `${theme.spacing.xs} 0`};
  }
`;

const TooltipWrapper = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const Tooltip = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: ${({ theme }) => theme.colors.card};
  color: ${({ theme }) => theme.colors.text};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  box-shadow: none;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  white-space: nowrap;
  z-index: 1000;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  opacity: 0;
  visibility: hidden;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  ${TooltipWrapper}:hover & {
    opacity: 1;
    visibility: visible;
  }
`;

// Update the ChordDegreesContainer to handle dynamic spacing
const ChordDegreesContainer = styled.div<{ $noteCount: number; $isSeventhMode?: boolean }>`
  display: flex;
  justify-content: ${({ $noteCount }) => $noteCount < 7 ? 'space-around' : 'flex-start'};
  gap: ${({ theme, $noteCount, $isSeventhMode }) =>
    $isSeventhMode ? theme.spacing.xs : $noteCount < 7 ? '0' : theme.spacing.sm};
  overflow-x: visible;
  padding-right: ${({ theme }) => theme.spacing.sm};
  width: ${({ $isSeventhMode }) => $isSeventhMode ? '350px' : '320px'};
  position: relative;
  z-index: 10;

  @media (max-width: 768px) {
    justify-content: ${({ $noteCount }) => $noteCount < 7 ? 'space-around' : 'flex-start'};
    padding-right: ${({ theme }) => theme.spacing.xs};
    gap: ${({ theme, $noteCount, $isSeventhMode }) =>
      $isSeventhMode ? '4px' : $noteCount < 7 ? '0' : theme.spacing.xs};
    width: ${({ $isSeventhMode }) => $isSeventhMode ? '260px' : '240px'};
  }
`;

// Update the ScaleTonesContainer to handle dynamic spacing
const ScaleTonesContainer = styled.div<{ $noteCount: number; $isSeventhMode?: boolean }>`
  display: flex;
  justify-content: ${({ $noteCount }) => $noteCount < 7 ? 'space-around' : 'flex-start'};
  gap: ${({ theme, $noteCount, $isSeventhMode }) =>
    $isSeventhMode ? theme.spacing.xs : $noteCount < 7 ? '0' : theme.spacing.sm};
  overflow-x: visible;
  padding-right: ${({ theme }) => theme.spacing.sm};
  width: ${({ $isSeventhMode }) => $isSeventhMode ? '350px' : '320px'};
  position: relative;
  z-index: 10;

  @media (max-width: 768px) {
    justify-content: ${({ $noteCount }) => $noteCount < 7 ? 'space-around' : 'flex-start'};
    padding-right: ${({ theme }) => theme.spacing.xs};
    gap: ${({ theme, $noteCount, $isSeventhMode }) =>
      $isSeventhMode ? '4px' : $noteCount < 7 ? '0' : theme.spacing.xs};
    width: ${({ $isSeventhMode }) => $isSeventhMode ? '260px' : '240px'};
  }
`;

const LockIconWrapper = styled.div<{ $isLocked: boolean }>`
  cursor: pointer;
  color: ${({ $isLocked, theme }) => 
    $isLocked ? theme.colors.lockIconActive : theme.colors.lockIconInactive};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    transform: scale(1.2);
  }
`;


const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const ChordDegree = styled.div<{ $isSelected: boolean }>`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background-color: ${({ $isSelected, theme }) => 
    $isSelected ? theme.colors.primary : `${theme.colors.primary}22`};
  color: ${({ $isSelected, theme }) => 
    $isSelected ? theme.colors.buttonText : theme.colors.text};
  font-weight: 600;
  min-width: 30px;
  text-align: center;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: none;
  }
  
  @media (max-width: 768px) {
    min-width: 25px;
    padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.xs}`};
  }
`;

const ChordName = styled.div<{ $isSelected: boolean; $isSeventhMode?: boolean }>`
  font-size: ${({ theme, $isSeventhMode }) =>
    $isSeventhMode ? theme.fontSizes.xs : theme.fontSizes.sm};
  color: ${({ $isSelected, theme }) =>
    $isSelected ? theme.colors.primary : theme.colors.textSecondary};
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing.xs};
  font-weight: ${({ $isSelected }) => ($isSelected ? '600' : '400')};
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.xs};
  }
`;


const IntervalLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: ${({ theme }) => theme.spacing.xs};
  font-weight: 400;
  
  @media (max-width: 768px) {
    font-size: calc(${({ theme }) => theme.fontSizes.xs} * 0.9);
  }
`;

// Use a more direct approach with hr elements
const Divider = styled.hr`
  border: none;
  height: 1px;
  background-color: ${({ theme }) => theme.colors.border};
  opacity: 0.4;
  width: 100%;
  margin: 0;
  padding: 0;
`;

// Update the SeparatorRow to use the simpler approach
const SeparatorCell = styled.td`
  padding: 0 !important;
  background-color: transparent;
  border: none;
  height: 1px;
`;

// Re-add the ItemWrapper component that was accidentally removed
const ItemWrapper = styled.div<{ $isSeventhMode?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: ${({ $isSeventhMode }) => $isSeventhMode ? '45px' : '40px'};
  height: 100%;

  @media (max-width: 768px) {
    width: ${({ $isSeventhMode }) => $isSeventhMode ? '35px' : '30px'};
  }
`;

// Seventh chord toggle button
const SeventhToggleButton = styled.button<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background-color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.primary : 'transparent'};
  color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.buttonText : theme.colors.textSecondary};
  border: 2px solid ${({ $isActive, theme }) =>
    $isActive ? theme.colors.primary : theme.colors.border};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  font-weight: bold;
  font-size: ${({ theme }) => theme.fontSizes.sm};

  &:hover {
    transform: scale(1.1);
    background-color: ${({ $isActive, theme }) =>
      $isActive ? theme.colors.primary : `${theme.colors.primary}22`};
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;

    &:hover {
      transform: none;
      background-color: transparent;
    }
  }
`;

// Play button for audio playback
const PlayButton = styled.button<{ $isPlaying: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background-color: ${({ $isPlaying, theme }) =>
    $isPlaying ? theme.colors.primary : 'transparent'};
  color: ${({ $isPlaying, theme }) =>
    $isPlaying ? theme.colors.buttonText : theme.colors.textSecondary};
  border: 2px solid ${({ $isPlaying, theme }) =>
    $isPlaying ? theme.colors.primary : theme.colors.border};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    transform: scale(1.1);
    background-color: ${({ $isPlaying, theme }) =>
      $isPlaying ? theme.colors.primary : `${theme.colors.primary}22`};
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  svg {
    animation: ${({ $isPlaying }) => $isPlaying ? 'pulse 1s infinite' : 'none'};
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;

const VisualizerButtonRow = styled.div`
  display: flex;
  justify-content: space-evenly;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
`;

const LabeledVisualizerButton = styled.button<{ $isActive: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.primary : 'transparent'};
  color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.buttonText : theme.colors.textSecondary};
  border: 2px solid ${({ $isActive, theme }) =>
    $isActive ? theme.colors.primary : theme.colors.border};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;

  &:hover {
    background: ${({ $isActive, theme }) =>
      $isActive ? theme.colors.primary : `${theme.colors.primary}22`};
    transform: scale(1.05);
  }
`;

// Update ScaleToneNote to support seventh highlighting and playback
const ScaleToneNoteUpdated = styled.div<{
  $highlight: 'root' | 'chord' | 'seventh' | 'none';
  $isPlaying?: boolean;
}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.xs}`};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background-color: ${({ $highlight, theme }) =>
    $highlight === 'root'
      ? theme.colors.primary
      : $highlight === 'chord'
        ? `${theme.colors.secondary}88`
        : $highlight === 'seventh'
          ? '#8b5cf6'
          : `${theme.colors.primary}22`};
  color: ${({ $highlight, theme }) =>
    $highlight === 'root' || $highlight === 'chord' || $highlight === 'seventh'
      ? theme.colors.buttonText
      : theme.colors.text};
  font-weight: 500;
  min-width: 100%;
  text-align: center;
  transition: all ${({ theme }) => theme.transitions.fast};
  height: 100%;
  min-height: 48px;
  justify-content: center;
  transform: ${({ $isPlaying }) => $isPlaying ? 'scale(1.1)' : 'scale(1)'};
  box-shadow: none;
  cursor: pointer;

  &:hover {
    opacity: 0.85;
  }

  @media (max-width: 768px) {
    min-width: 100%;
    padding: ${({ theme }) => `${theme.spacing.xs} 2px`};
    min-height: 40px;
  }
`;

// ── Circle of Fifths ──────────────────────────────────────────────────

const CIRCLE_ORDER = ['C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'D♭', 'A♭', 'E♭', 'B♭', 'F'];

const ENHARMONIC_TO_CIRCLE: Record<string, string> = {
  'B♯': 'C', 'B#': 'C',
  'F♭': 'E', 'Fb': 'E',
  'C♭': 'B', 'Cb': 'B',
  'C♯': 'D♭', 'C#': 'D♭',
  'G♯': 'A♭', 'G#': 'A♭',
  'D♯': 'E♭', 'D#': 'E♭',
  'A♯': 'B♭', 'A#': 'B♭',
  'E♯': 'F', 'E#': 'F',
  'G♭': 'F♯', 'Gb': 'F♯',
  'F#': 'F♯',
  'Db': 'D♭', 'Ab': 'A♭', 'Eb': 'E♭', 'Bb': 'B♭',
};

function getCircleIndex(note: string): number {
  const mapped = ENHARMONIC_TO_CIRCLE[note];
  const idx = CIRCLE_ORDER.indexOf(mapped ?? note);
  return idx === -1 ? 0 : idx;
}

function getCircleDistance(a: number, b: number): number {
  const diff = Math.abs(a - b);
  return Math.min(diff, 12 - diff);
}

// ── Dice Mode ────────────────────────────────────────────────────────

const diceShakeKeyframes = keyframes`
  0%   { transform: translate(0,0) rotate(0deg); }
  10%  { transform: translate(-3px,-2px) rotate(-6deg); }
  20%  { transform: translate(4px,1px) rotate(5deg); }
  30%  { transform: translate(-2px,3px) rotate(-4deg); }
  40%  { transform: translate(3px,-3px) rotate(7deg); }
  50%  { transform: translate(-4px,2px) rotate(-5deg); }
  60%  { transform: translate(2px,-1px) rotate(6deg); }
  70%  { transform: translate(-3px,-3px) rotate(-7deg); }
  80%  { transform: translate(4px,2px) rotate(4deg); }
  90%  { transform: translate(-2px,1px) rotate(-3deg); }
  100% { transform: translate(0,0) rotate(0deg); }
`;

const diceModeInKeyframes = keyframes`
  0% { opacity: 0; transform: translateY(6px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const dicePickerInKeyframes = keyframes`
  0% { opacity: 0; transform: translateX(-50%) translateY(-6px); }
  100% { opacity: 1; transform: translateX(-50%) translateY(0); }
`;

const diceShakeAnimation = css`
  animation: ${diceShakeKeyframes} 0.08s ease-in-out infinite;
`;

const DiceModeContainer = styled.div`
  animation: ${diceModeInKeyframes} 0.25s ease-out;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-evenly;
  gap: 4px 8px;
  padding: 4px 0;
  width: 100%;
`;

const DieContainer = styled.div<{ $locked?: boolean; $editable?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  cursor: ${({ $editable, $locked }) => $editable && !$locked ? 'pointer' : 'default'};
  opacity: ${({ $locked }) => $locked ? 0.4 : 1};
  transition: opacity 0.4s;
  user-select: none;
  position: relative;
`;

const DieLabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const DieLabel = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 1.2px;
  line-height: 1;
  white-space: nowrap;
`;

const DieSvgWrapper = styled.div<{ $rolling?: boolean; $accent?: string }>`
  width: 96px;
  height: 96px;
  flex-shrink: 0;
  ${({ $rolling }) => $rolling && diceShakeAnimation}
  filter: ${({ $rolling, $accent }) =>
    $rolling ? `drop-shadow(0 0 16px ${$accent}bb)` : `drop-shadow(0 0 4px ${$accent}33)`};
  transition: filter 0.3s;

  @media (max-width: 480px) {
    width: 76px;
    height: 76px;
  }
`;

const DicePickerDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: 6px;
  display: grid;
  gap: 4px;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  margin-top: 4px;
  animation: ${dicePickerInKeyframes} 0.15s ease-out;
  max-height: 320px;
  overflow-y: auto;
`;

const DiceRootPicker = styled(DicePickerDropdown)<{ $viewMode?: 'grid' | 'circle' }>`
  grid-template-columns: ${({ $viewMode }) =>
    $viewMode === 'circle' ? '1fr' : 'repeat(3, 1fr)'};
  width: ${({ $viewMode }) =>
    $viewMode === 'circle' ? '300px' : '280px'};
  left: 0;
  transform: none;
`;

const DiceScalePicker = styled(DicePickerDropdown)`
  grid-template-columns: repeat(2, 1fr);
  width: 320px;
`;

const DiceTimeSigPicker = styled(DicePickerDropdown)`
  grid-template-columns: repeat(3, 1fr);
  width: 200px;
  min-width: 200px;
`;

const DiceBpmPicker = styled(DicePickerDropdown)`
  grid-template-columns: 1fr;
  width: auto;
  min-width: 140px;
  padding: 8px;
`;

// ── Die Shape SVG Components ──────────────────────────────────────────

function D4Shape({ color }: { color: string }) {
  return <polygon points="50,8 92,82 8,82" fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />;
}

function D6Shape({ color }: { color: string }) {
  return <rect x="14" y="14" width="72" height="72" rx="8" fill="none" stroke={color} strokeWidth="2.5" />;
}

function D8Shape({ color }: { color: string }) {
  return <polygon points="50,6 94,50 50,94 6,50" fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />;
}

function D12Shape({ color }: { color: string }) {
  const cx = 50, cy = 50, r = 42;
  const pts = Array.from({ length: 5 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");
  return <polygon points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />;
}

function D20Shape({ color }: { color: string }) {
  const cx = 50, cy = 50, r = 44;
  return (
    <>
      <polygon points={Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
      }).join(" ")} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {Array.from({ length: 6 }, (_, i) => {
        const a1 = (Math.PI * 2 * i) / 6 - Math.PI / 2;
        const a2 = (Math.PI * 2 * ((i + 1) % 6)) / 6 - Math.PI / 2;
        const mx = (cx + r * Math.cos(a1) + cx + r * Math.cos(a2)) / 2;
        const my = (cy + r * Math.sin(a1) + cy + r * Math.sin(a2)) / 2;
        return <line key={i} x1={mx} y1={my} x2={cx} y2={cy} stroke={color} strokeWidth="1.2" opacity="0.35" />;
      })}
    </>
  );
}

const DIE_SHAPES: Record<string, React.FC<{ color: string }>> = {
  d4: D4Shape, d6: D6Shape, d8: D8Shape, d12: D12Shape, d20: D20Shape,
};

function DieTextSvg({ value, die, fill, fontSize }: {
  value: string; die: string; fill: string; fontSize: string;
}) {
  const cy = die === "d4" ? 62 : 53;
  const words = value.split(" ");
  if (words.length > 1) {
    const lh = Math.min(parseInt(fontSize) + 2, 14);
    const startY = cy - ((words.length - 1) * lh) / 2;
    return (
      <text x="50" textAnchor="middle" fill={fill} fontSize={fontSize}
        fontFamily="inherit" fontWeight="700">
        {words.map((w, i) => <tspan key={i} x="50" y={startY + i * lh}>{w}</tspan>)}
      </text>
    );
  }
  return (
    <text x="50" y={cy} textAnchor="middle" dominantBaseline="middle"
      fill={fill} fontSize={fontSize}
      fontFamily="inherit" fontWeight="700">{value}</text>
  );
}

// ── Die Component ─────────────────────────────────────────────────────

function DieComponent({
  dieType, paramKey, label, value, locked, onToggleLock,
  externalRolling, editable, options,
  renderPicker,
}: {
  dieType: string;
  paramKey: string;
  label: string;
  value: string;
  locked: boolean;
  onToggleLock: () => void;
  externalRolling: boolean;
  editable: boolean;
  options: string[];
  renderPicker?: (onClose: () => void) => React.ReactNode;
}) {
  const theme = useTheme() as any;
  const [displayValue, setDisplayValue] = useState(value);
  const [washKey, setWashKey] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevValueRef = useRef(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const rolling = externalRolling && !locked;

  // Click outside to close picker
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  // Rapid value cycling during roll
  useEffect(() => {
    if (externalRolling && !locked && options.length > 0) {
      intervalRef.current = setInterval(() => {
        setDisplayValue(options[Math.floor(Math.random() * options.length)]);
      }, 50);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }
  }, [externalRolling, locked, options]);

  // Sync display value and trigger wash
  useEffect(() => {
    if (!externalRolling && value !== prevValueRef.current) {
      setWashKey((k) => k + 1);
      setDisplayValue(value);
      prevValueRef.current = value;
    }
    if (!externalRolling) setDisplayValue(value);
  }, [value, externalRolling]);

  // Close picker when rolling starts
  useEffect(() => {
    if (externalRolling) setPickerOpen(false);
  }, [externalRolling]);

  const Shape = DIE_SHAPES[dieType];
  const accent = locked ? theme.colors.border : theme.colors.primary;
  const textColor = locked ? theme.colors.textSecondary : theme.colors.text;
  const hasMulti = displayValue.includes(" ");
  const fontSize = hasMulti ? "12" : "17";

  return (
    <DieContainer
      ref={containerRef}
      $locked={locked}
      $editable={editable}
      onClick={() => {
        if (!externalRolling && editable && !locked && renderPicker) {
          setPickerOpen((p) => !p);
        }
      }}
    >
      <DieLabelRow>
        <LockIconWrapper
          $isLocked={locked}
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); onToggleLock(); setPickerOpen(false); }}
        >
          <IconWrapper>
            {locked ? <Icon icon={FaLock} size={10} /> : <Icon icon={FaUnlock} size={10} />}
          </IconWrapper>
        </LockIconWrapper>
        <DieLabel>{label}</DieLabel>
      </DieLabelRow>
      <DieSvgWrapper $rolling={rolling} $accent={accent}>
        <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={`dwg-${paramKey}`} gradientUnits="userSpaceOnUse" x1="0" y1="50" x2="100" y2="50">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="40%" stopColor={theme.colors.primary} />
              <stop offset="60%" stopColor={theme.colors.text} />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <mask id={`dwm-${paramKey}-${washKey}`}>
              <rect x="-40" y="0" width="60" height="100" fill="white">
                <animate attributeName="x" from="-40" to="100" dur="0.4s" fill="freeze" key={washKey} />
              </rect>
            </mask>
          </defs>
          {Shape && <Shape color={accent} />}
          <DieTextSvg value={displayValue} die={dieType} fill={textColor} fontSize={fontSize} />
          {!rolling && washKey > 0 && (
            <g key={`w-${washKey}`} mask={`url(#dwm-${paramKey}-${washKey})`}>
              <DieTextSvg value={displayValue} die={dieType} fill={`url(#dwg-${paramKey})`} fontSize={fontSize} />
            </g>
          )}
        </svg>
      </DieSvgWrapper>
      {pickerOpen && renderPicker?.(() => setPickerOpen(false))}
    </DieContainer>
  );
}

// ── Circle of Fifths ──────────────────────────────────────────────────

function CircleOfFifthsSelector({
  currentRoot,
  onSelect,
}: {
  currentRoot: string;
  onSelect: (note: string) => void;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const theme = useTheme() as any;
  const selectedCircleIndex = getCircleIndex(currentRoot);
  const cx = 150, cy = 150, radius = 110, chipR = 22;
  const distanceOpacity = [1, 0.9, 0.8, 0.7, 0.6, 0.55, 0.5];

  return (
    <svg viewBox="0 0 300 300" width="100%" style={{ display: 'block' }}>
      {/* Connecting ring */}
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke={theme.colors.border} strokeWidth={1} opacity={0.3} />
      {CIRCLE_ORDER.map((note, i) => {
        const angle = (i * 2 * Math.PI) / 12 - Math.PI / 2;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        const isSelected = i === selectedCircleIndex;
        const isHovered = i === hoveredIndex;
        const dist = getCircleDistance(i, selectedCircleIndex);
        const opacity = distanceOpacity[dist] ?? 0.5;

        // Show user's spelling if their root maps to this position
        let label = note;
        if (isSelected && currentRoot !== note) {
          label = currentRoot;
        }

        return (
          <g
            key={note}
            style={{ cursor: 'pointer', opacity }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(isSelected ? currentRoot : note);
            }}
          >
            <circle
              cx={x}
              cy={y}
              r={chipR}
              fill={
                isSelected
                  ? theme.colors.primary + '30'
                  : isHovered
                    ? theme.colors.primary + '20'
                    : theme.colors.background
              }
              stroke={
                isSelected || isHovered
                  ? theme.colors.primary
                  : theme.colors.border
              }
              strokeWidth={1.5}
            />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={13}
              fontWeight={isSelected ? 600 : 400}
              fill={
                isSelected || isHovered
                  ? theme.colors.primary
                  : theme.colors.text
              }
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function InspirationGenerator({
  animate,
  setAnimate,
  rootEl,
  setRootEl,
  scaleEl,
  setScaleEl,
  tonesEl,
  setTonesEl,
  tonesArrEl,
  setTonesArrEl,
  bpmEl,
  setBpmEl,
  timeSignatureEl,
  setTimeSignatureEl,
  soundEl,
  setSoundEl,
  onBatchUpdate,
  dragHandleProps,
  isRecentlyDragged,
  showTips: showTipsExternal,
  setShowTips: setShowTipsExternal,
  diceMode: diceModeExternal,
  setDiceMode: setDiceModeExternal,
}: componentProps & { onBatchUpdate?: (updates: Record<string, any>) => void }) {
  const { effectiveInstrumentTheme, instrumentVolume, setInstrumentVolume, instrumentThemeOverride, setInstrumentThemeOverride } = useSoundSettings();

  const [locked, setLocked] = useState<LockedState>({
    root: false,
    scale: false,
    bpm: false,
    sound: false,
    timeSignature: false,
  });

  // Dice mode state (prefer external props, fallback to internal)
  const [diceModeInternal, setDiceModeInternal] = useState<boolean>(() => localStorage.getItem('tilesDiceMode') === 'true');
  const diceMode = diceModeExternal !== undefined ? diceModeExternal : diceModeInternal;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const setDiceMode = setDiceModeExternal || setDiceModeInternal;
  const [allRolling, setAllRolling] = useState(false);

  // Add state for selected chord
  const [selectedChord, setSelectedChord] = useState<number | null>(null);

  // Add state for seventh chord mode
  const [isSeventhMode, setIsSeventhMode] = useState<boolean>(() => localStorage.getItem('tilesIsSeventhMode') === 'true');

  // Add state for audio playback
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playingNoteIndex, setPlayingNoteIndex] = useState<number>(-1);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const activeNotesRef = useRef<{ oscillator: OscillatorNode; masterGain: GainNode }[]>([]);
  const instrumentThemeRef = useRef(effectiveInstrumentTheme);
  const instrumentVolumeRef = useRef(instrumentVolume);
  instrumentThemeRef.current = effectiveInstrumentTheme;
  instrumentVolumeRef.current = instrumentVolume;

  // Add state for dropdown menus
  const [openDropdown, setOpenDropdown] = useState<'root' | 'scale' | 'timeSignature' | null>(null);
  const [rootDropdownView, setRootDropdownView] = useState<'grid' | 'circle'>('grid');
  const dropdownRef = useRef<HTMLTableCellElement>(null);

  // Tips modal - use external state if provided, otherwise internal
  const [showTipsInternal, setShowTipsInternal] = useState(false);
  const showTips = showTipsExternal !== undefined ? showTipsExternal : showTipsInternal;
  const setShowTips = setShowTipsExternal || setShowTipsInternal;

  // Visualizer toggle state
  const [showPiano, setShowPiano] = useState(() => localStorage.getItem('tilesShowPiano') === 'true');
  const [showGuitar, setShowGuitar] = useState(() => localStorage.getItem('tilesShowGuitar') === 'true');
  const [showProgressions, setShowProgressions] = useState(() => localStorage.getItem('tilesShowProgressions') === 'true');
  const [showSoundDropdown, setShowSoundDropdown] = useState(false);
  const soundDropdownRef = useRef<HTMLDivElement>(null);

  // Chord progression persistence
  const savedProgressionIndex = parseInt(localStorage.getItem('tilesProgression') || '0', 10);
  const handleProgressionChange = useCallback((index: number) => {
    localStorage.setItem('tilesProgression', String(index));
  }, []);

  // BPM manual input
  const [bpmInput, setBpmInput] = useState(bpmEl);

  // Keep input in sync with external BPM changes (dice roll, metronome sync)
  useEffect(() => {
    setBpmInput(bpmEl);
  }, [bpmEl]);

  const commitBpmChange = (newBpm: string) => {
    const parsed = parseInt(newBpm, 10);
    if (isNaN(parsed)) {
      setBpmInput(bpmEl);
      return;
    }
    const clamped = Math.max(40, Math.min(300, parsed));
    const clampedStr = String(clamped);
    setBpmInput(clampedStr);
    if (onBatchUpdate) {
      onBatchUpdate({ bpmEl: clampedStr });
    } else {
      setBpmEl(clampedStr);
    }
  };

  const handleBpmInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBpmInput(e.target.value);
  };

  const handleBpmInputBlur = () => {
    commitBpmChange(bpmInput);
  };

  const handleBpmInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitBpmChange(bpmInput);
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setBpmInput(bpmEl);
      (e.target as HTMLInputElement).blur();
    }
  };

  const adjustBpm = (delta: number) => {
    const current = parseInt(bpmEl, 10) || 120;
    const clamped = Math.max(40, Math.min(300, current + delta));
    const clampedStr = String(clamped);
    if (onBatchUpdate) {
      onBatchUpdate({ bpmEl: clampedStr });
    } else {
      setBpmEl(clampedStr);
    }
  };

  // Update localStorage whenever values change
  useEffect(() => {
    localStorage.setItem('tilesRootEl', rootEl);
  }, [rootEl]);

  useEffect(() => {
    localStorage.setItem('tilesScaleEl', scaleEl);
  }, [scaleEl]);

  useEffect(() => {
    localStorage.setItem('tilesTonesEl', tonesEl);
  }, [tonesEl]);

  useEffect(() => {
    localStorage.setItem('tilesTonesArrEl', JSON.stringify(tonesArrEl));
  }, [tonesArrEl]);

  useEffect(() => {
    localStorage.setItem('tilesBpmEl', bpmEl);
  }, [bpmEl]);

  useEffect(() => {
    localStorage.setItem('tilesSoundEl', soundEl);
  }, [soundEl]);

  useEffect(() => {
    localStorage.setItem('tilesTimeSignatureEl', timeSignatureEl);
  }, [timeSignatureEl]);

  useEffect(() => {
    localStorage.setItem('tilesShowPiano', String(showPiano));
  }, [showPiano]);

  useEffect(() => {
    localStorage.setItem('tilesShowGuitar', String(showGuitar));
  }, [showGuitar]);

  useEffect(() => {
    localStorage.setItem('tilesShowProgressions', String(showProgressions));
  }, [showProgressions]);

  useEffect(() => {
    localStorage.setItem('tilesIsSeventhMode', String(isSeventhMode));
  }, [isSeventhMode]);

  useEffect(() => {
    // Close any open dropdown when dice mode changes
    setOpenDropdown(null);
  }, [diceMode]);

  // Click outside handler to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  // All available root notes including both sharps and flats
  // Organized by common usage - natural notes first, then common accidentals
  const notes = useMemo(() => [
    // Natural notes
    "C", "D", "E", "F", "G", "A", "B",
    // Common flat keys
    "B♭", "E♭", "A♭", "D♭", "G♭",
    // Common sharp keys
    "F♯", "C♯",
    // Less common enharmonics (included for completeness)
    "D♯", "G♯", "A♯",
    "F♭", "C♭", "E♯", "B♯"
  ], []);

  const roots = notes;

  const scales = useMemo(() => [
    "Major",
    "Minor",
    "Dorian",
    "Phrygian",
    "Lydian",
    "Mixolydian",
    "Locrian",
    "Harmonic Minor",
    "Melodic Minor",
    "Hungarian Minor",
    "Double Harmonic",
    "Phrygian Dominant",
    "Pentatonic Major",
    "Pentatonic Minor",
    "Blues",
  ], []);

  // your original pattern text for the "Tones" row
  const scalePatterns = useMemo<Record<string, string>>(() => ({
    Major:      "T - T - S - T - T - T - S",
    Minor:      "T - S - T - T - S - T - T",
    Dorian:     "T - S - T - T - T - S - T",
    Phrygian:   "S - T - T - T - S - T - T",
    Lydian:     "T - T - T - S - T - T - S",
    Mixolydian: "T - T - S - T - T - S - T",
    Locrian:    "S - T - T - S - T - T - T",
    "Harmonic Minor": "T - S - T - T - S - TS - S",
    "Melodic Minor":  "T - S - T - T - T - T - S",
    "Hungarian Minor": "T - S - TS - S - S - TS - S",
    "Double Harmonic": "S - TS - S - T - S - TS - S",
    "Phrygian Dominant": "S - TS - S - T - S - T - T",
    "Pentatonic Major": "T - T - TS - T - TS",
    "Pentatonic Minor": "TS - T - T - TS - T",
    "Blues": "TS - T - S - S - TS - T",
  }), []);

  // semitone steps for computing actual notes
  const scaleIntervals = useMemo<Record<string, number[]>>(() => ({
    Major:      [2, 2, 1, 2, 2, 2, 1],
    Minor:      [2, 1, 2, 2, 1, 2, 2],
    Dorian:     [2, 1, 2, 2, 2, 1, 2],
    Phrygian:   [1, 2, 2, 2, 1, 2, 2],
    Lydian:     [2, 2, 2, 1, 2, 2, 1],
    Mixolydian: [2, 2, 1, 2, 2, 1, 2],
    Locrian:    [1, 2, 2, 1, 2, 2, 2],
    "Harmonic Minor": [2, 1, 2, 2, 1, 3, 1],
    "Melodic Minor":  [2, 1, 2, 2, 2, 2, 1],
    "Hungarian Minor": [2, 1, 3, 1, 1, 3, 1],
    "Double Harmonic": [1, 3, 1, 2, 1, 3, 1],
    "Phrygian Dominant": [1, 3, 1, 2, 1, 2, 2],
    "Pentatonic Major": [2, 2, 3, 2, 3],
    "Pentatonic Minor": [3, 2, 2, 3, 2],
    "Blues": [3, 2, 1, 1, 3, 2],
  }), []);

  // Memoize the function to avoid recreation on each render
  const generateScaleTonesMemoized = useCallback(
    (root: string, mode: string): string[] => {
      // Only process valid modes that exist in our scale intervals
      if (mode in scaleIntervals) {
        const intervals = scaleIntervals[mode as keyof typeof scaleIntervals];

        // Use the new music theory function for proper diatonic spelling
        let scaleNotes = generateDiatonicScale(root, intervals, mode);

        // If generateDiatonicScale failed or returned empty, fall back to chromatic method
        if (!scaleNotes || scaleNotes.length === 0) {
          // Fallback to chromatic generation (less accurate but works)
          const rootIndex = getChromaticIndex(root);
          if (rootIndex === -1) return ["C", "D", "E", "F", "G", "A", "B", "C"];

          scaleNotes = [root];
          let currentIndex = rootIndex;

          for (let interval of intervals) {
            currentIndex = (currentIndex + interval) % 12;
            // Use getCorrectNoteSpelling for key-aware spelling
            const note = getCorrectNoteSpelling(currentIndex, root, mode);
            scaleNotes.push(note);
          }
        }

        // For scales with fewer than 7 notes, only return the actual scale notes
        const noteCount = scaleNoteCounts[mode] || 7;
        if (noteCount < 7) {
          return scaleNotes.slice(0, noteCount);
        }

        // Return notes including octave for 7-note scales
        return scaleNotes.slice(0, 8);
      }

      // Fallback to C Major if mode is invalid
      return ["C", "D", "E", "F", "G", "A", "B", "C"];
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scaleIntervals]
  );

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [openDropdown]);

  // Close sound dropdown on outside click
  useEffect(() => {
    const handleSoundClickOutside = (event: MouseEvent) => {
      if (soundDropdownRef.current && !soundDropdownRef.current.contains(event.target as Node)) {
        setShowSoundDropdown(false);
      }
    };
    if (showSoundDropdown) {
      document.addEventListener('mousedown', handleSoundClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleSoundClickOutside);
    };
  }, [showSoundDropdown]);

  // Helper: get volume icon based on current instrument volume
  const getInstrumentVolumeIcon = () => {
    if (instrumentVolume === 0) return FaVolumeMute;
    if (instrumentVolume < 0.33) return FaVolumeOff;
    if (instrumentVolume < 0.66) return FaVolumeDown;
    return FaVolumeUp;
  };

  const maxBpm = 140;
  const minBpm = 75;

  // BPM values for dice cycling animation
  const bpmCycleOptions = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => String(75 + i * 5)),
  []);

  
  const sounds = [
    "Clean Guitar Plucks",
    "Muted Electric Guitar",
    "Ambient Guitar Swells",
    "Fingerpicked Acoustic",
    "Tremolo Guitar",
    "Octave Lead Guitar",
    "Slide Ambient Guitar",
    "Harmonic Chime Guitar",
    "Soft Felt Piano",
    "Bright Pop Piano",
    "Detuned Synth Lead",
    "Analog Pad",
    "Mono Synth Bass",
    "Vintage Poly Synth",
    "Plucky Synth",
    "Tape Warped Keys",
    "Warm String Pad",
    "Bowed Drone",
    "Shimmer Pad",
    "Reverse Swells",
    "Granular Texture",
    "Lo-Fi Warble",
    "Distant Choir",
    "Airy Vocal Pad",
    "Sub Bass",
    "Driving Pick Bass",
    "Fretless Bass",
    "Synth Pulse Bass",
    "Distorted Bass",
    "Whistle Lead",
    "Bell Melody",
    "Glassy Arp",
    "Music Box",
    "Dreamy Flute",
    "Marimba Pattern",
    "Kalimba Plucks",
    "Syncopated Pluck",
    "Gated Pad",
    "Rhythmic Stabs",
    "Chorus Clean Guitar",
    "Palm Muted Riff",
    "Acoustic Harmonics",
    "Reverb Drenched Guitar",
    "12-String Jangle",
    "Electric Piano Rhodes",
    "Dark Upright Piano",
    "Tape Piano",
    "Ambient Piano Swells",
    "House Piano Chords",
    "FM Bell Keys",
    "Soft Organ Pad",
    "Vintage Organ",
    "Wurlitzer Keys",
    "Analog Brass Synth",
    "Wide Supersaw",
    "Soft Square Lead",
    "Resonant Filter Sweep",
    "Modulated Pad",
    "Slow Attack Pad",
    "Detuned Pad Stack",
    "Synth Choir",
    "Low String Ensemble",
    "High String Ensemble",
    "Cinematic Strings",
    "Plucked Strings",
    "Hybrid Orchestral Hit",
    "Subby 808 Bass",
    "Warm Analog Bass",
    "Rubber Bass",
    "Deep Moog Bass",
    "Saturated Bassline",
    "Falsetto Vocal Chop",
    "Vocal Texture Pad",
    "Breathy Vox Lead",
    "Layered Harmonies",
    "Filtered Vocal Loop",
    "Soft Clarinet",
    "Oboe Lead",
    "Muted Trumpet",
    "French Horn Swell",
    "Cinematic Brass",
    "Harp Gliss",
    "Harp Plucks",
    "Celesta",
    "Vibraphone",
    "Steel Drums",
    "Handpan",
    "Mallet Arpeggio",
    "Percussive Piano",
    "Staccato Strings",
    "Short Synth Stab",
    "Sync Arp",
    "Triplet Arpeggio",
    "Evolving Soundscape",
    "Noisy Texture Layer",
    "Reverse Piano",
    "Ambient Noise Bed",
    "Jangly 12-String Guitar",
    "Sitar",
    "Bowed Cello",
    "Plucked Cello",
    "Plucked Violin",
    "Violin Arpeggio",
    "Violin Gliss",
    "Violin Plucks",
    "P-Bass with Pick",
    "Motown-Style Bass Groove",
    "Walking Bass",
    "Psychedelic Fuzz",
    "Rotary Organ",
    "Harpsichord",
    "Mellotron Flutes",
    "Mellotron Strings",
    "Tape-Reversed Guitar",
    "Surf Guitar"
  ];

  const getRandomIndex = (n: number) => Math.floor(Math.random() * n);

  const getRandomValueDifferentFromCurrent = (array: string[], current: string): string => {
    if (array.length <= 1) return current; // If only one option, we can't change

    // For root notes, prefer common keys (weighted random)
    if (array === roots) {
      // Define common keys (more likely to be selected)
      const commonKeys = ["C", "D", "E", "F", "G", "A", "B", "B♭", "E♭", "A♭", "F♯"];
      const lessCommonKeys = ["D♭", "G♭", "C♯", "D♯", "G♯", "A♯"];

      // Weight: 70% common, 25% less common, 5% rare
      let pool: string[] = [];
      const rand = Math.random();

      if (rand < 0.70 && commonKeys.includes(current) === false) {
        pool = commonKeys;
      } else if (rand < 0.95 && lessCommonKeys.includes(current) === false) {
        pool = [...commonKeys, ...lessCommonKeys];
      } else {
        pool = array;
      }

      // Filter out current value and get random from pool
      const available = pool.filter(key => key !== current);
      if (available.length === 0) return current;

      return available[getRandomIndex(available.length)];
    }

    // For other arrays, use standard random selection
    let newValue;
    do {
      newValue = array[getRandomIndex(array.length)];
    } while (newValue === current && array.length > 1);

    return newValue;
  };
  
  const getRandomBpmDifferentFromCurrent = (min: number, max: number, current: string): string => {
    if (max - min <= 1) return current; // If only one option, we can't change
    
    const currentBpm = parseInt(current);
    let newBpm;
    
    do {
      newBpm = getRandomIndex(max + 1);
      if (newBpm < min) newBpm = min;
    } while (newBpm === currentBpm && max - min > 1);
    
    return newBpm.toString();
  };

  const rollDice = () => {
    if (allRolling) return;
    console.log('Rolling dice...', { locked, currentValues: { rootEl, scaleEl, bpmEl, soundEl, timeSignatureEl } });
    setAnimate(false);

    // Collect all updates to batch them
    const updates: Record<string, any> = {};

    // Generate new random values
    let newRoot = rootEl;
    let newScale = scaleEl;
    let newSound = soundEl;
    let newBpm = bpmEl;
    let newTs = timeSignatureEl;

    // ROOT
    if (!locked.root) {
      newRoot = getRandomValueDifferentFromCurrent(roots, rootEl);
      console.log('New root:', newRoot, 'Old root:', rootEl);
      updates.rootEl = newRoot;
    }

    // SCALE + original pattern
    if (!locked.scale) {
      newScale = getRandomValueDifferentFromCurrent(scales, scaleEl);
      console.log('New scale:', newScale, 'Old scale:', scaleEl);
      updates.scaleEl = newScale;
      updates.tonesEl = scalePatterns[newScale as keyof typeof scalePatterns];
    }

    // COMPUTED scale tones with dashes/spaces (use the new values)
    const tonesArr = generateScaleTonesMemoized(newRoot, newScale);
    updates.tonesArrEl = tonesArr;

    // SOUND
    if (!locked.sound) {
      newSound = getRandomValueDifferentFromCurrent(sounds, soundEl);
      console.log('New sound:', newSound, 'Old sound:', soundEl);
      updates.soundEl = newSound;
    }

    // BPM
    if (!locked.bpm) {
      newBpm = getRandomBpmDifferentFromCurrent(minBpm, maxBpm, bpmEl);
      console.log('New BPM:', newBpm, 'Old BPM:', bpmEl);
      updates.bpmEl = newBpm;
    }

    // TIME SIGNATURE
    if (!locked.timeSignature) {
      newTs = getRandomValueDifferentFromCurrent(TIME_SIGNATURE_OPTIONS, timeSignatureEl);
      console.log('New Time Signature:', newTs, 'Old:', timeSignatureEl);
      updates.timeSignatureEl = newTs;
    }

    const applyUpdates = () => {
      // Apply all updates at once if batch update function is available
      if (onBatchUpdate && Object.keys(updates).length > 0) {
        console.log('Batching updates:', updates);
        onBatchUpdate(updates);
      } else {
        // Fallback to individual updates
        if (updates.rootEl) setRootEl(updates.rootEl);
        if (updates.scaleEl) setScaleEl(updates.scaleEl);
        if (updates.tonesEl) setTonesEl(updates.tonesEl);
        if (updates.tonesArrEl) setTonesArrEl(updates.tonesArrEl);
        if (updates.soundEl) setSoundEl(updates.soundEl);
        if (updates.bpmEl) setBpmEl(updates.bpmEl);
        if (updates.timeSignatureEl) setTimeSignatureEl(updates.timeSignatureEl);
      }
      setAnimate(true);
    };

    if (diceMode) {
      // In dice mode: animate dice for 300ms, then apply values
      setAllRolling(true);
      setTimeout(() => {
        setAllRolling(false);
        applyUpdates();
      }, 300);
    } else {
      applyUpdates();
    }
  };

  const toggleLock = (param: keyof LockedState) =>
    setLocked((s) => ({ ...s, [param]: !s[param] }));

  // Handler for selecting a root note from dropdown
  const handleRootSelect = (newRoot: string) => {
    if (locked.root) return;

    const tonesArr = generateScaleTonesMemoized(newRoot, scaleEl);

    // Use batch update to update both values atomically
    if (onBatchUpdate) {
      onBatchUpdate({
        rootEl: newRoot,
        tonesArrEl: tonesArr
      });
    } else {
      // Fallback to individual updates if batch not available
      setRootEl(newRoot);
      setTonesArrEl(tonesArr);
    }

    setOpenDropdown(null);

    // Reset selected chord when root changes
    setSelectedChord(null);
  };

  // Handler for selecting a scale from dropdown
  const handleScaleSelect = (newScale: string) => {
    if (locked.scale) return;

    const newTonesPattern = scalePatterns[newScale as keyof typeof scalePatterns];
    const tonesArr = generateScaleTonesMemoized(rootEl, newScale);

    // Use batch update to update all values atomically
    if (onBatchUpdate) {
      onBatchUpdate({
        scaleEl: newScale,
        tonesEl: newTonesPattern,
        tonesArrEl: tonesArr
      });
    } else {
      // Fallback to individual updates if batch not available
      setScaleEl(newScale);
      setTonesEl(newTonesPattern);
      setTonesArrEl(tonesArr);
    }

    setOpenDropdown(null);

    // Reset selected chord and seventh mode when scale changes
    setSelectedChord(null);

    // Only keep seventh mode if the new scale supports it
    const noteCount = scaleNoteCounts[newScale] || 7;
    if (noteCount < 7) {
      setIsSeventhMode(false);
    }
  };

  const getValueCellClass = (value: string): string => {
    if (value.length > 30) return 'very-long-content';
    if (value.length > 20) return 'long-content';
    return '';
  };

  // Function to determine if scale supports seventh chords
  const canUseSeventhChords = () => {
    const noteCount = scaleNoteCounts[scaleEl] || 7;
    return noteCount >= 7;
  };

  // Function to get seventh chord quality suffix
  const getSeventhChordSuffix = (index: number, baseQuality: string | null): string => {
    if (!baseQuality) return 'maj7';  // Default major 7th

    // Map base chord qualities to seventh chord types
    if (baseQuality === '') return 'maj7';  // Major → Major 7th
    if (baseQuality === 'm') return 'm7';   // Minor → Minor 7th
    if (baseQuality === 'dim') return 'dim7'; // Diminished → Diminished 7th
    if (baseQuality === 'aug') return 'maj7+5'; // Augmented → Major 7th #5

    // For dominant (V chord in major/minor keys), use dominant 7th
    if (scaleEl === 'Major' && index === 4) return '7'; // V7 in major
    if (scaleEl === 'Minor' && index === 4) return '7'; // V7 in minor (if using harmonic minor)

    return 'maj7';
  };

  // Update the getChordNames function for better chord generation logic
  const getChordNames = () => {
    if (!rootEl || !scaleEl || !tonesArrEl || tonesArrEl.length < 3) {
      return ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'];
    }

    const qualities = chordQualities[scaleEl as keyof typeof chordQualities] || chordQualities.Major;
    const noteCount = scaleNoteCounts[scaleEl] || 7;

    return romanNumerals.slice(0, 7).map((_, index) => {
      // For scales with fewer notes, only generate chords where possible
      if (index >= noteCount) {
        return "—";
      }

      // Check if the chord quality is null (indicating no valid chord can be formed)
      if (qualities[index] === null) {
        return "—";
      }

      // For scales with 5 or 6 notes, verify that we can form a proper triad
      if (noteCount < 7) {
        // Check if we can form a proper triad by building on this scale degree
        const rootIndex = index;
        const thirdIndex = (index + 2) % noteCount;
        const fifthIndex = (index + 4) % noteCount;

        // Verify that root, third, and fifth are distinct notes
        const distinct = new Set([rootIndex, thirdIndex, fifthIndex]).size === 3;

        if (!distinct) {
          return "—";
        }
      }

      // Generate chord name based on mode (triad or seventh)
      let chordName = `${tonesArrEl[index]}${qualities[index] || ''}`;

      // If in seventh mode and scale supports it, add seventh chord suffix
      if (isSeventhMode && noteCount >= 7) {
        const seventhSuffix = getSeventhChordSuffix(index, qualities[index]);
        // Replace base quality with seventh quality
        if (qualities[index] === '') {
          // Major chord - replace with appropriate seventh
          chordName = `${tonesArrEl[index]}${seventhSuffix}`;
        } else if (qualities[index] === 'm') {
          // Minor chord
          chordName = `${tonesArrEl[index]}m7`;
        } else if (qualities[index] === 'dim') {
          // Diminished
          chordName = `${tonesArrEl[index]}dim7`;
        } else if (qualities[index] === 'aug') {
          // Augmented
          chordName = `${tonesArrEl[index]}maj7♯5`;
        }
      }

      return chordName;
    });
  };

  // Update getHighlightType function to handle different scale types and seventh chords
  const getHighlightType = (noteIndex: number): 'root' | 'chord' | 'seventh' | 'none' => {
    if (selectedChord === null) return 'none';

    const noteCount = scaleNoteCounts[scaleEl] || 7;

    // If this is the root note of the selected chord
    if (noteIndex === selectedChord) return 'root';

    // If the scale has fewer than 7 notes, adjust the chord building logic
    if (noteCount < 7) {
      // For scales with fewer notes, can't build proper seventh chords
      // So even in seventh mode, we'll only highlight triad notes
      const thirdIndex = (selectedChord + 2) % noteCount;
      const fifthIndex = (selectedChord + 4) % noteCount;

      // Highlight the note if it's part of the chord triad
      if (noteIndex === thirdIndex || noteIndex === fifthIndex) {
        return 'chord';
      }
    } else {
      // For 7-note scales, handle seventh chords if in seventh mode
      if (isSeventhMode) {
        const thirdIndex = (selectedChord + 2) % 7;
        const fifthIndex = (selectedChord + 4) % 7;
        const seventhIndex = (selectedChord + 6) % 7;

        if (noteIndex === seventhIndex) {
          return 'seventh';
        } else if (noteIndex === thirdIndex || noteIndex === fifthIndex) {
          return 'chord';
        }
      } else {
        // Triad mode - handle special scales
        if (scaleEl === "Harmonic Minor" || scaleEl === "Double Harmonic" || scaleEl === "Hungarian Minor") {
          // Handle augmented or diminished chords in these scales specially
          if (chordQualities[scaleEl as keyof typeof chordQualities][selectedChord] === 'aug') {
            // For augmented chords, the fifth is raised
            const thirdIndex = (selectedChord + 2) % 7;
            // Use the raised fifth if available
            const fifthIndex = (selectedChord + 4) % 7;
            const raisedFifthIndex = (selectedChord + 5) % 7;

            if (noteIndex === thirdIndex || noteIndex === fifthIndex || noteIndex === raisedFifthIndex) {
              return 'chord';
            }
          } else if (chordQualities[scaleEl as keyof typeof chordQualities][selectedChord] === 'dim') {
            // For diminished chords, the fifth is lowered
            const thirdIndex = (selectedChord + 2) % 7;
            const flattenedFifthIndex = (selectedChord + 3) % 7;

            if (noteIndex === thirdIndex || noteIndex === flattenedFifthIndex) {
              return 'chord';
            }
          } else {
            // Standard triad pattern for other chords
            const thirdIndex = (selectedChord + 2) % 7;
            const fifthIndex = (selectedChord + 4) % 7;

            if (noteIndex === thirdIndex || noteIndex === fifthIndex) {
              return 'chord';
            }
          }
        } else {
          // Standard 7-note scales
          // Standard triad pattern for most chords
          const thirdIndex = (selectedChord + 2) % 7;
          const fifthIndex = (selectedChord + 4) % 7;

          if (noteIndex === thirdIndex || noteIndex === fifthIndex) {
            return 'chord';
          }
        }
      }
    }

    return 'none';
  };

  // Handle chord selection with improved logic for various scales
  const handleChordClick = (chordIndex: number) => {
    const noteCount = scaleNoteCounts[scaleEl] || 7;
    const chordName = getChordNames()[chordIndex];
    
    // Don't allow clicking on invalid chord positions
    if (chordName === "—" || chordIndex >= noteCount) {
      return;
    }
    
    // If clicking the same chord, toggle it off
    if (selectedChord === chordIndex) {
      setSelectedChord(null);
    } else {
      setSelectedChord(chordIndex);
    }
  };

  // Modify returnIntervalPattern function to map the correct semitone intervals to the scale
  const getSemitoneIntervals = (scaleType: string): number[] => {
    const intervalMap: Record<string, number[]> = {
      Major: [2, 2, 1, 2, 2, 2, 1],
      Minor: [2, 1, 2, 2, 1, 2, 2],
      Dorian: [2, 1, 2, 2, 2, 1, 2],
      Phrygian: [1, 2, 2, 2, 1, 2, 2],
      Lydian: [2, 2, 2, 1, 2, 2, 1],
      Mixolydian: [2, 2, 1, 2, 2, 1, 2],
      Locrian: [1, 2, 2, 1, 2, 2, 2],
    };

    return intervalMap[scaleType as keyof typeof intervalMap] || [2, 2, 1, 2, 2, 2, 1];
  };

  // Note to frequency mapping (equal temperament, A4 = 440Hz)
  const noteToFrequency = (note: string, octave: number = 4): number => {
    const noteMap: Record<string, number> = {
      'C': -9, 'C♯': -8, 'C#': -8, 'D♭': -8,
      'D': -7, 'D♯': -6, 'D#': -6, 'E♭': -6,
      'E': -5, 'F♭': -5, 'E♯': -4, 'E#': -4,
      'F': -4, 'F♯': -3, 'F#': -3, 'G♭': -3,
      'G': -2, 'G♯': -1, 'G#': -1, 'A♭': -1,
      'A': 0, 'A♯': 1, 'A#': 1, 'B♭': 1,
      'B': 2, 'C♭': 2, 'B♯': -9, 'B#': -9
    };

    const semitoneOffset = noteMap[note] || 0;
    const a4Frequency = 440;
    const semitonesFromA4 = (octave - 4) * 12 + semitoneOffset;
    return a4Frequency * Math.pow(2, semitonesFromA4 / 12);
  };

  // Get the chromatic position of a note for comparison
  const getNoteChromatic = useCallback((note: string): number => {
    const noteMap: Record<string, number> = {
      'C': 0, 'C♯': 1, 'C#': 1, 'D♭': 1,
      'D': 2, 'D♯': 3, 'D#': 3, 'E♭': 3,
      'E': 4, 'F♭': 4, 'E♯': 5, 'E#': 5,
      'F': 5, 'F♯': 6, 'F#': 6, 'G♭': 6,
      'G': 7, 'G♯': 8, 'G#': 8, 'A♭': 8,
      'A': 9, 'A♯': 10, 'A#': 10, 'B♭': 10,
      'B': 11, 'C♭': 11, 'B♯': 0, 'B#': 0
    };
    return noteMap[note] || 0;
  }, []);

  // Create and play a note using Web Audio API
  const playNote = useCallback(async (frequency: number, duration: number = 200): Promise<void> => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;

    // Resume audio context if it's suspended (prevents timing issues)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Always use fresh current time to prevent note buildup
    const currentTime = ctx.currentTime;
    const durationSec = duration / 1000;

    // Create oscillator and gain nodes
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Apply theme sound profile (read from refs for live updates mid-playback)
    const profile = getSequenceProfile(instrumentThemeRef.current);
    const { extraNodes } = profile.setup(ctx, oscillator, gainNode, frequency);
    profile.envelope(gainNode, currentTime, durationSec);

    // Master volume gain (read from ref for live updates mid-playback)
    const masterGain = ctx.createGain();
    masterGain.gain.value = instrumentVolumeRef.current;

    // Connect nodes (osc → extraNodes → gain → master → destination)
    if (extraNodes && extraNodes.length > 0) {
      oscillator.connect(extraNodes[0]);
      for (let i = 0; i < extraNodes.length - 1; i++) {
        extraNodes[i].connect(extraNodes[i + 1]);
      }
      (extraNodes[extraNodes.length - 1] as AudioNode).connect(gainNode);
    } else {
      oscillator.connect(gainNode);
    }
    gainNode.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Start and stop oscillator
    oscillator.start(currentTime);
    oscillator.stop(currentTime + durationSec + 0.05);

    // Track oscillator + masterGain for cleanup (disconnecting masterGain
    // silences everything upstream, including untracked secondary oscillators)
    const noteEntry = { oscillator, masterGain };
    activeNotesRef.current.push(noteEntry);

    oscillator.onended = () => {
      const index = activeNotesRef.current.indexOf(noteEntry);
      if (index > -1) {
        activeNotesRef.current.splice(index, 1);
      }
    };

    // Wait for the note to finish
    return new Promise(resolve => {
      setTimeout(resolve, duration);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Play scale or chord arpeggio
  const playSequence = useCallback(async () => {
    // Stop any active notes — disconnect masterGain to silence all upstream
    // nodes instantly (including untracked secondary oscillators from profiles)
    activeNotesRef.current.forEach(({ oscillator, masterGain }) => {
      try {
        masterGain.disconnect();
        oscillator.stop();
      } catch (e) {
        // Nodes might already be stopped/disconnected
      }
    });
    activeNotesRef.current = [];

    if (isPlayingRef.current) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setPlayingNoteIndex(-1);
      return;
    }

    isPlayingRef.current = true;
    setIsPlaying(true);
    const noteCount = scaleNoteCounts[scaleEl] || 7;
    const beatDuration = Math.round(60000 / (parseInt(bpmEl, 10) || 120)); // ms per beat

    if (selectedChord !== null) {
      // Build chord notes based on inversion
      const chordNotes: { index: number; octaveAdjust: number }[] = [];

      // Define the chord tones indices
      const rootIndex = selectedChord;
      const thirdIndex = (selectedChord + 2) % noteCount;
      const fifthIndex = (selectedChord + 4) % noteCount;
      const seventhIndex = isSeventhMode && noteCount >= 7 ? (selectedChord + 6) % 7 : -1;

      // Root position: root -> third -> fifth (-> seventh)
      const noteOrder = [rootIndex, thirdIndex, fifthIndex];
      if (seventhIndex !== -1) noteOrder.push(seventhIndex);

      // Calculate octave adjustments to ensure ascending notes
      let prevChromatic = -1;
      let currentOctave = 0;

      for (const noteIndex of noteOrder) {
        const note = tonesArrEl[noteIndex];
        const noteChromatic = getNoteChromatic(note);

        // If this note is lower than or equal to previous, move to next octave
        if (prevChromatic !== -1 && noteChromatic <= prevChromatic) {
          currentOctave = 1;
        }

        chordNotes.push({ index: noteIndex, octaveAdjust: currentOctave });
        prevChromatic = noteChromatic + (currentOctave * 12);
      }

      // Play chord notes in order
      for (const { index, octaveAdjust } of chordNotes) {
        if (!isPlayingRef.current) break;

        const note = tonesArrEl[index];
        if (!note) continue;

        setPlayingNoteIndex(index);
        const frequency = noteToFrequency(note, 4 + octaveAdjust);
        await playNote(frequency, beatDuration);
      }
    } else {
      // Play full scale - ensure ascending order
      let prevChromatic = -1;
      let currentOctave = 4;

      for (let i = 0; i < noteCount; i++) {
        if (!isPlayingRef.current) break;

        const note = tonesArrEl[i];
        if (!note) continue;

        const noteChromatic = getNoteChromatic(note);

        // If this note is lower than or equal to the previous, we need next octave
        if (i > 0 && noteChromatic <= prevChromatic) {
          currentOctave++;
        }

        prevChromatic = noteChromatic;
        setPlayingNoteIndex(i);
        const frequency = noteToFrequency(note, currentOctave);
        await playNote(frequency, beatDuration);
      }

      // Play root note one octave up to complete the scale
      if (isPlayingRef.current && tonesArrEl[0]) {
        const rootChromatic = getNoteChromatic(tonesArrEl[0]);
        if (rootChromatic <= prevChromatic) {
          currentOctave++;
        }
        setPlayingNoteIndex(0);
        const frequency = noteToFrequency(tonesArrEl[0], currentOctave);
        await playNote(frequency, beatDuration);
      }
    }

    isPlayingRef.current = false;
    setIsPlaying(false);
    setPlayingNoteIndex(-1);
  }, [selectedChord, scaleEl, isSeventhMode, tonesArrEl, playNote, getNoteChromatic, bpmEl]);

  // Play a single scale tone when its pill is clicked
  const handlePillClick = useCallback((index: number) => {
    const note = tonesArrEl[index];
    if (!note) return;

    // Determine octave: use ascending logic same as scale playback
    let currentOctave = 4;
    for (let i = 1; i <= index; i++) {
      const prev = getNoteChromatic(tonesArrEl[i - 1]);
      const curr = getNoteChromatic(tonesArrEl[i]);
      if (curr <= prev) currentOctave++;
    }

    const frequency = noteToFrequency(note, currentOctave);
    const beatDuration = Math.round(60000 / (parseInt(bpmEl, 10) || 120));
    setPlayingNoteIndex(index);
    playNote(frequency, beatDuration).then(() => {
      setPlayingNoteIndex(prev => prev === index ? -1 : prev);
    });
  }, [tonesArrEl, getNoteChromatic, playNote, bpmEl]);

  return (
    <div style={{ overflow: 'visible' }}>
      <InspirationCard
        className="inspiration-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >

        <DiceButton
          whileHover={{ rotate: [0, -12, 10, -8, 5, 0], transition: { duration: 0.5, repeat: Infinity, repeatDelay: 0.3 } }}
          whileTap={{ scale: 0.9 }}
          onClick={rollDice}
          animate={(animate || allRolling) ? {
            x: [0, -3, 3, -4, 4, -2, 2, 0],
            rotate: [0, -15, 12, -18, 15, -8, 5, 0],
            scale: [1, 1.05, 1.08, 1.1, 1.08, 1.05, 1.02, 1],
          } : {}}
          transition={(animate || allRolling) ? { duration: allRolling ? 0.3 : 0.5, ease: "easeOut" } : {}}
        >
          <IconWrapper><Icon icon={FaDice} size={24} /></IconWrapper>
        </DiceButton>

        <StyledTable>
          <colgroup>
            <col style={{ width: '30px' }} />
            <col style={{ width: '35px' }} />
            <col style={{ width: '120px' }} />
            <col />
          </colgroup>
          <tbody>
            {/* Table Mode - Parameter Rows */}
            {!diceMode && (<>
            <TableRow>
              <SpacerCell />
              <TableHeader>
                <LockIconWrapper
                  $isLocked={locked.root}
                  onClick={() => toggleLock("root")}
                >
                  <IconWrapper>
                    {locked.root ? <Icon icon={FaLock} size={16} /> : <Icon icon={FaUnlock} size={16} />}
                  </IconWrapper>
                </LockIconWrapper>
              </TableHeader>
              <LabelCell>Root</LabelCell>
              <ClickableValueCell
                $isLocked={locked.root}
                onClick={() => {
                  if (!locked.root) {
                    setOpenDropdown(openDropdown === 'root' ? null : 'root');
                  }
                }}
                ref={openDropdown === 'root' ? dropdownRef : undefined}
              >
                <ClickableValueInner $isLocked={locked.root} title={locked.root ? "Unlock row to edit" : undefined}>{rootEl}</ClickableValueInner>
                {openDropdown === 'root' && (
                  <RootDropdown $viewMode={rootDropdownView} onClick={(e) => e.stopPropagation()}>
                    <ViewToggle>
                      <ViewToggleOption
                        $isActive={rootDropdownView === 'grid'}
                        onMouseDown={(e) => { e.preventDefault(); setRootDropdownView('grid'); }}
                      >
                        Grid
                      </ViewToggleOption>
                      <ViewToggleOption
                        $isActive={rootDropdownView === 'circle'}
                        onMouseDown={(e) => { e.preventDefault(); setRootDropdownView('circle'); }}
                      >
                        Circle of Fifths
                      </ViewToggleOption>
                    </ViewToggle>
                    {rootDropdownView === 'grid' ? (
                      notes.map((note) => (
                        <DropdownOption
                          key={note}
                          $isSelected={rootEl === note}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleRootSelect(note);
                          }}
                        >
                          {note}
                        </DropdownOption>
                      ))
                    ) : (
                      <CircleOfFifthsSelector
                        currentRoot={rootEl}
                        onSelect={handleRootSelect}
                      />
                    )}
                  </RootDropdown>
                )}
              </ClickableValueCell>
            </TableRow>

            {/* Separator after Root row */}
            <tr>
              <SeparatorCell colSpan={4}>
                <Divider />
              </SeparatorCell>
            </tr>

            <TableRow>
              <SpacerCell />
              <TableHeader>
                <LockIconWrapper
                  $isLocked={locked.scale}
                  onClick={() => toggleLock("scale")}
                >
                  <IconWrapper>
                    {locked.scale ? <Icon icon={FaLock} size={16} /> : <Icon icon={FaUnlock} size={16} />}
                  </IconWrapper>
                </LockIconWrapper>
              </TableHeader>
              <LabelCell>Scale</LabelCell>
              <ClickableValueCell
                $isLocked={locked.scale}
                onClick={() => {
                  if (!locked.scale) {
                    setOpenDropdown(openDropdown === 'scale' ? null : 'scale');
                  }
                }}
                ref={openDropdown === 'scale' ? dropdownRef : undefined}
              >
                <ClickableValueInner $isLocked={locked.scale} title={locked.scale ? "Unlock row to edit" : undefined}>{scaleEl}</ClickableValueInner>
                {openDropdown === 'scale' && (
                  <ScaleDropdown onClick={(e) => e.stopPropagation()}>
                    {scales.map((scale) => (
                      <DropdownOption
                        key={scale}
                        $isSelected={scaleEl === scale}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleScaleSelect(scale);
                        }}
                      >
                        {scale}
                      </DropdownOption>
                    ))}
                  </ScaleDropdown>
                )}
              </ClickableValueCell>
            </TableRow>

            {/* Separator after Scale row */}
            <tr>
              <SeparatorCell colSpan={4}>
                <Divider />
              </SeparatorCell>
            </tr>

            <TableRow>
              <SpacerCell />
              <TableHeader>
                <LockIconWrapper $isLocked={locked.timeSignature} onClick={() => toggleLock("timeSignature")}>
                  <IconWrapper>
                    {locked.timeSignature ? <Icon icon={FaLock} size={16} /> : <Icon icon={FaUnlock} size={16} />}
                  </IconWrapper>
                </LockIconWrapper>
              </TableHeader>
              <LabelCell>Time Signature</LabelCell>
              <ClickableValueCell
                ref={openDropdown === 'timeSignature' ? dropdownRef as any : undefined}
                $isLocked={locked.timeSignature}
                style={{ position: 'relative', overflow: 'visible' }}
                onClick={() => {
                  if (!locked.timeSignature) {
                    setOpenDropdown(openDropdown === 'timeSignature' ? null : 'timeSignature');
                  }
                }}
              >
                <ClickableValueInner $isLocked={locked.timeSignature} title={locked.timeSignature ? "Unlock row to edit" : undefined}>
                  {timeSignatureEl}
                </ClickableValueInner>
                {openDropdown === 'timeSignature' && (
                  <TimeSignatureDropdown onClick={(e) => e.stopPropagation()}>
                    {TIME_SIGNATURE_OPTIONS.map((ts) => (
                      <DropdownOption
                        key={ts}
                        $isSelected={timeSignatureEl === ts}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (onBatchUpdate) {
                            onBatchUpdate({ timeSignatureEl: ts });
                          } else {
                            setTimeSignatureEl(ts);
                          }
                          setOpenDropdown(null);
                        }}
                      >
                        {ts}
                      </DropdownOption>
                    ))}
                  </TimeSignatureDropdown>
                )}
              </ClickableValueCell>
            </TableRow>

            {/* Separator after Time Signature row */}
            <tr>
              <SeparatorCell colSpan={4}>
                <Divider />
              </SeparatorCell>
            </tr>

            <TableRow>
              <SpacerCell />
              <TableHeader>
                <LockIconWrapper $isLocked={locked.bpm} onClick={() => toggleLock("bpm")}>
                  <IconWrapper>
                    {locked.bpm ? <Icon icon={FaLock} size={16} /> : <Icon icon={FaUnlock} size={16} />}
                  </IconWrapper>
                </LockIconWrapper>
              </TableHeader>
              <LabelCell>BPM</LabelCell>
              <BpmInputCell>
                <BpmAdjustBtn onClick={() => adjustBpm(-1)} title={locked.bpm ? "Unlock row to edit" : "Decrease BPM"} disabled={locked.bpm}>
                  <Icon icon={FaMinus} size={10} />
                </BpmAdjustBtn>
                <BpmInput
                  type="text"
                  inputMode="numeric"
                  value={bpmInput}
                  onChange={handleBpmInputChange}
                  onBlur={handleBpmInputBlur}
                  onKeyDown={handleBpmInputKeyDown}
                  onFocus={(e) => e.target.select()}
                  disabled={locked.bpm}
                  title={locked.bpm ? "Unlock row to edit" : undefined}
                />
                <BpmAdjustBtn onClick={() => adjustBpm(1)} title={locked.bpm ? "Unlock row to edit" : "Increase BPM"} disabled={locked.bpm}>
                  <Icon icon={FaPlus} size={10} />
                </BpmAdjustBtn>
              </BpmInputCell>
            </TableRow>

            {/* Separator after BPM row */}
            <tr>
              <SeparatorCell colSpan={4}>
                <Divider />
              </SeparatorCell>
            </tr>

            <TableRow>
              <SpacerCell />
              <TableHeader>
                <LockIconWrapper $isLocked={locked.sound} onClick={() => toggleLock("sound")}>
                  <IconWrapper>
                    {locked.sound ? <Icon icon={FaLock} size={16} /> : <Icon icon={FaUnlock} size={16} />}
                  </IconWrapper>
                </LockIconWrapper>
              </TableHeader>
              <LabelCell>Sound</LabelCell>
              <ValueCell className={getValueCellClass(soundEl)}>{soundEl}</ValueCell>
            </TableRow>

            {/* Separator after Sound row */}
            <tr>
              <SeparatorCell colSpan={4}>
                <Divider />
              </SeparatorCell>
            </tr>
            </>)}

            {/* Dice Mode - Parameter Dice */}
            {diceMode && (<>
              <tr>
                <td colSpan={4} style={{ padding: '8px 0' }}>
                  <DiceModeContainer>
                      {/* Root - d12 (pentagon) */}
                      <DieComponent
                        dieType="d12" paramKey="root" label="Root" value={rootEl}
                        locked={locked.root} onToggleLock={() => toggleLock('root')}
                        externalRolling={allRolling && !locked.root}
                        editable={true} options={notes as unknown as string[]}
                        renderPicker={(onClose) => (
                          <DiceRootPicker $viewMode={rootDropdownView} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                            <ViewToggle>
                              <ViewToggleOption
                                $isActive={rootDropdownView === 'grid'}
                                onMouseDown={(e) => { e.preventDefault(); setRootDropdownView('grid'); }}
                              >Grid</ViewToggleOption>
                              <ViewToggleOption
                                $isActive={rootDropdownView === 'circle'}
                                onMouseDown={(e) => { e.preventDefault(); setRootDropdownView('circle'); }}
                              >Circle of Fifths</ViewToggleOption>
                            </ViewToggle>
                            {rootDropdownView === 'grid' ? (
                              notes.map((note) => (
                                <DropdownOption
                                  key={note}
                                  $isSelected={rootEl === note}
                                  onMouseDown={(e) => { e.preventDefault(); handleRootSelect(note); onClose(); }}
                                >{note}</DropdownOption>
                              ))
                            ) : (
                              <CircleOfFifthsSelector
                                currentRoot={rootEl}
                                onSelect={(note) => { handleRootSelect(note); onClose(); }}
                              />
                            )}
                          </DiceRootPicker>
                        )}
                      />

                      {/* Scale - d8 (diamond) */}
                      <DieComponent
                        dieType="d8" paramKey="scale" label="Scale" value={scaleEl}
                        locked={locked.scale} onToggleLock={() => toggleLock('scale')}
                        externalRolling={allRolling && !locked.scale}
                        editable={true} options={scales as unknown as string[]}
                        renderPicker={(onClose) => (
                          <DiceScalePicker onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                            {scales.map((scale) => (
                              <DropdownOption
                                key={scale}
                                $isSelected={scaleEl === scale}
                                onMouseDown={(e) => { e.preventDefault(); handleScaleSelect(scale); onClose(); }}
                              >{scale}</DropdownOption>
                            ))}
                          </DiceScalePicker>
                        )}
                      />
                      {/* Time Signature - d4 (triangle) */}
                      <DieComponent
                        dieType="d4" paramKey="timeSig" label="Time Sig" value={timeSignatureEl}
                        locked={locked.timeSignature} onToggleLock={() => toggleLock('timeSignature')}
                        externalRolling={allRolling && !locked.timeSignature}
                        editable={true} options={TIME_SIGNATURE_OPTIONS}
                        renderPicker={(onClose) => (
                          <DiceTimeSigPicker onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                            {TIME_SIGNATURE_OPTIONS.map((ts) => (
                              <DropdownOption
                                key={ts}
                                $isSelected={timeSignatureEl === ts}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  if (onBatchUpdate) {
                                    onBatchUpdate({ timeSignatureEl: ts });
                                  } else {
                                    setTimeSignatureEl(ts);
                                  }
                                  onClose();
                                }}
                              >{ts}</DropdownOption>
                            ))}
                          </DiceTimeSigPicker>
                        )}
                      />

                      {/* BPM - d20 (hexagon) */}
                      <DieComponent
                        dieType="d20" paramKey="bpm" label="BPM" value={bpmEl}
                        locked={locked.bpm} onToggleLock={() => toggleLock('bpm')}
                        externalRolling={allRolling && !locked.bpm}
                        editable={true} options={bpmCycleOptions}
                        renderPicker={(onClose) => (
                          <DiceBpmPicker onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                              <BpmAdjustBtn onClick={() => adjustBpm(-1)} disabled={locked.bpm}>
                                <Icon icon={FaMinus} size={10} />
                              </BpmAdjustBtn>
                              <BpmInput
                                type="text" inputMode="numeric" value={bpmInput}
                                onChange={handleBpmInputChange}
                                onBlur={handleBpmInputBlur}
                                onKeyDown={(e) => { handleBpmInputKeyDown(e); if (e.key === 'Enter') onClose(); }}
                                onFocus={(e) => e.target.select()}
                                disabled={locked.bpm}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                              />
                              <BpmAdjustBtn onClick={() => adjustBpm(1)} disabled={locked.bpm}>
                                <Icon icon={FaPlus} size={10} />
                              </BpmAdjustBtn>
                            </div>
                          </DiceBpmPicker>
                        )}
                      />

                      {/* Sound - d6 (rounded square) */}
                      <DieComponent
                        dieType="d6" paramKey="sound" label="Sound" value={soundEl}
                        locked={locked.sound} onToggleLock={() => toggleLock('sound')}
                        externalRolling={allRolling && !locked.sound}
                        editable={false} options={sounds}
                      />
                  </DiceModeContainer>
                </td>
              </tr>
              <tr>
                <SeparatorCell colSpan={4}>
                  <Divider />
                </SeparatorCell>
              </tr>
            </>)}

            {/* Chord Degrees section integrated into the table - with seventh toggle in TableHeader */}
            <TableRow className="chord-scale-row">
              <SpacerCell />
              <TableHeader>
                <SeventhToggleButton
                  $isActive={isSeventhMode}
                  disabled={!canUseSeventhChords()}
                  onClick={() => canUseSeventhChords() && setIsSeventhMode(!isSeventhMode)}
                  title={canUseSeventhChords() ? "Toggle seventh chords" : "Scale must have 7+ notes for seventh chords"}
                >
                  7
                </SeventhToggleButton>
              </TableHeader>
              <LabelCell>
                Chord<br />Degrees
              </LabelCell>
              <ExtendedInfoCell style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <ChordDegreesContainer $noteCount={scaleNoteCounts[scaleEl] || 7} $isSeventhMode={isSeventhMode}>
                  {romanNumerals.slice(0, 7).map((numeral, index) => {
                    const noteCount = scaleNoteCounts[scaleEl] || 7;
                    const chordName = getChordNames()[index];
                    const isValidChord = chordName !== "—";
                    
                    // Only show valid chord positions for this scale
                    if (index >= noteCount) {
                      return null;
                    }
                    
                    return (
                      <ItemWrapper key={index} $isSeventhMode={isSeventhMode}>
                        <ChordDegree
                          $isSelected={selectedChord === index}
                          onClick={() => isValidChord ? handleChordClick(index) : null}
                          style={{ opacity: isValidChord ? 1 : 0.5 }}
                        >
                          {numeral}
                        </ChordDegree>
                        {isValidChord ? (
                          <ChordName $isSelected={selectedChord === index} $isSeventhMode={isSeventhMode}>
                            {chordName}
                          </ChordName>
                        ) : (
                          <TooltipWrapper>
                            <ChordName $isSelected={false} $isSeventhMode={isSeventhMode}>
                              —
                            </ChordName>
                            <Tooltip>No standard chord</Tooltip>
                          </TooltipWrapper>
                        )}
                      </ItemWrapper>
                    );
                  })}
                </ChordDegreesContainer>

              </ExtendedInfoCell>
            </TableRow>
            
            {/* Separator after Chord Degrees row */}
            <tr>
              <SeparatorCell colSpan={4}>
                <Divider />
              </SeparatorCell>
            </tr>
            
            {/* Scale Tones integrated into the table - with play button in TableHeader */}
            <TableRow className="chord-scale-row">
              <SpacerCell />
              <TableHeader>
                <PlayButton
                  $isPlaying={isPlaying}
                  onClick={playSequence}
                  title={isPlaying ? "Stop playback" : "Play scale/chord"}
                >
                  <Icon icon={isPlaying ? FaStop : FaMusic} size={14} />
                </PlayButton>
              </TableHeader>
              <LabelCell>
                Scale<br />Tones
              </LabelCell>
              <ExtendedInfoCell style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <ScaleTonesContainer $noteCount={scaleNoteCounts[scaleEl] || 7} $isSeventhMode={isSeventhMode}>
                  {tonesArrEl.map((note, index) => {
                    const noteCount = scaleNoteCounts[scaleEl] || 7;

                    // Only show scale degrees for this scale
                    if (index >= noteCount) {
                      return null;
                    }

                    const intervals = getSemitoneIntervals(scaleEl);
                    const shouldShowInterval = index < intervals.length;
                    const interval = shouldShowInterval ? intervals[index] : null;

                    return (
                      <ItemWrapper key={index} $isSeventhMode={isSeventhMode}>
                        <ScaleToneNoteUpdated
                          $highlight={getHighlightType(index)}
                          $isPlaying={playingNoteIndex === index}
                          onClick={() => handlePillClick(index)}
                        >
                          {note}
                          {shouldShowInterval && interval !== null && (
                            <IntervalLabel
                              title={interval === 1 ?
                                "Half Step (1 semitone)" :
                                interval === 3 ?
                                  "Step and a Half (3 semitones)" :
                                  `Whole Step${interval > 2 ? "s" : ""} (${interval} semitones)`}
                            >
                              +{interval}
                            </IntervalLabel>
                          )}
                        </ScaleToneNoteUpdated>
                      </ItemWrapper>
                    );
                  })}
                </ScaleTonesContainer>
              </ExtendedInfoCell>
            </TableRow>

            {/* Separator after Scale Tones row */}
            <tr>
              <SeparatorCell colSpan={4}>
                <Divider />
              </SeparatorCell>
            </tr>

            {/* Visualizer toggle buttons row */}
            <tr>
              <td colSpan={4} style={{ padding: 0 }}>
                <VisualizerButtonRow>
                  <LabeledVisualizerButton
                    $isActive={showProgressions}
                    onClick={() => setShowProgressions(!showProgressions)}
                    title="Toggle chord progressions panel"
                  >
                    <Icon icon={MdQueueMusic} size={16} />
                    Progressions
                  </LabeledVisualizerButton>
                  <LabeledVisualizerButton
                    $isActive={showPiano}
                    onClick={() => setShowPiano(!showPiano)}
                    title="Toggle piano visualization"
                  >
                    <Icon icon={GiPianoKeys} size={16} />
                    Piano
                  </LabeledVisualizerButton>
                  <LabeledVisualizerButton
                    $isActive={showGuitar}
                    onClick={() => setShowGuitar(!showGuitar)}
                    title="Toggle guitar fretboard visualization"
                  >
                    <Icon icon={FaGuitar} size={14} />
                    Fretboard
                  </LabeledVisualizerButton>
                  <div ref={soundDropdownRef} style={{ position: 'relative' }}>
                    <LabeledVisualizerButton
                      $isActive={showSoundDropdown}
                      onClick={() => setShowSoundDropdown(!showSoundDropdown)}
                      title="Sound settings"
                    >
                      <Icon icon={getInstrumentVolumeIcon()} size={14} />
                      Sound
                    </LabeledVisualizerButton>
                    <SoundDropdownPanel
                      isOpen={showSoundDropdown}
                      themeOverride={instrumentThemeOverride}
                      setThemeOverride={setInstrumentThemeOverride}
                      volume={instrumentVolume}
                      setVolume={setInstrumentVolume}
                      style={{ top: 'calc(100% + 8px)', right: 0 }}
                    />
                  </div>
                </VisualizerButtonRow>
              </td>
            </tr>
          </tbody>
        </StyledTable>

        {/* Notes Visualizer - Piano, Guitar, and Chord Progressions */}
        <NotesVisualizer
          activeNotes={tonesArrEl}
          scaleNotes={tonesArrEl}
          selectedChord={selectedChord}
          root={rootEl}
          scale={scaleEl}
          isSeventhMode={isSeventhMode}
          visualizerType="both"
          playingNoteIndex={playingNoteIndex}
          showPiano={showPiano}
          showGuitar={showGuitar}
          showProgressions={showProgressions}
          bpm={parseInt(bpmEl) || 120}
          scaleNoteCount={scaleNoteCounts[scaleEl] || 7}
          initialProgressionIndex={savedProgressionIndex}
          onSelectChord={setSelectedChord}
          onProgressionChange={handleProgressionChange}
        />
        <TipsModal
          isOpen={showTips}
          onClose={() => setShowTips(false)}
          title="About the Generator"
          content={
            <>
              <p>
                <Icon icon={FaDice} size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Click on the dice to "roll" a new set of "rules".
              </p>
              <p>
                <Icon icon={FaLock} size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                When you find a setting you like, click on the lock icon to keep it locked, then continue rolling to randomize the other unlocked parameters.
              </p>
              <p>
                <Icon icon={MdAutoAwesome} size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Click on the chord degrees to highlight the different notes from the scale that form each chord.
              </p>
              <p>
                <strong style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 6 }}>7</strong>
                Click on the icon next to "Chord Degrees" to switch between triads and seventh chords.
              </p>
              <p>
                <Icon icon={FaVolumeUp} size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Press the play button next to "Scale Tones" to hear the scale or selected chord played back.
              </p>
              <p>
                <Icon icon={GiPianoKeys} size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                <Icon icon={FaGuitar} size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Use the piano and guitar icons in the Scale Tones row to toggle interactive visualizations. Click any highlighted note on either instrument to hear it played.
              </p>
              <p>
                <Icon icon={FaGuitar} size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                The guitar fretboard uses the CAGED system — five overlapping positions (E, D, C, A, G shapes) that cover the entire neck. Use the arrow buttons to navigate between positions and see where scale notes fall across all 12 frets.
              </p>
              <p>
                <Icon icon={MdQueueMusic} size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Use the chord progressions icon in the Scale Tones row to open the progressions panel. Browse 66 named progressions across 7 genres (Pop, Rock, Jazz, Blues, Emotional, EDM, Classical) using the dropdown. Click the dice to pick a random progression, hit play to hear all chords played simultaneously in sequence, or click any chord pill to hear it individually. Piano and guitar visualizations update in real time as chords play.
              </p>
              <p>
                <Icon icon={FaDownload} size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Export any chord progression as a MIDI file using the download button. The file is named with the key, scale, and progression (e.g., "A Minor - Anthem - I V vi IV.mid") and can be dragged directly into a DAW like Ableton. Each chord gets one full bar, and the clip will follow your project tempo.
              </p>
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontWeight: 600, marginBottom: 6 }}>
                  <Icon icon={FaGuitar} size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  Tips for Practicing with the CAGED Fretboard:
                </p>
                <ul style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li>Pick one chord (like the I chord) and navigate through all five positions using the arrows. Notice how the same notes appear in different shapes — this builds your fretboard map.</li>
                  <li>In each position, look at where the root notes (cyan dots marked "R") fall. These are your anchor points. Learn to spot them instantly — they tell you where you are on the neck.</li>
                  <li>The five shapes always appear in the same order: E → D → C → A → G ascending the neck, then repeat. Once you memorize this sequence, you can find any chord anywhere.</li>
                  <li>Practice connecting positions: play the scale in one position, then slide into the next position without stopping. The overlapping frets between positions are your "bridge" notes.</li>
                  <li>Try playing the same chord progression in different positions. The voicings will sound different even though the chords are the same — this is how pros add variety to their parts.</li>
                  <li>Start with the E and A shapes — these are the most common barre chord forms you already know. Then gradually add G, C, and D shapes to unlock the full neck.</li>
                </ul>
              </div>
            </>
          }
        />
      </InspirationCard>
    </div>
  );
}
