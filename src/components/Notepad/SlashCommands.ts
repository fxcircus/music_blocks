import { Extension } from '@tiptap/core';
import { PluginKey, TextSelection } from '@tiptap/pm/state';
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion';
import { Editor, Range } from '@tiptap/core';

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: string;
  shortcut?: string;
  command: (editor: Editor, range: Range) => void;
}

// ─── ProseMirror Node Helpers ────────────────────────────────────────
// Short helpers to build nodes from the editor schema

function h(s: any, level: number, text: string) {
  return s.nodes.heading.create({ level }, s.text(text));
}

function p(s: any, ...content: any[]) {
  if (content.length === 0) return s.nodes.paragraph.create();
  return s.nodes.paragraph.create({}, content);
}

function bld(s: any, text: string) {
  return s.text(text, [s.marks.bold.create()]);
}

function txt(s: any, str: string) {
  return s.text(str);
}

function ul(s: any, items: (string | any[])[]) {
  return s.nodes.bulletList.create({},
    items.map((item) =>
      s.nodes.listItem.create({},
        s.nodes.paragraph.create({},
          typeof item === 'string' ? s.text(item) : item,
        ),
      ),
    ),
  );
}

function ol(s: any, items: (string | any[])[]) {
  return s.nodes.orderedList.create({},
    items.map((item) =>
      s.nodes.listItem.create({},
        s.nodes.paragraph.create({},
          typeof item === 'string' ? s.text(item) : item,
        ),
      ),
    ),
  );
}

function tasks(s: any, items: string[]) {
  return s.nodes.taskList.create({},
    items.map((item) =>
      s.nodes.taskItem.create({ checked: false },
        s.nodes.paragraph.create({}, s.text(item)),
      ),
    ),
  );
}

function code(s: any, text: string) {
  return s.nodes.codeBlock.create({}, s.text(text));
}

function hr(s: any) {
  return s.nodes.horizontalRule.create();
}

function tableHeader(s: any, text: string) {
  return s.nodes.tableHeader.create({},
    s.nodes.paragraph.create({}, text ? s.text(text) : undefined),
  );
}

function tableCell(s: any, text: string) {
  return s.nodes.tableCell.create({},
    s.nodes.paragraph.create({}, text ? s.text(text) : undefined),
  );
}

function tableRow(s: any, cells: any[]) {
  return s.nodes.tableRow.create({}, cells);
}

// ─── Template Builders ───────────────────────────────────────────────

function buildLyricsTemplate(s: any) {
  return [
    h(s, 1, 'Lyrics'),
    h(s, 2, 'Verse 1'),
    p(s),
    h(s, 2, 'Chorus'),
    p(s),
    h(s, 2, 'Verse 2'),
    p(s),
    h(s, 2, 'Bridge'),
    p(s),
  ];
}

function buildChordProgressionTemplate(s: any) {
  return [
    h(s, 1, 'Chord Progression'),
    p(s, bld(s, 'Key: ')),
    hr(s),
    h(s, 2, 'Verse'),
    code(s, '| _ | _ | _ | _ |'),
    h(s, 2, 'Chorus'),
    code(s, '| _ | _ | _ | _ |'),
    h(s, 2, 'Bridge'),
    code(s, '| _ | _ | _ | _ |'),
    p(s),
  ];
}

function buildPedalSettingsTemplate(s: any) {
  return [
    h(s, 1, 'Pedal Settings'),
    p(s, bld(s, 'Signal chain'), txt(s, ' (input → output):')),
    hr(s),
    ol(s, [
      'Tuner',
      'Compressor — Threshold: _ | Ratio: _ | Attack: _',
      'Overdrive — Drive: _ | Tone: _ | Level: _',
      'Modulation — Type: _ | Rate: _ | Depth: _',
      'Delay — Time: _ | Feedback: _ | Mix: _',
      'Reverb — Type: _ | Decay: _ | Mix: _',
    ]),
    p(s),
  ];
}

function buildMixNotesTemplate(s: any) {
  return [
    h(s, 1, 'Mix Notes'),
    h(s, 2, 'Drums'),
    ul(s, ['Kick:', 'Snare:', 'Overheads:']),
    h(s, 2, 'Bass'),
    ul(s, ['EQ:', 'Compression:']),
    h(s, 2, 'Guitars'),
    ul(s, ['EQ:', 'Effects:']),
    h(s, 2, 'Vocals'),
    ul(s, ['EQ:', 'Compression:', 'Effects:']),
    h(s, 2, 'Mix Bus'),
    ul(s, ['Compression:', 'EQ:', 'Limiting:']),
    p(s),
  ];
}

function buildSongStructureTemplate(s: any) {
  return [
    h(s, 1, 'Song Structure'),
    p(s, bld(s, 'Key: '), txt(s, '_  '), bld(s, 'Tempo: '), txt(s, '_ BPM')),
    hr(s),
    ul(s, [
      'Intro (4 bars) — low energy',
      'Verse (8 bars) — building',
      'Chorus (8 bars) — high energy',
      'Verse (8 bars) — pull back',
      'Chorus (8 bars) — high energy',
      'Bridge (4 bars) — breakdown',
      'Chorus (8 bars) — peak',
      'Outro (4 bars) — fade out',
    ]),
    p(s),
  ];
}

