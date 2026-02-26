import { useState, useEffect } from "react";

const CATEGORIES = [
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
        desc: "Multiple movements. Not one peak \u2014 a journey.",
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
          { name: "B \u2014 New Energy", bars: 16, energy: 4 },
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
        desc: "Pre-Beatles pop form they perfected. No chorus \u2014 the verse IS the hook, with a contrasting bridge (middle eight) for relief. Refrain line at end of each verse carries the title.",
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
        desc: "Chorus in the first 20 seconds. Everything in under 3 minutes. No wasted bars. The streaming era before streaming existed \u2014 every section earns its place.",
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
        desc: "Nothing repeats. Distinct movements stitched together \u2014 each section a different song glued by mood and key. The song keeps moving forward, never looking back.",
        vibe: "A Day in the Life, Happiness is a Warm Gun, Golden Slumbers medley",
        scenes: [
          { name: "Part I \u2014 Gentle", bars: 16, energy: 2 },
          { name: "Orchestral Build", bars: 8, energy: 3 },
          { name: "Part II \u2014 New Feel", bars: 16, energy: 3 },
          { name: "Chaos / Crescendo", bars: 8, energy: 4 },
          { name: "Part III \u2014 Resolution", bars: 12, energy: 2 },
          { name: "Final Crescendo", bars: 4, energy: 4 },
        ],
      },
    },
  },
  {
    label: "PINK FLOYD",
    templates: {
      "Textural Expansion": {
        desc: "A tiny amount of harmonic material stretched over enormous duration through arrangement, texture, and studio craft. The chords barely change \u2014 everything else does. Solos are structural pillars, not decoration.",
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
      "Sound \u2192 Song \u2192 Sound": {
        desc: "Song emerges out of pure atmosphere, lives briefly as a recognizable structure, then dissolves back into soundscape. The 'song' part is almost incidental \u2014 the journey in and out is the real composition.",
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
        desc: "Starts quiet and barely there. Tension accumulates through repetition and layering until the release is almost physical. The famous Pink Floyd build \u2014 patience rewarded with catharsis.",
        vibe: "Time, Comfortably Numb, Money, The Great Gig in the Sky",
        scenes: [
          { name: "Sound Effects / Intro", bars: 8, energy: 1 },
          { name: "Verse 1 \u2014 Sparse", bars: 16, energy: 2 },
          { name: "Verse 2 \u2014 Fills Added", bars: 16, energy: 2 },
          { name: "Pre-Solo Build", bars: 8, energy: 3 },
          { name: "Solo \u2014 Release", bars: 16, energy: 4 },
          { name: "Verse 3 \u2014 Full Band", bars: 16, energy: 3 },
          { name: "Final Solo \u2014 Soaring", bars: 16, energy: 4 },
          { name: "Outro / Fade", bars: 8, energy: 1 },
        ],
      },
    },
  },
  {
    label: "NEIL YOUNG",
    templates: {
      "The Long Jam": {
        desc: "Dead simple structure \u2014 verse, chorus, done. But between them, enormous extended guitar solos where the real emotional content lives. The vocal parts set up the jams. One chord can last 5 minutes and nobody cares.",
        vibe: "Down by the River, Cowgirl in the Sand, Like a Hurricane, Cortez the Killer",
        scenes: [
          { name: "Intro Riff", bars: 4, energy: 2 },
          { name: "Verse 1", bars: 8, energy: 2 },
          { name: "Chorus", bars: 4, energy: 3 },
          { name: "Extended Solo", bars: 24, energy: 4 },
          { name: "Verse 2", bars: 8, energy: 2 },
          { name: "Chorus", bars: 4, energy: 3 },
          { name: "Epic Solo \u2014 Let It Rip", bars: 32, energy: 4 },
          { name: "Verse 3", bars: 8, energy: 2 },
          { name: "Chorus \u2192 Fade", bars: 8, energy: 3 },
        ],
      },
      "Acoustic \u2192 Electric": {
        desc: "Starts fragile, acoustic, intimate \u2014 like a folk song. Then something breaks and the electric guitars arrive like a wall. Two halves of the same emotional truth. The transition is the moment.",
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
          { name: "Electric Outro \u2014 Raw", bars: 8, energy: 4 },
        ],
      },
      "One-Take Rawness": {
        desc: "Feels like it was played once, straight through, and that take was the keeper. Minimal arrangement \u2014 just a band in a room. Mistakes stay in. Energy comes from commitment, not perfection.",
        vibe: "Cinnamon Girl, Ohio, My My Hey Hey, Sedan Delivery",
        scenes: [
          { name: "Count In / Riff", bars: 2, energy: 3 },
          { name: "Verse 1", bars: 8, energy: 3 },
          { name: "Chorus", bars: 4, energy: 4 },
          { name: "Verse 2", bars: 8, energy: 3 },
          { name: "Chorus", bars: 4, energy: 4 },
          { name: "Solo \u2014 One Note Fury", bars: 16, energy: 4 },
          { name: "Verse 3", bars: 8, energy: 3 },
          { name: "Chorus \u2192 End Cold", bars: 4, energy: 4 },
        ],
      },
    },
  },
  {
    label: "KING CRIMSON",
    templates: {
      "Ballad to Chaos": {
        desc: "Opens as a beautiful, restrained ballad. A repeating figure begins \u2014 innocent at first, then insistent, then obsessive. The song slowly devours itself. By the end it's unrecognizable from where it started.",
        vibe: "Starless, Epitaph, The Letters, Islands",
        scenes: [
          { name: "Ballad \u2014 Mellotron", bars: 16, energy: 1 },
          { name: "Vocal Section", bars: 16, energy: 2 },
          { name: "Solo \u2014 Lyrical", bars: 16, energy: 2 },
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
          { name: "Pattern A \u2014 Alone", bars: 8, energy: 2 },
          { name: "Pattern B Enters", bars: 8, energy: 2 },
          { name: "A + B Interlock", bars: 16, energy: 3 },
          { name: "Pattern C \u2014 Disrupts", bars: 8, energy: 3 },
          { name: "All Patterns", bars: 16, energy: 4 },
          { name: "Strip to B", bars: 8, energy: 2 },
          { name: "Rebuild", bars: 8, energy: 3 },
          { name: "Full Interlock + Solo", bars: 16, energy: 4 },
          { name: "Unravel", bars: 8, energy: 1 },
        ],
      },
      "Multi-Part Suite": {
        desc: "Distinct movements with dramatic contrasts \u2014 quiet/loud, melodic/dissonant, composed/improvised. Each section could be its own piece. Unified by recurring motifs that transform across movements.",
        vibe: "Larks' Tongues in Aspic, In the Court of the Crimson King, Lizard",
        scenes: [
          { name: "I \u2014 Percussion / Texture", bars: 16, energy: 2 },
          { name: "II \u2014 Melodic Theme", bars: 16, energy: 2 },
          { name: "III \u2014 Aggressive Riff", bars: 16, energy: 4 },
          { name: "IV \u2014 Quiet Improv", bars: 16, energy: 1 },
          { name: "V \u2014 Theme Returns", bars: 8, energy: 3 },
          { name: "VI \u2014 Full Ensemble", bars: 16, energy: 4 },
          { name: "VII \u2014 Coda", bars: 8, energy: 2 },
        ],
      },
    },
  },
  {
    label: "BRIAN ENO",
    templates: {
      "Generative Layers": {
        desc: "No structure in the traditional sense. Loops of different lengths phase against each other, creating ever-shifting combinations. Nothing repeats exactly. Density is the only arc \u2014 layers accumulate, then thin.",
        vibe: "Music for Airports 2/1, Discreet Music, Thursday Afternoon, Reflection",
        scenes: [
          { name: "Layer 1 \u2014 Alone", bars: 16, energy: 1 },
          { name: "Layer 2 Enters", bars: 16, energy: 1 },
          { name: "Layers Phase \u2014 New Combo", bars: 16, energy: 2 },
          { name: "Layer 3 \u2014 Peak Density", bars: 24, energy: 2 },
          { name: "Layer 1 Drops", bars: 16, energy: 2 },
          { name: "Layers Thin", bars: 16, energy: 1 },
          { name: "Near Silence", bars: 16, energy: 1 },
        ],
      },
      "Oblique Strategy": {
        desc: "Short, self-contained sections \u2014 each one a different texture or mood. Connected by feel, not by chord progression or melody. Like flipping through paintings in a gallery. Chance determines what comes next.",
        vibe: "Another Green World, Before and After Science, Taking Tiger Mountain",
        scenes: [
          { name: "Texture A \u2014 Warm", bars: 8, energy: 1 },
          { name: "Melodic Fragment", bars: 8, energy: 2 },
          { name: "Texture B \u2014 Metallic", bars: 8, energy: 2 },
          { name: "Fragment Develops", bars: 8, energy: 2 },
          { name: "Unexpected Element", bars: 8, energy: 3 },
          { name: "Texture C \u2014 Sparse", bars: 8, energy: 1 },
          { name: "Return to A \u2014 Changed", bars: 8, energy: 2 },
          { name: "Fade / Evaporate", bars: 8, energy: 1 },
        ],
      },
      "Treated Studio": {
        desc: "Start with raw recorded material, then process and layer it. The arrangement isn't about adding instruments \u2014 it's about treating, warping, and spatializing what you already have. The studio is the instrument.",
        vibe: "Here Come the Warm Jets, My Life in the Bush of Ghosts, Nerve Net",
        scenes: [
          { name: "Raw Material \u2014 Dry", bars: 8, energy: 2 },
          { name: "Treatment Begins", bars: 8, energy: 2 },
          { name: "Processed \u2014 New Identity", bars: 16, energy: 3 },
          { name: "Vocal / Found Sound", bars: 8, energy: 3 },
          { name: "Full Treatment", bars: 16, energy: 4 },
          { name: "Strip \u2014 Original Returns", bars: 8, energy: 2 },
          { name: "Hybrid \u2014 Raw + Processed", bars: 16, energy: 3 },
          { name: "Dissolve", bars: 8, energy: 1 },
        ],
      },
    },
  },
];

