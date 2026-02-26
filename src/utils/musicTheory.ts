/**
 * Music Theory Utilities
 *
 * Comprehensive music theory functions for proper enharmonic spelling,
 * key signatures, and scale generation with correct notation.
 */

// ============================================================================
// CORE DEFINITIONS
// ============================================================================

/**
 * All 12 chromatic notes with both sharp and flat representations
 * Using Unicode symbols for proper display: ♯ (U+266F) and ♭ (U+266D)
 */
export const CHROMATIC_NOTES_SHARPS = [
  'C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'
] as const;

export const CHROMATIC_NOTES_FLATS = [
  'C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'
] as const;

/**
 * Natural notes (white keys on piano)
 */
export const NATURAL_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;

/**
 * Enharmonic equivalents mapping
 * Maps each note to its enharmonic equivalent(s)
 */
export const ENHARMONIC_EQUIVALENTS: Record<string, string[]> = {
  // Natural notes can have sharp/flat equivalents in extreme keys
  'C': ['B♯', 'D♭♭'],
  'D': ['C𝄪', 'E♭♭'],
  'E': ['F♭', 'D𝄪'],
  'F': ['E♯', 'G♭♭'],
  'G': ['F𝄪', 'A♭♭'],
  'A': ['G𝄪', 'B♭♭'],
  'B': ['C♭', 'A𝄪'],

  // Sharp notes and their flat equivalents
  'C♯': ['D♭', 'B𝄪'],
  'D♯': ['E♭', 'C𝄪𝄪'],
  'F♯': ['G♭', 'E𝄪'],
  'G♯': ['A♭', 'F𝄪𝄪'],
  'A♯': ['B♭', 'G𝄪𝄪'],

  // Flat notes and their sharp equivalents
  'D♭': ['C♯', 'B𝄪'],
  'E♭': ['D♯', 'F♭♭'],
  'G♭': ['F♯', 'E𝄪'],
  'A♭': ['G♯', 'F𝄪𝄪'],
  'B♭': ['A♯', 'C♭♭'],

  // Double sharps (using Unicode 𝄪 U+1D12A)
  'C𝄪': ['D'],
  'D𝄪': ['E'],
  'E𝄪': ['F♯'],
  'F𝄪': ['G'],
  'G𝄪': ['A'],
  'A𝄪': ['B'],
  'B𝄪': ['C♯'],

  // Double flats (using Unicode ♭♭)
  'C♭♭': ['B♭'],
  'D♭♭': ['C'],
  'E♭♭': ['D'],
  'F♭♭': ['E♭'],
  'G♭♭': ['F'],
  'A♭♭': ['G'],
  'B♭♭': ['A'],

  // Special enharmonics
  'E♯': ['F'],
  'F♭': ['E'],
  'B♯': ['C'],
  'C♭': ['B'],
};

// ============================================================================
// KEY SIGNATURES
// ============================================================================

/**
 * Key signature definitions
 * Positive numbers = sharps, Negative numbers = flats
 */
export const KEY_SIGNATURES = {
  // Major keys
  'C Major': { accidentals: 0, type: 'none' as const },
  'G Major': { accidentals: 1, type: 'sharps' as const },
  'D Major': { accidentals: 2, type: 'sharps' as const },
  'A Major': { accidentals: 3, type: 'sharps' as const },
  'E Major': { accidentals: 4, type: 'sharps' as const },
  'B Major': { accidentals: 5, type: 'sharps' as const },
  'F♯ Major': { accidentals: 6, type: 'sharps' as const },
  'C♯ Major': { accidentals: 7, type: 'sharps' as const },
  'F Major': { accidentals: 1, type: 'flats' as const },
  'B♭ Major': { accidentals: 2, type: 'flats' as const },
  'E♭ Major': { accidentals: 3, type: 'flats' as const },
  'A♭ Major': { accidentals: 4, type: 'flats' as const },
  'D♭ Major': { accidentals: 5, type: 'flats' as const },
  'G♭ Major': { accidentals: 6, type: 'flats' as const },
  'C♭ Major': { accidentals: 7, type: 'flats' as const },

  // Minor keys (relative to major)
  'A Minor': { accidentals: 0, type: 'none' as const },
  'E Minor': { accidentals: 1, type: 'sharps' as const },
  'B Minor': { accidentals: 2, type: 'sharps' as const },
  'F♯ Minor': { accidentals: 3, type: 'sharps' as const },
  'C♯ Minor': { accidentals: 4, type: 'sharps' as const },
  'G♯ Minor': { accidentals: 5, type: 'sharps' as const },
  'D♯ Minor': { accidentals: 6, type: 'sharps' as const },
  'A♯ Minor': { accidentals: 7, type: 'sharps' as const },
  'D Minor': { accidentals: 1, type: 'flats' as const },
  'G Minor': { accidentals: 2, type: 'flats' as const },
  'C Minor': { accidentals: 3, type: 'flats' as const },
  'F Minor': { accidentals: 4, type: 'flats' as const },
  'B♭ Minor': { accidentals: 5, type: 'flats' as const },
  'E♭ Minor': { accidentals: 6, type: 'flats' as const },
  'A♭ Minor': { accidentals: 7, type: 'flats' as const },
} as const;

