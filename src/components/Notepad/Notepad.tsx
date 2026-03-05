import React, { useState, useCallback, useEffect } from 'react';
import styled, { useTheme } from 'styled-components';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { FaCopy } from 'react-icons/fa';
import { Icon } from '../../utils/IconHelper';
import { Card } from '../common/StyledComponents';
import TipsModal from '../common/TipsModal';
import { SlashCommands } from './SlashCommands';
import { createSlashCommandRender } from './slashCommandRender';

interface NotesProps {
  notes: string;
  setNotes: (notes: string) => void;
  showTips?: boolean;
  setShowTips?: (show: boolean) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────

function migrateContent(content: string): string {
  if (!content) return '';
  if (content.trim().startsWith('<')) return content;
  // Convert plain text lines to HTML paragraphs
  return content
    .split('\n')
    .map((line) => (line.trim() ? `<p>${line}</p>` : '<p></p>'))
    .join('');
}

// ─── Styled Components ────────────────────────────────────────────

const NotesCard = styled(Card)`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  flex: 1;
  text-align: left;
  align-items: stretch;

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing.sm};
  }
`;

const CopyBtn = styled.button<{ $success?: boolean }>`
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 3px 8px;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background: ${({ theme }) => theme.colors.card};
  color: ${({ $success, theme }) =>
    $success ? theme.colors.secondary : theme.colors.textSecondary};
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => `${theme.colors.primary}11`};
  }
`;

const EditorWrapper = styled.div`
  position: relative;
  flex: 1;
  min-height: 200px;
  max-height: 500px;
  background-color: ${({ theme }) => theme.colors.inputBackground};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  overflow-y: auto;
  transition: border-color ${({ theme }) => theme.transitions.fast};


  &:focus-within {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => `${theme.colors.primary}33`};
  }

  /* ProseMirror editor styles */
  .ProseMirror {
    padding: ${({ theme }) => theme.spacing.md};
    min-height: 180px;
    outline: none;
    color: ${({ theme }) => theme.colors.text};
    font-size: ${({ theme }) => theme.fontSizes.md};
    line-height: 1.7;

    > * + * {
      margin-top: 0.4em;
    }

    /* Placeholder */
    p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      float: left;
      color: ${({ theme }) => theme.colors.textSecondary};
      opacity: 0.4;
      pointer-events: none;
      height: 0;
    }

    /* Headings */
    h1, h2, h3 {
      color: ${({ theme }) => theme.colors.primary};
      font-weight: 600;
      line-height: 1.3;
    }
    h1 { font-size: 1.5em; margin-top: 0.8em; }
    h2 { font-size: 1.3em; margin-top: 0.7em; }
    h3 { font-size: 1.15em; margin-top: 0.6em; }
    h1:first-child, h2:first-child, h3:first-child { margin-top: 0; }

    /* Bold & Italic */
    strong { color: ${({ theme }) => theme.colors.primary}; font-weight: 700; }
    em { color: ${({ theme }) => theme.colors.textSecondary}; }

    /* Lists */
    ul, ol {
      padding-left: 1.4em;
    }
    ul { list-style: disc; }
    ol { list-style: decimal; }
    li {
      list-style: inherit;
      margin-bottom: 0.15em;
      margin-right: 0;
      padding: 0;
    }
    li p { margin: 0; }

    /* Task lists */
    ul[data-type="taskList"] {
      list-style: none;
      padding-left: 0;

      li {
        display: flex;
        align-items: flex-start;
        gap: 8px;

        > label {
          flex-shrink: 0;
          margin-top: 3px;

          input[type="checkbox"] {
            cursor: pointer;
            accent-color: ${({ theme }) => theme.colors.primary};
            width: 15px;
            height: 15px;
          }
        }

        > div {
          flex: 1;
        }
      }

      li[data-checked="true"] > div {
        text-decoration: line-through;
        opacity: 0.5;
      }
    }

    /* Blockquote */
    blockquote {
      margin: 0.5em 0;
      padding: 0.4em 0 0.4em 1em;
      border-left: 3px solid ${({ theme }) => theme.colors.primary};
      color: ${({ theme }) => theme.colors.textSecondary};

      p { margin: 0; }
    }

    /* Code inline */
    code {
      background: ${({ theme }) => `${theme.colors.primary}11`};
      border: 1px solid ${({ theme }) => theme.colors.border};
      border-radius: 3px;
      padding: 1px 5px;
      font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 0.85em;
      color: ${({ theme }) => theme.colors.secondary};
    }

    /* Code block */
    pre {
      background: ${({ theme }) => theme.colors.background};
      border: 1px solid ${({ theme }) => theme.colors.border};
      border-radius: ${({ theme }) => theme.borderRadius.small};
      padding: ${({ theme }) => theme.spacing.sm};
      margin: 0.5em 0;
      overflow-x: auto;

      code {
        background: none;
        border: none;
        padding: 0;
        font-size: 0.85em;
        color: ${({ theme }) => theme.colors.text};
      }
    }

    /* Horizontal rule */
    hr {
      border: none;
      border-top: 1px solid ${({ theme }) => theme.colors.border};
      margin: 1em 0;
    }

    /* Strikethrough */
    s { color: ${({ theme }) => theme.colors.textSecondary}; opacity: 0.5; }

    /* Table */
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 0.5em 0;
      overflow: hidden;
    }

    th, td {
      border: 1px solid ${({ theme }) => theme.colors.border};
      padding: 4px 8px;
      min-width: 40px;
      vertical-align: middle;
      text-align: center;
      font-size: 0.85em;
    }

    th {
      background: ${({ theme }) => `${theme.colors.primary}18`};
      color: ${({ theme }) => theme.colors.primary};
      font-weight: 600;
      font-size: 0.8em;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    td:first-child, th:first-child {
      text-align: left;
      font-weight: 600;
      white-space: nowrap;
    }

    tr:hover td {
      background: ${({ theme }) => `${theme.colors.primary}08`};
    }

    /* Checkbox inside table cells — compact, centered */
    td ul[data-type="taskList"] {
      padding: 0;
      margin: 0;
      display: flex;
      justify-content: center;

      li {
        margin: 0;
        padding: 0;
        gap: 0;

        > label {
          margin: 0;
        }

        > div {
          display: none; /* hide empty text area next to checkbox */
        }
      }
    }
  }

  @media (max-width: 768px) {
    min-height: 150px;

    .ProseMirror {
      padding: ${({ theme }) => theme.spacing.sm};
      min-height: 130px;
      font-size: ${({ theme }) => theme.fontSizes.sm};
    }
  }
`;

// ─── Component ────────────────────────────────────────────────────

export default function Notes({ notes, setNotes, showTips: showTipsExternal, setShowTips: setShowTipsExternal }: NotesProps) {
  const [copied, setCopied] = useState(false);
  const [showTipsInternal, setShowTipsInternal] = useState(false);
  const showTips = showTipsExternal !== undefined ? showTipsExternal : showTipsInternal;
  const setShowTips = setShowTipsExternal || setShowTipsInternal;
  const theme = useTheme();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: 'Start typing, or press / for commands...',
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      SlashCommands.configure({
        suggestion: {
          render: createSlashCommandRender(theme),
        },
      }),
    ],
    content: migrateContent(notes),
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setNotes(html);
      localStorage.setItem('tilesNotes', html);
    },
  });

  // Sync external notes prop changes (e.g., from URL sharing)
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    const incoming = migrateContent(notes);
    // Only update if the content is genuinely different (avoid cursor reset)
    if (incoming && incoming !== currentHtml && notes !== currentHtml) {
      editor.commands.setContent(incoming);
    }
  }, [notes, editor]);

  // Load from localStorage if notes prop is empty
  useEffect(() => {
    if (!editor || notes) return;
    const saved = localStorage.getItem('tilesNotes');
    if (saved) {
      editor.commands.setContent(migrateContent(saved));
      setNotes(saved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  const handleCopy = useCallback(async () => {
    if (!editor) return;
    const html = editor.getHTML();
    const text = editor.getText();
    try {
      // Write both HTML and plain text so rich editors (Notion, Google Docs)
      // get formatted content while plain text fields get a fallback
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      });
      await navigator.clipboard.write([clipboardItem]);
    } catch {
      // Fallback for browsers that don't support ClipboardItem
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [editor]);

  return (
    <NotesCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <EditorWrapper>
        <CopyBtn
          $success={copied}
          onClick={handleCopy}
          title="Copy to clipboard"
        >
          {copied ? 'Copied to clipboard!' : <Icon icon={FaCopy} size={13} />}
        </CopyBtn>
        <EditorContent editor={editor} />
      </EditorWrapper>

      <TipsModal
        isOpen={showTips}
        onClose={() => setShowTips(false)}
        title="Notes - Editor Guide"
        content={
          <>
            <p>
              Use this space to jot down anything related to your project — lyrics, chord ideas,
              pedal settings, mix notes, session goals, or any creative thoughts you want to keep track of.
            </p>

            <h3>Slash Commands</h3>
            <p>
              Type <code>/</code> anywhere to open the command menu. Choose from headings,
              lists, checklists, blockquotes, code blocks, and dividers.
              Filter by typing after the slash — e.g., <code>/head</code> to find headings.
            </p>

            <h3>Auto-Formatting</h3>
            <p>These shortcuts convert as you type:</p>
            <ul>
              <li><code># </code> <code>## </code> <code>### </code> — Headings</li>
              <li><code>- </code> or <code>* </code> — Bullet list</li>
              <li><code>1. </code> — Numbered list</li>
              <li><code>[] </code> — Task list (checkbox)</li>
              <li><code>&gt; </code> — Blockquote</li>
              <li><code>``` </code> — Code block</li>
              <li><code>---</code> — Divider</li>
              <li><code>**text**</code> — <strong>Bold</strong></li>
              <li><code>*text*</code> — <em>Italic</em></li>
              <li><code>`text`</code> — <code>Inline code</code></li>
              <li><code>~~text~~</code> — Strikethrough</li>
            </ul>

            <h3>Keyboard Shortcuts</h3>
            <ul>
              <li><code>Ctrl/Cmd + B</code> — Bold</li>
              <li><code>Ctrl/Cmd + I</code> — Italic</li>
              <li><code>Ctrl/Cmd + Z</code> — Undo</li>
              <li><code>Ctrl/Cmd + Shift + Z</code> — Redo</li>
            </ul>

            <h3>Tips for Musicians</h3>
            <ul>
              <li>Use <strong>headings</strong> to organize song sections — Verse, Chorus, Bridge</li>
              <li>Use <strong>checklists</strong> to track practice goals and session tasks</li>
              <li>Use <strong>code blocks</strong> for chord charts, tab notation, or fixed-width layouts</li>
              <li>Use <strong>blockquotes</strong> for lyrics you're referencing or reworking</li>
              <li>Use <strong>bullet lists</strong> to brainstorm ideas, chord options, or arrangement notes</li>
            </ul>
          </>
        }
      />
    </NotesCard>
  );
}