const ENERGY_COLORS = {
  1: { bg: "#1E3A52", fill: "#2B5B84", clip: "#3A7BBF" },
  2: { bg: "#3D3818", fill: "#8B7E2A", clip: "#C4B236" },
  3: { bg: "#3D2510", fill: "#9B5E28", clip: "#E08A3A" },
  4: { bg: "#3D1515", fill: "#8B2E2E", clip: "#D14545" },
};

const CATEGORY_COLORS = {
  GENERAL: "#888",
  BEATLES: "#7B68EE",
  "PINK FLOYD": "#FF6B9D",
  "NEIL YOUNG": "#C8A84E",
  "KING CRIMSON": "#E04040",
  "BRIAN ENO": "#40B0A0",
};

function getAllTemplates() {
  const all = {};
  CATEGORIES.forEach((cat) => {
    Object.entries(cat.templates).forEach(([name, tmpl]) => {
      all[name] = { ...tmpl, category: cat.label };
    });
  });
  return all;
}

const ALL_TEMPLATES = getAllTemplates();

export default function App() {
  const [selected, setSelected] = useState("Two Peaks");
  const [isOpen, setIsOpen] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const template = ALL_TEMPLATES[selected];
  const totalBars = template.scenes.reduce((a, s) => a + s.bars, 0);

  useEffect(() => {
    setAnimKey((k) => k + 1);
  }, [selected]);

  return (
    <div style={{ background: "#141414", minHeight: "100vh", fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace", color: "#B0B0B0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{ background: "#1E1E1E", borderBottom: "1px solid #2A2A2A", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, flexShrink: 0 }}>
        <span style={{ color: "#FF6A00", fontWeight: 700, fontSize: 14, letterSpacing: 1.5 }}>STRUCTURE GENERATOR</span>
        <span style={{ color: "#444", fontSize: 10 }}>v0.3</span>
      </div>

      {/* Template selector panel */}
      <div style={{ background: "#1E1E1E", borderBottom: "1px solid #333", flexShrink: 0 }}>
        <div style={{ padding: "14px 16px 16px", display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 9, color: "#666", marginBottom: 5, letterSpacing: 1 }}>TEMPLATE</div>
            <div style={{ position: "relative" }}>
              <button onClick={() => setIsOpen(!isOpen)} style={{ background: "#141414", border: "1px solid #444", borderRadius: 4, color: "#FF6A00", padding: "8px 32px 8px 12px", fontSize: 12, fontFamily: "inherit", cursor: "pointer", minWidth: 220, textAlign: "left", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: 1, background: CATEGORY_COLORS[template.category] || "#888", flexShrink: 0 }} />
                {selected}
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 8, color: "#666" }}>{isOpen ? "\u25B2" : "\u25BC"}</span>
              </button>
              {isOpen && (
                <div style={{ position: "absolute", top: "100%", left: 0, background: "#141414", border: "1px solid #444", borderRadius: 4, marginTop: 4, zIndex: 100, minWidth: 360, maxHeight: 420, overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.7)" }}>
                  {CATEGORIES.map((cat) => (
                    <div key={cat.label}>
                      <div style={{ padding: "8px 14px 4px", fontSize: 9, fontWeight: 700, color: CATEGORY_COLORS[cat.label] || "#666", letterSpacing: 1.5, borderTop: "1px solid #222", background: "#0D0D0D", position: "sticky", top: 0, zIndex: 1 }}>{cat.label}</div>
                      {Object.entries(cat.templates).map(([name, tmpl]) => (
                        <button key={name} onClick={() => { setSelected(name); setIsOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 14px 8px 20px", background: name === selected ? "#252525" : "transparent", border: "none", borderBottom: "1px solid #1A1A1A", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                          <div style={{ display: "flex", gap: 1, alignItems: "flex-end", height: 14, flexShrink: 0, width: 30 }}>
                            {tmpl.scenes.map((s, i) => (
                              <div key={i} style={{ flex: 1, height: `${(s.energy / 4) * 100}%`, background: ENERGY_COLORS[s.energy].clip, borderRadius: 1, minHeight: 2 }} />
                            ))}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 11, color: name === selected ? "#FF6A00" : "#CCC", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
                            <div style={{ fontSize: 9, color: "#4A4A4A", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tmpl.vibe}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: CATEGORY_COLORS[template.category] || "#888", letterSpacing: 1, padding: "2px 6px", border: `1px solid ${CATEGORY_COLORS[template.category] || "#888"}44`, borderRadius: 3 }}>{template.category}</span>
            </div>
            <div style={{ fontSize: 11, color: "#999", lineHeight: 1.6 }}>{template.desc}</div>
            <div style={{ fontSize: 10, color: "#555", marginTop: 4 }}>\u2192 {template.vibe}</div>
          </div>

          <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#666", letterSpacing: 1, marginBottom: 4 }}>SCENES</div>
              <div style={{ fontSize: 20, color: "#FF6A00", fontWeight: 700 }}>{template.scenes.length}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#666", letterSpacing: 1, marginBottom: 4 }}>BARS</div>
              <div style={{ fontSize: 20, color: "#FF6A00", fontWeight: 700 }}>{totalBars}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scene list */}
      <div style={{ flex: 1, overflow: "auto", padding: "8px 12px" }}>
        <div key={animKey} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {template.scenes.map((scene, si) => {
            const colors = ENERGY_COLORS[scene.energy];
            const energyPercent = (scene.energy / 4) * 100;
            return (
              <div key={si} style={{ position: "relative", borderRadius: 4, overflow: "hidden", background: "#1A1A1A", border: `1px solid ${colors.fill}44`, animation: `fadeSlideIn 0.3s ease both`, animationDelay: `${si * 0.04}s` }}>
                <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${energyPercent}%`, background: `linear-gradient(90deg, ${colors.bg} 0%, ${colors.fill}88 60%, ${colors.clip}22 100%)`, borderRight: `2px solid ${colors.clip}66`, animation: `fillIn 0.5s ease both`, animationDelay: `${si * 0.04 + 0.1}s` }} />
                <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", padding: "11px 14px", gap: 12 }}>
                  <span style={{ fontSize: 9, color: "#555", width: 16, textAlign: "right", flexShrink: 0 }}>{si + 1}</span>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: colors.clip, flexShrink: 0, boxShadow: `0 0 8px ${colors.clip}55` }} />
                  <span style={{ fontSize: 13, color: "#E0E0E0", fontWeight: 600, flex: 1 }}>{scene.name}</span>
                  <span style={{ fontSize: 10, color: "#666", flexShrink: 0 }}>{scene.bars} bars</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Energy arc */}
        <div style={{ padding: "20px 0 12px" }}>
          <div style={{ fontSize: 9, color: "#555", marginBottom: 8, letterSpacing: 1, paddingLeft: 2 }}>ENERGY ARC</div>
          <div style={{ background: "#1A1A1A", borderRadius: 4, padding: "12px 8px 8px", border: "1px solid #2A2A2A" }}>
            <div style={{ display: "flex", gap: 2, height: 40, alignItems: "flex-end" }}>
              {template.scenes.map((scene, i) => {
                const colors = ENERGY_COLORS[scene.energy];
                const widthPercent = (scene.bars / totalBars) * 100;
                const heightPercent = (scene.energy / 4) * 100;
                return (
                  <div key={i} style={{ width: `${widthPercent}%`, height: `${heightPercent}%`, background: `linear-gradient(to top, ${colors.bg}, ${colors.clip})`, borderRadius: "3px 3px 0 0", animation: `growUp 0.5s ease both`, animationDelay: `${i * 0.06}s` }} title={`${scene.name} \u2014 ${scene.bars} bars`} />
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 2, marginTop: 4 }}>
              {template.scenes.map((scene, i) => {
                const widthPercent = (scene.bars / totalBars) * 100;
                return (
                  <div key={i} style={{ width: `${widthPercent}%`, fontSize: 8, color: "#444", textAlign: "center", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{scene.bars >= 8 ? scene.name : ""}</div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fillIn { from { width: 0%; } }
        @keyframes growUp { from { transform: scaleY(0); transform-origin: bottom; } to { transform: scaleY(1); transform-origin: bottom; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #141414; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
      `}</style>
    </div>
  );
}
