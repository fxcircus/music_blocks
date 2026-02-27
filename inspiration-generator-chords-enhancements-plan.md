# Inspiration Generator – Chords Enhancements Plan

---

## SECTION 1 — Seventh Chords Toggle + Visual Updates

### Goal
Enhance the Chord Degrees system to support toggling between triads and seventh chords, including correct highlighting behavior and visual differentiation.

---

### 1.1 UI Changes

#### Toggle Icon Implementation
- **Add a Seventh Chords Toggle Icon**:
  - Position: To the left of the "Chord Degrees" row
  - Alignment: Vertically aligned with existing lock icons
  - Icon suggestion: "7" in a circle or square button
  - Must be visually distinct from the lock icon
  - Active state styling:
    - Inactive: Gray/muted (#6b7280)
    - Active: Blue accent (#3b82f6)
    - Hover: Slight opacity change (0.8)

#### Color System Updates
- **New color for seventh tone highlighting**:
  - Proposed color: Purple (#8b5cf6)
  - Must not conflict with:
    - Root highlight (currently primary accent)
    - Triad highlight (currently secondary accent)
    - Existing UI colors
    - Background colors
  - Accessibility: Must maintain WCAG AA contrast ratio

---

### 1.2 State Changes

#### New State Variables
```typescript
interface ChordState {
  isSeventhMode: boolean;  // false = triads, true = seventh chords
  seventhToggleEnabled: boolean; // Disabled for incompatible scales
}
```

#### State Behavior
- When `isSeventhMode = false` → Display and play triads (1-3-5)
- When `isSeventhMode = true` → Display and play seventh chords (1-3-5-7)
- Toggle state persists during:
  - Scale changes (if compatible)
  - Root note changes
  - Chord degree selections
- Toggle resets when:
  - Switching to incompatible scale
  - Component unmounts

---

### 1.3 Chord Construction Logic

#### Current Behavior
- Clicking a chord degree highlights 3 notes (1–3–5)
- Highlighting uses two colors: root and chord tones

#### New Behavior
- **Triad Mode** (`isSeventhMode = false`):
  - Highlight pattern: 1–3–5
  - Colors: Root (primary), 3rd & 5th (secondary)

- **Seventh Mode** (`isSeventhMode = true`):
  - Highlight pattern: 1–3–5–7
  - Colors: Root (primary), 3rd & 5th (secondary), 7th (purple)
  - Seventh must be visually distinct

#### Implementation Details
- Calculate seventh interval from scale degrees
- Use modular arithmetic for wrapping
- Maintain chord quality detection (maj7, min7, dom7, m7b5, dim7)

---

### 1.4 Edge Cases

#### Scale Compatibility Checks
- **Scales with fewer than 7 notes**:
  - Pentatonic scales (5 notes) → Disable toggle
  - Hexatonic scales (6 notes) → Disable toggle
  - Chromatic scale (12 notes) → Enable with special handling

- **Non-heptatonic scales**:
  - Octatonic (8 notes) → Enable, use degree-based calculation
  - Custom scales → Enable only if ≥ 7 unique pitches

- **Modal scales**:
  - All standard modes → Enable toggle
  - Ensure correct interval calculation

- **Custom scale edge cases**:
  - Duplicate notes → Remove duplicates first
  - Invalid intervals → Validate structure
  - Missing degrees → Fill gaps or disable

#### Fallback Rules
1. If scale length < 7 → Disable seventh toggle, show tooltip
2. If seventh interval cannot be calculated → Gracefully fallback to triad
3. Never throw runtime errors → Use try-catch blocks
4. Log warnings for debugging → Console.warn for edge cases
5. Provide user feedback → Tooltip or subtle UI indication

---

### 1.5 Required Tests

#### Functional Tests
- [ ] Toggle switches correctly between triads and sevenths
- [ ] Highlight updates immediately on toggle
- [ ] Seventh color appears only in seventh mode
- [ ] Toggle disabled for pentatonic scales
- [ ] Toggle disabled for hexatonic scales
- [ ] Toggle enabled for heptatonic+ scales
- [ ] No regression in lock system functionality
- [ ] State persists during valid scale changes
- [ ] State resets for incompatible scales
- [ ] Chord quality detection works with sevenths

#### Visual Tests
- [ ] Icon alignment correct across screen sizes
- [ ] Color contrast meets WCAG AA standards
- [ ] No layout shift when toggling
- [ ] Hover states work correctly
- [ ] Active state styling applies properly
- [ ] Disabled state clearly visible
- [ ] Touch targets meet mobile standards (44x44px)

#### Edge Case Tests
- [ ] Pentatonic scale disables toggle
- [ ] Custom 4-note scale disables toggle
- [ ] Chromatic scale enables toggle
- [ ] Rapid toggle clicking doesn't break state
- [ ] Toggle during chord selection updates correctly

---

## SECTION 2 — Play Button for Scale / Chords

### 2.1 UI Implementation

#### Play Button Design
- **Add speaker/play icon**:
  - Position: Left of "Scale Tones" row
  - Alignment: Vertically aligned with lock icons and seventh toggle
  - Icon: Use same speaker icon from Metronome block for consistency
  - States:
    - Idle: Standard icon
    - Playing: Animated wave or pulse effect
    - Disabled: Grayed out

#### Button Behavior
- Single click → Play sequence once
- During playback → Button shows playing state
- Click during playback → Stop current, start new
- Disabled when no scale selected

---

### 2.2 Audio Logic

#### Audio Engine Setup
- **Use existing audio library from Metronome block**
- Import Web Audio API utilities
- Create dedicated audio context for note playback

#### Tone Generation Requirements
- **Waveform**: Simple sine wave tone
- **Frequency mapping**: Use equal temperament (A4 = 440Hz)
- **Duration**: 200ms per note
- **Envelope**: Simple ADSR (Attack: 10ms, Decay: 50ms, Sustain: 0.7, Release: 140ms)
- **Volume**: 0.5 (adjustable in settings later)

#### Playback Behavior
- **One run only** (no looping)
- **Delay between notes**: 250ms (configurable)
- **Play as arpeggio** (sequential, not simultaneous)

#### Playback Rules
- **If chord selected**:
  - Play highlighted chord tones only
  - Order: Based on current inversion
  - Include seventh if in seventh mode

- **If no chord selected**:
  - Play full scale tones ascending
  - Start from root note
  - Play one octave

---

### 2.3 Playback Visual Feedback

#### Note Highlighting During Playback
- **When note plays**:
  - Temporarily highlight with glow effect
  - Scale: 1.1x transform
  - Duration: Match audio duration (200ms)
  - Color: Brighter version of current highlight
  - Sync precisely with audio timing

#### Animation Sequence
1. Note about to play → Pre-glow (50ms before)
2. Note playing → Full glow + scale
3. Note finishing → Fade out (100ms)
4. Next note → Repeat

#### Performance Considerations
- Use CSS animations (not JS)
- Hardware acceleration with `will-change`
- Batch DOM updates
- Cancel animations on stop

---

### 2.4 Edge Cases

#### Playback Interruption Handling
- **Rapid clicking play**:
  - Cancel current playback
  - Reset visual state
  - Start new sequence
  - No audio overlap

- **Play during inversion change**:
  - Complete current note
  - Stop playback
  - Update to new inversion
  - User must click again

- **Play during toggle mode change**:
  - Stop immediately
  - Clear all animations
  - Reset audio context

#### Audio Management
- **Prevent overlapping audio**:
  - Single audio instance
  - Queue management
  - Proper cleanup

- **Stop previous playback before new**:
  - Cancel scheduled notes
  - Clear animation timers
  - Reset visual state

#### Resource Management
- Dispose audio nodes after use
- Clear timers on unmount
- Limit concurrent sounds to 1
- Handle browser audio policy restrictions

---

### 2.5 Required Tests

#### Functional Tests
- [ ] Plays correct notes in correct order
- [ ] Scale playback includes all scale tones
- [ ] Chord playback includes only chord tones
- [ ] Correct inversion playback order
- [ ] Seventh included when enabled
- [ ] Stops after one complete run
- [ ] No memory leaks after 100 plays
- [ ] Audio context properly disposed
- [ ] Works with custom scales
- [ ] Handles missing audio context gracefully

#### UX Tests
- [ ] Visual cue perfectly synced with audio
- [ ] No perceptible lag (<50ms)
- [ ] No duplicate sound stacking
- [ ] Smooth animation performance (60fps)
- [ ] Button state updates correctly
- [ ] Works on mobile devices
- [ ] Respects system mute
- [ ] Volume consistent across notes

#### Edge Case Tests
- [ ] Rapid play button clicking handled
- [ ] Component unmount during playback
- [ ] Browser audio autoplay policy handled
- [ ] Low-performance device degradation graceful
- [ ] Multiple Inspiration Generator instances don't conflict

---

## SECTION 3 — Notes Visualizer (Piano + Guitar)

This is a major feature requiring careful architectural planning and modular design.

---

### 3.1 Architecture Decision

#### Component Structure
Create a new modular component system:

```typescript
NotesVisualizer/
├── index.tsx                 // Main container
├── PianoVisualizer/
│   ├── index.tsx             // Piano component
│   ├── PianoKey.tsx          // Individual key component
│   ├── usePianoKeyboard.ts   // Keyboard logic hook
│   └── PianoVisualizer.css   // Piano-specific styles
├── GuitarVisualizer/
│   ├── index.tsx             // Guitar component
│   ├── GuitarString.tsx      // String component
│   ├── useGuitarFretboard.ts // Fretboard logic hook
│   └── GuitarVisualizer.css  // Guitar-specific styles
└── types.ts                  // Shared types
```

#### Component Props Interface
```typescript
interface NotesVisualizerProps {
  activeNotes: Note[];        // Currently highlighted notes
  scaleNotes: Note[];         // Full scale
  selectedChord?: ChordDegree; // Selected chord (if any)
  inversionIndex: number;     // Current inversion
  root: Note;                 // Root note
  scale: Scale;               // Scale type
  isSeventhMode: boolean;     // Seventh chord mode
  visualizerType: 'piano' | 'guitar' | 'both';
}
```

#### Design Principles
- **Loose coupling**: Visualizer receives data, doesn't manage state
- **Reusability**: Can be used in other components
- **Performance**: Memoization for expensive calculations
- **Accessibility**: Keyboard navigation support

---

### 3.2 Piano Keyboard (Basic Implementation)

#### Design Requirements
- **Octave range**: 1 octave minimum (C4 to B4)
- **Expandable**: Architecture supports multi-octave later
- **Key layout**: Standard piano layout (7 white, 5 black)
- **Visual design**:
  - White keys: 25px wide, 100px tall
  - Black keys: 15px wide, 60px tall
  - Black key positioning: Standard piano offsets

#### Highlighting System
- **Root note**: Primary color with border
- **Chord tones**: Secondary color
- **Seventh**: Purple (when in seventh mode)
- **Scale tones** (no chord): Lighter shade
- **Non-scale notes**: Default (no highlight)

#### Note Mapping Logic
```typescript
// Chromatic position calculation
const getChromaticPosition = (note: Note): number => {
  // C = 0, C# = 1, D = 2, etc.
  return noteToChromatic(note) % 12;
};

// Key type determination
const isBlackKey = (position: number): boolean => {
  return [1, 3, 6, 8, 10].includes(position);
};
```

#### Edge Cases
- **Notes outside displayed octave**:
  - Show octave indicators (dots above/below)
  - Optional: Auto-scroll to active octave

- **Scales crossing octave boundaries**:
  - Wrap visualization
  - Maintain correct intervals

- **Accidentals consistency**:
  - Always use sharps for black keys in display
  - Map flats to equivalent sharps
  - Handle double sharps/flats

#### Interaction Features
- Hover effects on keys
- Click to play note (future)
- Tooltip showing note name
- Keyboard shortcuts (future)

---

### 3.3 Guitar Tab Visualizer

#### Design Requirements
- **String configuration**: 6 horizontal strings
- **Tuning**: Standard (E2, A2, D3, G3, B3, E4)
- **Fret range**: 0-5 frets initially
- **Visual design**:
  - String spacing: 20px
  - Fret spacing: 50px
  - Nut position clearly marked
  - Fret numbers displayed

#### Chord Voicing Algorithm
```typescript
// Basic approach - lowest possible playable voicing
const getBasicVoicing = (chord: Chord): FretPosition[] => {
  // 1. Find root position on low E string
  // 2. Build chord using standard shapes
  // 3. Prefer open strings when possible
  // 4. Limit stretch to 4 frets
  // 5. Return fret positions per string
};
```

#### Voicing Rules
- **Choose lowest possible playable voicing**
- **Limit to first 5 frets** for simplicity
- **No complex jazz voicings** initially
- **Basic shapes only**:
  - Major: E-shape, A-shape, C-shape
  - Minor: Em-shape, Am-shape
  - Seventh: Open position sevenths

#### Visual Feedback
- **Active notes**: Filled circles on fretboard
- **Root note**: Different color/size
- **Muted strings**: X symbol
- **Open strings**: O symbol
- **Finger positions**: Numbers (future)

#### Edge Cases
- **Unplayable voicings**:
  - Show partial chord
  - Indicate with warning icon
  - Suggest alternative position

- **Duplicate notes**:
  - Choose optimal string
  - Avoid unnecessary stretches

- **Open string handling**:
  - Prioritize when in chord
  - Show as highlighted O

- **Fret overflow**:
  - Indicate higher position needed
  - Show position marker (e.g., "5fr")

---

### 3.4 Required Tests

#### Piano Visualizer Tests
- [ ] Piano highlights correct chromatic notes
- [ ] Enharmonic equivalents handled correctly
- [ ] Root note distinctly highlighted
- [ ] Chord tones highlighted in correct color
- [ ] Seventh highlighted when in seventh mode
- [ ] Octave wrapping works correctly
- [ ] Black/white key detection accurate
- [ ] Scale changes update immediately
- [ ] No duplicate highlights
- [ ] Performance with rapid changes

#### Guitar Visualizer Tests
- [ ] Guitar highlights correct fret positions
- [ ] Standard tuning calculations correct
- [ ] Open strings displayed properly
- [ ] Muted strings indicated correctly
- [ ] Basic chord shapes accurate
- [ ] Root note on correct string
- [ ] Voicing playable by human hand
- [ ] Inversion changes update fretboard
- [ ] No impossible stretches
- [ ] Edge case handling graceful

#### Integration Tests
- [ ] Switching chords updates visualizers
- [ ] Switching root updates note mapping
- [ ] Switching between piano/guitar smooth
- [ ] No visualizer crash with unusual scales
- [ ] Memory usage stable over time
- [ ] Responsive on mobile devices
- [ ] Animations performant
- [ ] State sync maintained

---

## SECTION 4 — Chord Inversions + Dynamic Naming

---

### 4.1 Inversion State

#### State Structure
```typescript
interface InversionState {
  inversionIndex: number;  // 0 = root, 1 = first, 2 = second, 3 = third
  maxInversions: number;   // 3 for triads, 4 for sevenths
  inversionNotes: Note[];  // Current inversion note order
}
```

#### Inversion Cycling Logic
- **Root position**: inversionIndex = 0
- **First inversion**: inversionIndex = 1
- **Second inversion**: inversionIndex = 2
- **Third inversion**: inversionIndex = 3 (seventh chords only)

#### Cycling Rules
- Right arrow or button → Next inversion
- Left arrow or button → Previous inversion
- Wrap around at boundaries
- Reset to root on chord change

---

### 4.2 Inversion Logic

#### Triad Inversions
```typescript
// Original: [1, 3, 5]
const triadInversions = {
  0: [1, 3, 5],    // Root position: C-E-G
  1: [3, 5, 8],    // First inversion: E-G-C (8 = 1 + octave)
  2: [5, 8, 10]    // Second inversion: G-C-E
};
```

#### Seventh Chord Inversions
```typescript
// Original: [1, 3, 5, 7]
const seventhInversions = {
  0: [1, 3, 5, 7],    // Root position: C-E-G-B
  1: [3, 5, 7, 8],    // First: E-G-B-C
  2: [5, 7, 8, 10],   // Second: G-B-C-E
  3: [7, 8, 10, 12]   // Third: B-C-E-G
};
```

#### Implementation Requirements
- **Rotate array safely** without mutating base scale
- **Maintain octave relationships**
- **Preserve intervals** between notes
- **Handle voice leading** properly

---

### 4.3 Dynamic Chord Naming

#### Naming Convention Examples
```typescript
// Major Triad
Root position: "C"
First inversion: "C/E"
Second inversion: "C/G"

// Minor Triad
Root position: "Am"
First inversion: "Am/C"
Second inversion: "Am/E"

// Seventh Chords
Root position: "Cmaj7"
First inversion: "Cmaj7/E"
Second inversion: "Cmaj7/G"
Third inversion: "Cmaj7/B"

// Diminished
Root position: "Bdim"
First inversion: "Bdim/D"
Second inversion: "Bdim/F"
```

#### Chord Quality Detection
```typescript
interface ChordQuality {
  intervals: number[];
  symbol: string;
  name: string;
}

const chordQualities = {
  major: { intervals: [4, 3], symbol: "", name: "major" },
  minor: { intervals: [3, 4], symbol: "m", name: "minor" },
  diminished: { intervals: [3, 3], symbol: "dim", name: "diminished" },
  augmented: { intervals: [4, 4], symbol: "aug", name: "augmented" },
  major7: { intervals: [4, 3, 4], symbol: "maj7", name: "major 7th" },
  minor7: { intervals: [3, 4, 3], symbol: "m7", name: "minor 7th" },
  dominant7: { intervals: [4, 3, 3], symbol: "7", name: "dominant 7th" },
  halfDim7: { intervals: [3, 3, 4], symbol: "m7♭5", name: "half diminished 7th" },
  dim7: { intervals: [3, 3, 3], symbol: "dim7", name: "diminished 7th" }
};
```

#### Naming Rules
- **Bass note** = First note in current inversion
- **Slash notation** for inversions: "Chord/Bass"
- **Quality must reflect** actual intervals
- **Avoid incorrect enharmonic names**
- **Use proper symbols** (♭, ♯, ♮)

---

### 4.4 Guitar Visualizer Updates

#### Inversion-Aware Voicing
- **Bass string must reflect** inversion bass note
- **Maintain playable** fingering
- **Adjust voicing** for each inversion:
  - Root: Standard position
  - First: Bass on 3rd
  - Second: Bass on 5th
  - Third: Bass on 7th (if applicable)

#### Fallback Strategies
- If inversion not playable in position:
  - Move up neck (show position marker)
  - Use partial voicing
  - Indicate with capo suggestion
  - Show alternative tuning option

#### Visual Indicators
- Bass note emphasized (larger dot)
- Show inversion name below fretboard
- Arrow indicating bass string
- Optional: Show suggested fingering

---

### 4.5 Required Tests

#### Inversion Cycling Tests
- [ ] Inversion cycles forward correctly
- [ ] Inversion cycles backward correctly
- [ ] Wraps around at boundaries
- [ ] Reset to root on new chord selection
- [ ] Correct number of inversions for mode
- [ ] State persists during other changes
- [ ] Keyboard shortcuts work
- [ ] Touch gestures work (mobile)

#### Naming Tests
- [ ] Root position names correct
- [ ] Slash chord notation accurate
- [ ] Bass note correctly identified
- [ ] Chord quality preserved in name
- [ ] Enharmonic naming consistent
- [ ] Seventh chord names include quality
- [ ] Special symbols render correctly
- [ ] Diminished/augmented labeled correctly

#### Visualizer Update Tests
- [ ] Piano shows inverted positions
- [ ] Guitar bass note on correct string
- [ ] Note order matches inversion
- [ ] Visual feedback immediate
- [ ] No animation glitches
- [ ] Playback order matches visual

#### Integration Tests
- [ ] No mutation of original arrays
- [ ] No stale highlight states
- [ ] Memory efficient with rapid cycling
- [ ] Undo/redo compatibility (if applicable)
- [ ] State serialization correct

---

## SECTION 5 — Regression & Stability

### 5.1 Core Functionality Preservation

#### Must Maintain Working
- [ ] **Lock system** still prevents randomization
- [ ] **Randomizer** generates valid combinations
- [ ] **Drag-and-drop** between blocks functional
- [ ] **State persistence** across refreshes
- [ ] **Export/Import** includes new features
- [ ] **Preset system** compatible

### 5.2 UI/UX Stability

#### Layout Tests
- [ ] No layout breaking on any screen size
- [ ] Responsive design intact (mobile, tablet, desktop)
- [ ] No z-index conflicts
- [ ] No overflow issues
- [ ] Maintains accessibility standards
- [ ] Touch targets adequate on mobile

### 5.3 Performance Benchmarks

#### Metrics to Monitor
- [ ] Initial render time < 100ms
- [ ] Interaction response < 50ms
- [ ] Memory usage stable over 1 hour
- [ ] No memory leaks detected
- [ ] CPU usage < 10% idle
- [ ] Smooth 60fps animations

### 5.4 Compatibility Testing

#### Browser Support
- [ ] Chrome (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Edge (latest 2 versions)
- [ ] Mobile Safari (iOS 14+)
- [ ] Chrome Mobile (Android 10+)

#### Device Testing
- [ ] Desktop (Windows, Mac, Linux)
- [ ] Tablet (iPad, Android tablets)
- [ ] Mobile (iPhone, Android phones)
- [ ] Different screen resolutions
- [ ] Touch vs mouse input
- [ ] Keyboard navigation

### 5.5 Integration Points

#### With Other Blocks
- [ ] Varispeed integration maintained
- [ ] Notes block compatibility
- [ ] Metronome sync (if applicable)
- [ ] Arrangement tool connection
- [ ] No event conflicts
- [ ] Proper event bubbling

### 5.6 Error Handling

#### Graceful Degradation
- [ ] Missing audio context handled
- [ ] Browser compatibility warnings
- [ ] Network failures (if applicable)
- [ ] Invalid state recovery
- [ ] Corrupted storage handling
- [ ] Memory pressure response

### 5.7 Documentation Updates

#### Required Documentation
- [ ] Update component README
- [ ] Add inline code comments
- [ ] Update API documentation
- [ ] Create user guide
- [ ] Add troubleshooting section
- [ ] Update changelog

---

## Implementation Priority Order

### Phase 1 - Foundation (Week 1)
1. Seventh chord toggle UI and state
2. Basic chord construction logic
3. Edge case handling for scales

### Phase 2 - Audio (Week 1-2)
1. Play button UI
2. Audio engine integration
3. Playback logic and visual sync

### Phase 3 - Visualizers (Week 2-3)
1. Component architecture setup
2. Piano visualizer basic implementation
3. Guitar visualizer basic implementation

### Phase 4 - Inversions (Week 3-4)
1. Inversion state management
2. Dynamic naming system
3. Visualizer updates for inversions

### Phase 5 - Polish (Week 4)
1. Performance optimization
2. Comprehensive testing
3. Bug fixes and edge cases
4. Documentation

---

## Success Metrics

### Functional Completeness
- All features implemented and working
- No regression in existing features
- Edge cases handled gracefully

### Performance Targets
- Page load time < 2s
- Interaction latency < 50ms
- Memory usage < 50MB
- No memory leaks

### User Experience
- Intuitive UI with clear visual feedback
- Smooth animations and transitions
- Helpful error messages
- Accessible to screen readers

### Code Quality
- Test coverage > 80%
- No TypeScript errors
- ESLint compliance
- Well-documented code

---

## Risk Mitigation

### Technical Risks
- **Audio API compatibility**: Provide fallback or polyfill
- **Performance on low-end devices**: Progressive enhancement
- **Complex state management**: Consider state machine
- **Memory leaks in visualizers**: Careful cleanup

### UX Risks
- **Feature complexity**: Progressive disclosure
- **Learning curve**: Interactive tutorials
- **Mobile usability**: Touch-optimized design

### Timeline Risks
- **Scope creep**: Strict feature freeze after planning
- **Testing time**: Automated tests from start
- **Bug discovery**: Regular QA cycles

---

## Appendix: Technical Specifications

### Data Structures
```typescript
interface Note {
  pitch: string;        // e.g., "C", "F#"
  octave: number;       // e.g., 4
  frequency: number;    // Hz value
  midi: number;         // MIDI note number
}

interface Scale {
  root: Note;
  type: ScaleType;
  notes: Note[];
  intervals: number[];
}

interface Chord {
  root: Note;
  quality: ChordQuality;
  notes: Note[];
  inversion: number;
  bass: Note;
}

interface VisualizerState {
  activeNotes: Set<number>;  // MIDI numbers
  highlightColors: Map<number, string>;
  animationQueue: AnimationFrame[];
}
```

### Performance Optimizations
- Use React.memo for expensive components
- Virtual scrolling for large note ranges
- Web Workers for audio processing
- RequestAnimationFrame for animations
- Debounce rapid state changes

### Accessibility Requirements
- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader announcements
- High contrast mode support
- Reduced motion preferences

---

## Testing Checklist Summary

### Unit Tests (per component)
- [ ] State management
- [ ] Event handlers
- [ ] Calculations
- [ ] Edge cases

### Integration Tests
- [ ] Component interactions
- [ ] Data flow
- [ ] Event propagation
- [ ] State synchronization

### E2E Tests
- [ ] User workflows
- [ ] Multi-step operations
- [ ] Error scenarios
- [ ] Performance benchmarks

### Manual Tests
- [ ] Visual inspection
- [ ] Usability testing
- [ ] Accessibility audit
- [ ] Cross-browser check

---

*End of Implementation Plan*