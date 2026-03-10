import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import styled, { useTheme, ThemeProvider, keyframes } from 'styled-components';
import { FaDice, FaPlay, FaStop, FaDownload } from 'react-icons/fa';
import { Icon } from '../../../utils/IconHelper';
import { useSoundSettings } from '../../../context/SoundSettingsContext';
import { getSequenceProfile } from '../../../utils/audioProfiles';

// ─── Types ───────────────────────────────────────────────────────────

type Category = 'utility' | 'pop' | 'rock' | 'jazz' | 'blues' | 'emotional' | 'edm' | 'classical';

interface ChordProgressionDef {
  name: string;
  desc: string;
  category: Category;
  degrees: number[];
}

export interface ChordProgressionsProps {
  activeNotes: string[];
  rootNote: string;
  scaleName: string;
  isSeventhMode: boolean;
  selectedChord: number | null;
  bpm: number;
  scaleNoteCount: number;
  initialProgressionIndex?: number;
  onSelectChord: (degree: number | null) => void;
  onProgressionChange?: (index: number) => void;
}

// ─── MIDI / Chord Helpers ────────────────────────────────────────────

const NOTE_CHROMATIC_MAP: Record<string, number> = {
  'C': 0, 'C♯': 1, 'C#': 1, 'D♭': 1,
  'D': 2, 'D♯': 3, 'D#': 3, 'E♭': 3,
  'E': 4, 'F♭': 4, 'E♯': 5, 'E#': 5,
  'F': 5, 'F♯': 6, 'F#': 6, 'G♭': 6,
  'G': 7, 'G♯': 8, 'G#': 8, 'A♭': 8,
  'A': 9, 'A♯': 10, 'A#': 10, 'B♭': 10,
  'B': 11, 'C♭': 11, 'B♯': 0, 'B#': 0,
};

function buildChordTones(
  degree: number,
  activeNotes: string[],
  scaleNoteCount: number,
  isSeventhMode: boolean,
): { note: string; octave: number; chromatic: number }[] {
  const tones: { note: string; octave: number; chromatic: number }[] = [];
  const indices = [degree, (degree + 2) % scaleNoteCount, (degree + 4) % scaleNoteCount];
  if (isSeventhMode && scaleNoteCount >= 7) {
    indices.push((degree + 6) % 7);
  }

  let prevChrom = -1;
  let currentOctave = 4;
  for (const idx of indices) {
    const note = activeNotes[idx];
    if (!note) continue;
    const chrom = NOTE_CHROMATIC_MAP[note] ?? 0;
    if (prevChrom !== -1 && chrom <= prevChrom) currentOctave++;
    tones.push({ note, octave: currentOctave, chromatic: chrom });
    prevChrom = chrom;
  }
  return tones;
}

function chromaticToMidi(chromatic: number, octave: number): number {
  return chromatic + (octave + 1) * 12;
}

function getMidiFilename(
  rootNote: string,
  scaleName: string,
  progression: ChordProgressionDef,
): string {
  let romanStr = progression.degrees.map(d => ROMAN_NUMERALS[d] || '?').join(' ');
  if (romanStr.length > 50) {
    romanStr = progression.degrees.slice(0, 8).map(d => ROMAN_NUMERALS[d] || '?').join(' ') + '...';
  }
  const safe = `${rootNote} ${scaleName} - ${progression.name} - ${romanStr}`
    .replace(/♭/g, 'b')
    .replace(/♯/g, '#');
  return `${safe}.mid`;
}

