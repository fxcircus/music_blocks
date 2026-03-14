import React, { useState, useEffect, useRef, useMemo, FC } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaDice } from 'react-icons/fa';
import { Card } from '../common/StyledComponents';
import { Icon } from '../../utils/IconHelper';

interface Scene {
  name: string;
  bars: number;
  energy: number;
}

interface Template {
  desc: string;
  vibe: string;
  scenes: Scene[];
  category?: string;
}

interface Category {
  label: string;
  templates: Record<string, Omit<Template, 'category'>>;
}

interface ArrangementToolProps {
  // Add any props if needed for state synchronization
}

const CATEGORIES: Category[] = [
  {
    label: "GENERAL",
    templates: {
      "Slow Burn": {
        desc: "Energy only goes up. Patient, layered build.",
        vibe: "Ambient, downtempo, Bonobo, chillwave",
        scenes: [
          { name: "Intro", bars: 8, energy: 1 },
          { name: "Foundation", bars: 8, energy: 1 },
          { name: "Add Layer", bars: 8, energy: 2 },
          { name: "Add Layer 2", bars: 8, energy: 2 },
          { name: "Full", bars: 16, energy: 3 },
          { name: "Brighten", bars: 8, energy: 3 },
          { name: "Peak", bars: 8, energy: 4 },
          { name: "Outro", bars: 8, energy: 1 },
        ],
      },
      "Two Peaks": {
        desc: "Classic dance arc. Build, release, build again harder.",
        vibe: "House, techno, EDM, dancefloor",
        scenes: [
          { name: "Intro", bars: 16, energy: 1 },
          { name: "Build", bars: 8, energy: 2 },
          { name: "Drop 1", bars: 16, energy: 4 },
          { name: "Breakdown", bars: 16, energy: 1 },
          { name: "Build 2", bars: 8, energy: 2 },
          { name: "Drop 2", bars: 16, energy: 4 },
          { name: "Outro", bars: 8, energy: 1 },
        ],
      },
      "Storyteller": {
        desc: "Verse does the work, chorus is the reward.",
        vibe: "Pop, R&B, singer-songwriter, vocal tracks",
        scenes: [
          { name: "Intro", bars: 4, energy: 1 },
          { name: "Verse 1", bars: 16, energy: 2 },
          { name: "Chorus", bars: 8, energy: 4 },
          { name: "Verse 2", bars: 16, energy: 2 },
          { name: "Chorus 2", bars: 8, energy: 4 },
          { name: "Bridge", bars: 8, energy: 3 },
          { name: "Final Chorus", bars: 16, energy: 4 },
          { name: "Outro", bars: 4, energy: 1 },
        ],
      },
      "Hook First": {
        desc: "Leads with the strongest idea. No patience.",
        vibe: "Trap, pop punk, short & punchy, TikTok-era",
        scenes: [
          { name: "Hook", bars: 8, energy: 4 },
          { name: "Verse 1", bars: 8, energy: 2 },
          { name: "Hook 2", bars: 8, energy: 4 },
          { name: "Verse 2", bars: 8, energy: 2 },
          { name: "Bridge", bars: 4, energy: 3 },
          { name: "Hook 3", bars: 8, energy: 4 },
          { name: "Outro", bars: 4, energy: 1 },
        ],
      },
      "Loop Rider": {
        desc: "Beat barely changes. Hypnotic. Arrangement is what sits on top.",
        vibe: "Hip hop, boom bap, lo-fi, beat tapes",
        scenes: [
          { name: "Intro", bars: 4, energy: 1 },
          { name: "Hook", bars: 8, energy: 3 },
          { name: "Verse 1", bars: 16, energy: 2 },
          { name: "Hook 2", bars: 8, energy: 3 },
          { name: "Verse 2", bars: 16, energy: 2 },
          { name: "Hook 3", bars: 8, energy: 3 },
          { name: "Outro", bars: 4, energy: 1 },
        ],
      },
      "Call & Response": {
        desc: "Alternates full and stripped. Contrast IS the arrangement.",
        vibe: "Funk, disco, UK garage, dance with breakdowns",
        scenes: [
          { name: "Intro", bars: 8, energy: 1 },
          { name: "Full", bars: 8, energy: 4 },
          { name: "Strip", bars: 8, energy: 2 },
          { name: "Full+", bars: 8, energy: 4 },
          { name: "Strip 2", bars: 8, energy: 2 },
          { name: "Full++", bars: 16, energy: 4 },
          { name: "Bridge", bars: 8, energy: 3 },
          { name: "Full+++", bars: 8, energy: 4 },
          { name: "Outro", bars: 8, energy: 1 },
        ],
      },
      "The Minimalist": {
        desc: "Two ideas alternate, then combine. That's the whole song.",
        vibe: "Minimal techno, Four Tet, ambient, instrumental",
        scenes: [
          { name: "A", bars: 16, energy: 2 },
          { name: "B", bars: 16, energy: 2 },
          { name: "A", bars: 16, energy: 2 },
          { name: "B", bars: 16, energy: 2 },
          { name: "A + B", bars: 16, energy: 4 },
          { name: "Outro", bars: 8, energy: 1 },
        ],
      },
      "The Epic": {
        desc: "Multiple movements. Not one peak — a journey.",
        vibe: "Post-rock, progressive, film score, Godspeed/Mogwai",
        scenes: [
          { name: "Intro", bars: 16, energy: 1 },
          { name: "Movement 1", bars: 32, energy: 2 },
          { name: "Transition", bars: 8, energy: 1 },
          { name: "Movement 2", bars: 32, energy: 3 },
          { name: "Climax", bars: 16, energy: 4 },
          { name: "Outro", bars: 16, energy: 1 },
        ],
      },
      "Peak & Dissolve": {
        desc: "Builds to center, then deconstructs beautifully.",
        vibe: "James Blake, Bon Iver, experimental R&B",
        scenes: [
          { name: "Intro", bars: 8, energy: 1 },
          { name: "Build", bars: 16, energy: 2 },
          { name: "Peak", bars: 16, energy: 4 },
          { name: "Deconstruct", bars: 16, energy: 3 },
          { name: "Ghost", bars: 8, energy: 1 },
          { name: "Outro", bars: 8, energy: 1 },
        ],
      },
      "The Fake Out": {
        desc: "Predictable first half so the beat switch hits harder.",
        vibe: "Tyler the Creator, Radiohead, Frank Ocean",
        scenes: [
          { name: "Intro", bars: 8, energy: 2 },
          { name: "A", bars: 16, energy: 2 },
          { name: "A repeat", bars: 16, energy: 2 },
          { name: "Break", bars: 4, energy: 1 },
          { name: "B — New Energy", bars: 16, energy: 4 },
          { name: "B+", bars: 16, energy: 4 },
          { name: "Outro", bars: 8, energy: 1 },
        ],
      },
    },
  },
  {
    label: "BEATLES",
    templates: {
      "AABA Middle Eight": {
        desc: "Pre-Beatles pop form they perfected. No chorus — the verse IS the hook, with a contrasting bridge (middle eight) for relief. Refrain line at end of each verse carries the title.",
        vibe: "She Loves You, I Want to Hold Your Hand, From Me to You, Yesterday",
        scenes: [
          { name: "Verse 1 + Refrain", bars: 8, energy: 2 },
          { name: "Verse 2 + Refrain", bars: 8, energy: 2 },
          { name: "Bridge (Middle 8)", bars: 8, energy: 3 },
          { name: "Verse 3 + Refrain", bars: 8, energy: 2 },
          { name: "Bridge 2", bars: 8, energy: 3 },
          { name: "Verse 4 + Refrain", bars: 8, energy: 2 },
          { name: "Tag Ending", bars: 4, energy: 2 },
        ],
      },
      "Compact & Dense": {
        desc: "Chorus in the first 20 seconds. Everything in under 3 minutes. No wasted bars. The streaming era before streaming existed — every section earns its place.",
        vibe: "A Hard Day's Night, Can't Buy Me Love, Twist and Shout",
        scenes: [
          { name: "Chorus", bars: 4, energy: 4 },
          { name: "Verse 1", bars: 8, energy: 2 },
          { name: "Chorus", bars: 4, energy: 4 },
          { name: "Verse 2", bars: 8, energy: 2 },
          { name: "Solo / Break", bars: 8, energy: 3 },
          { name: "Verse 3", bars: 8, energy: 2 },
          { name: "Chorus + Tag", bars: 8, energy: 4 },
        ],
      },
      "Through-Composed": {
        desc: "Nothing repeats. Distinct movements stitched together — each section a different song glued by mood and key. The song keeps moving forward, never looking back.",
        vibe: "A Day in the Life, Happiness is a Warm Gun, Golden Slumbers medley",
        scenes: [
          { name: "Part I — Gentle", bars: 16, energy: 2 },
          { name: "Orchestral Build", bars: 8, energy: 3 },
          { name: "Part II — New Feel", bars: 16, energy: 3 },
          { name: "Chaos / Crescendo", bars: 8, energy: 4 },
          { name: "Part III — Resolution", bars: 12, energy: 2 },
          { name: "Final Crescendo", bars: 4, energy: 4 },
        ],
      },
    },
  },
  {
    label: "PINK FLOYD",
    templates: {
      "Textural Expansion": {
        desc: "A tiny amount of harmonic material stretched over enormous duration through arrangement, texture, and studio craft. The chords barely change — everything else does. Solos are structural pillars, not decoration.",
        vibe: "Dogs, Echoes, Sheep, Any Colour You Like",
        scenes: [
          { name: "Atmosphere", bars: 16, energy: 1 },
          { name: "Theme Emerges", bars: 16, energy: 2 },
          { name: "Theme Develops", bars: 16, energy: 2 },
          { name: "Solo as Architecture", bars: 16, energy: 3 },
          { name: "Theme Expanded", bars: 16, energy: 3 },
          { name: "Interlude / Breakdown", bars: 16, energy: 1 },
          { name: "Theme Transformed", bars: 16, energy: 4 },
          { name: "Dissolve", bars: 16, energy: 1 },
        ],
      },
      "Sound → Song → Sound": {
        desc: "Song emerges out of pure atmosphere, lives briefly as a recognizable structure, then dissolves back into soundscape. The 'song' part is almost incidental — the journey in and out is the real composition.",
        vibe: "Shine On You Crazy Diamond, Atom Heart Mother, Welcome to the Machine",
        scenes: [
          { name: "Soundscape Intro", bars: 32, energy: 1 },
          { name: "Song Emerges", bars: 16, energy: 2 },
          { name: "Verse", bars: 16, energy: 2 },
          { name: "Chorus / Refrain", bars: 8, energy: 3 },
          { name: "Extended Solo", bars: 16, energy: 3 },
          { name: "Reprise", bars: 8, energy: 2 },
          { name: "Dissolve to Soundscape", bars: 24, energy: 1 },
        ],
      },
      "The Slow Boil": {
        desc: "Starts quiet and barely there. Tension accumulates through repetition and layering until the release is almost physical. The famous Pink Floyd build — patience rewarded with catharsis.",
        vibe: "Time, Comfortably Numb, Money, The Great Gig in the Sky",
        scenes: [
          { name: "Sound Effects / Intro", bars: 8, energy: 1 },
          { name: "Verse 1 — Sparse", bars: 16, energy: 2 },
          { name: "Verse 2 — Fills Added", bars: 16, energy: 2 },
          { name: "Pre-Solo Build", bars: 8, energy: 3 },
          { name: "Solo — Release", bars: 16, energy: 4 },
          { name: "Verse 3 — Full Band", bars: 16, energy: 3 },
          { name: "Final Solo — Soaring", bars: 16, energy: 4 },
          { name: "Outro / Fade", bars: 8, energy: 1 },
        ],
      },
    },
  },
  {
    label: "NEIL YOUNG",
    templates: {
      "The Long Jam": {
        desc: "Dead simple structure — verse, chorus, done. But between them, enormous extended guitar solos where the real emotional content lives. The vocal parts set up the jams. One chord can last 5 minutes and nobody cares.",
        vibe: "Down by the River, Cowgirl in the Sand, Like a Hurricane, Cortez the Killer",
        scenes: [
          { name: "Intro Riff", bars: 4, energy: 2 },
          { name: "Verse 1", bars: 8, energy: 2 },
          { name: "Chorus", bars: 4, energy: 3 },
          { name: "Extended Solo", bars: 24, energy: 4 },
          { name: "Verse 2", bars: 8, energy: 2 },
          { name: "Chorus", bars: 4, energy: 3 },
          { name: "Epic Solo — Let It Rip", bars: 32, energy: 4 },
          { name: "Verse 3", bars: 8, energy: 2 },
          { name: "Chorus → Fade", bars: 8, energy: 3 },
        ],
      },
      "Acoustic → Electric": {
        desc: "Starts fragile, acoustic, intimate — like a folk song. Then something breaks and the electric guitars arrive like a wall. Two halves of the same emotional truth. The transition is the moment.",
        vibe: "Hey Hey My My, Powderfinger, Rockin' in the Free World, Tonight's the Night",
        scenes: [
          { name: "Acoustic Intro", bars: 8, energy: 1 },
          { name: "Acoustic Verse 1", bars: 16, energy: 2 },
          { name: "Acoustic Chorus", bars: 8, energy: 2 },
          { name: "Acoustic Verse 2", bars: 16, energy: 2 },
          { name: "Silence / Transition", bars: 4, energy: 1 },
          { name: "Electric Explosion", bars: 8, energy: 4 },
          { name: "Electric Solo", bars: 16, energy: 4 },
          { name: "Electric Verse", bars: 8, energy: 3 },
          { name: "Electric Outro — Raw", bars: 8, energy: 4 },
        ],
      },
      "One-Take Rawness": {
        desc: "Feels like it was played once, straight through, and that take was the keeper. Minimal arrangement — just a band in a room. Mistakes stay in. Energy comes from commitment, not perfection.",
        vibe: "Cinnamon Girl, Ohio, My My Hey Hey, Sedan Delivery",
        scenes: [
          { name: "Count In / Riff", bars: 2, energy: 3 },
          { name: "Verse 1", bars: 8, energy: 3 },
          { name: "Chorus", bars: 4, energy: 4 },
          { name: "Verse 2", bars: 8, energy: 3 },
          { name: "Chorus", bars: 4, energy: 4 },
          { name: "Solo — One Note Fury", bars: 16, energy: 4 },
          { name: "Verse 3", bars: 8, energy: 3 },
          { name: "Chorus → End Cold", bars: 4, energy: 4 },
        ],
      },
    },
  },
  {
    label: "KING CRIMSON",
    templates: {
      "Ballad to Chaos": {
        desc: "Opens as a beautiful, restrained ballad. A repeating figure begins — innocent at first, then insistent, then obsessive. The song slowly devours itself. By the end it's unrecognizable from where it started.",
        vibe: "Starless, Epitaph, The Letters, Islands",
        scenes: [
          { name: "Ballad — Mellotron", bars: 16, energy: 1 },
          { name: "Vocal Section", bars: 16, energy: 2 },
          { name: "Solo — Lyrical", bars: 16, energy: 2 },
          { name: "Repeating Figure Begins", bars: 16, energy: 3 },
          { name: "Intensifying", bars: 16, energy: 3 },
          { name: "Breaking Point", bars: 8, energy: 4 },
          { name: "Explosion / Climax", bars: 16, energy: 4 },
          { name: "Sudden Stop", bars: 1, energy: 1 },
        ],
      },
      "Interlocking Machine": {
        desc: "Mathematically precise patterns that phase against each other. Feels mechanical yet alive. Patterns enter one by one, interlock, collide, and eventually achieve a terrifying unity.",
        vibe: "Discipline, Frame by Frame, Thela Hun Ginjeet, Elephant Talk",
        scenes: [
          { name: "Pattern A — Alone", bars: 8, energy: 2 },
          { name: "Pattern B Enters", bars: 8, energy: 2 },
          { name: "A + B Interlock", bars: 16, energy: 3 },
          { name: "Pattern C — Disrupts", bars: 8, energy: 3 },
          { name: "All Patterns", bars: 16, energy: 4 },
          { name: "Strip to B", bars: 8, energy: 2 },
          { name: "Rebuild", bars: 8, energy: 3 },
          { name: "Full Interlock + Solo", bars: 16, energy: 4 },
          { name: "Unravel", bars: 8, energy: 1 },
        ],
      },
      "Multi-Part Suite": {
        desc: "Distinct movements with dramatic contrasts — quiet/loud, melodic/dissonant, composed/improvised. Each section could be its own piece. Unified by recurring motifs that transform across movements.",
        vibe: "Larks' Tongues in Aspic, In the Court of the Crimson King, Lizard",
        scenes: [
          { name: "I — Percussion / Texture", bars: 16, energy: 2 },
          { name: "II — Melodic Theme", bars: 16, energy: 2 },
          { name: "III — Aggressive Riff", bars: 16, energy: 4 },
          { name: "IV — Quiet Improv", bars: 16, energy: 1 },
          { name: "V — Theme Returns", bars: 8, energy: 3 },
          { name: "VI — Full Ensemble", bars: 16, energy: 4 },
          { name: "VII — Coda", bars: 8, energy: 2 },
        ],
      },
    },
  },
  {
    label: "BRIAN ENO",
    templates: {
      "Generative Layers": {
        desc: "No structure in the traditional sense. Loops of different lengths phase against each other, creating ever-shifting combinations. Nothing repeats exactly. Density is the only arc — layers accumulate, then thin.",
        vibe: "Music for Airports 2/1, Discreet Music, Thursday Afternoon, Reflection",
        scenes: [
          { name: "Layer 1 — Alone", bars: 16, energy: 1 },
          { name: "Layer 2 Enters", bars: 16, energy: 1 },
          { name: "Layers Phase — New Combo", bars: 16, energy: 2 },
          { name: "Layer 3 — Peak Density", bars: 24, energy: 2 },
          { name: "Layer 1 Drops", bars: 16, energy: 2 },
          { name: "Layers Thin", bars: 16, energy: 1 },
          { name: "Near Silence", bars: 16, energy: 1 },
        ],
      },
      "Oblique Strategy": {
        desc: "Short, self-contained sections — each one a different texture or mood. Connected by feel, not by chord progression or melody. Like flipping through paintings in a gallery. Chance determines what comes next.",
        vibe: "Another Green World, Before and After Science, Taking Tiger Mountain",
        scenes: [
          { name: "Texture A — Warm", bars: 8, energy: 1 },
          { name: "Melodic Fragment", bars: 8, energy: 2 },
          { name: "Texture B — Metallic", bars: 8, energy: 2 },
          { name: "Fragment Develops", bars: 8, energy: 2 },
          { name: "Unexpected Element", bars: 8, energy: 3 },
          { name: "Texture C — Sparse", bars: 8, energy: 1 },
          { name: "Return to A — Changed", bars: 8, energy: 2 },
          { name: "Fade / Evaporate", bars: 8, energy: 1 },
        ],
      },
      "Treated Studio": {
        desc: "Start with raw recorded material, then process and layer it. The arrangement isn't about adding instruments — it's about treating, warping, and spatializing what you already have. The studio is the instrument.",
        vibe: "Here Come the Warm Jets, My Life in the Bush of Ghosts, Nerve Net",
        scenes: [
          { name: "Raw Material — Dry", bars: 8, energy: 2 },
          { name: "Treatment Begins", bars: 8, energy: 2 },
          { name: "Processed — New Identity", bars: 16, energy: 3 },
          { name: "Vocal / Found Sound", bars: 8, energy: 3 },
          { name: "Full Treatment", bars: 16, energy: 4 },
          { name: "Strip — Original Returns", bars: 8, energy: 2 },
          { name: "Hybrid — Raw + Processed", bars: 16, energy: 3 },
          { name: "Dissolve", bars: 8, energy: 1 },
        ],
      },
    },
  },
];

