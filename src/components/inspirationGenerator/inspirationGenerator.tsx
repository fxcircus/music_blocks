// src/components/Generator/Generator.tsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaDice, FaLock, FaUnlock, FaMusic, FaVolumeUp, FaStop } from 'react-icons/fa';
import { Card, CardTitle, CardIconWrapper } from '../common/StyledComponents';
import { Icon } from '../../utils/IconHelper';
import {
  generateDiatonicScale,
  getChromaticIndex,
  getCorrectNoteSpelling
} from '../../utils/musicTheory';
import NotesVisualizer from '../NotesVisualizer';
import TipsModal from '../common/TipsModal';
import HelpButton from '../common/HelpButton';
import DragHandle from '../common/DragHandle';

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

type LockedState = {
  root: boolean;
  scale: boolean;
  bpm: boolean;
  sound: boolean;
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
  soundEl: string;
  setSoundEl: (soundEl: string) => void;
  dragHandleProps?: any;
  isRecentlyDragged?: boolean;
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
  transition: all ${({ theme }) => theme.transitions.fast};
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: ${({ theme }) => theme.spacing.xs} 0;
  table-layout: auto;
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

const TableCell = styled.td`
  padding: ${({ theme }) => `${theme.spacing.xs} 0`};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
  width: 40%;
  vertical-align: middle;
  height: 100%;
  
  @media (max-width: 768px) {
    padding: ${({ theme }) => `${theme.spacing.xs} 0`};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
`;

const ValueCell = styled.td`
  padding: ${({ theme }) => `${theme.spacing.xs} 0`};
  color: ${({ theme }) => theme.colors.text};
  font-weight: 600;
  text-align: right;
  max-width: 40%;
  white-space: nowrap;
  overflow: hidden;
  vertical-align: middle;
  height: 100%;
  padding-right: ${({ theme }) => theme.spacing.lg};

  // Dynamically adjust font size for long content
  &.long-content {
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }

  &.very-long-content {
    font-size: ${({ theme }) => theme.fontSizes.xs};
  }
  
  @media (max-width: 768px) {
    padding: ${({ theme }) => `${theme.spacing.xs} 0`};
    padding-right: ${({ theme }) => theme.spacing.md};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    
    &.long-content, &.very-long-content {
      font-size: ${({ theme }) => theme.fontSizes.xs};
    }
  }
`;

const ClickableValueCell = styled(ValueCell)<{ $isLocked?: boolean }>`
  position: relative;
  cursor: ${({ $isLocked }) => $isLocked ? 'not-allowed' : 'pointer'};
  opacity: ${({ $isLocked }) => $isLocked ? 1 : 1};
  transition: color ${({ theme }) => theme.transitions.fast};
  overflow: visible; /* Override parent's overflow: hidden to show dropdowns */

  &:hover {
    color: ${({ theme, $isLocked }) =>
      $isLocked ? theme.colors.text : theme.colors.primary};
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

const RootDropdown = styled(ValueDropdown)`
  grid-template-columns: repeat(3, 1fr);
  width: 280px;
`;

const ScaleDropdown = styled(ValueDropdown)`
  grid-template-columns: repeat(2, 1fr);
  width: 320px;
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
  justify-content: ${({ $noteCount }) => $noteCount < 7 ? 'center' : 'flex-start'};
  gap: ${({ theme, $noteCount, $isSeventhMode }) =>
    $isSeventhMode ? theme.spacing.xs : $noteCount < 6 ? theme.spacing.md : theme.spacing.sm};
  overflow-x: visible;
  padding-right: ${({ theme }) => theme.spacing.sm};
  width: fit-content;
  position: relative;
  z-index: 10;

  @media (max-width: 768px) {
    justify-content: ${({ $noteCount }) => $noteCount < 7 ? 'center' : 'flex-start'};
    padding-right: ${({ theme }) => theme.spacing.xs};
    gap: ${({ theme, $noteCount, $isSeventhMode }) =>
      $isSeventhMode ? '4px' : $noteCount < 6 ? theme.spacing.sm : theme.spacing.xs};
  }
`;

// Update the ScaleTonesContainer to handle dynamic spacing
const ScaleTonesContainer = styled.div<{ $noteCount: number; $isSeventhMode?: boolean }>`
  display: flex;
  justify-content: ${({ $noteCount }) => $noteCount < 7 ? 'center' : 'flex-start'};
  gap: ${({ theme, $noteCount, $isSeventhMode }) =>
    $isSeventhMode ? theme.spacing.xs : $noteCount < 6 ? theme.spacing.md : theme.spacing.sm};
  overflow-x: visible;
  padding-right: ${({ theme }) => theme.spacing.sm};
  width: fit-content;
  position: relative;
  z-index: 10;

  @media (max-width: 768px) {
    justify-content: ${({ $noteCount }) => $noteCount < 7 ? 'center' : 'flex-start'};
    padding-right: ${({ theme }) => theme.spacing.xs};
    gap: ${({ theme, $noteCount, $isSeventhMode }) =>
      $isSeventhMode ? '4px' : $noteCount < 6 ? theme.spacing.sm : theme.spacing.xs};
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

const InspirationCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  position: relative;
`;

const HeaderControls = styled.div`
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
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

// Inversion control buttons
const InversionControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-left: ${({ theme }) => theme.spacing.sm};
`;

const InversionButton = styled.button<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background-color: ${({ $disabled }) => $disabled ? 'transparent' : 'transparent'};
  color: ${({ $disabled, theme }) =>
    $disabled ? theme.colors.border : theme.colors.textSecondary};
  border: 2px solid ${({ $disabled, theme }) =>
    $disabled ? theme.colors.border : theme.colors.border};
  cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
  transition: all ${({ theme }) => theme.transitions.fast};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: bold;

  &:hover:not(:disabled) {
    transform: scale(1.1);
    background-color: ${({ theme }) => `${theme.colors.primary}22`};
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    opacity: 0.3;
  }
`;

const InversionDisplay = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  font-weight: 500;
  min-width: 60px;
  text-align: center;
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

  @media (max-width: 768px) {
    min-width: 100%;
    padding: ${({ theme }) => `${theme.spacing.xs} 2px`};
    min-height: 40px;
  }
`;

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
  soundEl,
  setSoundEl,
  onBatchUpdate,
  dragHandleProps,
  isRecentlyDragged,
}: componentProps & { onBatchUpdate?: (updates: Record<string, any>) => void }) {
  const [locked, setLocked] = useState<LockedState>({
    root: false,
    scale: false,
    bpm: false,
    sound: false,
  });
  
  // Add state for selected chord
  const [selectedChord, setSelectedChord] = useState<number | null>(null);

  // Add state for seventh chord mode
  const [isSeventhMode, setIsSeventhMode] = useState<boolean>(false);

  // Add state for chord inversions
  const [inversionIndex, setInversionIndex] = useState<number>(0);

  // Add state for audio playback
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playingNoteIndex, setPlayingNoteIndex] = useState<number>(-1);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef<boolean>(false);

  // Add state for dropdown menus
  const [openDropdown, setOpenDropdown] = useState<'root' | 'scale' | null>(null);
  const dropdownRef = useRef<HTMLTableCellElement>(null);

  // Add state for tips modal
  const [showTips, setShowTips] = useState(false);

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
    [scaleIntervals, scaleNoteCounts]
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

  const maxBpm = 140;
  const minBpm = 75;

  
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
    console.log('Rolling dice...', { locked, currentValues: { rootEl, scaleEl, bpmEl, soundEl } });
    setAnimate(false);

    // Collect all updates to batch them
    const updates: Record<string, any> = {};

    // Generate new random values
    let newRoot = rootEl;
    let newScale = scaleEl;
    let newSound = soundEl;
    let newBpm = bpmEl;

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
    }

    setAnimate(true);
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
    setInversionIndex(0);
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
    setInversionIndex(0);

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

  // Handle inversion cycling
  const cycleInversion = (direction: 'next' | 'prev') => {
    if (selectedChord === null) return;

    const maxInversions = isSeventhMode && canUseSeventhChords() ? 4 : 3;

    if (direction === 'next') {
      setInversionIndex((prev) => (prev + 1) % maxInversions);
    } else {
      setInversionIndex((prev) => (prev - 1 + maxInversions) % maxInversions);
    }
  };

  // Get the bass note for the current inversion
  const getBassNote = (chordIndex: number, inversion: number): string => {
    if (!tonesArrEl || tonesArrEl.length === 0) return '';

    const noteCount = scaleNoteCounts[scaleEl] || 7;
    let bassIndex = chordIndex;

    // Calculate bass note based on inversion
    if (inversion === 1) {
      // First inversion - third in bass
      bassIndex = (chordIndex + 2) % noteCount;
    } else if (inversion === 2) {
      // Second inversion - fifth in bass
      bassIndex = (chordIndex + 4) % noteCount;
    } else if (inversion === 3 && isSeventhMode) {
      // Third inversion (seventh chords only) - seventh in bass
      bassIndex = (chordIndex + 6) % 7;
    }

    return tonesArrEl[bassIndex] || '';
  };

  // Reset inversion when chord changes
  useEffect(() => {
    setInversionIndex(0);
  }, [selectedChord]);

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

      // Add inversion notation if this is the selected chord and we have an inversion
      if (selectedChord === index && inversionIndex > 0) {
        const bassNote = getBassNote(index, inversionIndex);
        if (bassNote) {
          chordName = `${chordName}/${bassNote}`;
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
    const currentTime = ctx.currentTime;

    // Create oscillator and gain nodes
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Configure oscillator
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;

    // Configure envelope (ADSR)
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, currentTime + 0.01); // Attack
    gainNode.gain.linearRampToValueAtTime(0.2, currentTime + 0.05); // Decay
    gainNode.gain.linearRampToValueAtTime(0.15, currentTime + duration / 1000 - 0.05); // Sustain
    gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration / 1000); // Release

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Start and stop oscillator
    oscillator.start(currentTime);
    oscillator.stop(currentTime + duration / 1000 + 0.05);

    // Wait for the note to finish
    return new Promise(resolve => {
      setTimeout(resolve, duration);
    });
  }, []);

  // Play scale or chord arpeggio
  const playSequence = useCallback(async () => {
    if (isPlayingRef.current) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setPlayingNoteIndex(-1);
      return;
    }

    isPlayingRef.current = true;
    setIsPlaying(true);
    const noteCount = scaleNoteCounts[scaleEl] || 7;

    if (selectedChord !== null) {
      // Build chord notes based on inversion
      const chordNotes: { index: number; octaveAdjust: number }[] = [];

      // Define the chord tones indices
      const rootIndex = selectedChord;
      const thirdIndex = (selectedChord + 2) % noteCount;
      const fifthIndex = (selectedChord + 4) % noteCount;
      const seventhIndex = isSeventhMode && noteCount >= 7 ? (selectedChord + 6) % 7 : -1;

      // Build chord based on inversion
      let noteOrder: number[] = [];

      if (inversionIndex === 0) {
        // Root position: root -> third -> fifth (-> seventh)
        noteOrder = [rootIndex, thirdIndex, fifthIndex];
        if (seventhIndex !== -1) noteOrder.push(seventhIndex);
      } else if (inversionIndex === 1) {
        // First inversion: third -> fifth -> (seventh ->) root
        noteOrder = [thirdIndex, fifthIndex];
        if (seventhIndex !== -1) noteOrder.push(seventhIndex);
        noteOrder.push(rootIndex);
      } else if (inversionIndex === 2) {
        // Second inversion: fifth -> (seventh ->) root -> third
        noteOrder = [fifthIndex];
        if (seventhIndex !== -1) noteOrder.push(seventhIndex);
        noteOrder.push(rootIndex, thirdIndex);
      } else if (inversionIndex === 3 && seventhIndex !== -1) {
        // Third inversion (sevenths only): seventh -> root -> third -> fifth
        noteOrder = [seventhIndex, rootIndex, thirdIndex, fifthIndex];
      }

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
        await playNote(frequency, 250);
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
        await playNote(frequency, 250);
      }
    }

    isPlayingRef.current = false;
    setIsPlaying(false);
    setPlayingNoteIndex(-1);
  }, [selectedChord, scaleEl, isSeventhMode, tonesArrEl, playNote, getNoteChromatic, inversionIndex]);

  return (
    <div style={{ overflow: 'visible' }}>
      <InspirationCard
        className="inspiration-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <InspirationCardHeader>
          <DragHandle dragHandleProps={dragHandleProps} />
          <CardIconWrapper>
            <Icon icon={FaMusic} size={20} />
          </CardIconWrapper>
          <CardTitle>Inspiration Generator</CardTitle>
          <HeaderControls>
            <HelpButton onClick={() => setShowTips(true)} />
          </HeaderControls>
        </InspirationCardHeader>
        
        <DiceButton
          whileHover={{ rotate: 12, scale: 1.1 }}
          whileTap={{ rotate: 360, scale: 0.9 }}
          onClick={rollDice}
          animate={animate ? { rotate: [0, 360], scale: [1, 1.2, 1] } : {}}
          transition={animate ? { duration: 0.5, ease: "easeOut" } : {}}
        >
          <IconWrapper><Icon icon={FaDice} size={24} /></IconWrapper>
        </DiceButton>

        <StyledTable>
          <tbody>
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
                {rootEl}
                {openDropdown === 'root' && (
                  <RootDropdown onClick={(e) => e.stopPropagation()}>
                    {notes.map((note) => (
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
                    ))}
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
                {scaleEl}
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
                <LockIconWrapper $isLocked={locked.bpm} onClick={() => toggleLock("bpm")}>
                  <IconWrapper>
                    {locked.bpm ? <Icon icon={FaLock} size={16} /> : <Icon icon={FaUnlock} size={16} />}
                  </IconWrapper>
                </LockIconWrapper>
              </TableHeader>
              <LabelCell>BPM</LabelCell>
              <ValueCell>{bpmEl}</ValueCell>
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

                {/* Inversion Controls - show only when a chord is selected */}
                {selectedChord !== null && (
                  <InversionControls>
                    <InversionButton
                      onClick={() => cycleInversion('prev')}
                      disabled={false}
                      title="Previous inversion"
                    >
                      ←
                    </InversionButton>
                    <InversionDisplay>
                      {inversionIndex === 0 ? 'Root' :
                       inversionIndex === 1 ? '1st Inv' :
                       inversionIndex === 2 ? '2nd Inv' :
                       inversionIndex === 3 ? '3rd Inv' : 'Root'}
                    </InversionDisplay>
                    <InversionButton
                      onClick={() => cycleInversion('next')}
                      disabled={false}
                      title="Next inversion"
                    >
                      →
                    </InversionButton>
                  </InversionControls>
                )}
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
                  <Icon icon={isPlaying ? FaStop : FaVolumeUp} size={14} />
                </PlayButton>
              </TableHeader>
              <LabelCell>
                Scale<br />Tones
              </LabelCell>
              <ExtendedInfoCell>
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
          </tbody>
        </StyledTable>

        {/* Notes Visualizer - Piano and Guitar */}
        <NotesVisualizer
          activeNotes={tonesArrEl}
          scaleNotes={tonesArrEl}
          selectedChord={selectedChord}
          root={rootEl}
          scale={scaleEl}
          isSeventhMode={isSeventhMode}
          visualizerType="both"
          playingNoteIndex={playingNoteIndex}
        />
        <TipsModal
          isOpen={showTips}
          onClose={() => setShowTips(false)}
          title="About the Inspiration Generator"
          content={
            <>
              <p>
                Click on the dice to "roll" a new set of "rules".
              </p>
              <p>
                When you find a setting you like, click on the lock icon to keep it locked, then continue rolling to randomize the other unlocked parameters.
              </p>
              <p>
                Click on the chord degrees to highlight the different notes from the scale that form each chord.
              </p>
              <p>
                Click on the icon next to "Chord Degrees" to switch between triads and seventh chords.
              </p>
            </>
          }
        />
      </InspirationCard>
    </div>
  );
}