function buildMidiFile(trackName: string, chords: number[][]): Uint8Array {
  const TPB = 480;
  const BAR = TPB * 4;

  function vlq(v: number): number[] {
    if (v === 0) return [0];
    const b: number[] = [];
    b.unshift(v & 0x7f);
    v >>= 7;
    while (v > 0) { b.unshift((v & 0x7f) | 0x80); v >>= 7; }
    return b;
  }

  const td: number[] = [];

  // Track name meta event
  const nb = Array.from(new TextEncoder().encode(trackName));
  td.push(0x00, 0xff, 0x03, ...vlq(nb.length), ...nb);

  for (const notes of chords) {
    for (const n of notes) {
      td.push(0x00, 0x90, n, 100);
    }
    for (let i = 0; i < notes.length; i++) {
      td.push(...vlq(i === 0 ? BAR : 0), 0x80, notes[i], 0);
    }
  }

  // End of track
  td.push(0x00, 0xff, 0x2f, 0x00);

  const hdr = [0x4d,0x54,0x68,0x64, 0,0,0,6, 0,0, 0,1, (TPB>>8)&0xff, TPB&0xff];
  const len = td.length;
  const trk = [0x4d,0x54,0x72,0x6b, (len>>24)&0xff,(len>>16)&0xff,(len>>8)&0xff,len&0xff, ...td];

  return new Uint8Array([...hdr, ...trk]);
}

// ─── Data ────────────────────────────────────────────────────────────

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'utility', label: 'Utility' },
  { key: 'pop', label: 'Pop' },
  { key: 'rock', label: 'Rock' },
  { key: 'jazz', label: 'Jazz' },
  { key: 'blues', label: 'Blues' },
  { key: 'emotional', label: 'Emotional' },
  { key: 'edm', label: 'EDM' },
  { key: 'classical', label: 'Classical' },
];

const ROMAN_NUMERALS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii'];