/**
 * Order of sharps in key signatures (Circle of Fifths)
 */
export const SHARP_ORDER = ['F♯', 'C♯', 'G♯', 'D♯', 'A♯', 'E♯', 'B♯'] as const;

/**
 * Order of flats in key signatures (Circle of Fourths)
 */
export const FLAT_ORDER = ['B♭', 'E♭', 'A♭', 'D♭', 'G♭', 'C♭', 'F♭'] as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the chromatic index of a note (0-11)
 * Handles sharps, flats, and natural notes
 */
export function getChromaticIndex(note: string): number {
  // Normalize the note first
  const normalized = normalizeNote(note);

  // Try sharps first
  let index = CHROMATIC_NOTES_SHARPS.indexOf(normalized as any);
  if (index !== -1) return index;

  // Try flats
  index = CHROMATIC_NOTES_FLATS.indexOf(normalized as any);
  if (index !== -1) return index;

  // Handle special cases
  switch (normalized) {
    case 'E♯': case 'F♭♭': return 5; // F
    case 'F♭': case 'E𝄪': return 4; // E
    case 'B♯': case 'C♭♭': return 0; // C
    case 'C♭': case 'B𝄪': return 11; // B
    default: return -1; // Invalid note
  }
}

/**
 * Normalize a note to its simplest enharmonic equivalent
 * Used for chromatic calculations
 */