const ENERGY_COLORS: Record<number, { bg: string; fill: string; clip: string }> = {
  1: { bg: "#1E3A52", fill: "#2B5B84", clip: "#3A7BBF" },
  2: { bg: "#3D3818", fill: "#8B7E2A", clip: "#C4B236" },
  3: { bg: "#3D2510", fill: "#9B5E28", clip: "#E08A3A" },
  4: { bg: "#3D1515", fill: "#8B2E2E", clip: "#D14545" },
};

const CATEGORY_COLORS: Record<string, string> = {
  GENERAL: "#888",
  BEATLES: "#7B68EE",
  "PINK FLOYD": "#FF6B9D",
  "NEIL YOUNG": "#C8A84E",
  "KING CRIMSON": "#E04040",
  "BRIAN ENO": "#40B0A0",
};

// --- Section type detection & color mapping ---

type SectionType = 'intro' | 'verse' | 'chorus' | 'bridge' | 'solo' | 'build';

function getSectionType(name: string): SectionType {
  const n = name.toLowerCase();
  if (/chorus|hook|drop|peak|climax|explos|full[+\s]|full$|refrain|final\schorus/.test(n)) return 'chorus';
  if (/solo|improv/.test(n)) return 'solo';
  if (/bridge|break|interlude|strip|silence|unravel|thin/.test(n)) return 'bridge';
  if (/build|develop|expand|intensif|transform|treatment|processed|crescendo|chaos|aggressive|pattern|enter|rebuild|riff/.test(n)) return 'build';
  if (/intro|outro|fade|dissolve|coda|ghost|evaporate|near\ssilence|sound|opening|atmosphere|soundscape|count|tag|end\scold/.test(n)) return 'intro';
  return 'verse';
}