const CHORD_PROGRESSIONS: ChordProgressionDef[] = [
  // UTILITY
  { name: 'All Scale Chords', desc: 'Play through every chord in the selected scale', category: 'utility', degrees: [0, 1, 2, 3, 4, 5, 6] },
  { name: 'Cadence Sampler', desc: 'Hear the four fundamental cadences: authentic, plagal, deceptive, half', category: 'utility', degrees: [4, 0, 3, 0, 4, 5, 0, 4] },
  { name: 'Two-Chord Vamps', desc: 'Isolated chord pairs to internalize harmonic intervals', category: 'utility', degrees: [0, 3, 0, 4, 0, 5, 1, 4, 3, 4, 5, 3] },
  { name: 'Circle of Fifths Walk', desc: 'Chords ordered by fifths — each resolves naturally to the next', category: 'utility', degrees: [3, 0, 4, 1, 5, 2, 6] },

  // POP
  { name: 'Anthem', desc: "Don't Stop Believin', Let It Be, No Woman No Cry", category: 'pop', degrees: [0, 4, 5, 3] },
  { name: 'Doo-Wop', desc: "Earth Angel, Stand By Me, Perfect (Ed Sheeran)", category: 'pop', degrees: [0, 5, 3, 4] },
  { name: 'Sunshine', desc: "La Bamba, Twist and Shout, Walking on Sunshine", category: 'pop', degrees: [0, 3, 4] },
  { name: 'Bright & Steady', desc: "All Too Well, Ride (Twenty One Pilots)", category: 'pop', degrees: [0, 3, 4, 0] },
  { name: 'Hopeful Rise', desc: "Someone Like You (Adele), Africa (Toto)", category: 'pop', degrees: [0, 4, 3, 4] },
  { name: 'Warm Glow', desc: "I'm Yours (Jason Mraz), Hey Soul Sister", category: 'pop', degrees: [0, 3, 4, 3] },
  { name: 'Gentle Landing', desc: "Lean On Me, With a Little Help From My Friends", category: 'pop', degrees: [0, 0, 3, 0] },
  { name: 'Wistful', desc: "Wonderwall (Oasis), Dreams (Fleetwood Mac)", category: 'pop', degrees: [0, 2, 5, 3] },
  { name: 'Upbeat Drive', desc: "Shut Up and Dance, What Makes You Beautiful", category: 'pop', degrees: [0, 4, 1, 3] },
  { name: 'Bittersweet', desc: "Every Breath You Take, Roxanne (The Police)", category: 'pop', degrees: [0, 5, 3, 3] },
  { name: 'Soaring', desc: "Firework (Katy Perry), Fight Song", category: 'pop', degrees: [0, 3, 5, 4] },
  { name: 'Groovy Pop', desc: "Sunday Morning (Maroon 5), Satin Doll", category: 'pop', degrees: [1, 4, 0] },
  { name: 'Dreamy Float', desc: "Somewhere Over the Rainbow (IZ), Can't Help Falling in Love", category: 'pop', degrees: [0, 4, 5, 2, 3, 0, 3, 4] },
  { name: 'Tender', desc: "Let It Be Me, All of Me (John Legend)", category: 'pop', degrees: [0, 5, 1, 4] },
  { name: 'Playful Bounce', desc: "Shake It Off, Call Me Maybe", category: 'pop', degrees: [3, 0, 4, 5] },
  { name: 'Confident Strut', desc: "Uptown Funk, Treasure (Bruno Mars)", category: 'pop', degrees: [0, 3, 0, 4] },
  { name: 'Nostalgic', desc: "Graduation (Vitamin C), Memories (Maroon 5)", category: 'pop', degrees: [0, 4, 5, 2, 3, 4] },
  { name: 'Euphoric Lift', desc: "Viva La Vida, Clocks (Coldplay)", category: 'pop', degrees: [3, 4, 0, 5] },
  { name: 'Sweet Resolution', desc: "Hallelujah (Leonard Cohen), The Scientist", category: 'pop', degrees: [0, 5, 0, 3] },
  { name: 'Vulnerable', desc: "Stay With Me (Sam Smith), Skinny Love", category: 'pop', degrees: [0, 2, 5] },

  // ROCK
  { name: 'Power Trio', desc: "Johnny B. Goode, La Bamba, Louie Louie", category: 'rock', degrees: [0, 3, 4] },
  { name: 'Highway Drive', desc: "Sweet Home Alabama, Lynyrd Skynyrd jams", category: 'rock', degrees: [4, 3, 0] },
  { name: 'Stadium Roar', desc: "Don't Stop Believin', Livin' on a Prayer", category: 'rock', degrees: [0, 4, 5, 3] },
  { name: 'Defiant March', desc: "Boulevard of Broken Dreams, The Passenger", category: 'rock', degrees: [5, 3, 0, 4] },
  { name: 'Garage Bash', desc: "Wild Thing, Blitzkrieg Bop, Louie Louie", category: 'rock', degrees: [0, 3, 4, 3] },
  { name: 'Brooding Edge', desc: "Creep (Radiohead), Take Me to Church", category: 'rock', degrees: [0, 2, 3, 3] },
  { name: 'Grunge Sway', desc: "Smells Like Teen Spirit, Come As You Are", category: 'rock', degrees: [0, 3, 5, 4] },
  { name: 'Dark Tension', desc: "Paint It Black, Hit the Road Jack", category: 'rock', degrees: [5, 4, 3, 4] },
  { name: 'Classic Ballad', desc: "Knockin' on Heaven's Door, Time of Your Life", category: 'rock', degrees: [0, 4, 1, 0] },
  { name: 'Punk Sprint', desc: "Basket Case, American Idiot (Green Day)", category: 'rock', degrees: [0, 3, 0, 4, 0, 3] },
  { name: 'Rebel Yell', desc: "Born to Run, Rock and Roll All Nite", category: 'rock', degrees: [0, 0, 3, 4] },
  { name: 'Desert Road', desc: "Free Bird solo, Hotel California outro", category: 'rock', degrees: [5, 4, 3, 2] },
  { name: 'Moody Drift', desc: "Wish You Were Here, Comfortably Numb", category: 'rock', degrees: [0, 5, 3, 0] },
  { name: 'Explosive Drop', desc: "Eye of the Tiger, We Will Rock You", category: 'rock', degrees: [0, 0, 0, 3, 4, 0] },
  { name: 'Riff Machine', desc: "Smoke on the Water, Iron Man", category: 'rock', degrees: [0, 2, 3] },
  { name: 'Anthemic Climb', desc: "Stairway to Heaven, November Rain", category: 'rock', degrees: [5, 0, 4, 3] },
  { name: 'Swagger', desc: "Back in Black, Satisfaction (Rolling Stones)", category: 'rock', degrees: [0, 3, 4, 4] },
  { name: 'Haunted', desc: "Black Sabbath, Paranoid", category: 'rock', degrees: [0, 5, 2, 4] },
  { name: 'Arena Closer', desc: "We Are the Champions, Bohemian Rhapsody ending", category: 'rock', degrees: [0, 0, 3, 0, 4, 3, 0] },
  { name: 'Gritty Stomp', desc: "Seven Nation Army, Crazy Train intro", category: 'rock', degrees: [0, 0, 3, 0, 4, 3] },

  // JAZZ
  { name: 'Smooth Landing', desc: "Sunday Morning (Maroon 5), Take the A Train", category: 'jazz', degrees: [1, 4, 0] },
  { name: 'Golden Age', desc: "I Got Rhythm, Island in the Sun (Weezer)", category: 'jazz', degrees: [0, 5, 1, 4] },
  { name: 'Full Circle', desc: "Fly Me to the Moon, All the Things You Are", category: 'jazz', degrees: [2, 5, 1, 4] },
  { name: 'Sophisticated Walk', desc: "Autumn Leaves, classic jazz standard form", category: 'jazz', degrees: [1, 4, 0, 3, 6, 2, 5] },
  { name: 'Late Night', desc: "Blue Moon, In a Sentimental Mood", category: 'jazz', degrees: [0, 5, 0, 4] },
  { name: 'Bebop Pivot', desc: "Donna Lee, advanced jazz heads", category: 'jazz', degrees: [0, 1, 4, 0] },

  // BLUES
  { name: '12-Bar Classic', desc: "Sweet Home Chicago, Pride and Joy, The Thrill Is Gone", category: 'blues', degrees: [0, 0, 0, 0, 3, 3, 0, 0, 4, 3, 0, 4] },
  { name: 'Quick Change', desc: "Texas Flood (SRV), Stormy Monday", category: 'blues', degrees: [0, 3, 0, 0, 3, 3, 0, 0, 4, 3, 0, 4] },
  { name: 'Shuffle & Groove', desc: "Route 66, Mustang Sally", category: 'blues', degrees: [0, 3, 0, 4] },
  { name: 'Minor Ache', desc: "The Thrill Is Gone, Black Magic Woman", category: 'blues', degrees: [0, 3, 0, 4, 3, 0] },
  { name: 'Turnaround', desc: "Crossroads, every blues jam ending", category: 'blues', degrees: [0, 3, 0, 4, 0] },

  // EMOTIONAL
  { name: 'Heartbreak', desc: "Someone Like You, Apologize, Say Something", category: 'emotional', degrees: [5, 3, 0, 4] },
  { name: 'Longing', desc: "Mad World, Everybody Hurts (R.E.M.)", category: 'emotional', degrees: [5, 2, 3, 0] },
  { name: 'Bittersweet Memory', desc: "Fix You (Coldplay), Chasing Cars", category: 'emotional', degrees: [0, 2, 5, 3] },
  { name: 'Falling Apart', desc: "Hurt (Johnny Cash), Mad World", category: 'emotional', degrees: [5, 4, 3, 0] },
  { name: 'Quiet Despair', desc: "Creep (Radiohead), Skinny Love", category: 'emotional', degrees: [0, 2, 3, 3] },
  { name: 'Hopeful Tears', desc: "Let Her Go, When I Was Your Man", category: 'emotional', degrees: [5, 0, 3, 4] },

  // EDM
  { name: 'Festival Drop', desc: "Wake Me Up (Avicii), Levels, Titanium", category: 'edm', degrees: [5, 3, 0, 4] },
  { name: 'Euphoria Build', desc: "Clarity (Zedd), Don't You Worry Child", category: 'edm', degrees: [0, 4, 5, 3] },
  { name: 'Midnight Pulse', desc: "Strobe (deadmau5), Midnight City (M83)", category: 'edm', degrees: [0, 5, 3, 4] },
  { name: 'Neon Glow', desc: "Something Just Like This, Closer (Chainsmokers)", category: 'edm', degrees: [3, 0, 4, 5] },
  { name: 'Deep Space', desc: "In the Name of Love, Faded (Alan Walker)", category: 'edm', degrees: [5, 3, 4, 0] },

  // CLASSICAL
  { name: 'Canon', desc: "Pachelbel's Canon, Graduation, Memories (Maroon 5)", category: 'classical', degrees: [0, 4, 5, 2, 3, 0, 3, 4] },
  { name: 'Andalusian Descent', desc: "Flamenco, Hit the Road Jack, Stray Cat Strut", category: 'classical', degrees: [5, 4, 3, 2] },
  { name: 'Plagal Amen', desc: "Church hymn endings, gospel resolutions", category: 'classical', degrees: [3, 0] },
  { name: 'Royal Cadence', desc: "Classical finales, anthem endings", category: 'classical', degrees: [4, 0] },
];

