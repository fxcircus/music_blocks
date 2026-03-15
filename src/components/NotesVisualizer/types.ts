// Shared types for NotesVisualizer components

export interface Note {
  name: string;
  octave?: number;
  isSharp?: boolean;
  isFlat?: boolean;
}

export interface NotesVisualizerProps {
  activeNotes: string[];        // Currently highlighted notes from scale
  scaleNotes: string[];         // Full scale
  selectedChord: number | null; // Selected chord degree (0-6)
  inversionIndex?: number;      // Current inversion (0 = root position)
  root: string;                 // Root note
  scale: string;                // Scale type
  isSeventhMode: boolean;       // Seventh chord mode
  visualizerType: 'piano' | 'guitar' | 'both';
  playingNoteIndex?: number;    // Currently playing note (-1 if not playing)
  showPiano: boolean;
  showGuitar: boolean;
}

export interface PianoVisualizerProps {
  activeNotes: string[];
  highlightedNotes: Set<number>; // Indices of notes to highlight
  playingNoteIndex?: number;
  rootNote: string;
  isSeventhMode: boolean;
  selectedChord: number | null; // Index of selected chord root
}

export interface GuitarVisualizerProps {
  activeNotes: string[];
  highlightedNotes: Set<number>; // Indices of notes to highlight
  playingNoteIndex?: number;
  rootNote: string;
  isSeventhMode: boolean;
  selectedChord: number | null; // Index of selected chord root
}

export interface PianoKey {
  note: string;
  isBlack: boolean;
  position: number; // Chromatic position (0-11)
  isHighlighted: boolean;
  highlightType?: 'root' | 'chord' | 'seventh' | 'scale';
  isPlaying?: boolean;
}

export interface GuitarString {
  openNote: string;
  frets: GuitarFret[];
}

export interface GuitarFret {
  note: string;
  fretNumber: number;
  isHighlighted: boolean;
  highlightType?: 'root' | 'chord' | 'seventh' | 'scale';
  isPlaying?: boolean;
  isScaleRoot?: boolean;
}

// Standard guitar tuning (E-A-D-G-B-E from low to high)
export const STANDARD_TUNING = ['E', 'A', 'D', 'G', 'B', 'E'];

// Helper to get chromatic position of a note
export const getNoteChromatic = (note: string): number => {
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
};

// Helper to get note name from chromatic position
export const getChromaticNote = (position: number): string => {
  const notes = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
  return notes[position % 12];
};