// Maps section type → theme color key (all CSS-variable driven, no hardcoded hex)
const SECTION_COLOR_KEYS: Record<SectionType, 'primary' | 'secondary' | 'error' | 'accent' | 'warning'> = {
  intro: 'secondary',
  verse: 'primary',
  chorus: 'error',
  bridge: 'accent',
  solo: 'accent',
  build: 'warning',
};

const ENERGY_LABELS: Record<number, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Peak',
};

const ENERGY_LABEL_COLOR_KEYS: Record<number, string> = {
  1: 'secondary',
  2: 'primary',
  3: 'warning',
  4: 'error',
};

interface LabelSet {
  full: string;   // For wide blocks: first meaningful word
  short: string;  // For narrow blocks: type initial + optional number (always ≥1 letter)
}

/**
 * Compute display labels for each scene.
 *   full  — first meaningful word from the name (for wide blocks)
 *   short — section-type initial + any explicit number, e.g. V1, C2, Br (for narrow blocks)
 * The short label always starts with a letter, never a bare number.
 */
function computeLabels(scenes: Scene[]): LabelSet[] {
  return scenes.map(s => {
    const name = s.name;
    const n = name.toLowerCase();

    // Extract any explicit number from the name
    const numMatch = name.match(/(\d+)/);
    const num = numMatch ? numMatch[1] : '';

    // Full label: first meaningful (non-numeric) word
    const cleaned = name
      .replace(/^(Part\s+)?(I{1,3}V?|V?I{0,3})\s*[—–\-:]\s*/i, '')
      .replace(/\s*[—–\-/]\s*.*$/, '')
      .trim();
    const words = cleaned.split(/[\s+,()]+/).filter(Boolean);
    const fullWord = words.find(w => !/^\d+$/.test(w)) || words[0] || 'X';

    // Short label: detect section type → letter code, append number if present
    let initial: string;
    if (/chorus|refrain/.test(n)) initial = 'C';
    else if (/verse/.test(n)) initial = 'V';
    else if (/intro/.test(n)) initial = 'I';
    else if (/outro/.test(n)) initial = 'O';
    else if (/bridge/.test(n)) initial = 'Br';
    else if (/solo/.test(n)) initial = 'S';
    else if (/hook/.test(n)) initial = 'H';
    else if (/drop/.test(n)) initial = 'D';
    else if (/build/.test(n)) initial = 'Bl';
    else if (/break/.test(n)) initial = 'Bk';
    else if (/peak|climax/.test(n)) initial = 'P';
    else initial = fullWord.charAt(0).toUpperCase();

    return { full: fullWord, short: num ? `${initial}${num}` : initial };
  });
}