// ─── Styled Components ───────────────────────────────────────────────

const Container = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

const diceShake = keyframes`
  0% { transform: translate(0, 0) rotate(0deg); }
  15% { transform: translate(-2px, 0) rotate(-12deg); }
  30% { transform: translate(2px, 0) rotate(10deg); }
  45% { transform: translate(-2px, 0) rotate(-8deg); }
  60% { transform: translate(2px, 0) rotate(5deg); }
  75% { transform: translate(-1px, 0) rotate(-3deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
`;

const DiceBtn = styled.button`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  padding: 4px;
  transition: color 0.15s;

  &:hover {
    color: ${({ theme }) => theme.colors.secondary};
    animation: ${diceShake} 0.5s ease infinite;
    animation-delay: 0.3s;
  }

  &:active {
    transform: scale(0.9);
    animation: none;
  }
`;

const SelectorWrapper = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
`;

const SelectorBtn = styled.button<{ $isOpen: boolean }>`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ $isOpen, theme }) =>
    $isOpen ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: 4px 8px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  font-family: inherit;
  width: 100%;
  text-align: left;
  transition: all 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const CategoryBadge = styled.span`
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: ${({ theme }) => theme.colors.primary};
  background: ${({ theme }) => `${theme.colors.primary}18`};
  padding: 1px 6px;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  flex-shrink: 0;
`;

