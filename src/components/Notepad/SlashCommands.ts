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

// Helper: insert a heading then drop to a new empty paragraph below
function insertSection(editor: Editor, range: Range, title: string) {
  editor
    .chain()
    .focus()
    .command(({ tr, state }) => {
      // Delete the slash command text
      tr.delete(range.from, range.to);

      // Resolve position in the updated document
      const $pos = tr.doc.resolve(range.from);
      const start = $pos.before($pos.depth);
      const end = $pos.after($pos.depth);

      // Create heading + empty paragraph
      const heading = state.schema.nodes.heading.create(
        { level: 1 },
        state.schema.text(title),
      );
      const paragraph = state.schema.nodes.paragraph.create();

      // Replace the current block with heading + paragraph
      tr.replaceWith(start, end, [heading, paragraph]);

      // Place cursor in the empty paragraph
      tr.setSelection(TextSelection.create(tr.doc, start + heading.nodeSize + 1));

      return true;
    })
    .run();
}

export const SLASH_COMMAND_ITEMS: SlashCommandItem[] = [
  // ─── Preset Sections (templates) ──────────────────────────────
  {
    title: 'Lyrics',
    description: 'Insert a Lyrics section',
    icon: '🎤',
    command: (editor, range) => insertSection(editor, range, 'Lyrics'),
  },
  {
    title: 'Chord Progression',
    description: 'Insert a Chord Progression section',
    icon: '🎹',
    command: (editor, range) => insertSection(editor, range, 'Chord Progression'),
  },
  {
    title: 'Pedal Settings',
    description: 'Insert a Pedal Settings section',
    icon: '🎛',
    command: (editor, range) => insertSection(editor, range, 'Pedal Settings'),
  },
  {
    title: 'Mix Notes',
    description: 'Insert a Mix Notes section',
    icon: '🎚',
    command: (editor, range) => insertSection(editor, range, 'Mix Notes'),
  },
  {
    title: 'Song Structure',
    description: 'Insert a Song Structure section',
    icon: '🏗',
    command: (editor, range) => insertSection(editor, range, 'Song Structure'),
  },
  {
    title: 'Session Goals',
    description: 'Insert a Session Goals checklist',
    icon: '🎯',
    command: (editor, range) => insertSection(editor, range, 'Session Goals'),
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