// --- Styled Components ---

const ThemeAwareWrapper = styled.div`
  --text-primary: ${({ theme }) => theme.colors.text};
  --text-secondary: ${({ theme }) => theme.colors.textSecondary};
  --primary: ${({ theme }) => theme.colors.primary};
  --secondary: ${({ theme }) => theme.colors.secondary};
  --accent: ${({ theme }) => theme.colors.accent};
  --warning: ${({ theme }) => theme.colors.warning};
  --error: ${({ theme }) => theme.colors.error};
  --bg-card: ${({ theme }) => theme.colors.card};
  --bg-main: ${({ theme }) => theme.colors.background};
  --border: ${({ theme }) => theme.colors.border};
  --button-text: ${({ theme }) => theme.colors.buttonText};
  width: 100%;
  height: 100%;
`;

const ArrangementCard = styled(Card)`
  background: ${({ theme }) => theme.colors.card};
  padding: 0;
  overflow: visible;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const TemplateSelector = styled.div`
  background: ${({ theme }) => theme.colors.card};
  padding: ${({ theme }) => theme.spacing.md};
  position: relative;
  z-index: 10;
`;

const SelectorButton = styled.button<{ $isOpen?: boolean }>`
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  color: ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg} ${theme.spacing.sm} ${theme.spacing.md}`};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-family: inherit;
  cursor: pointer;
  min-width: 220px;
  text-align: left;
  font-weight: 600;
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm};
  position: relative;
  transition: all 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
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

const RandomButton = styled.button`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
  position: relative;

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

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: auto;
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  z-index: 9999;
  width: 400px;
  max-width: 90vw;
  height: 400px;
  max-height: 60vh;
  overflow-y: scroll;
  overflow-x: hidden;
  box-shadow: none;

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.card};
    border-radius: ${({ theme }) => theme.borderRadius.small};
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.textSecondary};
    border-radius: ${({ theme }) => theme.borderRadius.small};
    border: 2px solid ${({ theme }) => theme.colors.card};

    &:hover {
      background: ${({ theme }) => theme.colors.primary};
    }
  }