const SelectorLabel = styled.span`
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SelectorCaret = styled.span<{ $isOpen: boolean }>`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: transform 0.15s;
  transform: ${({ $isOpen }) => $isOpen ? 'rotate(180deg)' : 'rotate(0)'};
`;

const DropdownPanel = styled.div`
  position: fixed;
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  z-index: 99999;
  max-height: 400px;
  overflow-y: auto;
  box-shadow: ${({ theme }) => theme.shadows.large};
  font-family: ${({ theme }) => theme.fontFamily};
`;

const CategoryHeader = styled.div`
  padding: 6px 10px 3px;
  font-size: 10px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  letter-spacing: 1.2px;
  text-transform: uppercase;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.card};
  position: sticky;
  top: 0;
  z-index: 1;

  &:first-child {
    border-top: none;
  }
`;

const DropdownOption = styled.button<{ $isSelected: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 1px;
  width: 100%;
  padding: 5px 10px 5px 16px;
  background: ${({ $isSelected, theme }) =>
    $isSelected ? `${theme.colors.primary}22` : 'transparent'};
  border: none;
  border-bottom: 1px solid ${({ theme }) => `${theme.colors.border}44`};
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background 0.15s;

  &:hover {
    background: ${({ theme }) => `${theme.colors.primary}11`};
  }
`;

const OptionName = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const OptionDesc = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textSecondary};
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const HeardInLabel = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  opacity: 0.7;
`;

const HeardInRow = styled.div`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-left: 38px;
  text-align: left;
`;

const PlayBtn = styled.button<{ $isPlaying: boolean }>`
  background: ${({ $isPlaying, theme }) =>
    $isPlaying ? theme.colors.primary : 'transparent'};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  color: ${({ $isPlaying, theme }) =>
    $isPlaying ? theme.colors.buttonText : theme.colors.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  transition: all 0.15s;
  flex-shrink: 0;

  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.buttonText};
    transform: scale(1.05);
  }
`;

const ChordPillsRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
  margin-left: 38px;
`;