export function normalizeNote(note: string): string {
  // Handle Unicode and ASCII variants
  let normalized = note
    .replace(/♯/g, '♯')  // Ensure Unicode sharp
    .replace(/#/g, '♯')  // Convert ASCII to Unicode
    .replace(/♭/g, '♭')  // Ensure Unicode flat
    .replace(/b/g, '♭'); // Convert ASCII to Unicode

  // Handle double accidentals
  if (normalized.includes('𝄪') || normalized.includes('♯♯')) {
    const base = normalized[0];
    const baseIndex = NATURAL_NOTES.indexOf(base as any);
    if (baseIndex !== -1) {
      const newIndex = (baseIndex + 2) % 7;
      const targetNote = NATURAL_NOTES[newIndex];
      // Return the enharmonic equivalent
      if (targetNote === 'C' && base === 'B') return 'C♯';
      return targetNote;
    }
  }

  if (normalized.includes('♭♭')) {
    const base = normalized[0];
    const baseIndex = NATURAL_NOTES.indexOf(base as any);
    if (baseIndex !== -1) {
      const newIndex = (baseIndex - 2 + 7) % 7;
      const targetNote = NATURAL_NOTES[newIndex];
      // Return the enharmonic equivalent
      if (targetNote === 'B' && base === 'C') return 'B♭';
      return targetNote;
    }
  }

  return normalized;
}

/**
 * Get the base letter name of a note (without accidentals)
 */
export function getBaseLetter(note: string): string {
  return note[0];
}

/**
 * Check if a note has a sharp
 */
export function hasSharp(note: string): boolean {
  return note.includes('♯') || note.includes('#') || note.includes('𝄪');
}

/**
 * Check if a note has a flat
 */
export function hasFlat(note: string): boolean {
  return note.includes('♭') || note.includes('b');
}

// ============================================================================
// KEY-AWARE NOTE SPELLING
// ============================================================================

/**
 * Get the correct enharmonic spelling for a note in a given key
 * This is the main function for ensuring proper music theory notation
 */
export function getCorrectNoteSpelling(
  chromaticIndex: number,
  keyRoot: string,
  keyType: 'Major' | 'Minor' | string
): string {
  const keyName = `${keyRoot} ${keyType}`;
  const keySignature = KEY_SIGNATURES[keyName as keyof typeof KEY_SIGNATURES];

  if (!keySignature) {
    // Fallback to sharp spelling if key not found
    return CHROMATIC_NOTES_SHARPS[chromaticIndex];
  }

  // Determine if this key uses sharps or flats
  const useSharps = keySignature.type === 'sharps' || keySignature.type === 'none';

  // Get the notes in the key signature
  const accidentalsInKey = getAccidentalsInKey(keyName);

  // Choose the appropriate chromatic scale
  const chromaticScale = useSharps ? CHROMATIC_NOTES_SHARPS : CHROMATIC_NOTES_FLATS;
  const baseNote = chromaticScale[chromaticIndex];

  // Special handling for notes that appear in the key signature
  if (accidentalsInKey.length > 0) {
    // Check if we need to use a specific spelling
    for (const accidental of accidentalsInKey) {
      if (getChromaticIndex(accidental) === chromaticIndex) {
        return accidental;
      }
    }
  }

  // Special cases for specific keys
  if (keyName === 'F Major' || keyName === 'D Minor') {
    if (chromaticIndex === 10) return 'B♭'; // Not A♯
  }

  if (keyName === 'C♯ Major' || keyName === 'A♯ Minor') {
    if (chromaticIndex === 5) return 'E♯'; // Not F
    if (chromaticIndex === 0) return 'B♯'; // Not C
  }

  if (keyName === 'F♯ Major' || keyName === 'D♯ Minor') {
    if (chromaticIndex === 5) return 'E♯'; // Not F
  }

  if (keyName === 'G♭ Major' || keyName === 'E♭ Minor') {
    if (chromaticIndex === 11) return 'C♭'; // Not B
  }

  if (keyName === 'C♭ Major' || keyName === 'A♭ Minor') {
    if (chromaticIndex === 11) return 'C♭'; // Not B
    if (chromaticIndex === 4) return 'F♭'; // Not E
  }

  return baseNote;
}

/**
 * Get the accidentals that appear in a key signature
 */
export function getAccidentalsInKey(keyName: string): string[] {
  const keySignature = KEY_SIGNATURES[keyName as keyof typeof KEY_SIGNATURES];
  if (!keySignature) return [];

  const accidentals: string[] = [];

  if (keySignature.type === 'sharps') {
    for (let i = 0; i < keySignature.accidentals; i++) {
      accidentals.push(SHARP_ORDER[i]);
    }
  } else if (keySignature.type === 'flats') {
    for (let i = 0; i < keySignature.accidentals; i++) {
      accidentals.push(FLAT_ORDER[i]);
    }
  }

  return accidentals;
}

/**
 * Generate a diatonic scale with proper note spelling
 * Ensures each letter name appears exactly once (except the octave)
 */
export function generateDiatonicScale(
  root: string,
  intervals: number[], // Semitone intervals
  keyType: 'Major' | 'Minor' | string
): string[] {
  const rootIndex = getChromaticIndex(root);
  if (rootIndex === -1) return []; // Invalid root

  const scale: string[] = [root];
  const baseLetterIndex = NATURAL_NOTES.indexOf(getBaseLetter(root) as any);
  let chromaticPosition = rootIndex;

  // Generate each scale degree
  for (let i = 0; i < intervals.length; i++) {
    chromaticPosition = (chromaticPosition + intervals[i]) % 12;

    // Calculate the expected letter name for this scale degree
    const expectedLetterIndex = (baseLetterIndex + i + 1) % 7;
    const expectedLetter = NATURAL_NOTES[expectedLetterIndex];

    // Find the correct enharmonic spelling that uses the expected letter
    const possibleNotes = [
      expectedLetter,
      expectedLetter + '♯',
      expectedLetter + '♭',
      expectedLetter + '𝄪',
      expectedLetter + '♭♭',
      expectedLetter + '♯♯'
    ];

    // Find which spelling gives us the correct chromatic pitch
    let correctSpelling = '';
    for (const spelling of possibleNotes) {
      if (getChromaticIndex(spelling) === chromaticPosition) {
        correctSpelling = spelling;
        break;
      }
    }

    // If we found a correct spelling, use it; otherwise fall back to key-aware spelling
    if (correctSpelling) {
      scale.push(correctSpelling);
    } else {
      scale.push(getCorrectNoteSpelling(chromaticPosition, root, keyType));
    }
  }

  return scale;
}

// ============================================================================
// SCALE TYPES AND MODES
// ============================================================================

/**
 * Determine if a key should use sharps or flats based on common usage
 */
export function shouldUseSharps(root: string): boolean {
  const sharpKeys = ['C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'C♯'];
  const flatKeys = ['F', 'B♭', 'E♭', 'A♭', 'D♭', 'G♭', 'C♭'];

  if (sharpKeys.includes(root)) return true;
  if (flatKeys.includes(root)) return false;

  // Default to sharps for ambiguous cases
  return true;
}

/**
 * Get the preferred enharmonic spelling for a root note
 * (e.g., prefer D♭ over C♯ for certain contexts)
 */
export function getPreferredRootSpelling(note: string): string {
  const preferredSpellings: Record<string, string> = {
    'A♯': 'B♭',  // B♭ is more common than A♯
    'D♯': 'E♭',  // E♭ is more common than D♯
    'G♯': 'A♭',  // A♭ is more common than G♯
    'C♯': 'D♭',  // Both are common, but D♭ slightly preferred
    'F♯': 'G♭',  // Both are common, context-dependent
  };

  return preferredSpellings[note] || note;
}

/**
 * Validate if a scale is correctly spelled (each letter appears once)
 */
export function isCorrectlySpelledScale(scale: string[]): boolean {
  const letters = scale.slice(0, -1).map(note => getBaseLetter(note)); // Exclude octave
  const uniqueLetters = new Set(letters);
  return uniqueLetters.size === letters.length;
}

// ============================================================================
// EXPORTS FOR TESTING
// ============================================================================

export const MusicTheory = {
  getChromaticIndex,
  normalizeNote,
  getBaseLetter,
  hasSharp,
  hasFlat,
  getCorrectNoteSpelling,
  getAccidentalsInKey,
  generateDiatonicScale,
  shouldUseSharps,
  getPreferredRootSpelling,
  isCorrectlySpelledScale,
};