`;

const CategoryHeader = styled.div<{ $color?: string }>`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md} ${theme.spacing.xs}`};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 700;
  color: ${({ $color }) => $color || '#666'};
  letter-spacing: 1.5px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.card};
  position: sticky;
  top: 0;
  z-index: 1;
`;

const TemplateOption = styled.button<{ $isSelected?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md} ${theme.spacing.sm} 20px`};
  background: ${({ theme, $isSelected }) =>
    $isSelected ? `${theme.colors.primary}22` : 'transparent'};
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background 0.2s;

  &:hover {
    background: ${({ theme }) => `${theme.colors.primary}11`};
  }
`;

// --- Horizontal Bar Visualization ---

const VisualizationContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: ${({ theme }) => `${theme.spacing.lg} ${theme.spacing.md} ${theme.spacing.sm}`};
  height: 220px;
  min-height: 220px;
  max-height: 220px;
`;

const SectionTooltip = styled.div<{ $flipLeft?: boolean }>`
  display: none;
  position: absolute;
  bottom: calc(100% + 10px);
  ${({ $flipLeft }) => $flipLeft ? 'right: -8px;' : 'left: -8px;'}
  width: 170px;
  background: var(--bg-main);
  border: 1px solid var(--border);
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: 10px 12px;
  z-index: 100;
  pointer-events: none;
  box-shadow: ${({ theme }) => theme.shadows.medium};