const ChordPill = styled.button<{ $isActive: boolean; $isPlaying: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 26px;
  padding: 0 6px;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background: ${({ $isActive, $isPlaying, theme }) =>
    $isPlaying
      ? theme.colors.primary
      : $isActive
        ? `${theme.colors.primary}33`
        : `${theme.colors.primary}11`};
  color: ${({ $isPlaying, theme }) =>
    $isPlaying ? theme.colors.buttonText : theme.colors.text};
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  ${({ $isPlaying }) => $isPlaying && 'transform: scale(1.08);'}

  &:hover {
    background: ${({ theme }) => `${theme.colors.primary}55`};
    transform: scale(1.08);
  }
`;

const Arrow = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 10px;
  opacity: 0.4;
`;

const ExportBtn = styled.button`
  background: transparent;
  border: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  flex-shrink: 0;
  transition: all 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.buttonText};
    transform: scale(1.05);
  }
`;

// ─── Component ───────────────────────────────────────────────────────

const ChordProgressions: React.FC<ChordProgressionsProps> = ({
  activeNotes,
  rootNote,
  scaleName,
  isSeventhMode,
  selectedChord,
  bpm,
  scaleNoteCount,
  initialProgressionIndex = 0,
  onSelectChord,
  onProgressionChange,
}) => {
  const [globalIndex, setGlobalIndex] = useState(() => {
    const clamped = Math.max(0, Math.min(initialProgressionIndex, CHORD_PROGRESSIONS.length - 1));
    return clamped;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingChordIdx, setPlayingChordIdx] = useState(-1);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isPlayingRef = useRef(false);
  const progressionDrivenRef = useRef(false); // true when progression is driving chord changes
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeNotesRef = useRef<{ masterGain: GainNode; oscillators: OscillatorNode[] }[]>([]);
  const theme = useTheme();
  const { effectiveInstrumentTheme, instrumentVolume } = useSoundSettings();
  const instrumentThemeRef = useRef(effectiveInstrumentTheme);
  const instrumentVolumeRef = useRef(instrumentVolume);
  instrumentThemeRef.current = effectiveInstrumentTheme;
  instrumentVolumeRef.current = instrumentVolume;
  const selectorRef = useRef<HTMLDivElement>(null);
  const dropdownPanelRef = useRef<HTMLDivElement>(null);
  const selectedOptionRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const currentProgression = CHORD_PROGRESSIONS[globalIndex] || CHORD_PROGRESSIONS[0];
  const categoryLabel = CATEGORIES.find(c => c.key === currentProgression.category)?.label || '';

  // Filter degrees to only valid ones for current scale
  const effectiveDegrees = useMemo(() =>
    currentProgression.degrees.filter(d => d < scaleNoteCount),
    [currentProgression.degrees, scaleNoteCount]
  );

  // Notify parent when progression changes (for persistence)
  useEffect(() => {
    onProgressionChange?.(globalIndex);
  }, [globalIndex, onProgressionChange]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        selectorRef.current && !selectorRef.current.contains(target) &&
        (!dropdownPanelRef.current || !dropdownPanelRef.current.contains(target))
      ) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  // Auto-scroll to selected item when dropdown opens
  useEffect(() => {
    if (dropdownOpen) {
      requestAnimationFrame(() => {
        selectedOptionRef.current?.scrollIntoView({ block: 'center', behavior: 'auto' });
      });
    }
  }, [dropdownOpen]);

  // Stop playback when root/scale/bpm changes
  useEffect(() => {
    stopPlayback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootNote, activeNotes.length, scaleNoteCount]);

  // Stop playback if user manually clicks a chord degree (not from progression)
  useEffect(() => {
    if (isPlayingRef.current && !progressionDrivenRef.current) {
      stopPlayback();
    }
    progressionDrivenRef.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChord]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const randomize = () => {
    const len = CHORD_PROGRESSIONS.length;
    if (len <= 1) return;
    let idx: number;
    do {
      idx = Math.floor(Math.random() * len);
    } while (idx === globalIndex);
    setGlobalIndex(idx);
    stopPlayback();
  };

  const toggleDropdown = () => {
    if (!dropdownOpen && selectorRef.current) {
      const rect = selectorRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setDropdownOpen(o => !o);
  };

  const selectProgression = (idx: number) => {
    setGlobalIndex(idx);
    setDropdownOpen(false);
    stopPlayback();
  };

  const handlePillClick = (degree: number) => {
    if (degree >= scaleNoteCount) return;
    stopPlayback();
    progressionDrivenRef.current = true;
    onSelectChord(degree);
    const tones = buildChordTones(degree, activeNotes, scaleNoteCount, isSeventhMode);
    playChord(tones, 1.0);
  };

  // ─── Audio ───────────────────────────────────────────────────────

  const noteToFrequency = (note: string, octave: number): number => {
    const map: Record<string, number> = {
      'C': -9, 'C♯': -8, 'C#': -8, 'D♭': -8,
      'D': -7, 'D♯': -6, 'D#': -6, 'E♭': -6,
      'E': -5, 'F♭': -5, 'E♯': -4, 'E#': -4,
      'F': -4, 'F♯': -3, 'F#': -3, 'G♭': -3,
      'G': -2, 'G♯': -1, 'G#': -1, 'A♭': -1,
      'A': 0, 'A♯': 1, 'A#': 1, 'B♭': 1,
      'B': 2, 'C♭': 2, 'B♯': -9, 'B#': -9,
    };
    const semitone = map[note] ?? 0;
    return 440 * Math.pow(2, ((octave - 4) * 12 + semitone) / 12);
  };

  const playChord = useCallback((notes: { note: string; octave: number }[], duration: number) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const t = ctx.currentTime;
    const profile = getSequenceProfile(instrumentThemeRef.current);
    const volScale = 1 / notes.length; // scale down for simultaneous notes

    // Master volume gain (read from ref for live updates mid-playback)
    const masterGain = ctx.createGain();
    masterGain.gain.value = instrumentVolumeRef.current;
    masterGain.connect(ctx.destination);

    const chordOscillators: OscillatorNode[] = [];

    for (const { note, octave } of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const freq = noteToFrequency(note, octave);

      const { extraNodes } = profile.setup(ctx, osc, gain, freq);
      profile.envelope(gain, t, duration);

      // Apply volume scaling for chord voicing
      const chordGain = ctx.createGain();
      chordGain.gain.value = volScale;

      if (extraNodes && extraNodes.length > 0) {
        osc.connect(extraNodes[0]);
        for (let i = 0; i < extraNodes.length - 1; i++) {
          extraNodes[i].connect(extraNodes[i + 1]);
        }
        (extraNodes[extraNodes.length - 1] as AudioNode).connect(gain);
      } else {
        osc.connect(gain);
      }
      gain.connect(chordGain);
      chordGain.connect(masterGain);
      osc.start(t);
      osc.stop(t + duration);
      chordOscillators.push(osc);
    }

    // Track the whole chord as one entry — disconnecting masterGain
    // silences all upstream nodes including untracked secondary oscillators
    const noteEntry = { masterGain, oscillators: chordOscillators };
    activeNotesRef.current.push(noteEntry);

    // Auto-remove when the last oscillator ends
    let endedCount = 0;
    chordOscillators.forEach(osc => {
      osc.onended = () => {
        endedCount++;
        if (endedCount >= chordOscillators.length) {
          const idx = activeNotesRef.current.indexOf(noteEntry);
          if (idx > -1) activeNotesRef.current.splice(idx, 1);
        }
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopPlayback = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setPlayingChordIdx(-1);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    activeNotesRef.current.forEach(({ masterGain, oscillators }) => {
      try { masterGain.disconnect(); } catch {}
      oscillators.forEach(osc => { try { osc.stop(); } catch {} });
    });
    activeNotesRef.current = [];
  }, []);

  const startPlayback = useCallback(() => {
    if (!currentProgression || activeNotes.length === 0) return;
    if (isPlayingRef.current) {
      stopPlayback();
      onSelectChord(null);
      return;
    }

    isPlayingRef.current = true;
    setIsPlaying(true);

    const chordDuration = (60 / bpm) * 2; // half bar per chord
    const degrees = effectiveDegrees;
    const noteCount = scaleNoteCount;

    const playStep = (stepIdx: number) => {
      if (!isPlayingRef.current || stepIdx >= degrees.length) {
        stopPlayback();
        onSelectChord(null);
        return;
      }

      const degree = degrees[stepIdx];

      // Select chord in parent (triggers piano/guitar highlighting)
      progressionDrivenRef.current = true;
      onSelectChord(degree);
      setPlayingChordIdx(stepIdx);

      const chordTones = buildChordTones(degree, activeNotes, noteCount, isSeventhMode);
      playChord(chordTones, chordDuration);

      timeoutRef.current = setTimeout(() => playStep(stepIdx + 1), chordDuration * 1000);
    };

    playStep(0);
  }, [currentProgression, activeNotes, bpm, scaleNoteCount, isSeventhMode, onSelectChord, playChord, stopPlayback, effectiveDegrees]);

  const handleExport = useCallback(() => {
    if (!currentProgression) return;

    const allChordMidi: number[][] = [];
    for (const degree of effectiveDegrees) {
      const tones = buildChordTones(degree, activeNotes, scaleNoteCount, isSeventhMode);
      allChordMidi.push(tones.map(t => chromaticToMidi(t.chromatic, t.octave)));
    }

    const filename = getMidiFilename(rootNote, scaleName, currentProgression);
    const trackName = filename.replace('.mid', '');
    const data = buildMidiFile(trackName, allChordMidi);

    const blob = new Blob([data.buffer as ArrayBuffer], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProgression, activeNotes, scaleNoteCount, isSeventhMode, rootNote, scaleName]);

  if (!currentProgression) return null;

  return (
    <Container>
      <TopRow>
        <DiceBtn onClick={randomize} title="Random progression">
          <Icon icon={FaDice} size={18} />
        </DiceBtn>
        <SelectorWrapper ref={selectorRef}>
          <SelectorBtn $isOpen={dropdownOpen} onClick={toggleDropdown}>
            <CategoryBadge>{categoryLabel}</CategoryBadge>
            <SelectorLabel>{currentProgression.name}</SelectorLabel>
            <SelectorCaret $isOpen={dropdownOpen}>&#9660;</SelectorCaret>
          </SelectorBtn>
        </SelectorWrapper>
        {dropdownOpen && createPortal(
          <ThemeProvider theme={theme}>
            <DropdownPanel
              ref={dropdownPanelRef}
              style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
            >
              {CATEGORIES.map(cat => (
                <React.Fragment key={cat.key}>
                  <CategoryHeader>{cat.label}</CategoryHeader>
                  {CHORD_PROGRESSIONS.map((p, idx) =>
                    p.category === cat.key ? (
                      <DropdownOption
                        key={idx}
                        ref={idx === globalIndex ? selectedOptionRef : undefined}
                        $isSelected={idx === globalIndex}
                        onClick={() => selectProgression(idx)}
                      >
                        <OptionName>{p.name}</OptionName>
                        <OptionDesc>{p.category !== 'utility' && <HeardInLabel>Heard in </HeardInLabel>}{p.desc}</OptionDesc>
                      </DropdownOption>
                    ) : null
                  )}
                </React.Fragment>
              ))}
            </DropdownPanel>
          </ThemeProvider>,
          document.body
        )}
        <PlayBtn $isPlaying={isPlaying} onClick={startPlayback} title={isPlaying ? 'Stop' : 'Play progression'}>
          <Icon icon={isPlaying ? FaStop : FaPlay} size={12} />
        </PlayBtn>
        <ExportBtn onClick={handleExport} title="Download chord progression as MIDI file">
          <Icon icon={FaDownload} size={12} />
        </ExportBtn>
      </TopRow>

      {currentProgression.desc && (
        <HeardInRow>
          {currentProgression.category !== 'utility' && <HeardInLabel>Heard in </HeardInLabel>}{currentProgression.desc}
        </HeardInRow>
      )}

      <ChordPillsRow>
        {effectiveDegrees.map((deg, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Arrow>{'>'}</Arrow>}
            <ChordPill
              $isActive={selectedChord === deg && !isPlaying}
              $isPlaying={isPlaying && playingChordIdx === i}
              onClick={() => handlePillClick(deg)}
            >
              {ROMAN_NUMERALS[deg] || '?'}
            </ChordPill>
          </React.Fragment>
        ))}
      </ChordPillsRow>
    </Container>
  );
};

export default ChordProgressions;