function buildSessionGoalsTemplate(s: any) {
  return [
    h(s, 1, 'Session Goals'),
    tasks(s, [
      'Warm up / sound check',
      'Record takes',
      'Review and select best takes',
      'Edit and arrange',
      'Bounce stems / export',
    ]),
    p(s),
  ];
}

function buildRecordingProgressTemplate(s: any) {
  const sections = ['Intro', 'Verse', 'Chorus', 'Bridge', 'Outro'];
  const instruments = ['Drums', 'Bass', 'Guitars', 'Vocals', 'Synths / Keys'];

  // A table cell containing a single checkbox
  function checkboxCell() {
    return s.nodes.tableCell.create({},
      s.nodes.taskList.create({},
        s.nodes.taskItem.create({ checked: false },
          s.nodes.paragraph.create(),
        ),
      ),
    );
  }

  // Header row: empty corner cell + section names
  const headerRow = tableRow(s, [
    tableHeader(s, ''),
    ...sections.map(sec => tableHeader(s, sec)),
  ]);

  // One row per instrument: name + checkbox cells
  const bodyRows = instruments.map(inst =>
    tableRow(s, [
      tableCell(s, inst),
      ...sections.map(() => checkboxCell()),
    ]),
  );

  const table = s.nodes.table.create({}, [headerRow, ...bodyRows]);

  return [
    h(s, 1, 'Recording Progress'),
    table,
    p(s),
  ];
}

// ─── Generic Template Inserter ───────────────────────────────────────

function insertTemplate(editor: Editor, range: Range, buildContent: (schema: any) => any[]) {
  editor
    .chain()
    .focus()
    .command(({ tr, state }) => {
      tr.delete(range.from, range.to);

      const $pos = tr.doc.resolve(range.from);
      const start = $pos.before($pos.depth);
      const end = $pos.after($pos.depth);

      const nodes = buildContent(state.schema);
      tr.replaceWith(start, end, nodes);

      // Position cursor in the last node (empty paragraph)
      const totalSize = nodes.reduce((sum: number, n: any) => sum + n.nodeSize, 0);
      tr.setSelection(TextSelection.create(tr.doc, start + totalSize - 1));

      return true;
    })
    .run();
}

// ─── Slash Command Items ─────────────────────────────────────────────

export const SLASH_COMMAND_ITEMS: SlashCommandItem[] = [
  // ─── Preset Sections (templates) ──────────────────────────────
  {
    title: 'Lyrics',
    description: 'Verse / Chorus / Bridge structure',
    icon: '🎤',
    command: (editor, range) => insertTemplate(editor, range, buildLyricsTemplate),
  },
  {
    title: 'Recording Progress',
    description: 'Track what\'s recorded per instrument & section',
    icon: '🎬',
    command: (editor, range) => insertTemplate(editor, range, buildRecordingProgressTemplate),
  },
  {
    title: 'Chord Progression',
    description: 'Chord charts per section with key reference',
    icon: '🎹',
    command: (editor, range) => insertTemplate(editor, range, buildChordProgressionTemplate),
  },
  {
    title: 'Pedal Settings',
    description: 'Signal chain with settings per pedal',
    icon: '🎛',
    command: (editor, range) => insertTemplate(editor, range, buildPedalSettingsTemplate),
  },
  {
    title: 'Mix Notes',
    description: 'Track-by-track EQ, compression & effects',
    icon: '🎚',
    command: (editor, range) => insertTemplate(editor, range, buildMixNotesTemplate),
  },
  {
    title: 'Song Structure',
    description: 'Sections with bar counts and energy levels',
    icon: '🏗',
    command: (editor, range) => insertTemplate(editor, range, buildSongStructureTemplate),
  },
  {
    title: 'Session Goals',
    description: 'Checklist for your session workflow',
    icon: '🎯',
    command: (editor, range) => insertTemplate(editor, range, buildSessionGoalsTemplate),
  },
  // ─── Formatting Blocks ────────────────────────────────────────
  {
    title: 'Text',
    description: 'Plain paragraph',
    icon: '¶',
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: 'H1',
    shortcut: '#',
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium heading',
    icon: 'H2',
    shortcut: '##',
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
    },
  },
  {
    title: 'Bullet List',
    description: 'Unordered list',
    icon: '•',
    shortcut: '-',
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: 'Numbered List',
    description: 'Ordered list',
    icon: '1.',
    shortcut: '1.',
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: 'Task List',
    description: 'Checklist with checkboxes',
    icon: '☑',
    shortcut: '[]',
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: 'Quote',
    description: 'Blockquote',
    icon: '"',
    shortcut: '>',
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: 'Code Block',
    description: 'Code or chord chart',
    icon: '<>',
    shortcut: '```',
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: 'Divider',
    description: 'Horizontal rule',
    icon: '—',
    shortcut: '---',
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
];

export const SlashCommandsPluginKey = new PluginKey('slashCommands');

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        pluginKey: SlashCommandsPluginKey,
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: SlashCommandItem }) => {
          props.command(editor, range);
        },
        items: ({ query }: { query: string }) => {
          return SLASH_COMMAND_ITEMS.filter(item =>
            item.title.toLowerCase().includes(query.toLowerCase())
          );
        },
      } as Partial<SuggestionOptions<SlashCommandItem>>,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