`;

const SectionBlock = styled.div<{ $heightPct: number; $color: string; $alpha: number }>`
  width: 100%;
  height: ${({ $heightPct }) => $heightPct}%;
  position: relative;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  overflow: visible;
  display: flex;
  align-items: flex-end;
  justify-content: center;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: ${({ $color }) => $color};
    opacity: ${({ $alpha }) => $alpha};
    border-radius: inherit;
    transition: opacity ${({ theme }) => theme.transitions.fast};
  }

  @media (hover: hover) {
    &:hover::before {
      opacity: 1;
    }
    &:hover ${SectionTooltip} {
      display: block;
    }
  }
`;

const BarRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 3px;
  flex: 1;
  position: relative;
  border-bottom: 1px solid var(--border);
  padding-bottom: 1px;
`;

const BlockColumn = styled.div<{ $flex: number }>`
  flex: ${({ $flex }) => $flex};
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  height: 100%;
  justify-content: flex-end;
`;

const BlockLabel = styled.span`
  position: relative;
  z-index: 1;
  font-size: 10px;
  font-weight: 600;
  color: var(--button-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - 4px);
  line-height: 1;
  padding: 0 2px 4px;
`;

const BarCountRow = styled.div`
  display: flex;
  gap: 3px;
`;

const BarCount = styled.div<{ $flex: number }>`
  flex: ${({ $flex }) => $flex};
  font-size: 10px;
  color: var(--text-secondary);
  text-align: center;
  padding-top: 4px;
  line-height: 1;
  min-width: 0;
`;

// --- Helper functions ---

function getAllTemplates(): Record<string, Template> {
  const all: Record<string, Template> = {};
  CATEGORIES.forEach((cat) => {
    Object.entries(cat.templates).forEach(([name, tmpl]) => {
      all[name] = { ...tmpl, category: cat.label };
    });
  });
  return all;
}

const ALL_TEMPLATES = getAllTemplates();

// --- Component ---

const ArrangementTool: FC<ArrangementToolProps> = () => {
  const [selected, setSelected] = useState(() => {
    const saved = localStorage.getItem('tilesTemplate');
    return saved && ALL_TEMPLATES[saved] ? saved : 'Two Peaks';
  });
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const barRowRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Measure container width for label visibility
  useEffect(() => {
    const el = barRowRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const template = ALL_TEMPLATES[selected];
  const totalBars = template.scenes.reduce((a, s) => a + s.bars, 0);

  const labelSets = useMemo(() => computeLabels(template.scenes), [template.scenes]);

  const barsUpTo = useMemo(() => {
    const result: number[] = [];
    let cumulative = 0;
    template.scenes.forEach(s => {
      result.push(cumulative);
      cumulative += s.bars;
    });
    return result;
  }, [template.scenes]);

  const handleRandomTemplate = () => {
    const templateNames = Object.keys(ALL_TEMPLATES);
    const currentIndex = templateNames.indexOf(selected);
    const availableTemplates = templateNames.filter((_, index) => index !== currentIndex);
    const randomIndex = Math.floor(Math.random() * availableTemplates.length);
    const randomTemplate = availableTemplates[randomIndex];
    setSelected(randomTemplate);
    setIsOpen(false);
  };

  useEffect(() => {
    localStorage.setItem('tilesTemplate', selected);
  }, [selected]);

  // Re-read localStorage when URL state is applied (handles shared links)
  useEffect(() => {
    const handler = () => {
      const saved = localStorage.getItem('tilesTemplate');
      if (saved && ALL_TEMPLATES[saved] && saved !== selected) {
        setSelected(saved);
      }
    };
    window.addEventListener('urlStateApplied', handler);
    return () => window.removeEventListener('urlStateApplied', handler);
  }, [selected]);

  // Calculate available width minus gaps for label visibility check
  const totalGaps = (template.scenes.length - 1) * 3;
  const availableWidth = Math.max(0, containerWidth - totalGaps);

  return (
    <ThemeAwareWrapper>
      <ArrangementCard className="arrangement-card">
        <TemplateSelector>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <RandomButton
              onClick={handleRandomTemplate}
              title="Random template"
              style={{
                background: 'transparent',
                border: 'none'
              }}
            >
              <Icon icon={FaDice} size={20} />
            </RandomButton>
            <div ref={dropdownRef} style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
              <SelectorButton onClick={() => setIsOpen(!isOpen)} $isOpen={isOpen}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '3px' }}>
                  <span style={{
                    fontSize: '8px',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    background: CATEGORY_COLORS[template.category || ''] || '#888',
                    color: '#fff',
                    textTransform: 'uppercase'
                  }}>
                    {template.category || ''}
                  </span>
                  <span>{selected}</span>
                </div>
                <span style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '8px',
                  color: 'var(--text-secondary)'
                }}>
                  {isOpen ? '▲' : '▼'}
                </span>
              </SelectorButton>
              {isOpen && (
                <Dropdown>
                  {CATEGORIES.map((cat) => (
                    <div key={cat.label}>
                      <CategoryHeader $color={CATEGORY_COLORS[cat.label]}>
                        {cat.label}
                      </CategoryHeader>
                      {Object.entries(cat.templates).map(([name, tmpl]) => (
                        <TemplateOption
                          key={name}
                          onClick={() => {
                            setSelected(name);
                            setIsOpen(false);
                          }}
                          $isSelected={name === selected}
                        >
                          <div style={{
                            display: 'flex',
                            gap: '1px',
                            alignItems: 'flex-end',
                            height: '14px',
                            flexShrink: 0,
                            width: '30px'
                          }}>
                            {tmpl.scenes.map((s, i) => (
                              <div
                                key={i}
                                style={{
                                  flex: 1,
                                  height: `${(s.energy / 4) * 100}%`,
                                  background: ENERGY_COLORS[s.energy].clip,
                                  borderRadius: '1px',
                                  minHeight: '2px'
                                }}
                              />
                            ))}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '11px',
                              color: name === selected ? 'var(--primary)' : 'var(--text-primary)',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {name}
                            </div>
                            <div style={{
                              fontSize: '9px',
                              color: 'var(--text-secondary)',
                              marginTop: '2px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}>
                              {tmpl.desc}
                            </div>
                            <div style={{
                              fontSize: '9px',
                              color: 'var(--text-secondary)',
                              marginTop: '2px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              <span style={{ color: 'var(--primary)', opacity: 0.7 }}>Heard in </span>{tmpl.vibe}
                            </div>
                          </div>
                        </TemplateOption>
                      ))}
                    </div>
                  ))}
                </Dropdown>
              )}
            </div>
            <div style={{ display: 'flex', gap: '16px', flexShrink: 0, alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-secondary)', letterSpacing: '1px', marginBottom: '2px' }}>
                  SECTIONS
                </div>
                <div style={{ fontSize: '18px', color: 'var(--primary)', fontWeight: 700 }}>
                  {template.scenes.length}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-secondary)', letterSpacing: '1px', marginBottom: '2px' }}>
                  BARS
                </div>
                <div style={{ fontSize: '18px', color: 'var(--primary)', fontWeight: 700 }}>
                  {totalBars}
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'left', marginTop: '4px', minHeight: '48px' }}>
            <div style={{
              fontSize: '10px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
            }}>
              {template.desc}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '3px' }}>
              <span style={{ color: 'var(--primary)', opacity: 0.7 }}>Heard in </span>{template.vibe}
            </div>
          </div>
        </TemplateSelector>

        {/* Horizontal bar visualization */}
        <VisualizationContainer>
          <BarRow ref={barRowRef}>
            {template.scenes.map((scene, i) => {
              const sectionType = getSectionType(scene.name);
              const colorKey = SECTION_COLOR_KEYS[sectionType];
              const colorVar = `var(--${colorKey})`;
              const heightPct = scene.energy * 20; // 20%, 40%, 60%, 80%
              const alpha = 0.45 + (scene.energy / 4) * 0.5;

              const blockPixelWidth = availableWidth > 0
                ? (scene.bars / totalBars) * availableWidth
                : 0;

              // Tiered label: ≥60px full word, <60px short code (always ≥1 letter)
              const { full, short } = labelSets[i];
              const displayLabel = blockPixelWidth >= 60 ? full : short;

              // Flip tooltip for blocks in the right ~30% of the layout
              const isNearRight = (barsUpTo[i] + scene.bars) > totalBars * 0.7;

              const energyLabel = ENERGY_LABELS[scene.energy];
              const energyColorVar = `var(--${ENERGY_LABEL_COLOR_KEYS[scene.energy]})`;

              return (
                <BlockColumn key={i} $flex={scene.bars}>
                  <SectionBlock
                    $heightPct={heightPct}
                    $color={colorVar}
                    $alpha={alpha}
                  >
                    {displayLabel && <BlockLabel>{displayLabel}</BlockLabel>}
                    <SectionTooltip $flipLeft={isNearRight}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                        {scene.name}
                      </div>
                      <div style={{ height: '1px', background: 'var(--border)', margin: '6px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Bars</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 600 }}>{scene.bars}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Energy</span>
                        <span style={{ fontSize: '11px', color: energyColorVar, fontWeight: 600 }}>{energyLabel}</span>
                      </div>
                    </SectionTooltip>
                  </SectionBlock>
                </BlockColumn>
              );
            })}
          </BarRow>
          <BarCountRow>
            {template.scenes.map((scene, i) => (
              <BarCount key={i} $flex={scene.bars}>{scene.bars}</BarCount>
            ))}
          </BarCountRow>
        </VisualizationContainer>
      </ArrangementCard>
    </ThemeAwareWrapper>
  );
};

export default ArrangementTool;
